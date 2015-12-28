'use strict';
if (!global.Promise) {
    global.Promise = require('bluebird');
}
var path = require('path');
var fs = require('fs');
var bunyan = require('bunyan');
var moment = require('moment');
var google = require('googleapis');
var Calendar = google.calendar('v3');

var nbgc_aes, nbgc_key;
var bunyanoptions, google_email, google_certificate, google_calendar, google_level;

var logToCalendar = function(calendarId) {

    var self = this;
    this.calendarId = calendarId;

    return new Promise(function(resolve, reject) {

        new GoogleCalendar().then(function gotCalendar(cal) {
            self.GoogleCalendar = cal;
            resolve(self);
        }, function noCalendar(err) {
            reject(err);
        });

    });
}

logToCalendar.prototype.write = function(rec) {

    var self = this;

    if (typeof(rec) !== 'object') {
        console.error('error: raw stream got a non-object record: %j', rec)
    } else {
        try {
            self.GoogleCalendar.eventsInsert(self.calendarId, rec.name + ': ' + rec.msg, null).then(function(resp) {}, function(err) {
                console.error("ERROR", err);
            });
        } catch (err) {
            console.error('Can\'t send log message to calendar ', err);
        }
    }
}

var bunyanlog = function(boptions, nbgcaes, nbgckey, nbgclevel) {

    bunyanoptions = boptions;
    nbgc_aes = nbgcaes;
    nbgc_key = nbgckey;
    google_level = nbgclevel;

    var self = this;

    return new Promise(function(resolve, reject) {

        getConfig(nbgc_aes, nbgc_key).then(function config_ok(config) {
 
            google_email = config['email'];
            // Recreate certificate file
            var certificate_file = path.resolve(__dirname + '/googleapis.json');            
            fs.writeFileSync(certificate_file, JSON.stringify(config['certificate'], null, 3), 'utf8');           
            google_certificate = certificate_file;
            google_calendar = config['calendar'];            
            return;

        }, function config_failed(err) {
            reject(err);
        }).then(function createGoogleCalendar(){
            return new logToCalendar(google_calendar);
        }).then(function calendarOk(stream) {

            self.calendarstream = stream;

            if (bunyanoptions.hasOwnProperty('streams') && Array.isArray(bunyanoptions['streams'])) {
                bunyanoptions['streams'].push({
                    type: 'raw',
                    level: google_level,
                    stream: self.calendarstream
                });
            } else {
                bunyanoptions['streams'] = [];
                bunyanoptions['streams'].push({
                    type: 'raw',
                    level: google_level,
                    stream: self.calendarstream
                });
            }

            var log = bunyan.createLogger(bunyanoptions);
            resolve(log);

        }, function canendarNotOk(err) {
            reject(err);
        });

    });
}

var GoogleCalendar = function() {

    var self = this;

    this.ServiceAccount = null;

    return new Promise(function(resolve, reject) {

        ServiceAccount().then(function(authClient) {
            self.ServiceAccount = authClient;
            resolve(self);
        }, function(err) {
            self.ServiceAccount = null;
            reject(err);
        }).catch(function(e) {
            self.ServiceAccount = null;
            reject(e);
        });
    });

}


GoogleCalendar.prototype.eventsInsert = function(calendarId, summary, description) {

    var self = this;

    return new Promise(function(resolve, reject) {
        if (!self.ServiceAccount) {
            reject('Invalid Service Account');
        }

        /**
         * calendar.events.insert
         *
         * @desc Creates an event.
         *
         * @alias calendar.events.insert
         * @memberOf! calendar(v3)
         *
         * @param  {object} params - Parameters for request
         * @param  {string} params.calendarId - Calendar identifier.
         * @param  {integer=} params.maxAttendees - The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.
         * @param  {boolean=} params.sendNotifications - Whether to send notifications about the creation of the new event. Optional. The default is False.
         * @param  {object} params.resource - Request body data
         * @param  {callback} callback - The callback that handles the response.
         * @return {object} Request object
         */
        var Requestbody = {
            start: {},
            end: {},
            reminders: {
                useDefault: true
            }
        };
        Requestbody.start.dateTime = moment.utc().toISOString();
        Requestbody.end.dateTime = moment.utc().add(1, 'minutes').toISOString();
        Requestbody.summary = summary;
        Requestbody.description = description;

        Calendar.events.insert({
            auth: self.ServiceAccount,
            calendarId: calendarId,
            sendNotifications: true,
            resource: Requestbody
        }, function(err, resp) {
            if (err) {
                reject(err);
            } else {
                resolve(resp);
            }

        });

    });

}

function ServiceAccount() {

    var self = this;
    return new Promise(function(resolve, reject) {

        /**
         * The JWT authorization is ideal for performing server-to-server
         * communication without asking for user consent.
         *
         * See the defaultauth.js sample for an alternate way of fetching compute credentials.
         */
        try {
            /**
             * JWT service account credentials.
             *
             * Retrieve access token using gtoken.
             *
             * @param {string=} email service account email address.
             * @param {string=} keyFile path to private key file.
             * @param {string=} key value of key
             * @param {(string|array)=} scopes list of requested scopes or a single scope.
             * @param {string=} subject impersonated account's email address.
             * @constructor
             */
            var authClient = new google.auth.JWT(
                google_email,
                google_certificate,
                null,
                // Scopes can be specified either as an array or as a single, space-delimited string
                ['https://www.googleapis.com/auth/calendar']
            );

            authClient.authorize(function(err, tokens) {
                if (err) {
                    reject(err);
                } else {
                    resolve(authClient);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

function getConfig(url, key) {

    return new Promise(function(resolve, reject) {
        var http = require('http');
        http.get(url, function(res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                try {;
                    var encryptor = require('simple-encryptor')(key);
                    var decrypted = encryptor.decrypt(body);                    
                    resolve(decrypted);
                } catch (e) {
                    reject(e.message);
                }
            });

        }).on('error', function(e) {
            reject(e.message);
        });
    });
}

module.exports = bunyanlog;