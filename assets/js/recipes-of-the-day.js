"use strict";
// Dynamically load top-rated recipes into the homepage carousel (Recipes of the Day)
document.addEventListener('DOMContentLoaded', async function () {
    const carouselInner = document.querySelector('#carouselId .carousel-inner');
    if (!carouselInner)
        return;
    // Show loading spinner
    carouselInner.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height:200px"><div class="spinner-border text-primary" role="status"></div></div>`;
    try {
        const res = await fetch('http://localhost:3000/recipes?minRating=4.5');
        if (!res.ok)
            throw new Error('Failed to fetch recipes');
        let recipes = await res.json();
        // Sort by rating descending, take top 3
        recipes = recipes.sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0)).slice(0, 3);
        if (!recipes.length) {
            carouselInner.innerHTML = '<div class="alert alert-info m-0">No recipes of the day found.</div>';
            return;
        }
        carouselInner.innerHTML = recipes.map((r, i) => `
            <div class="carousel-item${i === 0 ? ' active' : ''} rounded" style="position:relative;height:350px;width:100%;background:#f8f9fa;overflow:hidden;">
                <img src="assets/img/recipe_imgs/${r.id}.jpg" 
                     class="img-fluid bg-secondary rounded"
                     alt="${r.name}"
                     style="object-fit:cover;width:100%;height:100%;max-width:500px;display:block;margin:auto;background:#eee;">
                <a href="pages/recipe-view.html?id=${r.id}" class="btn px-4 py-2 text-white rounded d-flex justify-content-center align-items-center text-center" style="background:#000a;position:absolute;bottom:20px;left:50%;transform:translateX(-50%);min-width:180px;height:70px;line-height:1.2;padding-top:6px;padding-bottom:6px;">
                    ${r.name}
                </a>
            </div>
        `).join('');
        // Re-initialize Bootstrap carousel to restore navigation
        // @ts-ignore
        if (window.bootstrap && window.bootstrap.Carousel) {
            // @ts-ignore
            new window.bootstrap.Carousel(document.getElementById('carouselId'));
        }
    }
    catch (e) {
        carouselInner.innerHTML = '<div class="alert alert-danger m-0">Could not load recipes of the day.</div>';
    }
});
