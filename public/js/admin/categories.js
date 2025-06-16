document.addEventListener('DOMContentLoaded', function () {
  // === DOM Elements ===
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const categoryModal = document.getElementById('categoryModal');
  const viewCategoryModal = document.getElementById('viewCategoryModal');
  const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
  const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');
  const categoryForm = document.getElementById('categoryForm');
  const imagePreview = document.querySelector('.image-preview');
  const categoryImageInput = document.getElementById('categoryImage');
  const searchInput = document.querySelector('.search-input');
  const filterSelect = document.querySelector('.filter-select');
  const refreshBtn = document.querySelector('.refresh-btn');
  const statusToggles = document.querySelectorAll('.status-toggle input');
  const editButtons = document.querySelectorAll('.edit-btn');
  const viewButtons = document.querySelectorAll('.view-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const categoryIdToDelete = document.getElementById('categoryIdToDelete');
  const sortableHeaders = document.querySelectorAll('th.sortable');

  // === Initialize ===
  initImageErrorHandling();
  initSortableHeaders();
  initKeyboardNavigation();

  // === Image Preview ===
  categoryImageInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
    }
  });

  // === Form Submission ===
  categoryForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
      setLoading(submitButton, true);
      const formData = new FormData(this);
      
      const response = await fetch(this.action, {
        method: this.getAttribute('method') || 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      Swal.fire({
        title: data.success ? 'Success!' : 'Error',
        text: data.message,
        icon: data.success ? 'success' : 'error',
      });
      
      if (data.success) {
        setTimeout(() => {
          categoryModal.style.display = 'none';
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        icon: 'error',
      });
    } finally {
      setLoading(submitButton, false, originalText);
    }
  });

  // === Modal Controls ===
  addCategoryBtn.addEventListener('click', () => {
    categoryForm.reset();
    imagePreview.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
    document.getElementById('categoryStatus').checked = true;
    categoryForm.action = '/admin/addCategory';
    categoryModal.style.display = 'flex';
    document.getElementById('categoryName').focus();
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryModal.style.display = 'none';
      viewCategoryModal.style.display = 'none';
      deleteConfirmationModal.style.display = 'none';
    });
  });

  window.addEventListener('click', e => {
    if ([categoryModal, viewCategoryModal, deleteConfirmationModal].includes(e.target)) {
      e.target.style.display = 'none';
    }
  });

  // === Status Toggle ===
 // Modify your status toggle handler
statusToggles.forEach(toggle => {
  toggle.addEventListener('change', async function() {
    // Freeze layout during update
    document.body.classList.add('freeze-layout');
    
    const categoryId = this.getAttribute('data-id');
    const newStatus = this.checked ? 'active' : 'inactive';
    const statusSpan = this.nextElementSibling;
    
    // Disable transitions temporarily
    statusSpan.style.transition = 'none';
    
    try {
      // ... existing fetch logic ...
      
      // Update DOM in one operation
      requestAnimationFrame(() => {
        statusSpan.className = `slider round ${newStatus}`;
        statusSpan.style.backgroundColor = newStatus === 'active' ? '#2ecc71' : '#e74c3c';
        statusSpan.textContent = newStatus === 'active' ? 'Active' : 'Inactive';
        
        // Re-enable transitions
        setTimeout(() => {
          statusSpan.style.transition = '';
          document.body.classList.remove('freeze-layout');
        }, 50);
      });
      
    } catch (error) {
      document.body.classList.remove('freeze-layout');
      // ... error handling ...
    }
  });
});
  // === Edit Category ===
  editButtons.forEach(button => {
    button.addEventListener('click', async function () {
      const categoryId = this.getAttribute('data-id');
      
      try {
        const response = await fetch(`/admin/categories/${categoryId}`);
        const category = await response.json();
        
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDesc').value = category.description || '';
        document.getElementById('categoryStatus').checked = category.status === 'active';
        
        imagePreview.innerHTML = category.image
          ? `<img src="/img/category/${category.image}" alt="Preview" class="preview-image">`
          : '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
        
        categoryForm.action = `/admin/categories/${categoryId}/update`;
        categoryModal.style.display = 'flex';
        document.getElementById('categoryName').focus();
      } catch (error) {
        console.error(error);
        showToast('Failed to load category data', 'error');
      }
    });
  });

  // === View Category ===
  viewButtons.forEach(button => {
    button.addEventListener('click', async function () {
      const categoryId = this.getAttribute('data-id');
      
      try {
        const response = await fetch(`/admin/categories/${categoryId}/details`);
        const data = await response.json();
        const category = data.category;
        
        document.getElementById('viewCategoryName').textContent = category.name;
        document.getElementById('viewCategoryDescription').textContent = category.description || 'No description available';
        
        const imgElement = document.getElementById('viewCategoryImage');
        imgElement.src = category.image 
          ? `/img/category/${category.image}` 
          : '/img/category/default-category.jpg';
        imgElement.alt = category.name;
        
        const statusElement = document.getElementById('viewCategoryStatus');
        statusElement.dataset.status = category.status;
        
        document.getElementById('productCount').textContent = data.stats.productCount || 0;
        document.getElementById('viewCount').textContent = data.stats.viewCount || 0;
        document.getElementById('salesCount').textContent = data.stats.salesCount || 0;
        
        viewCategoryModal.style.display = 'flex';
      } catch (error) {
        console.error(error);
        showToast('Failed to load category details', 'error');
      }
    });
  });

  // === Delete Category ===
  deleteButtons.forEach(button => {
    button.addEventListener('click', function () {
      const categoryId = this.getAttribute('data-id');
      if (!categoryId) return showToast('Invalid category ID', 'error');
      categoryIdToDelete.value = categoryId;
      deleteConfirmationModal.style.display = 'flex';
    });
  });

  confirmDeleteBtn.addEventListener('click', async function () {
    const categoryId = categoryIdToDelete.value;
    if (!categoryId) return showToast('No category selected', 'error');
    
    try {
      setLoading(this, true);
      
      const response = await fetch(`/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Category deleted successfully', 'success');
        const row = document.querySelector(`.delete-btn[data-id="${categoryId}"]`).closest('tr');
        row.remove();
        updateRowNumbers();
      } else {
        throw new Error(data.message || 'Error deleting category');
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to delete category', 'error');
    } finally {
      deleteConfirmationModal.style.display = 'none';
      setLoading(this, false, 'Delete');
    }
  });

  cancelDeleteBtn.addEventListener('click', function () {
    deleteConfirmationModal.style.display = 'none';
  });

  // === Search & Filter ===
  searchInput.addEventListener('input', debounce(function () {
    filterCategories(this.value.trim().toLowerCase(), filterSelect.value);
  }, 300));

  filterSelect.addEventListener('change', function () {
    filterCategories(searchInput.value.trim().toLowerCase(), this.value);
  });

  // === Refresh ===
  refreshBtn.addEventListener('click', () => window.location.reload());

  // === Helper Functions ===
  function initImageErrorHandling() {
    document.querySelectorAll('.category-img').forEach(img => {
      img.addEventListener('error', function() {
        this.src = '/img/category/default-category.jpg';
      });
    });
  }

  function initSortableHeaders() {
    sortableHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const columnIndex = Array.from(this.parentNode.children).indexOf(this);
        const isAscending = !this.classList.contains('asc');
        
        sortTable(columnIndex, isAscending);
        
        // Update sort indicators
        sortableHeaders.forEach(h => {
          h.classList.remove('asc', 'desc');
          h.querySelector('i').className = 'fas fa-sort';
        });
        
        this.classList.toggle('asc', isAscending);
        this.classList.toggle('desc', !isAscending);
        
        const icon = this.querySelector('i');
        icon.className = isAscending ? 'fas fa-sort-up' : 'fas fa-sort-down';
      });
    });
  }

  function initKeyboardNavigation() {
    document.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  function sortTable(columnIndex, isAscending) {
    const table = document.querySelector('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
      const aValue = a.children[columnIndex].textContent.trim();
      const bValue = b.children[columnIndex].textContent.trim();
      
      // Numeric sorting for "No" column
      if (columnIndex === 0) {
        return isAscending ? aValue - bValue : bValue - aValue;
      }
      
      // Status sorting (active/inactive)
      if (columnIndex === 4) {
        const aStatus = a.querySelector('.status-toggle input').checked;
        const bStatus = b.querySelector('.status-toggle input').checked;
        return isAscending ? aStatus - bStatus : bStatus - aStatus;
      }
      
      // Default text sorting
      return isAscending 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
    
    // Reattach sorted rows
    rows.forEach(row => tbody.appendChild(row));
    updateRowNumbers();
  }

  function filterCategories(searchTerm, statusFilter) {
    const rows = document.querySelectorAll('tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      const status = row.querySelector('.status-toggle input').checked ? 'active' : 'inactive';
      const nameMatch = name.includes(searchTerm);
      const statusMatch = statusFilter === 'all' || statusFilter === '' || status === statusFilter;
      
      row.style.display = nameMatch && statusMatch ? '' : 'none';
      if (nameMatch && statusMatch) visibleCount++;
    });

    document.querySelector('.table-info').textContent = `Showing ${visibleCount} of ${rows.length} entries`;
  }

  function setLoading(element, isLoading, originalText = null) {
    if (isLoading) {
      element.dataset.originalText = originalText || element.textContent;
      element.disabled = true;
      element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (originalText || element.textContent);
    } else {
      element.disabled = false;
      element.innerHTML = originalText || element.dataset.originalText || '';
    }
  }

  function updateRowNumbers() {
    document.querySelectorAll('tbody tr').forEach((row, index) => {
      row.querySelector('td:first-child').textContent = index + 1;
    });
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }
});