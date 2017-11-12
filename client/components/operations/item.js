import React from 'react';
import PropTypes from 'prop-types';

import { formatDate } from '../../helpers';

import LabelComponent from './label';

import OperationTypeSelect from './editable-type-select';
import CategorySelect from './editable-category-select';

// As the Operation component is meant to be passed to the withLongPress HOC,
// it has to be non functional.
/* eslint-disable react/prefer-stateless-function */
class Operation extends React.PureComponent {
    render() {
        let op = this.props.operation;

        let rowClassName = op.amount > 0 ? 'success' : '';

        let typeSelect = <OperationTypeSelect operationId={op.id} selectedValue={op.type} />;

        let categorySelect = <CategorySelect operationId={op.id} selectedValue={op.categoryId} />;

        return (
            <tr className={rowClassName}>
                <td className="hidden-xs">
                    <a onClick={this.props.onOpenModal}>
                        <i className="fa fa-plus-square" />
                    </a>
                </td>
                <td>{formatDate.toShortString(op.date)}</td>
                <td className="hidden-xs">{typeSelect}</td>
                <td>
                    <LabelComponent operation={op} />
                </td>
                <td className="text-right">{this.props.formatCurrency(op.amount)}</td>
                <td className="hidden-xs">{categorySelect}</td>
            </tr>
        );
    }
}
/* eslint-enable react/prefer-stateless-function */

Operation.propTypes = {
    // The operation this item is representing.
    operation: PropTypes.object.isRequired,

    // A method to compute the currency.
    formatCurrency: PropTypes.func.isRequired
};

export default Operation;
