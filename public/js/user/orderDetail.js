
        function openModal(type) {
            document.getElementById(`${type}Modal`).style.display = 'flex';
        }

        function closeModal() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }

        function submitCancel() {
            const reason = document.getElementById('cancelReason').value;
            if (!reason) {
                alert('Please provide a reason for cancellation');
                return;
            }
            
            // Here you would typically send this to your server
            fetch(`/orders/<%= order._id %>/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Your cancellation request has been submitted');
                    window.location.reload();
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing your request');
            });
            
            closeModal();
        }

        function submitReturn() {
            const reason = document.getElementById('returnReason').value;
            if (!reason) {
                alert('Please provide a reason for return');
                return;
            }
            
            // Here you would typically send this to your server
            fetch(`/orders/<%= order._id %>/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Your return request has been submitted');
                    window.location.reload();
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing your request');
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

            fetch('/orders/${orderId}/invoice',{
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
    a.download=`Invoice_${orderId}.pdf`;
     document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
})
 .catch(error => {
            console.error('Error:', error);
            alert('Failed to download invoice. Please try again.');
        })
        .finally(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        });


        }