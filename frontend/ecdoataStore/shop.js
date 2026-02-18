const products = [
  {
    id: 1,
    name: "Men's Casual Shirt",
    price: 120,
    oldPrice: 180,
    image: "./products/kitchen.png",
    rating: 4
  },
  {
    id: 2,
    name: "HP Laptop 8GB RAM",
    price: 4200,
    oldPrice: 4800,
    image: "./products/com.png",
    rating: 5
  },
  {
    id: 3,
    name: "Kitchen Blender",
    price: 350,
    oldPrice: 420,
    image: "./products/product1(2).jpeg",
    rating: 4
  }
];

const productGrid = document.getElementById("productGrid");

if (productGrid) {
  products.forEach(product => {
    productGrid.innerHTML += `
      <div class="product-card">

        <div class="badge">SALE</div>

        <div class="image-container">
          <img src="${product.image}" alt="${product.name}">
        </div>

        <h4>${product.name}</h4>

        <div class="rating">
          ${generateStars(product.rating)}
        </div>

        <div class="price-box">
          <span class="new-price">₵${product.price}</span>
          <span class="old-price">₵${product.oldPrice}</span>
        </div>

        <div class="card-buttons">
          <button class="view-btn">View</button>
          <button class="cart-btn">Add to Cart</button>
        </div>

      </div>
    `;
  });
}

function generateStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? "⭐" : "☆";
  }
  return stars;
}



