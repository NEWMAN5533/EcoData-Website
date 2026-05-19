

document.addEventListener("DOMContentLoaded", ()=> {
   function fadeSkeleton(id, delay = 0){

    const skeleton = document.getElementById(id);

    if(!skeleton) return;

    setTimeout(() => {
      skeleton.classList.add('sk-fade-out');

      setTimeout(()=> {
        skeleton.remove();
      },0);
    }, delay);
   }

   //==============
   // SECTION REVEAL TIME
   // ===============
   window.addEventListener('load', () => {
    fadeSkeleton('sk-NavBar', 3000);
    fadeSkeleton('sk-Welcome', 5000);
    fadeSkeleton('sk-Trusted', 10050);
    fadeSkeleton('sk-Notice', 7000);
   });
});
