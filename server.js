// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./database/db');

// Import các routes
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');

// Kết nối đến Database
connectDB();

const app = express();

// --- DÒNG NÀY CỰC KỲ QUAN TRỌNG KHI DEPLOY ---
// Nó sẽ lấy cổng (port) mà Render cung cấp qua biến môi trường.
// Nếu không có (khi chạy ở máy bạn), nó sẽ mặc định là 8000.
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Phục vụ các file tĩnh từ thư mục 'public'
app.use(express.static('public'));

// Đăng ký các routes API
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Route để phục vụ file admin.html khi người dùng truy cập /admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Lắng nghe trên cổng đã được định nghĩa
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});