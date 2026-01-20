document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const productSection = document.getElementById('productSection');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const productTableBody = document.getElementById('productTableBody');
    const logoutBtn = document.getElementById('logoutBtn');
    const editModal = document.getElementById('editModal');
    const closeModal = document.querySelector('.close');
    const editForm = document.getElementById('editForm');
    const variantsContainer = document.getElementById('variantsContainer');

    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user.isAdmin) {
        showDashboard();
    }

    // Login Handler
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.user.isAdmin) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showDashboard();
                } else {
                    alert('Access Denied: You are not an admin.');
                }
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Login failed');
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.reload();
    });

    function showDashboard() {
        loginSection.style.display = 'none';
        productSection.style.display = 'block';
        loadProducts();
    }

    async function loadProducts() {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            renderTable(products);
        } catch (err) {
            alert('Error loading products');
        }
    }

    function renderTable(products) {
        productTableBody.innerHTML = '';
        products.forEach(p => {
            // Base Product Row
            const row = document.createElement('tr');
            row.style.fontWeight = 'bold';
            row.style.backgroundColor = '#f9f9f9';
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>Base</td>
                <td>-</td>
                <td>R ${p.price.toFixed(2)}</td>
                <td>${p.stock}</td>
                <td><button class="btn-edit" onclick="openEditModal(${p.id})">Edit</button></td>
            `;
            productTableBody.appendChild(row);

            // Variant Rows
            if (p.variants && p.variants.length > 0) {
                p.variants.forEach(v => {
                    const vRow = document.createElement('tr');
                    vRow.style.fontSize = '0.9em';
                    vRow.style.color = '#555';
                    vRow.innerHTML = `
                        <td></td>
                        <td style="padding-left: 30px;">↳ Variant</td>
                        <td>Variant</td>
                        <td>${v.size}</td>
                        <td>R ${v.price.toFixed(2)}</td>
                        <td>-</td>
                        <td></td>
                    `;
                    productTableBody.appendChild(vRow);
                });
            }
        });

        // Expose openEditModal to global scope
        window.openEditModal = (id) => {
            const product = products.find(p => p.id === id);
            if (product) openModal(product);
        };
    }

    function openModal(product) {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editName').value = product.name;
        document.getElementById('editPrice').value = product.price;
        document.getElementById('editStock').value = product.stock;

        // Render Variants
        variantsContainer.innerHTML = '';
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach((v, index) => {
                const div = document.createElement('div');
                div.className = 'variant-row';
                div.innerHTML = `
                    <input type="text" value="${v.size}" disabled style="width: 80px;">
                    <input type="number" step="0.01" value="${v.price}" class="variant-price" data-index="${index}" placeholder="Price">
                `;
                variantsContainer.appendChild(div);
            });
        } else {
            variantsContainer.innerHTML = '<p>No variants found.</p>';
        }

        editModal.style.display = 'block';
    }

    // Close Modal
    closeModal.onclick = () => editModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == editModal) editModal.style.display = 'none';
    };

    // Save Changes
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editProductId').value;
        const price = document.getElementById('editPrice').value;
        const stock = document.getElementById('editStock').value;

        // Collect variants data
        const variantInputs = document.querySelectorAll('.variant-price');
        let variants = [];
        // Re-construct variants array based on existing structure + new prices
        // Note: simpler approach is to read product data again or store better state, 
        // but for now we trust the inputs map 1:1 if we didn't add/remove rows.

        // Fetch current product to merge variant sizes correctly
        const resP = await fetch('/api/products');
        const allProducts = await resP.json();
        const product = allProducts.find(p => p.id == id);

        if (product.variants) {
            variants = product.variants.map((v, i) => ({
                ...v,
                price: parseFloat(document.querySelector(`.variant-price[data-index="${i}"]`).value)
            }));
        }

        const updateData = {
            price: parseFloat(price),
            stock: parseInt(stock),
            variants: variants
        };

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                alert('Product updated successfully!');
                editModal.style.display = 'none';
                loadProducts();
            } else {
                const err = await res.json();
                alert(err.error || 'Update failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating product');
        }
    });
});
