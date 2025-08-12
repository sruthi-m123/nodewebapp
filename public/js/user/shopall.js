document.addEventListener('DOMContentLoaded',function(){
    const searchInput=document.getElementById('product-search');
    const sortSelect=document.getElementById('sort');
    const checkboxes=document.querySelectorAll('input[type="checkbox"]');
    const clearBtn = document.querySelector('.clear-btn');
  const minPriceInput = document.querySelector('input[placeholder="Min"]');
  const maxPriceInput = document.querySelector('input[placeholder="Max"]');
  const applyPriceBtn = document.querySelector('.price-apply');
const categoryCheckboxes=document.querySelectorAll('input[name="category"]');

  
function applyFilters(){
    // const filters=getFilterData();
    // console.log('applied filters:',filters);
    const minPrice = minPriceInput.value;
  const maxPrice = maxPriceInput.value;
    fetch('/shopall/filter',{
        method:'POST',
        headers:{
            'Content-Type':'application/json',
        },
        body:JSON.stringify({minPrice,maxPrice})

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
      // you can also include categories, colors, etc. here
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
    fetch('/user/shopall/all')
      .then(res => res.json())
      .then(data => {
        updateProductGrid(data.products);
      })
      .catch(err => {
        console.error('Error loading all products:', err);
      });
    return;
  }

    if(this.checked){
    fetch('/user/shopall/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ availability: selectedAvailability }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Filtered by availability:', data);
       updateProductGrid(data.products); 
      });
    }else{
 fetch('/user/shopall/all')
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
    fetch('/user/shopall/all')
      .then(res => res.json())
      .then(data => {
        updateProductGrid(data.products);
      })
      .catch(err => {
        console.error('Error loading all products:', err);
      });
    return;
  }
   
   
      fetch('/user/shopall/filter',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
      },
      body:JSON.stringify({colors:selectedColors}),
    })
    .then(res=>res.json())
    .then(data=>{
      console.log('filtered by colors:',data);
 updateProductGrid(data.products);     })
    });
  });

  applyPriceBtn.addEventListener('click', applyFilters);

  clearBtn.addEventListener('click', function () {
    checkboxes.forEach(cb => cb.checked = false);
    document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
    searchInput.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    sortSelect.value = 'priceLowHigh';
    fetch('/user/shopall/all')
  .then(res => res.json())
  .then(data => updateProductGrid(data.products));

  });

  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

function updateProductGrid(products) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = ''; 

  if (products.length === 0) {
    grid.innerHTML = '<p>No products found.</p>';
    return;
  }

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
      <img src="/${product.images[0]}" alt="${product.productName}">
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
    fetch('/user/shopall/all')
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
      
      fetch('/user/shopall/all')
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


