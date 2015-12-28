'use strict';
if (!global.Promise) {
    global.Promise = require('bluebird');
}

var path = require('path');
var fs = require('fs');

var Logger = require('./index.js');

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
new Logger(bunyanoptions, process.env.NBGC_AES, process.env.NBGC_KEY, level).then(function logOk(l){
	log = l;
	log.info('Logging started');
	log.fatal('Hi Calendar');
}, function logNotOk(err){
	console.error('Logging start failed: ', err);
});