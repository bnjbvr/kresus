import React from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';

import { translate as $t, formatDate } from '../../helpers';

import { get } from '../../store';

import InfiniteList from '../ui/infinite-list';
import withLongPress from '../ui/longpress';

import AmountWell from './amount-well';
import DetailsModal from './details';
import SearchComponent from './search';
import OperationItem from './item';
import SyncButton from './sync-button';

// Infinite list properties.
const OPERATION_BALLAST = 10;

const PressableOperationItem = withLongPress(OperationItem);

// Keep in sync with style.css.
function computeOperationHeight(isSmallScreen) {
    return isSmallScreen ? 41 : 55;
}

class OperationsComponent extends React.Component {
    detailsModal = null;
    operationTable = null;
    tableCaption = null;
    thead = null;

    constructor(props) {
        super(props);
        this.operationHeight = computeOperationHeight(this.props.isSmallScreen);
    }

    selectModalOperation = operationId => {
        this.detailsModal.setOperationId(operationId);
    };

    // Implementation of infinite list.
    renderItems = (low, high) => {
        return this.props.filteredOperationIds.slice(low, high).map(id => {
            // TODO : Get rid of this as it is the main rendering bottleneck in the list.
            let handleOpenModal = () => this.selectModalOperation(id);
            return (
                <PressableOperationItem
                    key={id}
                    operationId={id}
                    formatCurrency={this.props.account.formatCurrency}
                    onOpenModal={handleOpenModal}
                    onLongPress={handleOpenModal}
                />
            );
        });
    };

    computeHeightAbove = () => {
        return this.heightAbove;
    };

    getOperationHeight = () => {
        return this.operationHeight;
    };

    getNumItems = () => {
        return this.props.filteredOperationIds.length;
    };
    // End of implementation of infinite list.

    refDetailsModal = node => {
        this.detailsModal = node;
    };

    refOperationTable = node => {
        this.operationTable = node;
    };

    refTableCaption = node => {
        this.tableCaption = node;
    };

    refThead = node => {
        this.thead = node;
    };

    componentDidMount() {
        // Called after first render => safe to use findDOMNode.
        let heightAbove = ReactDOM.findDOMNode(this.operationTable).offsetTop;
        heightAbove += ReactDOM.findDOMNode(this.tableCaption).scrollHeight;
        heightAbove += ReactDOM.findDOMNode(this.thead).scrollHeight;
        this.heightAbove = heightAbove;
        this.operationHeight = computeOperationHeight(this.props.isSmallScreen);
    }

    render() {
        let asOf = $t('client.operations.as_of');
        let lastCheckedDate = formatDate.toShortString(this.props.account.lastChecked);
        let lastCheckDate = `${asOf} ${lastCheckedDate}`;

        let { balance, formatCurrency } = this.props.account;

        return (
            <div>
                <DetailsModal ref={this.refDetailsModal} formatCurrency={formatCurrency} />

                <div className="operation-wells">
                    <AmountWell
                        className="amount-well-balance"
                        icon="balance-scale"
                        title={$t('client.operations.current_balance')}
                        subtitle={lastCheckDate}
                        content={formatCurrency(balance)}
                    />

                    <AmountWell
                        className="amount-well-received"
                        icon="arrow-down"
                        title={$t('client.operations.received')}
                        subtitle={this.props.filteredSub}
                        content={this.props.positiveSum}
                    />

                    <AmountWell
                        className="amount-well-spent"
                        icon="arrow-up"
                        title={$t('client.operations.spent')}
                        subtitle={this.props.filteredSub}
                        content={this.props.negativeSum}
                    />

                    <AmountWell
                        className="amount-well-saved"
                        icon="database"
                        title={$t('client.operations.saved')}
                        subtitle={this.props.filteredSub}
                        content={this.props.wellSum}
                    />
                </div>

                <SearchComponent />

                <table
                    className="operation-table table table-hover table-bordered"
                    ref={this.refOperationTable}>
                    <caption ref={this.refTableCaption}>
                        {/* captions cannot be set a 'display: flex' so a div child is used here */}
                        <div>
                            <h3>{$t('client.operations.title')}</h3>
                            <SyncButton account={this.props.account} />
                        </div>
                    </caption>
                    <thead ref={this.refThead}>
                        <tr>
                            <th className="modale-button" />
                            <th className="date">{$t('client.operations.column_date')}</th>
                            <th className="type">{$t('client.operations.column_type')}</th>
                            <th>{$t('client.operations.column_name')}</th>
                            <th className="amount">{$t('client.operations.column_amount')}</th>
                            <th className="category">{$t('client.operations.column_category')}</th>
                        </tr>
                    </thead>
                    <InfiniteList
                        ballast={OPERATION_BALLAST}
                        getNumItems={this.getNumItems}
                        getItemHeight={this.getOperationHeight}
                        getHeightAbove={this.computeHeightAbove}
                        renderItems={this.renderItems}
                        containerId="content"
                    />
                </table>
            </div>
        );
    }
}

function filter(state, operationsIds, search) {
    function contains(where, substring) {
        return where.toLowerCase().indexOf(substring) !== -1;
    }

    function filterIf(condition, array, callback) {
        if (condition) {
            return array.filter(callback);
        }
        return array;
    }

    // TODO : Use a better cache.
    let filtered = operationsIds.map(id => get.operationById(state, id));

    // Filter! Apply most discriminatory / easiest filters first
    filtered = filterIf(search.categoryId !== '', filtered, op => {
        return op.categoryId === search.categoryId;
    });

    filtered = filterIf(search.type !== '', filtered, op => {
        return op.type === search.type;
    });

    filtered = filterIf(search.amountLow !== null, filtered, op => {
        return op.amount >= search.amountLow;
    });

    filtered = filterIf(search.amountHigh !== null, filtered, op => {
        return op.amount <= search.amountHigh;
    });
    filtered = filterIf(search.dateLow !== null, filtered, op => {
        return op.date >= search.dateLow;
    });

    filtered = filterIf(search.dateHigh !== null, filtered, op => {
        return op.date <= search.dateHigh;
    });

    filtered = filterIf(search.keywords.length > 0, filtered, op => {
        for (let str of search.keywords) {
            if (
                !contains(op.raw, str) &&
                !contains(op.title, str) &&
                (op.customLabel === null || !contains(op.customLabel, str))
            ) {
                return false;
            }
        }
        return true;
    });
    filtered = filtered.map(op => op.id);

    return filtered;
}

// Returns operation ids.
function filterOperationsThisMonth(state, operationsId) {
    let now = new Date();
    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth();
    return operationsId.filter(id => {
        let op = get.operationById(state, id);
        return (
            op.budgetDate.getFullYear() === currentYear && op.budgetDate.getMonth() === currentMonth
        );
    });
}

function computeTotal(state, format, filterFunction, operationIds) {
    let total = operationIds
        .map(id => get.operationById(state, id))
        .filter(filterFunction)
        .reduce((a, b) => a + b.amount, 0);
    return format(Math.round(total * 100) / 100);
}

const Export = connect((state, ownProps) => {
    let accountId = ownProps.match.params.currentAccountId;
    let account = get.accountById(state, accountId);
    let operationIds = get.operationIdsByAccountId(state, accountId);
    let hasSearchFields = get.hasSearchFields(state);
    let filteredOperationIds = get.hasSearchFields(state)
        ? filter(state, operationIds, get.searchFields(state))
        : operationIds;

    let wellOperationIds, filteredSub;
    if (hasSearchFields) {
        wellOperationIds = filteredOperationIds;
        filteredSub = $t('client.amount_well.current_search');
    } else {
        wellOperationIds = filterOperationsThisMonth(state, operationIds);
        filteredSub = $t('client.amount_well.this_month');
    }

    let format = account.formatCurrency;

    let positiveSum = computeTotal(state, format, x => x.amount > 0, wellOperationIds);
    let negativeSum = computeTotal(state, format, x => x.amount < 0, wellOperationIds);
    let wellSum = computeTotal(state, format, () => true, wellOperationIds);

    return {
        account,
        filteredOperationIds,
        hasSearchFields,
        filteredSub,
        wellSum,
        positiveSum,
        negativeSum
    };
})(OperationsComponent);

export default Export;
