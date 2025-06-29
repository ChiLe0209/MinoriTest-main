// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// Dòng số 5: Gọi đến router và sử dụng hàm login từ AuthController
router.post('/login', AuthController.login);

module.exports = router;