
// ===========================
// Signup Modal
// ===========================
const signupModal = document.getElementById("signupModal");
const closeSignup = document.getElementById("closeSignup");


export function showSignupModal(){
  if(signupModal) signupModal.style.display = 'flex';
}

export function hideSignupModal(){
  if(signupModal) signupModal.style.display = 'none';
}

closeSignup.addEventListener("click", ()=>{
  hideSignupModal();
  localStorage.setItem("signupPromptSeen", "yes");
});


document.getElementById("createAccountBtn").onclick = ()=>{
  window.location.href = "./signUp.html";
};

document.getElementById("loginBtn").onclick = ()=>{
  window.location.href = "./login.html";
};

