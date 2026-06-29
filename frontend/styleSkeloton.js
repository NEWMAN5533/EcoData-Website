

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
    fadeSkeleton('sk-Trusted', 10050);
    fadeSkeleton('sk-info', 10050);
    fadeSkeleton('offer-sk', 10050);
    fadeSkeleton('sk-Notice', 7000);
    fadeSkeleton('sk-gallery', 10050);
    fadeSkeleton('sk-follow-share', 7000);
    fadeSkeleton('sk-daily', 10050);
    fadeSkeleton('sk-totals', 7000);
    fadeSkeleton('sk-table', 10000);
    fadeSkeleton('sk-mode-btn', 13000);
    fadeSkeleton('sk-normalView', 12000);
   });
});
