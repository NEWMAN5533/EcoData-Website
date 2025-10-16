  
// 🚨 Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // ❌ Not logged in → redirect to login page
    window.location.href = "login.html";
  } else {
    console.log("✅ User logged in:", user.email);
}
});