

// // Set default address
// function setDefaultAddress(addressId) {
//   fetch(`/addresses/set-default/${addressId}`, {
//     method: 'PUT'
//   })
//   .then(res => res.json())
//   .then(data => {
//     if (data.success) {
//       location.reload();
//     } else {
//       alert('Failed to set default address.');
//     }
//   });
// }

// Get elements
const modal = document.getElementById('addAddressModal');
const openModalBtn = document.getElementById('openAddAddressModal');
const closeModalBtn = document.querySelector('.close-modal');
const addressForm = document.querySelector('#addAddressForm');
const modalTitle = document.querySelector('#addAddressModal h3');

// Open modal for adding
openModalBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modalTitle.textContent = 'Add New Address';
  addressForm.reset();
  addressForm.action = '/addresses/add';
  modal.style.display = 'flex';
});

// Close modal
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Edit button handler
document.querySelectorAll('.edit-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const addressCard = e.target.closest('.address-card');
    const addressId = e.target.getAttribute('href').split('/').pop();
    
    // Extract address data from the card (you might need to add data attributes)
    const name = addressCard.querySelector('[data-name]')?.textContent;
    const phone = addressCard.querySelector('[data-phone]')?.textContent;
    const city = addressCard.querySelector('[data-city]')?.textContent;
    const state = addressCard.querySelector('[data-state]')?.textContent;
    const pincode = addressCard.querySelector('[data-pincode]')?.textContent;
    const landmark = addressCard.querySelector('[data-landmark]')?.textContent;
    const building = addressCard.querySelector('[data-building]')?.textContent;

    // Update modal
    modalTitle.textContent = 'Edit Address';
        addressForm.querySelector('[name="building"]').value = building || '';
    addressForm.querySelector('[name="name"]').value = name || '';
    addressForm.querySelector('[name="phone"]').value = phone || '';
    addressForm.querySelector('[name="city"]').value = city || '';
    addressForm.querySelector('[name="state"]').value = state || '';
    addressForm.querySelector('[name="pincode"]').value = pincode || '';
    addressForm.querySelector('[name="landmark"]').value = landmark || '';
    
    // Update form action for edit
    addressForm.action = `/addresses/edit/${addressId}`;
    modal.style.display = 'flex';
  });
});

// Form submission handler
addressForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData(addressForm);
    const jsonData = {};
    formData.forEach((value, key) => {
      jsonData[key] = value;
    });

    const url = addressForm.action;
    const method = url.includes('edit') ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(jsonData) // ✅ send only this
    });

    const data = await response.json();

    if (data.success) {
      location.reload();
    } else {
      alert(data.message || 'Failed to save address');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while saving the address');
  }
});

// Delete button handler
document.querySelectorAll('.delete-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const confirmDelete = confirm("Are you sure you want to delete this address?");
    if (!confirmDelete) return;
    
    const form = e.target.closest('form');
    
    try {
      const response = await fetch(form.action, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },

              });
      
      const data = await response.json();
      
      if (data.success) {
        location.reload();
      } else {
        alert('Failed to delete address');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while deleting the address');
    }
  });
});
//set defalult 
  document.querySelectorAll('.set-default-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault(); // prevent form submission

      const form = e.target.closest('form');
      const actionUrl = form.getAttribute('action'); // e.g. /set-default-address/123

      try {
        const response = await fetch(actionUrl, {
          method: 'POST',
          credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
        });

         if (response.ok) {
        const result = await response.json();
        console.log('Default address updated:', result.message);
        alert(result.message); // Simple browser alert
        location.reload(); // refresh to reflect change
      } else {
        const error = await response.json();
        console.error('Error:', error.message || 'Something went wrong');
        alert(error.message || 'Something went wrong');
      }
      } catch (err) {
        console.error('AJAX error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Server error. Please try again later.'
        });
      }
    });
  });

