document.addEventListener("DOMContentLoaded", ()=> {




  requestAnimationFrame(() =>{
    overlay.innerHTML = skeletonTemplate;
  });


  (function () {
    

  const overlay = document.getElementById('skeletonOverlay');  
  if (!overlay) return;  
  
  function removeSkeleton() {  

    overlay.classList.add('fade-out');  
    setTimeout(() => overlay.remove(), 520);  
  }  
  
  // Strategy 1: hide when page is fully loaded (images, scripts, etc.)  
  if (document.readyState === 'complete') {  
    // Already loaded — small delay so content paints first  
    setTimeout(removeSkeleton, 6000);  
  } else {  
    window.addEventListener('load', function () {  
      setTimeout(removeSkeleton, 6000);  
    });  
  }  
  
  // Strategy 2: safety net — never show skeleton longer than 6 seconds  
  setTimeout(removeSkeleton, 6000);  
})();


});