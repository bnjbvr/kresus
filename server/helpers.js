import semver from 'semver';

import {
    maybeHas as maybeHas_,
    assert as assert_,
    setupTranslator as setupTranslator_,
    translate as translate_,
    currency as currency_,
    UNKNOWN_OPERATION_TYPE as UNKNOWN_OPERATION_TYPE_,
    formatDate as formatDate_,
    MIN_WEBOOB_VERSION as MIN_WEBOOB_VERSION_
} from './shared/helpers.js';

import errors from './shared/errors.json';
import Logger from './lib/logger';

export const has = maybeHas_;
export const assert = assert_;
export const translate = translate_;
export const currency = currency_;
export const UNKNOWN_OPERATION_TYPE = UNKNOWN_OPERATION_TYPE_;
export const setupTranslator = setupTranslator_;
export const formatDate = formatDate_;
export const MIN_WEBOOB_VERSION = MIN_WEBOOB_VERSION_;

export function makeLogger(prefix) {
    return new Logger(prefix);
}

let log = makeLogger('helpers');

export function KError(
    msg = 'Internal server error',
    statusCode = 500,
    errCode = null,
    shortMessage = null
) {
    this.message = msg;
    this.shortMessage = shortMessage;
    this.errCode = errCode;
    this.stack = Error().stack;
    if (statusCode === null) {
        switch (errCode) {
            case errors.INVALID_PARAMETERS:
            case errors.NO_PASSWORD:
                this.statusCode = 400;
                break;
            case errors.INVALID_PASSWORD:
                this.statusCode = 401;
                break;
            case errors.ACTION_NEEDED:
            case errors.EXPIRED_PASSWORD:
            case errors.DISABLED_ACCESS:
                this.statusCode = 403;
                break;
            case errors.WEBOOB_NOT_INSTALLED:
            case errors.GENERIC_EXCEPTION:
            case errors.INTERNAL_ERROR:
            case errors.NO_ACCOUNTS:
            case errors.UNKNOWN_WEBOOB_MODULE:
            case errors.CONNECTION_ERROR:
                this.statusCode = 500;
                break;
            default:
                this.statusCode = 500;
                break;
        }
    } else {
        this.statusCode = statusCode;
    }
}

KError.prototype = new Error();
KError.prototype.name = 'KError';

export function getErrorCode(name) {
    if (typeof errors[name] !== 'undefined') {
        return errors[name];
    }
    throw new KError('Unknown error code!');
}

export function asyncErr(res, err, context) {
    let statusCode;
    let errCode;
    if (err instanceof KError) {
        statusCode = err.statusCode;
        errCode = err.errCode;
    } else {
        if (!(err instanceof Error)) {
            log.warn('err should be either a KError or an Error');
        }
        statusCode = 500;
        errCode = null;
    }

    let { message, shortMessage } = err;

    log.error(`${context}: ${message}`);

    res.status(statusCode).send({
        code: errCode,
        shortMessage,
        message
    });

    return false;
}

// Transforms a function of the form (arg1, arg2, ..., argN, callback) into a
// Promise-based function (arg1, arg2, ..., argN) that will resolve with the
// results of the callback if there's no error, or reject if there's any error.
// TODO How to make sure the function hasn't been passed to promisify once
// already?
export function promisify(func) {
    return function(...args) {
        // Note: "this" is extracted from this scope.
        return new Promise((accept, reject) => {
            // Add the callback function to the list of args
            args.push((err, ...rest) => {
                if (typeof err !== 'undefined' && err !== null) {
                    reject(err);
                    return;
                }

                if (rest.length === 1) {
                    accept(rest[0]);
                } else {
                    accept(...rest);
                }
            });
            // Call the callback-based function
            func.apply(this, args);
        });
    };
}

// Promisifies a few cozy-db methods by default
export function promisifyModel(model) {
    const statics = ['exists', 'find', 'create', 'save', 'updateAttributes', 'destroy', 'all'];

    for (let name of statics) {
        let former = model[name];
        model[name] = promisify(model::former);
    }

    const methods = ['save', 'updateAttributes', 'destroy'];

    for (let name of methods) {
        let former = model.prototype[name];
        model.prototype[name] = promisify(former);
    }

    return model;
}

export function errorRequiresUserAction(err) {
    return (
        err.errCode === getErrorCode('INVALID_PASSWORD') ||
        err.errCode === getErrorCode('EXPIRED_PASSWORD') ||
        err.errCode === getErrorCode('INVALID_PARAMETERS') ||
        err.errCode === getErrorCode('NO_PASSWORD') ||
        err.errCode === getErrorCode('ACTION_NEEDED')
    );
}

// Minimum hour of the day at which the automatic poll can occur.
export const POLLER_START_LOW_HOUR = 2;

// Maximum hour of the day at which the automatic poll can occur.
export const POLLER_START_HIGH_HOUR = 4;

export const isEmailEnabled = () => {
    return !!(
        process.kresus.emailFrom &&
        process.kresus.emailFrom.length &&
        ((process.kresus.emailTransport === 'smtp' &&
            process.kresus.smtpHost &&
            process.kresus.smtpPort) ||
            process.kresus.emailTransport === 'sendmail')
    );
};

export function normalizeVersion(version) {
    if (typeof version === 'undefined' || version === null) {
        return null;
    }
    let stringifiedVersion = version.toString();
    let cleanedVersion = semver.clean(stringifiedVersion);
    if (cleanedVersion !== null) {
        return cleanedVersion;
    }

    if (!/\d/.test(stringifiedVersion)) {
        throw new Error(`version should contain numbers: ${version}`);
    }

    let digits = stringifiedVersion.split('.');
    // Eliminate extra digits
    digits = digits.slice(0, 3);
    // Fill missing digits
    while (digits.length < 3) {
        digits.push('0');
    }
    // Replace fully string version with '0'
    digits = digits.map(digit => {
        if (typeof digit === 'string' && /^\D*$/.test(digit)) {
            return '0';
        }
        return digit;
    });
    return digits.join('.');
}

export function checkWeboobMinimalVersion(version) {
    let normalizedVersion = normalizeVersion(version);
    return (
        semver(normalizedVersion) &&
        semver.gte(normalizedVersion, normalizeVersion(MIN_WEBOOB_VERSION))
    );
}

// A simple helper to obfuscate sensitive data.
export function obfuscate(string) {
    return string.slice(-4).padStart(string.length, '*');
}
