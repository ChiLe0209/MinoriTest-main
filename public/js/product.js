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
    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtnProduct = document.querySelector('#contact-modal #close-contact-modal-btn');

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    // [SỬA LỖI] - Thêm kiểm tra "if (element)" trước khi gán textContent
    function displayVariantDetails(product, variant) {
        document.title = `${product.ten_hang} - ${variant.name}`;
        
        if (productNameEl) productNameEl.textContent = product.ten_hang;
        if (productBrandEl) productBrandEl.textContent = product.thuong_hieu;
        if (productDescriptionEl) productDescriptionEl.innerHTML = product.mo_ta_chi_tiet || "Sản phẩm này chưa có mô tả chi tiết.";

        if (productImageEl) {
            productImageEl.src = variant.image;
            productImageEl.alt = `${product.ten_hang} - ${variant.name}`;
        }
        if (productPriceEl) productPriceEl.textContent = formatCurrency(variant.price);
        if (productStockEl) productStockEl.textContent = variant.stock;
        if (productSkuEl) productSkuEl.textContent = variant.sku || product.ma_hang;
    }

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

            if (index === 0) button.classList.add('active');

            button.addEventListener('click', () => {
                document.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const selectedVariant = product.variants[index];
                displayVariantDetails(product, selectedVariant);
            });
            variantOptionsContainer.appendChild(button);
        });
    }

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
            const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

            if (!hasVariants) {
                document.title = product.ten_hang;
                if (productNameEl) productNameEl.textContent = product.ten_hang;
                if (productBrandEl) productBrandEl.textContent = product.thuong_hieu;
                if (productDescriptionEl) productDescriptionEl.innerHTML = product.mo_ta_chi_tiet || "Sản phẩm này chưa có mô tả chi tiết.";
                if (productImageEl) {
                    productImageEl.src = product.hinh_anh_bia || product.hinh_anh || 'https://placehold.co/600x600?text=No+Image';
                    productImageEl.alt = product.ten_hang;
                }
                if (productPriceEl) productPriceEl.textContent = formatCurrency(product.gia_ban || 0);
                if (productStockEl) productStockEl.textContent = product.ton_kho || 0;
                if (productSkuEl) productSkuEl.textContent = product.ma_hang;
                if (variantsContainer) variantsContainer.style.display = 'none';
            } else {
                const defaultVariant = product.variants[0];
                displayVariantDetails(product, defaultVariant);
                renderVariantOptions(product);
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
            const container = document.getElementById('product-detail-container');
            if(container) container.innerHTML = `<p class="text-center text-red-500 text-2xl col-span-full">${error.message}</p>`;
        }
    }

    const style = document.createElement('style');
    style.textContent = `.variant-btn { padding: 8px 16px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; } .variant-btn:hover { border-color: #2563eb; color: #2563eb; } .variant-btn.active { border-color: #2563eb; background-color: #2563eb; color: white; }`;
    document.head.appendChild(style);

    contactBtn?.addEventListener('click', () => contactModal?.classList.remove('hidden'));
    closeModalBtnProduct?.addEventListener('click', () => contactModal?.classList.add('hidden'));

    initProductPage();
});