document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('remove-btn')) {
    e.preventDefault();
    const itemId = e.target.getAttribute('data-id');
    await removeFromWishlist(itemId);
  }

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

    const itemElement = document.querySelector(`tr[data-id="${itemId}"]`);
    if (itemElement) {
      itemElement.remove();
      
      const counter = document.querySelector('.wishlist-summary span');
      if (counter) {
        counter.textContent = `${data.wishlistCount} items in wishlist`;
      }
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Removed from wishlist',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });

      if (data.wishlistCount === 0) {
        setTimeout(() => window.location.reload(), 2100); 
      }
    }

  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.message,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
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

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: data.message || 'Item added to cart',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    setTimeout(() => window.location.reload(), 2100);

  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.message,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  }
}
