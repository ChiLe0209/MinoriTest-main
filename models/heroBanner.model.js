// models/heroBanner.model.js
const mongoose = require('mongoose');

const HeroBannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề là bắt buộc.'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Hình ảnh là bắt buộc.']
    },
    link: {
        type: String,
        default: '#'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HeroBanner', HeroBannerSchema);