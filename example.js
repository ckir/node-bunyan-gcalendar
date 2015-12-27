'use strict';
if (!global.Promise) {
    global.Promise = require('bluebird');
}

var path = require('path');
var fs = require('fs');

var Logger = require('./index.js');

try {
	var certificate = JSON.parse(process.env.NBGC_CERTIFICATE);
} catch (e) {
	console.error('Invalid json data in NBGC_CERTIFICATE environment variable', e);
	process.exit(1);
}
var certificate_file = path.resolve(__dirname + '/googleapis.json');
fs.writeFileSync(__dirname + '/googleapis.json', JSON.stringify(certificate, null, 3), 'utf8');

var email = process.env.NBGC_EMAIL;
var calendar = process.env.NBGC_CALENDAR;
var level = 'fatal';

if (module.parent) {
	var appName = path.basename(module.parent.filename, '.js');
} else {
	var appName = path.basename(__filename, '.js');
}

var bunyanoptions = {
    name: appName,
    streams: [{
        level: 'debug',
        stream: process.stdout
    }, {
        level: 'info',
        path: path.resolve(appName + '.log'),
    }]
};

var log;
new Logger(bunyanoptions, email, certificate_file, calendar, level).then(function logOk(l){
	log = l;
	log.info('Logging started');
	log.fatal('Calendar test');
}, function logNotOk(err){
	console.error('Logging start failed: ', err);
});