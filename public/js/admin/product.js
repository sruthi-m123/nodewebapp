// DOM Elements
const searchBox = document.getElementById('searchBox');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const productModal = document.getElementById('productModal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.cancel-btn');
const productForm = document.getElementById('productForm');
const productTable = document.getElementById('productTable');

// Enhanced Modal Elements
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const offerToggle = document.getElementById('offerToggle');
const offerInput = document.getElementById('offerInput');
const uploadArea = document.querySelector('.image-upload-area');

// Sample product data (replace with actual API calls)
let products = [
    {
        id: 1,
        image: '/images/sample-product1.jpg',
        name: 'Gold Silk Saree',
        category: 'clothing',
        description: 'Beautiful traditional gold silk saree with intricate designs.',
        amount: 10,
        price: 5200,
        stock: 10,
        colors: ['gold', 'red'],
        offerEnabled: false,
        offerPercentage: 0,
        lastUpdated: '11/06/2023'
    },
    {
        id: 2,
        image: '/images/sample-product2.jpg',
        name: 'Smartphone',
        category: 'electronics',
        description: 'Latest smartphone with advanced features.',
        amount: 25,
        price: 25000,
        stock: 25,
        colors: ['black', 'blue'],
        offerEnabled: true,
        offerPercentage: 15,
        lastUpdated: '10/06/2023'
    }
];

let filteredProducts = [...products];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    renderProducts();
    setupImageUpload();
    setupColorSelection();
    setupOfferToggle();
    setupDragAndDrop();
});

// Event Listeners Setup
function initializeEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Reset functionality
    resetBtn.addEventListener('click', handleReset);
    
    // Modal functionality
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Form submission
    productForm.addEventListener('submit', handleFormSubmission);
    
    // Close modal when clicking outside
    productModal.addEventListener('click', function(e) {
        if (e.target === productModal) {
            closeModal();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && productModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Modal Functions
function openModal() {
    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetForm();
}

// Search functionality
function handleSearch() {
    const searchTerm = searchBox.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Reset functionality
function handleReset() {
    searchBox.value = '';
    filteredProducts = [...products];
    currentPage = 1;
    renderProducts();
}

// Image Upload Setup
function setupImageUpload() {
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should not exceed 5MB');
                this.value = '';
                return;
            }
            
            // Validate file type
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
                alert('Please select a valid image file (JPG, PNG, GIF)');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Drag and Drop Setup
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.classList.add('dragover');
    }

    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            imageInput.files = files;
            imageInput.dispatchEvent(new Event('change'));
        }
    }
}

// Color Selection Setup
function setupColorSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
}

// Offer Toggle Setup
function setupOfferToggle() {
    offerToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        offerInput.classList.toggle('active');
        
        if (!this.classList.contains('active')) {
            offerInput.value = '';
        }
    });
}

// Form Submission Handler
function handleFormSubmission(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData();
    const selectedColors = [];
    
    // Get basic form fields
    const inputs = productForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'file') {
            if (input.files[0]) {
                formData.append('image', input.files[0]);
            }
        } else if (input.name && input.name !== 'offerPercentage') {
            formData.append(input.name, input.value);
        }
    });
    
    // Get selected colors
    document.querySelectorAll('.color-option.selected').forEach(option => {
        selectedColors.push(option.dataset.color);
    });
    
    // Get offer data
    const offerEnabled = offerToggle.classList.contains('active');
    const offerPercentage = offerEnabled ? (offerInput.value || 0) : 0;
    
    // Create product object
    const newProduct = {
        id: products.length + 1,
        image: imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : '/img/admin-products/default-product.jpg',
        name: formData.get('productName'),
        category: formData.get('category'),
        description: formData.get('description'),
        amount: parseInt(formData.get('stock')),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        colors: selectedColors,
        offerEnabled: offerEnabled,
        offerPercentage: parseInt(offerPercentage),
        lastUpdated: new Date().toLocaleDateString('en-GB')
    };
    
    // Validate required fields
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Add product to array (in real app, this would be an API call)
    products.push(newProduct);
    filteredProducts = [...products];
    
    // Show success message
    alert('Product added successfully!');
    
    // Close modal and refresh table
    closeModal();
    renderProducts();
    
    // In a real application, you would send this data to your server
    console.log('Product added:', newProduct);
    
    // Example API call (uncomment and modify for your backend)
    /*
    fetch('/api/products', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Product added successfully!');
            closeModal();
            loadProducts(); // Reload products from server
        } else {
            alert('Error adding product: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding product');
    });
    */
}

// Reset Form
function resetForm() {
    productForm.reset();
    imagePreview.style.display = 'none';
    previewImg.src = '';
    
    // Reset color selections
    document.querySelectorAll('.color-option.selected').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reset offer toggle
    offerToggle.classList.remove('active');
    offerInput.classList.remove('active');
    offerInput.value = '';
}

// Render Products Table
function renderProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);
    
    productTable.innerHTML = '';
    
    if (currentProducts.length === 0) {
        productTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    No products found
                </td>
            </tr>
        `;
        return;
    }
    
    currentProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Calculate discounted price if offer is enabled
        const displayPrice = product.offerEnabled ? 
            product.price * (1 - product.offerPercentage / 100) : 
            product.price;
        
        const priceDisplay = product.offerEnabled ? 
            `<span style="text-decoration: line-through; color: #999;">₹${product.price}</span> 
             <span style="color: #e74c3c; font-weight: bold;">₹${displayPrice.toFixed(2)}</span>
             <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 5px;">${product.offerPercentage}% OFF</span>` :
            `₹${product.price}`;
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${product.image}" alt="${product.name}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                     onerror="this.src='/images/default-product.jpg'">
            </td>
            <td>
                <div>
                    <strong>${product.name}</strong>
                    ${product.category ? `<br><small style="color: #666; text-transform: capitalize;">${product.category}</small>` : ''}
                    ${product.colors.length > 0 ? `<br><small style="color: #666;">Colors: ${product.colors.join(', ')}</small>` : ''}
                </div>
            </td>
            <td>${product.amount}</td>
            <td>${priceDisplay}</td>
            <td>${product.lastUpdated}</td>
            <td>
                <button onclick="editProduct(${product.id})" style="background: #007aff; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;">Edit</button>
                <button onclick="deleteProduct(${product.id})" style="background: #ff3b30; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
            </td>
        `;
        
        productTable.appendChild(row);
    });
    
    updatePagination();
}

// Edit Product Function
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Populate form with product data
    document.querySelector('input[name="productName"]').value = product.name;
    document.querySelector('select[name="category"]').value = product.category;
    document.querySelector('textarea[name="description"]').value = product.description;
    document.querySelector('input[name="price"]').value = product.price;
    document.querySelector('input[name="stock"]').value = product.stock;
    
    // Set colors
    document.querySelectorAll('.color-option').forEach(option => {
        if (product.colors.includes(option.dataset.color)) {
            option.classList.add('selected');
        }
    });
    
    // Set offer
    if (product.offerEnabled) {
        offerToggle.classList.add('active');
        offerInput.classList.add('active');
        offerInput.value = product.offerPercentage;
    }
    
    // Change form to edit mode
    document.querySelector('.modal-title').textContent = 'Edit Product';
    document.querySelector('.submit-btn').textContent = 'Update Product';
    
    // Store product ID for update
    productForm.dataset.editId = id;
    
    openModal();
}

// Delete Product Function
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        filteredProducts = [...products];
        renderProducts();
        
        // In real app, make API call to delete
        console.log('Product deleted:', id);
    }
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    
    let paginationHTML = `<button id="prevPage" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">&laquo;</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    paginationHTML += `<button id="nextPage" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">&raquo;</button>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change Page Function
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
}

// Make openModal function globally available
window.openModal = openModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.changePage = changePage;