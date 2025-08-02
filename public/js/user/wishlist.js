
document.addEventListener('DOMContentLoaded', function() {
  // Add to cart buttons
  document.querySelectorAll('.add-btn').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      addToCart(itemId);
    });
  });
  
  // Remove buttons
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      removeFromWishlist(itemId);
    });
  });
});

function addToCart(itemId) {
  fetch(`/wishlist/add-to-cart/${itemId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      alert(data.message);
      // Optionally update the UI or redirect
      window.location.reload();
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function removeFromWishlist(itemId) {
  fetch(`/wishlist/remove/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      // Remove the item from the DOM or reload
      window.location.reload();
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
 document.querySelectorAll('.wishlist-btn').forEach(button => {
    button.addEventListener('click', function () {
      const productId = this.getAttribute('data-id');
      addToWishlist(productId);
    });
  });


function addToWishlist(productId) {
  fetch(`/wishlist/add/${productId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      alert(data.message);
      // Optionally refresh or update icon
    }
  })
  .catch(error => {
    console.error('Error adding to wishlist:', error);
  });
}