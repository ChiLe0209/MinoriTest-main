const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    getCategoriesFlat,
    getRootCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/category.controller');

router.route('/')
    .get(getAllCategories)
    .post(createCategory);

router.route('/flat').get(getCategoriesFlat);
router.route('/roots').get(getRootCategories);

router.route('/:id')
    .put(updateCategory)
    .delete(deleteCategory);

// Dòng này phải có
module.exports = router;