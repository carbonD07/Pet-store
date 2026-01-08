'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const productDetailsContainer = document.getElementById('product-details-container');

  // Helper to get query param
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  const productId = parseInt(getQueryParam('id'));

  if (productId) {
    fetch('/api/products')
      .then(response => response.json())
      .then(products => {
        if (!Array.isArray(products)) {
          console.error('Expected array of products but got:', products);
          productDetailsContainer.innerHTML = '<p>Error loading product details. Please try again later.</p>';
          return;
        }

        const product = products.find(p => p.id === productId);

        if (product) {
          renderProductDetails(product);
          renderRelatedProducts(product, products);
        } else {
          productDetailsContainer.innerHTML = '<p>Product not found.</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        productDetailsContainer.innerHTML = '<p>Error loading product details.</p>';
      });
  } else {
    if (productDetailsContainer) {
      productDetailsContainer.innerHTML = '<p>No product selected.</p>';
    }
  }
});

function renderProductDetails(product) {
  // Build benefits section if available
  let benefitsHtml = '';
  if (product.benefits && product.benefits.length > 0) {
    benefitsHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="heart-outline"></ion-icon>
            Key Benefits
          </h2>
          <div class="benefits-list">
            ${product.benefits.map(benefit => `
              <div class="benefit-item">
                <div class="benefit-title">${benefit.title}</div>
                <div class="benefit-description">${benefit.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
  }

  // Build ingredients section if available
  let ingredientsHtml = '';
  if (product.ingredients && product.ingredients.length > 0) {
    ingredientsHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="nutrition-outline"></ion-icon>
            Ingredients
          </h2>
          <div class="ingredients-list">
            ${product.ingredients.map(ingredient => `
              <div class="ingredient-item">${ingredient}</div>
            `).join('')}
          </div>
        </div>
      `;
  }

  // Build nutritional info section if available
  let nutritionalHtml = '';
  if (product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0) {
    nutritionalHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="bar-chart-outline"></ion-icon>
            Nutritional Information (per kg)
          </h2>
          <table class="nutritional-table">
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(product.nutritionalInfo).map(([key, value]) => `
                <tr>
                  <td>${key}</td>
                  <td>${value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
  }

  // Build features section if available
  let featuresHtml = '';
  if (product.features && product.features.length > 0) {
    featuresHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            Additional Features
          </h2>
          <div class="features-list">
            ${product.features.map(feature => `
              <div class="feature-badge">
                <ion-icon name="checkmark-outline"></ion-icon>
                ${feature}
              </div>
            `).join('')}
          </div>
        </div>
      `;
  }

  // Build additives section if available (vitamins and minerals)
  let additivesHtml = '';
  if (product.additives && Object.keys(product.additives).length > 0) {
    additivesHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="flask-outline"></ion-icon>
            Vitamins & Minerals
          </h2>
          <table class="nutritional-table">
            <thead>
              <tr>
                <th>Additive</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(product.additives).map(([key, value]) => `
                <tr>
                  <td>${key}</td>
                  <td>${value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
  }

  // Build antioxidants section if available
  let antioxidantsHtml = '';
  if (product.antioxidants && product.antioxidants.length > 0) {
    antioxidantsHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="leaf-outline"></ion-icon>
            Natural Antioxidants
          </h2>
          <div class="features-list">
            ${product.antioxidants.map(antioxidant => `
              <div class="feature-badge">
                <ion-icon name="leaf-outline"></ion-icon>
                ${antioxidant}
              </div>
            `).join('')}
          </div>
        </div>
      `;
  }

  // Build metabolizable energy section if available
  let energyHtml = '';
  if (product.metabolizableEnergy) {
    energyHtml = `
        <div class="product-section">
          <h2 class="section-heading">
            <ion-icon name="flash-outline"></ion-icon>
            Energy Content
          </h2>
          <div class="energy-content" style="font-size: 1.2rem; font-weight: bold; color: var(--portland-orange);">
            ${product.metabolizableEnergy}
          </div>
          <p style="color: var(--davys-gray); font-size: 0.9rem; margin-top: 5px;">Metabolizable Energy</p>
        </div>
      `;
  }

  // Variant Logic (Size Selector)
  let variantsHtml = '';
  let hasVariants = product.variants && product.variants.length > 0;
  if (hasVariants) {
    variantsHtml = `
      <div class="variant-wrapper" style="margin-bottom: 20px;">
        <span class="quantity-label" style="display:block; margin-bottom:10px;">Select Size:</span>
        <select id="variant-select" style="width: 100%; padding: 10px; border: 1px solid var(--gainsboro); border-radius: 5px; font-size: var(--fs-6);">
          ${product.variants.map((v, index) => `
            <option value="${index}" data-price="${v.price}">${v.size} - R${v.price.toFixed(2)}</option>
          `).join('')}
        </select>
      </div>
    `;
  }

  // Subscription Logic for specific products (8, 9, 10)
  let subscriptionHtml = '';
  const eligibleForSubscription = [8, 9, 10].includes(product.id);
  const uniqueId = `product-${product.id}`;
  const subscribePrice = (product.price * 0.95).toFixed(2);

  if (eligibleForSubscription) {
    const frequencies = [
      "Every week", "Every 2 weeks", "Every 3 weeks",
      "Every 4 weeks", "Every 5 weeks", "Every 6 weeks",
      "Every month", "Every 2 months", "Every 3 months"
    ];

    const frequencyOptions = frequencies.map(freq =>
      `<option value="${freq}">${freq} for R${subscribePrice} (5% off)</option>`
    ).join('');

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 14);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];

    subscriptionHtml = `
            <div class="subscription-options" style="margin-bottom: 20px; padding: 15px; border: 1px solid var(--gainsboro); border-radius: 8px;">
                <label class="sub-option" style="display: block; margin-bottom: 10px; cursor: pointer;">
                    <input type="radio" name="purchase-type-${uniqueId}" value="one-time" checked style="margin-right: 8px;">
                    <span style="font-weight: var(--fw-700);">One-time purchase</span>
                </label>
                <label class="sub-option" style="display: block; cursor: pointer;">
                    <input type="radio" name="purchase-type-${uniqueId}" value="subscribe" style="margin-right: 8px;">
                    <span style="font-weight: var(--fw-700);">Subscribe & Save 5%</span>
                    <div id="sub-details-${uniqueId}" style="display: none; margin-top: 10px; padding-left: 25px;">
                        <select class="frequency-select" name="frequency-${uniqueId}" style="display: block; width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--gainsboro); border-radius: 4px;">
                            ${frequencyOptions}
                        </select>
                        <input type="date" class="start-date-picker" name="start-date-${uniqueId}" 
                               min="${minDate}" value="${defaultDateStr}" 
                               style="display: block; width: 100%; padding: 8px; border: 1px solid var(--gainsboro); border-radius: 4px;">
                        <div class="estimated-cost" style="margin-top: 8px; font-size: var(--fs-7); color: var(--davys-gray);">
                             <span class="estimated-value"></span>
                        </div>
                    </div>
                </label>
            </div>
        `;
  }

  productDetailsContainer.innerHTML = `
    <div class="product-image-wrapper">
      <img src="${product.image}" alt="${product.name}" class="product-image" id="main-image">
    </div>
    
    <div class="product-info">
      <h1 class="product-title">${product.name}</h1>
      <p class="product-price" id="main-price">
        R${product.price.toFixed(2)}
        ${product.stock <= 0 ? '<span class="badge-oos" style="position:static; margin-left:10px; font-size: 0.5em; vertical-align: middle;">Sold Out</span>' : ''}
      </p>
      
      <div class="rating-wrapper" style="margin-bottom: 20px; color: var(--portland-orange);">
        ${generateStars(product.rating)}
        <span style="color: var(--davys-gray); margin-left: 5px;">(${product.reviews} reviews)</span>
      </div>
      
      <p class="product-description">
        ${product.description || 'No description available for this product.'}
      </p>

      ${variantsHtml}
      ${subscriptionHtml}
      
      <div class="quantity-wrapper">
        <span class="quantity-label">Quantity:</span>
        <div class="quantity-control">
          <button class="qty-btn-large" id="decrease-qty">-</button>
          <input type="text" class="qty-input" id="qty-input" value="1" readonly>
          <button class="qty-btn-large" id="increase-qty">+</button>
        </div>
      </div>
      
      <button class="add-to-cart-btn ${product.stock <= 0 ? 'btn-disabled' : ''}" id="add-to-cart-detail" ${product.stock <= 0 ? 'disabled' : ''}>
        ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
      
      ${benefitsHtml}
      ${ingredientsHtml}
      ${nutritionalHtml}
      ${additivesHtml}
      ${antioxidantsHtml}
      ${energyHtml}
      ${featuresHtml}
    </div>
  `;

  // Quantity Logic
  const decreaseBtn = document.getElementById('decrease-qty');
  const increaseBtn = document.getElementById('increase-qty');
  const qtyInput = document.getElementById('qty-input');
  const addToCartBtn = document.getElementById('add-to-cart-detail');
  const priceElement = document.getElementById('main-price');

  decreaseBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value);
    if (val > 1) {
      qtyInput.value = val - 1;
    }
  });

  increaseBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value);
    qtyInput.value = val + 1;
  });

  // Variant Selection Logic
  let currentPrice = product.price;
  let currentVariant = null;

  if (hasVariants) {
    const variantSelect = document.getElementById('variant-select');

    // Set initial variant
    currentVariant = product.variants[0];
    currentPrice = currentVariant.price;
    priceElement.textContent = `R${currentPrice.toFixed(2)}`;

    variantSelect.addEventListener('change', (e) => {
      const index = e.target.value;
      currentVariant = product.variants[index];
      currentPrice = currentVariant.price;
      priceElement.textContent = `R${currentPrice.toFixed(2)}`;
    });
  }

  // Subscription Logic Event Listeners
  if (eligibleForSubscription) {
    const radios = document.querySelectorAll(`input[name="purchase-type-${uniqueId}"]`);
    const subDetails = document.getElementById(`sub-details-${uniqueId}`);
    const frequencySelect = document.querySelector(`select[name="frequency-${uniqueId}"]`);
    const estimatedValueSpan = document.querySelector('.estimated-value');

    function calculateEstimatedCost(frequency, pricePerDelivery) {
      const frequencyWeeks = {
        "Every week": 1,
        "Every 2 weeks": 2,
        "Every 3 weeks": 3,
        "Every 4 weeks": 4,
        "Every 5 weeks": 5,
        "Every 6 weeks": 6,
        "Every month": 4.33,
        "Every 2 months": 8.67,
        "Every 3 months": 13
      };

      const weeks = frequencyWeeks[frequency] || 4;
      const deliveriesPerMonth = 4.33 / weeks;
      const monthlyCost = pricePerDelivery * deliveriesPerMonth;
      const yearlyCost = monthlyCost * 12;

      return {
        monthly: monthlyCost.toFixed(2),
        yearly: yearlyCost.toFixed(2)
      };
    }

    function updateEstimatedCost() {
      const frequency = frequencySelect.value;
      const estimate = calculateEstimatedCost(frequency, parseFloat(subscribePrice));
      estimatedValueSpan.innerHTML = `<strong>R${estimate.monthly}/month</strong> (R${estimate.yearly}/year)`;
    }

    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'subscribe') {
          priceElement.innerHTML = `R${subscribePrice} <span style="text-decoration: line-through; color: var(--davys-gray); font-size: 0.8em; margin-left: 10px;">R${product.price.toFixed(2)}</span>`;
          subDetails.style.display = 'block';
          updateEstimatedCost();
        } else {
          priceElement.textContent = `R${product.price.toFixed(2)}`;
          subDetails.style.display = 'none';
        }
      });
    });

    frequencySelect.addEventListener('change', updateEstimatedCost);
  }

  addToCartBtn.addEventListener('click', () => {
    const quantity = parseInt(qtyInput.value);
    let finalProduct = { ...product };

    // Apply variant selection
    if (hasVariants && currentVariant) {
      finalProduct.price = currentVariant.price;
      finalProduct.name = `${product.name} (${currentVariant.size})`;
      // Create a unique ID for the cart based on variant
      finalProduct.id = `${product.id}-${currentVariant.size.replace(/\s+/g, '').toLowerCase()}`;
    }

    if (eligibleForSubscription) {
      const selectedOption = document.querySelector(`input[name="purchase-type-${uniqueId}"]:checked`).value;
      if (selectedOption === 'subscribe') {
        const frequency = document.querySelector(`select[name="frequency-${uniqueId}"]`).value;
        const startDate = document.querySelector(`input[name="start-date-${uniqueId}"]`).value;

        if (!startDate) {
          alert("Please select a start date for your subscription.");
          return;
        }

        finalProduct.price = parseFloat(subscribePrice);
        finalProduct.name = `${product.name} (Subscribed - ${frequency}, Starts: ${startDate})`;
        finalProduct.id = `${product.id}-sub-${frequency.replace(/\s+/g, '-').toLowerCase()}-${startDate}`;
      }
    }

    if (window.addToCart) {
      window.addToCart(finalProduct, quantity);
      // Optional: Show feedback
      addToCartBtn.textContent = "Added!";
      setTimeout(() => addToCartBtn.textContent = "Add to Cart", 1000);
    } else {
      console.error("addToCart function not found");
    }
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
 * IMAGE ZOOM FUNCTIONALITY
 */
const imageWrapper = document.querySelector('.product-image-wrapper');
const mainImage = document.getElementById('main-image');

if (imageWrapper && mainImage) {
  imageWrapper.addEventListener('mousemove', function (e) {
    const { left, top, width, height } = imageWrapper.getBoundingClientRect();
    const x = (e.clientX - left) / width * 100;
    const y = (e.clientY - top) / height * 100;

    mainImage.style.transformOrigin = `${x}% ${y}%`;
  });

  imageWrapper.addEventListener('mouseleave', function () {
    mainImage.style.transformOrigin = 'center center';
    mainImage.style.transform = 'scale(1)';
  });

  imageWrapper.addEventListener('mouseenter', function () {
    mainImage.style.transform = 'scale(2)';
  });
}

/**
 * RELATED PRODUCTS
 */
function renderRelatedProducts(currentProduct, allProducts) {
  const relatedContainer = document.getElementById('related-products');
  const relatedList = document.getElementById('related-product-list');

  if (!relatedContainer || !relatedList) return;

  // Filter products: Same category, not the current product
  const related = allProducts.filter(p =>
    p.category &&
    currentProduct.category &&
    p.category.toLowerCase() === currentProduct.category.toLowerCase() &&
    p.id !== currentProduct.id
  ).slice(0, 4); // Limit to 4

  if (related.length === 0) return;

  relatedContainer.style.display = 'block';
  relatedList.innerHTML = '';

  related.forEach(product => {
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
              <ion-icon name="star" aria-hidden="true"></ion-icon>
              <ion-icon name="star" aria-hidden="true"></ion-icon>
              <ion-icon name="star" aria-hidden="true"></ion-icon>
              <ion-icon name="star" aria-hidden="true"></ion-icon>
              <ion-icon name="star" aria-hidden="true"></ion-icon>
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
        // Check if window.addToCart is available
        if (window.addToCart) {
          window.addToCart(product);
        }
      });
    }

    relatedList.appendChild(productItem);
  });
}

