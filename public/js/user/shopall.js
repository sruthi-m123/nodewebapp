document.addEventListener('DOMContentLoaded', function () {
  // ── Elements ────────────────────────────────────────────────────────────────
  const searchInput         = document.getElementById('product-search');
  const sortSelect          = document.getElementById('sort');
  const checkboxes          = document.querySelectorAll('input[type="checkbox"]');
  const clearBtn            = document.querySelector('.clear-btn');
  const minPriceInput       = document.querySelector('input[placeholder="Min"]');
  const maxPriceInput       = document.querySelector('input[placeholder="Max"]');
  const applyPriceBtn       = document.querySelector('.price-apply');
  const categoryCheckboxes  = document.querySelectorAll('input[name="category"]');
  const colorOptions        = document.querySelectorAll('.color-option');
  const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');

  let serverWishlist = window.wishlist || [];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 2000);
  }

  function updateWishlistCount(count) {
    document.querySelectorAll('.wishlist-count').forEach(el => {
      el.textContent = count ?? 0;
    });
  }

  function generateStarRating(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += `<i class="${i < rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    return stars;
  }

  function updateCounts(showing, total) {
    const showingEl = document.getElementById('showing-count');
    const totalEl   = document.getElementById('total-count');
    if (showingEl) showingEl.textContent = showing;
    if (totalEl)   totalEl.textContent   = total;
  }

  // ── Wishlist button listeners ─────────────────────────────────────────────────
  function attachDynamicListeners() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      // Remove any previously attached listener to avoid duplicates after grid refresh
      btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        const productId        = this.dataset.productId;
        const icon             = this.querySelector('i');
        const isCurrentlyActive = this.classList.contains('active');

        const url    = isCurrentlyActive
          ? `/user/wishlist/remove-product/${productId}`
          : `/user/wishlist/add/${productId}`;
        const method = isCurrentlyActive ? 'DELETE' : 'POST';

        try {
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
          });

          const data = await response.json();
          console.log('Wishlist response:', data);

          if (response.ok) {
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
              // Added
              icon.classList.replace('far', 'fas');
              showToast('Added to wishlist!', 'success');
              if (!serverWishlist.includes(productId)) serverWishlist.push(productId);
            } else {
              // Removed
              icon.classList.replace('fas', 'far');
              showToast('Removed from wishlist', 'info');
              const idx = serverWishlist.indexOf(productId);
              if (idx > -1) serverWishlist.splice(idx, 1);
            }
            updateWishlistCount(data.wishlistCount ?? serverWishlist.length);

          } else if (response.status === 400) {
            // Already in wishlist — sync the UI to reflect this
            this.classList.add('active');
            icon.classList.replace('far', 'fas');
            if (!serverWishlist.includes(productId)) serverWishlist.push(productId);
            updateWishlistCount(data.wishlistCount ?? serverWishlist.length);
            showToast(data.message || 'Already in your wishlist.', 'info');

          } else {
            showToast('Failed to update wishlist', 'error');
          }

        } catch (error) {
          console.error('Wishlist error:', error);
          showToast('Something went wrong', 'error');
        }
      });
    });
  }

  // ── Product grid ─────────────────────────────────────────────────────────────
  function updateProductGrid(products, wishlist = serverWishlist) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (!products || products.length === 0) {
      grid.innerHTML = '<div class="no-products-message"><p>No products found.</p></div>';
      return;
    }

    products.forEach(product => {
      if (!product.isActive) return;

      let originalPrice = product.price;
      let finalPrice    = originalPrice;
      let discountLabel = '';

      if (product.bestOffer && product.bestOffer.discountValue > 0) {
        if (product.bestOffer.type === 'percentage') {
          finalPrice = Math.round(originalPrice - (originalPrice * product.bestOffer.discountValue / 100));
          if (product.bestOffer.maxDiscount) {
            finalPrice = Math.max(originalPrice - product.bestOffer.maxDiscount, finalPrice);
          }
          discountLabel = `${product.bestOffer.discountValue}%OFF`;
        } else if (product.bestOffer.type === 'fixed') {
          finalPrice    = Math.max(0, originalPrice - product.bestOffer.discountValue);
          discountLabel = `₹${product.bestOffer.discountValue.toLocaleString()} OFF`;
        }
      }

      const pricingHTML = `
        <p class="product-pricing">
          <span class="offer-price">₹${finalPrice.toLocaleString()}</span>
          ${finalPrice < originalPrice ? `
            <span class="mrp">₹${originalPrice.toLocaleString()}</span>
            <span class="discount">(${discountLabel})</span>
          ` : ''}
        </p>
      `;

      const isInWishlist = Array.isArray(wishlist) && wishlist.includes(product._id.toString());
      const wishlistClass = isInWishlist ? 'active' : '';
      const wishlistIcon  = isInWishlist ? 'fas' : 'far';

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        ${product.isNewArrival ? '<div class="product-badge">New</div>' : ''}
        <div class="product-image ${product.stock === 0 ? 'grayscale' : ''}">
          <a href="/user/product/${product._id}">
            <img src="${product.images[0]}" alt="${product.productName}">
          </a>
          <div class="quick-view">Quick View</div>
        </div>
        <div class="product-info">
          <h4 class="product-name">
            <a href="/user/product/${product._id}" class="product-link-name">${product.productName}</a>
          </h4>
          <div class="product-meta">
            <div class="product-rating">
              ${generateStarRating(product.rating)}
              <span>(${product.reviews || 0})</span>
            </div>
            ${pricingHTML}
          </div>
          <div class="product-actions">
            <button class="wishlist-btn ${wishlistClass}" data-product-id="${product._id}" title="Add to wishlist">
              <i class="${wishlistIcon} fa-heart"></i>
            </button>
            ${product.stock === 0
              ? `<p class="out-of-stock-message">Out of Stock</p>`
              : `<button class="add-to-cart primary-btn" data-id="${product._id}">Add to Cart</button>`
            }
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    attachDynamicListeners();
  }

  // ── Filters ───────────────────────────────────────────────────────────────────
  function getAllFilters() {
    return {
      search:       searchInput.value.trim(),
      sort:         sortSelect.value,
      categories:   [...categoryCheckboxes].filter(cb => cb.checked).map(cb => cb.value),
      availability: [...availabilityCheckboxes].filter(cb => cb.checked).map(cb => cb.value),
      colors:       [...colorOptions].filter(el => el.classList.contains('selected')).map(el => el.dataset.color),
      minPrice:     minPriceInput.value ? Number(minPriceInput.value) : undefined,
      maxPrice:     maxPriceInput.value ? Number(maxPriceInput.value) : undefined,
      page:  1,
      limit: 12
    };
  }

  const debouncedApplyFilters = debounce(function (filters) {
    fetch('/user/shopall/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    })
    .then(res => res.json())
    .then(data => {
      serverWishlist = data.wishlist || serverWishlist;
      updateProductGrid(data.products, data.wishlist);
      updateCounts(data.products.length, data.total || data.products.length);
    })
    .catch(err => {
      console.error('Filter fetch error:', err);
      loadAllProducts();
    });
  }, 300);

  function handleFilterChange() {
    debouncedApplyFilters(getAllFilters());
  }

  function loadAllProducts() {
    fetch('/user/shopall/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, limit: 12 })
    })
    .then(res => res.json())
    .then(data => {
      serverWishlist = data.wishlist || serverWishlist;
      updateProductGrid(data.products, data.wishlist);
      updateCounts(data.products.length, data.total || data.products.length);
    })
    .catch(err => console.error('Error loading all products:', err));
  }

  // ── Event listeners ───────────────────────────────────────────────────────────
  if (searchInput)      searchInput.addEventListener('input', handleFilterChange);
  if (sortSelect)       sortSelect.addEventListener('change', handleFilterChange);
  availabilityCheckboxes.forEach(cb => cb.addEventListener('change', handleFilterChange));
  categoryCheckboxes.forEach(cb => cb.addEventListener('change', handleFilterChange));
  colorOptions.forEach(colorBox => {
    colorBox.addEventListener('click', function () {
      this.classList.toggle('selected');
      handleFilterChange();
    });
  });
  if (applyPriceBtn) applyPriceBtn.addEventListener('click', handleFilterChange);

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      checkboxes.forEach(cb => cb.checked = false);
      colorOptions.forEach(c => c.classList.remove('selected'));
      if (searchInput)  searchInput.value  = '';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      if (sortSelect)   sortSelect.value   = 'price-asc';
      loadAllProducts();
    });
  }

  // Attach listeners to cards already rendered server-side on first page load
  attachDynamicListeners();
});

// ── Add to cart (outside DOMContentLoaded to allow event delegation) ──────────
document.addEventListener('click', async (e) => {
  if (!e.target.closest('.add-to-cart')) return;

  const button    = e.target.closest('.add-to-cart');
  const productId = button.dataset.id;

  try {
    const response = await fetch(`/user/cart/add/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 })
    });

    const data = await response.json();

    if (response.status === 401) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: data.message || 'Please login to continue.',
        confirmButtonText: 'OK'
      });
    } else if (response.ok) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Added to cart',
        text: data.message || 'Product successfully added to cart.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'Failed to add product to cart.'
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Oops!',
      text: 'Something went wrong. Please try again.'
    });
  }
});