
//=======================
// WITHDRAWAL FUNCTION
//=======================
function renderWithdrawals(withdrawals){
  const wrapper = 
  document.getElementById("wd-RowWrapper");

  if(!wrapper) return;

  wrapper.innerHTML = "";

  const emptyBody = wrapper.closest(".wd-content")
  ?.querySelector("#empty-body");

  if(!withdrawals || withdrawals.length === 0){
    if(emptyBody){
      emptyBody.hidden = false;
    }
    return;
  }

  if(emptyBody){
    emptyBody.hidden = true;
  }

  withdrawals.forEach(withdrawal => {
    const row =
    document.createElement("div");

    row.className = "live-body-rowW";

    row.innerHTML = `
    <small>
    GHS ${Number(withdrawal.amount || 0).toFixed(2)}
    </small>

    <small>
    ${formatDate(withdrawal.requestedAt)}
    </small>

    <small>
    ${withdrawal.approved === true ? "Yes" : "No"}
    </small>

    <small>
    ${withdrawal.paid === true? "Yes" : "No"}
    </small>

    <small>
    ${withdrawal.reference || "pending"}
    </small>
    `;

    wrapper.appendChild(row);
  });
}