"use strict";
// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\recipes-of-the-day.ts
// This script dynamically loads top-rated recipes (or a curated list)
// into a carousel on the homepage, often referred to as "Recipes of the Day".
// Executes when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', async function () {
    // Get the carousel's inner container element where items will be added.
    const carouselInner = document.querySelector('#carouselId .carousel-inner');
    if (!carouselInner) {
        console.error("Carousel inner container '#carouselId .carousel-inner' not found.");
        return; // Exit if the container doesn't exist.
    }
    // Display a loading spinner or message while fetching data.
    carouselInner.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height:200px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    try {
        // Fetch recipes from the API. Here, it's fetching recipes with a minimum rating of 4.5.
        // The API might also support parameters like `?featured=true`.
        const res = await fetch('http://localhost:3000/recipes?minRating=4.5'); // Fetch a bit more to ensure variety if some images fail
        if (!res.ok) {
            throw new Error(`Failed to fetch recipes: ${res.statusText}`);
        }
        let recipes = await res.json();
        // Sort by rating in descending order and take the top 3 recipes.
        // Ensure `ratings` is treated as a number for correct sorting.
        recipes = recipes.sort((a, b) => (Number(b.ratings) || 0) - (Number(a.ratings) || 0)).slice(0, 3);
        if (!recipes.length) {
            // If no recipes meet the criteria, display an informational message.
            carouselInner.innerHTML = '<div class="alert alert-info m-0 text-center">No recipes of the day found. Check back later!</div>';
            return;
        }
        // Generate HTML for each carousel item.
        carouselInner.innerHTML = recipes.map((r, i) => `
            <div class="carousel-item${i === 0 ? ' active' : ''} rounded" style="position:relative;height:350px;width:100%;background:#f0f0f0;overflow:hidden;">
                <img src="assets/img/recipe_imgs/${r.id}.jpg" 
                     class="img-fluid"
                     alt="${r.name}"
                     style="object-fit:cover;width:100%;height:100%;display:block;margin:auto;"
                     onerror="this.onerror=null; this.src='assets/img/Food-banner-unsplash.jpg'; this.alt='Fallback Recipe Image';"> {/* Fallback image on error */}
                <a href="pages/recipe-view.html?id=${r.id}" class="btn px-4 py-2 text-white rounded d-flex justify-content-center align-items-center text-center" 
                   style="background:rgba(0,0,0,0.6);position:absolute;bottom:20px;left:50%;transform:translateX(-50%);min-width:180px;max-width:90%;height:auto;min-height:50px;line-height:1.3;padding:10px 15px;font-weight:500;">
                    ${r.name}
                </a>
            </div>
        `).join('');
        // Re-initialize the Bootstrap carousel if Bootstrap's JS is loaded.
        // This is necessary because we've dynamically added items.
        // @ts-ignore is used as `bootstrap` might be a global object not fully typed.
        const carouselElement = document.getElementById('carouselId');
        if (carouselElement && window.bootstrap && window.bootstrap.Carousel) {
            // Dispose of any existing carousel instance before creating a new one
            const existingCarousel = window.bootstrap.Carousel.getInstance(carouselElement);
            if (existingCarousel) {
                existingCarousel.dispose();
            }
            new window.bootstrap.Carousel(carouselElement);
        }
    }
    catch (e) {
        console.error("Error loading recipes of the day:", e);
        // Display an error message in the carousel container.
        carouselInner.innerHTML = '<div class="alert alert-danger m-0 text-center">Could not load recipes of the day. Please try again later.</div>';
    }
});
