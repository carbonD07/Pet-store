'use strict';

/**
 * Fetch and Render Dog Food Products with Filtering
 */
const dogFoodList = document.getElementById('dog-food-list');
const filterButtons = document.querySelectorAll('.filter-btn');

let allProducts = [];

if (dogFoodList) {
  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      // Store all relevant products (Dog Food and Brit Premium)
      allProducts = products.filter(product => product.category === 'Dog Food' || product.category === 'Brit Premium');

      // Initial Render (All)
      renderProducts(allProducts);

      // Event Listeners for Filters
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove active class from all buttons
          filterButtons.forEach(b => b.classList.remove('active'));
          // Add active class to clicked button
          btn.classList.add('active');

          const filter = btn.getAttribute('data-filter');
          let filteredProducts = [];

          if (filter === 'all') {
            filteredProducts = allProducts;
          } else if (filter === 'emperor') {
            filteredProducts = allProducts.filter(p => p.category === 'Dog Food');
          } else if (filter === 'brit-premium') {
            filteredProducts = allProducts.filter(p => p.category === 'Brit Premium');
          }

          renderProducts(filteredProducts);
        });
      });

    })
    .catch(error => console.error('Error fetching products:', error));
}

function renderProducts(products) {
  dogFoodList.innerHTML = '';

  if (products.length === 0) {
    dogFoodList.innerHTML = '<p>No products found.</p>';
    return;
  }

  products.forEach(product => {
    const productItem = document.createElement('li');
    const uniqueId = `product-${product.id}`;
    const subscribePrice = (product.price * 0.95).toFixed(2);

    const frequencies = [
      "Every week", "Every 2 weeks", "Every 3 weeks",
      "Every 4 weeks", "Every 5 weeks", "Every 6 weeks",
      "Every month", "Every 2 months", "Every 3 months"
    ];

    const frequencyOptions = frequencies.map(freq =>
      `<option value="${freq}">${freq} for R${subscribePrice} (5% off)</option>`
    ).join('');

    // Calculate date values
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 14); // 2 weeks from today
    const defaultDateStr = defaultDate.toISOString().split('T')[0];

    productItem.innerHTML = `
      <div class="product-card">
        <div class="card-banner img-holder" style="--width: 360; --height: 360;">
          <a href="/product-details.html?id=${product.id}">
            <img src="${product.image}" width="360" height="360" loading="lazy"
              alt="${product.name}" class="img-cover default">
            <img src="${product.imageHover}" width="360" height="360" loading="lazy"
              alt="${product.name}" class="img-cover hover">
          </a>

          <button class="card-action-btn" aria-label="add to card" title="Add To Card">
            <ion-icon name="bag-add-outline" aria-hidden="true"></ion-icon>
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

          <div class="subscription-options">
            <label class="sub-option">
              <input type="radio" name="purchase-type-${uniqueId}" value="one-time" checked>
              One-time purchase
            </label>
            <label class="sub-option">
              <input type="radio" name="purchase-type-${uniqueId}" value="subscribe">
              Subscribe & Save 5%
              <select class="frequency-select" name="frequency-${uniqueId}" style="display: none;">
                ${frequencyOptions}
              </select>
              <input type="date" class="start-date-picker" name="start-date-${uniqueId}" 
                     min="${minDate}" value="${defaultDateStr}" 
                     style="display: none; margin-top: 5px;">
            </label>
          </div>

          <div class="price-box">
            <data class="price" value="${product.price}">R${product.price.toFixed(2)}</data>
            <del class="del" style="display: none;">R${product.price.toFixed(2)}</del>
          </div>
          
          <div class="estimated-cost" style="display: none;">
            <span class="estimated-label">Estimated cost:</span>
            <span class="estimated-value"></span>
          </div>

          <button class="card-action-btn" aria-label="add to cart" title="Add to Cart">
            <ion-icon name="bag-add-outline" aria-hidden="true"></ion-icon>
          </button>
        </div>
      </div>
    `;

    // Attach event listener to the button
    const addToCartBtn = productItem.querySelector('.card-action-btn');
    addToCartBtn.addEventListener('click', function (e) {
      e.preventDefault();

      const selectedOption = productItem.querySelector(`input[name="purchase-type-${uniqueId}"]:checked`).value;
      let finalPrice = product.price;
      let finalName = product.name;
      let finalId = product.id;

      if (selectedOption === 'subscribe') {
        finalPrice = parseFloat(subscribePrice);
        const frequency = productItem.querySelector(`select[name="frequency-${uniqueId}"]`).value;
        const startDate = productItem.querySelector(`input[name="start-date-${uniqueId}"]`).value;

        if (!startDate) {
          alert("Please select a start date for your subscription.");
          return;
        }

        finalName = `${product.name} (Subscribed - ${frequency}, Starts: ${startDate})`;
        finalId = `${product.id}-sub-${frequency.replace(/\s+/g, '-').toLowerCase()}-${startDate}`;
      }

      const productToAdd = {
        ...product,
        id: finalId,
        price: finalPrice,
        name: finalName
      };

      addToCartLocal(productToAdd);
    });

    // Price Toggle Logic
    const radios = productItem.querySelectorAll(`input[name="purchase-type-${uniqueId}"]`);
    const priceElement = productItem.querySelector('.price');
    const delElement = productItem.querySelector('.del');
    const frequencySelect = productItem.querySelector(`select[name="frequency-${uniqueId}"]`);
    const datePicker = productItem.querySelector(`input[name="start-date-${uniqueId}"]`);
    const estimatedCostDiv = productItem.querySelector('.estimated-cost');
    const estimatedValueSpan = productItem.querySelector('.estimated-value');

    // Function to calculate estimated monthly cost based on frequency
    function calculateEstimatedCost(frequency, pricePerDelivery) {
      const frequencyWeeks = {
        "Every week": 1,
        "Every 2 weeks": 2,
        "Every 3 weeks": 3,
        "Every 4 weeks": 4,
        "Every 5 weeks": 5,
        "Every 6 weeks": 6,
        "Every month": 4.33, // ~4.33 weeks per month
        "Every 2 months": 8.67,
        "Every 3 months": 13
      };

      const weeks = frequencyWeeks[frequency] || 4;
      const deliveriesPerMonth = 4.33 / weeks; // 4.33 weeks per month average
      const monthlyCost = pricePerDelivery * deliveriesPerMonth;
      const yearlyCost = monthlyCost * 12;

      return {
        monthly: monthlyCost.toFixed(2),
        yearly: yearlyCost.toFixed(2),
        deliveriesPerMonth: deliveriesPerMonth.toFixed(1)
      };
    }

    // Function to update the estimated cost display
    function updateEstimatedCost() {
      const frequency = frequencySelect.value;
      const estimate = calculateEstimatedCost(frequency, parseFloat(subscribePrice));
      estimatedValueSpan.innerHTML = `<strong>R${estimate.monthly}/month</strong> (R${estimate.yearly}/year)`;
    }

    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'subscribe') {
          priceElement.textContent = `R${subscribePrice}`;
          delElement.textContent = `R${product.price.toFixed(2)}`;
          delElement.style.display = 'inline';
          frequencySelect.style.display = 'block';
          datePicker.style.display = 'block';
          estimatedCostDiv.style.display = 'block';
          updateEstimatedCost();
        } else {
          priceElement.textContent = `R${product.price.toFixed(2)}`;
          delElement.style.display = 'none';
          frequencySelect.style.display = 'none';
          datePicker.style.display = 'none';
          estimatedCostDiv.style.display = 'none';
        }
      });
    });

    // Update estimate when frequency changes
    frequencySelect.addEventListener('change', updateEstimatedCost);

    dogFoodList.appendChild(productItem);
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

// Duplicated Cart Logic for Dog Food Page
function addToCartLocal(product) {
  if (window.addToCart) {
    window.addToCart(product);
  } else {
    console.error("addToCart function not found in window scope.");
  }
}
