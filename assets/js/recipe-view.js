"use strict";
// recipe-view.ts
// This script dynamically fetches and displays detailed information for a single recipe
// on the recipe-view.html page. It retrieves the recipe ID from the URL,
// calls an API to get recipe data, and then renders this data into the page.
// Retrieves the recipe ID from the 'id' query parameter in the URL.
// Returns the ID as a number, or null if not found or invalid.
function getRecipeIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? parseInt(id, 10) : null; // Convert to integer.
}
// Shows or hides a loading spinner element.
function setLoading(loading) {
    const spinner = document.getElementById('spinner');
    if (spinner)
        spinner.style.display = loading ? 'flex' : 'none'; // 'flex' for centered spinner.
}
// Displays an error message within the main content area.
function showError(message) {
    setLoading(false); // Hide loader if it was visible.
    const container = document.getElementById('recipe-dynamic-content');
    if (container) {
        // Display a Bootstrap alert with the error message.
        container.innerHTML = `<div class='alert alert-danger mt-5 text-center' style='font-size:1.5rem'>${message}</div>`;
    }
}
// Renders the fetched recipe details into the HTML structure.
function renderRecipe(recipe) {
    setLoading(false); // Hide loader.
    const container = document.getElementById('recipe-dynamic-content');
    if (!container)
        return; // Exit if the main container isn't found.
    // Prepare the list of ingredients with their amounts.
    let ingredientsList = '';
    if (recipe.ingredients && recipe.ingredientsAmount && recipe.ingredients.length === recipe.ingredientsAmount.length) {
        // If amounts are available and match the number of ingredients.
        ingredientsList = recipe.ingredients.map((ing, i) => `<li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">${ing}<span class="badge bg-light text-dark">${recipe.ingredientsAmount[i]}</span></li>`).join('');
    }
    else {
        // Fallback if amounts are missing or mismatched.
        ingredientsList = recipe.ingredients.map(ing => `<li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">${ing}</li>`).join('');
    }
    // Process recipe instructions: convert basic markdown to HTML.
    let instructionsHtml = '';
    if (recipe.instructions) {
        instructionsHtml = recipe.instructions
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Replace **bold** with <b>bold</b>.
            .replace(/\r?\n/g, '<br>'); // Replace newlines with <br> tags.
    }
    else {
        instructionsHtml = '<div class="alert alert-info">Instructions not available.</div>';
    }
    // Construct the path for the recipe-specific image.
    const recipeImgPath = `../assets/img/recipe_imgs/${recipe.id}.jpg`;
    // Populate the container with the recipe's HTML structure.
    // This includes image, name, category, difficulty, time, ratings, description,
    // dietary info, allergens, nutrition facts, tags, ingredients, and instructions.
    container.innerHTML = `
        <div class="row g-4 mb-5">
            <div class="col-lg-8 col-xl-9">
                <div class="row g-4">
                    <div class="col-lg-6">
                        <div class="border rounded">
                            <img src="${recipeImgPath}" class="img-fluid rounded" alt="${recipe.name}" onerror="this.onerror=null; this.src='../assets/img/Food_Example_01-unsplash.jpg';"> <!-- Fallback image -->
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <h4 class="fw-bold mb-3">${recipe.name}</h4>
                        <p class="mb-3">Category: <span class="badge bg-secondary">${recipe.mealTimes.join(', ') || 'N/A'}</span></p>
                        <div class="d-flex mb-3">
                            <span class="badge badge-difficulty-${recipe.difficulty.toLowerCase()} me-2">${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}</span>
                            <span class="text-dark ms-2"><i class="far fa-clock me-1"></i>${recipe.time} min</span>
                        </div>
                        <div class="d-flex mb-4">
                            <i class="fa fa-star text-warning me-1"></i>
                            <span class="ms-2">(${recipe.ratings})</span>
                        </div>
                        <p class="mb-4">${recipe.description || ''}</p> 
                        <div class="mb-4">
                            <h5 class="fw-bold mb-2">Dietary Information:</h5>
                            ${recipe.dietaryPreferences.length > 0 ? recipe.dietaryPreferences.map(dp => `<span class="badge bg-success me-2">${dp}</span>`).join('') : '<span class="text-muted">None</span>'}
                        </div>
                        <div class="mb-4">
                            <h5 class="fw-bold mb-2">Contains:</h5>
                            ${recipe.allergens.length > 0 ? recipe.allergens.map(a => `<span class="badge bg-danger me-2">${a}</span>`).join('') : '<span class="text-muted">None</span>'}
                        </div>
                        <div class="mb-4">
                            <h5 class="fw-bold mb-2">Nutrition (per serving):</h5>
                            <div class="mb-2">
                                <span><i class="fas fa-utensils me-1"></i> ${recipe.servings || 1} servings</span>
                            </div>
                            <div class="d-flex flex-wrap">
                                <span class="me-4"><i class="fas fa-fire me-1"></i> ${recipe.calories} calories</span>
                                <span class="me-4"><i class="fas fa-drumstick-bite me-1"></i> ${recipe.proteins}g protein</span>
                                <span class="me-4"><i class="fas fa-bread-slice me-1"></i> ${recipe.carbs}g carbs</span>
                                <span><i class="fas fa-cheese me-1"></i> ${recipe.fat}g fat</span>
                            </div>
                        </div>
                        <div class="mb-4">
                            <h5 class="fw-bold mb-2">Tags:</h5>
                            ${recipe.tags && recipe.tags.length > 0 ? recipe.tags.map(tag => `<span class="badge bg-info me-2">${tag}</span>`).join('') : '<span class="text-muted">None</span>'}
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div class="row">
                            <div class="col-lg-3 d-none d-lg-block"> 
                                <div class="sticky-top" style="top: 120px;">
                                    <div class="bg-light p-3 rounded mb-4">
                                        <h5 class="fw-bold mb-3">Chapters</h5>
                                        <nav class="nav flex-column">
                                            <a class="nav-link active" href="#ingredients-section">Ingredients</a>
                                            <a class="nav-link" href="#instructions-section">Instructions</a>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-9"> 
                                <ul class="nav nav-tabs mb-4">
                                    <li class="nav-item">
                                        <a class="nav-link active" data-bs-toggle="tab" href="#recipe-content">Recipe</a>
                                    </li>
                                    
                                </ul>
                                <div class="tab-content">
                                    <div id="recipe-content" class="tab-pane fade show active">
                                        <div id="ingredients-section" class="mb-4">
                                            <h4 class="fw-bold mb-3 border-bottom pb-2">Ingredients</h4>
                                            <ul class="list-group list-group-flush mb-4">
                                                ${ingredientsList}
                                            </ul>
                                        </div>
                                        <div id="instructions-section" class="mb-4">
                                            <h4 class="fw-bold mb-3 border-bottom pb-2">Instructions</h4>
                                            <div>${instructionsHtml}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    `;
}
// Asynchronously loads the recipe data.
async function loadRecipe() {
    setLoading(true); // Show loader.
    const id = getRecipeIdFromUrl(); // Get recipe ID from URL.
    if (!id) {
        showError('No recipe ID provided in URL.');
        return;
    }
    try {
        // Fetch recipe data from the API.
        const res = await fetch(`http://localhost:3000/recipes/${id}`);
        if (!res.ok) {
            // Handle cases where the recipe is not found (e.g., 404 error).
            showError('Recipe not found.');
            return;
        }
        const recipe = await res.json(); // Parse JSON response.
        renderRecipe(recipe); // Render the fetched recipe.
    }
    catch (e) {
        // Handle generic fetch errors (e.g., network issues).
        showError('Failed to load recipe.');
        console.error("Error loading recipe:", e);
    }
}
// Add an event listener to call loadRecipe when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', loadRecipe);
