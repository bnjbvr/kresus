import {
    combineReducers,
    createStore,
    applyMiddleware
} from 'redux';

import reduxThunk from 'redux-thunk';
import semver from 'semver';

import * as Bank from './banks';
import * as Category from './categories';
import * as Settings from './settings';
import * as OperationType from './operation-types';
import * as Ui from './ui';

import { NEW_STATE } from './actions';

import {
    assert,
    assertHas,
    assertDefined,
    MIN_WEBOOB_VERSION,
    normalizeVersion
} from '../helpers';

import * as backend from './backend';

import { genericErrorHandler } from '../errors';

// Augment basic reducers so that they can handle state reset:
// - if the event is a state reset, just pass the new sub-state.
// - otherwise, pass to the actual reducer.
function augmentReducer(reducer, field) {
    return (state, action) => {
        if (action.type === NEW_STATE) {
            return reducer(action.state[field], action);
        }
        return reducer(state, action);
    };
}

const rootReducer = combineReducers({
    banks: augmentReducer(Bank.reducer, 'banks'),
    categories: augmentReducer(Category.reducer, 'categories'),
    settings: augmentReducer(Settings.reducer, 'settings'),
    ui: augmentReducer(Ui.reducer, 'ui'),
    // Static information
    types: (state = {}) => state
});

// Store
export const rx = createStore(rootReducer, applyMiddleware(reduxThunk));

export const get = {

    // *** Banks **************************************************************
    // [Bank]
    banks(state) {
        assertDefined(state);
        return Bank.all(state.banks);
    },

    // String
    currentAccountId(state) {
        assertDefined(state);
        return Bank.getCurrentAccountId(state.banks);
    },

    // String
    currentAccessId(state) {
        assertDefined(state);
        return Bank.getCurrentAccessId(state.banks);
    },

    // Account
    accountById(state, accountId) {
        assertDefined(state);
        return Bank.accountById(state.banks, accountId);
    },

    accessByAccountId(state, accountId) {
        assertDefined(state);
        return Bank.accessByAccountId(state.banks, accountId);
    },

    initialAccountId(state) {
        assertDefined(state);
        let defaultAccountId = this.defaultAccountId(state);
        if (typeof defaultAccountId !== 'undefined') {
            accountLoop:
            for (let access of this.accesses(state)) {
                for (let account of this.accountsByAccessId(state, access.id)) {
                    defaultAccountId = account.id;
                    break accountLoop;
                }
            }
        }
        return defaultAccountId;
    },

    // [Access]
    accesses(state) {
        assertDefined(state);
        return Bank.getAccesses(state.banks);
    },

    // [Account]
    accountsByAccessId(state, accessId) {
        assertDefined(state);
        return Bank.accountsByAccessId(state.banks, accessId);
    },

    // [Operation]
    operationsByAccountIds(state, accountIds) {
        assertDefined(state);

        let accountIdsArray = accountIds;
        if (!(accountIdsArray instanceof Array)) {
            accountIdsArray = [accountIdsArray];
        }

        let operations = [];
        for (let accountId of accountIdsArray) {
            operations = operations.concat(Bank.operationsByAccountId(state.banks, accountId));
        }
        return operations;
    },

    // Operation
    operationById(state, id) {
        assertDefined(state);
        return Bank.operationById(state.banks, id);
    },

    // String
    defaultAccountId(state) {
        assertDefined(state);
        return Settings.getDefaultAccountId(state.settings);
    },

    // [Type]
    types(state) {
        assertDefined(state);
        return OperationType.all(state.types);
    },

    // *** UI *****************************************************************
    // { searchFields } (see ui.js)
    searchFields(state) {
        assertDefined(state);
        return Ui.getSearchFields(state.ui);
    },

    // Bool
    hasSearchFields(state) {
        assertDefined(state);
        return Ui.hasSearchFields(state.ui);
    },

    // Bool
    backgroundProcessingReason(state) {
        assertDefined(state);
        return Settings.backgroundProcessingReason(state.settings) ||
               Bank.backgroundProcessingReason(state.banks);
    },

    // *** Categories *********************************************************
    // Categories
    categories(state) {
        assertDefined(state);
        return Category.all(state.categories);
    },

    categoriesButNone(state) {
        assertDefined(state);
        return Category.allButNone(state.categories);
    },

    // Category
    categoryById(state, id) {
        assertDefined(state);
        return Category.fromId(state.categories, id);
    },

    // *** Settings ***********************************************************
    // String
    setting(state, key) {
        assertDefined(state);
        return Settings.get(state.settings, key);
    },

    // Bool
    boolSetting(state, key) {
        assertDefined(state);
        let val = this.setting(state, key);
        assert(val === 'true' || val === 'false', 'A bool setting must be true or false');
        return val === 'true';
    },

    // Bool
    isWeboobInstalled(state) {
        assertDefined(state);
        if (!this.boolSetting(state, 'weboob-installed'))
            return false;

        let version = normalizeVersion(this.setting(state, 'weboob-version'));

        return semver(version) && semver.gt(version, normalizeVersion(MIN_WEBOOB_VERSION));
    },

    // Bool
    isWeboobUpdating(state) {
        assertDefined(state);
        return Settings.isWeboobUpdating(state.settings);
    },

    // Bool
    isSendingTestEmail(state) {
        assertDefined(state);
        return Settings.isSendingTestEmail(state.settings);
    },

    // Returns [{account, alert}] of the given type.
    alerts(state, type) {
        assertDefined(state);
        return Bank.alertPairsByType(state.banks, type);
    }
};

export const actions = {

    // *** Banks **************************************************************
    runSync(dispatch) {
        assertDefined(dispatch);
        dispatch(Bank.runSync(get));
    },

    setOperationCategory(dispatch, operation, catId) {
        assertDefined(dispatch);
        dispatch(Bank.setOperationCategory(operation, catId));
    },

    setOperationType(dispatch, operation, type) {
        assertDefined(dispatch);
        dispatch(Bank.setOperationType(operation, type));
    },

    setOperationCustomLabel(dispatch, operation, label) {
        assertDefined(dispatch);
        dispatch(Bank.setOperationCustomLabel(operation, label));
    },

    mergeOperations(dispatch, toKeep, toRemove) {
        assertDefined(dispatch);
        dispatch(Bank.mergeOperations(toKeep, toRemove));
    },

    // *** Categories *********************************************************
    createCategory(dispatch, category) {
        assertDefined(dispatch);
        dispatch(Category.create(category));
    },

    updateCategory(dispatch, former, newer) {
        assertDefined(dispatch);
        dispatch(Category.update(former, newer));
    },

    deleteCategory(dispatch, former, replaceById) {
        assertDefined(dispatch);
        dispatch(Category.destroy(former, replaceById));
    },

    // *** UI *****************************************************************
    setSearchField(dispatch, key, value) {
        assertDefined(dispatch);
        dispatch(Ui.setSearchField(key, value));
    },

    setSearchFields(dispatch, map) {
        assertDefined(dispatch);
        dispatch(Ui.setSearchFields(map));
    },

    resetSearch(dispatch, displaySearch) {
        assertDefined(dispatch);
        dispatch(Ui.resetSearch(displaySearch));
    },

    toggleSearchDetails(dispatch) {
        assertDefined(dispatch);
        dispatch(Ui.toggleSearchDetails());
    },

    // *** Settings ***********************************************************
    updateWeboob(dispatch) {
        assertDefined(dispatch);
        dispatch(Settings.updateWeboob());
    },

    setSetting(dispatch, key, value) {
        assertDefined(dispatch);
        dispatch(Settings.set(key, value));
    },

    setBoolSetting(dispatch, key, value) {
        assertDefined(dispatch);
        assert(typeof value === 'boolean', 'value must be a boolean');
        this.setSetting(dispatch, key, value.toString());
    },

    sendTestEmail(dispatch, config) {
        assertDefined(dispatch);
        dispatch(Settings.sendTestEmail(config));
    },

    runAccountsSync(dispatch, accessId) {
        assertDefined(dispatch);
        dispatch(Bank.runAccountsSync(accessId));
    },

    resyncBalance(dispatch, accountId) {
        assertDefined(dispatch);
        dispatch(Bank.resyncBalance(accountId));
    },

    deleteAccount(dispatch, accountId) {
        assertDefined(dispatch);
        dispatch(Bank.deleteAccount(accountId));
    },

    createAccess(dispatch, uuid, login, password, fields) {
        assertDefined(dispatch);
        dispatch(Bank.createAccess(get, uuid, login, password, fields));
    },

    updateAccess(dispatch, accessId, login, password, customFields) {
        assertDefined(dispatch);

        assert(typeof accessId === 'string', 'second param accessId must be a string');
        assert(typeof password === 'string', 'third param must be the password');

        if (typeof login !== 'undefined') {
            assert(typeof login === 'string', 'fourth param must be the login');
        }

        if (typeof customFields !== 'undefined') {
            assert(customFields instanceof Array &&
                   customFields.every(f => assertHas(f, 'name') && assertHas(f, 'value')),
                   'if not omitted, third param must have the shape [{name, value}]');
        }

        dispatch(Settings.updateAccess(accessId, login, password, customFields));
    },

    deleteAccess(dispatch, accessId) {
        assertDefined(dispatch);
        dispatch(Bank.deleteAccess(accessId));
    },

    createOperation(dispatch, newOperation) {
        assertDefined(dispatch);
        dispatch(Bank.createOperation(newOperation));
    },

    deleteOperation(dispatch, operationId) {
        assertDefined(dispatch);
        dispatch(Bank.deleteOperation(operationId));
    },

    importInstance(dispatch, content) {
        assertDefined(dispatch);
        dispatch(Settings.importInstance(content));
    },

    exportInstance(dispatch, maybePassword) {
        assertDefined(dispatch);
        dispatch(Settings.exportInstance(maybePassword));
    },

    createAlert(dispatch, newAlert) {
        assertDefined(dispatch);
        dispatch(Bank.createAlert(newAlert));
    },

    updateAlert(dispatch, alertId, newFields) {
        assertDefined(dispatch);
        dispatch(Bank.updateAlert(alertId, newFields));
    },

    deleteAlert(dispatch, alertId) {
        assertDefined(dispatch);
        dispatch(Bank.deleteAlert(alertId));
    }
};

export const store = {};

export function init() {
    return backend.init().then(world => {
        let state = {};

        // Settings need to be loaded first, because locale information depends
        // upon them.
        assertHas(world, 'settings');
        state.settings = Settings.initialState(world.settings);

        assertHas(world, 'categories');
        state.categories = Category.initialState(world.categories);

        // Define external values for the Bank initialState:
        let external = {
            defaultCurrency: get.setting(state, 'defaultCurrency'),
            defaultAccountId: get.defaultAccountId(state)
        };

        assertHas(world, 'accounts');
        assertHas(world, 'operations');
        assertHas(world, 'alerts');
        state.banks = Bank.initialState(external, world.accounts, world.operations, world.alerts);
        state.types = OperationType.initialState();
        // The UI must be computed at the end.
        state.ui = Ui.initialState();

        return new Promise(accept => {
            accept(state);
        });
    })
    .catch(genericErrorHandler);
}
