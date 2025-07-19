// Update quantity with buttons
function updateQuantity(itemId, change) {
  const input = document.querySelector(`tr[data-id="${itemId}"] input`);
  let newValue = parseInt(input.value) + change;
  if (newValue < 1) newValue = 1;
  input.value = newValue;
  updateItemTotal(itemId);
  calculateGrandTotal();
}

// Update quantity with direct input
function updateQuantityInput(itemId, value) {
  if (value < 1) value = 1;
  updateItemTotal(itemId);
  calculateGrandTotal();
}

// Calculate item total (price * quantity)
function updateItemTotal(itemId) {
  const row = document.querySelector(`tr[data-id="${itemId}"]`);
  const price = parseFloat(row.querySelector('.item-price').textContent);
  const quantity = parseInt(row.querySelector('input').value);
  const total = price * quantity;
  row.querySelector('.item-total').textContent = total.toFixed(2);
}

// Calculate grand total
function calculateGrandTotal() {
  let grandTotal = 0;
  document.querySelectorAll('.item-total').forEach(el => {
    grandTotal += parseFloat(el.textContent);
  });
  document.getElementById('grand-total').textContent = grandTotal.toFixed(2);
}

// Remove item from cart
async function removeItem(itemId) {
  try {
    const response = await fetch(`/cart/remove/${itemId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      // Remove from UI
      document.querySelector(`tr[data-id="${itemId}"]`).remove();
      calculateGrandTotal();
      
      // If last item was removed, show empty cart
      if (document.querySelectorAll('#cart-items tr').length === 0) {
        window.location.reload(); // Reload to show empty cart state
      }
    }
  } catch (error) {
    console.error('Error removing item:', error);
  }
}

// Update cart (save changes to server)
async function updateCart() {
  const updates = [];
  document.querySelectorAll('#cart-items tr').forEach(row => {
    updates.push({
      id: row.getAttribute('data-id'),
      quantity: parseInt(row.querySelector('input').value)
    });
  });

  try {
    const response = await fetch('/cart/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates })
    });
    
    if (response.ok) {
      alert('Cart updated successfully!');
    }
  } catch (error) {
    console.error('Error updating cart:', error);
  }
}

// Proceed to checkout
function checkout() {
  window.location.href = '/checkout';
}