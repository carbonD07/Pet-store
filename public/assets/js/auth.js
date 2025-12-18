'use strict';

/**
 * Auth Module - Handles login, registration, and session management
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

// Show message (error or success)
function showMessage(message, type = 'error') {
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
    }
}

// Clear message
function clearMessage() {
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.className = 'auth-message';
        messageEl.textContent = '';
    }
}

// Set loading state on button
function setLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

// Save user to localStorage
function saveUser(user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('kitter_user', JSON.stringify(user));
}

// Get current user from storage
function getCurrentUser() {
    const localUser = localStorage.getItem('kitter_user');
    const sessionUser = sessionStorage.getItem('kitter_user');

    if (localUser) {
        try { return JSON.parse(localUser); } catch (e) { return null; }
    }
    if (sessionUser) {
        try { return JSON.parse(sessionUser); } catch (e) { return null; }
    }
    return null;
}

// Logout user
function logoutUser() {
    localStorage.removeItem('kitter_user');
    sessionStorage.removeItem('kitter_user');
    window.location.href = '/login.html';
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Expose to global scope
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;
window.isLoggedIn = isLoggedIn;

// ============================================
// LOGIN FORM HANDLER
// ============================================

const loginForm = document.getElementById('login-form');
if (loginForm) {
    // Check if already logged in
    if (isLoggedIn()) {
        window.location.href = '/';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        const submitBtn = document.getElementById('login-btn');

        // Basic validation
        if (!email || !password) {
            showMessage('Please fill in all fields');
            return;
        }

        setLoading(submitBtn, true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.error || 'Login failed');
                setLoading(submitBtn, false);
                return;
            }

            // Save user and redirect
            saveUser(data.user, remember);
            showMessage('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (err) {
            console.error('Login error:', err);
            showMessage('Something went wrong. Please try again.');
            setLoading(submitBtn, false);
        }
    });
}

// ============================================
// REGISTRATION FORM HANDLER
// ============================================

const registerForm = document.getElementById('register-form');
if (registerForm) {
    // Check if already logged in
    if (isLoggedIn()) {
        window.location.href = '/';
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        const submitBtn = document.getElementById('register-btn');

        // Validation
        if (!firstName || !lastName || !email || !password) {
            showMessage('Please fill in all required fields');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match');
            return;
        }

        if (!terms) {
            showMessage('Please agree to the Terms of Service');
            return;
        }

        setLoading(submitBtn, true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, phone, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.error || 'Registration failed');
                setLoading(submitBtn, false);
                return;
            }

            // Save user and redirect
            saveUser(data.user, false);
            showMessage('Account created successfully! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

        } catch (err) {
            console.error('Registration error:', err);
            showMessage('Something went wrong. Please try again.');
            setLoading(submitBtn, false);
        }
    });
}

// ============================================
// PASSWORD VISIBILITY TOGGLE
// ============================================

const togglePassword = document.getElementById('toggle-password');
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const icon = togglePassword.querySelector('ion-icon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.setAttribute('name', 'eye-off-outline');
        } else {
            passwordInput.type = 'password';
            icon.setAttribute('name', 'eye-outline');
        }
    });
}

const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
        const confirmInput = document.getElementById('confirmPassword');
        const icon = toggleConfirmPassword.querySelector('ion-icon');

        if (confirmInput.type === 'password') {
            confirmInput.type = 'text';
            icon.setAttribute('name', 'eye-off-outline');
        } else {
            confirmInput.type = 'password';
            icon.setAttribute('name', 'eye-outline');
        }
    });
}
