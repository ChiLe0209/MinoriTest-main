// MinoriTest-main/middleware/upload.js

const multer = require('multer');
const path = require('path');

// Hàm helper để tạo nơi lưu trữ file
const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, `public/${folder}/`),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Hàm helper để lọc chỉ chấp nhận file ảnh
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
};

// Middleware cho upload sản phẩm (có nhiều trường file)
const productUpload = multer({
    storage: createStorage('uploads'),
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
}).fields([
    { name: 'hinh_anh_bia', maxCount: 1 },
    { name: 'variant_images', maxCount: 10 }
]);

// Middleware cho upload hero banner (chỉ 1 file)
const heroBannerUpload = multer({
    storage: createStorage('uploads'),
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 3 } // 3MB
}).single('hero_image');

// Export các middleware đã cấu hình để sử dụng ở các tệp routes khác
module.exports = {
    productUpload,
    heroBannerUpload
};