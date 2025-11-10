const partners = [
  {
    name: "Smart Trends",
    category: "Fashion",
    location: "Tamale",
    image: "frontend/css/images/women8.png",
    link: "partner-details.html?id=1"
  },
  {
    name: "Ama’s Food Spot",
    category: "Food",
    location: "Kumasi",
    image: "assets/partners/foodspot.jpg",
    link: "partner-details.html?id=2"
  },
  {
    name: "Jide Retail Store",
    category: "Retail",
    location: "Accra",
    image: "assets/partners/retailstore.jpg",
    link: "partner-details.html?id=3"
  },
];

function renderPartners(list) {
  const grid = document.getElementById("partnersGrid");
  grid.innerHTML = list.map(p => `
    <div class="partner-card">
      <img src="${p.image}" alt="${p.name}">
      <div class="partner-info">
        <h3>${p.name}</h3>
        <p><strong>Category:</strong> ${p.category}</p>
        <p><strong>Location:</strong> ${p.location}</p>
        <button onclick="window.location='${p.link}'">View Details</button>
      </div>
    </div>
  `).join("");
}

renderPartners(partners);

// Search + Filter
document.getElementById("searchInput").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  const filtered = partners.filter(p => p.name.toLowerCase().includes(term));
  renderPartners(filtered);
});

document.getElementById("categoryFilter").addEventListener("change", e => {
  const cat = e.target.value;
  const filtered = cat === "all" ? partners : partners.filter(p => p.category === cat);
  renderPartners(filtered);
});