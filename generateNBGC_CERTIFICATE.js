#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var argv = require('yargs')
    .usage('Usage: $0 -f [.json file]')
    .demand(['f'])
    .argv;

try {
	fs.accessSync(argv.f, fs.R_OK);
} catch (e) {
	console.error(argv.f + ' not found or unreadable', e);
	process.exit(1);
}

var data = require('./' + argv.f);
data = 'NBGC_CERTIFICATE=' + JSON.stringify(data);

var basename = path.basename(argv.f, '.json');
fs.writeFileSync('NBGC_CERTIFICATE.txt', data, 'utf8');



