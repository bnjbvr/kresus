import u from 'updeep';

import {
    assert,
    assertHas,
    debug,
    localeComparator,
    maybeHas,
    NONE_CATEGORY_ID,
    translate as $t
} from '../helpers';

import { Account, Access, Alert, Bank, Operation } from '../models';

import DefaultSettings from '../../shared/default-settings';

import Errors, { genericErrorHandler } from '../errors';

import * as backend from './backend';

import { createReducerFromMap, fillOutcomeHandlers, updateMapIf, SUCCESS, FAIL } from './helpers';

import {
    CREATE_ACCESS,
    CREATE_ALERT,
    CREATE_OPERATION,
    DELETE_ACCESS,
    DELETE_ACCOUNT,
    DELETE_ALERT,
    DELETE_OPERATION,
    MERGE_OPERATIONS,
    SET_DEFAULT_ACCOUNT,
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
    setOperationCategory(operationId, categoryId, formerCategoryId) {
        return {
            type: SET_OPERATION_CATEGORY,
            operationId,
            categoryId,
            formerCategoryId
        };
    },

    setOperationType(operationId, type, formerType) {
        return {
            type: SET_OPERATION_TYPE,
            operationId,
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

    createAccess(uuid, login, fields, results = {}) {
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
    },

    setDefaultAccountId(accountId) {
        return {
            type: SET_DEFAULT_ACCOUNT,
            accountId
        };
    }
};

const fail = {},
    success = {};
fillOutcomeHandlers(basic, fail, success);

export function setOperationType(operationId, type, formerType) {
    assert(typeof operationId === 'string', 'SetOperationType first arg must have an id');
    assert(typeof type === 'string', 'SetOperationType second arg must be a String id');

    return dispatch => {
        dispatch(basic.setOperationType(operationId, type, formerType));
        backend
            .setTypeForOperation(operationId, type)
            .then(() => {
                dispatch(success.setOperationType(operationId, type, formerType));
            })
            .catch(err => {
                dispatch(fail.setOperationType(err, operationId, type, formerType));
            });
    };
}

export function setOperationCategory(operationId, categoryId, formerCatId) {
    assert(typeof operationId === 'string', 'SetOperationCategory first arg must have an id');
    assert(typeof categoryId === 'string', 'SetOperationCategory 2nd arg must be String id');

    // The server expects an empty string for replacing by none
    let serverCategoryId = categoryId === NONE_CATEGORY_ID ? '' : categoryId;

    return dispatch => {
        dispatch(basic.setOperationCategory(operationId, categoryId, formerCatId));
        backend
            .setCategoryForOperation(operationId, serverCategoryId)
            .then(() => {
                dispatch(success.setOperationCategory(operationId, categoryId, formerCatId));
            })
            .catch(err => {
                dispatch(fail.setOperationCategory(err, operationId, categoryId, formerCatId));
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
        backend
            .setCustomLabel(operation.id, serverCustomLabel)
            .then(() => {
                dispatch(success.setCustomLabel(operation, customLabel));
            })
            .catch(err => {
                dispatch(fail.setCustomLabel(err, operation, customLabel, formerCustomLabel));
            });
    };
}

export function mergeOperations(toKeep, toRemove) {
    assertHas(toKeep, 'id');
    assertHas(toRemove, 'id');

    return dispatch => {
        dispatch(basic.mergeOperations(toKeep, toRemove));
        backend
            .mergeOperations(toKeep.id, toRemove.id)
            .then(newToKeep => {
                dispatch(success.mergeOperations(newToKeep, toRemove));
            })
            .catch(err => {
                dispatch(fail.mergeOperations(err, toKeep, toRemove));
            });
    };
}

export function createOperation(operation) {
    return dispatch => {
        dispatch(basic.createOperation(operation));
        backend
            .createOperation(operation)
            .then(created => {
                dispatch(success.createOperation(created));
            })
            .catch(err => {
                dispatch(fail.createOperation(err, operation));
            });
    };
}

export function deleteOperation(operationId) {
    return dispatch => {
        dispatch(basic.deleteOperation(operationId));
        backend
            .deleteOperation(operationId)
            .then(() => {
                dispatch(success.deleteOperation(operationId));
            })
            .catch(err => {
                dispatch(fail.deleteOperation(err, operationId));
            });
    };
}

export function deleteAccess(accessId, get) {
    assert(typeof accessId === 'string', 'deleteAccess expects a string id');
    return (dispatch, getState) => {
        let accountsIds = get.accountsByAccessId(getState(), accessId).map(acc => acc.id);
        dispatch(basic.deleteAccess(accessId));
        backend
            .deleteAccess(accessId)
            .then(() => {
                dispatch(success.deleteAccess(accessId, accountsIds));
            })
            .catch(err => {
                dispatch(fail.deleteAccess(err, accessId));
            });
    };
}

export function deleteAccount(accountId) {
    assert(typeof accountId === 'string', 'deleteAccount expects a string id');

    return dispatch => {
        dispatch(basic.deleteAccount(accountId));
        backend
            .deleteAccount(accountId)
            .then(() => {
                dispatch(success.deleteAccount(accountId));
            })
            .catch(err => {
                dispatch(fail.deleteAccount(err, accountId));
            });
    };
}

export function resyncBalance(accountId) {
    assert(typeof accountId === 'string', 'resyncBalance expects a string id');

    return dispatch => {
        dispatch(basic.resyncBalance(accountId));
        backend
            .resyncBalance(accountId)
            .then(initialAmount => {
                dispatch(success.resyncBalance(accountId, initialAmount));
            })
            .catch(err => {
                dispatch(fail.resyncBalance(err, accountId));
            });
    };
}

export function runOperationsSync(accessId) {
    return dispatch => {
        dispatch(basic.runOperationsSync());
        backend
            .getNewOperations(accessId)
            .then(results => {
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
        backend
            .getNewAccounts(accessId)
            .then(results => {
                dispatch(success.runAccountsSync(accessId, results));
            })
            .catch(err => {
                dispatch(fail.runAccountsSync(err));
            });
    };
}

export function setDefaultAccountId(accountId) {
    assert(typeof accountId === 'string', 'accountId must be a string');
    return dispatch => {
        dispatch(basic.setDefaultAccountId(accountId));
        backend
            .saveSetting('defaultAccountId', accountId)
            .then(() => {
                dispatch(success.setDefaultAccountId(accountId));
            })
            .catch(err => {
                dispatch(fail.setDefaultAccountId(err, accountId));
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
        case Errors.ACTION_NEEDED:
            alert($t('client.sync.action_needed'));
            break;
        case Errors.BANK_ALREADY_EXISTS:
            alert($t('client.sync.bank_already_exists'));
            break;
        default:
            genericErrorHandler(err);
            break;
    }
}

// Handle any synchronization error, after the first one.
function handleSyncError(err) {
    switch (err.code) {
        case Errors.INVALID_PASSWORD:
            alert($t('client.sync.wrong_password'));
            break;
        case Errors.NO_PASSWORD:
            alert($t('client.sync.no_password'));
            break;
        default:
            handleFirstSyncError(err);
            break;
    }
}

// Accesses
function updateAccessesMap(state, update) {
    return u.updateIn('accessesMap', update, state);
}

function addAccess(state, access) {
    assert(
        typeof access.id === 'string',
        'The second parameter of addAccess should have a string id'
    );
    // First add the aceess to the access map
    let newState = updateAccessesMap(state, { [access.id]: new Access(access, all(state), []) });
    newState = u.updateIn('accesses', [access.id].concat(getAccesses(newState)), newState);
    return sortAccesses(newState);
}

function updateAccess(state, accessId, update) {
    assert(
        typeof accessId === 'string',
        'The second parameter of updateAccess should be a string id'
    );
    return updateAccessesMap(state, { [accessId]: update });
}

function removeAccess(state, accessId) {
    assert(
        typeof accessId === 'string',
        'The second parameter of updateAccess should be a string id'
    );
    let access = accessById(state, accessId);
    let newState = access.accounts.reduce((st, accId) => {
        return removeAccount(st, accId);
    }, state);
    newState = updateAccessesMap(newState, u.omit(accessId));
    return u.updateIn('accesses', u.reject(accessId), newState);
}

// Accounts
function addAccounts(state, accounts) {
    let accs = accounts instanceof Array ? accounts : [accounts];
    accs.forEach(account => {
        assert(
            typeof account.id === 'string',
            'The second parameter of addAccount should have a string id'
        );
    });
    let accountsMapUpdate = {};
    let accIds = [];
    for (let account of accs) {
        let access = accessById(state, account.bankAccess);

        // Only add account if it exists.
        if (!access.accounts.includes(account.id)) {
            accountsMapUpdate[account.id] = new Account(
                account,
                state.constants.defaultCurrency,
                []
            );
            accIds.push(account.id);
        }
    }

    let newState = updateAccountsMap(state, accountsMapUpdate);

    let access = accessById(newState, accs[0].bankAccess);
    return updateAccessesMap(newState, {
        [access.id]: { accounts: sortAccountsById(newState, accIds.concat(access.accounts)) }
    });
}

function accountByNumber(state, accountNumber) {
    for (let accId in state.accountsMap) {
        if (state.accountsMap[accId].accountNumber === accountNumber) {
            return state.accountsMap[accId];
        }
    }
    return null;
}

function sortAccountsById(state, accountsIds) {
    return accountsIds
        .map(id => accountById(state, id))
        .sort(compareAccounts)
        .map(acc => acc.id);
}

export function updateAccount(state, accountId, update) {
    return updateAccountsMap(state, { [accountId]: update });
}

function updateAccountsMap(state, update) {
    return u.updateIn('accountsMap', update, state);
}

export function removeAccount(state, accountId) {
    assert(
        typeof accountId === 'string',
        'second parameter of updateOperation should be a string id'
    );
    let account = accountById(state, accountId);
    // First remove the attached operations from the opeartion map.
    let newState = updateOperationsMap(state, u.omit(account.operations));

    // Then remove the account from the access.
    newState = updateAccess(newState, account.bankAccess, {
        accounts: u.reject(id => id === accountId)
    });

    // Remove access if no more account in the access.
    newState =
        accountsByAccessId(state, account.bankAccess).length === 0
            ? removeAccess(state, account.bankAccess)
            : newState;

    // Finally, remove the account from the account's map
    return updateAccountsMap(newState, u.omit(accountId));
}

// Operations
export function updateOperationsMap(state, update) {
    return u.updateIn('operationsMap', update, state);
}

export function addOperation(state, operation) {
    assert(
        typeof operation.id === 'string',
        '"operation" parameter of addOperation must have an id'
    );
    let account = accountByNumber(state, operation.bankAccount);
    assert(
        account !== null,
        '"operation" parameter of addOperation must be attached to an existing account'
    );

    // Add the operation to the state.
    let newState = updateOperationsMap(state, { [operation.id]: new Operation(operation) });

    let operationIds = [operation.id].concat(account.operations.slice());
    operationIds = sortOperationsById(newState, operationIds);

    return updateAccount(newState, account.id, {
        operations: operationIds,
        balance: account.balance + operation.amount
    });
}

export function addOperations(state, operations) {
    operations.forEach(op => {
        assert(typeof op.id === 'string', '"operation" parameter of addOperation must have an id');
    });
    let accountMap = new Map();
    let operationMapUpdate = {};
    for (let op of operations) {
        if (accountMap.has(op.bankAccount)) {
            accountMap.get(op.bankAccount).push(op.id);
        } else {
            accountMap.set(op.bankAccount, [op.id]);
        }
        operationMapUpdate[op.id] = new Operation(op);
    }
    // Add the operations to their map.
    let newState = updateOperationsMap(state, operationMapUpdate);

    let accountsMapUpdate = {};
    for (let [bankAccount, opIds] of accountMap.entries()) {
        let account = accountByNumber(newState, bankAccount);
        accountsMapUpdate[account.id] = {
            operations: sortOperationsById(newState, opIds.concat(account.operations)),
            balance: opIds.reduce(
                (bal, id) => bal + operationById(newState, id).amount,
                account.balance
            )
        };
    }
    return updateAccountsMap(newState, accountsMapUpdate);
}

function sortOperationsById(state, opIds) {
    return opIds.sort((id1, id2) => {
        return compareOperations(operationById(state, id1), operationById(state, id2));
    });
}

export function updateOperation(state, operationId, update) {
    assert(
        typeof operationId === 'string',
        'second parameter of updateOperation should be a string id'
    );
    let op = operationById(state, operationId);
    assert(op !== null, `You are trying to update an unknown operation with id "${operationId}"`);
    return updateOperationsMap(state, { [operationId]: update });
}

export function removeOperation(state, operationId) {
    assert(
        typeof operationId === 'string',
        'second parameter of removeOperation should be a string id'
    );

    let op = operationById(state, operationId);
    let account = accountByNumber(state, op.bankAccount);
    let newState = updateAccount(state, account.id, {
        operations: u.reject(id => id === operationId),
        balance: account.balance - op.amount
    });

    return updateOperationsMap(newState, u.omit(`${operationId}`));
}

export function createAccess(get, uuid, login, password, fields) {
    return dispatch => {
        dispatch(basic.createAccess(uuid, login, fields));
        backend
            .createAccess(uuid, login, password, fields)
            .then(results => {
                dispatch(success.createAccess(uuid, login, fields, results));
            })
            .catch(err => {
                dispatch(fail.createAccess(err));
            });
    };
}

export function createAlert(newAlert) {
    return dispatch => {
        dispatch(basic.createAlert(newAlert));
        backend
            .createAlert(newAlert)
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
        backend
            .updateAlert(alertId, attributes)
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
        backend
            .deleteAlert(alertId)
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

    return updateOperation(state, action.operationId, { categoryId });
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

    return updateOperation(state, action.operationId, { type });
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

    return updateOperation(state, action.operation.id, { customLabel });
}

function sortAccesses(state) {
    // It is necessary to copy the array, otherwise the sort operation will be applied
    // directly to the state, which is forbidden (raises TypeError).
    let accesses = getAccesses(state).slice();
    let defaultAccountId = getDefaultAccountId(state);
    let defaultAccess = accessByAccountId(state, defaultAccountId);
    let defaultAccessId = defaultAccess ? defaultAccess.id : '';
    let sorted = accesses
        .map(id => accessById(state, id))
        .sort((a, b) => {
            // First display the access with default account.
            if (a.id === defaultAccessId) {
                return -1;
            }
            if (b.id === defaultAccessId) {
                return 1;
            }
            // Then display active accounts.
            if (a.enabled !== b.enabled) {
                return a.enabled ? -1 : 1;
            }
            // Finally order accesses by alphabetical order.
            return localeComparator(a.name.replace(' ', ''), b.name.replace(' ', ''));
        })
        .map(access => access.id);
    return u({ accesses: sorted }, state);
}

function finishSync(state, results) {
    let newState = state;
    let { accounts, newOperations } = results;

    assert(
        maybeHas(results, 'accounts') || maybeHas(results, 'operations'),
        'should have something to update'
    );

    if (typeof accounts !== 'undefined') {
        newState = addAccounts(state, accounts);

        // Load a pair of current access/account, after the initial creation load.
        if (newState.currentAccountId === null) {
            assertHas(results, 'accessId');
            let { accessId } = results;

            newState = u(
                {
                    currentAccessId: accessId,
                    currentAccountId: accounts[0].id
                },
                newState
            );
        }
    }

    if (typeof newOperations !== 'undefined') {
        newState = addOperations(newState, newOperations);
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
        return u.updateIn('operations', updateMapIf('id', action.toKeep.id, newKept), ret);
    }

    return state;
}

function reduceCreateOperation(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { operation } = action;

        return addOperation(state, operation);
    }

    return state;
}

function reduceDeleteOperation(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let { operationId } = action;
        return removeOperation(state, operationId);
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

function reduceDeleteAccount(state, action) {
    let { accountId, status } = action;

    if (status === SUCCESS) {
        let ret = removeAccount(state, accountId);

        // Maybe the current access has been destroyed (if the account was the
        // last one) and we need to find a new one.
        let formerAccessId = accountById(state, accountId).bankAccess;
        let formerAccess = accessById(ret, formerAccessId);
        let formerAccessStillExists = formerAccess !== null;

        let currentAccessId = null;
        let currentAccountId = null;
        if (formerAccessStillExists) {
            currentAccessId = formerAccessId;
            currentAccountId = formerAccess.accounts[0];
        } else {
            // Either there is another access and we take it and its first
            // account; or there is nothing, and the user must create a new
            // access.
            let otherAccessId = ret.accesses.length ? ret.accesses[0] : null;
            if (otherAccessId) {
                currentAccessId = otherAccessId;
                currentAccountId = accountsByAccessId(ret, currentAccessId)[0];
            }
            // otherwise let them be null.
        }

        ret = u(
            {
                currentAccessId,
                currentAccountId
            },
            ret
        );

        // Reset defaultAccountId if necessary.
        if (accountId === getDefaultAccountId(ret)) {
            ret = u({ defaultAccountId: DefaultSettings.get('defaultAccountId') }, ret);
        }

        // Sort again accesses in case the default account is also deleted.
        return sortAccesses(ret);
    }

    return state;
}

function reduceDeleteAccess(state, action) {
    let { accessId, status } = action;

    if (status === SUCCESS) {
        // Remove associated accounts.
        let ret = removeAccess(state, accessId);

        // Update current access and account, if necessary.
        if (getCurrentAccessId(state) === accessId) {
            let currentAccessId = ret.accesses.length ? ret.accesses[0] : null;
            let currentAccountId = accessById(ret, currentAccessId).accounts[0];

            ret = u(
                {
                    currentAccessId,
                    currentAccountId
                },
                ret
            );
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

        if (fields.length) {
            access.customFields = fields;
        }

        let newState = addAccess(state, access);
        return finishSync(newState, results);
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

    let { accessId } = action;

    assertHas(action, 'newFields');
    let newState = updateAccess(state, accessId, action.newFields);

    if (typeof action.results !== 'undefined') {
        newState = finishSync(newState, action.results);
    }
    // Sort accesses in case an access is enabled.
    return sortAccesses(newState);
}

function reduceCreateAlert(state, action) {
    let { status } = action;

    if (status === SUCCESS) {
        let a = new Alert(action.alert);
        return u(
            {
                alerts: [a].concat(state.alerts)
            },
            state
        );
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
        return u(
            {
                alerts: u.reject(a => a.id === alertId)
            },
            state
        );
    }

    return state;
}

// Reducers on external actions.
function reduceDeleteCategory(state, action) {
    if (action.status !== SUCCESS) {
        return state;
    }

    let { id, replaceByCategoryId } = action;

    return u.updateIn(
        'operations',
        updateMapIf('categoryId', id, { categoryId: replaceByCategoryId }),
        state
    );
}

function reduceSetDefaultAccount(state, action) {
    if (action.status === SUCCESS) {
        let newState = u({ defaultAccountId: action.accountId }, state);
        return sortAccesses(newState);
    }

    return state;
}

// Initial state.
const bankState = u(
    {
        // A list of the banks.
        banks: [],
        accesses: [], // Array of accesses ids
        accessesMap: {}, // { accessId: access }
        accountsMap: {},
        operationsMap: {},
        accounts: [],
        operations: [],
        alerts: [],
        currentAccessId: null,
        currentAccountId: null
    },
    {}
);

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
    DISABLE_ACCESS: reduceUpdateAccess,
    MERGE_OPERATIONS: reduceMergeOperations,
    RUN_ACCOUNTS_SYNC: reduceRunAccountsSync,
    RUN_BALANCE_RESYNC: reduceResyncBalance,
    RUN_OPERATIONS_SYNC: reduceRunOperationsSync,
    SET_DEFAULT_ACCOUNT: reduceSetDefaultAccount,
    SET_OPERATION_CATEGORY: reduceSetOperationCategory,
    SET_OPERATION_CUSTOM_LABEL: reduceSetOperationCustomLabel,
    SET_OPERATION_TYPE: reduceSetOperationType,
    UPDATE_ALERT: reduceUpdateAlert,
    UPDATE_ACCESS: reduceUpdateAccess
};

export const reducer = createReducerFromMap(bankState, reducers);

// Helpers.
function compareAccounts(acc1, acc2) {
    return localeComparator(acc1.title, acc2.title);
}
function sortAccounts(accounts) {
    accounts.sort(compareAccounts);
}

function compareOperations(a, b) {
    let ad = +a.date,
        bd = +b.date;
    if (ad < bd) {
        return 1;
    }
    if (ad > bd) {
        return -1;
    }
    let ac = a.customLabel && a.customLabel.trim().length ? a.customLabel : a.title;
    let bc = b.customLabel && b.customLabel.trim().length ? b.customLabel : b.title;
    return localeComparator(ac, bc);
}

function sortOperations(ops) {
    // Sort by -date first, then by +title/customLabel.
    ops.sort(compareOperations);
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

    let operations = allOperations.map(op => new Operation(op));
    sortOperations(operations);

    let accounts = allAccounts.map(a => new Account(a, defaultCurrency, operations));
    sortAccounts(accounts);

    let accountsMap = accounts.reduce((map, acc) => {
        map[acc.id] = acc;
        return map;
    }, {});

    let accessesArray = allAccesses.map(a => new Access(a, banks, accounts));

    let accessesMap = accessesArray.reduce((map, acc) => {
        map[acc.id] = acc;
        return map;
    }, {});

    let accesses = sortAccesses({
        accesses: allAccesses.map(acc => acc.id),
        accountsMap,
        defaultAccountId,
        accessesMap
    }).accesses;

    let operationsMap = operations.reduce((map, op) => {
        map[op.id] = op;
        return map;
    }, {});

    let alerts = allAlerts.map(al => new Alert(al));

    // Ui sub-state.
    let currentAccountId = null;
    let currentAccessId = null;

    if (defaultAccountId && accountsMap[defaultAccountId]) {
        currentAccountId = defaultAccountId;
        currentAccessId = accountsMap[defaultAccountId].bankAccess;
    } else if (accesses.length) {
        currentAccessId = accesses[0];
        currentAccountId = accessesMap[currentAccessId].accounts[0];
    }

    /*
    out: for (let access of accesses) {
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
    }*/

    return u(
        {
            banks,
            accesses,
            accessesMap,
            accountsMap,
            operationsMap,
            accounts,
            operations,
            alerts,
            currentAccessId,
            currentAccountId,
            constants: {
                defaultCurrency
            },
            defaultAccountId
        },
        {}
    );
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
    let candidate = state.accessesMap[accessId];
    return typeof candidate !== 'undefined' ? candidate : null;
}

export function accountById(state, accountId) {
    let candidate = state.accountsMap[accountId];
    return typeof candidate !== 'undefined' ? candidate : null;
}

export function accessByAccountId(state, accountId) {
    let account = accountById(state, accountId);
    if (account === null) {
        return null;
    }
    return accessById(state, account.bankAccess);
}

export function accountsByAccessId(state, accessId) {
    let access = accessById(state, accessId);
    return access !== null ? access.accounts : [];
}

export function operationById(state, operationId) {
    let candidate = state.operationsMap[operationId];
    return typeof candidate !== 'undefined' ? candidate : null;
}

export function operationsByAccountId(state, accountId) {
    let account = accountById(state, accountId);
    return account !== null ? account.operations : [];
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

export function getDefaultAccountId(state) {
    return state.defaultAccountId;
}
