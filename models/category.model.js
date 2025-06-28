const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên hiển thị của danh mục là bắt buộc.'],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: [true, 'Slug của danh mục là bắt buộc.'],
            trim: true,
            unique: true,
            lowercase: true,
        },
        // Thêm trường 'parent' để lưu danh mục cha
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Tham chiếu đến chính model Category
            default: null,   // Mặc định là null, tức là danh mục gốc
        },
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
