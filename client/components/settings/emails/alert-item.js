import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { assert, translate as $t } from '../../../helpers';
import { actions, get } from '../../../store';

import ConfirmDeleteModal from '../../ui/confirm-delete-modal';
import AmountInput from '../../ui/amount-input';

class AlertItem extends React.Component {
    // TODO hoist this logic in the above component.
    handleSelect = event => {
        let newValue = event.target.value;
        if (newValue === this.props.alert.order) {
            return;
        }
        this.props.update({ order: newValue });
    };

    handleChangeLimit = value => {
        if (Math.abs(value - this.props.alert.limit) <= 0.001) {
            return;
        }
        this.props.update({ limit: value });
    };

    render() {
        let { account, alert, access } = this.props;
        let { limit, type, id } = alert;

        assert(alert.order === 'gt' || alert.order === 'lt');

        return (
            <tr>
                <td className="col-md-3">{`${access.name} − ${account.title}`}</td>
                <td className="col-md-3">
                    <span className="condition">{this.props.sendIfText}</span>
                </td>
                <td className="col-md-5">
                    <div className="form-inline pull-right">
                        <div className="form-group">
                            <select
                                className="form-control"
                                defaultValue={alert.order}
                                onChange={this.handleSelect}>
                                <option value="gt">
                                    {$t('client.settings.emails.greater_than')}
                                </option>
                                <option value="lt">{$t('client.settings.emails.less_than')}</option>
                            </select>
                        </div>

                        <div className="input-group input-group-money">
                            <AmountInput
                                defaultValue={Math.abs(limit)}
                                initiallyNegative={limit < 0 && type === 'balance'}
                                onInput={this.handleChangeLimit}
                                togglable={type === 'balance'}
                                signId={`alert-limit-sign-${id}`}
                            />
                            <span className="input-group-addon">{account.currencySymbol}</span>
                        </div>
                    </div>
                </td>
                <td className="col-md-1">
                    <span
                        className="pull-right fa fa-times-circle"
                        aria-label="remove"
                        data-toggle="modal"
                        data-target={`#confirmDeleteAlert${alert.id}`}
                        title={$t('client.settings.emails.delete_alert')}
                    />

                    <ConfirmDeleteModal
                        modalId={`confirmDeleteAlert${alert.id}`}
                        modalBody={$t('client.settings.emails.delete_alert_full_text')}
                        onDelete={this.props.handleDelete}
                    />
                </td>
            </tr>
        );
    }
}

AlertItem.propTypes = {
    // Description of the type of alert
    sendIfText: PropTypes.string.isRequired,

    // The alert
    alert: PropTypes.object.isRequired,

    // The account for which the alert is configured
    account: PropTypes.object.isRequired,

    // The alert update function
    update: PropTypes.func.isRequired,

    // The alert deletion function
    handleDelete: PropTypes.func.isRequired,

    // The bank access to which is attached the account of the alert
    access: PropTypes.object.isRequired
};

export default connect(
    (state, ownProps) => {
        let access = get.accessById(state, ownProps.account.bankAccess);
        return { access };
    },
    (dispatch, props) => {
        return {
            update(newFields) {
                actions.updateAlert(dispatch, props.alert.id, newFields);
            },
            handleDelete() {
                actions.deleteAlert(dispatch, props.alert.id);
            }
        };
    }
)(AlertItem);
