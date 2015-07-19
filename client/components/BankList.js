import React from 'react';

// Constants
import T from './Translated';

// Global variables
import {Actions, store, State} from '../store';

// Props: bank: Bank
class BankListItemComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    onClick() {
        Actions.SelectBank(this.props.bank);
    }

    render() {
        var maybeActive = this.props.active ? "active" : "";
        return (
            <li className={maybeActive}><span><a href="#" onClick={this.onClick.bind(this)}>{this.props.bank.name}</a></span></li>
        );
    }

};

// State: [{name: bankName, id: bankId}]
export default class BankListComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            banks: []
        }
        this.listener = this._listener.bind(this);
    }

    _listener() {
        this.setState({
            active: store.getCurrentBankId(),
            banks: store.getBanks()
        });
    }

    componentDidMount() {
        store.subscribeMaybeGet(State.banks, this.listener);
    }

    componentWillUnmount() {
        store.removeListener(State.banks, this.listener);
    }

    render() {
        var banks = this.state.banks.map((bank) => {
            var active = this.state.active == bank.id;
            return (
                <BankListItemComponent key={bank.id} bank={bank} active={active} />
            )
        });

        return (
            <div className="sidebar-list">
                <ul className="sidebar-sublist">
                    <span className="topic">
                        <T k='banks.title'>Banks</T>
                    </span>
                    {banks}
                </ul>
            </div>
        );
    }
}
