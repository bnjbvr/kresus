import * as path from 'path';
import { createConnection, ConnectionOptions } from 'typeorm';

import { assert, panic, makeLogger } from '../helpers';

import AccessField from './entities/access-fields';
import Access from './entities/accesses';
import Account from './entities/accounts';
import Alert from './entities/alerts';
import Budget from './entities/budgets';
import Category from './entities/categories';
import Setting from './entities/settings';
import Transaction from './entities/transactions';
import User from './entities/users';

export { AccessField, Access, Account, Alert, Budget, Category, Setting, Transaction, User };

const log = makeLogger('models/index');

function makeOrmConfig(): ConnectionOptions {
    let ormConfig: ConnectionOptions;

    // Keep this switch in sync with ../config.ts!
    switch (process.kresus.dbType) {
        case 'sqlite':
            assert(process.kresus.sqlitePath !== null, 'missing db path in server/models');
            ormConfig = {
                type: 'sqlite',
                database: process.kresus.sqlitePath,
                logging: process.kresus.dbLog
            };
            break;

        case 'postgres':
        case 'mysql':
        case 'mariadb':
            assert(typeof process.kresus.dbHost === 'string', 'missing db host in server/models');
            assert(typeof process.kresus.dbPort === 'number', 'missing db port in server/models');
            assert(
                typeof process.kresus.dbUsername === 'string',
                'missing db username in server/models'
            );
            assert(
                typeof process.kresus.dbPassword === 'string',
                'missing db password in server/models'
            );
            assert(typeof process.kresus.dbName === 'string', 'missing db name in server/models');
            ormConfig = {
                type: process.kresus.dbType,
                host: process.kresus.dbHost,
                port: process.kresus.dbPort,
                username: process.kresus.dbUsername,
                password: process.kresus.dbPassword,
                database: process.kresus.dbName,
                logging: process.kresus.dbLog
            };
            break;
        default:
            panic('unexpected db type in server/models');
    }

    return ormConfig;
}

export async function setupOrm() {
    const ormConfig = Object.assign(makeOrmConfig(), {
        // Automatically run migrations.
        migrationsRun: true,

        // Entity models.
        entities: [path.join(__dirname, 'entities/*')],

        // Migration files.
        migrations: [path.join(__dirname, 'migrations/*')],

        // Automatically synchronize the database schema on startup. Very
        // unsafe, use only to look at queries generated by the ORM.
        synchronize: false
    });

    await createConnection(ormConfig);
}

export async function initModels(root: string, cozyDbName: string) {
    await setupOrm();

    let userId;
    if (process.kresus.providedUserId !== null) {
        userId = process.kresus.providedUserId;
        // Check that the user actually exists already.
        const user = await User.find(userId);
        if (!user) {
            throw new Error(
                `The user with provided ID ${userId} doesn't exist. Did you run "kresus create:user" first?`
            );
        }
    } else {
        // Create default user.
        let user: User | undefined;
        const users: User[] = await User.all();
        if (!users.length) {
            const { login } = process.kresus.user;
            assert(!!login, 'There should be a default login set!');
            log.info('Creating default user...');
            user = await User.create({ login });
        } else if (users.length > 1) {
            throw new Error(
                'Several users in database but no user ID provided. Please provide a user ID'
            );
        } else {
            user = users[0];
        }
        userId = user.id;
    }
    process.kresus.user.id = userId;
    log.info(`User has id ${userId}`);

    // Try to migrate the older Pouchdb database, if it's not been done yet.
    const didMigrate = await Setting.findOrCreateDefaultBooleanValue(
        userId,
        'migrated-from-cozydb'
    );
    log.info(`Checking if the migration from CozyDB is required... ${didMigrate ? 'no' : 'yes'}`);
    if (!didMigrate) {
        // eslint-disable-next-line import/no-cycle, @typescript-eslint/no-var-requires
        const all = require('../controllers/all');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const exportCozyDb = require('kresus-export-cozydb');
        const options = Object.assign({}, { root, dbName: cozyDbName });
        log.info('Migrating from CozyDB...');
        try {
            const world = await exportCozyDb.run(options);
            await all.importData(userId, world);

            log.info('Migrating from CozyDB done!');
            await Setting.updateByKey(userId, 'migrated-from-cozydb', true);
        } catch (err) {
            log.error(`Unable to migrate from CozyDB: ${err.message}
${err.stack}`);

            log.info('Removing partially imported data...');

            // Remove all associated data, except for settings; they'll be
            // properly clobbered during the next successful attempt.
            await AccessField.destroyAll(userId);
            await Access.destroyAll(userId);
            await Account.destroyAll(userId);
            await Alert.destroyAll(userId);
            await Category.destroyAll(userId);
            await Budget.destroyAll(userId);
            await Transaction.destroyAll(userId);

            log.info('Removing partially imported data: done!');
        }
    }
}
