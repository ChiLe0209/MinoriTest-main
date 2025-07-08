// MinoriTest-main/routes/heroBanner.routes.js

const express = require('express');
const router = express.Router();
const HeroBannerController = require('../controllers/heroBanner.controller');
const { heroBannerUpload } = require('../middleware/upload'); // Giả sử middleware đã có

router.get('/active', HeroBannerController.getActiveHeroBanners);

router.route('/')
    .get(HeroBannerController.getAllHeroBanners)
    .post(heroBannerUpload, HeroBannerController.createHeroBanner);

// THÊM .get() VÀO ĐÂY
router.route('/:id')
    .get(HeroBannerController.getHeroBannerById) // Dòng được thêm vào
    .put(heroBannerUpload, HeroBannerController.updateHeroBanner)
    .delete(HeroBannerController.deleteHeroBanner);

// Dòng này phải có ở cuối file
module.exports = router;