import { PureComponent } from 'react';

/*
 * Wrapper around components for lazy loading
 * Adapted from https://reacttraining.com/react-router/web/guides/code-splitting
 *
 * IMPORTANT: This LazyLoader can handle only a single component. This means it
 * won't work if you update the `load` prop after building it. This is enforced
 * by throwing an exception.
 */
export default class LazyLoader extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            mod: null
        };
    }

    componentWillMount() {
        this.load(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.load !== this.props.load) {
            throw 'Not implemented, see LazyLoader component docstring.';
        }
    }

    load(props) {
        props.load(mod => {
            this.setState({
                // handle both ES imports and CommonJS
                mod: mod.default ? mod.default : mod
            });
        });
    }

    render() {
        return (
            this.state.mod ?
            this.props.children(this.state.mod) :
            null
        );
    }
}
