// public/js/checkout.js

document.addEventListener('DOMContentLoaded', function () {
    const checkoutData = document.getElementById('checkout-data');
    const offers = JSON.parse(checkoutData.dataset.offers || '[]');
    const addresses = JSON.parse(checkoutData.dataset.addresses || '[]');
    const cartItems = JSON.parse(checkoutData.dataset.cart || '[]');
    const selectedPayment = checkoutData.dataset.payment || '';

    const addressCards = document.querySelectorAll('.address-card');
    addressCards.forEach((card, index) => {
        const addressDocId = card.dataset.addressId;
        card.addEventListener('click', () => {
            setupAddressSelection(card, addressDocId, index);
        });
    });

    setupPaymentSelection();
    setupFormValidation();

    if (window.location.hash === '#success') {
        showSuccessPage();
    }
});
;

// Address Modal Functions
function openAddressModal(addressId = null) {
    const modal = document.getElementById('addressModal');
    const form = document.getElementById('addressForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    if (addressId && addressId!=='new') {
        // Editing an existing address
        title.textContent = 'Edit Address';
        fetch(`/api/addresses/${addressId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const address = data.address;
                    form.reset();
                    document.getElementById('name').value = address.name;
                  document.getElementById('building').value=address.building;
                   document.getElementById('landmark').value=address.landmark;
                    document.getElementById('city').value = address.city;
                    document.getElementById('state').value = address.state;
                    document.getElementById('pincode').value = address.pincode;
                    document.getElementById('phone').value = address.phone;
                    document.getElementById('altPhone').value=address.altphone;
                    document.getElementById('addressType').value = address.type || 'home';
                    document.getElementById('setDefault').checked = address.isDefault || false;
                    
                    // Store the address ID in the form for update
                    form.dataset.addressId = addressId;
                }else{
                    alert("failed to load address.")
                }
            })
            .catch(error => {
                console.error('Error fetching address:', error);
                alert('Error loading address details');
            });
    } else {
        // Adding a new address
        title.textContent = 'Add New Address';
        
        delete form.dataset.addressId;
    }
    
    modal.style.display = 'block';
}

function closeAddressModal() {
    document.getElementById('addressModal').style.display = 'none';
}

function setupFormValidation() {
    const form = document.getElementById('addressForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            building: document.getElementById('building').value.trim(),
                        landmark: document.getElementById('landmark').value.trim(),
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            pincode: document.getElementById('pincode').value.trim(),
            phone: document.getElementById('phone').value.trim(),
                      altPhone: document.getElementById('altPhone').value.trim(),
 addressType: document.getElementById('addressType').value,
            isDefault: document.getElementById('setDefault').checked
        };
        
        // Basic validation
        if (!formData.name ||! formData.building  ||!formData.city || 
            !formData.state || !formData.pincode|| !formData.phone||!formData.addressType) {
            alert('Please fill in all required fields');
            return;
        }
        
        const addressId = form.dataset.addressId;
       
        if (addressId) {
            updateAddress(addressId, formData);
        } else {
            addAddress(formData);
        }
    });
}

function addAddress(addressData) {
    fetch('/api/addresses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            alert(data.message || 'Error adding address');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding address');
    });
}

function updateAddress(addressId, addressData) {
    fetch(`/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            alert(data.message || 'Error updating address');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating address');
    });
}

function editAddress(addressId) {
    openAddressModal(addressId);
}
function setupAddressSelection(cardElement, addressDocId, addressIndex) {
    const addressCards = document.querySelectorAll('.address-card');
    
    
    addressCards.forEach(card => card.classList.remove('selected'));
    
    
    cardElement.classList.add('selected');
    
   
    const checkoutData = document.getElementById('checkout-data');
    checkoutData.dataset.selectedAddressDoc = addressDocId;
    checkoutData.dataset.selectedAddressIndex = addressIndex;
    
    
    checkoutData.dataset.selectedAddress = `${addressDocId}_${addressIndex}`;
document.getElementById("selectedAddressId").value = addressDocId;

}

// Payment Selection
function setupPaymentSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptions.forEach(o => o.classList.remove('selected'));
            
            this.classList.add('selected');
            
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            const paymentId = this.dataset.payment;
            const paymentTitle = this.querySelector('.payment-title').textContent;
            
            // Store the selected payment method
            document.getElementById('checkout-data').dataset.payment = paymentId;
       
       document.getElementById('selectedPaymentId').value = paymentId;

        });
    });
}

// Offer Functions
function applyOffer(offerId) {
    fetch(`/api/offers/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const offerBtn = document.querySelector(`.apply-offer-btn[onclick*="${offerId}"]`);
            offerBtn.textContent = 'Applied';
            offerBtn.classList.add('applied');
            offerBtn.setAttribute('onclick', `removeOffer('${offerId}')`);
            
            updateOrderSummary(data.offer);
        } else {
            alert(data.message || 'Error applying offer');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error applying offer');
    });
}

function removeOffer(offerId) {
    const offerBtn = document.querySelector(`.apply-offer-btn[onclick*="${offerId}"]`);
    offerBtn.textContent = 'Apply';
    offerBtn.classList.remove('applied');
    offerBtn.setAttribute('onclick', `applyOffer('${offerId}')`);
    
    updateOrderSummary(null, offerId);
}

function updateOrderSummary(offer = null) {
    const getRowValue = (label) => {
        const row = [...document.querySelectorAll('.summary-row')]
            .find(r => r.querySelector('span').textContent.trim().toLowerCase() === label.toLowerCase());
        return row ? parseFloat(row.querySelector('span:last-child').textContent.replace('₹', '').replace('-', '')) || 0 : 0;
    };

    const setRowValue = (label, value, isNegative = false) => {
        const row = [...document.querySelectorAll('.summary-row')]
            .find(r => r.querySelector('span').textContent.trim().toLowerCase() === label.toLowerCase());
        if (row) {
            row.querySelector('span:last-child').textContent = `${isNegative ? '-' : ''}₹${value.toFixed(2)}`;
        }
    };

    const subtotal = getRowValue('Subtotal');
    const delivery = getRowValue('Delivery');
    const tax = getRowValue('Tax (GST 18%)');
    let discount = getRowValue('Discount');

    if (offer) {
        discount = offer.discountAmount || 0;
        setRowValue('Discount', discount, true);
    }

    const total = subtotal + delivery + tax - discount;
    setRowValue('TOTAL', total);
}

// Place Order Function
function placeOrder() {
  const btn = document.querySelector('.continue-btn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const checkoutData = document.getElementById('checkout-data');
  const selectedAddress = document.querySelector('.address-card.selected')?.dataset.addressId;
  const paymentMethod = checkoutData.dataset.payment;
  const appliedOffers = [];

  if (!selectedAddress) {
    Swal.fire({
      icon: 'warning',
      title: 'Select Delivery Address',
      text: 'Please select a delivery address to proceed',
      confirmButtonText: 'Continue'
    });
    btn.disabled = false;
    btn.textContent = 'Place Order';
    return;
  }

  if (!paymentMethod) {
    Swal.fire({
      icon: 'warning',
      title: 'Select Payment Method',
      text: 'Please select a payment method to proceed',
      confirmButtonText: 'Continue'
    });
    btn.disabled = false;
    btn.textContent = 'Place Order';
    return;
  }

  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addressId: selectedAddress,
      paymentMethod,
      appliedOffers
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Order Placed!',
          text: 'Your order was placed successfully.',
          confirmButtonText: 'View Order'
        }).then(() => {
          window.location.href = `/order-success/${data.orderId}`;
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Error placing order',
          confirmButtonText: 'Try Again'
        });
        btn.disabled = false;
        btn.textContent = 'Place Order';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
        text: 'Please try again later.',
        confirmButtonText: 'Okay'
      });
      btn.disabled = false;
      btn.textContent = 'Place Order';
    });
}


// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('addressModal');
    if (event.target === modal) {
        closeAddressModal();
    }
});
window.addEventListener("DOMContentLoaded", () => {
  const successModal = document.getElementById("successModal");
  const closeBtn = document.getElementById("closeOrderSuccessModal");

  if (successModal) {
    successModal.style.display = "flex";

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        successModal.style.display = "none";
      });
    }
  }
});
