// Example partner data (Later from Firebase)
const partners = [
  {
    id: "1",
    name: "Smart Trends",
    category: "Fashion",
    location: "Tamale",
    description: "A verified Fashion Store dealing with clothes, bags, Sandals & more.",
    image: "",
    phone: "‪+233531834558‬",
    website: ""
  },
  {
    id: "2",
    name: "Ama’s Food Spot",
    category: "Food",
    location: "Kumasi",
    description: "Delicious homemade meals available for dine-in, takeaway and delivery.",
    image: "assets/partners/foodspot.jpg",
    phone: "‪+233555987654‪",
    website: "https://amasfoodspot.com"
  },
  {
    id: "3",
    name: "Jide Retail Store",
    category: "Retail",
    location: "Accra",
    description: "Your one-stop retail shop for fashion and electronics at unbeatable prices.",
    image: "assets/partners/retailstore.jpg",
    phone: "‪+233202345678‬",
    website: "https://jideretailstore.com"
  }
];

// Get ID from URL
const urlParams = new URLSearchParams(window.location.search);
const partnerId = urlParams.get("id");

const partner = partners.find(p => p.id === partnerId);

if (partner) {
  document.getElementById("partnerImage").src = partner.image;
  document.getElementById("partnerName").textContent = partner.name;
  document.getElementById("partnerCategory").textContent = partner.category;
  document.getElementById("partnerLocation").textContent = partner.location;
  document.getElementById("partnerDescription").textContent = partner.description;
  document.getElementById("partnerPhone").href = `tel:${partner.phone}`;
  document.getElementById("partnerWebsite").href = partner.website;
} else {
  document.querySelector(".partner-container").innerHTML = `
    <p style="text-align:center; padding: 30px;">Partner not found.</p>
`;
}