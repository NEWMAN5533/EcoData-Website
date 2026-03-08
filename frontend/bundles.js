  const bundleDetails = {
    mtn: `
      <h3 class="htu">MTN Bundle Process</h3>
      <div class="uli">
         <ul>
        <li>MTN Bundles are delivered within 2–30minutes after it is prompted as delivered at the section for checking order status.</li>
        <li class=li>Ensure your number starts with <b> 23355123..., 23359123..., or 23325123..</b>.</li >
        <li>If delivery delays, contact 
        <p><strong>WhatsAp:</strong> 0535565637</p></li>
        <li>All transactions are secured via Paystack.</li>
      </ul>
      
    
   
      <p><b>Refunds:</b> If bundle purchase failed, refunds are processed within 24 hours.</p>
      
      </div>`,
    vodafone: `
      <h3 class="hvu">Telecel Bundle Process</h3>
      <div class="uli">
      <ul>
        <li>Bundles are delivered within 2–30minutes after successful payment.</li>
        <li>Ensure your number starts with <b>2332012345... or 233501234...</b>.</li>
        <li>For failed delivery, contact support immediately.</li>
      </ul>

      <p><b>Refunds:</b> Verified failed transactions will be refunded within 24 hours.</p>
      </div>
    `,
    airteltigo: `
      <h3 class="hto">AirtelTigo Bundle Process</h3>

      <div class="uli">
     
      <ul>
        <li>Delivery is automatic once payment is verified.</li>
        <li>Ensure your number starts with <b>23326..., 23356..., or 23327...</b>.</li>
        <li>Keep your account active to avoid delay.</li>
      </ul>
      <p><b>Refunds:</b> If unsuccessful, report within 24 hours for a quick refund.</p> </div>
     
    `
  };

  document.querySelectorAll(".network-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const network = btn.getAttribute("data-network");
      document.getElementById("bundle-details").innerHTML = bundleDetails[network];
    });
  });


    const cardToggler = document.getElementById("cardToggler");
  const cardCloser = document.getElementById("closeCard");

  // querySelectors //
  const card = document.querySelector(".menu-card-container");

  // function //
cardToggler.addEventListener("click", function(e){
  if (card.style.right != "-500px"){
    card.style.right = "14px";
  } else card.style.right = "-500px";
});

window.addEventListener("click", function(e){
  if (e.target !== cardToggler && e.target !== card && !card.contains(e.target)){
    card.style.right = "-500px";
  }
});