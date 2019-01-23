import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { get, actions } from '../../store';
import { translate as $t } from '../../helpers';

import InOutChart from './in-out-chart';
import BalanceChart from './balance-chart';
import CategoryCharts from './category-charts';
import { MODAL_SLUG } from './default-params-modal';

import TabsContainer from '../ui/tabs.js';

const ShowParamsButton = connect(
    null,
    dispatch => {
        return {
            handleClick() {
                actions.showModal(dispatch, MODAL_SLUG);
            }
        };
    }
)(props => (
    <button className="btn" onClick={props.handleClick}>
        <span className="fa fa-cog" />
        <span>{$t('client.general.default_parameters')}</span>
    </button>
));

class ChartsComponent extends React.Component {
    makeAllChart = () => {
        return <CategoryCharts operations={this.props.operations} />;
    };

    makeBalanceChart = () => {
        return (
            <BalanceChart
                operations={this.props.operations}
                account={this.props.account}
                theme={this.props.theme}
            />
        );
    };

    makePosNegChart = () => {
        return <InOutChart accessId={this.props.account.bankAccess} />;
    };

    render() {
        const { currentAccountId } = this.props.match.params;
        const pathPrefix = '/charts';

        let tabs = new Map();
        tabs.set(`${pathPrefix}/all/${currentAccountId}`, {
            name: $t('client.charts.by_category'),
            component: this.makeAllChart
        });
        tabs.set(`${pathPrefix}/balance/${currentAccountId}`, {
            name: $t('client.charts.balance'),
            component: this.makeBalanceChart
        });
        tabs.set(`${pathPrefix}/earnings/${currentAccountId}`, {
            name: $t('client.charts.differences_all'),
            component: this.makePosNegChart
        });

        const { defaultDisplay } = this.props;

        return (
            <div className="charts">
                <p className="buttons-toolbar">
                    <ShowParamsButton />
                </p>

                <TabsContainer
                    tabs={tabs}
                    defaultTab={`${pathPrefix}/${defaultDisplay}/${currentAccountId}`}
                    selectedTab={this.props.location.pathname}
                    history={this.props.history}
                    location={this.props.location}
                />
            </div>
        );
    }
}

ChartsComponent.propTypes = {
    // The kind of chart to display: by categories, balance, or in and outs for all accounts.
    defaultDisplay: PropTypes.string.isRequired,

    // The current account.
    account: PropTypes.object.isRequired,

    // The operations for the current account.
    operations: PropTypes.array.isRequired,

    // The history object, providing access to the history API.
    // Automatically added by the Route component.
    history: PropTypes.object.isRequired,

    // Location object (contains the current path). Automatically added by react-router.
    location: PropTypes.object.isRequired,

    // The current theme.
    theme: PropTypes.string.isRequired
};

const Export = connect((state, ownProps) => {
    let accountId = ownProps.match.params.currentAccountId;
    let account = get.accountById(state, accountId);
    let operations = get.operationsByAccountId(state, accountId);
    let defaultDisplay = get.setting(state, 'defaultChartDisplayType');
    let theme = get.setting(state, 'theme');

    return {
        defaultDisplay,
        account,
        operations,
        theme
    };
})(ChartsComponent);

export default Export;
