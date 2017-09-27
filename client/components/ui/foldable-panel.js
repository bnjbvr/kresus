import React from "react";
import PropTypes from "prop-types";

class FoldablePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: props.initiallyExpanded
    };

    this.handleToggleExpand = this.handleToggleExpand.bind(this);
  }

  handleToggleExpand() {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    let { expanded } = this.state;
    let { top, iconTitle, children, title } = this.props;
    let icon = expanded ? "minus" : "plus";

    // Tells whether the panel is the first component from the top of the parent component.
    let maybeTopElement = top ? "top-panel" : "";
    return (
      <div className={`${maybeTopElement} panel panel-default`}>
        <div
          className="panel-heading clickable"
          onClick={this.handleToggleExpand}
        >
          <h3 className="title panel-title">{title}</h3>

          <div className="panel-options">
            <span
              className={`option-legend fa fa-${icon}-square`}
              aria-label={iconTitle}
              title={iconTitle}
            />
          </div>
        </div>
        <div className="panel-body" hidden={!expanded}>
          {children}
        </div>
      </div>
    );
  }
}

FoldablePanel.propTypes = {
  // A boolean saying if the panel should or not be expanded at first render.
  initiallyExpanded: PropTypes.bool,

  // The title of the panel.
  title: PropTypes.string.isRequired,

  // The title to be displayed when the cursor is over the +/- icon.
  iconTitle: PropTypes.string,

  // Tells wether the panel is the top element of the containing div.
  top: PropTypes.bool
};

FoldablePanel.defaultProps = {
  initiallyExpanded: false,
  top: false
};

export default FoldablePanel;
