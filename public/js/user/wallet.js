document.addEventListener('DOMContentLoaded', function() {

  // ─── Add Funds Button ───────────────────────────────────────────────────────
  const addFundsBtn = document.getElementById("addFundsBtn");
  if (addFundsBtn) {
    addFundsBtn.addEventListener("click", async () => {
      const amount = parseFloat(document.getElementById("amount").value);
      const messageEl = document.getElementById("addFundsMessage");

      if (!amount || amount <= 0) {
        messageEl.textContent = "Please enter a valid amount";
        messageEl.style.color = "red";
        return;
      }
      messageEl.textContent = "";
      await payWithRazorpay(amount);
    });
  }

  // ─── Search / Filter Controls ───────────────────────────────────────────────
  const searchInput   = document.getElementById('searchInput');
  const searchBtn     = document.getElementById('searchBtn');
  const sortBy        = document.getElementById('sortBy');
  const sortOrder     = document.getElementById('sortOrder');
  const filterType    = document.getElementById('filterType');
  const filterStatus  = document.getElementById('filterStatus');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  function applyFilters() {
    const params = new URLSearchParams();
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (searchTerm) params.set('search', searchTerm);
    if (sortBy    && sortBy.value    !== 'date') params.set('sort',   sortBy.value);
    if (sortOrder && sortOrder.value !== 'desc') params.set('order',  sortOrder.value);
    if (filterType   && filterType.value   !== 'all') params.set('type',   filterType.value);
    if (filterStatus && filterStatus.value !== 'all') params.set('status', filterStatus.value);

    const query = params.toString();
    window.location.href = query ? '/user/wallet?' + query : '/user/wallet';
  }

  if (searchBtn)   searchBtn.addEventListener('click', applyFilters);
  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') applyFilters();
    });
  }
  if (sortBy)        sortBy.addEventListener('change',       applyFilters);
  if (sortOrder)     sortOrder.addEventListener('change',    applyFilters);
  if (filterType)    filterType.addEventListener('change',   applyFilters);
  if (filterStatus)  filterStatus.addEventListener('change', applyFilters);
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      window.location.href = '/user/wallet';
    });
  }
});

// ─── Razorpay Payment ─────────────────────────────────────────────────────────
async function payWithRazorpay(amount) {
  try {
    const response = await fetch("/user/wallet/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (!data.success) {
      Swal.fire({
        icon: "error",
        title: "Unable to create payment",
        text: data.message || "Please try again."
      });
      return;
    }

    const { order, key } = data;

    const options = {
      key,
      amount:    order.amount,
      currency:  order.currency,
      name:      "Chettinad Sarees",
      description: "Wallet Top-up",
      order_id:  order.id,

      handler: function (response) {
        fetch("/user/wallet/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Wallet Updated",
              text: "Money has been added successfully."
            }).then(() => location.reload());
          } else {
            Swal.fire({
              icon: "error",
              title: "Verification Failed",
              text: data.message || "Payment verification failed."
            });
          }
        })
        .catch(err => {
          console.error("Verification error:", err);
          Swal.fire({
            icon: "error",
            title: "Verification Error",
            text: "Could not verify payment status."
          });
        });
      },

      modal: {
        ondismiss: function () {
          if (!window.paymentFailedTriggered) {
            Swal.fire({
              icon: "warning",
              title: "Payment Cancelled",
              text: "Wallet top-up was cancelled."
            });
          }
          window.paymentFailedTriggered = false;
        }
      },

      prefill: {
        name:    "Customer Name",
        email:   "customer@example.com",
        contact: "9876543210"
      },
      theme: { color: "#3399cc" }
    };

    window.paymentFailedTriggered = false;
    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {
      window.paymentFailedTriggered = true;
      let errorMessage = "Unable to process payment.";
      if (response && response.error) {
        errorMessage = response.error.description || response.error.reason || "Payment failed.";
      }
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: errorMessage
      });
    });

    rzp.open();

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: "Please try again later."
    });
  }
}
