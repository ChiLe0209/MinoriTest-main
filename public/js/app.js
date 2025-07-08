console.log('Bắt đầu chạy tệp app.js');
document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let currentCategory = 'all';
    let currentSearch = '';
    let currentSlideIndex = 0;
    let slideInterval;
    const heroSlideshowContainer = document.getElementById('hero-slideshow-container');
    const productGrid = document.getElementById('product-grid');
    const paginationControls = document.getElementById('pagination-controls');
    const categoryFilters = document.getElementById('category-filters');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const header = document.querySelector('.header');
    const menuIcon = document.querySelector('#menu-icon');
    const mobileNavbar = document.querySelector('#mobile-navbar');
    const contactModal = document.getElementById('contact-modal');
    const closeContactModalBtn = document.getElementById('close-contact-modal-btn');
    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const filterOverlay = document.getElementById('filter-overlay');
    const filtersSidebar = document.getElementById('filters-sidebar');
    const searchIconMobile = document.getElementById('search-icon-mobile');
    const searchCloseBtn = document.querySelector('.search-form .search-close-btn');
    const saleBannerContainer = document.getElementById('sale-banner-container');
 // === CÁC HÀM HIỂN THỊ (RENDER) ===

    /**
     * [MỚI] - Hàm để tải và hiển thị banner sale
     */
    async function renderSaleBanners() {
        if (!saleBannerContainer) return;

        try {
            const response = await fetch('/api/sale-banners/active');
            if (!response.ok) return;

            const banners = await response.json();
            if (banners && banners.length > 0) {
                // Chỉ hiển thị banner mới nhất
                const latestBanner = banners[0];
                saleBannerContainer.innerHTML = `
                    <div class="sale-banner-item container">
                        <a href="${latestBanner.link || '#'}">
                            <img src="${latestBanner.imageUrl}" alt="${latestBanner.title}">
                        </a>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Lỗi khi tải banner sale:", error);
        }
    }

    function renderProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        if (!products || products.length === 0) {
            productGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 0;">Không có sản phẩm nào phù hợp.</p>`;
            return;
        }

        const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);

        products.forEach(p => {
            const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
            const displayPrice = hasVariants ? p.variants[0].price : (p.gia_ban || 0);
            const displayImage = p.hinh_anh_bia || p.hinh_anh || 'https://placehold.co/400x400?text=No+Image';

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            // ✅ BỔ SUNG layout để hiển thị đầy đủ
            productCard.style.display = 'flex';
            productCard.style.flexDirection = 'column';

            productCard.innerHTML = `
                <a href="/product.html?id=${p._id}" class="product-img-container block">
                    <img src="${displayImage}" alt="${p.ten_hang}" class="product-img">
                </a>
                <div class="product-info">
                    <a href="/product.html?id=${p._id}">
                        <h3 class="product-title">${p.ten_hang || 'Chưa có tên'}</h3>
                    </a>
                    <span class="product-price">${formatCurrency(displayPrice)}</span>
                    <div class="flex-grow"></div>
                    <button class="contact-btn">Liên hệ</button>
                </div>
            `;
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

    function renderCategoryFilters(categories) {
        if (!categoryFilters) return;

        const createListItemsHTML = (list) => {
            let html = '';
            list.forEach(cat => {
                const hasChildren = cat.children && cat.children.length > 0;
                html += `
                    <li class="${hasChildren ? 'has-children' : ''}">
                        <a href="#" data-category-slug="${cat.slug}" class="filter-link">${cat.name}</a>
                        ${hasChildren ? `<ul class="child-list">${createListItemsHTML(cat.children)}</ul>` : ''}
                    </li>`;
            });
            return html;
        };

        const categoryHTML = `
            <ul>
                <li class="active">
                    <a href="#" data-category-slug="all" class="filter-link active-filter">Tất cả sản phẩm</a>
                </li>
                ${createListItemsHTML(categories)}
            </ul>`;
        categoryFilters.innerHTML = categoryHTML;
    }

    function updateActiveFilterUI(activeSlug) {
        document.querySelectorAll('.filter-link').forEach(link => {
            link.classList.remove('active-filter');
            if (link.dataset.categorySlug === activeSlug) {
                link.classList.add('active-filter');
            }
        });
    }
    // Bổ sung xử lý mở form liên hệ
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.contact-btn');
        if (btn) {
            document.querySelector('.contact-modal-overlay')?.classList.remove('hidden');
        }
    });

    // Đóng khi click bên ngoài
    document.querySelector('.contact-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('contact-modal-overlay')) {
            e.target.classList.add('hidden');
        }
    });
    async function fetchAndRenderProducts(page = 1) {
        currentPage = page;
        let url = `/api/products?page=${currentPage}&limit=8&category=${currentCategory}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Lỗi khi tải sản phẩm');
            const data = await res.json();
            renderProducts(data.products);
            renderPagination(data.totalPages, data.currentPage);
        } catch (error) {
            if (productGrid) {
                productGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">Lỗi tải sản phẩm.</p>`;
            }
        }
    }
 // HÃY CHẮC CHẮN BẠN ĐÃ THAY THẾ HÀM CŨ BẰNG PHIÊN BẢN NÀY

// HÀM HIỂN THỊ MỘT SLIDE CỤ THỂ
function showSlide(index) {
    const slides = document.querySelectorAll('#hero-slideshow-container .hero-slide');
    if (!slides || slides.length === 0) return;

    // Cập nhật lại slide index để nó lặp lại khi đến cuối
    currentSlideIndex = (index + slides.length) % slides.length;

    // Ẩn tất cả các slide
    slides.forEach(slide => {
        slide.classList.remove('slide-active');
    });

    // Hiển thị slide được chọn
    slides[currentSlideIndex].classList.add('slide-active');
}

// HÀM BẮT ĐẦU SLIDESHOW TỰ ĐỘNG
function startSlideshow() {
    // Dừng slideshow cũ lại (nếu có) để tránh chạy nhiều lần
    clearInterval(slideInterval);
    
    // Cứ mỗi 5 giây, chuyển sang slide tiếp theo
    slideInterval = setInterval(() => {
        showSlide(currentSlideIndex + 1);
    }, 5000); // 5000ms = 5 giây
}
function renderHeroSlideshow(banners) {
    if (!heroSlideshowContainer) return;

    heroSlideshowContainer.innerHTML = '';

    if (!Array.isArray(banners) || banners.length === 0) {
        // Có thể hiển thị một ảnh mặc định nếu không có banner
        heroSlideshowContainer.innerHTML = `<a class="hero-slide slide-active"><img src="https://placehold.co/1920x700?text=Minori+Sport" alt="Default Banner"></a>`;
        return;
    }

    banners.forEach(banner => {
        const slide = document.createElement('a');
        slide.href = banner.link || '#';
        slide.className = 'hero-slide';

        const img = document.createElement('img');
        img.src = banner.imageUrl;
        img.alt = banner.title;
        img.loading = 'lazy';

        slide.appendChild(img);
        heroSlideshowContainer.appendChild(slide);
    });

    // SAU KHI TẠO XONG CÁC SLIDE
    if (banners.length > 1) {
        showSlide(0); // Hiển thị slide đầu tiên
        startSlideshow(); // Bắt đầu tự động chuyển slide
    } else {
        // Nếu chỉ có 1 banner, hiển thị nó luôn và không cần chuyển động
        const singleSlide = heroSlideshowContainer.querySelector('.hero-slide');
        if (singleSlide) singleSlide.classList.add('slide-active');
    }
}
    function setupEventListeners() {
        menuIcon?.addEventListener('click', () => {
            mobileNavbar?.classList.toggle('open');
            menuIcon.classList.toggle('bx-x');
        });

        window.addEventListener('scroll', () => {
            header?.classList.toggle('shadow', window.scrollY > 0);
        });

        searchIconMobile?.addEventListener('click', () => {
            searchForm?.classList.toggle('open');
        });

        searchCloseBtn?.addEventListener('click', () => {
            searchForm?.classList.remove('open');
        });

searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentSearch = searchInput.value.trim();
    currentCategory = 'all';
    updateActiveFilterUI('all');
    fetchAndRenderProducts(1).then(() => {
        const productSection = document.getElementById('products');
        if (productSection) {
            productSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});



        const closeFilter = () => {
            filtersSidebar?.classList.remove('open');
            filterOverlay?.classList.remove('open');
        };

        mobileFilterBtn?.addEventListener('click', () => {
            filtersSidebar?.classList.add('open');
            filterOverlay?.classList.add('open');
        });

        closeFilterBtn?.addEventListener('click', closeFilter);
        filterOverlay?.addEventListener('click', closeFilter);

        // ✅ SỬA sự kiện click vào danh mục cha
        categoryFilters?.addEventListener('click', (e) => {
            const link = e.target.closest('.filter-link');
            if (!link) return;
            e.preventDefault();

            const parentLi = link.closest('li'); // ✅ SỬA chỗ này

            if (parentLi.classList.contains('has-children')) {
                parentLi.classList.toggle('open'); // ✅ Toggle mở/đóng danh mục con
            }

            const categorySlug = link.dataset.categorySlug;
            if (categorySlug !== currentCategory) {
                currentCategory = categorySlug;
                currentSearch = '';
                if (searchInput) searchInput.value = '';
                updateActiveFilterUI(categorySlug);
                fetchAndRenderProducts(1);
            }

            if (window.innerWidth <= 992 && !parentLi.classList.contains('has-children')) {
                closeFilter();
            }
        });

        productGrid?.addEventListener('click', (e) => {
            if (e.target.classList.contains('contact-btn')) {
                contactModal?.classList.remove('hidden');
            }
        });

        closeContactModalBtn?.addEventListener('click', () => {
            contactModal?.classList.add('hidden');
        });
    }

async function init() {
    console.log('Hàm init() đã được gọi.'); // Kiểm tra xem hàm init có được gọi không
    setupEventListeners(); 
    try {
        const [categoriesRes, bannersRes, productsRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/hero-banners/active'),
            fetch('/api/products?page=1&limit=8')
        ]);

        console.log('Đã gửi xong các yêu cầu API.');

        if (categoriesRes.ok) {
            const categories = await categoriesRes.json();
            console.log('Dữ liệu Categories nhận được:', categories); // KIỂM TRA DỮ LIỆU
            renderCategoryFilters(categories);
        } else {
            console.error('Lấy Categories thất bại. Status:', categoriesRes.status);
        }

        if (bannersRes.ok) {
            const banners = await bannersRes.json();
            console.log('Dữ liệu Banners nhận được:', banners); // KIỂM TRA DỮ LIỆU
            renderHeroSlideshow(banners);

        } else {
            console.error('Lấy Banners thất bại. Status:', bannersRes.status);
        }
        
        if (productsRes.ok) {
            const productData = await productsRes.json();
            console.log('Dữ liệu Products nhận được:', productData); // KIỂM TRA DỮ LIỆU
            renderProducts(productData.products);
            renderPagination(productData.totalPages, productData.currentPage);
        } else {
            console.error('Lấy Products thất bại. Status:', productsRes.status);
        }

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong hàm init:", error);
    }
}
    
    init();
});
