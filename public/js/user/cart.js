document.addEventListener('DOMContentLoaded', () => {
  setupCartEventListeners();
  
  calculateGrandTotal();
  
  fetchCartCount();
  
  checkFor401Message();
});

function checkFor401Message() {
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get('error');
  
if(errorMessage){
  try {
    const errorData=JSON.parse(errorMessage);
    if(errorData.message){
    showAlert('Unauthorized', errorData.message, 'error');

    }else{
    showAlert('Unauthorized', errorMessage, 'error');

    }
  } catch (error) {
       showAlert('Unauthorized', errorMessage, 'error');
  }
}



    
    // Clean URL without reloading page
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  
}

// Set up all cart event listeners
function setupCartEventListeners() {
  // Add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = button.dataset.productId;
      const quantity = parseInt(button.dataset.quantity) || 1;
      addToCart(productId, quantity);
    });
  });

  // Quantity buttons
  document.querySelectorAll('.quantity-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const itemId = e.target.closest('.quantity-selector').dataset.id;
      const change = e.target.classList.contains('increase') ? 1 : -1;
      updateQuantity(itemId, change);
    });
  });

  // Quantity inputs
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const itemId = e.target.closest('.quantity-selector').dataset.id;
      updateQuantityInput(itemId, parseInt(e.target.value));
    });
  });

  // Remove item buttons
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const itemId = e.target.closest('tr').dataset.id;
      removeItem(itemId);
    });
  });

  // Listen for custom cart update events
  document.addEventListener('cartUpdated', fetchCartCount);
}

// Update quantity with buttons
function updateQuantity(itemId, change) {
  const container = document.querySelector(`.quantity-selector[data-id="${itemId}"]`);
  const input = container.querySelector('.quantity-input');
  const maxStock = parseInt(container.dataset.stock);
  const limit = 10;
  let newValue = parseInt(input.value) + change;

  // Validate stock
  if (newValue > maxStock) {
    showAlert('Out of Stock', `Only ${maxStock} items available in stock.`, 'warning');
    return;
  }

  // Validate purchase limit
  if (newValue > limit) {
    showAlert('Limit Exceeded', `Maximum ${limit} items per order.`, 'warning');
    return;
  }

  // Validate minimum
  if (newValue < 1) newValue = 1;

  input.value = newValue;
  updateItemTotal(itemId);
  calculateGrandTotal();
  updateCart();
}

// Update quantity with direct input
function updateQuantityInput(itemId, value) {
  value = parseInt(value);
  if(isNaN(value)) value = 1;
  const container = document.querySelector(`.quantity-selector[data-id="${itemId}"]`);
  const maxStock = parseInt(container.dataset.stock);
  const limit = 10;

  // Validate stock
  if (value > maxStock) {
    showAlert('Out of Stock', `Only ${maxStock} items available in stock.`, 'warning');
    value = maxStock;
  }

  // Validate purchase limit
  if (value > limit) {
    showAlert('Limit Exceeded', `Maximum ${limit} items per order.`, 'warning');
    value = limit;
  }

  // Validate minimum
  if (value < 1) value = 1;

  container.querySelector('.quantity-input').value = value;
  updateItemTotal(itemId);
  calculateGrandTotal();
  updateCart();
}

// Calculate item total (price * quantity)
function updateItemTotal(itemId) {
  const row = document.querySelector(`tr[data-id="${itemId}"]`);
  const price = parseFloat(row.querySelector('.item-price').textContent);
  const quantity = parseInt(row.querySelector('.quantity-input').value);
  const total = price * quantity;
  row.querySelector('.item-total').textContent = total.toFixed(2);
}

// Calculate grand total
function calculateGrandTotal() {
  let grandTotal = 0;
  document.querySelectorAll('.item-total').forEach(el => {
    grandTotal += parseFloat(el.textContent);
  });
  const totalElement = document.getElementById('grand-total');
  if (totalElement) {
    totalElement.textContent = grandTotal.toFixed(2);
  }
}

// Add item to cart
async function addToCart(productId, quantity = 1) {
  try {
    const response = await fetch(`/cart/add/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity }),
      credentials: 'include'
    });

    // Handle 401 responses
    if (response.status === 401) {
      const errorData = await response.json();
      showAlert('Unauthorized', errorData.message || 'Please log in to add items to your cart.', 'error');
      return;
    }

    const data = await response.json();
    
    if (response.ok) {
      handleAddToCart(data);
    } else {
      showAlert('Error', data.message || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showAlert('Error', 'Failed to add to cart', 'error');
  }
}

// Handle successful add to cart
function handleAddToCart(response) {
  if (response.success) {
    updateCartCount(response.cartCount);
    showAlert('Success!', response.message, 'success');
    document.dispatchEvent(new Event('cartUpdated'));
  }
}

// Remove item from cart
async function removeItem(itemId) {
  try {
    const response = await fetch(`/user/cart/remove/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' 
    });

    // Handle 401 responses
    if (response.status === 401) {
      const errorData = await response.json();
      showAlert('Unauthorized', errorData.message || 'Please log in to manage your cart.', 'error');
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item');
    }

    const data = await response.json();
    document.querySelector(`tr[data-id="${itemId}"]`).remove();
    calculateGrandTotal();
    updateCartCount(data.cartCount);
    
    if (document.querySelectorAll('#cart-items tr').length === 0) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error removing item:', error);
    showAlert('Error', 'Failed to remove item', 'error');
  }
}

// Update cart (save changes to server)
async function updateCart() {
  const updates = [];
  document.querySelectorAll('#cart-items tr').forEach(row => {
    updates.push({
      id: row.getAttribute('data-id'),
      quantity: parseInt(row.querySelector('.quantity-input').value)
    });
  });

  try {
    const response = await fetch('/user/cart/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates }),
      credentials: 'include'
    });

    // Handle 401 responses
    if (response.status === 401) {
      const errorData = await response.json();
      showAlert('Unauthorized', errorData.message || 'Please log in to update your cart.', 'error');
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      updateCartCount(data.cartCount);
    }
  } catch (error) {
    console.error('Error updating cart:', error);
  }
}

// Fetch current cart count from server
async function fetchCartCount() {
  try {
    const response = await fetch('/user/cart/count', {
      credentials: 'include'
    });

    // Handle 401 responses
    if (response.status === 401) {
      const errorData = await response.json();
      showAlert('Unauthorized', errorData.message || 'Please log in to view your cart.', 'error');
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      updateCartCount(data.cartCount);
    }
  } catch (error) {
    console.error('Error fetching cart count:', error);
  }
}

// Update cart count in UI
function updateCartCount(count) {
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

// Show alert message
function showAlert(title, text, icon) {
  Swal.fire({
    title,
    text,
    icon,
    timer: 2000,
    showConfirmButton: false
  });
}
// Proceed to checkout (now with optional flag to avoid re-prompt after removal)
async function checkout(justRemoved = false) {
  try {
    const response = await fetch('/user/cart/validate-cart', { method: 'GET' });
    const data = await response.json();
    console.log("Validation result:", { success: data.success, invalidIds: data.invalidProductIds?.length, message: data.message });

    if (data.success) {
      Swal.fire({
        title: 'All Good!',
        text: 'Your cart has been validated successfully.',
        icon: 'success',
        confirmButtonText: 'Proceed to Checkout',
        confirmButtonColor: '#3085d6',
      }).then(() => {
        window.location.href = '/user/checkout';
      });
      return;  // Exit early
    }

    // If cart empty
    if (data.message === 'Your cart is empty.') {
      Swal.fire({
        title: 'Empty Cart!',
        text: 'Your cart is empty. Add items to proceed.',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Check if partial invalid
    if (data.invalidProductIds && data.invalidProductIds.length > 0) {
      // If just removed, don't re-offer removal—assume user wants to proceed or manual fix
      if (justRemoved) {
        Swal.fire({
          title: 'Still Issues!',
          text: `${data.message} Please review your cart manually.`,
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d33',
        });
        return;
      }

      // Normal partial invalid prompt
      Swal.fire({
        title: 'Hold on!',
        text: `${data.message} Would you like to remove them and proceed?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Keep Cart As Is',
        cancelButtonText: 'Remove Invalid Items',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
      }).then(async (result) => {
        if (result.isConfirmed) {
          return;  // Close, no action
        }
        // Remove and re-call with flag
        try {
          const removeResponse = await fetch('/user/cart/remove-invalid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invalidProductIds: data.invalidProductIds }),
          });
          const removeData = await removeResponse.json();
          console.log('Removal result:', removeData);  // Debug
          if (removeData.success) {
            // Optional UI update
            // document.getElementById('cartTotal').textContent = `$${removeData.newCartTotal.toFixed(2)}`;
            
            Swal.fire({
              title: 'Updated!',
              text: `${removeData.message} (${removeData.removedCount} item(s) removed). Proceeding to checkout...`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              // Re-run with flag to avoid re-prompt
              checkout(true);
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: removeData.message || 'Failed to remove items.',
              icon: 'error',
              confirmButtonText: 'OK',
            });
          }
        } catch (removeError) {
          console.error('Error removing invalid items:', removeError);
          Swal.fire({
            title: 'Error',
            text: 'Something went wrong while removing items.',
            icon: 'error',
            confirmButtonText: 'OK',
          });
        }
      });
    } else {
      // Full invalid or other error - no removal
      Swal.fire({
        title: 'Hold on!',
        text: data.message || 'Some products are unavailable or inactive.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    }
  } catch (error) {
    console.error('Error in validating the cart:', error);
    Swal.fire({
      title: 'Error',
      text: 'Something went wrong. Please try again.',
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }
}

// Make functions available globally if needed
window.updateQuantity = updateQuantity;
window.updateQuantityInput = updateQuantityInput;
window.removeItem = removeItem;
window.checkout = checkout;