import React from 'react';
import { connect } from 'react-redux';

import { translate as $t } from '../../../helpers';
import { actions, get } from '../../../store';

import DeleteAccountButton from './confirm-delete-account';
import AddOperationModal from './add-operation-modal';
import SyncAccountButton from './sync-account-balance-modal';

const formatIBAN = function(iban) {
    return iban.replace(/(.{4})(?!$)/g, '$1\xa0');
};

export default connect(
    (state, props) => {
        return {
            isDefaultAccount: get.defaultAccountId(state) === props.account.id
        };
    },
    (dispatch, props) => {
        return {
            handleDeleteAccount: () => {
                actions.deleteAccount(dispatch, props.account.id);
            },
            handleSetDefault: () => {
                actions.setDefaultAccountId(dispatch, props.account.id);
            }
        };
    }
)(props => {
    let a = props.account;

    let label = a.iban ? `${a.title} (IBAN\xa0:\xa0${formatIBAN(a.iban)})` : a.title;

    let selected;
    let setDefaultAccountTitle;

    if (props.isDefaultAccount) {
        setDefaultAccountTitle = '';
        selected = 'fa-star';
    } else {
        setDefaultAccountTitle = $t('client.settings.set_default_account');
        selected = 'fa-star-o';
    }

    // Show the balance sync button only if the related access is enabled.
    let maybeResyncIcon = null;
    if (props.enabled) {
        maybeResyncIcon = <SyncAccountButton accountId={a.id} />;
    }

    return (
        <tr key={`settings-bank-accesses-account-${a.id}`}>
            <td>
                <span
                    className={`clickable fa ${selected}`}
                    aria-hidden="true"
                    onClick={props.handleSetDefault}
                    title={setDefaultAccountTitle}
                />
            </td>
            <td>{label}</td>
            <td>
                <DeleteAccountButton accountId={a.id} />
                <span
                    className="pull-right fa fa-plus-circle"
                    aria-label="Add an operation"
                    data-toggle="modal"
                    data-target={`#addOperation${a.id}`}
                    title={$t('client.settings.add_operation')}
                />
                {maybeResyncIcon}

                <AddOperationModal account={a} modalId={`addOperation${a.id}`} />
            </td>
        </tr>
    );
});
