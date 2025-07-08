const mongoose = require('mongoose');

// Định nghĩa cấu trúc cho một biến thể con
const variantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, trim: true }
}, {
    _id: false 
});

// Cập nhật lại cấu trúc sản phẩm chính
const productSchema = new mongoose.Schema({
    ma_hang: { type: String, required: true, unique: true, trim: true },
    ten_hang: { type: String, required: true, trim: true },
    thuong_hieu: { type: String, default: '', trim: true },
    danh_muc: { type: String, required: true, trim: true },
    mo_ta_chi_tiet: { type: String, default: 'Chưa có mô tả chi tiết cho sản phẩm này.' },
    
    hinh_anh_bia: { type: String, required: true }, 

    variants: [variantSchema],

    // [SỬA LỖI] - Giữ lại các trường cũ nhưng không bắt buộc (required)
    // để hỗ trợ các sản phẩm đã tạo trước đây.
    gia_ban: { type: Number, min: 0 },
    ton_kho: { type: Number, min: 0 },
    hinh_anh: { type: String },

}, {
    timestamps: true,
    collection: 'products'
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;