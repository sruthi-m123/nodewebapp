
    document.getElementById("addFundsBtn").addEventListener("click", async () => {

    const amount = parseFloat(document.getElementById("amount").value);

    const messageEl = document.getElementById("addFundsMessage");

    if (!amount || amount <= 0) {

        messageEl.textContent = "Please enter a valid amount";
        messageEl.style.color = "red";
        return;

    }

    await payWithRazorpay(amount);

});
async function payWithRazorpay(amount) {

  try {

    // Create Razorpay Order
    const response = await fetch("/user/wallet/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (!data.success) {
      Swal.fire({
        icon: "error",
        title: "Unable to create payment",
        text: "Please try again."
      });
      return;
    }

    const { order, key } = data;
    console.log("order inide the create order:",order);
    console.log("key",key);

    const options = {

      key: key,

      amount: order.amount,

      currency: order.currency,

      name: "Chettinad Sarees",

      description: "Wallet Top-up",

      order_id: order.id,

      handler: function (response) {

        fetch("/user/wallet/verify-payment", {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            amount,

            razorpay_order_id: response.razorpay_order_id,

            razorpay_payment_id: response.razorpay_payment_id,

            razorpay_signature: response.razorpay_signature

          })

        })

        .then(res => res.json())

        .then(data => {

          if (data.success) {

            Swal.fire({

              icon: "success",

              title: "Wallet Updated",

              text: "Money has been added successfully."

            }).then(() => {

              location.reload();

            });

          } else {

            Swal.fire({

              icon: "error",

              title: "Verification Failed",

              text: "Payment verification failed."

            });

          }

        });

      },

      modal: {

        ondismiss: function () {

          Swal.fire({

            icon: "warning",

            title: "Payment Cancelled",

            text: "Wallet top-up was cancelled."

          });

        }

      },

      prefill: {

        name: "Customer Name",

        email: "customer@example.com",

        contact: "9876543210"

      },

      theme: {

        color: "#3399cc"

      }

    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {

      Swal.fire({

        icon: "error",

        title: "Payment Failed",

        text: response.error.description || "Unable to process payment."

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