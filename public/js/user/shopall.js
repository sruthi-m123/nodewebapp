
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

<<<<<<< Updated upstream
  function getAllFilters() {
    return {
      search: searchInput.value.trim(),
      sort: sortSelect.value,
      categories: [...categoryCheckboxes].filter(cb => cb.checked).map(cb => cb.value),
      availability: [...availabilityCheckboxes].filter(cb => cb.checked).map(cb => cb.value),
      colors: [...colorOptions].filter(el => el.classList.contains('selected')).map(el => el.dataset.color),
      minPrice: minPriceInput.value ? Number(minPriceInput.value) : undefined,
      maxPrice: maxPriceInput.value ? Number(maxPriceInput.value) : undefined,
      page: 1,  // Default; can add pagination logic later
      limit: 12
    };
=======
    })
    .then(res=>res.json())
.then(data=>{
    console.log('filtered products by price:',data);
     updateProductGrid(data.products); 
});

}
//funtion debounce
function debounce(func,delay){
  let timeout;
  return function(...args){
    clearTimeout(timeout);
    timeout=setTimeout(()=>func.apply(this,args),delay);
  }
}
searchInput.addEventListener('input', debounce(() => {
  const searchQuery = searchInput.value.trim();

  fetch('/user/shopall/filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      search: searchQuery,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log('Search results:', data);
      updateProductGrid(data.products);
    })
    .catch((err) => {
      console.error('Search fetch error:', err);
    });
}, 300));


  sortSelect.addEventListener('change', function(){
    const selectedSort=sortSelect.value;
    fetch('/user/shopall/filter',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
      },
      body:JSON.stringify({sort:selectedSort})
    })
    .then(res=>res.json())
    .then(data=>{
      console.log('sorted products:',data);
       updateProductGrid(data.products); 
    })
  });

checkboxes.forEach(cb => {
  cb.addEventListener('change', function () {
    const selectedAvailability = [...document.querySelectorAll('input[name="availability"]:checked')].map(cb => cb.value);
if (selectedAvailability.length === 0 ) {
    fetch('/user/shopAll',{
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(res => res.json())
      .then(data => {
        console.log("data inside the checkbox:",data);
        updateProductGrid(data.products);
      })
      .catch(err => {
        console.error('Error loading all products:', err);
      });
    return;
>>>>>>> Stashed changes
  }

  // Unified filter applicator (debounced)
  const debouncedApplyFilters = debounce(function(filters) {
    console.log('Applying all filters:', filters);
    fetch('/user/shopall/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    })
<<<<<<< Updated upstream
    .then(res => res.json())
    .then(data => {
      console.log('Filtered products:', data);
      serverWishlist = data.wishlist || serverWishlist;  // Update from response
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
=======
      .then(res => res.json())
      .then(data => {
        console.log('Filtered by availability:', data);
       updateProductGrid(data.products); 
      });
    }else{
 fetch('/user/shopAll',{
  headers: { 'X-Requested-With': 'XMLHttpRequest' }
 })
        .then(res => res.json())
        .then(data => {
          updateProductGrid(data.products);
        })
        .catch(err => console.error('Error loading all products:', err));
    }
  });

});


  document.querySelectorAll('.color-option').forEach(colorBox => {
    colorBox.addEventListener('click', function () {
      colorBox.classList.toggle('selected');
      const selectedColors=[...document.querySelectorAll('.color-option.selected')].map(el=>el.dataset.color);
   if (selectedColors.length === 0 ) {
    fetch('/user/shopAll',{
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(res => res.json())
      .then(data => {
        updateProductGrid(data.products);
      })
      .catch(err => {
        console.error('Error loading all products:', err);
      });
    return;
>>>>>>> Stashed changes
  }

  // Search
  searchInput.addEventListener('input', handleFilterChange);

  // Sort
  sortSelect.addEventListener('change', handleFilterChange);

  // Availability
  availabilityCheckboxes.forEach(cb => cb.addEventListener('change', handleFilterChange));

  // Categories (multi-select fixed)
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
<<<<<<< Updated upstream
    sortSelect.value = 'price-asc';  // Fixed default
    loadAllProducts();
  });

  // Load all
  function loadAllProducts() {
    fetch('/user/shopall/all')
      .then(res => res.json())
      .then(data => {
        serverWishlist = data.wishlist || serverWishlist;
        updateProductGrid(data.products, data.wishlist);
        updateCounts(data.products.length, data.products.length);
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

  // Update grid (with wishlist)
  function updateProductGrid(products, wishlist = serverWishlist) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
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
        } else if (product.bestOffer.type === 'fixed') {  // Fixed: 'fixed' not 'flat', use discountValue
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

      const isInWishlist = wishlist.includes(product._id.toString());
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

    attachDynamicListeners();  // Re-attach after update
  }

  function generateStarRating(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += `<i class="${i < rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    return stars;
  }

  // Attach dynamic listeners (wishlist, cart)
  function attachDynamicListeners() {
    // Wishlist
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      // Remove previous listener if exists (simple: use once or delegation)
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
              icon.classList.remove('far');
              icon.classList.add('fas');
              showToast('Added to wishlist!', 'success');
            } else {
              icon.classList.remove('fas');
              icon.classList.add('far');
              showToast('Removed from wishlist', 'info');
            }
            // Update local wishlist
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

    // Cart (global delegation - already handles dynamic)
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
            updateCartCount();
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
  }

  // Initial attach
  attachDynamicListeners();

  // Debounce
=======
    sortSelect.value = 'priceLowHigh';



    fetch('/user/shopAll',{
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
  .then(res => res.json())
  .then(data => 
    updateProductGrid(data.products))
    .catch((err)=>{
    console.log("error:",err);
  })

  
  })
  
>>>>>>> Stashed changes
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Toast
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }

<<<<<<< Updated upstream
  // Cart count (placeholder)
  function updateCartCount() {
    // Implement cart badge update if needed
  }
=======
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (!product.isActive) {
      card.classList.add('inactive');
    }

    card.innerHTML = `
      <div class="product-badge">${product.badge || 'New'}</div>
<div class="product-image ${product.stock === 0 ? 'grayscale' : ''}">
        <a href="/user/product/${product._id}">
      <img src="${product.images[0]}" alt="${product.productName}">
       </a>
      <div class="quick-view">Quick View</div>
      </div>
      <div class="product-info">
        <h4 class="product-name">${product.productName}</h4>
        <div class="product-meta">
          <div class="product-rating">
            ${generateStarRating(product.rating)}
            <span>(${product.reviews || 0})</span>
          </div>
          <p class="product-price">₹${Number(product.price).toLocaleString()}</p>
        </div>
        <div class="product-actions">
          <button class="wishlist-btn" title="Add to wishlist">
            <i class="far fa-heart"></i>
          </button>
${
  product.stock === 0
    ? `<p class="out-of-stock-message">Out of Stock</p>`
    : `<button class="add-to-cart primary-btn" data-id="${product._id}">Add to Cart</button>`
}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function generateStarRating(rating) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += `<i class="${i < rating ? 'fas' : 'far'} fa-star"></i>`;
  }
  return stars;
}


  categoryCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', function () {
    const categoryId = this.value;
if (checkbox.length === 0 && selectedAvailability.length === 0) {
    fetch('/user/shopAll',{
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(res => res.json())
      .then(data => {
        updateProductGrid(data.products);
      })
      .catch(err => {
        console.error('Error loading all products:', err);
      });
    return;
  }
    // Only fetch if checked
    if (this.checked) {
      fetch(`/user/shopall/category/${categoryId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Category Products:', data);
          updateProductGrid(data.products); 
        })
        .catch(err => console.error('Error fetching category products:', err));
    } else {
      
      fetch('/user/shopAll',{
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
        .then(res => res.json())
        .then(data => {
          updateProductGrid(data.products);
        })
        .catch(err => console.error('Error loading all products:', err));
    }
  });
});

});
document.addEventListener('click', async (e) => {
  if (e.target.closest('.add-to-cart')) {
    const button = e.target.closest('.add-to-cart');
    const productId = button.dataset.id;
    const quantity = 1;

    try {
      const response = await fetch(`/user/cart/add/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
        updateCartCount();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to add product to cart.'
        });
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Something went wrong. Please try again.'
      });
    }
  }
});
document.querySelectorAll('.wishlist-btn').forEach(btn => {
  btn.addEventListener('click', async function () {
    const productId = this.dataset.productId;

    try {
      const response = await fetch(`/user/wishlist/add/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Added to wishlist!',
          showConfirmButton: false,
          timer: 1500
        });
      } else if (response.status === 400 && data.error === 'Product already in wishlist') {
        Swal.fire({
          icon: 'info',
          title: 'Already in wishlist',
          text: 'This product is already in your wishlist.',
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to add to wishlist',
          text: data.message || 'Something went wrong.',
        });
      }

    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Something went wrong.',
      });
    }
  });
});

>>>>>>> Stashed changes

});