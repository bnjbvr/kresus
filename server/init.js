import { makeLogger, setupTranslator, setupMoment } from './helpers';

import * as Migrations from './models/migrations';
import * as Settings from './models/config';

import Poller from './lib/poller';

let log = makeLogger('init');

// See comment in index.js.
module.exports = async function(app, server, callback) {
    try {
        // Localize Kresus
        let locale = await Settings.getLocale();
        setupTranslator(locale);
        setupMoment(locale);

        // Do data migrations first
        log.info('Applying data migrations...');
        await Migrations.run();
        log.info('Done running data migrations.');

        // Start bank polling
        log.info('Starting bank accounts polling et al...');
        await Poller.runAtStartup();

        log.info("Server is ready, let's start the show!");

    } catch (err) {
        log.error(`Error at initialization:
Message: ${err.message}
${err.stack}`);
    }

    if (callback)
        callback(app, server);
};
