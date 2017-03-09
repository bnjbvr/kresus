import React from 'react';
import Dygraph from 'dygraphs';

import { debug, round2 } from '../../helpers';

import ChartComponent from './chart-base';

function createChartBalance(chartId, account, operations) {

    if (account === null) {
        debug('ChartComponent: no account');
        return;
    }

    let ops = operations.slice().sort((a, b) => +a.date - +b.date);

    function makeKey(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    let opmap = new Map;

    // Fill all dates.
    const DAY = 1000 * 60 * 60 * 24;

    let firstDate = ops.length ? +ops[0].date : Date.now();
    firstDate = (firstDate / DAY | 0) * DAY;

    let today = (Date.now() / DAY | 0) * DAY;
    for (; firstDate <= today; firstDate += DAY) {
        opmap.set(makeKey(new Date(firstDate)), 0);
    }

    // Date (day) -> cumulated sum of amounts for this day (scalar).
    for (let o of ops) {
        let key = makeKey(o.date);
        if (opmap.has(key))
            opmap.set(key, opmap.get(key) + o.amount);
    }

    let balance = account.initialAmount;
    let csv = 'Date,Balance\n';
    for (let [date, amount] of opmap) {
        balance += amount;
        csv += `${date},${round2(balance)}\n`;
    }

    /* eslint-disable no-new */

    // Create the chart
    new Dygraph(document.querySelector(chartId), csv, {
        axes: {
            x: {
                axisLabelFormatter: date => {
                    // Undefined means the default locale
                    let defaultLocale;
                    return date.toLocaleDateString(defaultLocale, {
                        year: '2-digit',
                        month: 'short'
                    });
                }
            }
        }
    });

    /* eslint-enable no-new */
}

export default class BalanceChart extends ChartComponent {

    redraw() {
        createChartBalance('#barchart', this.props.account, this.props.operations);
    }

    render() {
        return (<div
          id="barchart"
          style={ { width: '100%' } }
        />);
    }
}
