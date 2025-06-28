const express = require('express');
const {
    getCategories,
    getCategoriesFlat,
    getRootCategories, // Import hàm mới
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/category.controller');

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(createCategory);

router.route('/flat').get(getCategoriesFlat);
router.route('/roots').get(getRootCategories); // Thêm route mới

router.route('/:id')
    .put(updateCategory)
    .delete(deleteCategory);

module.exports = router;
