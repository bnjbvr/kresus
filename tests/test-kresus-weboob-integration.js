import path from 'path';
import should from 'should';

import { KError } from '../server/helpers';
import {
    UNKNOWN_WEBOOB_MODULE,
    INTERNAL_ERROR,
    INVALID_PASSWORD,
    EXPIRED_PASSWORD,
    ACTION_NEEDED,
    WEBOOB_NOT_INSTALLED
} from '../shared/errors.json';
import { callWeboob } from '../server/lib/sources/weboob';
import prepareProcessKresus from '../server/apply-config';
import Operation from '../server/models/operation';

async function callWeboobBefore(command, access) {
    return callWeboob(command, access)
        .then(success => {
            return { success };
        })
        .catch(error => {
            return { error };
        });
}

function checkError(result, errCode) {
    should.not.exist(result.success);
    should.exist(result.error);
    result.error.should.instanceof(KError);
    should.exist(result.error.errCode);
    result.error.errCode.should.equal(errCode);
}

async function makeDefectSituation(command) {
    describe(`Testing defect situations with "${command}" command`, () => {
        // Command shall be operations or accounts
        it(`call "${command}" command with unknown module should raise "UNKNOWN_WEBOOB_MODULE"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'unknown',
                login: 'login',
                password: 'password'
            });

            checkError(result, UNKNOWN_WEBOOB_MODULE);
        });

        it(`call "${command}" command with inconsistent JSON customFields should raise "INTERNAL_ERROR"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'fakeweboobbank',
                customFields: 'p',
                login: 'login',
                password: 'password'
            });

            checkError(result, INTERNAL_ERROR);
        });

        it(`call "${command}" command without password should raise "INTERNAL_ERROR"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'fakeweboobbank',
                login: 'login',
                password: ''
            });
            // Note: current implementation of main.py will detect a parameter is missing
            // and raise INTERNAL_ERROR instead of 'NO_PASSWORD'
            checkError(result, INTERNAL_ERROR);
        });

        it(`call "${command}" command without login should raise "INTERNAL_ERROR"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'fakeweboobbank',
                password: 'password',
                login: ''
            });
            // Note: current implementation of main.py will detect a parameter is missing
            // and raise INTERNAL_ERROR instead of 'INVALID_PARAMETERS'
            checkError(result, INTERNAL_ERROR);
        });

        it(`call "${command}" command with invalid password should raise "INVALID_PASSWORD"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'fakeweboobbank',
                password: 'invalidpassword',
                login: 'login'
            });

            checkError(result, INVALID_PASSWORD);
        });

        it(`call "${command}" command with expired password should raise "EXPIRED_PASSWORD"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'fakeweboobbank',
                password: 'expiredpassword',
                login: 'login'
            });

            checkError(result, EXPIRED_PASSWORD);
        });

        it(`call "${command}" command, the website requires a user action should raise "ACTION_NEEDED"`, async () => {
            let result = await callWeboobBefore(command, {
                bank: 'fakeweboobbank',
                password: 'actionneeded',
                login: 'login'
            });

            checkError(result, ACTION_NEEDED);
        });
    });
}

// Here everything starts.
describe('Testing kresus/weboob integration', function() {
    // These tests can be long
    this.slow(4000);
    this.timeout(10000);

    describe('with weboob not installed.', () => {
        before(function() {
            if (process.env.KRESUS_WEBOOB_DIR) {
                this.skip();
            }
        });
        it('call "test" should raise "WEBOOB_NOT_INSTALLED" error, if weboob is not globally installed. WARNING: if this test fails, make sure Weboob is not installed globally before opening an issue.', async () => {
            process.kresus = {};
            let result = await callWeboobBefore('test');
            checkError(result, WEBOOB_NOT_INSTALLED);
        });
    });
    describe('with weboob installed', () => {
        beforeEach(function() {
            if (!process.env.KRESUS_WEBOOB_DIR) {
                this.skip();
            }
        });
        describe('Defect situations', () => {
            describe('call an unknown command', () => {
                it('should raise "INTERNAL_ERROR" error', async () => {
                    prepareProcessKresus(true);
                    let result = await callWeboobBefore('unknown-command');

                    checkError(result, INTERNAL_ERROR);
                });
            });

            makeDefectSituation('operations');
            makeDefectSituation('accounts');
        });
        describe('Normal uses', () => {
            it('call test should not throw and return nothing', async () => {
                let { error, success } = await callWeboobBefore('test');

                should.not.exist(error);
                should.not.exist(success);
            });
            it('call version should not raise and return a non empty string', async () => {
                let { error, success } = await callWeboobBefore('version');

                should.not.exist(error);
                should.exist(success);
                success.should.instanceof(String);
                success.length.should.be.aboveOrEqual(1);
            });

            it('call "operations" should not raise and should return an array of operation-like shaped objects', async () => {
                let { error, success } = await callWeboobBefore('operations', {
                    bank: 'fakeweboobbank',
                    login: 'login',
                    password: 'noerror'
                });

                should.not.exist(error);
                should.exist(success);
                success.should.instanceof(Array);

                for (let element of success) {
                    element.should.have.keys('date', 'amount', 'title', 'type', 'account');
                }
            });

            it('call "accounts" should not raise and should return an array of account-like shaped objects', async () => {
                let { error, success } = await callWeboobBefore('accounts', {
                    bank: 'fakeweboobbank',
                    login: 'login',
                    password: 'noerror'
                });

                should.not.exist(error);
                should.exist(success);
                success.should.instanceof(Array);

                for (let element of success) {
                    element.should.have.keys('accountNumber', 'title', 'currency', 'balance');
                }
            });
        });
    });
});
