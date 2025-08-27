
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
    fetch('/user/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) {
          window.location.href = '/home'; 
        }
      })
      .catch(err => console.error('Logout failed:', err));
  });


async function updateCartCount(){
  try{
const response=await fetch('/user/cart/count');
const data=await response.json();
const countElement=document.querySelector('.cart-count');
if(countElement){
  countElement.textContent=data.count;
}

  }catch(error){
console.error('Faild to fetch cart count:',error);
  }
}
document.addEventListener('DOMContentLoaded', updateCartCount);
