
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const searchInput = document.getElementById('product-search');
  const sortSelect = document.getElementById('sort');
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const clearBtn = document.querySelector('.clear-btn');
  const minPriceInput = document.querySelector('input[placeholder="Min"]');
  const maxPriceInput = document.querySelector('input[placeholder="Max"]');
  const applyPriceBtn = document.querySelector('.price-apply');
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
  const colorOptions = document.querySelectorAll('.color-option');
  const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');

  let serverWishlist = window.wishlist || [];

  // Build filter payload from current UI state
  function getAllFilters() {
    return {
      search: searchInput.value.trim(),
      sort: sortSelect.value,
      categories: [...categoryCheckboxes].filter(cb => cb.checked).map(cb => cb.value),
      availability: [...availabilityCheckboxes].filter(cb => cb.checked).map(cb => cb.value),
      colors: [...colorOptions].filter(el => el.classList.contains('selected')).map(el => el.dataset.color),
      minPrice: minPriceInput.value ? Number(minPriceInput.value) : undefined,
      maxPrice: maxPriceInput.value ? Number(maxPriceInput.value) : undefined,
      page: 1,
      limit: 12
    };
  }

  // Unified filter applicator (debounced)
  const debouncedApplyFilters = debounce(function(filters) {
    console.log('Applying all filters:', filters);
    fetch('/user/shopall/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    })
    .then(res => res.json())
    .then(data => {
      console.log('Filtered products:', data);
      serverWishlist = data.wishlist || serverWishlist;
      updateProductGrid(data.products, data.wishlist);
      updateCounts(data.products.length, data.total || data.products.length);
    })
    .catch(err => {
      console.error('Filter fetch error:', err);
      loadAllProducts();
    });
  }, 300);

  // Unified event handler
  function handleFilterChange() {
    const filters = getAllFilters();
    debouncedApplyFilters(filters);
  }

  // Search
  searchInput.addEventListener('input', handleFilterChange);

  // Sort
  sortSelect.addEventListener('change', handleFilterChange);

  // Availability
  availabilityCheckboxes.forEach(cb => cb.addEventListener('change', handleFilterChange));

  // Categories
  categoryCheckboxes.forEach(cb => cb.addEventListener('change', handleFilterChange));

  // Colors
  colorOptions.forEach(colorBox => {
    colorBox.addEventListener('click', function() {
      this.classList.toggle('selected');
      handleFilterChange();
    });
  });

  // Price
  applyPriceBtn.addEventListener('click', handleFilterChange);

  // Clear
  clearBtn.addEventListener('click', function() {
    checkboxes.forEach(cb => cb.checked = false);
    colorOptions.forEach(c => c.classList.remove('selected'));
    searchInput.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    sortSelect.value = 'price-asc';
    loadAllProducts();
  });

  // Load all products
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

  // Update counts
  function updateCounts(showing, total) {
    const showingEl = document.getElementById('showing-count');
    const totalEl = document.getElementById('total-count');
    if (showingEl) showingEl.textContent = showing;
    if (totalEl) totalEl.textContent = total;
  }

  // Update product grid
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
      let finalPrice = originalPrice;
      let discountLabel = '';
      if (product.bestOffer && product.bestOffer.discountValue > 0) {
        if (product.bestOffer.type === 'percentage') {
          finalPrice = Math.round(originalPrice - (originalPrice * product.bestOffer.discountValue / 100));
          if (product.bestOffer.maxDiscount) {
            finalPrice = Math.max(originalPrice - product.bestOffer.maxDiscount, finalPrice);
          }
          discountLabel = `${product.bestOffer.discountValue}%OFF`;
        } else if (product.bestOffer.type === 'fixed') {
          finalPrice = Math.max(0, originalPrice - product.bestOffer.discountValue);
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
      const wishlistIcon = isInWishlist ? 'fas' : 'far';

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

  function generateStarRating(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += `<i class="${i < rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    return stars;
  }

  function attachDynamicListeners() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();
        const productId = this.dataset.productId;
        const icon = this.querySelector('i');

        try {
          const response = await fetch(`/user/wishlist/add/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          const data = await response.json();

          if (response.ok) {
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
              icon.classList.replace('far', 'fas');
              showToast('Added to wishlist!', 'success');
            } else {
              icon.classList.replace('fas', 'far');
              showToast('Removed from wishlist', 'info');
            }
            const index = serverWishlist.indexOf(productId);
            if (index > -1) serverWishlist.splice(index, 1);
            else serverWishlist.push(productId);
          } else if (response.status === 400 && data.error === 'product already in wishlist') {
            showToast('Already in the wishlist', 'info');
          } else {
            showToast('Failed to add to wishlist', 'error');
          }
        } catch (error) {
          console.error('Error adding to wishlist:', error);
          showToast('Something went wrong', 'error');
        }
      });
    });
  }

  // Initial attach
  attachDynamicListeners();

  // Debounce utility
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Toast utility
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

  // Cart count
  function updateCartCount() {
    fetch('/user/cart/count')
      .then(res => res.json())
      .then(data => {
        const badge = document.querySelector('.cart-count');
        if (badge) badge.textContent = data.cartCount || 0;
      })
      .catch(err => console.error('Cart count error:', err));
  }

});

// Global add-to-cart delegation (works for both static and dynamic cards)
document.addEventListener('click', async (e) => {
  if (e.target.closest('.add-to-cart')) {
    const button = e.target.closest('.add-to-cart');
    const productId = button.dataset.id;
    const quantity = 1;

    try {
      const response = await fetch(`/user/cart/add/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });

      const data = await response.json();

      if (response.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: data.message || 'Please login to continue.',
          confirmButtonText: 'OK'
        });
        return;
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
  }
});