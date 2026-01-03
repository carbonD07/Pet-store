'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // Tab Switching Logic
    const navBtns = document.querySelectorAll('.nav-btn[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and valid target
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Mock Data for Orders
    const mockOrders = [
        {
            id: "#ORD-9921",
            date: "Aug 10, 2023",
            total: "R450.00",
            status: "Processing",
            items: "Premium Dog Food (x2)"
        },
        {
            id: "#ORD-8540",
            date: "July 25, 2023",
            total: "R120.50",
            status: "Delivered",
            items: "Catnip Toy, Salmon Treats"
        },
        {
            id: "#ORD-7723",
            date: "June 12, 2023",
            total: "R890.00",
            status: "Delivered",
            items: "Large Dog Bed"
        }
    ];

    // Render Orders
    const recentOrdersList = document.getElementById('recent-orders-list');
    const allOrdersList = document.getElementById('all-orders-list');

    function renderOrderCard(order, isPreview = false) {
        const statusClass = order.status.toLowerCase();
        return `
            <div class="order-item-card">
                <div class="order-info">
                    <h5>Order ${order.id}</h5>
                    <p class="order-meta">${order.date} • ${order.total}</p>
                    ${!isPreview ? `<p class="order-meta" style="margin-top:5px;">Items: ${order.items}</p>` : ''}
                </div>
                <div class="order-actions" style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                     <span class="order-status ${statusClass}">${order.status}</span>
                     ${!isPreview ? `<button class="btn-primary small" onclick="alert('Added ${order.items} to cart!')">Buy Again</button>` : ''}
                     ${!isPreview ? `<a href="/order-tracker.html?id=${order.id.replace('#', '')}" style="font-size:1.2rem; color:var(--orange-soda); text-decoration:underline;">Track</a>` : ''}
                </div>
            </div>
        `;
    }

    if (recentOrdersList) {
        // Show only first 2 for preview
        recentOrdersList.innerHTML = mockOrders.slice(0, 2).map(o => `<li>${renderOrderCard(o, true)}</li>`).join('');
    }

    if (allOrdersList) {
        allOrdersList.innerHTML = mockOrders.map(o => renderOrderCard(o)).join('');
    }

    // "Buy Again" Logic (Mock)
    window.buyAgain = function (items) {
        alert(`Added ${items} to your cart!`);
        // In real app, this would add items to the cart object and update localStorage
    }

});
