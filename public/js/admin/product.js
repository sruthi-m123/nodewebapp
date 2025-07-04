const searchBox = document.getElementById('searchBox');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const productModal = document.getElementById('productModal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.cancel-btn');
const productForm = document.getElementById('productForm');
const productTable = document.getElementById('productTable');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const cropBtn = document.getElementById('cropBtn');
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const colorPicker = document.getElementById('colorPicker');
const colorText = document.getElementById('colorText');
const colorPreview = document.getElementById('colorPreview');
const uploadArea = document.querySelector('.image-upload-area');

// New Arrivals Toggle Elements
const newArrivalToggle = document.getElementById('newArrivalToggle');
const newArrivalBadge = document.getElementById('newArrivalBadge');

let cropper = null;
let isNewArrival = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  initializeNewArrivalToggle();
});

// Initialize New Arrival Toggle
function initializeNewArrivalToggle() {
  if (newArrivalToggle) {
    newArrivalToggle.addEventListener('click', function() {
      isNewArrival = !isNewArrival;
      
      if (isNewArrival) {
        newArrivalToggle.classList.add('active');
        if (newArrivalBadge) {
          newArrivalBadge.style.display = 'inline-flex';
        }
      } else {
        newArrivalToggle.classList.remove('active');
        if (newArrivalBadge) {
          newArrivalBadge.style.display = 'none';
        }
      }
    });
  }
}

// Event Listeners Setup
function initializeEventListeners() {
  // Search functionality
  searchBtn.addEventListener('click', handleSearch);
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Reset functionality
  resetBtn.addEventListener('click', handleReset);

  // Modal functionality
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Close modal when clicking outside
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeModal();
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productModal.style.display === 'flex') closeModal();
  });

  // Form submission
  productForm.addEventListener('submit', handleFormSubmission);

  // Image upload
  imageInput.addEventListener('change', handleImageUpload);

  // Color picker sync (only if elements exist)
  if (colorPicker && colorText && colorPreview) {
    colorPicker.addEventListener('input', () => {
      colorText.value = colorPicker.value;
      colorPreview.style.backgroundColor = colorPicker.value;
    });

    colorText.addEventListener('input', () => {
      const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(colorText.value);
      if (isValidHex) {
        colorPicker.value = colorText.value;
        colorPreview.style.backgroundColor = colorText.value;
      }
    });
  }

  // Pagination buttons (using event delegation)
  const pagination = document.querySelector('.pagination');
  if (pagination) {
    pagination.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const page = e.target.id === 'prevPage' ? parseInt(e.target.nextElementSibling.textContent) - 1 :
                    e.target.id === 'nextPage' ? parseInt(e.target.previousElementSibling.textContent) + 1 :
                    parseInt(e.target.textContent);
        if (!isNaN(page)) changePage(page);
      }
    });
  }

  // Edit/Delete buttons (using event delegation)
  productTable.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === 'edit') editProduct(id);
    else if (button.dataset.action === 'delete') deleteProduct(id);
  });

  // Drag and drop (only if uploadArea exists)
  if (uploadArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });

    uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        imageInput.files = files;
        imageInput.dispatchEvent(new Event('change'));
      }
    });
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Modal Functions
function openModal() {
  productModal.style.display = 'flex';
  productModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  productModal.style.display = 'none';
  productModal.classList.remove('active');
  document.body.style.overflow = 'auto';
  resetForm();
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  if (cropModal) {
    cropModal.style.display = 'none';
  }
}

// Search functionality
function handleSearch() {
  const searchTerm = searchBox.value.trim();
  const url = new URL(window.location);
  url.searchParams.set('search', searchTerm);
  url.searchParams.set('page', '1');
  window.location.href = url.toString();
}

// Reset functionality
function handleReset() {
  const url = new URL(window.location);
  url.searchParams.delete('search');
  url.searchParams.set('page', '1');
  window.location.href = url.toString();
}

// Image Upload and Cropping
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size should not exceed 5MB');
    e.target.value = '';
    return;
  }

  // Validate file type
  if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
    alert('Please select a valid image file (JPG, PNG, GIF)');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    imagePreview.style.display = 'block';
    if (cropBtn) {
      cropBtn.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

function openCropModal() {
  if (!cropModal) return;
  cropModal.style.display = 'flex';
  cropImage.src = previewImg.src;

  if (cropper) cropper.destroy();
  cropper = new Cropper(cropImage, {
    aspectRatio: 1,
    viewMode: 1,
    autoCropArea: 0.8,
    responsive: true
  });
}

function closeCropModal() {
  if (!cropModal) return;
  cropModal.style.display = 'none';
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

function applyCrop() {
  if (!cropper) return;
  const croppedCanvas = cropper.getCroppedCanvas();
  previewImg.src = croppedCanvas.toDataURL('image/jpeg');
  imagePreview.style.display = 'block';
  cropModal.style.display = 'none';
  cropper.destroy();
  cropper = null;

  // Convert cropped image to file for form submission
  croppedCanvas.toBlob(blob => {
    const file = new File([blob], `cropped_${imageInput.files[0].name}`, { type: 'image/jpeg' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;
  }, 'image/jpeg');
}

// Form Submission Handler
async function handleFormSubmission(e) {
  e.preventDefault();
  
  const formData = new FormData(productForm);
  const editId = productForm.dataset.editId;

  // Add new arrival status to form data
  formData.append('isNewArrival', isNewArrival);

  // Debug: Log form data
  console.log('Form Data being sent:');
  for (let [key, value] of formData.entries()) {
    console.log(key, ':', value);
  }

  // Validate required fields
  const productName = formData.get('productName');
  const categoryName = formData.get('categoryName');
  const price = formData.get('price');
  const stock = formData.get('stock');

  if (!productName || !categoryName || !price || !stock) {
    alert('Please fill in all required fields');
    return;
  }

  // Validate price and stock are positive numbers
  if (parseFloat(price) <= 0 || parseInt(stock) < 0) {
    alert('Price must be greater than 0 and stock must be 0 or greater');
    return;
  }

  try {
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    const response = await fetch(editId ? `/api/products/${editId}` : '/api/products', {
      method: editId ? 'PUT' : 'POST',
      body: formData
    });

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (data.success) {
      alert(editId ? 'Product updated successfully!' : 'Product added successfully!');
      closeModal();
      
      // Instead of full page reload, try to refresh the product list
      await refreshProductList();
    } else {
      alert(`Error: ${data.message || 'Unknown error occurred'}`);
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Error processing product. Please check the console for details.');
    
    // Reset button state
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = editId ? 'Update Product' : 'Add Product';
    submitBtn.disabled = false;
  }
}

// Refresh Product List
async function refreshProductList() {
  try {
    const response = await fetch('/api/products');
    const data = await response.json();
    
    if (data.success && data.products) {
      updateProductTable(data.products);
    } else {
      // Fallback to page reload if API doesn't return products
      window.location.reload();
    }
  } catch (error) {
    console.error('Error refreshing product list:', error);
    // Fallback to page reload
    window.location.reload();
  }
}

// Update Product Table
function updateProductTable(products) {
  const tbody = productTable;
  tbody.innerHTML = '';

  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product._id || product.id}</td>
      <td>
        ${product.image ? 
          `<img src="${product.image}" alt="${product.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 
          '<span>No image</span>'
        }
      </td>
      <td>${product.productName || 'N/A'}</td>
      <td>${product.stock || 0}</td>
      <td>₹${product.price || 0}</td>
      <td>${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}</td>
      <td>
        <button class="action-btn edit-btn" data-action="edit" data-id="${product._id || product.id}">Edit</button>
        <button class="action-btn delete-btn" data-action="delete" data-id="${product._id || product.id}">Delete</button>
        ${product.isNewArrival ? '<span class="new-arrival-badge">New</span>' : ''}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Reset Form
function resetForm() {
  productForm.reset();
  productForm.removeAttribute('data-editId');
  imagePreview.style.display = 'none';
  previewImg.src = '';
  if (cropBtn) {
    cropBtn.style.display = 'none';
  }
  document.querySelector('.modal-title').textContent = 'Add Product';
  document.querySelector('.submit-btn').textContent = 'Add Product';
  if (colorPreview) {
    colorPreview.style.backgroundColor = '';
  }

  // Reset new arrival toggle
  isNewArrival = false;
  if (newArrivalToggle) {
    newArrivalToggle.classList.remove('active');
  }
  if (newArrivalBadge) {
    newArrivalBadge.style.display = 'none';
  }
}

// Edit Product
async function editProduct(id) {
  try {
    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();

    if (!product) {
      alert('Product not found');
      return;
    }

    // Fill form fields
    document.querySelector('[name="productName"]').value = product.productName || '';
    document.querySelector('[name="categoryName"]').value = product.categoryName || '';
    document.querySelector('[name="description"]').value = product.description || '';
    document.querySelector('[name="price"]').value = product.price || '';
    document.querySelector('[name="stock"]').value = product.stock || '';
    document.querySelector('[name="color"]').value = product.color || '';

    // Set new arrival toggle
    isNewArrival = product.isNewArrival || false;
    if (newArrivalToggle) {
      if (isNewArrival) {
        newArrivalToggle.classList.add('active');
        if (newArrivalBadge) {
          newArrivalBadge.style.display = 'inline-flex';
        }
      } else {
        newArrivalToggle.classList.remove('active');
        if (newArrivalBadge) {
          newArrivalBadge.style.display = 'none';
        }
      }
    }

    if (colorPreview) {
      colorPreview.style.backgroundColor = product.color || '#000000';
    }

    if (product.image) {
      previewImg.src = product.image;
      imagePreview.style.display = 'block';
      if (cropBtn) {
        cropBtn.style.display = 'block';
      }
    }

    document.querySelector('.modal-title').textContent = 'Edit Product';
    document.querySelector('.submit-btn').textContent = 'Update Product';
    productForm.dataset.editId = id;

    openModal();
  } catch (error) {
    console.error('Error:', error);
    alert('Error fetching product');
  }
}

// Delete Product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (data.success) {
      alert('Product deleted successfully!');
      await refreshProductList();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting product');
  }
}

// Change Page
function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set('page', page);
  window.location.href = url.toString();
}

// Expose functions to global scope for inline EJS calls
window.openModal = openModal;
window.openCropModal = openCropModal;
window.closeCropModal = closeCropModal;
window.applyCrop = applyCrop;