import React from 'react';
import { connect } from 'react-redux';

import { actions, get } from '../../store';

import { translate as $t } from '../../helpers';

import Modal from '../ui/modal';

class DefaultParamsModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleSave = this.handleSave.bind(this);
    }

    handleSave() {
        let value = this.refs.duplicateThreshold.value;
        if (value !== this.props.threshold) {
            this.props.setThreshold(value);
            $(`#${this.props.modalId}`).modal('toggle');
        }
    }

    render() {
        let modalId = this.props.modalId;
        let modalBody = (
            <div className="form-group clearfix">
                <label
                  htmlFor="duplicateThreshold"
                  className="col-xs-4 control-label">
                    { $t('client.similarity.threshold') }
                </label>
                <div className="col-xs-8">
                    <div className="input-group">
                        <input
                          id="duplicateThreshold"
                          ref="duplicateThreshold"
                          type="number"
                          className="form-control"
                          min="0"
                          step="1"
                          defaultValue={ this.props.threshold }
                        />
                        <span className="input-group-addon">
                            { $t('client.units.hours') }
                        </span>
                    </div>
                    <span className="help-block">
                        { $t('client.similarity.help') }
                    </span>
                </div>
            </div>
        );

        let modalFooter = (
            <div>
                <input
                  type="button"
                  className="btn btn-default"
                  data-dismiss="modal"
                  value={ $t('client.general.cancel') }
                />
                <input
                  type="submit"
                  className="btn btn-success"
                  value={ $t('client.general.save') }
                  onClick={ this.handleSave }
                />
            </div>
        );

        return (
            <Modal
              modalId={ modalId }
              modalBody={ modalBody }
              modalTitle={ $t('client.general.default_parameters') }
              modalFooter={ modalFooter }
            />
        );
    }
}

DefaultParamsModal.propTypes = {
    // Unique identifier of the modal
    modalId: React.PropTypes.string.isRequired,

    // The current default threshold
    threshold: React.PropTypes.string.isRequired,

    // The function to set the default threshold to detect duplicates
    setThreshold: React.PropTypes.func.isRequired
};

const Export = connect(state => {
    return {
        threshold: get.setting(state, 'duplicateThreshold')
    };
}, dispatch => {
    return {
        setThreshold(val) {
            actions.setSetting(dispatch, 'duplicateThreshold', val);
        }
    };
})(DefaultParamsModal);

export default Export;
