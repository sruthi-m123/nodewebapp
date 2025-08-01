
// function view(id) {
//   console.log("id:", id);
//   fetch(`/orders-details/${id}`)
//     .then(res => res.json())
//     .then(data => {
//       console.log(data);
//     })
//     .catch(err => console.error("Error fetching order details:", err));
// }

function view(id) {
  console.log("id:", id);
  window.location.href = `/orders-details/${id}`;
}


function debounce(func,delay){
    let timeout;
    return function(...args){
        clearTimeout(timeout);
        timeout=setTimeout(()=>func.apply(this,args),delay);
    };
}

const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('keyup', debounce(async function () {
  const query = searchInput.value.trim();
  if (!query) return;

  try {
    const res = await fetch(`/admin/products/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    renderSearchResults(data); 
  } catch (err) {
    console.error("Search error:", err);
  }
}, 300)); 

