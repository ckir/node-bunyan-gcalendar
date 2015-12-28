#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var argv = require('yargs')
    .usage('Usage: $0 --pass=[password] --email=[xxx@developer.gserviceaccount.com] --certificate=[.json file] --calendar=[xxx@group.calendar.google.com]')
    .demand(['pass', 'email', 'certificate', 'calendar'])
    .argv;

if (argv.pass.length < 16) {
	console.error('Password too short. Must be at least 16 characters');
	process.exit(1);	
}

var encryptor = require('simple-encryptor')(argv.pass);

try {
	fs.accessSync(argv.certificate, fs.R_OK);
} catch (e) {
	console.error(argv.certificate + ' not found or unreadable', e);
	process.exit(1);
}

var nbgc = {};
nbgc['email'] = argv.email;
nbgc['certificate'] = require('./' + argv.certificate);
nbgc['calendar'] = argv.calendar;


var encrypted = encryptor.encrypt(nbgc);
fs.writeFileSync('NBGC.aes', encrypted, 'utf8');
console.log('NBGC.aes created. You can now upload it to a storage of your choise');
