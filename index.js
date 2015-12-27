'use strict';
if (!global.Promise) {
    global.Promise = require('bluebird');
}

var bunyan = require('bunyan');
var moment = require('moment');
var google = require('googleapis');
var Calendar = google.calendar('v3');

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

var bunyanlog = function(boptions, g_email, g_certificate, g_calendar, g_level) {

    bunyanoptions = boptions;
    google_email = g_email;
    google_certificate = g_certificate;
    google_calendar = g_calendar;
    google_level = g_level;

    var self = this;

    return new Promise(function(resolve, reject) {

        new logToCalendar(google_calendar).then(function calendarOk(stream) {

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
console.log("hello", google_certificate);                    
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

module.exports = bunyanlog;