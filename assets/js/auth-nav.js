"use strict";
/**
 * Authentication-aware navigation handler
 * Updates navigation elements based on login status
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const isLoggedIn = !!localStorage.getItem('accessToken');
    // Determine if we're in the root directory or pages directory
    const isRootDirectory = window.location.pathname.endsWith('index.html') ||
        !window.location.pathname.includes('/pages/');
    // Find all user icon links - handle both root and pages directory paths
    const userIconLinks = document.querySelectorAll('a[href="login.html"], a[href="profile.html"], ' +
        'a[href="pages/login.html"], a[href="pages/profile.html"]');
    // Update each user icon link
    userIconLinks.forEach((link) => {
        // If logged in, point to profile; otherwise, point to login
        if (isRootDirectory) {
            // In root directory (index.html)
            link.href = isLoggedIn ? 'pages/profile.html' : 'pages/login.html';
        }
        else {
            // In pages directory
            link.href = isLoggedIn ? 'profile.html' : 'login.html';
        }
    });
    // Handle shopping cart link - should go to login if not logged in
    const cartLinks = document.querySelectorAll('.cart-icon');
    cartLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            if (!isLoggedIn) {
                e.preventDefault();
                window.location.href = isRootDirectory ? 'pages/login.html' : 'login.html';
            }
        });
    });
    // Update header UI based on login status
    updateHeaderUI(isLoggedIn);
});
/**
 * Updates the header UI elements based on login status
 * @param isLoggedIn - Whether the user is logged in
 */
function updateHeaderUI(isLoggedIn) {
    // Elements to update based on login status
    const loginButton = document.querySelector('.login-button');
    const profileLink = document.querySelector('.profile-link');
    const cartCount = document.getElementById('cart-count');
    // Update UI elements if they exist
    if (loginButton) {
        loginButton.style.display = isLoggedIn ? 'none' : 'inline-block';
    }
    if (profileLink) {
        profileLink.style.display = isLoggedIn ? 'inline-block' : 'none';
    }
    // Update cart count if logged in
    if (isLoggedIn && cartCount) {
        updateCartCount();
    }
}
/**
 * Fetches and updates the cart count
 */
async function updateCartCount() {
    const token = localStorage.getItem('accessToken');
    if (!token)
        return;
    try {
        const apiBase = "http://localhost:3000";
        const res = await fetch(`${apiBase}/cart`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            const items = await res.json();
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                cartCount.textContent = items.length.toString();
            }
        }
    }
    catch (error) {
        console.error('Error updating cart count:', error);
    }
}
