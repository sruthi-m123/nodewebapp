// document.addEventListener("DOMContentLoaded", function () {
//   console.log(
//     "Script loaded at",
//     new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
//   ); // Debug with IST timestamp

//   // === DOM Elements ===
//   const addCategoryBtn = document.getElementById("addCategoryBtn");
//   const categoryModal = document.getElementById("categoryModal");
//   const deleteConfirmationModal = document.getElementById(
//     "deleteConfirmationModal"
//   );
//   const closeModalBtns = document.querySelectorAll(".close-modal, .cancel-btn");
//   const categoryForm = document.getElementById("categoryForm");
//   const imagePreview = document.getElementById("imagePreview");
//   const cropCanvas = document.getElementById("cropCanvas");
//   const cropControls = document.querySelector(".crop-controls");
//   const cropButton = document.getElementById("cropButton");
//   const cancelCropButton = document.getElementById("cancelCropButton");
//   const croppedImageInput = document.getElementById("croppedImage");
//   const categoryImageInput = document.getElementById("categoryImage");
//   const searchInput = document.querySelector(".search-input");
//   const filterSelect = document.querySelector(".filter-select");
//   const statusToggles = document.querySelectorAll(".status-toggle input");
//   const editButtons = document.querySelectorAll(".edit-btn");
//   const deleteButtons = document.querySelectorAll(".delete-btn");
//   const confirmDeleteBtn = document
//     .getElementById("deleteForm")
//     ?.querySelector(".delete-confirm-btn");
//   const cancelDeleteBtn = document
//     .getElementById("deleteForm")
//     ?.querySelector(".cancel-btn");
//   const categoryIdInput = document.getElementById("deleteCategoryId");
//   const sortableHeaders = document.querySelectorAll("th.sortable");

//   let cropper;

//   // === Validate DOM Elements ===
//   if (
//     !addCategoryBtn ||
//     !categoryModal ||
//     !imagePreview ||
//     !cropButton ||
//     !cancelCropButton
//   ) {
//     console.error("Missing required DOM elements:", {
//       addCategoryBtn,
//       categoryModal,
//       imagePreview,
//       cropButton,
//       cancelCropButton,
//     });
//     return;
//   }

//   // === Initialize ===
//   initImageErrorHandling();
//   initSortableHeaders();
//   initKeyboardNavigation();

//   // === Image Preview and Cropping ===
//   categoryImageInput.addEventListener("change", function () {
//     console.log(
//       "Image input changed at",
//       new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
//     ); // Debug
//     const file = this.files[0];
//     if (file) {
//       console.log("File selected:", file); // Debug
//       const reader = new FileReader();
//       reader.onload = function (e) {
//         console.log("Reader loaded:", e.target.result); // Debug
//         imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
//         const img = imagePreview.querySelector("img");
//         if (!img) {
//           console.error("Image element not found in preview");
//           return;
//         }
//         if (cropper) cropper.destroy();
//         try {
//           cropper = new Cropper(img, {
//             aspectRatio: 1,
//             viewMode: 1,
//             dragMode: "move",
//             guides: true,
//             cropBoxResizable: true,
//             toggleDragModeOnDblclick: false,
//           });
//           console.log("Cropper initialized successfully"); // Debug
//           cropControls.style.display = "block";
//         } catch (error) {
//           console.error("Failed to initialize Cropper:", error);
//         }
//       };
//       reader.readAsDataURL(file);
//     } else {
//       imagePreview.innerHTML =
//         '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
//       if (cropper) cropper.destroy();
//       cropControls.style.display = "none";
//     }
//   });

//   if (cropButton) {
//     cropButton.addEventListener("click", () => {
//       console.log(
//         "Crop button clicked at",
//         new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
//       ); // Debug
//       if (cropper) {
//         try {
//           const canvas = cropper.getCroppedCanvas({
//             width: 200,
//             height: 200,
//           });
//           if (canvas) {
//             console.log("Cropped canvas created"); // Debug
//             canvas.toBlob(
//               (blob) => {
//                 console.log("Cropped blob:", blob); // Debug
//                 const croppedFile = new File([blob], "cropped-image.jpg", {
//                   type: "image/jpeg",
//                 });
//                 const dataTransfer = new DataTransfer();
//                 dataTransfer.items.add(croppedFile);
//                 categoryImageInput.files = dataTransfer.files;
//                 croppedImageInput.value = canvas.toDataURL("image/jpeg");
//                 imagePreview.innerHTML = canvas.outerHTML;
//                 cropControls.style.display = "none";
//                 if (cropper) cropper.destroy();
//                 console.log("Crop completed"); // Debug
//               },
//               "image/jpeg",
//               0.9
//             );
//           } else {
//             console.error("Failed to get cropped canvas");
//           }
//         } catch (error) {
//           console.error("Error during cropping:", error);
//         }
//       } else {
//         console.error("Cropper instance not available");
//       }
//     });
//   } else {
//     console.error("Crop button not found");
//   }

//   if (cancelCropButton) {
//     cancelCropButton.addEventListener("click", () => {
//       console.log(
//         "Cancel crop clicked at",
//         new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
//       ); // Debug
//       if (cropper) cropper.destroy();
//       categoryImageInput.value = "";
//       imagePreview.innerHTML =
//         '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
//       cropControls.style.display = "none";
//       console.log("Crop cancelled"); // Debug
//     });
//   } else {
//     console.error("Cancel crop button not found");
//   }

//   // === Form Submission ===
//   categoryForm.addEventListener("submit", async function (e) {
//     e.preventDefault();
//     const submitButton = this.querySelector(".submit-btn");
//     const originalText = submitButton.innerHTML;

//     try {
//       setLoading(submitButton, true);
//       const formData = new FormData(this);

//       const response = await fetch(this.action, {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();

//       Swal.fire({
//         title: data.alert.title,
//         text: data.alert.text,
//         icon: data.alert.icon,
//       });

//       if (data.success) {
//         setTimeout(() => {
//           categoryModal.classList.remove("active");
//           categoryModal.style.display = "none";
//           window.location.reload();
//         }, 1500);
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       Swal.fire({
//         title: "Error",
//         text: error.message || "Failed to save category. Please try again.",
//         icon: "error",
//       });
//     } finally {
//       setLoading(submitButton, false, originalText);
//     }
//   });

//   // === Modal Controls ===
//   addCategoryBtn.addEventListener("click", () => {
//     categoryForm.reset();
//     imagePreview.innerHTML =
//       '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
//     document.getElementById("categoryStatus").checked = true;
//     categoryForm.action = "/admin/addCategory";
//     document.getElementById("modalTitle").textContent = "Add New Category";
//     requestAnimationFrame(() => {
//       categoryModal.classList.add("active");
//       categoryModal.style.display = "flex";
//       categoryModal.style.visibility = "visible";
//       categoryModal.style.opacity = "1";
//     });
//     document.getElementById("categoryName").focus();
//     if (cropper) cropper.destroy();
//     cropControls.style.display = "none";
//   });

//   closeModalBtns.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       categoryModal.classList.remove("active");
//       categoryModal.style.display = "none";
//       deleteConfirmationModal.classList.remove("active");
//       deleteConfirmationModal.style.display = "none";
//       if (cropper) cropper.destroy();
//       cropControls.style.display = "none";
//     });
//   });

//   window.addEventListener("click", (e) => {
//     if (e.target === categoryModal) {
//       categoryModal.classList.remove("active");
//       categoryModal.style.display = "none";
//     }
//     if (e.target === deleteConfirmationModal) {
//       deleteConfirmationModal.classList.remove("active");
//       deleteConfirmationModal.style.display = "none";
//     }
//     if (cropper) cropper.destroy();
//     cropControls.style.display = "none";
//   });

//   // === Status Toggle ===
//   statusToggles.forEach((toggle) => {
//     toggle.addEventListener("change", async function () {
//       document.body.classList.add("freeze-layout");
//       const categoryId = this.getAttribute("data-id");
//       const newStatus = this.checked ? "active" : "inactive";
//       const statusSpan = this.nextElementSibling;

//       try {
//         const response = await fetch(`/admin/categories/status/${categoryId}`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ status: newStatus }),
//         });

//         const data = await response.json();

//         if (!data.success)
//           throw new Error(data.alert.text || "Failed to update status");

//         requestAnimationFrame(() => {
//           statusSpan.className = `status-slider round ${newStatus}`;
//           statusSpan.textContent =
//             newStatus === "active" ? "Active" : "Inactive";
//           statusSpan.style.backgroundColor =
//             newStatus === "active" ? "#2ecc71" : "#e74c3c";
//           setTimeout(() => {
//             statusSpan.style.transition = "";
//             document.body.classList.remove("freeze-layout");
//           }, 50);
//         });

//         Swal.fire({
//           title: data.alert.title,
//           text: data.alert.text,
//           icon: data.alert.icon,
//         });
//       } catch (error) {
//         this.checked = !this.checked;
//         statusSpan.className = `status-slider round ${
//           this.checked ? "active" : "inactive"
//         }`;
//         statusSpan.textContent = this.checked ? "Active" : "Inactive";
//         statusSpan.style.backgroundColor = this.checked ? "#2ecc71" : "#e74c3c";
//         document.body.classList.remove("freeze-layout");
//         Swal.fire({
//           title: "Error",
//           text: error.message || "Failed to update status",
//           icon: "error",
//         });
//       }
//     });
//   });

//   // === Edit Category ===
//   editButtons.forEach((button) => {
//     button.addEventListener("click", async function () {
//       const categoryId = this.getAttribute("data-id");

//       if (!categoryId || !/^[0-9a-fA-F]{24}$/.test(categoryId)) {
//         showToast("Invalid category ID", "error");
//         return;
//       }

//       try {
//         const response = await fetch(`/admin/categories/${categoryId}`, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//         });

//         if (!response.ok)
//           throw new Error(`HTTP error! status: ${response.status}`);

//         const contentType = response.headers.get("content-type");
//         if (!contentType || !contentType.includes("application/json")) {
//           throw new Error("Expected JSON response from server");
//         }

//         const category = await response.json();
//         console.log("Fetched category data:", category);

//         if (!category._id) throw new Error("Category data not found");

//         document.getElementById("categoryName").value = category.name || "";
//         document.getElementById("categoryDesc").value =
//           category.description || "";
//         document.getElementById("categoryStatus").checked =
//           category.status === "active";

//         const switchLabel = document.querySelector(".switch-label");
//         if (switchLabel)
//           switchLabel.textContent =
//             category.status === "active" ? "Active" : "Inactive";

//         const slider = document.querySelector(".slider-round");
//         if (slider) {
//           slider.className = "slider-round";
//           slider.textContent =
//             category.status === "active" ? "Active" : "Inactive";
//         }

//         if (imagePreview) {
//           if (category.image) {
//             imagePreview.innerHTML = `<img src="${category.image}" alt="Category Image" class="preview-image" onerror="this.onerror=null; this.src='/img/category/default-category.jpg';">`;
//             const img = imagePreview.querySelector("img");
//             if (!img) {
//               console.error("Image element not found for editing");
//               return;
//             }
//             if (cropper) cropper.destroy();
//             try {
//               cropper = new Cropper(img, {
//                 aspectRatio: 1,
//                 viewMode: 1,
//                 dragMode: "move",
//                 guides: true,
//                 cropBoxResizable: true,
//                 toggleDragModeOnDblclick: false,
//               });
//               console.log("Cropper initialized for edit mode");
//               cropControls.style.display = "block";
//             } catch (error) {
//               console.error(
//                 "Failed to initialize Cropper in edit mode:",
//                 error
//               );
//             }
//           } else {
//             imagePreview.innerHTML =
//               '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image Preview</span></div>';
//             if (cropper) cropper.destroy();
//             cropControls.style.display = "none";
//           }
//         }

//         categoryForm.action = `/admin/categories/${categoryId}/update`;
//         document.getElementById("modalTitle").textContent = "Edit Category";

//         requestAnimationFrame(() => {
//           categoryModal.classList.add("active");
//           categoryModal.style.display = "flex";
//           categoryModal.style.visibility = "visible";
//           categoryModal.style.opacity = "1";
//         });

//         document.getElementById("categoryName").focus();
//       } catch (error) {
//         console.error("Error:", error);
//         showToast(error.message || "Failed to load category data", "error");
//       }
//     });
//   });

//   // === Delete Category ===
//   deleteButtons.forEach((button) => {
//     button.addEventListener("click", function () {
//       const categoryId = this.getAttribute("data-id");
//       if (!categoryId) return showToast("Invalid category ID", "error");
//       categoryIdInput.value = categoryId;
//       requestAnimationFrame(() => {
//         deleteConfirmationModal.classList.add("active");
//         deleteConfirmationModal.style.display = "flex";
//         deleteConfirmationModal.style.visibility = "visible";
//         deleteConfirmationModal.style.opacity = "1";
//       });
//     });
//   });

//   deleteForm.addEventListener("submit", async function (e) {
//     e.preventDefault();
//     const submitButton = this.querySelector(".delete-confirm-btn");
//     const originalText = submitButton.innerHTML;

//     try {
//       setLoading(submitButton, true);
//       const categoryId = categoryIdInput.value;

//       const response = await fetch(this.action, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ categoryId }),
//       });

//       const data = await response.json();

//       Swal.fire({
//         title: data.alert.title,
//         text: data.alert.text,
//         icon: data.alert.icon,
//       });

//       if (data.success) {
//         const row = document
//           .querySelector(`.delete-btn[data-id="${categoryId}"]`)
//           .closest("tr");
//         if (row) row.remove();
//         updateRowNumbers();
//         deleteConfirmationModal.classList.remove("active");
//         deleteConfirmationModal.style.display = "none";
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       Swal.fire({
//         title: "Error",
//         text: error.message || "Failed to delete category",
//         icon: "error",
//       });
//     } finally {
//       setLoading(submitButton, false, originalText);
//     }
//   });

//   // === Search & Filter ===
//   searchInput.addEventListener(
//     "input",
//     debounce(function () {
//       filterCategories(this.value.trim().toLowerCase(), filterSelect.value);
//     }, 300)
//   );

//   filterSelect.addEventListener("change", function () {
//     filterCategories(searchInput.value.trim().toLowerCase(), this.value);
//   });

//   // === Helper Functions ===
//   function initImageErrorHandling() {
//     document.querySelectorAll(".category-img").forEach((img) => {
//       img.addEventListener("error", function () {
//         this.src = "/img/category/default-category.jpg";
//       });
//     });
//   }

//   function initSortableHeaders() {
//     sortableHeaders.forEach((header) => {
//       header.addEventListener("click", function () {
//         const columnIndex = Array.from(this.parentNode.children).indexOf(this);
//         const isAscending = !this.classList.contains("asc");

//         sortTable(columnIndex, isAscending);

//         sortableHeaders.forEach((h) => {
//           h.classList.remove("asc", "desc");
//           h.querySelector("i").className = "fas fa-sort";
//         });

//         this.classList.toggle("asc", isAscending);
//         this.classList.toggle("desc", !isAscending);

//         const icon = this.querySelector("i");
//         icon.className = isAscending ? "fas fa-sort-up" : "fas fa-sort-down";
//       });
//     });
//   }

//   function initKeyboardNavigation() {
//     document.querySelectorAll(".icon-btn").forEach((btn) => {
//       btn.addEventListener("keydown", (e) => {
//         if (e.key === "Enter" || e.key === " ") {
//           e.preventDefault();
//           btn.click();
//         }
//       });
//     });
//   }

//   function sortTable(columnIndex, isAscending) {
//     const table = document.querySelector("table");
//     const tbody = table.querySelector("tbody");
//     const rows = Array.from(tbody.querySelectorAll("tr"));

//     rows.sort((a, b) => {
//       const aValue = a.children[columnIndex].textContent.trim();
//       const bValue = b.children[columnIndex].textContent.trim();

//       if (columnIndex === 0) {
//         return isAscending ? aValue - bValue : bValue - aValue;
//       }
//       if (columnIndex === 4) {
//         const aStatus = a.querySelector(".status-toggle input").checked;
//         const bStatus = b.querySelector(".status-toggle input").checked;
//         return isAscending ? aStatus - bStatus : bStatus - aStatus;
//       }
//       return isAscending
//         ? aValue.localeCompare(bValue)
//         : bValue.localeCompare(aValue);
//     });

//     rows.forEach((row) => tbody.appendChild(row));
//     updateRowNumbers();
//   }

//   function filterCategories(searchTerm, statusFilter) {
//     const rows = document.querySelectorAll("tbody tr");
//     let visibleCount = 0;

//     rows.forEach((row) => {
//       const name = row
//         .querySelector("td:nth-child(3)")
//         .textContent.toLowerCase();
//       const status = row.querySelector(".status-toggle input").checked
//         ? "active"
//         : "inactive";
//       const nameMatch = name.includes(searchTerm);
//       const statusMatch = statusFilter === "" || status === statusFilter;

//       row.style.display = nameMatch && statusMatch ? "" : "none";
//       if (nameMatch && statusMatch) visibleCount++;
//     });

//     document.querySelector(
//       ".table-info"
//     ).textContent = `Showing ${visibleCount} of ${rows.length} entries`;
//   }

//   function setLoading(element, isLoading, originalText = null) {
//     if (isLoading) {
//       element.dataset.originalText = originalText || element.textContent;
//       element.disabled = true;
//       element.innerHTML =
//         '<i class="fas fa-spinner fa-spin"></i> ' +
//         (originalText || element.textContent);
//     } else {
//       element.disabled = false;
//       element.innerHTML = originalText || element.dataset.originalText || "";
//     }
//   }

//   function updateRowNumbers() {
//     document.querySelectorAll("tbody tr").forEach((row, index) => {
//       row.querySelector("td:first-child").textContent = index + 1;
//     });
//   }

//   function showToast(message, type) {
//     const toast = document.createElement("div");
//     toast.className = `toast ${type}`;
//     toast.textContent = message;
//     document.body.appendChild(toast);

//     setTimeout(() => toast.classList.add("show"), 10);
//     setTimeout(() => {
//       toast.classList.remove("show");
//       setTimeout(() => toast.remove(), 300);
//     }, 3000);
//   }

//   function debounce(fn, wait) {
//     let timeout;
//     return function (...args) {
//       clearTimeout(timeout);
//       timeout = setTimeout(() => fn.apply(this, args), wait);
//     };
//   }
// });
