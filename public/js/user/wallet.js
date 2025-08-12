
    document.getElementById('addFundsBtn').addEventListener('click', async () => {
      const amount = parseFloat(document.getElementById('amount').value);
      const messageEl = document.getElementById('addFundsMessage');
      
      if (!amount || amount <= 0) {
        messageEl.textContent = 'Please enter a valid amount';
        messageEl.style.color = 'red';
        return;
      }

      try {
        const response = await fetch('/wallet/add-funds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount })
        });

        const data = await response.json();

        if (data.success) {
          messageEl.textContent = `Successfully added Rs.${amount.toFixed(2)} to your wallet`;
          messageEl.style.color = 'green';
          document.querySelector('.wallet-details h3').textContent = `Rs ${data.newBalance.toFixed(2)}`;
          document.getElementById('amount').value = '';
          
          // Reload transactions after 2 seconds
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          messageEl.textContent = data.error || 'Failed to add funds';
          messageEl.style.color = 'red';
        }
      } catch (error) {
        console.error('Error:', error);
        messageEl.textContent = 'An error occurred';
        messageEl.style.color = 'red';
      }
    });
  
