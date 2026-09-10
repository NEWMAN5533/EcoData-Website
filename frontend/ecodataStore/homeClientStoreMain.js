document.addEventListener("DOMContentLoaded",()=> {

//==================
// SIDEBAR TOGGLE
//==================
const mobileSidebar = document.getElementById("mobileSidebar");
const mobileSidebarToggler = document.getElementById("menuIcon");
const secondToggler = document.getElementById("mobileSidebarClose");

function isSidebarOpen(){
  mobileSidebar.classList.add("active");
}

function closeMobileSidebar(){
  mobileSidebar.classList.remove("active");
}

// Add eventListener
mobileSidebarToggler.addEventListener("click", (e)=> {
  e.stopPropagation();

  isSidebarOpen();
});

// to the second
secondToggler.addEventListener("click", (e)=> {
    e.stopPropagation();
    closeMobileSidebar();
  });


// Window e.target
window.addEventListener("click", (e)=> {
  if(!mobileSidebar.contains(e.target) && !mobileSidebarToggler.contains(e.target)){
    // call close sidebar function
    closeMobileSidebar();
  }
});


//====================
// SEARCH BUTTON OFF
//====================
const searchForm = document.querySelector(".desktop-search");

const searchIcon = document.getElementById("searchIcon");

searchIcon.addEventListener("click", function(e) {
  if(searchIcon){
    searchForm.style.display = "flex";
  }

});

//=======================
// ?
//=======================



});


