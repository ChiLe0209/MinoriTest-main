// routes/product.routes.js
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');

// Route để lấy tất cả sản phẩm (có phân trang/lọc)
router.get('/', ProductController.getAllProducts);

// Route để lấy một sản phẩm bằng ID
router.get('/:id', ProductController.getProductById);

// Các route CRUD cơ bản
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;