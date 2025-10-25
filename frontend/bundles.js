  const bundleDetails = {
    mtn: `
      <h3>MTN Bundle Process</h3>
      <ul>
        <li>MTN bundles are delivered instantly after payment.</li>
        <li>Ensure your number starts with <b>024, 054, 23355123..., 23359123..., or 23325123..</b>.</li>
        <li>If delivery delays, contact 
        <p><strong>WhatsAAp:</strong>+233535565637</p></li>
        <li>All transactions are secured via Paystack.</li>
      </ul>
      <p><b>Refunds:</b> If bundles fail, refunds are processed within 24 hours.</p>
    `,
    vodafone: `
      <h3>Telecel Bundle Process</h3>
      <ul>
        <li>Bundles are delivered within 2–30minutes after successful payment.</li>
        <li>Ensure your number starts with <b>2332012345... or 233501234...</b>.</li>
        <li>For failed delivery, contact support immediately.</li>
      </ul>
      <p><b>Refunds:</b> Verified failed transactions will be refunded within 24 hours.</p>
    `,
    airteltigo: `
      <h3>AirtelTigo Bundle Process</h3>
      <ul>
        <li>Delivery is automatic once payment is verified.</li>
        <li>Ensure your number starts with <b>23326..., 23356..., or 23327...</b>.</li>
        <li>Keep your account active to avoid delay.</li>
      </ul>
      <p><b>Refunds:</b> If unsuccessful, report within 24 hours for a quick refund.</p>
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
  if (card.style.right != "-300px"){
    card.style.right = "14px";
  } else card.style.right = "-300px";
});

window.addEventListener("click", function(e){
  if (e.target !== cardToggler && e.target !== card && !card.contains(e.target)){
    card.style.right = "-300px";
  }
});