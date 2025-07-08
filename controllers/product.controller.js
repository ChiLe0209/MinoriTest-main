const Product = require('../models/product.model');
const Category = require('../models/category.model');
const fs = require('fs');
const path = require('path');


// Hàm helper để xóa file một cách an toàn
const deleteFile = (filePath) => {
    if (!filePath || !filePath.startsWith('/uploads/')) return;
    try {
        const fullPath = path.join(__dirname, '..', 'public', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error(`Lỗi khi xóa file: ${filePath}`, err);
    }
};

// [SỬA LỖI] - Viết lại hàm createProduct để xử lý multipart/form-data
async function createProduct(req, res) {
    try {
        // Dữ liệu text bây giờ nằm trong req.body
        const { ten_hang, ma_hang, thuong_hieu, danh_muc, mo_ta_chi_tiet, variants } = req.body;
        
        // Dữ liệu file nằm trong req.files
        if (!req.files || !req.files.hinh_anh_bia) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ảnh bìa.' });
        }
        
        const hinh_anh_bia_path = '/uploads/' + req.files.hinh_anh_bia[0].filename;
        
        // Dữ liệu variants được gửi dưới dạng chuỗi JSON, cần parse lại
        const variantsData = JSON.parse(variants);
        const variantImages = req.files.variant_images || [];
        let imageCounter = 0;

        // Gán đường dẫn ảnh mới cho các biến thể được tải lên
        const populatedVariants = variantsData.map((variant) => {
            const newVariant = { ...variant };
            // Nếu admin chọn file mới cho biến thể này
            if (variant.image === '' && variantImages[imageCounter]) {
                newVariant.image = '/uploads/' + variantImages[imageCounter].filename;
                imageCounter++;
            }
            return newVariant;
        });

        const newProduct = new Product({
            ten_hang, ma_hang, thuong_hieu, danh_muc, mo_ta_chi_tiet,
            hinh_anh_bia: hinh_anh_bia_path,
            variants: populatedVariants
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
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }
        
        // [SỬA] - BƯỚC 1: Lưu lại đường dẫn ảnh bìa cũ vào một biến tạm
        const existingCoverImage = product.hinh_anh_bia;

        // Cập nhật các trường thông tin text
        product.ten_hang = ten_hang;
        product.ma_hang = ma_hang;
        product.thuong_hieu = thuong_hieu;
        product.danh_muc = danh_muc;
        product.mo_ta_chi_tiet = mo_ta_chi_tiet;

        // [SỬA] - BƯỚC 2: Cập nhật ảnh bìa với logic mới
        if (req.files && req.files.hinh_anh_bia) {
            // Nếu có ảnh mới, cập nhật đường dẫn và xóa ảnh cũ
            deleteFile(product.hinh_anh_bia);
            product.hinh_anh_bia = '/uploads/' + req.files.hinh_anh_bia[0].filename;
        } else {
            // Nếu KHÔNG có ảnh mới, gán lại giá trị cũ một cách tường minh để đảm bảo nó không bị mất
            product.hinh_anh_bia = existingCoverImage;
        }
        
        // Kiểm tra lại lần cuối trước khi lưu
        if (!product.hinh_anh_bia) {
             return res.status(400).json({ 
                message: 'Lỗi: Không tìm thấy thông tin ảnh bìa. Vui lòng tải lên một ảnh bìa mới.' 
             });
        }

        // Xử lý các biến thể (logic này vẫn giữ nguyên)
        const variantImages = req.files.variant_images || [];
        let imageCounter = 0;
        const oldImageMap = new Map();
        if(product.variants && product.variants.length > 0) {
            product.variants.forEach(v => {
                if(v.image) oldImageMap.set(v.name, v.image);
            });
        }
        const updatedVariants = variantsData.map((variant) => {
            let newVariant = { ...variant };
            if (variant.image === '' && variantImages[imageCounter]) {
                const oldImage = oldImageMap.get(variant.name);
                if(oldImage) deleteFile(oldImage);
                newVariant.image = '/uploads/' + variantImages[imageCounter].filename;
                imageCounter++;
            }
            return newVariant;
        });
        product.variants = updatedVariants;

        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('LỖI UPDATE PRODUCT:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
    }
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
                const categoriesToSearch = [selectedCategory.slug, ...childCategories.map(cat => cat.slug)];
                query.danh_muc = { $in: categoriesToSearch };
            }
        }

        if (search) {
            const safeSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            query.$or = [ { ten_hang: { $regex: safeSearch, $options: 'i' } }, { ma_hang: { $regex: safeSearch, $options: 'i' } } ];
        }

        const skip = (page - 1) * limit;
        const [products, totalProducts] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(query)
        ]);
        const totalPages = Math.ceil(totalProducts / limit);
        res.status(200).json({ products, currentPage: page, totalPages, totalProducts });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm', error: error.message });
    }
}

async function getProductById(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) { return res.status(404).json({ message: 'Không tìm thấy sản phẩm' }); }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
}

async function deleteProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) { return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' }); }
        
        deleteFile(product.hinh_anh_bia);
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(v => deleteFile(v.image));
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Sản phẩm đã được xóa.' });
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