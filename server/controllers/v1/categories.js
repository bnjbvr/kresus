import Category from '../../models/category';
import Operation from '../../models/operation';

import { makeLogger, KError, asyncErr } from '../../helpers';

let log = makeLogger('controllers/categories');

export async function create(req, res) {
    try {
        let cat = req.body;

        // Missing parameters
        if (typeof cat.title === 'undefined') throw new KError('Missing category title', 400);
        if (typeof cat.color === 'undefined') throw new KError('Missing category color', 400);

        if (typeof cat.parentId !== 'undefined') {
            let parent = await Category.find(cat.parentId);
            if (!parent) {
                throw new KError(`Category ${cat.parentId} not found`, 404);
            }
        }
        let created = await Category.create(cat);
        res.status(200).json({
            data: {
                id: created.id
            }
        });
    } catch (err) {
        return asyncErr(res, err, 'when creating category');
    }
}

export async function preloadCategory(req, res, next, id) {
    try {
        let category;
        category = await Category.find(id);

        if (!category) throw new KError('Category not found', 404);

        req.preloaded = { category };
        return next();
    } catch (err) {
        return asyncErr(res, err, 'when preloading a category');
    }
}

export async function update(req, res) {
    try {
        let params = req.body;

        // missing parameters
        if (typeof params.title === 'undefined') throw new KError('Missing title parameter', 400);
        if (typeof params.color === 'undefined') throw new KError('Missing color parameter', 400);

        let category = req.preloaded.category;
        let newCat = await category.updateAttributes(params);
        res.status(200).json({
            data: {
                id: newCat.id
            }
        });
    } catch (err) {
        return asyncErr(res, err, 'when updating a category');
    }
}

export async function destroy(req, res) {
    try {
        let replaceby = req.body.replaceByCategoryId;
        if (typeof replaceby === 'undefined') throw new KError('Missing parameter replaceby', 400);

        let former = req.preloaded.category;

        let categoryId;
        if (replaceby.toString() !== '') {
            log.debug(`Replacing category ${former.id} by ${replaceby}...`);
            let categoryToReplaceBy = await Category.find(replaceby);
            if (!categoryToReplaceBy) {
                throw new KError('Replacement category not found', 404);
            }
            categoryId = replaceby;
        } else {
            log.debug('No replacement category, replacing by None.');
            categoryId = null;
        }

        let operations = await Operation.byCategory(former.id);
        for (let op of operations) {
            await op.updateAttributes({ categoryId });
        }

        await former.destroy();
        res.status(204).end();
    } catch (err) {
        return asyncErr(res, err, 'when deleting a category');
    }
}

export async function getAllCategories(req, res) {
    try {
        let categories = await Category.all();
        res.status(200).json({
            data: {
                categories
            }
        });
    } catch (err) {
        return asyncErr(res, err, 'when getting all categories');
    }
}

export async function getCategory(req, res) {
    try {
        res.status(200).json({
            data: {
                category: req.preloaded.category
            }
        });
    } catch (err) {
        return asyncErr(res, err, 'when getting given category');
    }
}
