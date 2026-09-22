// =========================================================
// ADMIN CATEGORIES
// DEMO DATA
// =========================================================

let categories = [

  {
    id: "CAT-10001",
    name: "Fashion",
    slug: "fashion",
    type: "physical",
    products: 42,
    status: "active",
    icon: "ri-shirt-line",
    description:
      "Clothing, footwear, accessories and other fashion products.",
    created: "2026-06-12T10:20:00",
    updated: "2026-09-18T14:25:00"
  },

  {
    id: "CAT-10002",
    name: "Digital Products",
    slug: "digital-products",
    type: "digital",
    products: 67,
    status: "active",
    icon: "ri-file-download-line",
    description:
      "Ebooks, templates, PDF resources, notes and other downloadable products.",
    created: "2026-06-14T09:15:00",
    updated: "2026-09-20T11:40:00"
  },

  {
    id: "CAT-10003",
    name: "Electronics",
    slug: "electronics",
    type: "physical",
    products: 31,
    status: "active",
    icon: "ri-smartphone-line",
    description:
      "Phones, accessories, gadgets and electronic equipment.",
    created: "2026-06-18T13:10:00",
    updated: "2026-09-15T16:10:00"
  },

  {
    id: "CAT-10004",
    name: "Education",
    slug: "education",
    type: "digital",
    products: 29,
    status: "active",
    icon: "ri-book-open-line",
    description:
      "Educational materials, study resources and academic documents.",
    created: "2026-06-22T08:30:00",
    updated: "2026-09-17T12:35:00"
  },

  {
    id: "CAT-10005",
    name: "Services",
    slug: "services",
    type: "service",
    products: 24,
    status: "active",
    icon: "ri-service-line",
    description:
      "Professional, creative, technical and digital services.",
    created: "2026-06-25T15:20:00",
    updated: "2026-09-19T10:20:00"
  },

  {
    id: "CAT-10006",
    name: "Business",
    slug: "business",
    type: "digital",
    products: 18,
    status: "active",
    icon: "ri-briefcase-4-line",
    description:
      "Business templates, documents and useful business resources.",
    created: "2026-07-02T11:00:00",
    updated: "2026-09-10T09:20:00"
  },

  {
    id: "CAT-10007",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    type: "physical",
    products: 16,
    status: "active",
    icon: "ri-sparkling-line",
    description:
      "Beauty products, personal care items and accessories.",
    created: "2026-07-05T14:40:00",
    updated: "2026-09-12T15:30:00"
  },

  {
    id: "CAT-10008",
    name: "Home & Living",
    slug: "home-living",
    type: "physical",
    products: 13,
    status: "active",
    icon: "ri-home-4-line",
    description:
      "Products and accessories for homes and everyday living.",
    created: "2026-07-08T12:15:00",
    updated: "2026-09-14T13:10:00"
  },

  {
    id: "CAT-10009",
    name: "Graphics & Design",
    slug: "graphics-design",
    type: "service",
    products: 8,
    status: "active",
    icon: "ri-palette-line",
    description:
      "Graphic design, branding, artwork and creative services.",
    created: "2026-07-11T10:10:00",
    updated: "2026-09-08T11:15:00"
  },

  {
    id: "CAT-10010",
    name: "CV & Career",
    slug: "cv-career",
    type: "digital",
    products: 0,
    status: "hidden",
    icon: "ri-file-user-line",
    description:
      "CV templates, career documents and professional resources.",
    created: "2026-07-15T09:00:00",
    updated: "2026-09-01T10:00:00"
  },

  {
    id: "CAT-10011",
    name: "Accessories",
    slug: "accessories",
    type: "physical",
    products: 0,
    status: "hidden",
    icon: "ri-handbag-line",
    description:
      "Fashion and lifestyle accessories.",
    created: "2026-07-20T13:00:00",
    updated: "2026-08-28T12:20:00"
  },

  {
    id: "CAT-10012",
    name: "Photography",
    slug: "photography",
    type: "service",
    products: 0,
    status: "hidden",
    icon: "ri-camera-line",
    description:
      "Photography and photo-related creative services.",
    created: "2026-08-01T10:30:00",
    updated: "2026-08-30T14:00:00"
  }

];


let currentCategoryPage = 1;

const categoriesPerPage = 8;

let selectedCategoryId = null;

let editingCategory = false;

let categoryDeleteId = null;


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeCategories
);


// =========================================================
// INITIALIZE
// =========================================================

function initializeCategories(){

  setupCategoryFilters();

  setupCategoryActions();

  setupCategoryDrawer();

  renderCategories();

}


// =========================================================
// FILTERS
// =========================================================

function setupCategoryFilters(){

  const search =
    document.getElementById("categorySearch");

  const typeFilter =
    document.getElementById("categoryTypeFilter");

  const statusFilter =
    document.getElementById("categoryStatusFilter");

  const clearButton =
    document.getElementById("clearCategoryFilters");


  [search,typeFilter,statusFilter].forEach(
    element => {

      if (!element) return;

      element.addEventListener(
        "input",
        () => {

          currentCategoryPage = 1;

          renderCategories();

        }
      );

      element.addEventListener(
        "change",
        () => {

          currentCategoryPage = 1;

          renderCategories();

        }
      );

    }
  );


  clearButton?.addEventListener(
    "click",
    () => {

      if (search)
        search.value = "";

      if (typeFilter)
        typeFilter.value = "all";

      if (statusFilter)
        statusFilter.value = "all";

      currentCategoryPage = 1;

      renderCategories();

    }
  );

}


// =========================================================
// GET FILTERED CATEGORIES
// =========================================================

function getFilteredCategories(){

  const search =
    document
      .getElementById("categorySearch")
      ?.value
      .trim()
      .toLowerCase() || "";


  const type =
    document
      .getElementById("categoryTypeFilter")
      ?.value || "all";


  const status =
    document
      .getElementById("categoryStatusFilter")
      ?.value || "all";


  return categories.filter(category => {

    const matchesSearch =
      !search ||
      category.name.toLowerCase().includes(search) ||
      category.slug.toLowerCase().includes(search) ||
      category.id.toLowerCase().includes(search);


    const matchesType =
      type === "all" ||
      category.type === type;


    const matchesStatus =
      status === "all" ||
      category.status === status;


    return (
      matchesSearch &&
      matchesType &&
      matchesStatus
    );

  });

}


// =========================================================
// RENDER
// =========================================================

function renderCategories(){

  const filtered =
    getFilteredCategories();


  const start =
    (currentCategoryPage - 1) *
    categoriesPerPage;


  const pageItems =
    filtered.slice(
      start,
      start + categoriesPerPage
    );


  const body =
    document.getElementById(
      "categoryTableBody"
    );


  if (!body) return;


  if (!pageItems.length){

    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="admin-empty-state">
            <i class="ri-price-tag-3-line"></i>

            <strong>No categories found</strong>

            <span>
              Try changing your search or filters.
            </span>
          </div>
        </td>
      </tr>
    `;

  } else {

    body.innerHTML =
      pageItems
        .map(createCategoryRow)
        .join("");

  }


  updateCategoryStats();

  updateCategoryResultCount(
    filtered.length
  );

  renderCategoryPagination(
    filtered.length
  );

  setupCategoryRowActions();

}


// =========================================================
// CREATE ROW
// =========================================================

function createCategoryRow(category){

  return `
    <tr>

      <td>

        <div class="category-cell">

          <div class="category-cell-icon">

            <i class="${escapeHTML(
              category.icon ||
              "ri-price-tag-3-line"
            )}"></i>

          </div>

          <div class="category-cell-content">

            <span class="category-cell-name">
              ${escapeHTML(category.name)}
            </span>

            <span class="category-cell-slug">
              /${escapeHTML(category.slug)}
            </span>

          </div>

        </div>

      </td>


      <td>

        <span class="category-type-badge">

          ${escapeHTML(
            capitalize(category.type)
          )}

        </span>

      </td>


      <td>

        <span class="category-products-count">

          ${Number(
            category.products || 0
          ).toLocaleString()}

        </span>

      </td>


      <td>

        <span class="
          category-status-badge
          ${escapeHTML(category.status)}
        ">

          ${escapeHTML(
            capitalize(category.status)
          )}

        </span>

      </td>


      <td>

        <span class="category-date">
          ${formatCategoryDate(
            category.created
          )}
        </span>

      </td>


      <td>

        <span class="category-date">
          ${formatCategoryDate(
            category.updated
          )}
        </span>

      </td>


      <td>

        <div class="category-action">

          <button
            type="button"
            class="category-action-button"
            aria-label="Category actions"
          >
            <i class="ri-more-2-fill"></i>
          </button>


          <div class="category-action-menu">

            <button
              type="button"
              data-category-action="view"
              data-category-id="${escapeHTML(category.id)}"
            >
              <i class="ri-eye-line"></i>
              View
            </button>


            <button
              type="button"
              data-category-action="edit"
              data-category-id="${escapeHTML(category.id)}"
            >
              <i class="ri-edit-line"></i>
              Edit
            </button>


            <button
              type="button"
              data-category-action="delete"
              data-category-id="${escapeHTML(category.id)}"
              class="delete"
            >
              <i class="ri-delete-bin-6-line"></i>
              Delete
            </button>

          </div>

        </div>

      </td>

    </tr>
  `;

}


// =========================================================
// ACTION MENUS
// =========================================================

function setupCategoryRowActions(){

  document
    .querySelectorAll(
      ".category-action-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const wrapper =
            button.closest(
              ".category-action"
            );

          if (!wrapper) return;

          document
            .querySelectorAll(
              ".category-action-menu.show"
            )
            .forEach(menu => {

              if (!wrapper.contains(menu)){

                menu.classList.remove("show");

              }

            });


          const menu =
            wrapper.querySelector(
              ".category-action-menu"
            );


          menu?.classList.toggle("show");

        }
      );

    });


  document
    .querySelectorAll(
      "[data-category-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const action =
            button.dataset.categoryAction;

          const id =
            button.dataset.categoryId;


          document
            .querySelectorAll(
              ".category-action-menu.show"
            )
            .forEach(menu =>
              menu.classList.remove("show")
            );


          if (action === "view"){

            openCategoryDrawer(
              id,
              false
            );

          }


          if (action === "edit"){

            openCategoryDrawer(
              id,
              true
            );

          }


          if (action === "delete"){

            openDeleteConfirmation(id);

          }

        }
      );

    });

}


// =========================================================
// CLOSE ACTION MENUS
// =========================================================

document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        ".category-action"
      )
    ){

      document
        .querySelectorAll(
          ".category-action-menu.show"
        )
        .forEach(menu =>
          menu.classList.remove("show")
        );

    }

  }
);


// =========================================================
// STATS
// =========================================================

function updateCategoryStats(){

  const total =
    categories.length;


  const active =
    categories.filter(
      category =>
        category.status === "active"
    ).length;


  const hidden =
    categories.filter(
      category =>
        category.status === "hidden"
    ).length;


  const products =
    categories.reduce(
      (sum, category) =>
        sum + Number(
          category.products || 0
        ),
      0
    );


  const average =
    total
      ? Math.round(products / total)
      : 0;


  setText(
    "totalCategories",
    total.toLocaleString()
  );

  setText(
    "activeCategories",
    active.toLocaleString()
  );

  setText(
    "hiddenCategories",
    hidden.toLocaleString()
  );

  setText(
    "categoryProducts",
    products.toLocaleString()
  );

  setText(
    "averageProducts",
    average.toLocaleString()
  );

}


// =========================================================
// RESULT COUNT
// =========================================================

function updateCategoryResultCount(total){

  const element =
    document.getElementById(
      "categoryResultCount"
    );

  if (!element) return;

  element.textContent =
    `${total.toLocaleString()} ${
      total === 1
        ? "category"
        : "categories"
    }`;

}


// =========================================================
// PAGINATION
// =========================================================

function renderCategoryPagination(
  totalItems
){

  const container =
    document.getElementById(
      "categoryPagination"
    );

  const info =
    document.getElementById(
      "categoryPaginationInfo"
    );


  if (!container) return;


  const totalPages =
    Math.ceil(
      totalItems /
      categoriesPerPage
    );


  if (!totalItems){

    container.innerHTML = "";

    if (info)
      info.textContent =
        "Showing 0 of 0";

    return;

  }


  if (currentCategoryPage > totalPages){

    currentCategoryPage =
      totalPages;

  }


  const start =
    (currentCategoryPage - 1) *
    categoriesPerPage + 1;


  const end =
    Math.min(
      currentCategoryPage *
        categoriesPerPage,
      totalItems
    );


  if (info){

    info.textContent =
      `Showing ${start}–${end} of ${totalItems}`;

  }


  const pages = [];

  pages.push(1);


  const startPage =
    Math.max(
      2,
      currentCategoryPage - 1
    );


  const endPage =
    Math.min(
      totalPages - 1,
      currentCategoryPage + 1
    );


  if (startPage > 2)
    pages.push("...");


  for (
    let page = startPage;
    page <= endPage;
    page++
  ){

    pages.push(page);

  }


  if (
    endPage <
    totalPages - 1
  ){

    pages.push("...");

  }


  if (totalPages > 1)
    pages.push(totalPages);


  let html = `

    <button
      type="button"
      data-page="${currentCategoryPage - 1}"
      ${currentCategoryPage === 1 ? "disabled" : ""}
      aria-label="Previous page"
    >
      <i class="ri-arrow-left-s-line"></i>
    </button>

  `;


  pages.forEach(page => {

    if (page === "..."){

      html += `
        <span class="pagination-ellipsis">
          ...
        </span>
      `;

      return;

    }


    html += `

      <button
        type="button"
        class="${page === currentCategoryPage ? "active" : ""}"
        data-page="${page}"
      >
        ${page}
      </button>

    `;

  });


  html += `

    <button
      type="button"
      data-page="${currentCategoryPage + 1}"
      ${currentCategoryPage === totalPages ? "disabled" : ""}
      aria-label="Next page"
    >
      <i class="ri-arrow-right-s-line"></i>
    </button>

  `;


  container.innerHTML = html;


  container
    .querySelectorAll(
      "button[data-page]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            Number(
              button.dataset.page
            );


          if (
            page < 1 ||
            page > totalPages
          ) return;


          currentCategoryPage =
            page;

          renderCategories();

        }
      );

    });

}


// =========================================================
// DRAWER
// =========================================================

function setupCategoryDrawer(){

  document
    .getElementById(
      "closeCategoryDrawer"
    )
    ?.addEventListener(
      "click",
      closeCategoryDrawer
    );


  document
    .getElementById(
      "closeCategoryDrawerButton"
    )
    ?.addEventListener(
      "click",
      closeCategoryDrawer
    );


  document
    .getElementById(
      "editCategoryButton"
    )
    ?.addEventListener(
      "click",
      () => {

        if (!selectedCategoryId)
          return;

        switchCategoryEditMode(true);

      }
    );


  document
    .getElementById(
      "saveCategoryButton"
    )
    ?.addEventListener(
      "click",
      saveCategory
    );


  document
    .getElementById(
      "addCategoryButton"
    )
    ?.addEventListener(
      "click",
      openAddCategory
    );


  document
    .getElementById(
      "categoryDrawer"
    )
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "categoryDrawer"
        ){

          closeCategoryDrawer();

        }

      }
    );

}


// =========================================================
// OPEN DRAWER
// =========================================================

function openCategoryDrawer(
  categoryId,
  edit = false
){

  const category =
    categories.find(
      item =>
        item.id === categoryId
    );


  if (!category) return;


  selectedCategoryId =
    category.id;


  editingCategory =
    edit;


  fillCategoryDetails(
    category
  );


  fillCategoryForm(
    category
  );


  const title =
    document.getElementById(
      "categoryDrawerTitle"
    );

  if (title){

    title.textContent =
      edit
        ? "Edit Category"
        : "Category Details";

  }


  switchCategoryEditMode(
    edit
  );


  document
    .getElementById(
      "categoryDrawer"
    )
    ?.classList.add("show");

}


// =========================================================
// ADD CATEGORY
// =========================================================

function openAddCategory(){

  selectedCategoryId =
    null;

  editingCategory =
    true;


  const title =
    document.getElementById(
      "categoryDrawerTitle"
    );

  if (title)
    title.textContent =
      "Add Category";


  document
    .getElementById(
      "categoryForm"
    )
    ?.reset();


  const iconInput =
    document.getElementById(
      "categoryIconInput"
    );

  if (iconInput)
    iconInput.value =
      "ri-price-tag-3-line";


  document
    .getElementById(
      "categoryDetailsView"
    )
    ?.setAttribute(
      "hidden",
      ""
    );


  document
    .getElementById(
      "categoryForm"
    )
    ?.removeAttribute("hidden");


  document
    .getElementById(
      "editCategoryButton"
    )
    ?.setAttribute(
      "hidden",
      ""
    );


  document
    .getElementById(
      "saveCategoryButton"
    )
    ?.removeAttribute("hidden");


  document
    .getElementById(
      "categoryDrawer"
    )
    ?.classList.add("show");

}


// =========================================================
// FILL DETAILS
// =========================================================

function fillCategoryDetails(
  category
){

  const icon =
    document.getElementById(
      "categoryDetailIcon"
    );

  if (icon){

    icon.innerHTML = `
      <i class="${escapeHTML(
        category.icon ||
        "ri-price-tag-3-line"
      )}"></i>
    `;

  }


  setText(
    "categoryDetailName",
    category.name
  );

  setText(
    "categoryDetailSlug",
    `/${category.slug}`
  );

  setText(
    "categoryDetailId",
    category.id
  );

  setText(
    "categoryDetailType",
    capitalize(category.type)
  );

  setText(
    "categoryDetailProducts",
    Number(
      category.products || 0
    ).toLocaleString()
  );

  setText(
    "categoryDetailStatus",
    capitalize(category.status)
  );

  setText(
    "categoryDetailCreated",
    formatCategoryDate(
      category.created
    )
  );

  setText(
    "categoryDetailUpdated",
    formatCategoryDate(
      category.updated
    )
  );

  setText(
    "categoryDetailDescription",
    category.description ||
      "No description provided."
  );

}


// =========================================================
// FILL FORM
// =========================================================

function fillCategoryForm(
  category
){

  const name =
    document.getElementById(
      "categoryNameInput"
    );

  const type =
    document.getElementById(
      "categoryTypeInput"
    );

  const status =
    document.getElementById(
      "categoryStatusInput"
    );

  const description =
    document.getElementById(
      "categoryDescriptionInput"
    );

  const icon =
    document.getElementById(
      "categoryIconInput"
    );


  if (name)
    name.value =
      category.name || "";

  if (type)
    type.value =
      category.type || "physical";

  if (status)
    status.value =
      category.status || "active";

  if (description)
    description.value =
      category.description || "";

  if (icon)
    icon.value =
      category.icon ||
      "ri-price-tag-3-line";

}


// =========================================================
// EDIT MODE
// =========================================================

function switchCategoryEditMode(
  edit
){

  editingCategory =
    edit;


  const details =
    document.getElementById(
      "categoryDetailsView"
    );

  const form =
    document.getElementById(
      "categoryForm"
    );

  const editButton =
    document.getElementById(
      "editCategoryButton"
    );

  const saveButton =
    document.getElementById(
      "saveCategoryButton"
    );


  if (edit){

    details?.setAttribute(
      "hidden",
      ""
    );

    form?.removeAttribute(
      "hidden"
    );

    editButton?.setAttribute(
      "hidden",
      ""
    );

    saveButton?.removeAttribute(
      "hidden"
    );

  } else {

    details?.removeAttribute(
      "hidden"
    );

    form?.setAttribute(
      "hidden",
      ""
    );

    editButton?.removeAttribute(
      "hidden"
    );

    saveButton?.setAttribute(
      "hidden",
      ""
    );

  }

}


// =========================================================
// SAVE CATEGORY
// =========================================================

function saveCategory(){

  const nameInput =
    document.getElementById(
      "categoryNameInput"
    );

  const typeInput =
    document.getElementById(
      "categoryTypeInput"
    );

  const statusInput =
    document.getElementById(
      "categoryStatusInput"
    );

  const descriptionInput =
    document.getElementById(
      "categoryDescriptionInput"
    );

  const iconInput =
    document.getElementById(
      "categoryIconInput"
    );


  const name =
    nameInput?.value.trim();


  if (!name){

    showCategoryMessage(
      "Category name is required."
    );

    nameInput?.focus();

    return;

  }


  const type =
    typeInput?.value ||
    "physical";


  const status =
    statusInput?.value ||
    "active";


  const description =
    descriptionInput?.value.trim() ||
    "";


  const icon =
    iconInput?.value.trim() ||
    "ri-price-tag-3-line";


  const slug =
    createCategorySlug(
      name
    );


  // -----------------------------------------
  // CREATE
  // -----------------------------------------

  if (!selectedCategoryId){

    const newCategory = {

      id:
        createCategoryId(),

      name,

      slug,

      type,

      products:0,

      status,

      icon,

      description,

      created:
        new Date().toISOString(),

      updated:
        new Date().toISOString()

    };


    categories.unshift(
      newCategory
    );


    showCategoryMessage(
      "Category created successfully."
    );

  }


  // -----------------------------------------
  // UPDATE
  // -----------------------------------------

  else {

    const category =
      categories.find(
        item =>
          item.id ===
          selectedCategoryId
      );


    if (!category) return;


    category.name =
      name;

    category.slug =
      slug;

    category.type =
      type;

    category.status =
      status;

    category.icon =
      icon;

    category.description =
      description;

    category.updated =
      new Date().toISOString();


    showCategoryMessage(
      "Category updated successfully."
    );

  }


  closeCategoryDrawer();

  currentCategoryPage =
    1;

  renderCategories();

}


// =========================================================
// DELETE
// =========================================================

function openDeleteConfirmation(
  categoryId
){

  const category =
    categories.find(
      item =>
        item.id === categoryId
    );


  if (!category) return;


  categoryDeleteId =
    categoryId;


  setText(
    "deleteCategoryName",
    category.name
  );


  document
    .getElementById(
      "categoryConfirm"
    )
    ?.classList.add("show");

}


function closeDeleteConfirmation(){

  categoryDeleteId =
    null;


  document
    .getElementById(
      "categoryConfirm"
    )
    ?.classList.remove("show");

}


function deleteCategory(){

  if (!categoryDeleteId)
    return;


  const category =
    categories.find(
      item =>
        item.id ===
        categoryDeleteId
    );


  if (!category) return;


  categories =
    categories.filter(
      item =>
        item.id !==
        categoryDeleteId
    );


  closeDeleteConfirmation();


  showCategoryMessage(
    `"${category.name}" deleted successfully.`
  );


  currentCategoryPage =
    1;


  renderCategories();

}


// =========================================================
// DELETE EVENTS
// =========================================================

document
  .getElementById(
    "cancelCategoryDelete"
  )
  ?.addEventListener(
    "click",
    closeDeleteConfirmation
  );


document
  .getElementById(
    "confirmCategoryDelete"
  )
  ?.addEventListener(
    "click",
    deleteCategory
  );


document
  .getElementById(
    "categoryConfirm"
  )
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target.id ===
        "categoryConfirm"
      ){

        closeDeleteConfirmation();

      }

    }
  );


// =========================================================
// CLOSE DRAWER
// =========================================================

function closeCategoryDrawer(){

  document
    .getElementById(
      "categoryDrawer"
    )
    ?.classList.remove("show");

  selectedCategoryId =
    null;

  editingCategory =
    false;

}


// =========================================================
// REFRESH
// =========================================================

document
  .getElementById(
    "refreshCategories"
  )
  ?.addEventListener(
    "click",
    () => {

      renderCategories();

      showCategoryMessage(
        "Categories refreshed."
      );

    }
  );


// =========================================================
// EXPORT CSV
// =========================================================

document
  .getElementById(
    "exportCategories"
  )
  ?.addEventListener(
    "click",
    exportCategories
  );


function exportCategories(){

  if (!categories.length){

    showCategoryMessage(
      "There are no categories to export."
    );

    return;

  }


  const headers = [
    "ID",
    "Name",
    "Slug",
    "Type",
    "Products",
    "Status",
    "Created",
    "Updated"
  ];


  const rows =
    categories.map(
      category => [

        category.id,

        category.name,

        category.slug,

        category.type,

        category.products,

        category.status,

        category.created,

        category.updated

      ]
    );


  const csv = [

    headers,

    ...rows

  ]

    .map(
      row =>
        row
          .map(
            value =>
              `"${String(value ?? "")
                .replace(/"/g,'""')}"`
          )
          .join(",")
    )

    .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href =
    url;

  link.download =
    "ecodata-categories.csv";


  document.body.appendChild(
    link
  );

  link.click();

  link.remove();


  URL.revokeObjectURL(url);


  showCategoryMessage(
    "Categories exported successfully."
  );

}


// =========================================================
// HELPERS
// =========================================================

function createCategoryId(){

  const number =
    categories.length + 1;

  return `
    CAT-${String(number).padStart(5,"0")}
  `.trim();

}


function createCategorySlug(
  value
){

  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


function formatCategoryDate(
  value
){

  if (!value)
    return "—";


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ){

    return "—";

  }


  return date.toLocaleDateString(
    "en-GB",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  );

}


function capitalize(value){

  if (!value)
    return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


function setText(
  id,
  value
){

  const element =
    document.getElementById(id);

  if (element)
    element.textContent =
      value ?? "—";

}


function escapeHTML(value){

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// =========================================================
// MESSAGE
// =========================================================

let categoryMessageTimer;


function showCategoryMessage(
  message
){

  const snackbar =
    document.getElementById(
      "categoriesMessage"
    );


  if (!snackbar) return;


  const text =
    snackbar.querySelector(
      "span"
    );


  if (text)
    text.textContent =
      message;


  snackbar.classList.add(
    "show"
  );


  clearTimeout(
    categoryMessageTimer
  );


  categoryMessageTimer =
    setTimeout(
      () => {

        snackbar.classList.remove(
          "show"
        );

      },
      2600
    );

}

