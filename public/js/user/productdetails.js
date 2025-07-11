document.addEventListener('DOMContentLoaded', function () {
  // Quantity Selector
  const qtyInput = document.getElementById('quantity');
  const maxStock = parseInt(qtyInput.getAttribute('data-stock')) || 1;

  const minusBtn = document.querySelector('.qty-btn.minus');
  const plusBtn = document.querySelector('.qty-btn.plus');

  function updateQuantity(change) {
    let qty = parseInt(qtyInput.value);
    if (isNaN(qty)) qty = 1;

    qty += change;

    if (qty < 1) qty = 1;
    else if (qty > maxStock) {
      qty = maxStock;
      Swal.fire({
        icon: 'warning',
        title: 'Stock limit reached',
        text: `Only ${maxStock} item(s) available.`,
      });
    }

    qtyInput.value = qty;
  }

  minusBtn.addEventListener('click', () => updateQuantity(-1));
  plusBtn.addEventListener('click', () => updateQuantity(1));

  // Tab System
  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Thumbnail Click
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.querySelector('.main-image img');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumb.parentElement.classList.add('active');
      mainImage.src = thumb.querySelector('img').src;
    });
  });

  // Mobile Menu Toggle
  document.querySelector('.menu-toggle').addEventListener('click', function () {
    document.querySelector('.main-nav').classList.toggle('active');
  });
});
