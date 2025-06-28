const Product = require('../models/product.model');
const Category = require('../models/category.model');

function escapeRegex(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

async function getAllProducts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const categorySlug = req.query.category;
        const search = req.query.search;
        const query = {};

        if (categorySlug && categorySlug !== 'all') {
            const selectedCategory = await Category.findOne({ slug: categorySlug });
            if (selectedCategory) {
                const childCategories = await Category.find({ parent: selectedCategory._id });
                const childCategorySlugs = childCategories.map(cat => cat.slug);
                const categoriesToSearch = [selectedCategory.slug, ...childCategorySlugs];
                query.danh_muc = { $in: categoriesToSearch };
            }
        }

        if (search) {
            const safeSearch = escapeRegex(search.trim());
            if (safeSearch) {
                query.$or = [
                    { ten_hang: { $regex: safeSearch, $options: 'i' } },
                    { ma_hang: { $regex: safeSearch, $options: 'i' } },
                    { thuong_hieu: { $regex: safeSearch, $options: 'i' } }
                ];
            }
        }

        const skip = (page - 1) * limit;
        const [products, totalProducts] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(query)
        ]);
        const totalPages = Math.ceil(totalProducts / limit);
        res.status(200).json({ products, currentPage: page, totalPages, totalProducts });
    } catch (error) {
        console.error('--- LỖI KHI LẤY SẢN PHẨM ---', error);
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm', error: error.message });
    }
}

async function getProductById(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
}

// [CẬP NHẬT] - Thêm log chi tiết để gỡ lỗi
async function createProduct(req, res) {
    try {
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        // In ra toàn bộ thông tin lỗi để chẩn đoán
        console.error('--- LỖI KHI TẠO SẢN PHẨM (CREATEPRODUCT) ---');
        console.error('Dữ liệu nhận được (req.body):', JSON.stringify(req.body, null, 2));
        console.error('Đối tượng lỗi chi tiết từ Mongoose:', error);
        
        res.status(500).json({ message: 'Lỗi khi tạo sản phẩm', error: error.message });
    }
}

async function updateProduct(req, res) {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(updatedProduct);
    } catch (error) {
        // Thêm log chi tiết cho cả hàm cập nhật
        console.error('--- LỖI KHI CẬP NHẬT SẢN PHẨM (UPDATEPRODUCT) ---');
        console.error('Dữ liệu nhận được (req.body):', JSON.stringify(req.body, null, 2));
        console.error('Đối tượng lỗi chi tiết từ Mongoose:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
    }
}

async function deleteProduct(req, res) {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa sản phẩm', error: error.message });
    }
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};