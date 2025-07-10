document.addEventListener('DOMContentLoaded',function(){
    const searchInput=document.getElementById('product-search');
    const sortSelect=document.getElementById('sort');
    const checkboxes=document.querySelectorAll('input[type="checkbox"]');
    const clearBtn = document.querySelector('.clear-btn');
  const minPriceInput = document.querySelector('input[placeholder="Min"]');
  const maxPriceInput = document.querySelector('input[placeholder="Max"]');
  const applyPriceBtn = document.querySelector('.price-apply');
const categoryCheckboxes=document.querySelectorAll('input[name="category"]');

  //  function getFilterData() {
//     const selectedCategories = [...document.querySelectorAll('input[name="category"]:checked')].map(cb => cb.value);
//     const selectedAvailability = [...document.querySelectorAll('input[name="availability"]:checked')].map(cb => cb.value);
//     const selectedColors = [...document.querySelectorAll('.color-option.selected')].map(el => el.dataset.color);
//     const minPrice = minPriceInput.value;
//     const maxPrice = maxPriceInput.value;
//     const searchQuery = searchInput.value;
//     const sortBy = sortSelect.value;

//     return {
//       search: searchQuery,
//       sort: sortBy,
//       categories: selectedCategories,
//       availability: selectedAvailability,
//       colors: selectedColors,
//       minPrice,
//       maxPrice,
//     };
// }
//this is for apply button 
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
searchInput.addEventListener('input',  debounce(()=>{
  const searchQuery=searchInput.value.trim();
  // const filters = getFilterData(); // includes search, sort, categories, etc.

  fetch('/user/shopall/filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchQuery) // includes search value inside
  })
    .then(res => res.json())
    .then(data => {
      console.log('Search results:', data);
       updateProductGrid(data.products); 
    });
},300));

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
    sortSelect.value = 'best';
    applyFilters();
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
  grid.innerHTML = ''; // Clear old cards

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
      <div class="product-image">
        <img src="/${product.images[0]}" alt="${product.productName}">
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
          <button class="add-to-cart primary-btn">Add to Cart</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Helper function for rendering star rating
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
          updateProductGrid(data.products); // Replace with real DOM update logic
        })
        .catch(err => console.error('Error fetching category products:', err));
    } else {
      // Optional: reload all products or clear filtered view
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
