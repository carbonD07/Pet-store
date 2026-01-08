'use strict';

const trackerForm = document.getElementById('tracker-form');
const orderIdInput = document.getElementById('order-id');
const trackerStatus = document.getElementById('tracker-status');
const statusSteps = document.querySelectorAll('.status-step');

// Check for Order ID in URL
const urlParams = new URLSearchParams(window.location.search);
const urlOrderId = urlParams.get('id');

if (urlOrderId) {
    orderIdInput.value = urlOrderId;
    fetchOrder(urlOrderId);
}

trackerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = orderIdInput.value.trim();
    if (orderId) {
        fetchOrder(orderId);
    }
});

function fetchOrder(orderId) {
    fetch(`/api/orders/${orderId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Order not found');
            }
            return response.json();
        })
        .then(order => {
            updateTrackerUI(order);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Order not found. Please check the Order ID and try again.');
            resetTrackerUI();
        });
}

function updateTrackerUI(order) {
    trackerStatus.style.display = 'block';

    // Reset steps
    statusSteps.forEach(step => {
        step.classList.remove('active', 'completed');
    });

    const statusMap = {
        'Placed': 0,
        'Processing': 1,
        'Shipped': 2,
        'Delivered': 3
    };

    const currentStatusIndex = statusMap[order.status];

    if (currentStatusIndex !== undefined) {
        statusSteps.forEach((step, index) => {
            if (index < currentStatusIndex) {
                step.classList.add('completed');
            } else if (index === currentStatusIndex) {
                step.classList.add('active');
            }
        });
    }

    // Update dates
    const dateElements = document.querySelectorAll('.step-date');
    if (dateElements.length > 0) {
        const orderDate = new Date(order.date);

        const options = { year: 'numeric', month: 'short', day: 'numeric' };

        // Placed: Order Date
        dateElements[0].textContent = orderDate.toLocaleDateString('en-US', options);

        // Processing: +1 Day
        const processingDate = new Date(orderDate);
        processingDate.setDate(orderDate.getDate() + 1);
        if (dateElements[1]) dateElements[1].textContent = processingDate.toLocaleDateString('en-US', options);

        // Shipped: +2 Days
        const shippedDate = new Date(orderDate);
        shippedDate.setDate(orderDate.getDate() + 2);
        if (dateElements[2]) dateElements[2].textContent = shippedDate.toLocaleDateString('en-US', options);

        // Delivered: +5 Days
        const deliveredDate = new Date(orderDate);
        deliveredDate.setDate(orderDate.getDate() + 5);
        if (dateElements[3]) dateElements[3].textContent = deliveredDate.toLocaleDateString('en-US', options);
    }
    // Show Map and Driver Details if Shipped or Delivered
    const trackerMap = document.getElementById('tracker-map');
    const deliveryDetails = document.getElementById('delivery-details');
    const mapStatusMsg = document.getElementById('map-status-msg');

    if (trackerMap && deliveryDetails && mapStatusMsg) {
        if (currentStatusIndex >= 2) { // Shipped or Delivered
            trackerMap.style.display = 'block';
            deliveryDetails.style.display = 'block';

            if (currentStatusIndex === 2) {
                mapStatusMsg.textContent = "Your order is on the way!";
            } else {
                mapStatusMsg.textContent = "Your order has been delivered!";
                // Hide vehicle info or update it
                const estimatedArrival = document.getElementById('estimated-arrival');
                if (estimatedArrival) {
                    estimatedArrival.textContent = "Delivered " + (dateElements[3] ? dateElements[3].textContent : '');
                }
            }
        } else {
            trackerMap.style.display = 'none';
            deliveryDetails.style.display = 'none';
        }
    }
}


function resetTrackerUI() {
    trackerStatus.style.display = 'none';
    statusSteps.forEach(step => {
        step.classList.remove('active', 'completed');
    });
    // Hide extra sections
    document.getElementById('tracker-map').style.display = 'none';
    document.getElementById('delivery-details').style.display = 'none';
}
