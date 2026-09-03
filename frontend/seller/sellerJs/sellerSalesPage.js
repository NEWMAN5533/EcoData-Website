

//=============================
// RENDER SALES
//=============================
function renderSales(sales){
  const wrapper =
  document.getElementById("withRowWrapper");

  const emptyBody = 
  document.getElementById("withEmpty-body");

  if(!wrapper) return;

  wrapper.innerHTML = "";

  if(!sales || sales.length === 0){
    emptyBody.hidden = false;
    return;
  }

    emptyBody.hidden = true;

    sales.forEach(sale => {
      const amount = Number(sale.amount || 0);
      const platformFee = 
      Number(sale.platformFee || 0);
      const creatorShare = 
      Number(sale.creatorShare ?? amount - platformFee);

      const row =
      document.createElement("div");

      row.className = "live-body-rowS";

      row.innerHTML = `
      <small>
      ${sale.productId || "-"}
      </small>

      <small>
        ${sale.productName || "-"}
      </small>

      <small>
      ${sale.buyer || "-"}
      </small>

      <small>
      GHS ${amount.toFixed(2)}
      </small>

      <small>
      GHS ${platformFee.toFixed(2)}
      </small>

      <small>
      GHS ${creatorShare.toFixed(2)}
      </small>

      <small>
      ${formatDate(sale.createdAt)}
      </small>
      `;

      wrapper.appendChild(row);
    });
}
