console.log("checkout.js is running ");
// const { response } = require("express");

// let addressToDelete=null;
document.addEventListener('DOMContentLoaded', function () {
    const checkoutData = document.getElementById('checkout-data');
    console.log("checkout datas:",checkoutData);
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
                console.log("data inside the edit address ate checkout page:",data);
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
                    document.getElementById('addressType').value = address.addressType || 'home';
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
    fetch('/user/addresses/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Address added successfully',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || 'Error adding address'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error adding address'
        });
    });
}

function updateAddress(addressId, addressData) {
    fetch(`/user/addresses/edit/${addressId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Address updated successfully',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || 'Error updating address'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error updating address'
        });
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
        
        showToast('Address deleted successfully', 'success');
        
        closeDeleteModal();
    } else {
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







function updateOrderSummary(orderSummary) {
    const formatCurrency = (value, isNegative = false) =>
        `${isNegative ? '-' : ''}₹${value.toFixed(2)}`;

    // document.getElementById("summary-subtotal").textContent = formatCurrency(orderSummary.subtotal);
    document.getElementById("summary-delivery").textContent = formatCurrency(orderSummary.delivery);
    document.getElementById("summary-tax").textContent = formatCurrency(orderSummary.tax);
    document.getElementById("summary-couponDiscount").textContent=formatCurrency(orderSummary.couponDiscount);
    // document.getElementById("summary-discount").textContent = formatCurrency(orderSummary.discount, true);
    document.getElementById("summary-total").textContent = formatCurrency(orderSummary.total);
}


// Coupon Managment
var appliedCoupon = null;

function toggleCouponDropdown() {
    const dropdown = document.getElementById('couponDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    
    dropdown.classList.toggle('show');
    arrow.style.transform = dropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
}

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
   const isRetry = window.isRetry || window.location.search.includes('retry=true') || document.body.dataset.isRetry === 'true';
  const url = isRetry ? '/user/checkout/apply-coupon-by-code?retry=true' : '/user/checkout/apply-coupon-by-code';
    const applyButton = document.querySelector('.apply-coupon-input-btn');
    setButtonLoadingState(applyButton, 'Applying...');
    
    apiCall(url, 'POST', { couponCode }, 'Coupon applied successfully')
        .then(data => {
            console.log("data by apply coupon code ",data);
            if (data.success) {
                
  appliedCoupon = { 
        id: data.appliedCoupon.couponId,
        code: data.appliedCoupon.code,
        type: data.appliedCoupon.type,
        value: data.appliedCoupon.value
    };
                updateAppliedCouponUI(data.couponCode, data.discountText, data.couponId);
                   updateOrderSummary(data.orderSummary);
                updateCouponButtons(data.couponId, data.couponCode);
            }else{
                showToast(data.message,'error')
            }
        })
        .catch(err => {
      console.log("Error in applyCouponByCode:", err);
      showToast("Something went wrong", 'error');
    })
        .finally(() => {
 if (!appliedCoupon) {
                resetButtonState(applyButton, 'Apply');
            }
                });
}

// Apply coupon from dropdown
function applyCouponFromDropdown(couponId, couponCode,couponType, couponValue) {
    const isRetry=window.location.search.includes('retry=true')||document.body.dataset.isRetry==='true';
    console.log("isRetry:",isRetry);
    const url=isRetry?'/user/checkout/apply-coupon?retry=true':'/user/checkout/apply-coupon';
    const applyButton = document.querySelector(`.coupon-dropdown-item[data-coupon-id="${couponId}"] .apply-coupon-dropdown-btn`);
    setButtonLoadingState(applyButton, 'Applying...');
    
    apiCall(url, 'POST', { couponId }, 'Coupon applied successfully')
        .then(data => {
            if (data.success) {
                console.log("orderSummary",data.orderSummary)
                 appliedCoupon = { id: couponId, code: couponCode,type:couponType,value:couponValue };
                 console.log("appliedCoupon",appliedCoupon);
                updateAppliedCouponUI(couponCode, data.discountText, couponId);
                   updateOrderSummary(data.orderSummary);
                updateCouponButtons(couponId, couponCode);
            }else{
                console.log("hiiiiiiii")
                                showToast(data.message,'error')
   if (data.message === "You have already used this coupon") {
                    applyButton.disabled = true;
                    applyButton.textContent = 'Used';
                    applyButton.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    resetButtonState(applyButton, 'Apply');
                }
            }
        })
        .catch(error=>{
            console.log("error:",error)
            showToast("something went wrong",'error');
            resetButtonState(applyButton,'Apply');
        })
       
}

function removeCoupon() {

    const removeBtn = document.querySelector('.remove-coupon-btn');
    if (removeBtn) {
        removeBtn.textContent = 'Removing...';
        removeBtn.disabled = true;
    }

    apiCall('/user/checkout/remove-coupon', 'POST', null, 'Coupon removed successfully')
        .then(data => {
            console.log("coupon is going to be removed ",data)
            if (data.success) {
                appliedCoupon=null;
                resetCouponUI();
                updateOrderSummary(data.orderSummary);
                resetCouponButtons();

          
            }
        })
    
  
        .catch(() => {
            if (removeBtn) {
                removeBtn.textContent = 'Remove';
                removeBtn.disabled = false;
            }
        })
         .finally(() => {
            if (removeBtn) {
                removeBtn.textContent = 'Remove';
                removeBtn.disabled = false;
            }
        });
}

      

// Update UI when coupon is applied
function updateAppliedCouponUI(couponCode, discountText, couponId) {
    document.getElementById('appliedCouponText').textContent = `Applied: ${couponCode} - ${discountText}`;
    document.getElementById('appliedCouponId').value = couponId;
    document.getElementById('appliedCouponContainer').style.display = 'block';
    document.getElementById('couponCodeInput').value = '';
    
    // appliedCoupon = { id: couponId, code: couponCode,type:couponType,value:couponValue };
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
    // const inputButton = document.querySelector('.apply-coupon-input-btn');
    // if (inputButton) {
    //     inputButton.textContent = 'Applied';
    //     inputButton.classList.add('applied');
    //     inputButton.disabled = true;
    // }
    // Disable all other apply buttons
    document.querySelectorAll('.apply-coupon-dropdown-btn:not(.applied)').forEach(btn => {
        btn.disabled = true;
    });
}

// Reset coupon buttons
function resetCouponButtons() {
    try{
    console.log("inside the resetCouponbutton");
    setTimeout(() => {
        document.querySelectorAll('.apply-coupon-dropdown-btn').forEach(btn => {
            btn.textContent = 'Apply';
            btn.classList.remove('applied', 'loading', 'btn-disabled');
            btn.disabled = false;
            console.log("After reset:", btn.className, btn.textContent);
        });
    }, 50); // wait 50ms to let DOM update
}catch(error){
    console.log("reset coupon button errpr:",error);
}
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
    console.log('apiCall request:', { url, method, data });  // NEW: Log outgoing request

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
            const errorClone = response.clone();

            if (!response.ok) {
                const errorData = await errorClone.json().catch(() => ({}));
                console.error('HTTP Error in apiCall:', { status: response.status, errorData });  
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
           
            const data = await response.json();
            console.log('API Response:', data);  
            return data;
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










function placeOrder() {
  const btn = document.querySelector('.continue-btn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const selectedAddress = document.querySelector('.address-card.selected')?.dataset.addressId;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || '';
  const appliedOffers = [];

  if (!selectedAddress) {
    Swal.fire({ icon: 'warning', title: 'Select Delivery Address', text: 'Please select a delivery address to proceed', confirmButtonText: 'Continue' });
    btn.disabled = false; btn.textContent = 'Place Order'; return;
  }
  if (!paymentMethod) {
    Swal.fire({ icon: 'warning', title: 'Select Payment Method', text: 'Please select a payment method to proceed', confirmButtonText: 'Continue' });
    btn.disabled = false; btn.textContent = 'Place Order'; return;
  }
console.log("appliedCoupon in place order",appliedCoupon);

const isRetry=window.isRetry||window.location.search.includes('retry=true')||document.body.dataset.isRetry==='true';

const payload={
    addressId:selectedAddress,
    paymentMethod,
    appliedOffers
};
if(isRetry){
    payload.isRetry=true;
    console.log('Adding isRetry:true to payload');

}
console.log("submiting payload:",payload);
  // single fetch call
  fetch('/user/orders-placed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload})
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Error placing order', confirmButtonText: 'Try Again' });
      btn.disabled = false; btn.textContent = 'Place Order';
      return;
    }

    if (paymentMethod === 'netbanking') {
      payWithRazorpay(data.order, data.key,data.dborderID);
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Order Placed!',
        text: 'Your order was placed successfully.',
        confirmButtonText: 'View Order'
      }).then(() => {
        window.location.href = `/user/order-success/${data.orderId}`;
      });
    }
  })
  .catch(error => {
    console.error('Error:', error);
    Swal.fire({ icon: 'error', title: 'Something went wrong', text: 'Please try again later.', confirmButtonText: 'Okay' });
    btn.disabled = false; btn.textContent = 'Place Order';
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
  if (!message) {
    console.warn('showToast: No message provided');  
    return;
  }

  const toast = document.createElement("div");
  toast.textContent = message;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;  /* top-5 equivalent */
    right: 20px;  /* right-5 */
    z-index: 9999;
    padding: 12px 16px;  /* px-4 py-2 */
    border-radius: 8px;  /* rounded */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);  /* shadow */
    color: white;
    font-size: 14px;
    font-weight: 500;
    min-width: 250px;
    max-width: 350px;
    text-align: center;
    opacity: 0;
    transform: translateX(100%);
    transition: opacity 0.3s ease, transform 0.3s ease;
    background-color: ${type === "error" ? "#ef4444" : "#10b981"};  /* bg-red-500 or bg-green-500 */
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Auto-remove after 3s with fade out
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}


function payWithRazorpay(order,key,dborderId) {
   
  var options = {
    key: key, 
    amount: order.amount,
    currency: "INR",
    name: "Chettinad Sarees",
    description: "Order Payment",
    order_id: order.id,
    handler: function (response) {
      fetch("/user/verifyPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,  
        razorpay_signature: response.razorpay_signature,
        dborderId:dborderId
      })
        })
        .then(res => res.json())
        .then(data => {
        if(data.success){
  Swal.fire({
            icon: 'success',
            title: 'Order Placed!',
            text: 'Your order was placed successfully.',
            confirmButtonText: 'View Order'
          }).then(() => {
            window.location.href = data.redirectUrl || `/user/order-success/${order.receipt}`;
          });        } else {
 
          Swal.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: 'Your payment could not be verified. Please try again.',
            confirmButtonText: 'Retry'
          }).then(() => {
            window.location.href = `/user/order-failure/${order.receipt}`;
          });
}
      });
    },
    prefill: {
      name: "Customer Name",
      email: "customer@example.com",
      contact: "9876543210"
    },
    theme: {
      color: "#3399cc"
    }
  };
  var rzp = new Razorpay(options);
   rzp.on('payment.failed', function(response){
        console.log('Payment failed event:', response);
       
        fetch("/user/mark-payment-failed",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({dborderId:dborderId})
        })
        .then(res=>res.json())
        .then(data=>console.log(data));
        Swal.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: response.error.description || 'Your payment could not be processed.',
            confirmButtonText: 'Retry'
        }).then(() => {
            window.location.href = `/user/order-failure/${order.receipt}`;
        });
    });
  rzp.open();
}

