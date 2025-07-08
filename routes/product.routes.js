// MinoriTest-main/routes/product.routes.js

const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
// [SỬA] Import middleware upload sản phẩm
const { productUpload } = require('../middleware/upload');

// Các route CRUD cơ bản
router.get('/', ProductController.getAllProducts);

// [SỬA] Thêm middleware 'productUpload' để xử lý multipart/form-data
router.post('/', productUpload, ProductController.createProduct);

router.get('/:id', ProductController.getProductById);

// [SỬA] Thêm middleware 'productUpload' để xử lý multipart/form-data
router.put('/:id', productUpload, ProductController.updateProduct);

router.delete('/:id', ProductController.deleteProduct);

// Dòng này phải có ở cuối file
module.exports = router;