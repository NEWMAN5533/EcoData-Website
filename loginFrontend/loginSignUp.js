
// variables //
const loginSection = document.querySelector(".login-form");
const registerSection = document.querySelector(".register-form");

// get id to connect //
const loginTabBtn = document.querySelector("#changeBackgroundColorLogin");
const registerTabBtn = document.querySelector("#changeBackgroundColorRegister");


// let create the function //
loginTabBtn.addEventListener("click", () => {
  loginTabBtn.style.backgroundColor = "#21264D";
  registerTabBtn.style.backgroundColor = "rgba(255,255,255,0.3)";


  loginSection.style.left = "50%";
  registerSection.style.left = "-50%";

  loginSection.style.opacity = 1;
  registerSection.style.opacity = 0;

  document.querySelector(".col-1").style.borderRadius = "0 20% 23% 0";
});


registerTabBtn.addEventListener("click", () => {
  registerTabBtn.style.backgroundColor = "#21264D";
  loginTabBtn.style.backgroundColor = "rgba(255,255,255,0.3)";


  loginSection.style.left = "150%";
  registerSection.style.left = "50%";


  loginSection.style.opacity = 0;
  registerSection.style.opacity = 1;

  document.querySelector(".col-1").style.borderRadius = "0 23% 20% 0";
});



