document.addEventListener('DOMContentLoaded', function() {
  // Sidebar functionality
  const toggleSidebar = document.querySelector('.toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.querySelector('.hamburger');
  
  // Toggle sidebar collapse/expand
  if (toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-collapsed');
      document.body.classList.toggle('sidebar-collapsed');
    });
  }
  
  // Mobile sidebar toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  
  // Submenu toggle functionality
  const submenuToggles = document.querySelectorAll('.submenu-toggle');
  
  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const parentItem = this.closest('.has-submenu');
      const submenu = parentItem.querySelector('.submenu');
      
      this.classList.toggle('rotated');
      submenu.classList.toggle('active');
    });
  });
  
  // Close submenus when clicking elsewhere
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.has-submenu')) {
      document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.classList.remove('active');
      });
      document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.classList.remove('rotated');
      });
    }
  });
  
  // Active menu item highlighting
  const menuItems = document.querySelectorAll('.menu-item');
  const currentPath = window.location.pathname;
  
  menuItems.forEach(item => {
    if (item.getAttribute('href') === currentPath) {
      item.classList.add('active');
      
      // Expand parent submenu if this is a submenu item
      const parentSubmenu = item.closest('.submenu');
      if (parentSubmenu) {
        parentSubmenu.classList.add('active');
        const toggle = parentSubmenu.previousElementSibling.querySelector('.submenu-toggle');
        if (toggle) {
          toggle.classList.add('rotated');
        }
      }
    }
  });

  // Category Modal functionality
  const modal = document.getElementById('categoryModal');
  const addBtn = document.getElementById('addCategoryBtn');
  const closeModal = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  
  if (addBtn) {
    // Show modal
    addBtn.addEventListener('click', function() {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }
  
  // Hide modal
  function hideModal() {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
  
  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideModal);
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideModal();
      }
    });
  }
  
  // Form submission
  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(this);
      const characteristics = Array.from(document.querySelectorAll('.tags-container .char-tag')).map(tag => tag.textContent);
      formData.append('characteristics', JSON.stringify(characteristics));
      
      // Here you would typically send the data to the server
      fetch(this.action, {
        method: this.method,
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Category saved successfully!');
          window.location.reload();
        } else {
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the category');
      });
    });
  }
  
  // Image preview functionality
  const imageUpload = document.getElementById('categoryImage');
  const imagePreview = document.querySelector('.image-preview');
  
  if (imageUpload) {
    imageUpload.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.addEventListener('load', function() {
          imagePreview.innerHTML = `<img src="${this.result}" alt="Preview">`;
          imagePreview.style.display = 'block';
        });
        
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Tags input functionality
  const tagsInput = document.getElementById('categoryTags');
  const tagsContainer = document.querySelector('.tags-container');
  const characteristicsInput = document.getElementById('characteristics');
  
  if (tagsInput) {
    tagsInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tagText = this.value.trim();
        if (tagText) {
          const tag = document.createElement('span');
          tag.className = 'char-tag';
          tag.textContent = tagText;
          
          // Add remove button
          const removeBtn = document.createElement('span');
          removeBtn.innerHTML = ' &times;';
          removeBtn.style.cursor = 'pointer';
          removeBtn.addEventListener('click', function() {
            tag.remove();
            updateCharacteristicsInput();
          });
          
          tag.appendChild(removeBtn);
          tagsContainer.appendChild(tag);
          this.value = '';
          updateCharacteristicsInput();
        }
      }
    });
  }
  
  // Update hidden input with tags
  function updateCharacteristicsInput() {
    if (characteristicsInput) {
      const tags = Array.from(document.querySelectorAll('.tags-container .char-tag')).map(tag => 
        tag.textContent.replace(' ×', '').trim()
      );
      characteristicsInput.value = JSON.stringify(tags);
    }
  }
  
  // Status toggle functionality
  const statusToggles = document.querySelectorAll('.status-toggle input');
  statusToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const slider = this.nextElementSibling;
      if (this.checked) {
        slider.textContent = 'Active';
        slider.classList.remove('inactive');
        slider.classList.add('active');
      } else {
        slider.textContent = 'Inactive';
        slider.classList.remove('active');
        slider.classList.add('inactive');
      }
      
      // Here you would typically send an AJAX request to update the status
      const categoryId = this.dataset.id;
      if (categoryId) {
        fetch(`/admin/categories/${categoryId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: this.checked ? 'active' : 'inactive'
          })
        })
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            // Revert if failed
            this.checked = !this.checked;
            if (this.checked) {
              slider.textContent = 'Active';
              slider.classList.remove('inactive');
              slider.classList.add('active');
            } else {
              slider.textContent = 'Inactive';
              slider.classList.remove('active');
              slider.classList.add('inactive');
            }
            alert('Failed to update status: ' + data.message);
          }
        });
      }
    });
  });
  
  // Edit and Delete buttons functionality
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const categoryId = this.dataset.id;
      window.location.href = `/admin/categories/edit/${categoryId}`;
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete this category?')) {
        const categoryId = this.dataset.id;
        fetch(`/admin/categories/${categoryId}`, {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            window.location.reload();
          } else {
            alert('Failed to delete category: ' + data.message);
          }
        });
      }
    });
  });
  
  // Auto-generate category code
  const categoryNameInput = document.getElementById('categoryName');
  const categoryCodeInput = document.getElementById('categoryCode');
  
  if (categoryNameInput && categoryCodeInput) {
    categoryNameInput.addEventListener('input', function() {
      const name = this.value.trim();
      if (name) {
        // Simple code generation - you might want something more sophisticated
        const code = 'CAT-' + name.toUpperCase().replace(/\s+/g, '-').substring(0, 10);
        categoryCodeInput.value = code;
      } else {
        categoryCodeInput.value = '';
      }
    });
  }
});