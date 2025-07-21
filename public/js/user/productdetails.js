  // Quantity Selector
  document.addEventListener('DOMContentLoaded', () => {
  const qtyInput = document.getElementById('quantity');
  const minusBtn = document.getElementById('minus-btn');
  const plusBtn = document.getElementById('plus-btn');

  // Case 1: Product Detail Page
  if (qtyInput && minusBtn && plusBtn) {
    const maxStock = parseInt(qtyInput.getAttribute('data-stock')) || 1;

    function updateQuantity(change) {
      let qty = parseInt(qtyInput.value);
      if (isNaN(qty)) qty = 1;

      qty += change;

      if (qty < 1) qty = 1;
      else if (qty > maxStock) {
        qty = maxStock;
        Swal.fire({
          icon: 'warning',
          title: 'Stock limit reached',
          text: `Only ${maxStock} item(s) available.`,
        });
      }

      qtyInput.value = qty;
    }

    minusBtn.addEventListener('click', () => updateQuantity(-1));
    plusBtn.addEventListener('click', () => updateQuantity(1));
  }

  // Case 2: All Products Page
  const qtyControls = document.querySelectorAll('.qty-control');

  qtyControls.forEach((control) => {
    const input = control.querySelector('.quantity-input');
    const minus = control.querySelector('.minus');
    const plus = control.querySelector('.plus');
    const maxStock = parseInt(input.getAttribute('data-stock')) || 1;

    function update(change) {
      let qty = parseInt(input.value);
      if (isNaN(qty)) qty = 1;

      qty += change;

      if (qty < 1) qty = 1;
      else if (qty > maxStock) {
        qty = maxStock;
        Swal.fire({
          icon: 'warning',
          title: 'Stock limit reached',
          text: `Only ${maxStock} item(s) available.`,
        });
      }

      input.value = qty;
    }

    minus.addEventListener('click', () => update(-1));
    plus.addEventListener('click', () => update(1));
  });
});

  // Tab System
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

  // Thumbnail Click
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.querySelector('.main-image img');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumb.parentElement.classList.add('active');
      mainImage.src = thumb.querySelector('img').src;
    });
  });

  // Mobile Menu Toggle
  document.querySelector('.menu-toggle').addEventListener('click', function () {
    document.querySelector('.main-nav').classList.toggle('active');
  });


//add to cart and buy now 
const addToCartBtn=document.querySelector('.add-to-cart');
const buyNowBtn=document.querySelector('.buy-now');

const productId=document.querySelector('[data-product-id]')?.getAttribute('data-product-id');
const qtyInput=document.getElementById('quantity');

//Add to cart function

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
//buy now function 

buyNowBtn.addEventListener('click',async()=>{
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
    wal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong.'
      });
  }
})