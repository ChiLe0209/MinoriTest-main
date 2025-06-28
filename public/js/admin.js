document.addEventListener('DOMContentLoaded', function () {
    const ADMIN_PASSWORD = "admin";
    let currentProductPage = 1;

    // --- DOM Elements ---
    const loginSection = document.getElementById('admin-login');
    const dashboardSection = document.getElementById('admin-dashboard');
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password-input');

    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const switchMode = document.getElementById('switch-mode');
    const sideMenuLinks = document.querySelectorAll('.sidebar .side-menu li a');
    const mainContents = document.querySelectorAll('.main-content');

    const totalProductsStat = document.getElementById('total-products-stat');
    const totalCategoriesStat = document.getElementById('total-categories-stat');

    const productsTableBody = document.getElementById('products-table-body');
    const productPaginationControls = document.getElementById('product-pagination-controls');
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const closeProductModalBtn = document.getElementById('close-product-modal-btn');
    const modalTitle = document.getElementById('modal-title');

    const categoriesTableBody = document.getElementById('categories-table-body');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const closeCategoryModalBtn = document.getElementById('close-category-modal-btn');
    const categoryModalTitle = document.getElementById('category-modal-title');
    const categoryDisplayNameInput = document.getElementById('category-display-name');
    const categorySlugInput = document.getElementById('category-slug');


    // --- Helper Functions ---
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    function generateSlug(str) {
        str = str.toLowerCase().trim().replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a").replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e").replace(/ì|í|ị|ỉ|ĩ/g, "i").replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o").replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u").replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        return str;
    }

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) { console.error(`Fetch error from ${url}:`, error); return null; }
    }

    async function sendData(url, method, data) {
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: data ? JSON.stringify(data) : null,
            });
            if (!response.ok && response.status !== 204) {
                const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) { alert(`Thao tác thất bại: ${error.message}`); return null; }
    }
    
    function initializeTinyMCE(content = '') {
        tinymce.get('product-mo-ta')?.remove();
        tinymce.init({
            selector: 'textarea#product-mo-ta',
            plugins: 'autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
            toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | indent outdent | bullist numlist | code | help',
            height: 300,
            setup: editor => editor.on('init', function () { this.setContent(content); })
        });
    }

    // --- UI Logic ---
    function setupDashboardUI() {
        menuToggle?.addEventListener('click', () => sidebar?.classList.toggle('hide'));
        
        switchMode?.addEventListener('change', function () {
            document.body.classList.toggle('dark', this.checked);
        });
        
        sideMenuLinks.forEach(link => {
            if (link.classList.contains('logout')) return;
            
            link.addEventListener('click', function(event) {
                event.preventDefault();
                
                const parentLi = this.parentElement;
                if (!parentLi || parentLi.classList.contains('active')) return;
                
                document.querySelectorAll('.sidebar .side-menu li').forEach(li => {
                    li.classList.remove('active');
                });
                
                parentLi.classList.add('active');
                
                const contentId = parentLi.dataset.content;
                if (contentId) {
                    mainContents.forEach(content => content.classList.add('hidden'));
                    const activeContent = document.getElementById(contentId);
                    activeContent?.classList.remove('hidden');
                }
            });
        });
    }

    // --- Render Logic (Đầy đủ) ---
    async function loadStats() {
        const productData = await fetchData('/api/products?limit=1');
        const categoryData = await fetchData('/api/categories/flat');
        if(totalProductsStat && productData) totalProductsStat.textContent = productData.totalProducts || 0;
        if(totalCategoriesStat && categoryData) totalCategoriesStat.textContent = categoryData.length || 0;
    }

const renderProductsTable = async (page = 1) => {
        const data = await fetchData(`/api/products?page=${page}&limit=10`);
        const products = data?.products || [];
        currentProductPage = data?.currentPage || 1;
        productsTableBody.innerHTML = '';

        if (products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Chưa có sản phẩm nào.</td></tr>';
            return;
        }
        
        products.forEach(p => {
            // Logic kiểm tra an toàn để lấy dữ liệu hiển thị
            const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
            let displayPrice = 0;
            let displayStock = 0;
            
            // Nếu có biến thể, lấy thông tin từ biến thể đầu tiên và tính tổng tồn kho
            if (hasVariants) {
                displayPrice = p.variants[0].price;
                displayStock = p.variants.reduce((total, v) => total + (v.stock || 0), 0);
            } else if ('gia_ban' in p) { // Nếu không, kiểm tra và lấy thông tin từ sản phẩm cũ
                displayPrice = p.gia_ban;
                displayStock = p.ton_kho;
            }

            // Ưu tiên hiển thị ảnh bìa, nếu không có thì dùng ảnh cũ (hinh_anh)
            const displayImage = p.hinh_anh_bia || p.hinh_anh || 'https://placehold.co/36x36/f3f4f6/9ca3af?text=Img';

            productsTableBody.innerHTML += `
                <tr>
                    <td>
                        <img src="${displayImage}" onerror="this.onerror=null;this.src='https://placehold.co/36x36/f3f4f6/9ca3af?text=Img';">
                        <p>${p.ten_hang}</p>
                    </td>
                    <td>${p.ma_hang}</td>
                    <td>${formatCurrency(displayPrice)}</td>
                    <td>${displayStock}</td>
                    <td>
                       <button class="action-btn edit-btn" data-id="${p._id}"><i class="ri-edit-line"></i></button>
                       <button class="action-btn delete-btn" data-id="${p._id}"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>`;
        });
        
        if (data) renderProductPagination(data.totalPages, data.currentPage);
    };

    const renderCategoriesTable = async () => {
        const categories = await fetchData('/api/categories/flat');
        categoriesTableBody.innerHTML = '';
        if (!categories || categories.length === 0) {
            categoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Chưa có danh mục nào.</td></tr>';
        } else {
            categories.forEach(cat => {
                categoriesTableBody.innerHTML += `
                    <tr>
                        <td>${cat.name}</td>
                        <td>${cat.slug}</td>
                        <td>${cat.parent?.name || '<em>-</em>'}</td>
                        <td>
                           <button class="action-btn edit-btn" data-id="${cat._id}"><i class="ri-edit-line"></i></button>
                           <button class="action-btn delete-btn" data-id="${cat._id}"><i class="ri-delete-bin-line"></i></button>
                        </td>
                    </tr>`;
            });
        }
    };
    
    function renderProductPagination(totalPages, currentPage) {
        productPaginationControls.innerHTML = '';
        if (totalPages <= 1) return;
        const createBtn = (page, content, disabled = false, active = false) => {
            const button = document.createElement('button');
            button.dataset.page = page;
            button.innerHTML = content;
            button.disabled = disabled;
            if (active) button.classList.add('active');
            button.addEventListener('click', () => renderProductsTable(page));
            return button;
        };
        productPaginationControls.appendChild(createBtn(currentPage - 1, 'Trước', currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            productPaginationControls.appendChild(createBtn(i, i, false, i === currentPage));
        }
        productPaginationControls.appendChild(createBtn(currentPage + 1, 'Sau', currentPage === totalPages));
    }

    // --- Modal & Form Logic ---
    async function populateProductCategoryDropdown(selectedSlug = '') {
        const select = document.getElementById('product-danh-muc');
        if (!select) return;
        const categories = await fetchData('/api/categories/flat');
        select.innerHTML = '<option value="">-- Chọn danh mục --</option>';
        if (categories && Array.isArray(categories)) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.slug;
                option.textContent = cat.parent ? `--- ${cat.name}` : `[CHA] ${cat.name}`;
                if (cat.slug === selectedSlug) option.selected = true;
                select.appendChild(option);
            });
        }
    }
    
    async function populateParentCategoryDropdown(selectedParentId = null) {
        const select = document.getElementById('category-parent');
        if (!select) return;
        const rootCategories = await fetchData('/api/categories/roots'); 
        select.innerHTML = '<option value="" disabled selected>-- Chọn danh mục cha --</option>';
        select.required = true;
        if (rootCategories && Array.isArray(rootCategories)) {
            rootCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat._id;
                option.textContent = cat.name;
                if (cat._id === selectedParentId) option.selected = true;
                select.appendChild(option);
            });
        }
    }

    // --- Event Listeners ---
    addCategoryBtn?.addEventListener('click', () => {
         categoryForm.reset();
         document.getElementById('category-id').value = '';
         categoryModalTitle.textContent = "Thêm Danh mục Mới";
         const parentSelect = document.getElementById('category-parent');
         parentSelect.disabled = false;
         populateParentCategoryDropdown();
         categoryModal.classList.add('show');
    });

    categoryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const parentSelect = document.getElementById('category-parent');
        if (!parentSelect.value) {
            alert('Vui lòng chọn một danh mục cha.');
            return;
        }
        const id = document.getElementById('category-id').value;
        const categoryData = {
            name: document.getElementById('category-display-name').value.trim(),
            slug: document.getElementById('category-slug').value.trim().toLowerCase(),
            parent: parentSelect.value
        };
        const response = id ? await sendData(`/api/categories/${id}`, 'PUT', categoryData) : await sendData('/api/categories', 'POST', categoryData);
        if(response) { await renderCategoriesTable(); categoryModal.classList.remove('show'); loadStats(); }
    });
    
    categoriesTableBody?.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-id]');
        if(!button) return;
        const id = button.dataset.id;
        if (button.classList.contains('delete-btn')) {
            if (confirm('Bạn chắc chắn muốn xóa danh mục này?')) {
                const response = await sendData(`/api/categories/${id}`, 'DELETE');
                if (response) { await renderCategoriesTable(); loadStats(); }
            }
        } else if (button.classList.contains('edit-btn')) {
    const p = await fetchData(`/api/products/${id}`);
    if (p) {
        modalTitle.textContent = "Chỉnh sửa sản phẩm";
        document.getElementById('product-id').value = p._id;
        document.getElementById('product-ma-hang').value = p.ma_hang;
        document.getElementById('product-ten-hang').value = p.ten_hang;
        document.getElementById('product-thuong-hieu').value = p.thuong_hieu;
        document.getElementById('product-gia-ban').value = p.gia_ban;
        document.getElementById('product-ton-kho').value = p.ton_kho;
        document.getElementById('product-hinh-anh').value = p.hinh_anh;
        await populateProductCategoryDropdown(p.danh_muc); // SỬA Ở ĐÂY
        initializeTinyMCE(p.mo_ta_chi_tiet || '');
        productModal.classList.add('show');
    }
}

    });
    
    addProductBtn?.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('product-id').value = '';
        modalTitle.textContent = "Thêm sản phẩm mới";
        initializeTinyMCE('');
        populateProductCategoryDropdown();
        productModal.classList.add('show');
    });

    closeProductModalBtn?.addEventListener('click', () => productModal.classList.remove('show'));

    productForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const productData = {
            ma_hang: document.getElementById('product-ma-hang').value,
            ten_hang: document.getElementById('product-ten-hang').value,
            thuong_hieu: document.getElementById('product-thuong-hieu').value,
            danh_muc: document.getElementById('product-danh-muc').value,
            gia_ban: parseFloat(document.getElementById('product-gia-ban').value),
            ton_kho: parseInt(document.getElementById('product-ton-kho').value, 10),
            hinh_anh: document.getElementById('product-hinh-anh').value,
            mo_ta_chi_tiet: tinymce.get('product-mo-ta')?.getContent() || '',
        };
        const response = id ? await sendData(`/api/products/${id}`, 'PUT', productData) : await sendData('/api/products', 'POST', productData);
        if (response) {
            await renderProductsTable(id ? currentProductPage : 1);
            productModal.classList.remove('show');
            loadStats();
        }
    });

    productsTableBody?.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-id]');
        if (!button) return;
        const id = button.dataset.id;
        
        if (button.classList.contains('delete-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa?')) {
                if (await sendData(`/api/products/${id}`, 'DELETE')) {
                    await renderProductsTable(currentProductPage);
                    loadStats();
                }
            }
        } else if (button.classList.contains('edit-btn')) {
            const p = await fetchData(`/api/products/${id}`);
            if (p) {
                modalTitle.textContent = "Chỉnh sửa sản phẩm";
                document.getElementById('product-id').value = p._id;
                document.getElementById('product-ma-hang').value = p.ma_hang;
                document.getElementById('product-ten-hang').value = p.ten_hang;
                document.getElementById('product-thuong-hieu').value = p.thuong_hieu;
                document.getElementById('product-gia-ban').value = p.gia_ban;
                document.getElementById('product-ton-kho').value = p.ton_kho;
                document.getElementById('product-hinh-anh').value = p.hinh_anh;
                await populateProductCategoryDropdown(p.danh_muc);

                initializeTinyMCE(p.mo_ta_chi_tiet || '');
                productModal.classList.add('show');
            }
        }
    });
    
    categoryDisplayNameInput?.addEventListener('input', () => {
        if (!document.getElementById('category-id').value) {
             categorySlugInput.value = generateSlug(categoryDisplayNameInput.value);
        }
    });

    // --- Initial Load ---
    function init() {
        loginBtn?.addEventListener('click', () => {
            if (passwordInput?.value === ADMIN_PASSWORD) {
                loginSection.style.display = 'none';
                dashboardSection.classList.remove('hidden');
                setupDashboardUI();
                loadStats();
                renderProductsTable(1);
                renderCategoriesTable();
            } else {
                alert('Mật khẩu không chính xác!');
            }
        });
        passwordInput?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });
    }

    init();
});
