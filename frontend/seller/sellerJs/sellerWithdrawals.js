/* ==========================================
   ECODATASTORE — SELLER WITHDRAWAL HISTORY
   Clerk Authentication + Neon PostgreSQL
========================================== */

const API_BASE_URL = "https://ecodata-app.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  initializeWithdrawalsPage();
});

async function initializeWithdrawalsPage() {
  const rowWrapper = document.getElementById("wd-RowWrapper");
  const emptyState = document.getElementById("empty-body");

  if (!rowWrapper) {
    console.error("Withdrawal table container was not found.");
    return;
  }

  // Prevent duplicate requests if initialization is called again.
  rowWrapper.querySelectorAll(".withdrawalTableRow").forEach(row => row.remove());

  showLoadingState();

  try {
    const clerk = await waitForClerk();

    if (!clerk.user || !clerk.session) {
      showPageMessage("Please sign in to view your withdrawal history.");
      return;
    }

    const token = await clerk.session.getToken();

    if (!token) {
      throw new Error("Unable to obtain your authentication token. Please sign in again.");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    };

    // Fetch the seller's withdrawal history and dashboard balance.
    const [withdrawalsResponse, dashboardResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/creator/withdrawals`, {
        method: "GET",
        headers
      }),
      fetch(`${API_BASE_URL}/api/creator/dashboard`, {
        method: "GET",
        headers
      })
    ]);

    const withdrawalsData = await readResponse(withdrawalsResponse);
    const dashboardData = await readResponse(dashboardResponse);

    if (!withdrawalsResponse.ok) {
      throw new Error(
        withdrawalsData.message ||
        withdrawalsData.error ||
        "Could not load withdrawal history."
      );
    }

    if (!dashboardResponse.ok) {
      throw new Error(
        dashboardData.message ||
        dashboardData.error ||
        "Could not load your seller balance."
      );
    }

    if (withdrawalsData.success === false) {
      throw new Error(withdrawalsData.message || "Could not load withdrawals.");
    }

    if (dashboardData.success === false) {
      throw new Error(dashboardData.message || "Could not load your dashboard.");
    }

    const withdrawals = Array.isArray(withdrawalsData.withdrawals)
      ? withdrawalsData.withdrawals
      : [];

    const dashboard = dashboardData.dashboard || {};

    renderWithdrawalSummary(dashboard, withdrawals);
    renderWithdrawalHistory(withdrawals);

  } catch (error) {
    console.error("Withdrawal page error:", error);
    showPageMessage(error.message || "Something went wrong loading withdrawals.");
  }
}

/* ==========================================
   WAIT FOR CLERK TO LOAD
========================================== */

async function waitForClerk(timeout = 10000) {
  const start = Date.now();

  while (!window.Clerk) {
    if (Date.now() - start > timeout) {
      throw new Error("Authentication service did not load. Refresh the page and try again.");
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const clerk = window.Clerk;

  if (!clerk.loaded) {
    await clerk.load();
  }

  return clerk;
}

/* ==========================================
   SAFE JSON RESPONSE HANDLING
========================================== */

async function readResponse(response) {
  const text = await response.text();

  console.log("API URL:", response.url);
  console.log("HTTP status:", response.status);
  console.log("Content-Type:", response.headers.get("content-type"));
  console.log("Response preview:", text.slice(0, 500));

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON from ${response.url}. ` +
      `HTTP ${response.status}. Response: ${text.slice(0, 200)}`
    );
  }

  if (response.status === 401) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission to view these withdrawals.");
  }

  return data;
}
/* ==========================================
   CURRENCY AND DATE FORMATTING
========================================== */

function formatGHS(value) {
  const amount = Number(value);

  return `GHS ${(
    Number.isFinite(amount) ? amount : 0
  ).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatWithdrawalDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase().trim();
}

function formatStatus(status) {
  const labels = {
    pending: "Pending",
    approved: "Approved",
    processing: "Processing",
    paid: "Paid",
    rejected: "Rejected",
    failed: "Failed"
  };

  return labels[normalizeStatus(status)] || "Pending";
}

/* ==========================================
   SUMMARY CARDS
========================================== */

function renderWithdrawalSummary(dashboard, withdrawals) {
  const availableElement = document.getElementById(
    "withdrawalAvailableBalance"
  );

  const totalWithdrawnElement = document.getElementById("totalWithdrawn");
  const pendingElement = document.getElementById("pendingWithdrawals");

  // Prefer the backend's available-balance calculation.
  const availableBalance = Number(dashboard.availableBalance ?? 0);

  // Derive totals from the seller's own withdrawal records.
  const totalWithdrawn = withdrawals
    .filter(item => normalizeStatus(item.status) === "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pendingAmount = withdrawals
    .filter(item =>
      ["pending", "approved", "processing"].includes(
        normalizeStatus(item.status)
      )
    )
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (availableElement) {
    availableElement.textContent = formatGHS(availableBalance);
  }

  if (totalWithdrawnElement) {
    totalWithdrawnElement.textContent = formatGHS(totalWithdrawn);
  }

  if (pendingElement) {
    pendingElement.textContent = formatGHS(pendingAmount);
  }
}

/* ==========================================
   WITHDRAWAL HISTORY TABLE
========================================== */

function renderWithdrawalHistory(withdrawals) {
  const rowWrapper = document.getElementById("wd-RowWrapper");
  const emptyState = document.getElementById("empty-body");

  if (!rowWrapper) return;

  // Remove previous rows and messages, keeping the empty-state element.
  rowWrapper.querySelectorAll(".withdrawalTableRow, .withdrawalPageMessage")
    .forEach(element => element.remove());

  if (!withdrawals.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  // Newest withdrawal requests first.
  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
    return new Date(b.requestedAt || b.requested_at || 0) -
           new Date(a.requestedAt || a.requested_at || 0);
  });

  sortedWithdrawals.forEach(withdrawal => {
    const row = document.createElement("div");
    row.className = "withdrawalTableRow";

    const amount = document.createElement("small");
    amount.textContent = formatGHS(withdrawal.amount);

    const requested = document.createElement("small");
    requested.textContent = formatWithdrawalDate(
      withdrawal.requestedAt || withdrawal.requested_at
    );

    const approved = document.createElement("small");
    const status = normalizeStatus(withdrawal.status);
    approved.appendChild(createStatusBadge(
      status === "approved" || status === "processing" || status === "paid"
        ? "approved"
        : status
    ));

    const paid = document.createElement("small");
    paid.appendChild(createStatusBadge(status));

    const reference = document.createElement("small");
    reference.textContent =
      withdrawal.transaction_reference ||
      withdrawal.transactionReference ||
      withdrawal.reference ||
      "—";

    row.append(amount, requested, approved, paid, reference);
    rowWrapper.appendChild(row);
  });
}

/* ==========================================
   STATUS BADGES
========================================== */

function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = `withdrawalStatus ${normalizeStatus(status)}`;
  badge.textContent = formatStatus(status);
  return badge;
}

/* ==========================================
   LOADING AND ERROR STATES
========================================== */

function showLoadingState() {
  const rowWrapper = document.getElementById("wd-RowWrapper");
  const emptyState = document.getElementById("empty-body");

  if (emptyState) emptyState.hidden = true;

  if (!rowWrapper) return;

  rowWrapper.querySelectorAll(".withdrawalTableRow, .withdrawalPageMessage")
    .forEach(element => element.remove());

  const message = document.createElement("div");
  message.className = "withdrawalPageMessage";
  message.textContent = "Loading your withdrawal history…";

  rowWrapper.appendChild(message);
}

function showPageMessage(messageText) {
  const rowWrapper = document.getElementById("wd-RowWrapper");
  const emptyState = document.getElementById("empty-body");

  if (emptyState) emptyState.hidden = true;
  if (!rowWrapper) return;

  rowWrapper.querySelectorAll(".withdrawalTableRow, .withdrawalPageMessage")
    .forEach(element => element.remove());

  const message = document.createElement("div");
  message.className = "withdrawalPageMessage";
  message.textContent = messageText;

  rowWrapper.appendChild(message);
}
