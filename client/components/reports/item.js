import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';

import { formatDate, NONE_CATEGORY_ID, translate as $t } from '../../helpers';
import { get } from '../../store';
import TransactionUrls from '../transactions/urls';

import LabelComponent from './label';
import DisplayIf, { IfNotMobile } from '../ui/display-if';
import OperationTypeSelect from './editable-type-select';
import CategorySelect from './editable-category-select';

import withLongPress from '../ui/longpress';

const BudgetIcon = props => {
    if (+props.budgetDate === +props.date) {
        return null;
    }
    let budgetIcon, budgetTitle;
    if (+props.budgetDate < +props.date) {
        budgetIcon = 'fa-calendar-minus-o';
        budgetTitle = $t('client.operations.previous_month_budget');
    } else {
        budgetIcon = 'fa-calendar-plus-o';
        budgetTitle = $t('client.operations.following_month_budget');
    }

    return <i className={`operation-assigned-to-budget fa ${budgetIcon}`} title={budgetTitle} />;
};

// As the Operation component is meant to be passed to the withLongPress HOC,
// it has to be non functional.
/* eslint-disable react/prefer-stateless-function */
class Operation extends React.PureComponent {
    handleToggleBulkEdit = () => {
        this.props.toggleBulkItem(this.props.operationId);
    };

    render() {
        let op = this.props.operation;

        let rowClassName = op.amount > 0 ? 'income' : '';

        let maybeBorder;
        if (this.props.categoryColor) {
            maybeBorder = { borderRight: `5px solid ${this.props.categoryColor}` };
        }

        return (
            <tr style={maybeBorder} className={rowClassName}>
                <IfNotMobile>
                    <td className="modale-button">
                        <DisplayIf condition={!this.props.inBulkEditMode}>
                            <Link
                                to={TransactionUrls.details.url(op.id)}
                                title={$t('client.operations.show_details')}>
                                <span className="fa fa-plus-square" />
                            </Link>
                        </DisplayIf>
                        <DisplayIf condition={this.props.inBulkEditMode}>
                            <input
                                onChange={this.handleToggleBulkEdit}
                                checked={this.props.bulkEditStatus}
                                type="checkbox"
                            />
                        </DisplayIf>
                    </td>
                </IfNotMobile>
                <td className="date">
                    <span>{formatDate.toShortDayMonthString(op.date)}</span>
                    <IfNotMobile>
                        <BudgetIcon budgetDate={op.budgetDate} date={op.date} />
                    </IfNotMobile>
                </td>
                <IfNotMobile>
                    <td className="type">
                        <OperationTypeSelect
                            operationId={op.id}
                            value={op.type}
                            className="light"
                        />
                    </td>
                </IfNotMobile>

                <td>
                    <LabelComponent item={op} inputClassName="light" />
                </td>
                <td className="amount">{this.props.formatCurrency(op.amount)}</td>
                <IfNotMobile>
                    <td className="category">
                        <CategorySelect
                            operationId={op.id}
                            value={op.categoryId}
                            className="light"
                        />
                    </td>
                </IfNotMobile>
            </tr>
        );
    }
}

const ConnectedOperation = connect(
    (state, props) => {
        let operation = get.operationById(state, props.operationId);
        let categoryColor =
            operation.categoryId !== NONE_CATEGORY_ID
                ? get.categoryById(state, operation.categoryId).color
                : null;
        return {
            operation,
            categoryColor,
            isMobile: props.isMobile,
        };
    },
    null,
    null,
    { forwardRef: true }
)(Operation);
/* eslint-enable react/prefer-stateless-function */

ConnectedOperation.propTypes = {
    // The operation's unique identifier this item is representing.
    operationId: PropTypes.number.isRequired,

    // A method to compute the currency.
    formatCurrency: PropTypes.func.isRequired,

    // Is on mobile view.
    isMobile: PropTypes.bool,

    // Is this operation checked for bulk edit.
    bulkEditStatus: PropTypes.bool,
};

ConnectedOperation.defaultProps = {
    isMobile: false,
};

export const OperationItem = ConnectedOperation;

const OperationWithLongPress = withLongPress(ConnectedOperation);

export const PressableOperationItem = props => {
    const { operationId } = props;
    const history = useHistory();

    const onLongPress = useCallback(() => history.push(TransactionUrls.details.url(operationId)), [
        history,
        operationId,
    ]);
    return <OperationWithLongPress {...props} onLongPress={onLongPress} />;
};
