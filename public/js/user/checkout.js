const { response } = require("express");
// let addressToDelete=null;
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
        fetch(`/user/api/addresses/${addressId}`)
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
//delete address
var addressToDelete=null;

function confirmDeleteAddress(addressId){
    addressToDelete=addressId;
    
    const modal=document.getElementById('deleteConfirmModal');
    modal.style.display='flex';
}

function closeDeleteModal(){
    const modal=document.getElementById('deleteConfirmModal');
    modal.style.display='none';
    addressToDelete=null;
}

function deleteAddress(){
    if(!addressToDelete) return;
     const confirmBtn = document.querySelector('.delete-confirm-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Deleting...';
    confirmBtn.disabled = true;

    fetch(`/user/addresses/delete/${addressToDelete}`,{
        method:'DELETE',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({addressId:addressToDelete})
    })
    .then(response=>response.json())
.then(data => {
    if (data.success) {
        const addressCard = document.querySelector(`.address-card[data-address-id="${addressToDelete}"]`);
        if (addressCard) {
            addressCard.classList.add('deleted');
            addressCard.onclick = null; 
            
            // Hide actions
            const actions = addressCard.querySelector('.address-actions');
            if (actions) {
                actions.style.display = 'none';
            }
            
       
            const deletedBadge = document.createElement('span');
            deletedBadge.className = 'deleted-badge';
            deletedBadge.textContent = 'Deleted';
            deletedBadge.style.cssText = `
                position: absolute;
                top: 10px;
                right: 15px;
                background: #6c757d;
                color: white;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
            `;
            addressCard.appendChild(deletedBadge);
        }
        
        // Show success message
        showToast('Address deleted successfully', 'success');
        
        // Close modal
        closeDeleteModal();
    } else {
        // Show error message
        showToast(data.message || 'Failed to delete address', 'error');
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
})
    .catch(error => {
        console.error('Error deleting address:', error);
        showToast('An error occurred while deleting the address', 'error');
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    });

}
document.getElementById('deleteConfirmModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeDeleteModal();
    }
});



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

// ==================== COUPON MANAGEMENT ====================
var appliedCoupon = null;

// Toggle coupon dropdown
function toggleCouponDropdown() {
    const dropdown = document.getElementById('couponDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    
    dropdown.classList.toggle('show');
    arrow.style.transform = dropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('couponDropdown');
    const dropdownHeader = document.querySelector('.coupon-dropdown-header');
    
    if (dropdownHeader && !dropdownHeader.contains(event.target) && 
        dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
        document.querySelector('.dropdown-arrow').style.transform = 'rotate(0deg)';
    }
});

// Apply coupon from input field
function applyCouponByCode() {
    const couponCode = document.getElementById('couponCodeInput').value.trim();
    
    if (!couponCode) {
        showToast('Please enter a coupon code', 'error');
        return;
    }
    
    const applyButton = document.querySelector('.apply-coupon-input-btn');
    setButtonLoadingState(applyButton, 'Applying...');
    
    apiCall('/user/checkout/applyCoupon', 'POST', { couponCode }, 'Coupon applied successfully')
        .then(data => {
            if (data.success) {
                updateAppliedCouponUI(data.couponCode, data.discountText, data.couponId);
                updateOrderSummary(data.updatedSummary);
                updateCouponButtons(data.couponId, data.couponCode);
            }
        })
        .finally(() => {
            resetButtonState(applyButton, 'Apply');
        });
}

// Apply coupon from dropdown
function applyCouponFromDropdown(couponId, couponCode) {
    const applyButton = document.querySelector(`.coupon-dropdown-item[data-coupon-id="${couponId}"] .apply-coupon-dropdown-btn`);
    setButtonLoadingState(applyButton, 'Applying...');
    
    apiCall('/user/apply-coupon', 'POST', { couponId }, 'Coupon applied successfully')
        .then(data => {
            if (data.success) {
                updateAppliedCouponUI(couponCode, data.discountText, couponId);
                updateOrderSummary(data.updatedSummary);
                updateCouponButtons(couponId, couponCode);
            }
        })
        .finally(() => {
            if (!appliedCoupon) {
                resetButtonState(applyButton, 'Apply');
            }
        });
}

// Remove applied coupon
function removeCoupon() {
    apiCall('/user/remove-coupon', 'POST', null, 'Coupon removed successfully')
        .then(data => {
            if (data.success) {
                resetCouponUI();
                updateOrderSummary(data.updatedSummary);
                resetCouponButtons();
            }
        });
}

// Update UI when coupon is applied
function updateAppliedCouponUI(couponCode, discountText, couponId) {
    document.getElementById('appliedCouponText').textContent = `Applied: ${couponCode} - ${discountText}`;
    document.getElementById('appliedCouponId').value = couponId;
    document.getElementById('appliedCouponContainer').style.display = 'block';
    document.getElementById('couponCodeInput').value = '';
    
    appliedCoupon = { id: couponId, code: couponCode };
}

// Reset coupon UI
function resetCouponUI() {
    document.getElementById('appliedCouponContainer').style.display = 'none';
    document.getElementById('appliedCouponId').value = '';
    appliedCoupon = null;
}

// Update coupon buttons state
function updateCouponButtons(couponId, couponCode) {
    // Update dropdown button
    const dropdownButton = document.querySelector(`.coupon-dropdown-item[data-coupon-id="${couponId}"] .apply-coupon-dropdown-btn`);
    if (dropdownButton) {
        dropdownButton.textContent = 'Applied';
        dropdownButton.classList.add('applied');
        dropdownButton.disabled = true;
    }
    
    // Disable all other apply buttons
    document.querySelectorAll('.apply-coupon-dropdown-btn:not(.applied)').forEach(btn => {
        btn.disabled = true;
    });
}

// Reset coupon buttons
function resetCouponButtons() {
    document.querySelectorAll('.apply-coupon-dropdown-btn').forEach(btn => {
        if (!btn.classList.contains('btn-disabled')) {
            btn.textContent = 'Apply';
            btn.classList.remove('applied');
            btn.disabled = false;
        }
    });
}
// Set button to loading state
function setButtonLoadingState(button, loadingText = 'Loading...') {
    if (!button) return;
    
    button.setAttribute('data-original-text', button.textContent);
    button.innerHTML = `<span class="button-loading-spinner"></span> ${loadingText}`;
    button.disabled = true;
    button.classList.add('loading');
}

// Reset button to normal state
function resetButtonState(button, defaultText = null) {
    if (!button) return;
    
    const originalText = button.getAttribute('data-original-text') || defaultText || button.textContent;
    button.textContent = originalText;
    button.disabled = false;
    button.classList.remove('loading');
    button.removeAttribute('data-original-text');
}

// API call with existing toast system
function apiCall(url, method = 'GET', data = null, successMessage = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    return fetch(url, options)
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'An error occurred');
            }
            return response.json();
        })
        .then(data => {
            if (successMessage && data.success) {
                showToast(successMessage, 'success');
            }
            return data;
        })
        .catch((error) => {
            console.error('API call failed:', error);
            showToast(error.message || 'Something went wrong. Please try again.', 'error');
            throw error;
        });
}

// // Update order summary
// function updateOrderSummary(summary) {
//     if (!summary) return;
    
//     const updateSummaryRow = (selector, value, isNegative = false) => {
//         const element = document.querySelector(selector);
//         if (element) {
//             element.textContent = `${isNegative ? '-' : ''}₹${value.toFixed(2)}`;
//         }
//     };
    
//     if (summary.subtotal !== undefined) updateSummaryRow('.summary-row:nth-child(2) span:last-child', summary.subtotal);
//     if (summary.discount !== undefined) updateSummaryRow('.summary-row:nth-child(5) span:last-child', summary.discount, true);
//     if (summary.total !== undefined) updateSummaryRow('.summary-row.total span:last-child', summary.total);
// }

// Allow pressing Enter in coupon input
document.getElementById('couponCodeInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        applyCouponByCode();
    }
});

// Initialize coupon section
function initializeCoupons() {
    // Close dropdown on outside click
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('couponDropdown');
        const dropdownHeader = document.querySelector('.coupon-dropdown-header');
        
        if (dropdownHeader && !dropdownHeader.contains(event.target) && 
            dropdown && !dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
            document.querySelector('.dropdown-arrow').style.transform = 'rotate(0deg)';
        }
    });
}

// Add to your existing initializeCheckout function
function initializeCheckout() {
    // ... existing code ...
    initializeCoupons();
    // ... existing code ...
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

  fetch('/user/orders-placed', {
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
          window.location.href = `/user/order-success/${data.orderId}`;
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
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed top-5 right-5 px-4 py-2 rounded shadow text-white 
    ${type === "error" ? "bg-red-500" : "bg-green-500"}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
