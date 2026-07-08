
function openModal(type, orderId, itemId = null) {
  console.log("Modal opened for order:", orderId, "item:", itemId);

  const modal = document.getElementById(`${type}Modal`);
  if (!modal) {
    console.error(`Modal element with ID '${type}Modal' not found`);
    return;
  }

  modal.style.display = 'flex';

  const submitBtn = modal.querySelector('.modal-submit');
  if (!submitBtn) {
    console.error("Submit button with class 'modal-submit' not found in modal");
    return;
  }


  submitBtn.dataset.orderId = orderId;
  console.log("Order ID set on submit button:", submitBtn.dataset.orderId);

  if (itemId) {
    submitBtn.dataset.itemId = itemId;
    console.log("Item ID set on submit button:", submitBtn.dataset.itemId);
  } else {
    delete submitBtn.dataset.itemId;
  }
}

//  function openModal(type,orderId,itemId=null) {
//     console.log("modal opened for order:",orderId,"item:",itemId);
//       const modal = document.getElementById(`${type}Modal`);
//       console.log("modal:",modal);
    
//             document.getElementById(`${type}Modal`).style.display = 'flex';
//             const submitBtn=modal.querySelector('.modal-submit');
//             submitBtn.setAttribute('data-order-id',orderId);

//               submitBtn.dataset.orderId=orderId;
//             if(itemId){
// submitBtn.dataset.itemId=itemId;
// } else {
//     delete submitBtn.dataset.itemId;
// }
//             if(itemId){
//                 submitBtn.setAttribute('data-item-id',itemId);

//             }else{
//                 submitBtn.setAttribute('data-item-id');
//             }
//         }

        function closeModal() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            setupReasonChips('cancelModal');
            setupReasonChips('returnModal');
        });
        
        function setupReasonChips(modalId) {
            const modal = document.getElementById(modalId);
            const chips = modal.querySelectorAll('.reason-chip');
            const textarea = modal.querySelector('textarea');
            
            chips.forEach(chip => {
                chip.addEventListener('click', function() {
                    chips.forEach(c => c.classList.remove('selected'));
                    
                    this.classList.add('selected');
                    
                    const reason = this.getAttribute('data-reason');
                    textarea.value = reason;
                    
                    if (reason === "Other reason") {
                        textarea.focus();
                        textarea.value = "";
                    }
                });
            });
            
            textarea.addEventListener('input', function() {
                chips.forEach(chip => chip.classList.remove('selected'));
            });
        }

        function submitCancel(event) {
            
            const reason = document.getElementById('cancelReason').value;
            const target=event.currentTarget;
            console.log("target:",target);
            const orderId = target.dataset.orderId;
            const itemId=target.dataset.itemId;
            console.log("itemID:",itemId);
            console.log("orderId",orderId);
          
            if (!reason) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Reason Required',
                    text: 'Please provide a reason for cancellation',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                return;
            }
            
            fetch(`/user/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason, itemId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancellation submitted',
                        timer: 2000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: data.message || 'Cancellation failed',
                        timer: 2500,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Something went wrong',
                    timer: 2500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            });

            closeModal();
        }

function submitReturn(event) {
    const reason = document.getElementById('returnReason').value;
    const target = event.currentTarget; 
    const orderId = target.dataset.orderId;
    const itemId = target.dataset.itemId;  

    console.log("orderId", orderId);
    console.log("itemId", itemId);
    console.log("reason", reason);

    if (!reason) {
        Swal.fire({
            icon: 'warning',
            title: 'Reason Required',
            text: 'Please provide a reason for return',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return;
    }


    const status = 'delivered';
    const payload={
        reason,
        returnRequest:true
    }
    if (itemId) {
        payload.ItemsIds = [itemId];  
    }

    fetch(`/user/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log("data inside the return after submitting the modal:", data);

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Return request submitted',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            // Disable the specific button that was clicked
            target.textContent = 'Requested';   
            target.disabled = true;             
            target.classList.add('disabled');   

            // For per-item buttons, also update the per-item button if needed
            if (itemId) {
                const perItemButton = document.querySelector(`button[data-item-id="${itemId}"]`);
                if (perItemButton) {
                    perItemButton.textContent = 'Requested';
                    perItemButton.disabled = true;
                    perItemButton.classList.add('disabled');
                }
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: data.message || 'Return request failed',
                timer: 2500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });                
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Something went wrong',
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    });

    closeModal();
}
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.className === 'modal') {
                closeModal();
            }
        }

        function downloadInvoice(orderId) {
            const button = document.querySelector('.download-invoice');
            const originalText = button.innerHTML;
            button.innerHTML = '<span>Generating Invoice...</span>';
            button.disabled = true;

            fetch(`/user/orders/${orderId}/invoice`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate invoice');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Invoice_${orderId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Download Failed',
                    text: 'Failed to download invoice. Please try again.',
                    confirmButtonText: 'OK'
                });        
            })
            .finally(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            });
        }

// Function to download credit note
function downloadCreditNote(orderId) {
    console.log("orderId inside the frotend js :",orderId);
    const button = event?.target?.closest('.download-credit-note');
    if (button) {
        button.disabled = true;
        button.textContent = 'Downloading...';
    }

    fetch(`/user/orders/${orderId}/credit-note`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob(); 
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `credit-note-${orderId}.pdf`; // Set filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Download Credit Note
            `;
        }
    })
    .catch(error => {
        console.error('Error downloading credit note:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download credit note. Please try again later.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
        
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Download Credit Note
            `;
        }
    });
}