
  // === REAL TIME CLOCK ===
 export function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = days[now.getDay()];

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // Greeting logic
  let greeting = "";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";
  else greeting = "Good Evening";

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  clock.innerHTML = `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;

  return greeting; // 🔥 important
}

setInterval(updateClock, 1000);
updateClock();
