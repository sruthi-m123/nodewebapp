
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

        // function submitReturn(event) {
        //     const reason = document.getElementById('returnReason').value;
        //     const orderId = event.target.getAttribute('data-order-id');
        //       const itemId=event.target.getAttribute('data-item-id');          
        //     console.log("orderId", orderId);
        //     console.log("reason", reason);
        //     if (!reason) {
        //         alert('Please provide a reason for return');
        //         return;
        //     }
            
        //     const status = 'delivered';
            
        //     fetch(`/user/orders/${orderId}/return`, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({ 
        //             reason,
        //             status: status.toLowerCase().trim(),
        //             ItemsIds: [itemId] ,
        //             returnRequest: true
        //         })
        //     })
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log("data inside the return after submitting the modal:",data)
        //         if (data.success) {
        //             Swal.fire({
        //                 icon: 'success',
        //                 title: 'Return request submitted',
        //                 timer: 2000,
        //                 showConfirmButton: false,
        //                 toast: true,
        //                 position: 'top-end'
        //             });
                    
        //             const returnButton = document.querySelector(`button[data-order-id="${orderId}"]`);
        
        //             if (returnButton) {
        //                 returnButton.textContent = 'Requested';   
        //                 returnButton.disabled = true;             
        //                 returnButton.classList.add('disabled');   
        //             }
        //         } else {
        //             Swal.fire({
        //                 icon: 'error',
        //                 title: data.message || 'Return request failed',
        //                 timer: 2500,
        //                 showConfirmButton: false,
        //                 toast: true,
        //                 position: 'top-end'
        //             });                
        //         }
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //         Swal.fire({
        //             icon: 'error',
        //             title: 'Something went wrong',
        //             timer: 2500,
        //             showConfirmButton: false,
        //             toast: true,
        //             position: 'top-end'
        //         });
        //     });
            
        //     closeModal();
        // }
function submitReturn(event) {
    const reason = document.getElementById('returnReason').value;
    const target = event.currentTarget; 
    const orderId = target.dataset.orderId;
    const itemId = target.dataset.itemId;  // Undefined for full returns

    console.log("orderId", orderId);
    console.log("itemId", itemId);
    console.log("reason", reason);

    if (!reason) {
        alert('Please provide a reason for return');
        return;
    }

    // Removed: if(!itemId) error check—full returns don't have itemId

    const status = 'delivered';

    fetch(`/user/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            reason,
            status: status.toLowerCase().trim(),
            ...(itemId && { itemId }),  
            returnRequest: true
        })
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


//         function downloadInvoice(orderId){
//             const button=document.querySelector('.download-invoice');
//             const originalText=button.innerHTML;
//             button.innerHTML='<span>Generating Invoice...</span>';
//             button.disabled=true;

//             fetch(`/user/orders/${orderId}/invoice`,{
//                 method:'GET',
//                 headers:{
//                     'Content-Type':'application/json',
//                 }
//             })
//             .then(response=>{
//                 if(!response.ok){
// throw new Error('failed to generate invoice');
//                 }
//                 return response.blob();
//             })
// .then(blob=>{
//     const url=window.URL.createObjectURL(blob);
//     const a =document.createElement('a');
//     a.href=url;
//     a.download='Invoice_${orderId}.pdf';
//      document.body.appendChild(a);
//             a.click();
//             window.URL.revokeObjectURL(url);
//             a.remove();
// })
//  .catch(error => {
//             console.error('Error:', error);
// Swal.fire({
//   icon: 'error',
//   title: 'Download Failed',
//   text: 'Failed to download invoice. Please try again.',
//   confirmButtonText: 'OK'
// });        })
//         .finally(() => {
//             button.innerHTML = originalText;
//             button.disabled = false;
//         });
//         }
