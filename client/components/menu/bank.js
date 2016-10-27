import React from 'react';
import { connect } from 'react-redux';

import { get } from '../../store';
import { translate as $t } from '../../helpers';

import AccountListItem from './account';

function computeTotal(operations, initial) {
    let total = operations.reduce((a, b) => a + b.amount, initial);
    return Math.round(total * 100) / 100;
}

class BankListItemComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showAccounts: this.props.active
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState({
            showAccounts: !this.state.showAccounts
        });
    }

    render() {
        let total = this.props.total;
        let totalElement;

        if (total !== null) {
            let color = this.props.totalPositive ? 'positive' : 'negative';
            totalElement = (
                <span className={ `amount ${color}` }>
                    { total }
                </span>
            );
        } else {
            totalElement = (
                <span title={ $t('client.menu.different_currencies') }>N/A</span>
            );
        }

        let accountsElements;
        if (this.state.showAccounts) {
            accountsElements = this.props.accounts.map(acc => (
                <AccountListItem
                  key={ acc.id }
                  account={ acc }
                  balance={ this.props.accountsBalances.get(acc.id) }
                  active={ this.props.activeAccountId === acc.id }
                />
            ));
        }

        let stateLabel = this.state.showAccounts ? 'minus' : 'plus';

        return (
            <li key={ `bank-details bank-list-item-${this.props.access.id}` }
              className={ this.props.active ? 'active' : '' }>
                <div className={ `icon icon-${this.props.access.uuid}` } />
                <div className="bank-name">
                    <a href="#" onClick={ this.handleClick }>
                        <span>{ this.props.access.name }</span>
                        <span className={ `bank-details-toggle fa fa-${stateLabel}-square` }></span>
                    </a>
                    <a href="#" className="bank-sum">
                        <span>Total</span>
                        { totalElement }
                    </a>
                </div>
                <ul className={ `accounts` }>
                    { accountsElements }
                </ul>
            </li>
        );
    }
}

BankListItemComponent.propTypes = {
    // the bank object
    access: React.PropTypes.object.isRequired,

    // Whether the bank is the current bank selected
    active: React.PropTypes.bool.isRequired
};

const Export = connect((state, props) => {
    let accountsBalances = new Map();
    let currentCurrency = null;
    let sameCurrency = true;
    let formatCurrency;
    let total = 0;

    let accounts = get.accountsByAccessId(state, props.access.id);
    for (let acc of accounts) {
        let balance = computeTotal(get.operationsByAccountIds(state, acc.id), acc.initialAmount);
        total += balance;
        accountsBalances.set(acc.id, balance);

        if (currentCurrency && (currentCurrency !== acc.currency))
            sameCurrency = false;

        currentCurrency = acc.currency;
        formatCurrency = formatCurrency || acc.formatCurrency;
    }

    total = parseFloat(total.toFixed(2));

    // formatCurrency might be undefined when creating a bank access
    if (sameCurrency && !formatCurrency) {
        formatCurrency = val => val;
    }

    return {
        accounts,
        accountsBalances,
        total: sameCurrency ? formatCurrency(total) : null,
        totalPositive: total >= 0,
        activeAccountId: get.currentAccountId(state)
    };
}, null)(BankListItemComponent);

export default Export;
