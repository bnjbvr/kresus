import { store, State } from '../../store';

import BankAccounts from './BankAccounts';
import NewBankForm from '../shared/NewBankForm';

export default class BankAccountsList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            banks: store.getBanks()
        };
        this.listener = this._listener.bind(this);
    }

    _listener() {
        this.setState({
            banks: store.getBanks()
        });
    }

    componentDidMount() {
        store.on(State.banks, this.listener);
    }

    componentWillUnmount() {
        store.removeListener(State.banks, this.listener);
    }

    render() {
        let banks = this.state.banks.map(bank => <BankAccounts key={ bank.id } bank={ bank } />);

        return (
            <div>
                <NewBankForm expanded={ false } />
                <div>
                    { banks }
                </div>
            </div>
        );
    }
}
