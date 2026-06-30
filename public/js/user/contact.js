

const form = document.querySelector("form");

function showToast(message, success = true) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        close: true,
        stopOnFocus: true,
        style: {
            background: success
                ? "linear-gradient(to right, #00b09b, #96c93d)"
                : "linear-gradient(to right, #ff416c, #ff4b2b)"
        }
    }).showToast();
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const formData = new FormData(form);

    const data = Object.fromEntries(formData.entries());

    try {

        const response = await fetch("/user/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {

            showToast("Message Sent Successfully!", true);

            form.reset();

        } else {

            showToast(result.message, false);

        }

    } catch (err) {

        showToast("Something went wrong.", false);

    }

});