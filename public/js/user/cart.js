// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  setupCartEventListeners();
  
  // Initial calculations
  calculateGrandTotal();
  
  // Initial cart count fetch
  fetchCartCount();
});

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
  console.log("itemId inside the quantity function:",itemId);
  console.log("value ",value);
  value=parseInt(value);
  if(isNaN(value))value=1;
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
  }}

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
  console.log("itemId:",itemId);
  try {
    const response = await fetch(`/user/cart/remove/${itemId}`, {
      method: 'DELETE',
      headers:{
        'Content-Type':'application/json'
      },
      credentials: 'include' 
    });
    
 if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item');
    }

    if (response.ok) {
      const data = await response.json();
      document.querySelector(`tr[data-id="${itemId}"]`).remove();
      calculateGrandTotal();
      updateCartCount(data.cartCount);
      
      if (document.querySelectorAll('#cart-items tr').length === 0) {
        window.location.reload();
      }
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
    const response = await fetch('/cart/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates }),
      credentials: 'include'
    });
    
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
    const response = await fetch('/cart/count', {
      credentials: 'include'
    });
    
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

// Proceed to checkout
function checkout() {
  window.location.href = '/checkout';
}

// Make functions available globally if needed
window.updateQuantity = updateQuantity;
window.updateQuantityInput = updateQuantityInput;
window.removeItem = removeItem;
window.checkout = checkout;