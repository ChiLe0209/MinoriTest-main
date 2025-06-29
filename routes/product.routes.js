const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const upload = require('../middleware/upload'); // Import upload instance

// Định nghĩa các trường file sẽ được tải lên
const productUploadHandler = upload.fields([
    { name: 'hinh_anh_bia', maxCount: 1 },
    { name: 'variant_images', maxCount: 10 } // Tên này phải khớp với FormData ở frontend
]);

// GET all và POST (có xử lý file)
router.route('/')
    .get(ProductController.getAllProducts)
    .post(productUploadHandler, ProductController.createProduct);

// GET, PUT (có xử lý file), DELETE
router.route('/:id')
    .get(ProductController.getProductById)
    .put(productUploadHandler, ProductController.updateProduct)
    .delete(ProductController.deleteProduct);

module.exports = router;