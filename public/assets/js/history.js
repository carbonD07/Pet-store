document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('order-history-body');
    const loadingMsg = document.getElementById('loading-msg');
    const noOrdersMsg = document.getElementById('no-orders-msg');

    // Check Authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html?redirect=history.html';
        return;
    }

    try {
        const response = await fetch('/api/orders/history', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('token');
                window.location.href = '/login.html?redirect=history.html';
                return;
            }
            throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();
        loadingMsg.style.display = 'none';

        if (orders.length === 0) {
            noOrdersMsg.style.display = 'block';
            return;
        }

        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const total = `R${order.total.toFixed(2)}`;
            const statusClass = `status-${order.status.toLowerCase()}`;

            // Format items list
            const itemsList = order.items.map(item =>
                `<div>${item.quantity}x ${item.name}</div>`
            ).join('');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td style="font-family: monospace;">#${order._id.slice(-6)}</td>
                <td>${itemsList}</td>
                <td>${total}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        loadingMsg.textContent = 'Error loading your orders. Please try again later.';
    }
});
