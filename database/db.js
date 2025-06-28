const mongoose = require('mongoose');

// Hàm để tạo các danh mục gốc nếu chúng chưa tồn tại
async function seedRootCategories() {
    try {
        // Phải require model ở đây để sử dụng
        const Category = mongoose.model('Category');

        const rootCategories = [
            { name: "Dinh dưỡng", slug: "dinh-duong", parent: null },
            { name: "Phụ kiện", slug: "phu-kien", parent: null }
        ];

        for (const cat of rootCategories) {
            const existing = await Category.findOne({ slug: cat.slug });
            if (!existing) {
                await Category.create(cat);
                console.log(`✅ Seeded root category: ${cat.name}`);
            }
        }
    } catch (error) {
        // Bỏ qua lỗi nếu model chưa sẵn sàng
        console.error('Error seeding root categories:', error.message);
    }
}


const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Chạy seed data sau khi kết nối thành công
        await seedRootCategories();

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
