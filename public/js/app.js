document.addEventListener('DOMContentLoaded', () => {

    // === TRẠNG THÁI ỨNG DỤNG ===
    let currentPage = 1;
    let currentCategory = 'all';
    let currentSearch = '';

    // === LẤY CÁC PHẦN TỬ DOM ===
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const productGrid = document.getElementById('product-grid');
    const paginationControls = document.getElementById('pagination-controls');
    const categoryFilters = document.getElementById('category-filters');
    const header = document.querySelector('.header');
    const menuIcon = document.querySelector('#menu-icon');
    const mobileNavbar = document.querySelector('#mobile-navbar');

    // === CÁC HÀM HIỂN THỊ (RENDER) ===

      /**
     * Hiển thị danh sách sản phẩm ra lưới.
     * @param {Array} products - Mảng các đối tượng sản phẩm.
     */
    function renderProducts(products) {
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;
        productGrid.innerHTML = '';
        if (!products || products.length === 0) {
            productGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 0;">Không có sản phẩm nào phù hợp.</p>`;
            return;
        }
        const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        
        products.forEach(p => {
            // [SỬA LỖI] - Logic kiểm tra an toàn để lấy giá và ảnh
            const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
            const displayPrice = hasVariants ? p.variants[0].price : (p.gia_ban || 0);
            const displayImage = p.hinh_anh_bia || p.hinh_anh || 'https://placehold.co/400x400?text=No+Image';

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-img-container">
                    <a href="/product.html?id=${p._id}">
                        <img src="${displayImage}" alt="${p.ten_hang}" class="product-img" onerror="this.onerror=null;this.src='https://placehold.co/400x400/f3f4f6/9ca3af?text=Not+Found';">
                    </a>
                </div>
                <div class="product-info">
                    <a href="/product.html?id=${p._id}"><h3 class="product-title">${p.ten_hang}</h3></a>
                    <span class="product-price">${formatCurrency(displayPrice)}</span>
                </div>
                <a href="/product.html?id=${p._id}" title="Xem chi tiết" class="product-contact-icon"><i class='bx bx-search-alt'></i></a>`;
            productGrid.appendChild(productCard);
        });
    }

    function renderPagination(totalPages, page) {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;
        const createBtn = (p, content, isDisabled = false, isActive = false) => {
            const btn = document.createElement('button');
            btn.dataset.page = p;
            btn.innerHTML = content;
            btn.disabled = isDisabled;
            if (isActive) btn.classList.add('active');
            btn.addEventListener('click', () => fetchAndRenderProducts(p));
            return btn;
        };
        paginationControls.appendChild(createBtn(page - 1, '«', page === 1));
        for (let i = 1; i <= totalPages; i++) {
            paginationControls.appendChild(createBtn(i, i, false, i === page));
        }
        paginationControls.appendChild(createBtn(page + 1, '»', page === totalPages));
    }

    // [SỬA LỖI] - Hiển thị bộ lọc danh mục đa cấp
    async function renderCategoryFilters() {
        if (!categoryFilters) return;
        try {
            // Dùng API /api/categories để lấy cấu trúc cây
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('Lỗi khi tải danh mục');
            const categories = await response.json();

            // Hàm đệ quy để tạo HTML cho danh sách <ul> và <li>
            const createListItemsHTML = (list) => {
                let html = '';
                list.forEach(cat => {
                    const hasChildren = cat.children && cat.children.length > 0;
                    // Dùng đúng các class mà style.css đang chờ: 'has-children', 'filter-link', 'child-list'
                    html += `<li class="${hasChildren ? 'has-children' : ''}">
                               <a href="#" data-category-slug="${cat.slug}" class="filter-link">${cat.name}</a>`;
                    if (hasChildren) {
                        html += `<ul class="child-list">${createListItemsHTML(cat.children)}</ul>`;
                    }
                    html += '</li>';
                });
                return html;
            };
            
            // Bọc toàn bộ trong thẻ <ul> cha
            const categoryHTML = `<ul><li class="active"><a href="#" data-category-slug="all" class="filter-link active-filter">Tất cả sản phẩm</a></li>${createListItemsHTML(categories)}</ul>`;
            categoryFilters.innerHTML = categoryHTML;
            // Thay đổi giao diện cho mục được chọn
            updateActiveFilterUI('all');

        } catch (error) {
            console.error("Lỗi fetchAndRenderFilters:", error);
            categoryFilters.innerHTML = `<p>Lỗi tải danh mục.</p>`;
        }
    }

    // Hàm cập nhật giao diện cho link đang active
    function updateActiveFilterUI(activeSlug) {
        document.querySelectorAll('.filter-link').forEach(link => {
            link.classList.remove('active-filter', 'font-bold'); // Reset
            if (link.dataset.categorySlug === activeSlug) {
                link.classList.add('active-filter', 'font-bold');
            }
        });
    }

    // === CÁC HÀM LẤY DỮ LIỆU (FETCH) ===

    async function fetchAndRenderProducts(page = 1) {
        currentPage = page;
        let url = `/api/products?page=${currentPage}&limit=8&category=${currentCategory}`;
        if (currentSearch) {
            url += `&search=${encodeURIComponent(currentSearch)}`;
        }
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Lỗi khi tải sản phẩm');
            const data = await res.json();
            renderProducts(data.products);
            renderPagination(data.totalPages, data.currentPage);
        } catch (error) {
            console.error("Lỗi fetchAndRenderProducts:", error);
            if(productGrid) productGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">Lỗi tải sản phẩm.</p>`;
        }
    }

    // === THIẾT LẬP CÁC SỰ KIỆN ===

    function setupEventListeners() {
        menuIcon?.addEventListener('click', () => {
            mobileNavbar?.classList.toggle('open');
            menuIcon.classList.toggle('bx-x');
        });
        window.addEventListener('scroll', () => {
            header?.classList.toggle('shadow', window.scrollY > 0);
        });

        searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            currentSearch = searchInput.value.trim();
            currentCategory = 'all';
            updateActiveFilterUI('all');
            fetchAndRenderProducts(1);
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        });

        // [SỬA LỖI] - Xử lý click cho cả việc lọc và việc đóng/mở danh mục con
        categoryFilters?.addEventListener('click', (e) => {
            const link = e.target.closest('.filter-link');
            if (!link) return;
            
            e.preventDefault();
            const parentLi = link.parentElement;

            // 1. Xử lý đóng/mở danh mục con
            // Nếu li cha có class 'has-children', thêm/xóa class 'open' để CSS xử lý việc hiện/ẩn
            if (parentLi.classList.contains('has-children')) {
                parentLi.classList.toggle('open');
            }

            // 2. Xử lý lọc sản phẩm
            const categorySlug = link.dataset.categorySlug;
            if (categorySlug && categorySlug !== currentCategory) {
                currentCategory = categorySlug;
                currentSearch = '';
                searchInput.value = '';
                updateActiveFilterUI(categorySlug);
                fetchAndRenderProducts(1);
            }
        });
    }

    // === KHỞI CHẠY ỨNG DỤNG ===
    function init() {
        setupEventListeners();
        renderCategoryFilters(); // Hiển thị bộ lọc trước
        fetchAndRenderProducts(1); // Sau đó hiển thị sản phẩm
    }

    init();
});