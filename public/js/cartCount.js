// Function to update cart count in the UI
function updateCartCount(count) {
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

// Function to fetch current cart count
async function fetchCartCount() {
  try {
    const response = await fetch('/cart/count');
    if (response.ok) {
      const data = await response.json();
      updateCartCount(data.cartCount);
    }
  } catch (error) {
    console.error('Error fetching cart count:', error);
  }
}

// Update cart count when items are added/removed (for AJAX operations)
document.addEventListener('DOMContentLoaded', () => {
  // Initial load
  fetchCartCount();
  
  // Listen for custom events that might be triggered after cart operations
  document.addEventListener('cartUpdated', fetchCartCount);
});

// Make this function available globally if needed
window.updateCartCount = updateCartCount;