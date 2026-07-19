

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
    fadeSkeleton('sk-Welcome', 6000);
    fadeSkeleton('sk-Trusted', 6050);
    fadeSkeleton('sk-info', 6050);
    fadeSkeleton('sk-deliverTracker1', 6050);
    fadeSkeleton('sk-deliverTracker2', 6050);
    fadeSkeleton('offer-sk', 6050);
    fadeSkeleton('sk-Notice', 6000);
    fadeSkeleton('sk-gallery', 6050);
    fadeSkeleton('sk-follow-share', 6000);
    fadeSkeleton('sk-daily', 6050);
    fadeSkeleton('sk-totals', 6050);
    fadeSkeleton('sk-table', 6000);
    fadeSkeleton('sk-mode-btn', 6000);
    fadeSkeleton('sk-normalView', 6000);
  });
});