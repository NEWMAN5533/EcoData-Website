// =============================
// UPDATE USER UI
// =============================

export function updateUserUI(userData, greeting) {

  const usernameDisplay = document.getElementById("usernameDisplay");
  const ifUserName = document.getElementById("ifUserName");
  const helloName = document.getElementById("helloName");
  const helloContent = document.getElementById("helloContent");

  if (usernameDisplay) {
    usernameDisplay.textContent =
      `${greeting}, ${userData.username}!`;
  } else{
    usernameDisplay.textContent = `${greeting}, Dear `;
  }

  if (ifUserName) {
    ifUserName.textContent = userData.username;
  }

  if (helloName) {
    helloName.textContent =
      `Please, ${userData.username}`;
  }

  if (helloContent) {
    helloContent.textContent =
      'The data bundle will be sent after successful payment. Make sure you click "I Have Completed the payment" for verification.';
  }

}



// =============================
// GUEST UI
// =============================
export function showGuestUI(greeting) {

  const usernameDisplay =
    document.getElementById("usernameDisplay");

  const ifUserName =
    document.getElementById("ifUserName");

  const helloName =
    document.getElementById("helloName");

  const helloContent =
    document.getElementById("helloContent");

  if (usernameDisplay) {
    usernameDisplay.textContent =
      `${greeting}, Dear`;
  }

  if (ifUserName) {
    ifUserName.textContent = "";
  }

  if (helloName) {
    helloName.textContent = "";
  }

  if (helloContent) {
    helloContent.textContent = "";
  }

}



// =============================
// UPDATE USER ACCESS
// =============================
export function updateAccess(userData) {

  const adminLink1 =
    document.getElementById("adminAccessLink1");

  const adminLink2 =
    document.getElementById("adminAccessLink2");

  const adminLink3 =
    document.getElementById("adminAccessLink3");

  const adminLink4 =
    document.getElementById("adminAccessLink4");

  const adminLinks = [
    adminLink1,
    adminLink2,
    adminLink3,
    adminLink4
  ];

  const agentLinks = [
    adminLink2,
    adminLink4
  ];

  // Hide everything first
  [...adminLinks, ...agentLinks].forEach(link => {
    if (link) link.style.display = "none";
  });

  // Agent access
  if (
    userData.isAgent === true &&
    userData.isAdmin !== true
  ) {

    agentLinks.forEach(link => {
      if (link) link.style.display = "flex";
    });

  }

  // Admin access
  if (userData.isAdmin === true) {

    adminLinks.forEach(link => {
      if (link) link.style.display = "flex";
    });

  }

}
