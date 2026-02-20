document.addEventListener("DOMContentLoaded", ()=> {
  const  sidebar = document.getElementById("sidebar");
const toggler = document.getElementById("toggleSidebar");

// Toggle the sidebar
toggler.addEventListener("click", function(e) {
  e.stopPropagation();
  if(sidebar.classList.contains("active")){
    sidebar.classList.remove("active");
  } else{
    sidebar.classList.add("active");
  }
})

// toggle sidebar off when clinking outside
window.addEventListener("click", function(e){
  if(!sidebar.contains(e.target) && !toggler.contains(e.target)) {
    sidebar.classList.remove("active");
  }
})
})