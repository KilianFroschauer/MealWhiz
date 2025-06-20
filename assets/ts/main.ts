// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\main.ts
// Main TypeScript file for general functionalities across the website.
// This includes UI enhancements like a loading spinner, fixed navbar behavior,
// a "back to top" button, and universal search bar logic.

// Executes when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', (): void => {
    // Spinner functionality: Hides the loading spinner.
    const spinner = (): void => {
        // Use setTimeout to ensure the spinner is visible briefly before hiding.
        // A delay of 1ms is often enough for the browser to render it.
        setTimeout((): void => {
            const spinnerElement = document.getElementById('spinner');
            // Check if the spinner element exists and has the 'show' class.
            if (spinnerElement && spinnerElement.classList.contains('show')) {
                spinnerElement.classList.remove('show'); // Hide the spinner.
            }
        }, 1);
    };
    spinner(); // Call the spinner function.

    // Fixed Navbar: Adds a shadow and adjusts position on scroll.
    window.addEventListener('scroll', (): void => {
        const fixedTop = document.querySelector('.fixed-top') as HTMLElement | null;
        if (!fixedTop) return; // Exit if no fixed-top element is found.

        if (window.innerWidth < 992) { // Behavior for smaller screens.
            if (window.scrollY > 55) {
                fixedTop.classList.add('shadow');
            } else {
                fixedTop.classList.remove('shadow');
            }
        } else { // Behavior for larger screens (>= 992px).
            if (window.scrollY > 55) {
                fixedTop.classList.add('shadow');
                fixedTop.style.top = '-5px'; // Slightly move navbar up.
            } else {
                fixedTop.classList.remove('shadow');
                fixedTop.style.top = '0'; // Reset navbar position.
            }
        }
    });

    // Back to top button: Shows/hides based on scroll position.
    window.addEventListener('scroll', (): void => {
        const backToTopButton = document.querySelector('.back-to-top');
        if (!backToTopButton) return;

        if (window.scrollY > 300) {
            // Add 'fadeIn' class to show the button (assuming CSS handles the animation).
            backToTopButton.classList.add('fadeIn');
        } else {
            backToTopButton.classList.remove('fadeIn');
        }
    });

    // Adds click event listener to all "back to top" buttons.
    const backToTopButtons = document.querySelectorAll('.back-to-top');
    backToTopButtons.forEach((btn) => {
        btn.addEventListener('click', (e): void => {
            e.preventDefault(); // Prevent default link behavior.
            // Smoothly scroll the window to the top.
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Universal search bar redirect logic for all pages.
    // Applies to all input elements with type="search".
    document.querySelectorAll('input[type="search"]').forEach(input => {
        input.addEventListener('keydown', (e) => {
            const event = e as KeyboardEvent;
            // Check if the 'Enter' key was pressed.
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission.
                const query = (event.target as HTMLInputElement).value.trim();
                if (query.length > 0) {
                    // Redirect to the recipes page with the search query.
                    // Ensures redirection happens only if not already on recipes.html
                    // to avoid redundant navigation or issues with query parameter handling.
                    if (!window.location.pathname.endsWith('/recipes.html')) {
                        window.location.href = `${location.origin}/pages/recipes.html?query=${encodeURIComponent(query)}`;
                    }
                    // If already on recipes.html, the search might be handled by recipes-dynamic.ts
                }
            }
        });
    });

    // Hero header search bar button functionality.
    // Specifically targets the search bar in the main hero header.
    const heroSearchBar = document.querySelector('.hero-header input[type="search"]') as HTMLInputElement | null;
    const heroSearchBtn = document.querySelector('.hero-header button[type="submit"]');
    if (heroSearchBar && heroSearchBtn) {
        heroSearchBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button action.
            const query = heroSearchBar.value.trim();
            if (query.length > 0) {
                // Redirect to recipes page with the query.
                window.location.href = `${location.origin}/pages/recipes.html?query=${encodeURIComponent(query)}`;
            }
        });
    }

    // Modal search bar button functionality (works on all pages).
    // Targets the search bar within a modal (identified by #searchModal).
    const modalSearchBtn = document.querySelector('#searchModal .input-group-text');
    const modalSearchInput = document.querySelector('#searchModal input[type="search"]') as HTMLInputElement | null;
    if (modalSearchBtn && modalSearchInput) {
        modalSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const query = modalSearchInput.value.trim();
            if (query.length > 0) {
                window.location.href = `${location.origin}/pages/recipes.html?query=${encodeURIComponent(query)}`;
            }
        });
    }

    // Testimonial carousel: Placeholder comment.
    // If a testimonial carousel is implemented (e.g., using a library like Owl Carousel or Swiper),
    // its initialization code would go here.

    // Product Quantity: +/- buttons for input fields.
    // Likely used on product detail pages or in a shopping cart.
    const quantityButtons = document.querySelectorAll('.quantity button');
    quantityButtons.forEach((button) => {
        button.addEventListener('click', function(this: HTMLElement): void {
            // Find the associated input field.
            const inputElement = this.parentElement?.parentElement?.querySelector('input') as HTMLInputElement | null;
            if (!inputElement) return;
            
            let oldValue = parseFloat(inputElement.value);
            if (isNaN(oldValue)) oldValue = 0; // Handle cases where input might be empty or non-numeric.
            let newVal: number;
            
            if (this.classList.contains('btn-plus')) {
                newVal = oldValue + 1;
            } else { // Assumes btn-minus
                newVal = oldValue > 0 ? oldValue - 1 : 0; // Prevent negative quantities.
            }
            
            inputElement.value = newVal.toString();
        });
    });

});

// --- REMOVE RECIPE CARD LOGIC FROM THIS FILE TO AVOID DUPLICATES ---
// The comment below indicates that recipe card generation logic (like getRecipeImage,
// createRecipeCard, etc.) was previously in this file but should be/has been
// moved to a more specific file (e.g., recipes-dynamic.ts) to avoid code duplication
// and improve organization.
// (getRecipeImage, createRecipeCard, capitalize, renderRecipes, fetchAndRenderRecipes)
