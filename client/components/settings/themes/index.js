import React from 'react';
import { connect } from 'react-redux';

import { translate as $t } from '../../../helpers';
import { get, actions } from '../../../store';

const ThemesSection = connect(
    state => {
        return {
            themes: get.themes(state),
            currentTheme: get.setting(state, 'theme')
        };
    },
    dispatch => {
        return {
            changeTheme(theme) {
                actions.setSetting(dispatch, 'theme', theme);
            }
        };
    }
)(props => {
    let handleThemeChange = event => props.changeTheme(event.target.value);

    let maybeWarning = null;
    if (props.themes.length < 2) {
        maybeWarning = <p className="alert alert-warning">{$t('client.settings.themes.none')}</p>;
    }

    let options = props.themes.map(t => {
        return (
            <option value={t} key={t}>
                {t}
            </option>
        );
    });

    return (
        <form className="top-panel">
            <div className="form-group">
                {maybeWarning}

                <div className="row">
                    <label className="col-xs-4 control-label">
                        {$t('client.settings.themes.choose')}
                    </label>
                    <div className="col-xs-8">
                        <select
                            className="form-control"
                            defaultValue={props.currentTheme}
                            onChange={handleThemeChange}>
                            {options}
                        </select>
                    </div>
                </div>
            </div>
        </form>
    );
});

export default ThemesSection;
