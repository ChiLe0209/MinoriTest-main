document.addEventListener('DOMContentLoaded', () => {

    // === LẤY CÁC PHẦN TỬ DOM ===
    const productNameEl = document.getElementById('product-name');
    const productBrandEl = document.getElementById('product-brand');
    const productSkuEl = document.getElementById('product-sku');
    const productPriceEl = document.getElementById('product-price');
    const productStockEl = document.getElementById('product-stock');
    const productImageEl = document.getElementById('product-image');
    const productDescriptionEl = document.getElementById('product-description');
    const variantOptionsContainer = document.getElementById('variant-options');
    const variantsContainer = document.getElementById('variants-container');

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    /**
     * Cập nhật giao diện với thông tin của một biến thể cụ thể.
     * @param {object} product - Dữ liệu sản phẩm chung.
     * @param {object} variant - Dữ liệu của biến thể được chọn.
     */
    function displayVariantDetails(product, variant) {
        document.title = `${product.ten_hang} - ${variant.name}`;
        
        productNameEl.textContent = product.ten_hang;
        productBrandEl.textContent = product.thuong_hieu;
        productDescriptionEl.innerHTML = product.mo_ta_chi_tiet || "Sản phẩm này chưa có mô tả chi tiết.";

        // Cập nhật thông tin theo biến thể
        productImageEl.src = variant.image;
        productImageEl.alt = `${product.ten_hang} - ${variant.name}`;
        productPriceEl.textContent = formatCurrency(variant.price);
        productStockEl.textContent = variant.stock;
        productSkuEl.textContent = variant.sku || product.ma_hang;
    }

    /**
     * Tạo các nút để chọn biến thể.
     * @param {object} product - Dữ liệu sản phẩm chung.
     */
    function renderVariantOptions(product) {
        if (!variantOptionsContainer || !product.variants || product.variants.length <= 1) {
            if (variantsContainer) variantsContainer.style.display = 'none';
            return;
        }

        variantOptionsContainer.innerHTML = '';
        product.variants.forEach((variant, index) => {
            const button = document.createElement('button');
            button.className = 'variant-btn';
            button.textContent = variant.name;
            button.dataset.index = index;

            if (index === 0) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                document.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const selectedVariant = product.variants[index];
                displayVariantDetails(product, selectedVariant);
            });

            variantOptionsContainer.appendChild(button);
        });
    }

    /**
     * Hàm chính: Lấy dữ liệu sản phẩm từ API và khởi tạo trang.
     */
    async function initProductPage() {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (!productId) {
            document.body.innerHTML = '<p class="text-center text-red-500 text-2xl p-10">ID sản phẩm không hợp lệ.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Không tìm thấy sản phẩm');
            
            const product = await response.json();

            // Kiểm tra xem sản phẩm có biến thể hay không
            if (!product.variants || product.variants.length === 0) {
                // [SỬA LỖI] - Xử lý hiển thị cho sản phẩm cũ (không có biến thể)
                document.title = product.ten_hang;
                productNameEl.textContent = product.ten_hang;
                productBrandEl.textContent = product.thuong_hieu;
                productDescriptionEl.innerHTML = product.mo_ta_chi_tiet || "Sản phẩm này chưa có mô tả chi tiết.";

                // Ưu tiên ảnh bìa, nếu không có thì dùng ảnh cũ (hinh_anh)
                productImageEl.src = product.hinh_anh_bia || product.hinh_anh || 'https://placehold.co/600x600?text=No+Image';
                productImageEl.alt = product.ten_hang;
                
                // Hiển thị giá và tồn kho cũ
                productPriceEl.textContent = formatCurrency(product.gia_ban || 0);
                productStockEl.textContent = product.ton_kho || 0;
                productSkuEl.textContent = product.ma_hang;

                if (variantsContainer) variantsContainer.style.display = 'none'; // Ẩn mục chọn biến thể
                return;
            }

            // Xử lý cho sản phẩm có biến thể (giữ nguyên)
            const defaultVariant = product.variants[0];
            displayVariantDetails(product, defaultVariant);
            renderVariantOptions(product);

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
            document.getElementById('product-detail-container').innerHTML = `<p class="text-center text-red-500 text-2xl col-span-full">${error.message}</p>`;
        }
    }

    // Thêm CSS cho nút biến thể (giữ nguyên)
    const style = document.createElement('style');
    style.textContent = `
        .variant-btn {
            padding: 8px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .variant-btn:hover {
            border-color: #2563eb;
            color: #2563eb;
        }
        .variant-btn.active {
            border-color: #2563eb;
            background-color: #2563eb;
            color: white;
        }
    `;
    document.head.appendChild(style);

    initProductPage();
});