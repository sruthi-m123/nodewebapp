const modal = document.getElementById('addAddressModal');
const openModalBtn = document.getElementById('openAddAddressModal');
const closeModalBtn = document.querySelector('.close-modal');
const addressForm = document.querySelector('#addAddressForm');
const modalTitle = document.querySelector('#addAddressModal h3');

openModalBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modalTitle.textContent = 'Add New Address';
  addressForm.reset();
  addressForm.action = '/user/addresses/add';
  modal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

document.querySelectorAll('.edit-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const addressCard = e.target.closest('.address-card');
    const addressId = e.target.getAttribute('href').split('/').pop();
    const name = addressCard.querySelector('[data-name]')?.textContent;
    const phone = addressCard.querySelector('[data-phone]')?.textContent;
    const city = addressCard.querySelector('[data-city]')?.textContent;
    const state = addressCard.querySelector('[data-state]')?.textContent;
    const pincode = addressCard.querySelector('[data-pincode]')?.textContent;
    const landmark = addressCard.querySelector('[data-landmark]')?.textContent;
    const building = addressCard.querySelector('[data-building]')?.textContent;

    modalTitle.textContent = 'Edit Address';
    addressForm.querySelector('[name="building"]').value = building || '';
    addressForm.querySelector('[name="name"]').value = name || '';
    addressForm.querySelector('[name="phone"]').value = phone || '';
    addressForm.querySelector('[name="city"]').value = city || '';
    addressForm.querySelector('[name="state"]').value = state || '';
    addressForm.querySelector('[name="pincode"]').value = pincode || '';
    addressForm.querySelector('[name="landmark"]').value = landmark || '';

    addressForm.action = `/user/addresses/edit/${addressId}`;
    modal.style.display = 'flex';
  });
});

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
      body: JSON.stringify(jsonData)
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Address saved successfully',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        location.reload();
      });
    } else {
      console.log("message:", data.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'Failed to save address'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while saving the address'
    });
  }
});

// Delete button 
document.querySelectorAll('.delete-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const form = e.target.closest('form');
        console.log("form action:", form.action);

        try {
          const response = await fetch(form.action, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          });

          const data = await response.json();

          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Address has been deleted.',
              timer: 1500,
              showConfirmButton: false
            }).then(() => {
              location.reload();
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete address'
            });
          }
        } catch (error) {
          console.error('Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while deleting the address'
          });
        }
      }
    });
  });
});

document.querySelectorAll('.set-default-btn').forEach(button => {
  button.addEventListener('click', async (e) => {
    e.preventDefault();

    const form = e.target.closest('form');
    const actionUrl = form.getAttribute('action');

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
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: result.message,
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          location.reload();
        });
      } else {
        const error = await response.json();
        console.error('Error:', error.message || 'Something went wrong');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Something went wrong'
        });
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
