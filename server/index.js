import path from 'path';

import cozydb from 'cozydb';

import express from 'express';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import methodOverride from 'method-override';
import morgan from 'morgan';

// Could have been set by bin/kresus.js;
process.kresus = process.kresus || {};
process.kresus.standalone = process.kresus.standalone || false;

process.kresus.urlPrefix = path.posix.resolve('/', process.env.KRESUS_URL_PREFIX || '');

function makeUrlPrefixRegExp(urlPrefix) {
    return new RegExp(`^${urlPrefix}/?`);
}

let start = (options = {}) => {
    options.name = 'Kresus';
    options.port = process.env.PORT || 9876;
    options.host = process.env.HOST || '127.0.0.1';

    // Configure CozyDB
    cozydb.configure(options);

    // Spawn the Express app.
    const app = express();

    // Middlewares.

    // Middleware for removing the url prefix, if it's set.
    if (process.kresus.urlPrefix !== '/') {
        let rootRegexp = makeUrlPrefixRegExp(process.kresus.urlPrefix);
        app.use((req, res, next) => {
            req.url = req.url.replace(rootRegexp, '/');
            return next();
        });
    }

    // Uninteresting middlewares.
    const logConf = '[:date[iso]] :method :url - :status (:res[content-length] b / ' +
                    ':response-time ms)';
    app.use(morgan(logConf));

    app.use(bodyParser.json({
        limit: '100mb'
    }));

    app.use(bodyParser.urlencoded({
        extended: true,
        limit: '10mb'
    }));

    app.use(methodOverride());

    app.use(express.static(`${__dirname}/../client`, {
        maxAge: 86400000
    }));

    // Routes
    const routes = require('./controllers/routes');
    for (let reqpath of Object.keys(routes)) {
        let descriptor = routes[reqpath];
        for (let verb of Object.keys(descriptor)) {
            let controller = descriptor[verb];
            if (verb === 'param') {
                app.param(reqpath, controller);
            } else {
                app[verb](`/${reqpath}`, controller);
            }
        }
    }

    // It matters that error handling is specified after all the other routes.
    app.use(errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    // If we try to import 'init', this has to be done at the global scope
    // level. In this case, we will import init and its transitive closure of
    // imports before cozydb is initialized. As a matter of fact, default
    // parameters of cozydb will be taken into account (so no standalone mode).
    // So the 'init' import has to happen after cozydb has been configured.
    const server = app.listen(options.port, options.host, () => {
        require('./init')();
    });

    // Raise the timeout limit, since some banking modules can be quite
    // long at fetching new operations. Time is in milliseconds.
    server.timeout = 5 * 60 * 1000;
};

if (typeof module.parent === 'undefined' || !module.parent)
    start();

module.exports = {
    start,
    makeUrlPrefixRegExp
};
