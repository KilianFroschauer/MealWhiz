// recipe-view.ts
// This script dynamically fetches and displays detailed information for a single recipe
// on the recipe-view.html page. It retrieves the recipe ID from the URL,
// calls an API to get recipe data, and then renders this data into the page.

namespace RecipeView {
    // Global API base URL with fallback if MealWhizConfig is not defined
    const apiBase: string = (typeof MealWhizConfig !== 'undefined' ? 
                            MealWhizConfig.apiBaseURL : 
                            'https://mealhwiz.at:3000');

    // Interface defining the structure of a full Recipe object.
    interface Recipe {
        id: number;
        name: string;
        ingredients: string[]; // List of ingredient names.
        ingredientsAmount: string[]; // Corresponding amounts for each ingredient.
        ratings: string; // Average rating (might be a string like "4.5").
        dietaryPreferences: string[]; // e.g., ["Vegan", "Gluten-Free"].
        description: string; // Sic, should be "description".
        allergens: string[]; // List of allergens present.
        calories: number;
        proteins: number;
        carbs: number;
        fat: number;
        time: number; // Preparation/cooking time in minutes.
        difficulty: "easy" | "medium" | "hard"; // e.g., "easy", "medium", "hard".
        mealTimes: string[]; // e.g., ["Breakfast", "Lunch"].
        tags: string[]; // e.g., ["Quick", "Healthy"].
        servings: number; // Number of servings the recipe makes.
        instructions: string; // Detailed cooking instructions, possibly with markdown.
        isFavorite?: boolean; // Add this property to track favorite status
    }

    declare var bootstrap: any;

    // Retrieves the recipe ID from the 'id' query parameter in the URL.
    // Returns the ID as a number, or null if not found or invalid.
    function getRecipeIdFromUrl(): number | null {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        return id ? parseInt(id, 10) : null; // Convert to integer.
    }

    // Shows or hides a loading spinner element.
    function setLoading(loading: boolean) {
        const spinner = document.getElementById("spinner");
        if (spinner) spinner.style.display = loading ? "flex" : "none"; // 'flex' for centered spinner.
    }

    // Displays an error message within the main content area.
    function showError(message: string) {
        setLoading(false); // Hide loader if it was visible.
        const container = document.getElementById("recipe-dynamic-content");
        if (container) {
            // Display a Bootstrap alert with the error message.
            container.innerHTML = `<div class='alert alert-danger mt-5 text-center' style='font-size:1.5rem'>${message}</div>`;
        }
    }

    /**
     * Validates the JWT token by checking:
     * 1. If it exists
     * 2. If it's not expired (by making a lightweight API call)
     * @returns Promise resolving to boolean indicating if token is valid
     */
    async function isUserLoggedIn(): Promise<boolean> {
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
                AuthNav.logout();
                return false;
            }

            // For other errors, assume token might be valid
            return true;
        } catch (error) {
            console.error("Error validating token:", error);
            // If network error, assume token is valid (to prevent logout when offline)
            return true;
        }
    }

    // Render rating component for logged-in users
    async function renderRatingComponent(recipe: Recipe, container: HTMLElement) {
        const ratingContainer = document.createElement("div");
        ratingContainer.className = "my-4 border-top pt-4";
        ratingContainer.innerHTML = `
            <h5 class="fw-bold mb-3">Rate this recipe</h5>
            ${
                (await isUserLoggedIn())
                    ? `
                <div class="d-flex align-items-center recipe-rating-component">
                    <div class="star-rating">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                    <span class="ms-3 rating-message">Click to rate</span>
                </div>
            `
                    : `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <a href="login.html" class="alert-link">Log in</a> to rate this recipe
                </div>
            `
            }
        `;

        container.appendChild(ratingContainer);

        // Only add event listeners if user is logged in
        if (await isUserLoggedIn()) {
            const stars = ratingContainer.querySelectorAll(".star-rating i");
            const ratingMessage = ratingContainer.querySelector(".rating-message");

            // Highlight stars on hover
            stars.forEach((star) => {
                star.addEventListener("mouseover", () => {
                    const rating = parseInt(star.getAttribute("data-rating") || "0");
                    updateStarsDisplay(stars, rating, "hover");
                    if (ratingMessage) ratingMessage.textContent = `${rating} star${rating !== 1 ? "s" : ""}`;
                });
            });

            // Reset stars when not hovering
            ratingContainer.querySelector(".star-rating")?.addEventListener("mouseleave", () => {
                updateStarsDisplay(stars, 0, "reset");
                if (ratingMessage) ratingMessage.textContent = "Click to rate";
            });

            // Handle click to submit rating
            stars.forEach((star) => {
                star.addEventListener("click", async () => {
                    const rating = parseInt(star.getAttribute("data-rating") || "0");
                    await submitRating(recipe.id, rating, stars, ratingMessage as HTMLElement);
                });
            });
        }
    }

    // Update the star display based on interaction
    function updateStarsDisplay(stars: NodeListOf<Element>, rating: number, mode: "hover" | "reset" | "set") {
        stars.forEach((star, index) => {
            if (mode === "reset") {
                star.className = "far fa-star";
            } else {
                star.className = index < rating ? "fas fa-star text-warning" : "far fa-star";
            }
        });
    }

    // Submit the rating to the API
    async function submitRating(recipeId: number, rating: number, stars: NodeListOf<Element>, messageElement: HTMLElement) {
        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(`${apiBase}/recipes/${recipeId}/rate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ rating }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit rating");
            }

            const result = await response.json();

            // Update UI to show successful rating
            updateStarsDisplay(stars, rating, "set");
            messageElement.textContent = `Thank you! You rated ${rating} star${rating !== 1 ? "s" : ""}`;
            messageElement.className = "ms-3 rating-message text-success";

            // Update the displayed average rating
            const ratingDisplay = document.querySelector(".recipe-rating-display");
            if (ratingDisplay && result.newRating) {
                ratingDisplay.textContent = result.newRating.toFixed(1);
            }

            // Show toast notification
            showToast(`You rated this recipe ${rating} star${rating !== 1 ? "s" : ""}`, false);
        } catch (error) {
            console.error("Error submitting rating:", error);
            messageElement.textContent = "Failed to submit rating. Please try again.";
            messageElement.className = "ms-3 rating-message text-danger";
            showToast("Error submitting rating", true);
        }
    }

    // Asynchronously loads the recipe data.
    async function loadRecipe() {
        setLoading(true); // Show loader.
        const id = getRecipeIdFromUrl(); // Get recipe ID from URL.
        if (!id) {
            showError("No recipe ID provided in URL.");
            return;
        }
        try {
            // Fetch recipe data from the API.
            const res = await fetch(`${apiBase}/recipes/${id}`);
            if (!res.ok) {
                // Handle cases where the recipe is not found (e.g., 404 error).
                showError("Recipe not found.");
                return;
            }
            const recipe: Recipe = await res.json(); // Parse JSON response.

            // Check if the user has favorited this recipe
            if (await isUserLoggedIn()) {
                recipe.isFavorite = await checkFavoriteStatus(id);
            }

        renderRecipe(recipe); // Render the fetched recipe.
    } catch (e) {
        // Handle generic fetch errors (e.g., network issues).
        showError("Failed to load recipe.");
        console.error("Error loading recipe:", e);
    }
}

// Add an event listener to call loadRecipe when the DOM is fully loaded.
document.addEventListener("DOMContentLoaded", loadRecipe);

    // Add these functions for favorite management
    async function checkFavoriteStatus(recipeId: number): Promise<boolean> {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return false;

            const response = await fetch(`${apiBase}/recipes/${recipeId}/favorite`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) return false;
            const data = await response.json();
            return data.isFavorite === true;
        } catch (error) {
            console.error("Error checking favorite status:", error);
            return false;
        }
    }

    async function toggleFavorite(recipeId: number, button: HTMLElement): Promise<void> {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                showToast("Please log in to save favorites", true);
                return;
            }

            // Disable button during API call
            button.setAttribute("disabled", "true");

            const response = await fetch(`${apiBase}/recipes/${recipeId}/favorite`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to toggle favorite status");
            }

            const result = await response.json();

            // Update button appearance based on the new status
            updateFavoriteButton(button, result.isFavorite);

            showToast(
                result.isFavorite ? "Recipe added to favorites!" : "Recipe removed from favorites!",
            );
        } catch (error) {
            console.error("Error toggling favorite:", error);
            showToast("Error updating favorite status", true);
        } finally {
            // Re-enable button
            button.removeAttribute("disabled");
        }
    }

    function updateFavoriteButton(button: HTMLElement, isFavorite: boolean): void {
        const icon = button.querySelector("i");
        if (!icon) return;

        if (isFavorite) {
            icon.className = "fas fa-heart";
            button.setAttribute("title", "Remove from favorites");
        } else {
            icon.className = "far fa-heart";
            button.setAttribute("title", "Add to favorites");
        }
    }

    function renderFavoriteButton(recipe: Recipe, container: HTMLElement): void {
        if (!isUserLoggedIn()) {
            return;
        }

        const favoriteBtn = document.createElement("button");
        favoriteBtn.className = "favorite-btn ms-2";
        favoriteBtn.innerHTML = `
            <i class="${recipe.isFavorite ? "fas" : "far"} fa-heart me-1"></i>
        `;
        favoriteBtn.title = recipe.isFavorite ? "Remove from favorites" : "Add to favorites";

        favoriteBtn.addEventListener("click", (e) => {
            e.preventDefault();
            toggleFavorite(recipe.id, favoriteBtn);
        });

        container.appendChild(favoriteBtn);
    }

    // Add toast notification function
    function showToast(message: string, isError = false): void {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            toastContainer.style.position = "fixed";
            toastContainer.style.bottom = "20px";
            toastContainer.style.right = "20px";
            toastContainer.style.zIndex = "1050";
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement("div");
        toast.className = `toast ${isError ? "bg-danger text-white" : "bg-success text-white"}`;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");

        toast.innerHTML = `
            <div class="toast-body">
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        // Initialize toast using Bootstrap
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
        bsToast.show();

        // Remove toast from DOM after it's hidden
        toast.addEventListener("hidden.bs.toast", () => {
            toast.remove();
        });
    }

    // Update the renderRecipe function to include the favorite button
    function renderRecipe(recipe: Recipe): void {
        setLoading(false); // Hide loader.
        const container = document.getElementById("recipe-dynamic-content");
        if (!container) return; // Exit if the main container isn't found.

        // Prepare the list of ingredients with their amounts.
        let ingredientsList = "";
        if (
            recipe.ingredients &&
            recipe.ingredientsAmount &&
            recipe.ingredients.length === recipe.ingredientsAmount.length
        ) {
            // If amounts are available and match the number of ingredients.
            ingredientsList = recipe.ingredients
                .map(
                    (ing, i) =>
                        `<li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">${ing}<span class="badge bg-light text-dark">${recipe.ingredientsAmount[i]}</span></li>`
                )
                .join("");
        } else {
            // Fallback if amounts are missing or mismatched.
            ingredientsList = recipe.ingredients
                .map(
                    (ing) =>
                        `<li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">${ing}</li>`
                )
                .join("");
        }

        // Process recipe instructions: convert basic markdown to HTML.
        let instructionsHtml = "";
        if (recipe.instructions) {
            instructionsHtml = recipe.instructions
                .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Replace **bold** with <b>bold</b>.
                .replace(/\r?\n/g, "<br>"); // Replace newlines with <br> tags.
        } else {
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
                                <img src="${recipeImgPath}" class="img-fluid rounded" alt="${
            recipe.name
        }" onerror="this.onerror=null; this.src='../assets/img/Food_Example_01-unsplash.jpg';"> <!-- Fallback image -->
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="recipe-header mb-4">
                            <h4 class="recipe-title fw-bold mb-3">${recipe.name}</h4>
                            <p class="mb-3">Category: <span class="badge bg-secondary">${
                                recipe.mealTimes.join(", ") || "N/A"
                            }</span></p>
                            <div class="d-flex mb-3">
                                <span class="badge badge-difficulty-${recipe.difficulty.toLowerCase()} me-2">${
            recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)
        }</span>
                                <span class="text-dark ms-2"><i class="far fa-clock me-1"></i>${recipe.time} min</span>
                            </div>
                            <div class="d-flex mb-4">
                                <i class="fa fa-star text-warning me-1"></i>
                                <span class="ms-2">(${recipe.ratings})</span>
                            </div>
                            <p class="mb-4">${recipe.description || ""}</p> 
                            <div class="mb-4">
                                <h5 class="fw-bold mb-2">Dietary Information:</h5>
                                ${
                                    recipe.dietaryPreferences.length > 0
                                        ? recipe.dietaryPreferences
                                              .map((dp) => `<span class="badge bg-success me-2">${dp}</span>`)
                                              .join("")
                                        : '<span class="text-muted">None</span>'
                                }
                            </div>
                            <div class="mb-4">
                                <h5 class="fw-bold mb-2">Contains:</h5>
                                ${
                                    recipe.allergens.length > 0
                                        ? recipe.allergens
                                              .map((a) => `<span class="badge bg-danger me-2">${a}</span>`)
                                              .join("")
                                        : '<span class="text-muted">None</span>'
                                }
                            </div>
                            <div class="mb-4">
                                <h5 class="fw-bold mb-2">Nutrition (per serving):</h5>
                                <div class="mb-2">
                                    <span><i class="fas fa-utensils me-1"></i> ${recipe.servings || 1} servings</span>
                                </div>
                                <div class="d-flex flex-wrap">
                                    <span class="me-4"><i class="fas fa-fire me-1"></i> ${recipe.calories} calories</span>
                                    <span class="me-4"><i class="fas fa-drumstick-bite me-1"></i> ${
                                        recipe.proteins
                                    }g protein</span>
                                    <span class="me-4"><i class="fas fa-bread-slice me-1"></i> ${recipe.carbs}g carbs</span>
                                    <span><i class="fas fa-cheese me-1"></i> ${recipe.fat}g fat</span>
                                </div>
                            </div>
                            <div class="mb-4">
                                <h5 class="fw-bold mb-2">Tags:</h5>
                                ${
                                    recipe.tags && recipe.tags.length > 0
                                        ? recipe.tags
                                              .map((tag) => `<span class="badge bg-info me-2">${tag}</span>`)
                                              .join("")
                                        : '<span class="text-muted">None</span>'
                                }
                            </div>
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

        // Add favorite button next to the recipe title
        const recipeTitle = container.querySelector(".recipe-title");
        if (recipeTitle) {
            const titleContainer = document.createElement("div");
            titleContainer.className = "d-flex align-items-center";

            // Move the existing title into the container
            titleContainer.appendChild(recipeTitle.cloneNode(true));

            // Add the favorite button
            renderFavoriteButton(recipe, titleContainer);

            // Replace the original title with our new container
            recipeTitle.parentNode!.replaceChild(titleContainer, recipeTitle);
        }

        // Add rating component
        const recipeContent = document.getElementById("recipe-content");
        if (recipeContent) {
            renderRatingComponent(recipe, recipeContent);
        }
    }

    // Add an event listener to call loadRecipe when the DOM is fully loaded.
    document.addEventListener("DOMContentLoaded", loadRecipe);
}
