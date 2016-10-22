import React from 'react';

import { translate as $t, NONE_CATEGORY_ID } from '../../helpers';

import ConfirmDeleteModal from '../ui/confirm-delete-modal';
import ColorPicker from '../ui/color-picker';

export default class CategoryListItem extends React.Component {

    constructor(props) {
        super(props);

        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleColorSave = this.handleColorSave.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleKeyUp(e) {
        if (e.key === 'Enter') {
            return this.handleSave(e);
        } else if (e.key === 'Escape' && this.props.cancelCreation) {
            this.props.cancelCreation(e);
        }
        return true;
    }

    handleColorSave(e) {
        if (this.props.cat.id || this.refs.title.value.trim()) {
            this.handleSave(e);
        }
    }

    handleSave(e) {
        let title = this.refs.title.value.trim();
        let color = this.refs.color.getValue();
        if (!title || !color) {
            if (!this.props.cat.id && this.props.cancelCreation) {
                this.props.cancelCreation(e);
            }

            return false;
        }

        let category = {
            title,
            color
        };

        if (this.props.cat.id) {
            this.props.updateCategory(this.props.cat, category);
        } else {
            this.props.createCategory(category);
            this.refs.title.value = '';
            if (this.props.cancelCreation) {
                this.props.cancelCreation(e);
            }
        }

        if (e) {
            e.preventDefault();
        }
    }

    handleBlur(e) {
        if (this.props.cat.id) {
            this.handleSave(e);
        }
    }

    handleDelete(e) {
        if (this.props.cat.id) {
            let replaceCategory = this.refs.replacement.value;
            this.props.deleteCategory(this.props.cat, replaceCategory);
        } else if (this.props.cancelCreation) {
            this.props.cancelCreation(e);
        }
    }

    selectTitle() {
        this.refs.title.select();
    }

    clearTitle() {
        this.refs.title.value = '';
    }

    render() {
        let c = this.props.cat;

        let replacementOptions = this.props.categories
                                    .filter(cat => cat.id !== c.id)
                                    .map(cat =>
                                        <option
                                          key={ cat.id }
                                          value={ cat.id }>
                                            { cat.title }
                                        </option>);

        replacementOptions = [
            <option key="none" value={ NONE_CATEGORY_ID }>
                { $t('client.category.dont_replace') }
            </option>
        ].concat(replacementOptions);

        let modalBody = (<div>
            <div className="alert alert-info">
                { $t('client.category.erase', { title: c.title }) }
            </div>
            <div>
                <select className="form-control" ref="replacement">
                    { replacementOptions }
                </select>
            </div>
        </div>);

        let deleteButton = (<span className="fa fa-times-circle"
          aria-label="remove"
          data-toggle="modal"
          data-target={ `#confirmDeleteCategory${c.id}` }
          title={ $t('client.general.delete') }>
        </span>);

        if (!this.props.cat.id) {
            deleteButton = (<span className="fa fa-times-circle"
              aria-label="remove"
              onClick={ this.handleDelete }
              title={ $t('client.general.delete') }>
            </span>);
        }

        return (
            <tr key={ c.id }>
                <td>
                    <ColorPicker defaultValue={ c.color }
                      onChange={ this.handleColorSave }
                      ref="color"
                    />
                </td>
                <td>
                    <input type="text" className="form-control"
                      placeholder={ $t('client.category.label') }
                      defaultValue={ c.title }
                      onKeyUp={ this.handleKeyUp }
                      onBlur={ this.handleBlur }
                      ref="title"
                    />
                </td>
                <td>
                    { deleteButton }

                    <ConfirmDeleteModal
                      modalId={ `confirmDeleteCategory${c.id}` }
                      modalBody={ modalBody }
                      onDelete={ this.handleDelete }
                    />
                </td>
            </tr>
        );
    }
}
