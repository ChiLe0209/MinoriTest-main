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
        const { ten_hang, ma_hang, thuong_hieu, danh_muc, mo_ta_chi_tiet, variants } = req.body;
        const variantsData = JSON.parse(variants); // Dữ liệu variant được gửi dưới dạng chuỗi JSON

        // Xử lý file ảnh
        if (!req.files || !req.files.hinh_anh_bia) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ảnh bìa.' });
        }
        
        const hinh_anh_bia_path = '/uploads/' + req.files.hinh_anh_bia[0].filename;

        // Gán ảnh cho từng biến thể
        const variantImages = req.files.variant_images || [];
        const updatedVariants = variantsData.map((variant, index) => {
            if (variantImages[index]) {
                return {
                    ...variant,
                    image: '/uploads/' + variantImages[index].filename
                };
            }
            return variant; // Giữ nguyên nếu không có ảnh mới
        });

        const newProduct = new Product({
            ten_hang, ma_hang, thuong_hieu, danh_muc, mo_ta_chi_tiet,
            hinh_anh_bia: hinh_anh_bia_path,
            variants: updatedVariants
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('LỖI CREATE PRODUCT:', error);
        res.status(500).json({ message: 'Lỗi khi tạo sản phẩm', error: error.message });
    }
}

async function updateProduct(req, res) {
    try {
        const { ten_hang, ma_hang, thuong_hieu, danh_muc, mo_ta_chi_tiet, variants } = req.body;
        const variantsData = JSON.parse(variants);

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        
        let hinh_anh_bia_path = product.hinh_anh_bia;
        if (req.files && req.files.hinh_anh_bia) {
            hinh_anh_bia_path = '/uploads/' + req.files.hinh_anh_bia[0].filename;
            // (Tùy chọn) Xóa file ảnh bìa cũ
        }
        
        const variantImages = req.files.variant_images || [];
        const updatedVariants = variantsData.map((variant, index) => {
            if (variantImages[index]) {
                return { ...variant, image: '/uploads/' + variantImages[index].filename };
            }
            return variant;
        });

        product.ten_hang = ten_hang;
        product.ma_hang = ma_hang;
        product.thuong_hieu = thuong_hieu;
        product.danh_muc = danh_muc;
        product.mo_ta_chi_tiet = mo_ta_chi_tiet;
        product.hinh_anh_bia = hinh_anh_bia_path;
        product.variants = updatedVariants;

        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('LỖI UPDATE PRODUCT:', error);
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