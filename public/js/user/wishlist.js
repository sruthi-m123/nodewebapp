document.addEventListener('DOMContentLoaded', () => {
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
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Removed from wishlist',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });
      } else {
        console.log('Swal not loaded - Removed from wishlist');
      }

      if (data.wishlistCount === 0) {
        setTimeout(() => window.location.reload(), 2200);  
      }
    }

  } catch (error) {
    console.error('Error:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: error.message,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
    } else {
      console.error('Swal not loaded - Error:', error.message);
    }
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

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: data.message || 'Item added to cart',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
    } else {
      console.log('Swal not loaded - Item added to cart');
    }

    setTimeout(() => window.location.reload(), 2200);  

  } catch (error) {
    console.error('Error:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: error.message,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
    } else {
      console.error('Swal not loaded - Error:', error.message);
    }
  }
}

// Uncomment and use if needed for addToWishlist
// async function addToWishlist(itemId) {
//   try {
//     const response = await fetch(`/user/wishlist/add/${itemId}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' }
//     });

//     const data = await response.json();
//     if (!response.ok) {
//       throw new Error(data.error || 'Failed to add to wishlist');
//     }

//     // SweetAlert2 success toast if available
//     if (typeof Swal !== 'undefined') {
//       Swal.fire({
//         toast: true,
//         position: 'top-end',
//         icon: 'success',
//         title: 'Added to wishlist',
//         showConfirmButton: false,
//         timer: 2000,
//         timerProgressBar: true,
//         didOpen: (toast) => {
//           toast.addEventListener('mouseenter', Swal.stopTimer);
//           toast.addEventListener('mouseleave', Swal.resumeTimer);
//         }
//       });
//     } else {
//       console.log('Swal not loaded - Added to wishlist');
//     }

//     return { success: true, data };
//   } catch (error) {
//     console.error('Error:', error);
//     // SweetAlert2 error toast if available
//     if (typeof Swal !== 'undefined') {
//       Swal.fire({
//         toast: true,
//         position: 'top-end',
//         icon: 'error',
//         title: error.message,
//         showConfirmButton: false,
//         timer: 2500,
//         timerProgressBar: true,
//         didOpen: (toast) => {
//           toast.addEventListener('mouseenter', Swal.stopTimer);
//           toast.addEventListener('mouseleave', Swal.resumeTimer);
//         }
//       });
//     } else {
//       console.error('Swal not loaded - Error:', error.message);
//     }
//     return { success: false };
//   }
// }