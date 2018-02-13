import React from 'react';
import PropTypes from 'prop-types';

import { translate as $t, NONE_CATEGORY_ID, assert } from '../../helpers';

import ConfirmDeleteModal from '../ui/confirm-delete-modal';
import ColorPicker from '../ui/color-picker';

class CategoryListItem extends React.Component {
    constructor(props) {
        super(props);

        if (this.isCreating()) {
            assert(this.props.createCategory instanceof Function);
        } else {
            assert(this.props.updateCategory instanceof Function);
            assert(this.props.deleteCategory instanceof Function);
        }

        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleColorSave = this.handleColorSave.bind(this);
        this.handleDelete = this.handleDelete.bind(this);

        this.colorInput = null;
        this.titleInput = null;
        this.replacementSelector = null;
    }

    isEditing() {
        return typeof this.props.cat.id !== 'undefined';
    }

    isCreating() {
        return !this.isEditing();
    }

    handleKeyUp(e) {
        if (e.key === 'Enter') {
            return this.handleSave(e);
        } else if (e.key === 'Escape' && this.isEditing()) {
            e.target.value = this.props.cat.title;
        }
        return true;
    }

    handleColorSave(e) {
        if (this.isEditing() || this.titleInput.value.trim().length) {
            this.handleSave(e);
        }
    }

    handleSave(e) {
        let cat = this.props.cat;
        let title = this.titleInput.value.trim();
        let color = this.colorInput.getValue();

        if (!title || !color || (color === cat.color && title === cat.title)) {
            if (this.isEditing() && !title) {
                this.titleInput.value = this.props.cat.title;
            }

            return false;
        }

        let category = {
            title,
            color
        };

        if (this.isEditing()) {
            this.props.updateCategory(cat, category);
        } else {
            this.props.createCategory(category);
            this.titleInput.value = '';
        }

        if (e && e instanceof Event) {
            e.preventDefault();
        }
    }

    handleBlur(e) {
        if (this.isEditing()) {
            this.handleSave(e);
        }
    }

    handleDelete() {
        if (this.isEditing()) {
            this.props.deleteCategory(this.props.cat, this.replacementSelector.value);
        }
    }

    selectTitle() {
        this.titleInput.select();
    }

    render() {
        let c = this.props.cat;

        let replacementOptions = this.props.categories.filter(cat => cat.id !== c.id).map(cat => (
            <option key={cat.id} value={cat.id}>
                {cat.title}
            </option>
        ));

        replacementOptions = [
            <option key="none" value={NONE_CATEGORY_ID}>
                {$t('client.category.dont_replace')}
            </option>
        ].concat(replacementOptions);

        let rowButton;
        let maybeModal;

        if (this.isCreating()) {
            rowButton = (
                <button className="btn btn-success" onClick={this.handleSave}>
                    {$t('client.general.save')}
                </button>
            );
        } else {
            rowButton = (
                <span
                    className="fa fa-times-circle"
                    aria-label="remove"
                    data-toggle="modal"
                    data-target={`#confirmDeleteCategory${c.id}`}
                    title={$t('client.general.delete')}
                />
            );

            let refReplacementSelector = selector => {
                this.replacementSelector = selector;
            };

            let modalBody = (
                <div>
                    <div className="alert alert-info">
                        {$t('client.category.erase', { title: c.title })}
                    </div>
                    <div>
                        <select className="form-control" ref={refReplacementSelector}>
                            {replacementOptions}
                        </select>
                    </div>
                </div>
            );

            maybeModal = (
                <ConfirmDeleteModal
                    modalId={`confirmDeleteCategory${c.id}`}
                    modalBody={modalBody}
                    onDelete={this.handleDelete}
                />
            );
        }

        let refColorInput = input => {
            this.colorInput = input;
        };
        let refTitleInput = input => {
            this.titleInput = input;
        };

        let placeholder = this.props.placeholder || 'client.category.label';

        return (
            <tr key={c.id} className={this.props.className}>
                <td>
                    <ColorPicker
                        defaultValue={c.color}
                        onChange={this.handleColorSave}
                        ref={refColorInput}
                    />
                </td>
                <td>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={$t(placeholder)}
                        defaultValue={c.title}
                        onKeyUp={this.handleKeyUp}
                        onBlur={this.handleBlur}
                        ref={refTitleInput}
                    />
                </td>
                <td>
                    {rowButton}
                    {maybeModal}
                </td>
            </tr>
        );
    }
}

CategoryListItem.propTypes = {
    // The category related to this item.
    cat: PropTypes.object.isRequired,

    // The list of categories.
    categories: PropTypes.array.isRequired,

    // The method to create a category.
    createCategory: PropTypes.func,

    // The method to update a category.
    updateCategory: PropTypes.func,

    // The method to delete a category.
    deleteCategory: PropTypes.func,

    // A class name to give to the row
    className: PropTypes.string
};

export default CategoryListItem;
