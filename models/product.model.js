const mongoose = require('mongoose');

// Định nghĩa cấu trúc cho một biến thể con
const variantSchema = new mongoose.Schema({
    name: { type: String, required: true },         // Tên biến thể, ví dụ: "Dâu Chuối"
    image: { type: String, required: true },        // URL hình ảnh của riêng biến thể này
    price: { type: Number, required: true },        // Giá của biến thể
    stock: { type: Number, required: true, default: 0 }, // Tồn kho của biến thể
    sku: { type: String, trim: true }    // Mã SKU riêng (tùy chọn)
}, {
    _id: false // Không tạo _id riêng cho mỗi biến thể
});

// Cập nhật lại cấu trúc sản phẩm chính
const productSchema = new mongoose.Schema({
    ma_hang: { type: String, required: true, unique: true, trim: true },
    ten_hang: { type: String, required: true, trim: true },
    thuong_hieu: { type: String, default: '', trim: true },
    danh_muc: { type: String, required: true, trim: true },
    mo_ta_chi_tiet: { type: String, default: 'Chưa có mô tả chi tiết cho sản phẩm này.' },
    
    // [THAY ĐỔI] Thêm trường ảnh bìa, sẽ hiển thị ở trang chủ
    hinh_anh_bia: { type: String, required: true }, 

    // [THAY ĐỔI] Thêm một mảng chứa các biến thể
    variants: [variantSchema],

    // Các trường cũ này sẽ không còn cần thiết nếu mọi thông tin đều nằm trong biến thể
    // gia_ban: { type: Number, required: true, min: 0, default: 0 },
    // ton_kho: { type: Number, required: true, min: 0, default: 0 },
    // hinh_anh: { type: String, required: true },

}, {
    timestamps: true,
    collection: 'products'
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;