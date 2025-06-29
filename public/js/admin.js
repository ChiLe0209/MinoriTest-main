document.addEventListener('DOMContentLoaded', function () {
    let currentProductPage = 1;

    // === LẤY CÁC PHẦN TỬ DOM ===
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
    const modalTitle = document.getElementById('modal-title');
    const variantsListContainer = document.getElementById('variants-list-container');
    const addVariantBtn = document.getElementById('add-variant-btn');
    const categoriesTableBody = document.getElementById('categories-table-body');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const categoryModalTitle = document.getElementById('category-modal-title');
    const categoryDisplayNameInput = document.getElementById('category-display-name');
    const categorySlugInput = document.getElementById('category-slug');

    // === CÁC HÀM TIỆN ÍCH ===
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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
    async function sendData(url, method, data, isFormData = false) {
        try {
            const options = {
                method,
                body: isFormData ? data : JSON.stringify(data),
            };
            if (!isFormData) {
                options.headers = { 'Content-Type': 'application/json' };
            }
            const response = await fetch(url, options);
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

    // === CÁC HÀM CHÍNH ===
    function setupDashboardUI() {
        menuToggle?.addEventListener('click', () => sidebar?.classList.toggle('hide'));
        switchMode?.addEventListener('change', function () { document.body.classList.toggle('dark', this.checked); });
        sideMenuLinks.forEach(link => {
            if (link.classList.contains('logout')) return;
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const parentLi = this.parentElement;
                if (!parentLi || parentLi.classList.contains('active')) return;
                document.querySelectorAll('.sidebar .side-menu li').forEach(li => li.classList.remove('active'));
                parentLi.classList.add('active');
                const contentId = parentLi.dataset.content;
                if (contentId) {
                    mainContents.forEach(content => content.classList.add('hidden'));
                    document.getElementById(contentId)?.classList.remove('hidden');
                }
            });
        });
    }

    function createVariantForm(variant = null) {
        const variantId = Date.now();
        const variantGroup = document.createElement('div');
        variantGroup.className = 'variant-form-group';
        variantGroup.dataset.id = variantId;
        variantGroup.innerHTML = `<button type="button" class="btn-remove-variant" title="Xóa biến thể này">&times;</button><div class="form-grid"><div class="form-group"><label>Tên biến thể</label><input type="text" class="variant-name" value="${variant?.name || ''}" required></div><div class="form-group"><label>Mã SKU (tùy chọn)</label><input type="text" class="variant-sku" value="${variant?.sku || ''}"></div><div class="form-group"><label>Giá</label><input type="number" class="variant-price" value="${variant?.price || 0}" required></div><div class="form-group"><label>Tồn kho</label><input type="number" class="variant-stock" value="${variant?.stock || 0}" required></div><div class="form-group full-width"><label>Hình ảnh biến thể</label><input type="file" class="variant-image-input" accept="image/*" data-preview-for="${variantId}"><img class="image-preview" id="preview-${variantId}" src="${variant?.image || '#'}" alt="Xem trước" style="${variant?.image ? 'display:block' : 'display:none'}"/></div></div>`;
        variantGroup.querySelector('.btn-remove-variant').addEventListener('click', () => variantGroup.remove());
        variantsListContainer.appendChild(variantGroup);
    }

    async function loadStats() {
        const productData = await fetchData('/api/products?limit=1');
        const categoryData = await fetchData('/api/categories/flat');
        if (totalProductsStat && productData) totalProductsStat.textContent = productData.totalProducts || 0;
        if (totalCategoriesStat && categoryData) totalCategoriesStat.textContent = categoryData.length || 0;
    }

    const renderProductsTable = async (page = 1) => {
        currentProductPage = page;
        const data = await fetchData(`/api/products?page=${page}&limit=10`);
        const products = data?.products || [];
        if (!productsTableBody) return;
        productsTableBody.innerHTML = '';
        if (products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Chưa có sản phẩm nào.</td></tr>';
            return;
        }
        products.forEach(p => {
            const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
            let displayPrice = 0, displayStock = 0;
            if (hasVariants) {
                displayPrice = p.variants[0].price;
                displayStock = p.variants.reduce((total, v) => total + (v.stock || 0), 0);
            } else if ('gia_ban' in p) {
                displayPrice = p.gia_ban;
                displayStock = p.ton_kho;
            }
            const displayImage = p.hinh_anh_bia || p.hinh_anh || 'https://placehold.co/36x36/f3f4f6/9ca3af?text=Img';
            const newRow = document.createElement('tr');
            newRow.innerHTML = `<td><img src="${displayImage}" onerror="this.onerror=null;this.src='https://placehold.co/36x36/f3f4f6/9ca3af?text=Img';"><p>${p.ten_hang}</p></td><td>${p.ma_hang}</td><td>${formatCurrency(displayPrice)}</td><td>${displayStock}</td><td><button class="action-btn edit-product-btn" data-id="${p._id}"><i class="ri-edit-line"></i></button><button class="action-btn delete-product-btn" data-id="${p._id}"><i class="ri-delete-bin-line"></i></button></td>`;
            productsTableBody.appendChild(newRow);
        });
        if (data) renderProductPagination(data.totalPages, data.currentPage);
    };

    function renderProductPagination(totalPages, currentPage) {
        if (!productPaginationControls) return;
        productPaginationControls.innerHTML = '';
        if (totalPages <= 1) return;
        const createBtn = (page, content, disabled = false, active = false) => {
            const button = document.createElement('button');
            button.dataset.page = page; button.innerHTML = content; button.disabled = disabled;
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

    const renderCategoriesTable = async () => {
        if (!categoriesTableBody) return;
        const categories = await fetchData('/api/categories/flat');
        categoriesTableBody.innerHTML = '';
        if (!categories || categories.length === 0) {
            categoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Chưa có danh mục nào.</td></tr>';
            return;
        }
        categories.forEach(cat => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `<td>${cat.name}</td><td>${cat.slug}</td><td>${cat.parent?.name || '<em>-</em>'}</td><td><button class="action-btn edit-category-btn" data-id="${cat._id}"><i class="ri-edit-line"></i></button><button class="action-btn delete-category-btn" data-id="${cat._id}"><i class="ri-delete-bin-line"></i></button></td>`;
            categoriesTableBody.appendChild(newRow);
        });
    };

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
        select.innerHTML = '<option value="">-- Chọn danh mục cha (nếu là danh mục con) --</option>';
        if (rootCategories && Array.isArray(rootCategories)) {
            rootCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat._id; option.textContent = cat.name;
                if (cat._id === selectedParentId) option.selected = true;
                select.appendChild(option);
            });
        }
    }

    function setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-close-modal]')) {
                const modalId = e.target.dataset.closeModal;
                document.getElementById(modalId)?.classList.remove('show');
            }
        });

        productsTableBody?.addEventListener('click', async (e) => {
            const button = e.target.closest('button.action-btn');
            if (!button) return;
            const id = button.dataset.id;
            if (button.classList.contains('edit-product-btn')) {
                const p = await fetchData(`/api/products/${id}`);
                if (p) {
                    productForm.reset();
                    variantsListContainer.innerHTML = '';
                    modalTitle.textContent = "Chỉnh sửa sản phẩm";
                    document.getElementById('product-id').value = p._id;
                    document.getElementById('product-ma-hang').value = p.ma_hang;
                    document.getElementById('product-ten-hang').value = p.ten_hang;
                    document.getElementById('product-thuong-hieu').value = p.thuong_hieu;
                    const hinhAnhBiaInput = document.getElementById('product-hinh-anh-bia');
                    const hinhAnhBiaPreview = document.getElementById('hinh-anh-bia-preview');
                    hinhAnhBiaInput.value = '';
                    if (hinhAnhBiaPreview) {
                        hinhAnhBiaPreview.src = p.hinh_anh_bia || '#';
                        hinhAnhBiaPreview.style.display = p.hinh_anh_bia ? 'block' : 'none';
                    }
                    await populateProductCategoryDropdown(p.danh_muc);
                    initializeTinyMCE(p.mo_ta_chi_tiet || '');
                    if (p.variants && p.variants.length > 0) {
                        p.variants.forEach(variant => createVariantForm(variant));
                    } else {
                        createVariantForm({name: 'Mặc định', price: p.gia_ban, stock: p.ton_kho, image: p.hinh_anh });
                    }
                    productModal.classList.add('show');
                }
            } else if (button.classList.contains('delete-product-btn')) {
                if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                    if (await sendData(`/api/products/${id}`, 'DELETE')) {
                        await renderProductsTable(currentProductPage);
                        loadStats();
                    }
                }
            }
        });

        categoriesTableBody?.addEventListener('click', async (e) => {
            const button = e.target.closest('button.action-btn');
            if(!button) return;
            const id = button.dataset.id;
            if (button.classList.contains('delete-category-btn')) {
                if (confirm('Bạn chắc chắn muốn xóa danh mục này? Thao tác này sẽ không thành công nếu danh mục có sản phẩm hoặc danh mục con.')) {
                    const response = await sendData(`/api/categories/${id}`, 'DELETE');
                    if (response) { await renderCategoriesTable(); loadStats(); }
                }
            } else if (button.classList.contains('edit-category-btn')) {
                const categories = await fetchData('/api/categories/flat');
                const catToEdit = categories.find(c => c._id === id);
                if (catToEdit) {
                    categoryForm.reset();
                    categoryModalTitle.textContent = "Chỉnh sửa Danh mục";
                    document.getElementById('category-id').value = catToEdit._id;
                    document.getElementById('category-display-name').value = catToEdit.name;
                    document.getElementById('category-slug').value = catToEdit.slug;
                    const parentSelect = document.getElementById('category-parent');
                    parentSelect.disabled = false;
                    await populateParentCategoryDropdown(catToEdit.parent?._id);
                    categoryModal.classList.add('show');
                }
            }
        });

        addProductBtn?.addEventListener('click', () => {
            productForm.reset();
            variantsListContainer.innerHTML = '';
            document.getElementById('product-id').value = '';
            modalTitle.textContent = "Thêm sản phẩm mới";
            initializeTinyMCE('');
            populateProductCategoryDropdown();
            createVariantForm();
            productModal.classList.add('show');
        });

        addCategoryBtn?.addEventListener('click', () => {
            categoryForm.reset();
            document.getElementById('category-id').value = '';
            categoryModalTitle.textContent = "Thêm Danh mục Mới";
            const parentSelect = document.getElementById('category-parent');
            parentSelect.disabled = false;
            populateParentCategoryDropdown();
            categoryModal.classList.add('show');
        });

        productForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            const id = document.getElementById('product-id').value;
            formData.append('ma_hang', document.getElementById('product-ma-hang').value);
            formData.append('ten_hang', document.getElementById('product-ten-hang').value);
            formData.append('thuong_hieu', document.getElementById('product-thuong-hieu').value);
            formData.append('danh_muc', document.getElementById('product-danh-muc').value);
            formData.append('mo_ta_chi_tiet', tinymce.get('product-mo-ta')?.getContent() || '');

            const coverImageFile = document.getElementById('product-hinh-anh-bia').files[0];
            if (coverImageFile) { formData.append('hinh_anh_bia', coverImageFile); }
            
            const variantsData = [];
            const variantForms = document.querySelectorAll('#variants-list-container .variant-form-group');
            variantForms.forEach((form, index) => {
                variantsData.push({
                    name: form.querySelector('.variant-name').value,
                    sku: form.querySelector('.variant-sku').value,
                    price: parseFloat(form.querySelector('.variant-price').value),
                    stock: parseInt(form.querySelector('.variant-stock').value, 10),
                    image: form.querySelector('.image-preview').src
                });
                const variantImageFile = form.querySelector('.variant-image-input').files[0];
                if (variantImageFile) { formData.append('variant_images', variantImageFile); }
            });
            formData.append('variants', JSON.stringify(variantsData));

            const url = id ? `/api/products/${id}` : '/api/products';
            const method = id ? 'PUT' : 'POST';
            const response = await sendData(url, method, formData, true);
            
            if (response) {
                await renderProductsTable(id ? currentProductPage : 1);
                productModal.classList.remove('show');
                loadStats();
            }
        });

        categoryForm?.addEventListener('submit', async (e) => { /* ... */ });
        categoryDisplayNameInput?.addEventListener('input', () => { /* ... */ });
        addVariantBtn?.addEventListener('click', () => createVariantForm());
        
        document.getElementById('product-modal')?.addEventListener('change', (e) => {
            if (e.target.matches('input[type="file"]')) {
                const file = e.target.files[0];
                if (file) {
                    const previewId = e.target.id === 'product-hinh-anh-bia' ? 'hinh-anh-bia-preview' : `preview-${e.target.dataset.previewFor}`;
                    const previewElement = document.getElementById(previewId);
                    if (previewElement) {
                        previewElement.src = URL.createObjectURL(file);
                        previewElement.style.display = 'block';
                    }
                }
            }
        });
    }

    const handleLogin = async () => {
        const password = passwordInput.value;
        if (!password) { alert('Vui lòng nhập mật khẩu.'); return; }
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password }),
            });
            const data = await response.json();
            if (response.ok) {
                loginSection.style.display = 'none';
                dashboardSection.classList.remove('hidden');
                setupDashboardUI();
                setupEventListeners();
                loadStats();
                renderProductsTable(1);
                renderCategoriesTable();
            } else {
                alert(data.message || 'Lỗi không xác định.');
            }
        } catch (error) {
            alert('Không thể kết nối đến server. Vui lòng thử lại.');
        }
    };

    loginBtn?.addEventListener('click', handleLogin);
    passwordInput?.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleLogin(); });
});