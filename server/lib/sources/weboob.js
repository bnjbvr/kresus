// This module retrieves real values from the weboob backend, by using the given
// bankuuid / login / password (maybe customFields) combination.
import { spawn } from 'child_process';
import * as path from 'path';

import { makeLogger, KError, checkWeboobMinimalVersion } from '../../helpers';
import { WEBOOB_NOT_INSTALLED, INTERNAL_ERROR, INVALID_PARAMETERS } from '../../shared/errors.json';

let log = makeLogger('sources/weboob');

const ARGPARSE_MALFORMED_OPTIONS_CODE = 2;

export const SOURCE_NAME = 'weboob';

// Possible commands include:
// - test: test whether weboob is accessible from the current kresus user.
// - version: get weboob's version number.
// - update: updates weboob modules.
// All the following commands require $bank $login $password $customFields:
// - accounts
// - operations
// To enable Weboob debug, one should pass an extra `--debug` argument.
export function callWeboob(command, access, debug = false, updateFirst = false) {
    return new Promise((accept, reject) => {
        log.info(`Calling weboob: command ${command}...`);

        // Set up the environment:
        // We need to copy the whole `process.env` to ensure we don't break any
        // user setup, such as virtualenvs.

        let env = Object.assign({}, process.env);
        if (process.kresus.weboobDir) {
            env.WEBOOB_DIR = process.kresus.weboobDir;
        }
        if (process.kresus.dataDir) {
            env.KRESUS_DIR = process.kresus.dataDir;
        }
        if (process.kresus.weboobSourcesList) {
            env.WEBOOB_SOURCES_LIST = process.kresus.weboobSourcesList;
        }

        // Variable for PyExecJS, necessary for the Paypal module.
        env.EXECJS_RUNTIME = 'Node';

        let weboobArgs = [command];

        if (debug) {
            weboobArgs.push('--debug');
        }

        if (command === 'accounts' || command === 'operations') {
            if (updateFirst) {
                weboobArgs.push('--update');
            }

            weboobArgs.push(
                '--module',
                access.bank,
                '--login',
                access.login,
                '--password',
                access.password
            );
            if (typeof access.customFields !== 'undefined') {
                try {
                    let customFields = JSON.parse(access.customFields);
                    for (let { name, value } of customFields) {
                        if (typeof name === 'undefined' || typeof value === 'undefined') {
                            throw new Error();
                        }
                        weboobArgs.push('--field', name, value);
                    }
                } catch (err) {
                    log.error(`Invalid JSON for customFields: ${access.customFields}`);
                    return reject(
                        new KError(
                            `Invalid JSON for customFields: ${access.customFields}`,
                            null,
                            INVALID_PARAMETERS
                        )
                    );
                }
            }
        }

        let script = spawn(
            process.kresus.pythonExec,
            [path.join(path.dirname(__filename), '..', '..', 'weboob/main.py')].concat(weboobArgs),
            { env }
        );

        let stdout = new Buffer('');
        script.stdout.on('data', data => {
            stdout = Buffer.concat([stdout, data]);
        });

        let stderr = new Buffer('');
        script.stderr.on('data', data => {
            stderr = Buffer.concat([stderr, data]);
        });

        script.on('close', code => {
            log.info(`exited with code ${code}.`);

            stderr = stderr.toString('utf8');
            stdout = stdout.toString('utf8');

            if (stderr.trim().length) {
                // Log anything that went to stderr.
                log.warn(`stderr: ${stderr}`);
            }

            // Parse JSON response
            // Any error (be it a crash of the Python script or a legit error
            // from Weboob) will result in a non-zero error code. Hence, we
            // should first try to parse stdout as JSON, to retrieve an
            // eventual legit error, and THEN check the return code.
            try {
                stdout = JSON.parse(stdout);
            } catch (e) {
                // We got an invalid JSON response, there is a real and
                // important error.
                if (code === ARGPARSE_MALFORMED_OPTIONS_CODE) {
                    return reject(new KError('Options are malformed', null, INTERNAL_ERROR));
                }
                if (code !== 0) {
                    // If code is non-zero, treat as stderr, that is a crash of
                    // the Python script.
                    return reject(
                        new KError(
                            `Process exited with non-zero error code ${code}. Unknown error. Stderr was ${stderr}`
                        )
                    );
                }
                // Else, treat it as invalid JSON
                // This should never happen, it would be a programming error.
                return reject(new KError(`Invalid JSON response: ${e.message}.`));
            }

            // If valid JSON output, check for an error within JSON
            if (typeof stdout.error_code !== 'undefined') {
                log.info('Command returned an error code.');

                return reject(
                    new KError(stdout.error_message, null, stdout.error_code, stdout.error_short)
                );
            }

            log.info('OK: weboob exited normally with non-empty JSON content.');
            accept(stdout.values);
        });
    });
}

let cachedWeboobVersion = 0;

export async function testInstall() {
    try {
        log.info('Checking that weboob is installed and can actually be called…');
        await callWeboob('test');
        return true;
    } catch (err) {
        log.error(`When testing install: ${err}`);
        cachedWeboobVersion = 0;
        return false;
    }
}

export async function getVersion(forceFetch = false) {
    if (
        cachedWeboobVersion === 0 ||
        !checkWeboobMinimalVersion(cachedWeboobVersion) ||
        forceFetch
    ) {
        try {
            cachedWeboobVersion = await callWeboob('version');
            if (cachedWeboobVersion === '?') {
                cachedWeboobVersion = 0;
            }
        } catch (err) {
            log.error(`When getting Weboob version: ${err}`);
            cachedWeboobVersion = 0;
        }
    }
    return cachedWeboobVersion;
}

async function _fetchHelper(command, access, isDebugEnabled, updateFirst = false) {
    try {
        return await callWeboob(command, access, isDebugEnabled, updateFirst);
    } catch (err) {
        if (!await testInstall()) {
            throw new KError(
                "Weboob doesn't seem to be installed, skipping fetch.",
                null,
                WEBOOB_NOT_INSTALLED
            );
        }

        log.error(`Got error while fetching ${command}: ${err.message}`);
        if (typeof err.error_code !== 'undefined') {
            log.error(`\t(error code: ${err.error_code})`);
        }

        throw err;
    }
}

export async function fetchAccounts({ access, debug, update }) {
    return await _fetchHelper('accounts', access, debug, update);
}

export async function fetchOperations({ access, debug }) {
    return await _fetchHelper('operations', access, debug);
}

// Can throw.
export async function updateWeboobModules() {
    await callWeboob('update');
}
