#!/usr/bin/env node

// Polyfill Babel prior to anything else
require("babel-polyfill");

var path = require('path');
var fs = require('fs');

var ini = require('ini');

function help(binaryName) {
    console.log('Usage: ' + binaryName + '\n' +
        '\t-h or --help or help: displays this message.\n' +
        '\t-c $path or --config $path: path to the configuration file.'
    );
    process.exit(0);
}

function readConfigFromFile(path) {
    var content = null;
    try {
        content = fs.readFileSync(path, { encoding: 'utf8' });
    } catch (e) {
        console.error('Error when trying to read the configuration file (does the file at this path exist?)', e.toString(), '\n\n', e.stack);
        process.exit(-1);
    }

    var config = null;
    try {
        config = ini.parse(content);
    } catch (e) {
        console.error('INI formatting error when reading the configuration file:', e.toString(), '\n\n', e.stack);
        process.exit(-1);
    }

    return config;
}

// First two args are [node, binaryname]
var numActualArgs = Math.max(process.argv.length - 2, 0);
function actualArg(n) { return process.argv[2 + n]; }

var config = null;
if (numActualArgs >= 1) {
    var binaryName = actualArg(-1);
    var arg = actualArg(0);
    if (['help', '-h', '--help'].includes(arg)) {
        help(binaryName);
    } else if (['-c', '--config'].includes(arg)) {
        if (numActualArgs < 2) {
            console.error('Missing config file path.')
            help(binaryName);
            process.exit(-1);
        }
        var configFilePath = actualArg(1);
        config = readConfigFromFile(configFilePath);
    } else {
        console.error('Unknown command:', arg);
        help(binaryName);
        process.exit(-1);
    }
}

// First, define process.kresus.
var root = path.join(path.dirname(fs.realpathSync(__filename)), '..', 'build');
var standalone = true;
require(path.join(root, 'server', 'apply-config.js'))(standalone, config);

// Then only, import the server.
var server = require(path.join(root, 'server'));

var mainDir = process.kresus.dataDir;
if (!fs.existsSync(mainDir)) {
    fs.mkdirSync(mainDir);
}

process.chdir(mainDir);

var defaultDbPath = path.join(mainDir, 'db');

var opts = {
    root: root,
    port: process.kresus.port,
    dbName: defaultDbPath
};

server.start(opts);
