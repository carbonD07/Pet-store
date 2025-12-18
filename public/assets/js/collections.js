'use strict';

/**
 * Fetch and Render Collection Products
 */
const collectionList = document.getElementById('collection-list');

if (collectionList) {
  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      // Filter for "Treats"
      const treats = products.filter(product => product.category === 'Treats');

      if (treats.length === 0) {
        collectionList.innerHTML = '<p>No treats found.</p>';
        return;
      }

      treats.forEach(product => {
        const productItem = document.createElement('li');
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

              <data class="card-price" value="${product.price}">R${product.price.toFixed(2)}</data>
            </div>
          </div>
        `;

        // Attach event listener to the button
        const addToCartBtn = productItem.querySelector('.card-action-btn');
        addToCartBtn.addEventListener('click', function (e) {
          e.preventDefault();
          // Assuming addToCart is available globally from script.js or we need to import it
          // Since script.js is loaded, we might need to expose addToCart or duplicate logic.
          // For now, let's check if addToCart is global. 
          // If not, we'll need to duplicate or refactor. 
          // Based on previous steps, addToCart was NOT explicitly attached to window, 
          // but I can try to access it or dispatch an event.
          // Actually, looking at script.js, addToCart is local. 
          // I should probably refactor script.js to expose it or just copy the logic for now to be safe.

          // Better approach: Use the same logic as script.js
          addToCartLocal(product);
        });

        collectionList.appendChild(productItem);
      });
    })
    .catch(error => console.error('Error fetching products:', error));
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

// Duplicated Cart Logic for Collections Page (since script.js might not expose it)
// In a real app, this should be in a shared module.
function addToCartLocal(product) {
  if (window.addToCart) {
    window.addToCart(product);
  } else {
    console.error("addToCart function not found in window scope.");
  }
}
