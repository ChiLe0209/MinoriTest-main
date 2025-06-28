document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-button');
    const desktopMenuContainer = document.getElementById('desktop-menu-container');
    const mobileMenuContainer = document.getElementById('mobile-menu-container');

    const menuItems = [
        { name: "Sản phẩm", href: "#products", isDynamic: true },
        { name: "Về chúng tôi", href: "#about" }
    ];

    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            return [];
        }
    }

    function createDesktopMenu(categories) {
        if (!desktopMenuContainer) return;
        let html = '';
        menuItems.forEach(item => {
            if (item.isDynamic && categories.length > 0) {
                // Tạo dropdown cho mục 'Sản phẩm'
                html += `<div class="group relative">
                    <a href="${item.href}" class="text-gray-600 hover:text-blue-600 flex items-center py-2">
                        ${item.name}
                        <svg class="ml-1 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </a>
                    <div class="dropdown-menu">`;
                // Thêm mục "Tất cả" vào đầu danh sách
                html += `<a href="#products" data-category-slug="all" class="dropdown-item category-nav-link font-semibold">Tất cả sản phẩm</a>`;
                categories.forEach(cat => {
                     html += `<a href="#products" data-category-slug="${cat.slug}" class="dropdown-item category-nav-link font-bold">${cat.name}</a>`;
                     if (cat.children && cat.children.length > 0) {
                         cat.children.forEach(child => {
                             html += `<a href="#products" data-category-slug="${child.slug}" class="dropdown-item category-nav-link pl-8">${child.name}</a>`;
                         });
                     }
                });
                html += `</div></div>`;
            } else {
                html += `<a href="${item.href}" class="text-gray-600 hover:text-blue-600 py-2">${item.name}</a>`;
            }
        });
        desktopMenuContainer.innerHTML = html;
    }

    function createMobileMenu(categories) {
        if (!mobileMenuContainer) return;
        let html = '';
         menuItems.forEach(item => {
            if (item.isDynamic && categories.length > 0) {
                html += `<div class="font-semibold text-gray-800 px-4 py-3">${item.name}</div>`;
                // Thêm mục "Tất cả" cho mobile
                html += `<a href="#products" data-category-slug="all" class="category-nav-link block py-2 px-8 text-sm text-gray-600 hover:bg-gray-100">Tất cả sản phẩm</a>`;
                categories.forEach(cat => {
                    html += `<a href="#products" data-category-slug="${cat.slug}" class="category-nav-link block py-2 px-8 text-sm text-gray-600 hover:bg-gray-100 font-bold">${cat.name}</a>`;
                     if (cat.children && cat.children.length > 0) {
                         cat.children.forEach(child => {
                             html += `<a href="#products" data-category-slug="${child.slug}" class="category-nav-link block py-2 px-12 text-sm text-gray-600 hover:bg-gray-100">${child.name}</a>`;
                         });
                     }
                })
            } else {
                html += `<a href="${item.href}" class="block py-3 px-4 text-sm text-gray-600 hover:bg-gray-100">${item.name}</a>`;
            }
        });
        mobileMenuContainer.innerHTML = html;
    }

    // Gắn sự kiện cho nút hamburger
    hamburgerBtn?.addEventListener('click', () => {
        mobileMenuContainer?.classList.toggle('hidden');
    });

    // Khởi tạo menu
    async function initMenu() {
        const categories = await fetchCategories();
        createDesktopMenu(categories);
        createMobileMenu(categories);
    }

    initMenu();
});
