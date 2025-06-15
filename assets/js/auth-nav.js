"use strict";
/**
 * Authentication-aware navigation handler
 * Updates navigation elements based on login status
 */
var AuthNav;
(function (AuthNav) {
    // Global API base URL with fallback if MealWhizConfig is not defined
    const apiBase = (typeof MealWhizConfig !== 'undefined' ?
        MealWhizConfig.apiBaseURL :
        'https://mealhwiz.at:3000');
    document.addEventListener("DOMContentLoaded", async () => {
        trackPageVisit();
        // Check if user is logged in with a valid token
        const isLoggedIn = await validateToken();
        // Determine if we're in the root directory or pages directory
        const isRootDirectory = window.location.pathname.endsWith("index.html") || !window.location.pathname.includes("/pages/");
        // Find all user icon links - handle both root and pages directory paths
        const userIconLinks = document.querySelectorAll('a[href="login.html"], a[href="profile.html"], ' + 'a[href="pages/login.html"], a[href="pages/profile.html"]');
        // Update each user icon link
        userIconLinks.forEach((link) => {
            link.addEventListener("click", (e) => {
                const href = link.getAttribute('href');
                if (!isLoggedIn && href && href.includes('profile')) {
                    e.preventDefault();
                    // Store profile page as return URL
                    localStorage.setItem('returnUrl', 'profile.html');
                    // Determine the correct login URL path
                    window.location.href = isRootDirectory ? 'pages/login.html' : 'login.html';
                }
            });
        });
        // Handle shopping cart link - should go to login if not logged in
        const cartLinks = document.querySelectorAll(".cart-icon");
        cartLinks.forEach((link) => {
            link.addEventListener("click", (e) => {
                if (!isLoggedIn) {
                    e.preventDefault();
                    localStorage.setItem('returnUrl', 'shopping_cart.html');
                    // Determine the correct login URL path
                    window.location.href = isRootDirectory ? 'pages/login.html' : 'login.html';
                }
            });
        });
        // Update header UI based on login status
        updateHeaderUI(isLoggedIn);
    });
    function trackPageVisit() {
        const currentUrl = window.location.href;
        // Get existing history or initialize new array
        const pageHistory = JSON.parse(localStorage.getItem('pageHistory') || '[]');
        // Only add to history if this is a new page
        if ((pageHistory.length === 0 || pageHistory[pageHistory.length - 1] !== currentUrl) && !currentUrl.includes('login.html') && !currentUrl.includes('register.html')) {
            // Limit history length to prevent localStorage bloat
            if (pageHistory.length >= 10) {
                pageHistory.shift(); // Remove oldest entry
            }
            pageHistory.push(currentUrl);
            localStorage.setItem('pageHistory', JSON.stringify(pageHistory));
        }
    }
    /**
     * Validates the JWT token by checking:
     * 1. If it exists
     * 2. If it's not expired (by making a lightweight API call)
     * @returns Promise resolving to boolean indicating if token is valid
     */
    async function validateToken() {
        const token = localStorage.getItem("accessToken");
        // No token means not logged in
        if (!token) {
            return false;
        }
        // Check if token is valid by making a lightweight API call
        try {
            const response = await fetch(`${apiBase}/validate-token`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // If response is OK, token is valid
            if (response.ok) {
                return true;
            }
            // If unauthorized response, token is expired or invalid
            if (response.status === 401) {
                console.log("Token expired or invalid. Logging out...");
                logout();
                return false;
            }
            // For other errors, assume token might be valid
            return true;
        }
        catch (error) {
            console.error("Error validating token:", error);
            // If network error, assume token is valid (to prevent logout when offline)
            return true;
        }
    }
    /**
     * Logs the user out by removing the token and redirecting
     */
    function logout() {
        localStorage.removeItem("accessToken");
        // If we're on a protected page like profile, redirect to login
        const protectedPages = ["/profile.html", "/shopping_cart.html", "/pages/profile.html", "/pages/shopping_cart.html"];
        const currentPath = window.location.pathname;
        if (protectedPages.some((page) => currentPath.endsWith(page))) {
            const isRootDirectory = !currentPath.includes("/pages/");
            window.location.href = isRootDirectory ? "index.html" : "../index.html";
        }
    }
    AuthNav.logout = logout;
    /**
     * Updates the header UI elements based on login status
     * @param isLoggedIn - Whether the user is logged in
     */
    function updateHeaderUI(isLoggedIn) {
        // Elements to update based on login status
        const loginButton = document.querySelector(".login-button");
        const profileLink = document.querySelector(".profile-link");
        const cartCount = document.getElementById("cart-count");
        // Update UI elements if they exist
        if (loginButton) {
            loginButton.style.display = isLoggedIn ? "none" : "inline-block";
        }
        if (profileLink) {
            profileLink.style.display = isLoggedIn ? "inline-block" : "none";
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
        const token = localStorage.getItem("accessToken");
        if (!token)
            return;
        try {
            const res = await fetch(`${apiBase}/cart`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const items = await res.json();
                const cartCount = document.getElementById("cart-count");
                if (cartCount) {
                    cartCount.textContent = items.length.toString();
                }
            }
            else if (res.status === 401) {
                // Token expired
                logout();
            }
        }
        catch (error) {
            console.error("Error updating cart count:", error);
        }
    }
    AuthNav.updateCartCount = updateCartCount;
})(AuthNav || (AuthNav = {}));
