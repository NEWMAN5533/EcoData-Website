import { auth } from "firebase-admin";
import { auth } from "./firebase-config.js";
import {signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const API_BASE = "https://ecodata-app.onrender.com";

const storeId = localStorage.getItem("storeId");

// protect page
if(!storeId) {
  alert("No store found ");
  window.location.href = "./createStorePage.html"
}

// LOGOUT
window.logout = async () => {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "/";
};

// Upload products
window.uploadProduct = async () => {
  const name = document.getElementById("productName").value;
  const price = document.getElementById("productPrice").value;
  const file = document.getElementById("productImage").files[0];
  const desc = document.getElementById("productDesc").value;

  if(!name || !price || !file ) {
    alert("Fill all fields");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", price);
  formData.append("description", desc);
  formData.append("storeId", storeId);

  try {
    const res = await fetch(`${API_BASE}/api/upload-product`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if(!data.success) {
      alert("Upload failed");
      return;
    }


    alert("Product uploaded");

    loadProducts();
  } catch (err) {
    console.error(err)
  }
};

// Load Products
async function loadProducts() {
  const res = await fetch(`${API_BASE}/api/get-products?storeId=${storeId}`);

  const data = await res.json();

  const list = document.getElementById("productList");
  list.innerHTML = "";

  data.products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
    <img src="${p.image}" />
    <h4>${p.name}</h4>
    <p>GHS ${p.price}</p>
    <button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button>
    `;

    list.appendChild(div);
  });
}

// Delete
window.deleteProduct = async (id) => {
  await fetch(`${API_BASE}/api/delete-product/${id}`, {
    method: "DELETE"
  });

  loadProducts();
};

// LOAD ON START
loadProducts();