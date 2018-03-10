import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { translate as $t } from '../../../helpers';
import { get, actions } from '../../../store';

import { registerModal } from '../../ui/new-modal';
import ModalContent from '../../ui/modal-content';
import CancelAndDelete from '../../ui/modal-cancel-and-delete-button';

const MODAL_SLUG = 'confirm-delete-alert';

const ConfirmDeleteModal = connect(
    state => {
        let modalState = get.modal(state).state;
        return {
            type: modalState.type,
            alertId: modalState.alertId
        };
    },
    dispatch => {
        return {
            makeHandleDelete(alertId) {
                actions.deleteAlert(dispatch, alertId);
            }
        };
    },
    ({ alertId, type }, { makeHandleDelete }) => {
        return {
            type,
            handleDelete() {
                makeHandleDelete(alertId);
            }
        };
    }
)(props => {
    return (
        <ModalContent
            title={$t('client.confirmdeletemodal.title')}
            body={$t(`client.settings.emails.delete_${props.type}_full_text`)}
            footer={<CancelAndDelete onClickDelete={props.handleDelete} />}
        />
    );
});

registerModal(MODAL_SLUG, <ConfirmDeleteModal />);

const DeleteAlertButton = connect(null, (dispatch, props) => {
    return {
        handleClick() {
            actions.showModal(dispatch, MODAL_SLUG, { alertId: props.alertId, type: props.type });
        }
    };
})(props => {
    return (
        <span
            className="pull-right fa fa-times-circle"
            aria-label="remove alert/report"
            onClick={props.handleClick}
            title={$t(`client.settings.emails.delete_${props.type}`)}
        />
    );
});

DeleteAlertButton.propTypes = {
    // The account's unique id
    alertId: PropTypes.string.isRequired,

    // The type of alert
    type: PropTypes.oneOf(['alert', 'report']).isRequired
};

export default DeleteAlertButton;
