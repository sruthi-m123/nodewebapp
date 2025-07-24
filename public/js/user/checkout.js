// Initialize variables
let currentEditingAddress = null;
let selectedPaymentMethod = '<%= selectedPayment %>';
let appliedOffers = JSON.parse('<%- JSON.stringify(appliedOffers) %>');
let addresses = JSON.parse('<%- JSON.stringify(addresses) %>');

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Address Selection
    const addressCards = document.querySelectorAll('.address-card');
    addressCards.forEach(card => {
        card.addEventListener('click', function() {
            addressCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Payment Method Selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            selectedPaymentMethod = radio.value;
            
            const paymentNames = {
                'cod': 'Cash on Delivery',
                'razorpay': 'Razorpay',
                'wallet': 'Wallet'
            };
            document.getElementById('selectedPaymentMethod').textContent = paymentNames[selectedPaymentMethod];
        });
    });
});

// Modal Functions
function openAddressModal() {
    currentEditingAddress = null;
    document.getElementById('modalTitle').textContent = 'Add New Address';
    document.getElementById('addressForm').reset();
    document.getElementById('addressModal').classList.add('active');
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('active');
    currentEditingAddress = null;
}

function editAddress(addressId) {
    currentEditingAddress = addressId;
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
        document.getElementById('modalTitle').textContent = 'Edit Address';
        document.getElementById('fullName').value = address.name;
        document.getElementById('addressLine1').value = address.addressLine1;
        document.getElementById('addressLine2').value = address.addressLine2;
        document.getElementById('city').value = address.city;
        document.getElementById('state').value = address.state;
        document.getElementById('zipCode').value = address.zipCode;
        document.getElementById('phone').value = address.phone;
        document.getElementById('addressType').value = address.type;
        document.getElementById('setDefault').checked = address.isDefault;
        document.getElementById('addressModal').classList.add('active');
    }
}

// Handle Address Form Submission
document.getElementById('addressForm').addEventListener('submit', function(e) {
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

    if (currentEditingAddress) {
        // Update existing address
        const addressIndex = addresses.findIndex(addr => addr.id === currentEditingAddress);
        if (addressIndex !== -1) {
            addresses[addressIndex] = { ...addresses[addressIndex], ...formData };
        }
    } else {
        // Add new address
        const newAddress = {
            id: Date.now(),
            ...formData
        };
        addresses.push(newAddress);
    }

    // If set as default, remove default from other addresses
    if (formData.isDefault) {
        addresses.forEach(addr => {
            if (addr.id !== currentEditingAddress) {
                addr.isDefault = false;
            }
        });
    }

    renderAddresses();
    closeAddressModal();
});

function renderAddresses() {
    const addressList = document.getElementById('addressList');
    addressList.innerHTML = '';

    addresses.forEach(address => {
        const isSelected = address.isDefault ? 'selected' : '';
        const defaultTag = address.isDefault ? '<span class="tag default">Default</span>' : '';
        
        const addressCard = document.createElement('div');
        addressCard.className = `address-card ${isSelected}`;
        addressCard.setAttribute('data-address-id', address.id);
        
        addressCard.innerHTML = `
            <div class="address-name">${address.name}</div>
            <div class="address-details">
                ${address.addressLine1}${address.addressLine2 ? '<br>' + address.addressLine2 : ''}<br>
                ${address.city}, ${address.state} ${address.zipCode}<br>
                Phone: ${address.phone}
            </div>
            <div class="address-tags">
                <span class="tag ${address.type}">${address.type.charAt(0).toUpperCase() + address.type.slice(1)}</span>
                ${defaultTag}
            </div>
            <a href="#" class="edit-address" onclick="editAddress(${address.id})">Edit</a>
        `;

        addressCard.addEventListener('click', function() {
            document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });

        addressList.appendChild(addressCard);
    });
}

// Place Order Function
function placeOrder() {
    const selectedAddress = document.querySelector('.address-card.selected');
    if (!selectedAddress) {
        showToast('Please select a delivery address', 'error');
        return;
    }

    // Simulate order processing
    const continueBtn = document.querySelector('.continue-btn');
    continueBtn.disabled = true;
    continueBtn.textContent = 'Processing...';

    // In a real app, you would send this data to your server
    const orderData = {
        addressId: selectedAddress.dataset.addressId,
        paymentMethod: selectedPaymentMethod,
        appliedOffers: appliedOffers,
        cartItems: JSON.parse('<%- JSON.stringify(cartItems) %>')
    };

    console.log('Order data:', orderData);

    // Simulate API call
    setTimeout(() => {
        document.querySelector('.main-content').style.display = 'none';
        document.getElementById('successPage').classList.add('active');
    }, 2000);
}

// Offer Functions
function applyOffer(code) {
    if (!appliedOffers.includes(code)) {
        appliedOffers.push(code);
        const button = event.target;
        button.textContent = 'Applied';
        button.classList.add('applied');
        button.onclick = () => removeOffer(code);
        
        updatePricing();
        showToast(`Offer ${code} applied successfully!`, 'success');
    }
}

function removeOffer(code) {
    const index = appliedOffers.indexOf(code);
    if (index > -1) {
        appliedOffers.splice(index, 1);
        const button = event.target;
        button.textContent = 'Apply';
        button.classList.remove('applied');
        button.onclick = () => applyOffer(code);
        
        updatePricing();
        showToast(`Offer ${code} removed`, 'info');
    }
}

function updatePricing() {
    // In a real app, you would recalculate prices based on offers
    console.log('Applied offers:', appliedOffers);
    // You would typically make an API call to recalculate prices
}

function showToast(message, type) {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('addressModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAddressModal();
    }
});