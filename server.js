require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os'); // để lấy IP LAN
const connectDB = require('./database/db');

// Import các routes
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const authRoutes = require('./routes/auth.routes');
const heroBannerRoutes = require('./routes/heroBanner.routes');

// Kết nối đến Database
connectDB();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // cho phép các thiết bị trong LAN truy cập

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Đăng ký các routes API
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hero-banners', heroBannerRoutes);

// Route phục vụ file HTML
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Hàm lấy IP LAN
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
    return 'localhost';
}

// Start server
app.listen(PORT, HOST, () => {
    const localIP = getLocalIP();
    console.log(`✅ Server chạy LAN tại: http://${localIP}:${PORT}`);
});
