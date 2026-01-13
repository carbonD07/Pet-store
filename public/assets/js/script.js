'use strict';

/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}

/**
 * navbar toggle
 */

const navToggler = document.querySelector("[data-nav-toggler]");
const navbar = document.querySelector("[data-navbar]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
}

addEventOnElem(navToggler, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
}

addEventOnElem(navbarLinks, "click", closeNavbar);

/**
 * active header when window scroll down to 100px
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElemOnScroll = function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
}

addEventOnElem(window, "scroll", activeElemOnScroll);

/**
 * CART FUNCTIONALITY
 */

const cartSidebar = document.querySelector("[data-cart-sidebar]");
const cartTogglers = document.querySelectorAll("[data-cart-toggler]");
const cartList = document.querySelector("[data-cart-list]");
const cartTotalElement = document.querySelector("[data-cart-total]");
const cartBadge = document.querySelector("[data-cart-badge]");

let cart = JSON.parse(localStorage.getItem("zolo-cart")) || [];

const toggleCart = function () {
  cartSidebar.classList.toggle("active");
  document.querySelector(".cart-overlay").classList.toggle("active");
}

addEventOnElem(cartTogglers, "click", toggleCart);

const updateCartUI = function () {
  cartList.innerHTML = "";
  let total = 0;
  let totalItems = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
    totalItems += item.quantity;

    const cartItem = document.createElement("li");
    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h3 class="cart-item-title">${item.name}</h3>
        <p class="cart-item-price">R${item.price.toFixed(2)}</p>
        <div class="cart-item-quantity">
          <button class="qty-btn" onclick="decreaseQuantity('${item.id}')">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="increaseQuantity('${item.id}')">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
        <ion-icon name="trash-outline"></ion-icon>
      </button>
    `;
    cartList.appendChild(cartItem);
  });

  cartTotalElement.textContent = `R${total.toFixed(2)}`;
  cartBadge.textContent = totalItems;
  localStorage.setItem("zolo-cart", JSON.stringify(cart));
}

const addToCart = function (product, quantity = 1) {
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity: quantity });
  }

  updateCartUI();
  if (!cartSidebar.classList.contains("active")) {
    toggleCart(); // Open cart when item added
  }
}

// Expose functions to global scope
window.addToCart = addToCart;
window.updateCartUI = updateCartUI;
window.toggleCart = toggleCart;

// Expose removeFromCart to global scope for onclick attribute
window.removeFromCart = function (id) {
  cart = cart.filter(item => item.id != id); // Loose equality to handle string/number mismatch
  updateCartUI();
}

window.increaseQuantity = function (id) {
  const item = cart.find(item => item.id == id); // Loose equality
  if (item) {
    item.quantity++;
    updateCartUI();
  }
}

window.decreaseQuantity = function (id) {
  const item = cart.find(item => item.id == id);
  if (item) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      cart = cart.filter(cartItem => cartItem.id != id);
    }
    updateCartUI();
  }
}

/**
 * HERO SLIDER
 */

const heroSlides = document.querySelectorAll("[data-hero-slide]");
let currentSlidePos = 0;
let lastActiveSlide = heroSlides[0];

const updateSlider = function () {
  lastActiveSlide.classList.remove("active");
  heroSlides[currentSlidePos].classList.add("active");
  lastActiveSlide = heroSlides[currentSlidePos];
}

const slideNext = function () {
  if (currentSlidePos >= heroSlides.length - 1) {
    currentSlidePos = 0;
  } else {
    currentSlidePos++;
  }
  updateSlider();
}

setInterval(slideNext, 7000);

// Initial UI update
updateCartUI();

/**
 * GLOBAL PRODUCTS DATA
 */
let allProducts = [];

const fetchProducts = function () {
  return fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      if (!Array.isArray(products)) {
        console.error('Expected array of products but got:', products);
        return products;
      }
      allProducts = products;
      return products;
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      return [];
    });
}



/**
 * Fetch and Render Products
 */
const productList = document.getElementById('product-list');

// Render Product List to Shop Section
function renderProductList(products) {
  if (!productList) return;

  productList.innerHTML = '';

  if (products.length === 0) {
    productList.innerHTML = '<p class="no-results">No products found matching your criteria.</p>';
    return;
  }

  products.forEach(product => {
    const isOutOfStock = product.stock <= 0;
    const productItem = document.createElement('li');

    productItem.innerHTML = `
      <div class="product-card ${isOutOfStock ? 'oos' : ''}">
        <div class="card-banner img-holder" style="--width: 360; --height: 360;">
          <a href="/product-details.html?id=${product.id}">
            <img src="${product.image}" width="360" height="360" loading="lazy"
              alt="${product.name}" class="img-cover default">
            <img src="${product.imageHover}" width="360" height="360" loading="lazy"
              alt="${product.name}" class="img-cover hover">
          </a>

          ${isOutOfStock ? '<span class="badge-oos">Sold Out</span>' : ''}

          <button class="card-action-btn ${isOutOfStock ? 'btn-disabled' : ''}" aria-label="add to card" title="${isOutOfStock ? 'Out of Stock' : 'Add To Cart'}" ${isOutOfStock ? 'disabled' : ''}>
            <ion-icon name="${isOutOfStock ? 'ban-outline' : 'bag-add-outline'}" aria-hidden="true"></ion-icon>
          </button>
        </div>

        <div class="card-content">
          <div class="wrapper">
            <div class="rating-wrapper ${product.rating === 0 ? 'gray' : ''}">
              ${generateStars(product.rating)}
            </div>
            <span class="span">(${product.reviews})</span>
          </div>

          <h3 class="h3">
            <a href="/product-details.html?id=${product.id}" class="card-title">${product.name}</a>
          </h3>

          <data class="price" value="${product.price}">R${product.price.toFixed(2)}</data>
        </div>
      </div>
    `;

    // Attach event listener to the button
    const addToCartBtn = productItem.querySelector('.card-action-btn');
    if (!isOutOfStock) {
      addToCartBtn.addEventListener('click', function (e) {
        e.preventDefault();
        addToCart(product);
      });
    }

    productList.appendChild(productItem);
  });
}

/**
 * FILTER & SORT FUNCTIONALITY
 */
const categoryFilter = document.getElementById('category-filter');
const priceSort = document.getElementById('price-sort');

const applyFilters = function () {
  let filtered = [...allProducts];

  // Category Filter
  if (categoryFilter) {
    const category = categoryFilter.value;
    if (category !== 'all') {
      filtered = filtered.filter(product =>
        product.category && product.category.toLowerCase() === category.toLowerCase()
      );
    }
  }

  // Sort
  if (priceSort) {
    const sortValue = priceSort.value;
    if (sortValue === 'low-high') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'high-low') {
      filtered.sort((a, b) => b.price - a.price);
    }
  }

  renderProductList(filtered);
}

if (categoryFilter) {
  categoryFilter.addEventListener('change', applyFilters);
}

if (priceSort) {
  priceSort.addEventListener('change', applyFilters);
}

// Initial product fetch
// Initial product fetch
if (productList) {
  fetchProducts().then(products => {
    if (products.error) {
      productList.innerHTML = `<p class="no-results">${products.error}</p>`;
      return;
    }
    if (products) renderProductList(products);
  });
}

function generateStars(rating) {
  let starsHtml = '';
  for (let i = 0; i < 5; i++) {
    if (i < rating) {
      starsHtml += '<ion-icon name="star" aria-hidden="true"></ion-icon>';
    } else {
      starsHtml += '<ion-icon name="star" aria-hidden="true" class="gray"></ion-icon>';
    }
  }
  return starsHtml;
}



/**
 * SEARCH FUNCTIONALITY
 */

const searchTogglers = document.querySelectorAll("[data-search-toggler]");
const searchModal = document.querySelector("[data-search-modal]");
const searchInput = document.querySelector("[data-search-input]");
const searchResultsContainer = document.querySelector("[data-search-results]");
const searchInitialState = document.querySelector("[data-search-initial]");

// Toggle Search Modal
const toggleSearch = function () {
  searchModal.classList.toggle("active");
  document.body.classList.toggle("active"); // Prevent scrolling when modal is open

  if (searchModal.classList.contains("active")) {
    searchInput.focus();
    // Fetch products if not already fetched
    if (allProducts.length === 0) {
      fetchAllProducts();
    }
  }
}

addEventOnElem(searchTogglers, "click", toggleSearch);

// Fetch all products for search
const fetchAllProducts = function () {
  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      allProducts = products;
    })
    .catch(error => console.error('Error fetching products for search:', error));
}

// Filter and Display Search Results
const filterProducts = function (query) {
  if (!query) {
    searchResultsContainer.innerHTML = '';
    searchResultsContainer.appendChild(searchInitialState);
    searchInitialState.style.display = 'block';
    return;
  }

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(query.toLowerCase())) ||
    (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
  );

  renderSearchResults(filteredProducts);
}

// Render Search Results
const renderSearchResults = function (products) {
  searchResultsContainer.innerHTML = '';

  if (products.length === 0) {
    const noResults = document.createElement('p');
    noResults.classList.add('no-results');
    noResults.textContent = 'No products found';
    searchResultsContainer.appendChild(noResults);
    return;
  }

  products.forEach(product => {
    const searchItem = document.createElement('a');
    searchItem.href = `/product-details.html?id=${product.id}`;
    searchItem.classList.add('search-item');
    searchItem.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="search-item-image">
      <div class="search-item-info">
        <h4 class="search-item-title">${product.name}</h4>
        <p class="search-item-price">R${product.price.toFixed(2)}</p>
      </div>
    `;
    // Close modal on click
    searchItem.addEventListener('click', toggleSearch);
    searchResultsContainer.appendChild(searchItem);
  });
}

// Event Listener for Input
if (searchInput) {
  searchInput.addEventListener('input', function (e) {
    filterProducts(e.target.value.trim());
  });
}

// Redirect User Icon to Account Page (for demo purposes)
document.addEventListener('DOMContentLoaded', () => {
  const userBtn = document.querySelector('.action-btn.user');
  if (userBtn) {
    userBtn.href = '/account.html';
  }
});