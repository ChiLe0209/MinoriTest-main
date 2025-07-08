// controllers/heroBanner.controller.js
const HeroBanner = require('../models/heroBanner.model');
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    if (!filePath) return;
    try {
        const fullPath = path.join(__dirname, '..', 'public', filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (err) {
        console.error(`Lỗi khi xóa file: ${filePath}`, err);
    }
};

exports.getAllHeroBanners = async (req, res) => {
    try {
        const banners = await HeroBanner.find({}).sort({ order: 1, createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi lấy hero banners.' }); }
};

exports.getActiveHeroBanners = async (req, res) => {
    try {
        const banners = await HeroBanner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi lấy active hero banners.' }); }
};

exports.createHeroBanner = async (req, res) => {
    try {
        const { title, link, order, isActive } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Vui lòng cung cấp hình ảnh.' });
        const newBanner = new HeroBanner({ title, link, order: Number(order) || 0, isActive: isActive === 'true', imageUrl: '/uploads/' + req.file.filename });
        await newBanner.save();
        res.status(201).json(newBanner);
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi tạo hero banner.', error: error.message }); }
};

exports.updateHeroBanner = async (req, res) => {
    try {
        const { title, link, order, isActive } = req.body;
        const banner = await HeroBanner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner.' });
        banner.title = title;
        banner.link = link;
        banner.order = Number(order) || 0;
        banner.isActive = isActive === 'true';
        if (req.file) {
            deleteFile(banner.imageUrl);
            banner.imageUrl = '/uploads/' + req.file.filename;
        }
        const updatedBanner = await banner.save();
        res.status(200).json(updatedBanner);
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi cập nhật banner.', error: error.message }); }
};

exports.deleteHeroBanner = async (req, res) => {
    try {
        const banner = await HeroBanner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner.' });
        deleteFile(banner.imageUrl);
        await HeroBanner.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Banner đã được xóa.' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi xóa banner.', error: error.message }); }
};
exports.getHeroBannerById = async (req, res) => {
    try {
        const banner = await HeroBanner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Không tìm thấy banner.' });
        }
        res.status(200).json(banner);
    } catch (error) {
        // Xử lý trường hợp ID không hợp lệ
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Không tìm thấy banner với ID không hợp lệ.' });
        }
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết hero banner.' });
    }
};