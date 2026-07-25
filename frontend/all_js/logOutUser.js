 
export function logoutUser(auth) {


  const lapOutBtn = document.getElementById("logOut");
  const logOutBtn = document.getElementById("lapOut");

  
if(logOutBtn){
  logOutBtn.addEventListener("click", async() => {
    try {
      await signOut(auth);
      showSnackBar("Logged out successfully!");
    } catch(err){
      console.error("LogOut error;", err);
      showSnackBar("Error logging out.", "warning");
    }
  })
}


// laptop logout
if(lapOutBtn) {
 
  lapOutBtn.addEventListener("click", async() => {

    try {
      await signOut(auth);
      showSnackBar("Logged out successfully!");
    } catch (error) {
      console.error("LogOut error:", error);
      showSnackBar("Error logging out.");
    }
  });
}

}