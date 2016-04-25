import moment from 'moment';

import Access from '../models/access';
import Config from '../models/config';

import AccountManager from './accounts-manager';
import ReportManager  from './report-manager';

import * as weboob from './sources/weboob';

import { makeLogger, getErrorCode } from '../helpers';

let log = makeLogger('poller');

class Poller
{
    constructor() {
        this.timeout = null;
        this.run = this.run.bind(this);
    }

    programNextRun() {
        // day after between 02:00am and 04:00am UTC
        let delta = Math.random() * 120 | 0;
        let now = moment();
        let nextUpdate = now.clone().add(1, 'days')
                            .hours(2)
                            .minutes(delta)
                            .seconds(0);

        let format = 'DD/MM/YYYY [at] HH:mm:ss';
        log.info(`> Next check of accounts on ${nextUpdate.format(format)}`);

        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.timeout = setTimeout(this.run, nextUpdate.diff(now));

        this.sentNoPasswordNotification = false;
    }

    async run(cb) {
        // Ensure checks will continue even if we hit some error during the
        // process.
        try {
            this.programNextRun();
        } catch (err) {
            log.error(`Error when preparting the next check: ${err.message}`);
        }

        // Separate try/catch, so that failing to update weboob doesn't prevent
        // accounts/operations to be fetched.
        try {
            // Weboob management
            let updateWeboob = await Config.findOrCreateDefaultBooleanValue(
                'weboob-auto-update'
            );
            if (updateWeboob) {
                await weboob.updateWeboobModules();
            }
        } catch (err) {
            log.error(`Error when updating Weboob in polling: ${err.message}`);
        }

        try {
            // Check accounts and operations!
            let checkAccounts = false;
            checkAccounts = await Config.findOrCreateDefaultBooleanValue(
                'weboob-auto-merge-accounts'
            );
        } catch (err) {
            log.error(`Could not retrieve 'weboob-auto-merge-accounts': ${err.toString()}`);
        }
        // We go on even if the parameter weboob-auto-merge-accounts is
        // not caught. By default, the merge is not done.
        log.info('Checking new operations for all accesses...');
        if (checkAccounts) {
            log.info('\t(will also check for accounts to merge)');
        }
        try {
            let accesses = await Access.all();
            for (let access of accesses) {
                let accountManager = new AccountManager;
                try {
                    // Only import if last poll did not raise a
                    // login/parameter error
                    if (access.canAccessBePolled()) {
                        if (checkAccounts) {
                            await accountManager.retrieveAccountsByAccess(
                                access,
                                false
                            );
                        }
                        await accountManager.retrieveOperationsByAccess(
                            access, cb);
                    } else {
                        log.info(`Cannot poll, last import raised:
                            ${access.fetchStatus}`);
                    }
                } catch (err) {
                    log.error(`Error when polling accounts:
                        ${err.message}`);
                    if (err.errCode) {
                        // We save the error status.
                        access.fetchStatus = err.errCode;
                        await access.save();
                        if (err.errCode ===
                            getErrorCode('NO_PASSWORD') &&
                            !this.sentNoPasswordNotification) {
                            // TODO do something with this
                            this.sentNoPasswordNotification = true;
                        }
                    }
                }
            }
        } catch (err) {
            log.error(`Error when polling accounts: ${err.message}`);
        }

        try {
            // Reports
            log.info('Maybe sending reports...');
            await ReportManager.manageReports();

            // Done!
            log.info('All accounts have been polled.');
            this.sentNoPasswordNotification = false;
        } catch (err) {
            log.error('Error when managing reports');
        }
    }

    async runAtStartup(cb) {
        try {
            await this.run(cb);
        } catch (err) {
            log.error(`when polling accounts at startup: ${err.message}`);
        }
    }
}

let poller = new Poller;

export default poller;
