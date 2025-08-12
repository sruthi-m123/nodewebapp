// Event Delegation for dynamic elements
document.addEventListener('click', async (e) => {
  // Handle remove button clicks
  if (e.target.classList.contains('remove-btn')) {
    e.preventDefault();
    const itemId = e.target.getAttribute('data-id');
    await removeFromWishlist(itemId);
  }

  // Handle add to cart button clicks
  if (e.target.classList.contains('add-btn')) {
    e.preventDefault();
    const itemId = e.target.getAttribute('data-id');
    await addToCart(itemId);
  }
});

async function removeFromWishlist(itemId) {
  try {
    const response = await fetch(`/user/wishlist/remove/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove item');
    }

    // Remove item from UI
    const itemElement = document.querySelector(`tr[data-id="${itemId}"]`);
    if (itemElement) {
      itemElement.remove();
      
      // Update counter from response
      const counter = document.querySelector('.wishlist-summary span');
      if (counter) {
        counter.textContent = `${data.wishlistCount} items in wishlist`;
      }
      
      // Reload if wishlist is empty
      if (data.wishlistCount === 0) {
        window.location.reload();
      }
    }

  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

async function addToCart(itemId) {
  try {
    const response = await fetch(`/user/wishlist/add-to-cart/${itemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add to cart');
    }

    alert(data.message || 'Item added to cart');
    window.location.reload(); // Refresh to update cart count

  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}