  document.addEventListener('DOMContentLoaded', () => {
  const qtyInput = document.getElementById('quantity');
  const minusBtn = document.getElementById('minus-btn');
  const plusBtn = document.getElementById('plus-btn');

  if (qtyInput && minusBtn && plusBtn) {
    const maxStock = parseInt(qtyInput.getAttribute('data-stock')) || 1;
const limit=parseInt(qtyInput.getAttribute('data-limit'));
console.log("limit:",limit);
    function updateQuantity(change) {
      console.log("inside the updateQuantity");
      let qty = parseInt(qtyInput.value);
      if (isNaN(qty)) qty = 1;

      qty += change;

      if (qty < 1) qty = 1;
      else if (qty > limit) {
        qty = limit;
        Swal.fire({
          icon: 'warning',
          title: 'Stock limits reached',
          text: `Only ${limit} items can be purachase at once .`,
        });
      }

      qtyInput.value = qty;
    }

    minusBtn.addEventListener('click', () => updateQuantity(-1));
    plusBtn.addEventListener('click', () => updateQuantity(1));
  }

  const qtyControls = document.querySelectorAll('.qty-control');

  qtyControls.forEach((control) => {
    const input = control.querySelector('.quantity-input');
    const minus = control.querySelector('.minus');
    const plus = control.querySelector('.plus');
    const maxStock = parseInt(input.getAttribute('data-stock')) || 1;
const limit=parseFloat(input.getAttribute('data-limit'))||1;
console.log("limit inside the frontend",limit);
    function update(change) {
      let qty = parseInt(input.value);
      if (isNaN(qty)) qty = 1;

      qty += change;

      if (qty < 1) qty = 1;
      else if (qty > limit) {
        qty = limit-1;
        Swal.fire({
          icon: 'warning',
          title: 'Stock limit reached',
          text: `Only ${limit} items are allowed in single purchase.`,
        });
      }

      input.value = qty;
    }

    minus.addEventListener('click', () => update(-1));
    plus.addEventListener('click', () => update(1));
  });
});

  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.querySelector('.main-image img');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumb.parentElement.classList.add('active');
      mainImage.src = thumb.querySelector('img').src;
    });
  });

  document.querySelector('.menu-toggle').addEventListener('click', function () {
    document.querySelector('.main-nav').classList.toggle('active');
  });


const addToCartBtn=document.querySelector('.add-to-cart');
const buyNowBtn=document.getElementById('buyNowBtn');

const productId=document.querySelector('[data-product-id]')?.getAttribute('data-product-id');
const qtyInput=document.getElementById('quantity');


addToCartBtn.addEventListener('click',async()=>{
  const quantity=parseInt(qtyInput.value)||1;

  try {
    const response=await fetch(`/user/cart/add/${productId}`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({productId,quantity})
    });

    const data=await response.json();
    

      if (response.status === 401) {
         Swal.fire({
    icon: 'warning',
    title: 'Login Required',
    text: data.message || 'Please login to continue.',
    confirmButtonText: 'OK'
  });
  return;
}
  if (data.status === 'error') {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: data.message,
            showConfirmButton: false,
            timer: 2000
          });
    
      }else if(response.ok){
      Swal.fire({
  toast: true,
  position: 'top-end',
  icon: 'success',
  title: 'Added to cart',
  text:data.message||'Product successfully added to cart.',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

    }else{
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'Failed to add product to cart.'
      });
    }
  } catch (error) {
     Swal.fire({
      icon: 'error',
      title: 'Oops!',
      text: 'Something went wrong. Please try again.'
    });
  }
  
});

buyNowBtn?.addEventListener('click',async(e)=>{
   e.preventDefault();
  const quantity=parseInt(qtyInput.value)||1;
  try {
    const response=await fetch('/user/buy-now',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({productId,quantity})
    });
    const data=await response.json();
    if(response.ok){
      window.location.href='/user/checkout';
    }else{
    Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Could not proceed to checkout.'
        });
    }

  } catch (error) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong.'
      });
  }
})

// ── Wishlist management ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const wishlistBtn = document.getElementById('wishlistBtn');
  const productId = document.querySelector('[data-product-id]')?.getAttribute('data-product-id');

  if (!wishlistBtn || !productId) return;

  function updateWishlistCount(count) {
    document.querySelectorAll('.wishlist-count').forEach(el => {
      el.textContent = count ?? 0;
    });
  }

  // 1. Fetch current wishlist status of the product on load
  try {
    const response = await fetch(`/user/status/${productId}`);
    const data = await response.json();
    if (data.inWishlist) {
      wishlistBtn.classList.add('active');
      wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Wishlist';
    }
  } catch (err) {
    console.error('Failed to check wishlist status:', err);
  }

  // 2. Add click event listener to toggle status
  wishlistBtn.addEventListener('click', async () => {
    const isCurrentlyActive = wishlistBtn.classList.contains('active');
    const url = isCurrentlyActive
      ? `/user/wishlist/remove-product/${productId}`
      : `/user/wishlist/add/${productId}`;
    const method = isCurrentlyActive ? 'DELETE' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: 'Please login to manage your wishlist.',
          confirmButtonText: 'OK'
        });
        return;
      }

      const data = await response.json();

      if (response.ok) {
        if (isCurrentlyActive) {
          wishlistBtn.classList.remove('active');
          wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Removed from wishlist',
            showConfirmButton: false,
            timer: 2000
          });
        } else {
          wishlistBtn.classList.add('active');
          wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Wishlist';
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Added to wishlist',
            showConfirmButton: false,
            timer: 2000
          });
        }
        // Update header wishlist count badge
        if (data.wishlistCount !== undefined) {
          updateWishlistCount(data.wishlistCount);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to update wishlist.'
        });
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Something went wrong. Please try again.'
      });
    }
  });
});