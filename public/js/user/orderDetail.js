
        function openModal(type) {
            document.getElementById(`${type}Modal`).style.display = 'flex';
        }

        function closeModal() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }

        function submitCancel(event) {
            const reason = document.getElementById('cancelReason').value;
            console.log("reason",reason);
const orderId = event.target.closest('button').dataset.orderId;
console.log("orderId:",orderId)
 const itemsToCancel = [];
            console.log("cancel reason",cancelReason);
            if (!reason) {
                alert('Please provide a reason for cancellation');
                return;
            }
            


            
            fetch(`/user/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason,itemsToCancel })
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
            event.preventDefault();
            const reason = document.getElementById('returnReason').value;
const orderId = event.target.closest('button').dataset.orderId;
                        
console.log("orderId",orderId);
            console.log("reason",reason);
            if (!reason) {
                alert('Please provide a reason for return');
                return;
            }
            const status='delivered';
            console.log("status",status)
            fetch(`/user/orders/${orderId}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify({ reason ,
status:status.toLowerCase().trim(),
returnRequest:true
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                     Swal.fire({
                icon: 'success',
                title: 'Return request submitted',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
                    const returnButton = document.querySelector(`button[data-order-id="${orderId}"]`);
        
        if (returnButton) {
            returnButton.textContent = 'Requested';   
            returnButton.disabled = true;             
            returnButton.classList.add('disabled');   
        }

                } else {
Swal.fire({
                icon: 'error',
                title: data.message || 'Return request failed',
                timer: 2500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });                }
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

        function downloadInvoice(orderId){
            const button=document.querySelector('.download-invoice');
            const originalText=button.innerHTML;
            button.innerHTML='<span>Generating Invoice...</span>';
            button.disabled=true;

            fetch(`/user/orders/${orderId}/invoice`,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json',
                }
            })
            .then(response=>{
                if(!response.ok){
throw new Error('failed to generate invoice');
                }
                return response.blob();
            })
.then(blob=>{
    const url=window.URL.createObjectURL(blob);
    const a =document.createElement('a');
    a.href=url;
    a.download='Invoice_${orderId}.pdf';
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
});        })
        .finally(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        });
        }