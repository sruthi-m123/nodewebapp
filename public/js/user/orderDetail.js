

 function openModal(type,orderId,itemId) {
    console.log("modal opened")
      const modal = document.getElementById(`${type}Modal`);
      console.log("modal:",modal);
    
            document.getElementById(`${type}Modal`).style.display = 'flex';
            const submitBtn=modal.querySelector('.modal-submit');
            // submitBtn.setAttribute('data-order-id',orderId);

            if(itemId){
    submitBtn.setAttribute('data-item-id', itemId);
} else {
    submitBtn.removeAttribute('data-item-id'); 
}
            if(itemId){
                submitBtn.setAttribute('data-item-id',itemId);

            }else{
                submitBtn.setAttribute('data-item-id');
            }
        }

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
            const orderId = event.target.getAttribute('data-order-id');
            const itemId=event.target.getAttribute('data-item-id');
            console.log("itemID:",itemId);
          
            if (!reason) {
                alert('Please provide a reason for cancellation');
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
            const orderId = event.target.getAttribute('data-order-id');
              const itemId=event.target.getAttribute('data-item-id');          
            console.log("orderId", orderId);
            console.log("reason", reason);
            if (!reason) {
                alert('Please provide a reason for return');
                return;
            }
            
            const status = 'delivered';
            console.log("status", status);
            
            fetch(`/user/orders/${orderId}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    reason,
                    status: status.toLowerCase().trim(),
                    itemId,
                    returnRequest: true
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
