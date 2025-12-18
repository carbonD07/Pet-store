'use strict';

const orderSummaryList = document.getElementById('order-summary-list');
const orderTotalElement = document.getElementById('order-total');
const checkoutForm = document.getElementById('checkout-form');
const successModal = document.getElementById('success-modal');

// Card Visual Elements
const cardNumberInput = document.getElementById('card-number');
const cardExpiryInput = document.getElementById('expiry');
const cardCvcInput = document.getElementById('cvc');
const cardHolderInput = document.getElementById('name');

const cardNumberDisplay = document.querySelector('.card-number-display');
const cardHolderDisplay = document.querySelector('.card-holder-display');
const cardExpiryDisplay = document.querySelector('.card-expiry-display');

// Load Cart
let cart = JSON.parse(localStorage.getItem("kitter-cart")) || [];

function loadOrderSummary() {
    orderSummaryList.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        orderSummaryList.innerHTML = "<p>Your cart is empty.</p>";
        orderTotalElement.textContent = "R0.00";
        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;
        const li = document.createElement('li');
        li.classList.add('summary-item');
        li.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <span>R${(item.price * item.quantity).toFixed(2)}</span>
    `;
        orderSummaryList.appendChild(li);
    });

    orderTotalElement.textContent = `R${total.toFixed(2)}`;
}

// Input Formatting & Visual Update
cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = value;
    cardNumberDisplay.textContent = value || '#### #### #### ####';
});

cardHolderInput.addEventListener('input', (e) => {
    cardHolderDisplay.textContent = e.target.value.toUpperCase() || 'FULL NAME';
});

cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
    cardExpiryDisplay.textContent = value || 'MM/YY';
});

// Payment Method Switching
const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
const cardSection = document.getElementById('card-payment-section');
const paypalSection = document.getElementById('paypal-payment-section');
const payButton = document.getElementById('pay-button');

paymentMethods.forEach(method => {
    method.addEventListener('change', (e) => {
        if (e.target.value === 'card') {
            cardSection.style.display = 'block';
            paypalSection.style.display = 'none';
            payButton.textContent = 'Pay Now';
        } else {
            cardSection.style.display = 'none';
            paypalSection.style.display = 'block';
            payButton.textContent = 'Pay with PayPal';
        }
    });
});

// Form Submission
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;

    // Simulate Processing
    const btn = checkoutForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    const orderData = {
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customer: {
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            zip: document.getElementById('zip').value,
            paymentMethod: selectedMethod
        }
    };

    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => response.json())
        .then(order => {
            // Success
            successModal.classList.add('active');
            localStorage.removeItem("kitter-cart");
            btn.textContent = originalText;
            btn.disabled = false;

            // Update Track Button
            const trackBtn = successModal.querySelector('.btn-secondary');
            if (trackBtn) {
                trackBtn.href = `/order-tracker.html?id=${order.id}`;
            }

            // Optional: Display Order ID in modal
            const successTitle = successModal.querySelector('.h2');
            successTitle.insertAdjacentHTML('afterend', `<p style="margin-bottom: 10px;">Order ID: <strong>${order.id}</strong></p>`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an error processing your order. Please try again.');
            btn.textContent = originalText;
            btn.disabled = false;
        });
});

// Initialize
loadOrderSummary();
