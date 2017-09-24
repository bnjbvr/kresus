import u from 'updeep';

import { assert,
         assertHas,
         debug,
         localeComparator,
         maybeHas,
         NONE_CATEGORY_ID,
         translate as $t } from '../helpers';

import { Account, Access, Alert, Bank, Operation } from '../models';

import Errors, { genericErrorHandler } from '../errors';

import * as backend from './backend';

import { createReducerFromMap,
         fillOutcomeHandlers,
         updateMapIf,
         SUCCESS, FAIL } from './helpers';

import {
    CREATE_ACCESS,
    CREATE_ALERT,
    CREATE_OPERATION,
    DELETE_ACCESS,
    DELETE_ACCOUNT,
    DELETE_ALERT,
    DELETE_OPERATION,
    MERGE_OPERATIONS,
    SET_OPERATION_CATEGORY,
    SET_OPERATION_CUSTOM_LABEL,
    SET_OPERATION_TYPE,
    RUN_ACCOUNTS_SYNC,
    RUN_BALANCE_RESYNC,
    RUN_OPERATIONS_SYNC,
    UPDATE_ALERT
} from './actions';

import StaticBanks from '../../shared/banks.json';

// Basic actions creators
const basic = {

    setOperationCategory(operation, categoryId, formerCategoryId) {
        return {
            type: SET_OPERATION_CATEGORY,
            operation,
            categoryId,
            formerCategoryId
        };
    },

    setOperationType(operation, type, formerType) {
        return {
            type: SET_OPERATION_TYPE,
            operation,
            operationType: type,
            formerType
        };
    },

    setCustomLabel(operation, customLabel, formerCustomLabel) {
        return {
            type: SET_OPERATION_CUSTOM_LABEL,
            operation,
            customLabel,
            formerCustomLabel
        };
    },

    runOperationsSync(accessId, results = {}) {
        return {
            type: RUN_OPERATIONS_SYNC,
            accessId,
            results
        };
    },

    runAccountsSync(accessId, results = {}) {
        return {
            type: RUN_ACCOUNTS_SYNC,
            accessId,
            results
        };
    },

    createOperation(operation) {
        return {
            type: CREATE_OPERATION,
            operation
        };
    },

    deleteOperation(operationId) {
        return {
            type: DELETE_OPERATION,
            operationId
        };
    },

    mergeOperations(toKeep, toRemove) {
        return {
            type: MERGE_OPERATIONS,
            toKeep,
            toRemove
        };
    },

    createAccess(results = {}, uuid, login, fields) {
        return {
            type: CREATE_ACCESS,
            results,
            uuid,
            login,
            fields
        };
    },

    deleteAccess(accessId, accountsIds) {
        return {
            type: DELETE_ACCESS,
            accessId,
            accountsIds
        };
    },

    resyncBalance(accountId, initialAmount) {
        return {
            type: RUN_BALANCE_RESYNC,
            accountId,
            initialAmount
        };
    },

    deleteAccount(accountId) {
        return {
            type: DELETE_ACCOUNT,
            accountId
        };
    },

    createAlert(alert) {
        return {
            type: CREATE_ALERT,
            alert
        };
    },

    updateAlert(alertId, attributes) {
        return {
            type: UPDATE_ALERT,
            alertId,
            attributes
        };
    },

    deleteAlert(alertId) {
        return {
            type: DELETE_ALERT,
            alertId
        };
    }
};

const fail = {}, success = {};
fillOutcomeHandlers(basic, fail, success);

export function setOperationType(operation, type) {
    assert(typeof operation.id === 'string', 'SetOperationType first arg must have an id');
    assert(typeof type === 'string', 'SetOperationType second arg must be a String id');

    let formerType = operation.type;

    return dispatch => {
        dispatch(basic.setOperationType(operation, type, formerType));
        backend.setTypeForOperation(operation.id, type)
        .then(() => {
            dispatch(success.setOperationType(operation, type, formerType));
        }).catch(err => {
            dispatch(fail.setOperationType(err, operation, type, formerType));
        });
    };
}

export function setOperationCategory(operation, categoryId) {
    assert(typeof operation.id === 'string', 'SetOperationCategory first arg must have an id');
    assert(typeof categoryId === 'string', 'SetOperationCategory 2nd arg must be String id');

    // The server expects an empty string for replacing by none
    let serverCategoryId = categoryId === NONE_CATEGORY_ID ? '' : categoryId;
    let formerCategoryId = operation.categoryId;

    return dispatch => {
        dispatch(basic.setOperationCategory(operation, categoryId, formerCategoryId));
        backend.setCategoryForOperation(operation.id, serverCategoryId)
        .then(() => {
            dispatch(success.setOperationCategory(operation, categoryId, formerCategoryId));
        }).catch(err => {
            dispatch(fail.setOperationCategory(err, operation, categoryId, formerCategoryId));
        });
    };
}

export function setOperationCustomLabel(operation, customLabel) {
    assert(typeof operation.id === 'string', 'setCustomLabel first arg must have an id');
    assert(typeof customLabel === 'string', 'setCustomLabel 2nd arg must be String id');

    // The server expects an empty string for deleting the custom label.
    let serverCustomLabel = !customLabel ? '' : customLabel;
    let formerCustomLabel = operation.customLabel;

    return dispatch => {
        dispatch(basic.setCustomLabel(operation, customLabel, formerCustomLabel));
        backend.setCustomLabel(operation.id, serverCustomLabel)
        .then(() => {
            dispatch(success.setCustomLabel(operation, customLabel));
        }).catch(err => {
            dispatch(fail.setCustomLabel(err, operation, customLabel, formerCustomLabel));
        });
    };
}

export function mergeOperations(toKeep, toRemove) {
    assertHas(toKeep, 'id');
    assertHas(toRemove, 'id');

    return dispatch => {
        dispatch(basic.mergeOperations(toKeep, toRemove));
        backend.mergeOperations(toKeep.id, toRemove.id)
        .then(newToKeep => {
            dispatch(success.mergeOperations(newToKeep, toRemove));
        }).catch(err => {
            dispatch(fail.mergeOperations(err, toKeep, toRemove));
        });
    };
}

export function createOperation(operation) {
    return dispatch => {
        dispatch(basic.createOperation(operation));
        backend.createOperation(operation)
        .then(created => {
            dispatch(success.createOperation(created));
        }).catch(err => {
            dispatch(fail.createOperation(err, operation));
        });
    };
}

export function deleteOperation(operationId) {
    return dispatch => {
        dispatch(basic.deleteOperation(operationId));
        backend.deleteOperation(operationId)
        .then(() => {
            dispatch(success.deleteOperation(operationId));
        }).catch(err => {
            dispatch(fail.deleteOperation(err, operationId));
        });
    };
}

export function deleteAccess(accessId, get) {
    assert(typeof accessId === 'string', 'deleteAccess expects a string id');
    return (dispatch, getState) => {
        let accountsIds = get.accountsByAccessId(getState(), accessId).map(acc => acc.id);
        dispatch(basic.deleteAccess(accessId));
        backend.deleteAccess(accessId)
        .then(() => {
            dispatch(success.deleteAccess(accessId, accountsIds));
        }).catch(err => {
            dispatch(fail.deleteAccess(err, accessId));
        });
    };
}

export function deleteAccount(accountId) {
    assert(typeof accountId === 'string', 'deleteAccount expects a string id');

    return dispatch => {
        dispatch(basic.deleteAccount(accountId));
        backend.deleteAccount(accountId)
        .then(() => {
            dispatch(success.deleteAccount(accountId));
        }).catch(err => {
            dispatch(fail.deleteAccount(err, accountId));
        });
    };
}

export function resyncBalance(accountId) {
    assert(typeof accountId === 'string', 'resyncBalance expects a string id');

    return dispatch => {
        dispatch(basic.resyncBalance(accountId));
        backend.resyncBalance(accountId)
        .then(initialAmount => {
            dispatch(success.resyncBalance(accountId, initialAmount));
        }).catch(err => {
            dispatch(fail.resyncBalance(err, accountId));
        });
    };
}

export function runOperationsSync(accessId) {
    return dispatch => {
        dispatch(basic.runOperationsSync());
        backend.getNewOperations(accessId).then(results => {
            dispatch(success.runOperationsSync(accessId, results));
        })
        .catch(err => {
            dispatch(fail.runOperationsSync(err));
        });
    };
}

export function runAccountsSync(accessId) {
    return dispatch => {
        dispatch(basic.runAccountsSync(accessId));
        backend.getNewAccounts(accessId).then(results => {
            dispatch(success.runAccountsSync(accessId, results));
        })
        .catch(err => {
            dispatch(fail.runAccountsSync(err));
        });
    };
}

// Handle sync errors on the first synchronization, when a new access is
// created.
function handleFirstSyncError(err) {
    switch (err.code) {
        case Errors.EXPIRED_PASSWORD:
            alert($t('client.sync.expired_password'));
            break;
        case Errors.INVALID_PARAMETERS:
            alert($t('client.sync.invalid_parameters', { content: err.content || '?' }));
            break;
        case Errors.INVALID_PASSWORD:
            alert($t('client.sync.first_time_wrong_password'));
            break;
        case Errors.NO_ACCOUNTS:
            alert($t('client.sync.no_accounts'));
            break;
        case Errors.UNKNOWN_MODULE:
            alert($t('client.sync.unknown_module'));
            break;
        default:
            genericErrorHandler(err);
            break;
    }
}

export function createAccess(get, uuid, login, password, fields) {
    return dispatch => {

        dispatch(basic.createAccess());
        backend.createAccess(uuid, login, password, fields)
        .then(results => {
            dispatch(success.createAccess(results, uuid, login, fields));
        })
        .catch(err => {
            dispatch(fail.createAccess(err));
        });
    };
}

export function createAlert(newAlert) {
    return dispatch => {
        dispatch(basic.createAlert(newAlert));
        backend.createAlert(newAlert)
        .then(created => {
            dispatch(success.createAlert(created));
        })
        .catch(err => {
            dispatch(fail.createAlert(err, newAlert));
        });
    };
}

export function updateAlert(alertId, attributes) {
    return dispatch => {
        dispatch(basic.updateAlert(alertId, attributes));
        backend.updateAlert(alertId, attributes)
        .then(() => {
            dispatch(success.updateAlert(alertId, attributes));
        })
        .catch(err => {
            dispatch(fail.updateAlert(err, alertId, attributes));
        });
    };
}

export function deleteAlert(alertId) {
    return dispatch => {
        dispatch(basic.deleteAlert(alertId));
        backend.deleteAlert(alertId)
        .then(() => {
            dispatch(success.deleteAlert(alertId));
        })
        .catch(err => {
            dispatch(fail.deleteAlert(err, alertId));
        });
    };
}

// Reducers
function reduceSetOperationCategory(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        return state;
    }

    // Optimistic update.
    let categoryId;

    if (status === FAIL) {
        categoryId = action.formerCategoryId;
    } else {
        categoryId = action.categoryId;
    }

    return u.updateIn('operations',
                      updateMapIf('id', action.operation.id, { categoryId }),
                      state);
}

function reduceSetOperationType(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        return state;
    }

    // Optimistic update.
    let type;

    if (status === FAIL) {
        type = action.formerType;
    } else {
        type = action.operationType;
    }

    return u.updateIn('operations',
                      updateMapIf('id', action.operation.id, { type }),
                      state);
}

function reduceSetOperationCustomLabel(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        return state;
    }

    // Optimistic update.
    let customLabel;

    if (status === FAIL) {
        customLabel = action.formerCustomLabel;
    } else {
        customLabel = action.customLabel;
    }

    return u.updateIn('operations',
                      updateMapIf('id', action.operation.id, { customLabel }),
                      state);
}

// Handle any synchronization error, after the first one.
function handleSyncError(err) {
    switch (err.code) {
        case Errors.EXPIRED_PASSWORD:
            alert($t('client.sync.expired_password'));
            break;
        case Errors.INVALID_PASSWORD:
            alert($t('client.sync.wrong_password'));
            break;
        case Errors.NO_ACCOUNTS:
            alert($t('client.sync.no_accounts'));
            break;
        case Errors.NO_PASSWORD:
            alert($t('client.sync.no_password'));
            break;
        case Errors.UNKNOWN_MODULE:
            alert($t('client.sync.unknown_module'));
            break;
        default:
            genericErrorHandler(err);
            break;
    }
}

function finishSync(state, results) {
    let newState = state;
    let { accounts, newOperations } = results;

    assert(maybeHas(results, 'accounts') || maybeHas(results, 'operations'),
           'should have something to update');

    if (typeof accounts !== 'undefined') {
        assertHas(results, 'accessId');
        let accessId = results.accessId;

        accounts = accounts.map(a => new Account(a, state.constants.defaultCurrency));

        // Remove former accounts and reinsert them.
        let unrelated = state.accounts.filter(a => a.bankAccess !== accessId);
        accounts = unrelated.concat(accounts);

        sortAccounts(accounts);

        newState = u.updateIn('accounts', () => accounts, newState);

        // Load a pair of current access/account, after the initial creation load.
        if (newState.currentAccountId === null) {
            newState = u({
                currentAccessId: accessId,
                currentAccountId: accounts[0].id
            }, newState);
        }
    }

    if (typeof newOperations !== 'undefined') {
        // Add new operations.
        let operations = newOperations.map(o => new Operation(o));
        operations = state.operations.concat(operations);

        sortOperations(operations);

        newState = u.updateIn('operations', () => operations, newState);
    }

    return newState;
}

function reduceRunOperationsSync(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { results, accessId } = action;
        results.accessId = accessId;
        return finishSync(state, results);
    }

    if (status === FAIL) {
        handleSyncError(action.error);
    }

    return state;
}

function reduceRunAccountsSync(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { results } = action;
        results.accessId = action.accessId;
        return finishSync(state, results);
    }

    if (status === FAIL) {
        handleSyncError(action.error);
    }

    return state;
}

function reduceMergeOperations(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        // Remove the former operation:
        let ret = u.updateIn('operations', u.reject(o => o.id === action.toRemove.id), state);

        // Replace the kept one:
        let newKept = new Operation(action.toKeep);
        return u.updateIn('operations',
                          updateMapIf('id', action.toKeep.id, newKept),
                          ret);
    }

    return state;
}

function reduceCreateOperation(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { operation } = action;

        let operations = state.operations;
        let newOp = [new Operation(operation)];
        operations = newOp.concat(operations);

        sortOperations(operations);

        return u({ operations }, state);
    }

    return state;
}

function reduceDeleteOperation(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { operationId } = action;
        return u({
            operations: u.reject(o => o.id === operationId)
        }, state);
    }

    return state;
}

function reduceResyncBalance(state, action) {
    let { status, accountId } = action;
    if (status === SUCCESS) {
        let { initialAmount } = action;
        return u.updateIn('accounts', updateMapIf('id', accountId, u({ initialAmount })), state);
    }

    return state;
}

function reduceDeleteAccountInternal(state, accountId) {
    let { accountNumber, bankAccess } = accountById(state, accountId);

    // Remove account:
    let ret = u.updateIn('accounts', u.reject(a => a.id === accountId), state);

    // Remove operations:
    ret = u.updateIn('operations', u.reject(o => o.bankAccount === accountNumber), ret);

    // Remove alerts:
    ret = u.updateIn('alerts', u.reject(a => a.bankAccount === accountNumber), ret);

    // If this was the last account of the access, remove the access too:
    if (accountsByAccessId(state, bankAccess).length === 1) {
        ret = u.updateIn('accesses', u.reject(a => a.id === bankAccess), ret);
    }

    return ret;
}

function reduceDeleteAccount(state, action) {
    let { accountId, status } = action;

    if (status === SUCCESS) {
        let ret = reduceDeleteAccountInternal(state, accountId);

        // Maybe the current access has been destroyed (if the account was the
        // last one) and we need to find a new one.
        let formerAccessId = accountById(state, accountId).bankAccess;
        let formerAccessStillExists = !!ret.accesses.filter(a => a.id === formerAccessId).length;

        let currentAccessId = null;
        let currentAccountId = null;
        if (formerAccessStillExists) {
            currentAccessId = formerAccessId;
            currentAccountId = ret.accounts.filter(a => a.bankAccess === currentAccessId)[0].id;
        } else {
            // Either there is another access and we take it and its first
            // account; or there is nothing, and the user must create a new
            // access.
            let otherAccess = ret.accesses.length ? ret.accesses[0] : null;
            if (otherAccess) {
                currentAccessId = otherAccess.id;
                currentAccountId = ret.accounts.filter(a => a.bankAccess === currentAccessId)[0].id;
            }
            // otherwise let them be null.
        }

        ret = u({
            currentAccessId,
            currentAccountId
        }, ret);

        return ret;
    }

    return state;
}

function reduceDeleteAccess(state, action) {
    let { accessId, status } = action;

    if (status === SUCCESS) {
        // Remove associated accounts.
        let ret = state;
        for (let account of accountsByAccessId(state, accessId)) {
            ret = reduceDeleteAccountInternal(ret, account.id);
        }

        // Update current access and account, if necessary.
        if (getCurrentAccessId(state) === accessId) {

            let currentAccessId = ret.accesses.length ? ret.accesses[0].id : null;

            let otherAccounts = ret.accounts.filter(a => a.bankAccess === currentAccessId);
            let currentAccountId = otherAccounts.length ? otherAccounts[0].id : null;

            ret = u({
                currentAccessId,
                currentAccountId
            }, ret);
        }

        return ret;
    }

    return state;
}

function reduceCreateAccess(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { results, uuid, login, fields } = action;
        let access = {
            id: results.accessId,
            bank: uuid,
            login,
            enabled: true
        };

        if (fields instanceof Array && fields.length) {
            access.customFields = JSON.stringify(fields);
        }

        let accesses = state.accesses.concat(new Access(access, all(state)));

        let newState = u({ accesses }, state);

        return finishSync(newState, results, access.id);
    }

    if (status === FAIL) {
        handleFirstSyncError(action.error);
    }

    return state;
}

function reduceUpdateAccess(state, action) {
    if (action.status !== SUCCESS) {
        return state;
    }

    assertHas(action, 'results');
    let { login, customFields, accessId } = action;

    let update = { login, customFields, enabled: true };
    let newState = u.updateIn('accesses', updateMapIf('id', accessId, update), state);
    return finishSync(newState, action.results);
}

function reduceDisableAccess(state, action) {
    let { status, accessId } = action;
    if (status === SUCCESS) {
        return u.updateIn('accesses', updateMapIf('id', accessId, { enabled: false }), state);
    }
    return state;
}

function reduceCreateAlert(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let a = new Alert(action.alert);
        return u({
            alerts: [a].concat(state.alerts)
        }, state);
    }

    return state;
}

function reduceUpdateAlert(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { attributes, alertId } = action;
        return u.updateIn('alerts', updateMapIf('id', alertId, u(attributes)), state);
    }

    return state;
}

function reduceDeleteAlert(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { alertId } = action;
        return u({
            alerts: u.reject(a => a.id === alertId)
        }, state);
    }

    return state;
}

// Reducers on external actions.
function reduceDeleteCategory(state, action) {
    if (action.status !== SUCCESS)
        return state;

    let { id, replaceByCategoryId } = action;

    return u.updateIn('operations',
                      updateMapIf('categoryId', id, { categoryId: replaceByCategoryId }),
                      state);
}

// Initial state.
const bankState = u({
    // A list of the banks.
    banks: [],
    accesses: [],
    accounts: [],
    operations: [],
    alerts: [],
    currentAccessId: null,
    currentAccountId: null
}, {});

// Mapping of actions => reducers.
const reducers = {
    CREATE_OPERATION: reduceCreateOperation,
    CREATE_ACCESS: reduceCreateAccess,
    CREATE_ALERT: reduceCreateAlert,
    DELETE_ACCESS: reduceDeleteAccess,
    DELETE_ACCOUNT: reduceDeleteAccount,
    DELETE_ALERT: reduceDeleteAlert,
    DELETE_CATEGORY: reduceDeleteCategory,
    DELETE_OPERATION: reduceDeleteOperation,
    DISABLE_ACCESS: reduceDisableAccess,
    MERGE_OPERATIONS: reduceMergeOperations,
    RUN_ACCOUNTS_SYNC: reduceRunAccountsSync,
    RUN_BALANCE_RESYNC: reduceResyncBalance,
    RUN_OPERATIONS_SYNC: reduceRunOperationsSync,
    SET_OPERATION_CATEGORY: reduceSetOperationCategory,
    SET_OPERATION_CUSTOM_LABEL: reduceSetOperationCustomLabel,
    SET_OPERATION_TYPE: reduceSetOperationType,
    UPDATE_ALERT: reduceUpdateAlert,
    UPDATE_ACCESS: reduceUpdateAccess
};

export const reducer = createReducerFromMap(bankState, reducers);

// Helpers.
function sortAccounts(accounts) {
    accounts.sort((a, b) => localeComparator(a.title, b.title));
}

function sortOperations(ops) {
    // Sort by -date first, then by +title/customLabel.
    ops.sort((a, b) => {
        let ad = +a.date,
            bd = +b.date;
        if (ad < bd)
            return 1;
        if (ad > bd)
            return -1;
        let ac = a.customLabel && a.customLabel.trim().length ? a.customLabel : a.title;
        let bc = b.customLabel && b.customLabel.trim().length ? b.customLabel : b.title;
        return localeComparator(ac, bc);
    });
}

function sortSelectFields(field) {
    if (maybeHas(field, 'values')) {
        field.values.sort((a, b) => localeComparator(a.label, b.label));
    }
}

function sortBanks(banks) {
    banks.sort((a, b) => localeComparator(a.name, b.name));

    // Sort the selects of customFields by alphabetical order.
    banks.forEach(bank => {
        if (bank.customFields) {
            bank.customFields.forEach(sortSelectFields);
        }
    });
}

// Initial state.
export function initialState(external, allAccesses, allAccounts, allOperations, allAlerts) {

    // Retrieved from outside.
    let { defaultCurrency, defaultAccountId } = external;

    let banks = StaticBanks.map(b => new Bank(b));
    sortBanks(banks);

    let accounts = allAccounts.map(a => new Account(a, defaultCurrency));
    sortAccounts(accounts);

    let accesses = allAccesses.map(a => new Access(a, banks));

    let operations = allOperations.map(op => new Operation(op));
    sortOperations(operations);

    let alerts = allAlerts.map(al => new Alert(al));

    // Ui sub-state.
    let currentAccountId = null;
    let currentAccessId = null;

    out:
    for (let access of accesses) {
        for (let account of accountsByAccessId({ accounts }, access.id)) {

            if (account.id === defaultAccountId) {
                currentAccountId = account.id;
                currentAccessId = account.bankAccess;
                // Break from the two loops at once.
                break out;
            }

            if (!currentAccountId) {
                currentAccountId = account.id;
                currentAccessId = account.bankAccess;
            }
        }
    }

    return u({
        banks,
        accesses,
        accounts,
        operations,
        alerts,
        currentAccessId,
        currentAccountId,
        constants: {
            defaultCurrency
        }
    }, {});
}

// Getters

export function getCurrentAccessId(state) {
    return state.currentAccessId;
}

export function getCurrentAccountId(state) {
    return state.currentAccountId;
}

export function all(state) {
    return state.banks;
}

export function bankByUuid(state, uuid) {
    let candidate = state.banks.find(bank => bank.uuid === uuid);
    return typeof candidate !== 'undefined' ? candidate : null;
}

export function getAccesses(state) {
    return state.accesses;
}

export function accessById(state, accessId) {
    let candidate = state.accesses.find(access => access.id === accessId);
    return typeof candidate !== 'undefined' ? candidate : null;
}

export function accountById(state, accountId) {
    let candidates = state.accounts.filter(account => account.id === accountId);
    return candidates.length ? candidates[0] : null;
}

export function accessByAccountId(state, accountId) {
    let account = accountById(state, accountId);
    if (account === null) {
        return null;
    }
    return accessById(state, account.bankAccess);
}

export function accountsByAccessId(state, accessId) {
    return state.accounts.filter(acc => acc.bankAccess === accessId);
}

export function operationById(state, operationId) {
    let candidates = state.operations.filter(operation => operation.id === operationId);
    return candidates.length ? candidates[0] : null;
}

export function operationsByAccountId(state, accountId) {
    let { accountNumber } = accountById(state, accountId);
    return state.operations.filter(op => op.bankAccount === accountNumber);
}

export function alertPairsByType(state, alertType) {
    let pairs = [];

    for (let al of state.alerts.filter(a => a.type === alertType)) {
        let accounts = state.accounts.filter(acc => acc.accountNumber === al.bankAccount);
        if (!accounts.length) {
            debug('alert tied to no accounts, skipping');
            continue;
        }
        pairs.push({ alert: al, account: accounts[0] });
    }

    return pairs;
}
