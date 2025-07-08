// MinoriTest-main/controllers/category.controller.js

const Category = require('../models/category.model');

/**
 * @desc    Lấy tất cả danh mục dưới dạng cây
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
    try {
        // Lấy tất cả danh mục và chuyển thành object thường để dễ thao tác
        const allCategories = await Category.find({}).lean(); 

        const categoryMap = {};
        const categoryTree = [];

        // Đưa tất cả danh mục vào một map để truy cập nhanh với key là _id
        allCategories.forEach(category => {
            categoryMap[category._id] = { ...category, children: [] };
        });

        // Xây dựng cây từ map
        allCategories.forEach(category => {
            // Nếu danh mục này có cha, hãy tìm cha của nó trong map và thêm nó vào mảng 'children' của cha
            if (category.parent && categoryMap[category.parent]) {
                categoryMap[category.parent].children.push(categoryMap[category._id]);
            } else {
                // Nếu không có cha, nó là một danh mục gốc, đưa vào cây chính
                categoryTree.push(categoryMap[category._id]);
            }
        });

        res.status(200).json(categoryTree);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh mục', error: error.message });
    }
};

/**
 * @desc    Lấy tất cả danh mục (dạng phẳng, cho admin)
 * @route   GET /api/categories/flat
 * @access  Admin
 */
const getCategoriesFlat = async (req, res) => {
     try {
        const categories = await Category.find({}).sort({ name: 1 }).populate('parent', 'name');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh mục', error: error.message });
    }
};

/**
 * @desc    Lấy chỉ các danh mục gốc (không có cha)
 * @route   GET /api/categories/roots
 * @access  Admin
 */
const getRootCategories = async (req, res) => {
    try {
        const rootCategories = await Category.find({ parent: null }).sort({ name: 1 });
        res.status(200).json(rootCategories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh mục gốc', error: error.message });
    }
};


/**
 * @desc    Tạo một danh mục mới (có thể là danh mục gốc)
 * @route   POST /api/categories
 * @access  Admin
 */
const createCategory = async (req, res) => {
    try {
        const { name, slug, parent } = req.body;
        if (!name || !slug) { return res.status(400).json({ message: 'Vui lòng cung cấp đủ Tên hiển thị và Slug.' }); }
        
        const categoryExists = await Category.findOne({ $or: [{ name }, { slug }] });
        if (categoryExists) { return res.status(400).json({ message: 'Tên hoặc Slug của danh mục đã tồn tại.' }); }

        if (parent) {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) { return res.status(400).json({ message: 'Danh mục cha không hợp lệ.' }); }
        }

        const category = new Category({ name, slug, parent: parent || null });
        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi tạo danh mục', error: error.message }); }
};

/**
 * @desc    Cập nhật một danh mục
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
const updateCategory = async (req, res) => {
    try {
        const { name, slug, parent } = req.body;
        const categoryId = req.params.id;

        if (categoryId === parent) { 
            return res.status(400).json({ message: 'Một danh mục không thể là cha của chính nó.' }); 
        }

        const categoryToUpdate = await Category.findById(categoryId);
        if (!categoryToUpdate) { return res.status(404).json({ message: 'Không tìm thấy danh mục.' }); }

        categoryToUpdate.name = name || categoryToUpdate.name;
        categoryToUpdate.slug = slug || categoryToUpdate.slug;
        
        // Cho phép cập nhật parent, bao gồm cả việc gán parent mới hoặc gỡ parent (set về null)
        if (parent !== undefined) {
            categoryToUpdate.parent = parent || null;
        }

        const updatedCategory = await categoryToUpdate.save();
        res.status(200).json(updatedCategory);
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi cập nhật danh mục', error: error.message }); }
};

/**
 * @desc    Xóa một danh mục
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category) { return res.status(404).json({ message: 'Không tìm thấy danh mục.' }); }
        
        // Giữ lại các biện pháp an toàn
        if (category.parent === null) { return res.status(400).json({ message: 'Không thể xóa danh mục gốc. Hãy xóa các danh mục con trước.' }); }
        
        const children = await Category.find({ parent: categoryId });
        if (children.length > 0) { return res.status(400).json({ message: 'Không thể xóa danh mục này vì còn danh mục con.' }); }

        // Cải tiến trong tương lai: kiểm tra xem có sản phẩm nào thuộc danh mục này không trước khi xóa.
        // const products = await Product.find({ danh_muc: category.slug });
        // if (products.length > 0) { return res.status(400).json({ message: 'Không thể xóa danh mục vì còn sản phẩm.' }); }

        await Category.findByIdAndDelete(categoryId);
        res.status(200).json({ message: 'Danh mục đã được xóa.' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server khi xóa danh mục', error: error.message }); }
};


module.exports = {
    getCategories,
    getCategoriesFlat,
    getRootCategories,
    createCategory,
    updateCategory,
    deleteCategory
};