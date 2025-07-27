
      document.addEventListener('DOMContentLoaded', function() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const body = document.body;
        
        menuToggle.addEventListener('click', function() {
          this.classList.toggle('active');
          mobileMenu.classList.toggle('active');
          body.classList.toggle('no-scroll');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.mobile-nav-link, .mobile-icon-link').forEach(link => {
          link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            body.classList.remove('no-scroll');
          });
        });
     
const profileIcon=document.getElementById("profileIcon");
const profileCard=document.getElementById("profileCard");
if(profileIcon&&profileCard){
profileIcon.addEventListener("click",(e)=>{
  e.preventDefault();
  profileCard.classList.toggle("show");
});
window.addEventListener("click",(e)=>{
  if(!profileIcon.contains(e.target)&&!profileCard.contains(e.target)){
    profileCard.classList.remove("show");
  }
})
}
 });

  document.getElementById('logoutBtn').addEventListener('click', function (e) {
    e.preventDefault();
    fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) {
          window.location.href = '/'; 
        }
      })
      .catch(err => console.error('Logout failed:', err));
  });

document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', async function () {
    const productId = this.dataset.id;

    try {
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (response.status === 401) {
        // 🧁 SweetAlert with clickable login link
        Swal.fire({
          icon: 'info',
          title: 'Please login to continue',
          html: 'You need to be logged in to add items to cart.<br><br><a href="/user/login" style="color: #3085d6; text-decoration: underline;">Click here to login</a>',
          showConfirmButton: false,
          timer: 4000
        });
      } else if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Added to cart!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: data.message || 'Something went wrong'
        });
      }

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Something went wrong'
      });
    }
  });
});
