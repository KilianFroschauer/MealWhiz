"use strict";
// Track page visits for better navigation history
document.addEventListener('DOMContentLoaded', () => {
    trackPageVisit();
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
