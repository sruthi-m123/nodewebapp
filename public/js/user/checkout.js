// public/js/checkout.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize data from the hidden div
    const checkoutData = document.getElementById('checkout-data');
    const offers = JSON.parse(checkoutData.dataset.offers || '[]');
    const addresses = JSON.parse(checkoutData.dataset.addresses || '[]');
    const cartItems = JSON.parse(checkoutData.dataset.cart || '[]');
    const selectedPayment = checkoutData.dataset.payment || '';
    
    // Set up event listeners
    setupAddressSelection();
    setupPaymentSelection();
    setupFormValidation();
    
    // If we're showing the success page, hide the main content
    if (window.location.hash === '#success') {
        showSuccessPage();
    }
});

// Address Modal Functions
function openAddressModal(addressId = null) {
    const modal = document.getElementById('addressModal');
    const form = document.getElementById('addressForm');
    const title = document.getElementById('modalTitle');
    
    if (addressId) {
        // Editing an existing address
        title.textContent = 'Edit Address';
        fetch(`/api/addresses/${addressId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const address = data.address;
                    form.reset();
                    document.getElementById('fullName').value = address.name;
                    document.getElementById('addressLine1').value = address.addressLine1;
                    document.getElementById('addressLine2').value = address.addressLine2 || '';
                    document.getElementById('city').value = address.city;
                    document.getElementById('state').value = address.state;
                    document.getElementById('zipCode').value = address.zipCode;
                    document.getElementById('phone').value = address.phone;
                    document.getElementById('addressType').value = address.type || 'home';
                    document.getElementById('setDefault').checked = address.isDefault || false;
                    
                    // Store the address ID in the form for update
                    form.dataset.addressId = addressId;
                }
            })
            .catch(error => {
                console.error('Error fetching address:', error);
                alert('Error loading address details');
            });
    } else {
        // Adding a new address
        title.textContent = 'Add New Address';
        form.reset();
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
            name: document.getElementById('fullName').value,
            addressLine1: document.getElementById('addressLine1').value,
            addressLine2: document.getElementById('addressLine2').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            phone: document.getElementById('phone').value,
            type: document.getElementById('addressType').value,
            isDefault: document.getElementById('setDefault').checked
        };
        
        // Basic validation
        if (!formData.name || !formData.addressLine1 || !formData.city || 
            !formData.state || !formData.zipCode || !formData.phone) {
            alert('Please fill in all required fields');
            return;
        }
        
        const addressId = form.dataset.addressId;
        
        if (addressId) {
            // Update existing address
            updateAddress(addressId, formData);
        } else {
            // Add new address
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
            // Refresh the address list
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
            // Refresh the address list
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

function setupAddressSelection() {
    const addressCards = document.querySelectorAll('.address-card');
    
    addressCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            addressCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // You might want to store the selected address ID for the order
            const addressId = this.dataset.addressId;
            document.getElementById('checkout-data').dataset.selectedAddress = addressId;
        });
    });
}

// Payment Selection
function setupPaymentSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            paymentOptions.forEach(o => o.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update the radio button
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Update the selected payment method display
            const paymentId = this.dataset.payment;
            const paymentTitle = this.querySelector('.payment-title').textContent;
            document.getElementById('selectedPaymentMethod').textContent = paymentTitle;
            
            // Store the selected payment method
            document.getElementById('checkout-data').dataset.payment = paymentId;
        });
    });
}

// Offer Functions
function applyOffer(offerId) {
    fetch('/api/offers/apply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the UI to show the offer is applied
            const offerBtn = document.querySelector(`.apply-offer-btn[onclick*="${offerId}"]`);
            offerBtn.textContent = 'Applied';
            offerBtn.classList.add('applied');
            offerBtn.setAttribute('onclick', `removeOffer('${offerId}')`);
            
            // Update the order summary with the discount
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
    // In a real app, you would send this to the server to recalculate totals
    const offerBtn = document.querySelector(`.apply-offer-btn[onclick*="${offerId}"]`);
    offerBtn.textContent = 'Apply';
    offerBtn.classList.remove('applied');
    offerBtn.setAttribute('onclick', `applyOffer('${offerId}')`);
    
    // Update the order summary by removing the offer
    updateOrderSummary(null, offerId);
}

function updateOrderSummary(offer = null, removedOfferId = null) {
    // In a real app, you would get updated totals from the server
    // This is a simplified client-side implementation
    
    const subtotal = parseFloat(document.querySelector('.summary-row span:last-child').textContent.replace('₹', ''));
    let discount = 0;
    
    // Calculate new discount based on applied offers
    // This would normally come from the server
    if (offer) {
        discount += offer.discountAmount || 0;
    }
    
    // Update the discount display
    document.querySelector('.summary-row:nth-child(4) span:last-child').textContent = `-₹${discount.toFixed(2)}`;
    
    // Recalculate total
    const delivery = parseFloat(document.querySelector('.summary-row:nth-child(2) span:last-child').textContent.replace('₹', ''));
    const tax = parseFloat(document.querySelector('.summary-row:nth-child(3) span:last-child').textContent.replace('₹', ''));
    const total = subtotal + delivery + tax - discount;
    
    document.querySelector('.summary-row.total span:last-child').textContent = `₹${total.toFixed(2)}`;
}

// Place Order Function
function placeOrder() {
    const checkoutData = document.getElementById('checkout-data');
    const selectedAddress = document.querySelector('.address-card.selected')?.dataset.addressId;
    const paymentMethod = checkoutData.dataset.payment;
    const appliedOffers = []; // This would be populated with applied offers in a real app
    
    if (!selectedAddress) {
        alert('Please select a delivery address');
        return;
    }
    
    if (!paymentMethod) {
        alert('Please select a payment method');
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
            // Show success page
            showSuccessPage(data.orderId);
            
            // Update URL without reloading
            window.history.pushState(null, '', '#success');
        } else {
            alert(data.message || 'Error placing order');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error placing order');
    });
}

function showSuccessPage(orderId = null) {
    document.querySelector('.main-content > .container').style.display = 'none';
    document.getElementById('successPage').style.display = 'block';
    
    if (orderId) {
        // Update the order details link
        const orderLink = document.querySelector('.success-btn.primary');
        orderLink.href = `/orders/${orderId}`;
    }
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
