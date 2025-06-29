require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./database/db');

// Import các routes
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const authRoutes = require('./routes/auth.routes');

// Kết nối đến Database
connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Phục vụ các file tĩnh từ thư mục 'public'
app.use(express.static('public'));

// Đăng ký các routes API - Dòng 29 sẽ nằm trong khoảng này
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Route để phục vụ file admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Lắng nghe trên cổng đã được định nghĩa
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});