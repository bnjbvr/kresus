import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

// Duration of a long press in ms
const LONG_PRESS_DURATION = 500;

function withLongPress(WrappedComponent) {
    class WithLongPressComponent extends React.Component {
        constructor(props) {
            super(props);

            this.element = null;
            this.timer = null;
            this.pressStart = 0;

            this.onPressStart = this.onPressStart.bind(this);
            this.onPressEnd = this.onPressEnd.bind(this);
            this.onContextMenu = this.onContextMenu.bind(this);
        }

        onContextMenu(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        onPressStart(event) {
            clearTimeout(this.timer);
            this.pressStart = Date.now();
            this.timer = setTimeout(this.props.onLongPress, LONG_PRESS_DURATION);
            event.target.addEventListener('touchend', this.onPressEnd);
            event.target.addEventListener('touchmove', this.onPressEnd);
            event.target.addEventListener('touchcancel', this.onPressEnd);
            event.target.addEventListener('contextmenu', this.onContextMenu);
        }

        onPressEnd(event) {
            // Prevent clicks to happen after a long press
            if (event.type === 'touchend' && Date.now() - this.pressStart > LONG_PRESS_DURATION) {
                event.preventDefault();
            }

            event.target.removeEventListener('touchend', this.onPressEnd);
            event.target.removeEventListener('touchmove', this.onPressEnd);
            event.target.removeEventListener('touchcancel', this.onPressEnd);
            event.target.removeEventListener('contextmenu', this.onContextMenu);

            clearTimeout(this.timer);
            this.pressStart = 0;
        }

        componentDidMount() {
            ReactDOM.findDOMNode(this.element).addEventListener('touchstart', this.onPressStart);
        }

        componentWillUnMount() {
            let domElement = ReactDOM.findDOMNode(this.element);
            domElement.removeEventListener('touchstart', this.onPressStart);
            domElement.removeEventListener('touchend', this.onPressEnd);
            domElement.removeEventListener('touchmove', this.onPressEnd);
            domElement.removeEventListener('touchcancel', this.onPressEnd);
            domElement.removeEventListener('contextmenu', this.onContextMenu);
        }

        render() {
            let refComponent = node => {
                this.element = node;
            };

            return <WrappedComponent {...this.props} ref={refComponent} />;
        }
    }

    WithLongPressComponent.propTypes = {
        // The callback called when a longpress occurred on the component.
        onLongPress: PropTypes.func.isRequired
    };

    return WithLongPressComponent;
}

export default withLongPress;
