import * as cozydb from 'cozydb';

import {
    assert,
    makeLogger,
    promisify,
    promisifyModel,
    KError,
    isEmailEnabled
} from '../helpers';

import {
    testInstall,
    getVersion as getWeboobVersion
} from '../lib/sources/weboob';

import DefaultSettings from '../shared/default-settings';

let log = makeLogger('models/config');

// A simple key/value configuration pair.
let Config = cozydb.getModel('kresusconfig', {
    name: String,
    value: String
});

Config = promisifyModel(Config);

let request = promisify(::Config.request);

// Returns a pair {name, value} or null if not found.
Config.byName = async function byName(name) {
    if (typeof name !== 'string') {
        log.warn('Config.byName misuse: name must be a string');
    }

    let founds = await request('byName', { key: name });
    if (founds && founds.length)
        return founds[0];

    return null;
};

// Returns a pair {name, value} or the default value if not found.
async function findOrCreateByName(name, defaultValue) {
    let found = await request('byName', { key: name });
    if (!found || !found.length) {
        let pair = {
            name,
            value: defaultValue
        };
        pair = await Config.create(pair);
        return pair;
    }
    return found[0];
}
Config.findOrCreateByName = findOrCreateByName;

// Returns a pair {name, value} or the preset default value if not found.
async function findOrCreateDefault(name) {
    if (!DefaultSettings.has(name)) {
        throw new KError(`Setting ${name} has no default value!`);
    }

    let defaultValue = DefaultSettings.get(name);
    let result = await findOrCreateByName(name, defaultValue);
    return result;
}
Config.findOrCreateDefault = findOrCreateDefault;

// Returns a boolean value for a given key, or the preset default.
async function findOrCreateDefaultBooleanValue(name) {
    let pair = await findOrCreateDefault(name);
    return pair.value === 'true';
}
Config.findOrCreateDefaultBooleanValue = findOrCreateDefaultBooleanValue;

let getCozyLocale = promisify(::cozydb.api.getCozyLocale);

Config.getLocale = async function() {
    let locale;
    if (process.kresus.standalone)
        locale = (await Config.findOrCreateDefault('locale')).value;
    else
        locale = await getCozyLocale();
    return locale;
};

let oldAll = ::Config.all;

// A list of all the settings that are implied at runtime and should not be
// saved into the database.
Config.ghostSettings = new Set([
    'weboob-installed',
    'weboob-version',
    'standalone-mode',
    'url-prefix',
    'emails-enabled'
]);

// Returns all the config name/value pairs, except for the ghost ones that are
// implied at runtime.
Config.allWithoutGhost = async function() {
    const values = await oldAll();

    let nameSet = new Set(values.map(v => v.name));
    for (let ghostName of Config.ghostSettings.keys()) {
        assert(!nameSet.has(ghostName), `${ghostName} shouldn't be saved into the database.`);
    }

    // Add a pair for the locale.
    if (!nameSet.has('locale')) {
        values.push({
            name: 'locale',
            value: await Config.getLocale()
        });
    }

    return values;
};

// Returns all the config name/value pairs, including those which are generated
// at runtime.
Config.all = async function() {
    let values = await Config.allWithoutGhost();

    // Add a pair to indicate weboob install status.
    values.push({
        name: 'weboob-installed',
        value: 'true'//(await testInstall()).toString()
    });

    // Add a pair for Weboob's version.
    values.push({
        name: 'weboob-version',
        value: '1.3'//('await getWeboobVersion(')).toString()
    });

    // Indicate whether Kresus is running in standalone mode or within cozy.
    values.push({
        name: 'standalone-mode',
        value: String(process.kresus.standalone)
    });

    // Indicates at which path Kresus is served.
    values.push({
        name: 'url-prefix',
        value: String(process.kresus.urlPrefix)
    });

    // Have emails been enabled by the administrator?
    values.push({
        name: 'emails-enabled',
        value: String(isEmailEnabled())
    });

    return values;
};

module.exports = Config;
