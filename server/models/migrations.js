import Access from './access';
import Account from './account';
import Alert from './alert';
import Bank from './bank';
import Config from './config';
import Operation from './operation';
import Category from './category';
import Type from './operationtype';

import { makeLogger, UNKNOWN_OPERATION_TYPE } from '../helpers';

let log = makeLogger('models/migrations');

// For a given access, retrieves the custom fields and gives them to the
// changeFn, which must return a new version of the custom fields (deleted
// fields won't be kept in database). After which they're saved (it's not
// changeFn's responsability to call save/updateAttributes).
async function updateCustomFields(access, changeFn) {
    let originalCustomFields = JSON.parse(access.customFields || '[]');

    // "deep copy", lol
    let newCustomFields = JSON.parse(access.customFields || '[]');
    newCustomFields = changeFn(newCustomFields);

    let pairToString = pair => `${pair.name}:${pair.value}`;
    let buildSig = fields => fields.map(pairToString).join('/');

    let needsUpdate = false;
    if (originalCustomFields.length !== newCustomFields.length) {
        // If one has more fields than the other, update.
        needsUpdate = true;
    } else {
        // If the name:value/name2:value2 strings are different, update.
        let originalSignature = buildSig(originalCustomFields);
        let newSignature = buildSig(newCustomFields);
        needsUpdate = originalSignature !== newSignature;
    }

    if (needsUpdate) {
        log.debug(`updating custom fields for ${access.id}`);
        await access.updateAttributes({
            customFields: JSON.stringify(newCustomFields)
        });
    }
}

function reduceOperationsDate(oldest, operation) {
    return Math.min(oldest, +new Date(operation.dateImport));
}

/**
 * This is an array of all the migrations to apply on the database, in order to
 * automatically keep database schema in sync with Kresus code.
 *
 * _Note_: As only the necessary migrations are run at each startup, you should
 * NEVER update a given migration, but instead add a new migration to reflect
 * the changes you want to apply on the db. Updating an existing migration
 * might not update the database as expected.
 */
let migrations = [

    async function m0() {
        log.info('Removing weboob-log and weboob-installed from the db...');
        let weboobLog = await Config.byName('weboob-log');
        if (weboobLog) {
            log.info('\tDestroying Config[weboob-log].');
            await weboobLog.destroy();
        }

        let weboobInstalled = await Config.byName('weboob-installed');
        if (weboobInstalled) {
            log.info('\tDestroying Config[weboob-installed].');
            await weboobInstalled.destroy();
        }
    },

    async function m1(cache) {
        log.info('Checking that operations with categories are consistent...');

        cache.operations = cache.operations || await Operation.all();
        cache.categories = cache.categories || await Category.all();

        let categorySet = new Set;
        for (let c of cache.categories) {
            categorySet.add(c.id);
        }

        let catNum = 0;
        for (let op of cache.operations) {
            let needsSave = false;

            if (typeof op.categoryId !== 'undefined' && !categorySet.has(op.categoryId)) {
                needsSave = true;
                delete op.categoryId;
                catNum += 1;
            }

            if (needsSave) {
                await op.save();
            }
        }

        if (catNum)
            log.info(`\t${catNum} operations had an inconsistent category.`);
    },

    async function m2(cache) {
        log.info('Replacing NONE_CATEGORY_ID by undefined...');

        cache.operations = cache.operations || await Operation.all();

        let num = 0;
        for (let o of cache.operations) {
            if (typeof o.categoryId !== 'undefined' && o.categoryId.toString() === '-1') {
                delete o.categoryId;
                await o.save();
                num += 1;
            }
        }

        if (num)
            log.info(`\t${num} operations had -1 as categoryId.`);
    },

    async function m3(cache) {
        log.info('Migrating websites to the customFields format...');

        cache.accesses = cache.accesses || await Access.all();

        let num = 0;

        let updateFields = website => customFields => {
            if (customFields.filter(field => field.name === 'website').length)
                return customFields;

            customFields.push({
                name: 'website',
                value: website
            });

            return customFields;
        };

        for (let a of cache.accesses) {
            if (typeof a.website === 'undefined' || !a.website.length)
                continue;

            let website = a.website;
            delete a.website;

            await updateCustomFields(a, updateFields(website));

            await a.save();
            num += 1;
        }

        if (num)
            log.info(`\t${num} accesses updated to the customFields format.`);
    },

    async function m4(cache) {
        log.info('Migrating HelloBank users to BNP and BNP users to the new website format.');

        cache.accesses = cache.accesses || await Access.all();

        let updateFieldsBnp = customFields => {
            if (customFields.filter(field => field.name === 'website').length)
                return customFields;

            customFields.push({
                name: 'website',
                value: 'pp'
            });

            log.info('\tBNP access updated to the new website format.');
            return customFields;
        };

        let updateFieldsHelloBank = customFields => {
            customFields.push({
                name: 'website',
                value: 'hbank'
            });
            return customFields;
        };

        for (let a of cache.accesses) {

            if (a.bank === 'bnporc') {
                await updateCustomFields(a, updateFieldsBnp);
                continue;
            }

            if (a.bank === 'hellobank') {
                // Update access
                await updateCustomFields(a, updateFieldsHelloBank);

                // Update accounts
                let accounts = await Account.byBank({ uuid: 'hellobank' });
                for (let acc of accounts) {
                    await acc.updateAttributes({ bank: 'bnporc' });
                }

                await a.updateAttributes({ bank: 'bnporc' });
                log.info("\tHelloBank access updated to use BNP's backend.");
                continue;
            }
        }

    },

    async function m5(cache) {
        log.info('Ensure "importDate" field is present in accounts.');

        cache.accounts = cache.accounts || await Account.all();

        for (let a of cache.accounts) {
            if (typeof a.importDate !== 'undefined')
                continue;

            log.info(`\t${a.accountNumber} has no importDate.`);

            let ops = await Operation.byAccount(a);

            let dateNumber = Date.now();
            if (ops.length) {
                dateNumber = ops.reduce(reduceOperationsDate, Date.now());
            }

            a.importDate = new Date(dateNumber);
            await a.save();

            log.info(`\tImport date for ${a.title} (${a.accountNumber}): ${a.importDate}`);
        }
    },

    async function m6(cache) {
        log.info('Migrate operationTypeId to type field...');
        try {
            cache.types = cache.types || await Type.all();

            if (cache.types.length) {
                let operations = await Operation.allWithOperationTypesId();
                log.info(`${operations.length} operations to migrate`);
                let typeMap = new Map();
                for (let { id, name } of cache.types) {
                    typeMap.set(id, name);
                }

                for (let operation of operations) {
                    if (operation.operationTypeID && typeMap.has(operation.operationTypeID)) {
                        operation.type = typeMap.get(operation.operationTypeID);
                    } else {
                        operation.type = UNKNOWN_OPERATION_TYPE;
                    }
                    delete operation.operationTypeID;
                    await operation.save();
                }

                // Delete operation types
                for (let type of cache.types) {
                    await type.destroy();
                }
                delete cache.types;
            }
        } catch (e) {
            log.error(`Error while updating operation type: ${e}`);
        }
    },

    async function m7(cache) {
        log.info('Ensuring consistency of accounts with alerts...');

        try {
            let accountSet = new Set;

            cache.accounts = cache.accounts || await Account.all();
            cache.alerts = cache.alerts || await Alert.all();

            for (let account of cache.accounts) {
                accountSet.add(account.accountNumber);
            }

            let numOrphans = 0;
            for (let al of cache.alerts) {
                if (!accountSet.has(al.bankAccount)) {
                    numOrphans++;
                    await al.destroy();
                }
            }
            // Purge the alerts cache, next migration requiring it will rebuild
            // an updated cache.
            delete cache.alerts;

            if (numOrphans)
                log.info(`\tfound and removed ${numOrphans} orphan alerts`);
        } catch (e) {
            log.error(`Error while ensuring consistency of alerts: ${e.toString()}`);
        }
    },

    async function m8(cache) {
        log.info('Deleting banks from database');
        try {
            cache.banks = cache.banks || await Bank.all();
            for (let bank of cache.banks) {
                await bank.destroy();
            }
            delete cache.banks;
        } catch (e) {
            log.error(`Error while deleting banks: ${e.toString()}`);
        }
    },

    async function m9() {
        log.info('Looking for a CMB access...');
        try {
            let accesses = await Access.byBank({ uuid: 'cmb' });
            for (let access of accesses) {
                // There is currently no other customFields, no need to update if it is defined.
                if (typeof access.customFields === 'undefined') {
                    log.info('Found CMB access, migrating to "par" website.');
                    const updateCMB = () => ([{ name: 'website', value: 'par' }]);
                    await updateCustomFields(access, updateCMB);
                }
            }
        } catch (e) {
            log.error(`Error while migrating CMB accesses: ${e.toString()}`);
        }
    },

    async function m10() {
        log.info('Looking for an s2e module...');
        try {
            let accesses = await Access.byBank({ uuid: 's2e' });
            for (let access of accesses) {
                let customFields = JSON.parse(access.customFields);
                let { value: website } = customFields.find(f => f.name === 'website');

                switch (website) {
                    case 'smartphone.s2e-net.com':
                        log.info('\tMigrating s2e module to bnpere...');
                        access.bank = 'bnppere';
                        break;
                    case 'mobile.capeasi.com':
                        log.info('\tMigrating s2e module to capeasi...');
                        access.bank = 'capeasi';
                        break;
                    case 'm.esalia.com':
                        log.info('\tMigrating s2e module to esalia...');
                        access.bank = 'esalia';
                        break;
                    case 'mobi.ere.hsbc.fr':
                        log.error('\tCannot migrate module s2e.');
                        log.error('\tPlease create a new access using erehsbc module (HSBC ERE).');
                        break;
                    default:
                        log.error(`Invalid value for s2e module: ${website}`);
                }
                if (access.bank !== 's2e') {
                    delete access.customFields;
                    await access.save();
                }
            }
        } catch (e) {
            log.error(`Error while migrating s2e accesses: ${e.toString()}`);
        }
    },

    async function m11(cache) {
        log.info('Searching accounts with IBAN value set to None');
        try {
            cache.accounts = cache.accounts || await Account.all();

            for (let account of cache.accounts.filter(acc => acc.iban === 'None')) {
                log.info(`\tDeleting iban for ${account.title} of bank ${account.bank}`);
                delete account.iban;
                await account.save();
            }
        } catch (e) {
            log.error(`Error while deleting iban with None value: ${e.toString()}`);
        }
    }
];

/**
 * Run all the required migrations.
 *
 * To determine whether a migration has to be run or not, we are comparing its
 * index in the migrations Array above with the `migration-version` config
 * value, which indicates the next migration to run.
 */
export async function run() {
    const migrationVersion = await Config.findOrCreateDefault('migration-version');

    // Cache to prevent loading multiple times the same data from the db.
    let cache = {};

    const firstMigrationIndex = parseInt(migrationVersion.value, 10);
    for (let m = firstMigrationIndex; m < migrations.length; m++) {
        await migrations[m](cache);

        migrationVersion.value = (m + 1).toString();
        await migrationVersion.save();
    }
}
