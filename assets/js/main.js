"use strict";
// Main TypeScript file for general functionalities
// Spinner functionality
document.addEventListener('DOMContentLoaded', () => {
    const spinner = () => {
        setTimeout(() => {
            const spinnerElement = document.getElementById('spinner');
            if (spinnerElement && spinnerElement.classList.contains('show')) {
                spinnerElement.classList.remove('show');
            }
        }, 1);
    };
    spinner();
    // Fixed Navbar
    window.addEventListener('scroll', () => {
        if (window.innerWidth < 992) {
            if (window.scrollY > 55) {
                document.querySelector('.fixed-top')?.classList.add('shadow');
            }
            else {
                document.querySelector('.fixed-top')?.classList.remove('shadow');
            }
        }
        else {
            if (window.scrollY > 55) {
                const fixedTop = document.querySelector('.fixed-top');
                fixedTop?.classList.add('shadow');
                if (fixedTop)
                    fixedTop.style.top = '-5px';
            }
            else {
                const fixedTop = document.querySelector('.fixed-top');
                fixedTop?.classList.remove('shadow');
                if (fixedTop)
                    fixedTop.style.top = '0';
            }
        }
    });
    // Back to top button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            document.querySelector('.back-to-top')?.classList.add('fadeIn');
        }
        else {
            document.querySelector('.back-to-top')?.classList.remove('fadeIn');
        }
    });
    const backToTopButtons = document.querySelectorAll('.back-to-top');
    backToTopButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    // Universal search bar redirect logic for all pages
    document.querySelectorAll('input[type="search"]').forEach(input => {
        input.addEventListener('keydown', (e) => {
            const event = e;
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = event.target.value.trim();
                if (query.length > 0) {
                    // Always use absolute path for redirect
                    if (!window.location.pathname.endsWith('/recipes.html')) {
                        window.location.href = location.origin + "/pages/recipes.html?query=" + encodeURIComponent(query);
                    }
                }
            }
        });
    });
    // Hero search bar button functionality
    const heroSearchBar = document.querySelector('.hero-header input[type="search"]');
    const heroSearchBtn = document.querySelector('.hero-header button[type="submit"]');
    if (heroSearchBar && heroSearchBtn) {
        heroSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const query = heroSearchBar.value.trim();
            if (query.length > 0) {
                window.location.href = location.origin + "/pages/recipes.html?query=" + encodeURIComponent(query);
            }
        });
    }
    // Modal search bar button functionality (works on all pages)
    const modalSearchBtn = document.querySelector('#searchModal .input-group-text');
    const modalSearchInput = document.querySelector('#searchModal input[type="search"]');
    if (modalSearchBtn && modalSearchInput) {
        modalSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const query = modalSearchInput.value.trim();
            if (query.length > 0) {
                window.location.href = location.origin + "/pages/recipes.html?query=" + encodeURIComponent(query);
            }
        });
    }
    // Testimonial carousel
    // If you implement a carousel, replace this placeholder
    // Product Quantity
    const quantityButtons = document.querySelectorAll('.quantity button');
    quantityButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const inputElement = this.parentElement?.parentElement?.querySelector('input');
            if (!inputElement)
                return;
            let oldValue = parseFloat(inputElement.value);
            let newVal;
            if (this.classList.contains('btn-plus')) {
                newVal = parseFloat(oldValue.toString()) + 1;
            }
            else {
                if (oldValue > 0) {
                    newVal = parseFloat(oldValue.toString()) - 1;
                }
                else {
                    newVal = 0;
                }
            }
            inputElement.value = newVal.toString();
        });
    });
});
// --- REMOVE RECIPE CARD LOGIC FROM THIS FILE TO AVOID DUPLICATES ---
// (getRecipeImage, createRecipeCard, capitalize, renderRecipes, fetchAndRenderRecipes)
