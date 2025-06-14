// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\recipes-dynamic.ts
// This script manages the dynamic display, filtering, sorting, and pagination
// of recipes on a recipe listing page (e.g., recipes.html).
// It interacts with a backend API to fetch recipe data.

namespace RecipesDynamic {
    // Global API base URL with fallback if MealWhizConfig is not defined
    const apiBase: string = (typeof MealWhizConfig !== 'undefined' ? 
                            MealWhizConfig.apiBaseURL : 
                            'https://mealhwiz.at:3000');

    // Minimal interface for data needed to render a recipe card in search results or listings.
    interface RecipeCardData {
        id: number; // Unique identifier for the recipe.
        name: string; // Name of the recipe.
        time: number; // Preparation/cooking time in minutes.
        difficulty: "easy" | "medium" | "hard"; // Difficulty level.
        ratings?: number; // Optional average rating (numeric).
    }

    // Returns the path to the recipe's image.
    // Assumes images are stored in a specific directory structure.
    function getRecipeImage(id: number): string {
        return `../assets/img/recipe_imgs/${id}.jpg`;
    }

    // Generates the HTML string for a single recipe card.
    function createRecipeCard(recipe: RecipeCardData): string {
        const difficultyClass = `badge-difficulty-${recipe.difficulty}`; // CSS class for difficulty badge.
        const imageUrl = getRecipeImage(recipe.id);
        const ratingValue = recipe.ratings !== undefined ? Number(recipe.ratings) : undefined;

        // HTML structure for a recipe card. Includes:
        // - Link to the recipe's detail page (recipe-view.html).
        // - Image with a skeleton loading effect.
        // - Recipe name, difficulty, time, and rating.
        // The 'onload' and 'onerror' attributes on the image handle loading states and fallbacks.
        return `
        <div class="col-md-6 col-lg-6 col-xl-4">
          <a href="recipe-view.html?id=${recipe.id}" class="text-decoration-none">
            <div class="rounded position-relative food-item card-has-skeleton">
              <div class="food-img position-relative">
                <img src="${imageUrl}" class="img-fluid w-100 rounded-top recipe-img-loading" alt="${
            recipe.name
        }" loading="lazy" 
                     onload="this.parentElement.querySelector('.skeleton-img-overlay')?.classList.add('d-none'); this.classList.remove('recipe-img-loading'); this.closest('.card-has-skeleton')?.classList.remove('card-has-skeleton');"
                     onerror="this.onerror=null; this.src='../assets/img/Food_Example_01-unsplash.jpg'; this.parentElement.querySelector('.skeleton-img-overlay')?.classList.add('d-none'); this.classList.remove('recipe-img-loading'); this.closest('.card-has-skeleton')?.classList.remove('card-has-skeleton');"> {/* Fallback image and skeleton removal on error */}
                <div class="skeleton-img-overlay skeleton-img position-absolute top-0 start-0 w-100 h-100"></div>
              </div>
              <div class="p-4 border border-secondary border-top-0 rounded-bottom">
                <h4 class="text-dark">${recipe.name}</h4>
                <div class="mb-3">
                  <span class="badge ${difficultyClass} me-2">${capitalize(recipe.difficulty)}</span>
                  <span class="text-dark me-3"><i class="far fa-clock me-1"></i>${recipe.time} min</span>
                </div>
                <div class="d-flex justify-content-end">
                  <div class="d-flex align-items-center">
                    <i class="fas fa-star text-warning me-2"></i>
                    <span class="fw-bold text-dark">${
                        ratingValue !== undefined && !isNaN(ratingValue) ? ratingValue.toFixed(1) : "-"
                    }</span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
        `;
    }

    // Helper function to capitalize the first letter of a string.
    function capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // --- SORTING ---
    const sortingDropdown = document.getElementById("recipe-sorting") as HTMLSelectElement | null;
    let lastFetchedRecipes: RecipeCardData[] = []; // Stores the most recently fetched set of recipes (unpaginated, unsorted by user).

    // Renders a list of recipes into the designated HTML container.
    // This function is later patched by pagination logic.
    let renderRecipes = function (recipes: RecipeCardData[]): void {
        lastFetchedRecipes = recipes.slice(); // Store a copy of the fetched recipes for sorting/filtering.
        const list = document.getElementById("recipe-list");
        if (!list) return;
        if (recipes.length === 0) {
            list.innerHTML =
                '<div class="alert alert-warning text-center col-12">No recipes found matching your criteria.</div>';
        } else {
            list.innerHTML = recipes.map(createRecipeCard).join("");
        }
    };

    // Sorts the `lastFetchedRecipes` array based on `sortType` and re-renders them.
    function sortAndRenderRecipes(sortType: string) {
        if (!lastFetchedRecipes.length && sortType !== "none") return; // Don't sort if no recipes or if "none" is selected initially.

        let sortedRecipes: RecipeCardData[];
        // If sortType is 'none', we want to display the recipes as they were originally fetched by the current filters/search.
        // This means `lastFetchedRecipes` (which is updated by fetch functions) already holds the correct "unsorted" state.
        if (sortType === "none") {
            sortedRecipes = lastFetchedRecipes.slice(); // Use the current state from last fetch
        } else {
            // For other sort types, we sort a copy of `lastFetchedRecipes`.
            sortedRecipes = lastFetchedRecipes.slice(); // Create a copy to sort
            if (sortType === "rating") {
                // Sort by ratings, descending (higher ratings first).
                sortedRecipes.sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0));
            } else if (sortType === "alpha") {
                // Sort alphabetically by name.
                sortedRecipes.sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        // The `renderRecipes` function (which is `renderRecipesPaged` due to patching)
        // will take this sorted list, update its own internal `lastFetchedRecipes` (for pagination purposes),
        // and then render the current page of these sorted recipes.
        renderRecipes(sortedRecipes); // This will trigger pagination logic with the sorted list.
    }

    // --- LOADING STATE ---
    // Displays skeleton loader cards while recipes are being fetched.
    function setLoadingState(isLoading: boolean): void {
        const list = document.getElementById("recipe-list");
        if (!list) return;
        if (isLoading) {
            // Generate HTML for 6 skeleton cards.
            list.innerHTML = Array(6)
                .fill("")
                .map(
                    () => `
            <div class="col-md-6 col-lg-6 col-xl-4">
              <div class="rounded position-relative food-item skeleton-card">
                <div class="food-img skeleton-img"></div>
                <div class="p-4 border border-secondary border-top-0 rounded-bottom">
                  <div class="skeleton-text skeleton-title mb-3"></div>
                  <div class="d-flex mb-3">
                    <div class="skeleton-badge me-2"></div>
                    <div class="skeleton-text skeleton-time ms-2"></div>
                  </div>
                  <div class="d-flex justify-content-end">
                    <div class="skeleton-rating"></div>
                  </div>
                </div>
              </div>
            </div>
            `
                )
                .join("");
        }
        // If !isLoading, the actual recipe cards will replace this.
    }

    // --- FILTERING ---
    // Maps HTML checkbox IDs to backend allergen IDs.
    const allergenIdMap: Record<string, number> = {
        "allergy-eggs": 1,
        "allergy-milk": 2,
        "allergy-gluten": 3,
        "allergy-crustaceans": 4,
        "allergy-fish": 5,
        "allergy-peanut": 6,
        "allergy-soy": 7,
        "allergy-nuts": 8,
        "allergy-celery": 9,
        "allergy-mustard": 10,
        "allergy-sesame": 11,
        "allergy-sulphites": 12,
        "allergy-lupines": 13,
        "allergy-molluscs": 14,
    };

    // Collects all active filter values from the sidebar UI elements.
    function collectRecipeFilters(): Record<string, any> {
        const filters: Record<string, any> = {};

    // Name (from the main search bar, usually at the top of the filter sidebar).
    const nameInput = document.querySelector('.col-xl-3 .input-group input[type="search"]') as HTMLInputElement | null;
    if (nameInput && nameInput.value.trim() !== "") {
        const names = nameInput.value.split(',').map(name => name.trim()).filter(name => name !== "");
        if (names.length > 0) {
            filters.name = names;
        }
    }

        // Dietary Preferences (checkboxes with IDs starting "dp-").
        const dpChecked = Array.from(document.querySelectorAll('input[id^="dp-"]:checked')) as HTMLInputElement[];
        if (dpChecked.length) {
            filters.dp = dpChecked.map((cb) => cb.id.replace("dp-", "")); // e.g., "vegan", "vegetarian".
        }

        // Allergens (checkboxes with IDs starting "allergy-").
        const aChecked = Array.from(document.querySelectorAll('input[id^="allergy-"]:checked')) as HTMLInputElement[];
        if (aChecked.length) {
            filters.a = aChecked.map((cb) => allergenIdMap[cb.id]).filter((id) => id !== undefined); // Map to numeric IDs.
        }

        // Meal Times (checkboxes with IDs starting "meal-").
        const mtChecked = Array.from(document.querySelectorAll('input[id^="meal-"]:checked')) as HTMLInputElement[];
        if (mtChecked.length) {
            filters.mt = mtChecked.map((cb) => cb.id.replace("meal-", "")); // e.g., "breakfast", "dinner".
        }

        // Difficulty (radio buttons named "difficulty").
        const diffRadio = document.querySelector('input[name="difficulty"]:checked') as HTMLInputElement | null;
        if (diffRadio && diffRadio.value !== "any") {
            // "any" means no difficulty filter.
            filters.diff = diffRadio.value; // e.g., "easy", "medium", "hard".
        }

        // Minimum Rating (range slider).
        const ratingRange = document.getElementById("ratingRange") as HTMLInputElement | null;
        if (ratingRange && ratingRange.value && parseFloat(ratingRange.value) > parseFloat(ratingRange.min || "1")) {
            // Only apply if not min value
            filters.minRating = ratingRange.value;
        }

        // Max Preparation Time (range slider).
        const timeRange = document.getElementById("timeRange") as HTMLInputElement | null;
        if (timeRange && timeRange.value && timeRange.value !== timeRange.max) {
            // Only apply if not max value.
            filters.maxTime = timeRange.value;
        }

        // Calories (min/max input fields).
        const minCal = (document.getElementById("minCalories") as HTMLInputElement | null)?.value;
        const maxCal = (document.getElementById("maxCalories") as HTMLInputElement | null)?.value;
        if (minCal && minCal.trim() !== "") filters.minCal = minCal;
        if (maxCal && maxCal.trim() !== "") filters.maxCal = maxCal;

    // Ingredients (from a tag-based input or a single input field).
    const ingredientTags = Array.from(document.querySelectorAll("#ingredientTags .ingredient-tag")) as HTMLElement[];
    if (ingredientTags.length) {
        filters.ing = ingredientTags.map((tag) => tag.textContent?.trim() || "").filter(Boolean);
    } else {
        const ingInput = document.getElementById("ingredientInput") as HTMLInputElement | null;
        if (ingInput && ingInput.value.trim() !== "") {
             filters.ing = ingInput.value.split(',')
                .map(s => s.trim()) // Trim whitespace for each ingredient
                .filter(s => s !== ""); // Remove any empty strings
        }
    }

        // Tags (from selectable badges in #tagsCollapse).
        const tagBadges = Array.from(
            document.querySelectorAll("#tagsCollapse .badge.bg-secondary.selected")
        ) as HTMLElement[];
        if (tagBadges.length) {
            filters.tags = tagBadges.map((b) => b.textContent?.trim().toLowerCase() || "").filter(Boolean);
        }
        return filters;
    }

    // Builds a URL query string from a filter object.
    function buildRecipeQueryString(filters: Record<string, any>): string {
        const params = new URLSearchParams();
        for (const key in filters) {
            if (Array.isArray(filters[key])) {
                // For array values (like ingredients, tags), join with comma for backend.
                if (filters[key].length > 0) params.append(key, filters[key].join(","));
            } else if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
                params.append(key, filters[key]);
            }
        }
        return params.toString();
    }

    // Fetches recipes from the API based on the provided filter object and renders them.
    let fetchAndRenderRecipesWithFilters = async function (filters?: Record<string, any>): Promise<void> {
        const list = document.getElementById("recipe-list");
        if (!list) return;
        setLoadingState(true); // Show skeleton loaders.
        currentPage = 1; // Reset to first page when filters change.
        try {
            let url = `${apiBase}/recipes`;
            if (filters && Object.keys(filters).length > 0) {
                const queryString = buildRecipeQueryString(filters);
                if (queryString) url += "?" + queryString;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.statusText}`);
            const recipes: RecipeCardData[] = await res.json();
            renderRecipes(recipes); // This will call renderRecipesPaged.
        } catch (err) {
            console.error("Error fetching recipes with filters:", err);
            list.innerHTML = '<div class="alert alert-danger col-12">Could not load recipes. Please try again.</div>';
        }
    };

    // Fetches recipes based on a search query string and renders them.
    // This is typically used by the main search bar.
    let fetchAndRenderRecipes = async function (query?: string): Promise<void> {
        const list = document.getElementById("recipe-list");
        if (!list) return;
        setLoadingState(true);
        currentPage = 1; // Reset to first page on new search.
        try {
            let url =
                query && query.trim() !== ""
                    ? `${apiBase}/recipes/search?query=${encodeURIComponent(query)}`
                    : `${apiBase}/recipes`; // Default to all recipes if no query.
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.statusText}`);
            const recipes: RecipeCardData[] = await res.json();
            renderRecipes(recipes); // This will call renderRecipesPaged.
        } catch (err) {
            console.error("Error fetching recipes by query:", err);
            list.innerHTML = '<div class="alert alert-danger col-12">Could not load recipes. Please try again.</div>';
        }
    };

    // --- PAGINATION LOGIC ---
    let currentPage = 1;
    let recipesPerPage = 9; // Default number of recipes per page.
    const paginationDropdown = document.getElementById("recipes-per-page") as HTMLSelectElement | null;
    const paginationContainer = document.getElementById("recipe-pagination");

    // This function replaces the original `renderRecipes` to add pagination.
    // It stores all fetched recipes and then calls `updatePagination` to render the current page.
    function renderRecipesPaged(recipes: RecipeCardData[]): void {
        lastFetchedRecipes = recipes.slice(); // Store all fetched recipes for pagination.
        const list = document.getElementById("recipe-list");

        if (list && recipes.length === 0) {
            list.innerHTML =
                '<div class="alert alert-warning text-center col-12">No recipes found matching your filters.</div>';
            if (paginationContainer) paginationContainer.innerHTML = ""; // Clear pagination if no results.
            return;
        }
        // `updatePagination` will handle rendering the correct slice of recipes and the pagination controls.
        updatePagination();
    }

    // Updates the recipe list to show the current page and renders pagination controls.
    function updatePagination(): void {
        if (!paginationContainer) return;
        const totalRecipes = lastFetchedRecipes.length;
        const totalPages = Math.ceil(totalRecipes / recipesPerPage) || 1; // Ensure at least 1 page.

        // Adjust currentPage if it's out of bounds (e.g., after changing recipesPerPage).
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Calculate the slice of recipes for the current page.
        const startIdx = (currentPage - 1) * recipesPerPage;
        const endIdx = startIdx + recipesPerPage;
        const pagedRecipes = lastFetchedRecipes.slice(startIdx, endIdx);

        const list = document.getElementById("recipe-list");
        if (list) {
            if (pagedRecipes.length > 0) {
                list.innerHTML = pagedRecipes.map(createRecipeCard).join("");
            } else if (totalRecipes > 0) {
                // Recipes exist, but this page is empty (should not happen with correct currentPage adjustment)
                list.innerHTML = '<div class="alert alert-info text-center col-12">No recipes on this page.</div>';
            }
            // If totalRecipes is 0, renderRecipesPaged handles the "no recipes found" message.
        }

        // Render pagination controls (Previous, page numbers, Next).
        let html = "";
        if (totalPages > 1) {
            // Only show pagination if more than one page.
            html += `<li class="page-item${
                currentPage === 1 ? " disabled" : ""
            }"><a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a></li>`;

            // Logic for displaying page numbers (e.g., with ellipses for many pages)
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            if (currentPage <= 3) endPage = Math.min(totalPages, 5);
            if (currentPage > totalPages - 3) startPage = Math.max(1, totalPages - 4);

            if (startPage > 1) {
                html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
                if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }

            for (let i = startPage; i <= endPage; i++) {
                html += `<li class="page-item${
                    i === currentPage ? " active" : ""
                }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1)
                    html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
            }
            html += `<li class="page-item${
                currentPage === totalPages ? " disabled" : ""
            }"><a class="page-link" href="#" data-page="${currentPage + 1}">Next</a></li>`;
        }
        paginationContainer.innerHTML = html;
    }

    // Event listener for pagination controls.
    if (paginationContainer) {
        paginationContainer.addEventListener("click", function (e) {
            e.preventDefault(); // Prevent default link behavior.
            const target = e.target as HTMLElement;
            // Check if a page link was clicked.
            if (target.tagName === "A" && target.hasAttribute("data-page")) {
                const page = parseInt(target.getAttribute("data-page")!);
                const totalPages = Math.ceil(lastFetchedRecipes.length / recipesPerPage) || 1;
                // Ensure the requested page is valid.
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    currentPage = page;
                    updatePagination(); // Re-render for the new page.
                    // Scroll to the top of the recipe list after pagination
                    const recipeListElement = document.getElementById("recipe-list-section"); // Assuming you have a section/div wrapping the list
                    if (recipeListElement) {
                        recipeListElement.scrollIntoView({ behavior: "smooth" });
                    }
                }
            }
        });
    }

    // Event listener for the "recipes per page" dropdown.
    if (paginationDropdown) {
        paginationDropdown.addEventListener("change", function () {
            recipesPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page.
            updatePagination(); // Update display with new items per page.
        });
    }

    // Patch the original `renderRecipes` function to use `renderRecipesPaged` for pagination.
    renderRecipes = renderRecipesPaged;

    // --- FEATURED RECIPES LOGIC (Typically for sidebars or special sections) ---
    // Renders a list of featured recipes.
    function renderFeaturedRecipes(recipes: RecipeCardData[]): void {
        const container = document.getElementById("featured-recipes");
        if (!container) return;
        if (!recipes.length) {
            container.innerHTML = '<div class="alert alert-info p-2 small">No featured recipes found.</div>';
            return;
        }
        // HTML for each featured recipe item.
        container.innerHTML = recipes
            .map(
                (r) => `
            <a href="recipe-view.html?id=${r.id}" class="text-decoration-none text-dark">
                <div class="d-flex align-items-center justify-content-start mb-3 featured-recipe-card" style="cursor:pointer;">
                    <div class="rounded me-3" style="width: 80px; height: 80px; overflow: hidden;">
                        <img src="${getRecipeImage(r.id)}" class="img-fluid rounded h-100 w-100" alt="${
                    r.name
                }" style="object-fit: cover;" onerror="this.onerror=null; this.src='../assets/img/Food_Example_02-unsplash.jpg';">
                    </div>
                    <div>
                        <h6 class="mb-1 fw-semibold" style="font-size: 0.9rem;">${r.name}</h6>
                        <div class="d-flex align-items-center mb-1">
                            <span class="badge badge-difficulty-${r.difficulty} me-2 small">${capitalize(
                    r.difficulty
                )}</span>
                            <span class="small text-muted" style="font-size: 0.8rem;"><i class="far fa-clock me-1"></i>${
                                r.time
                            } min</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-star text-warning me-1 small"></i>
                            <span class="fw-bold small">${Number(r.ratings).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </a>
        `
            )
            .join("");
    }

    // Fetches and renders featured recipes (e.g., top 3 by rating).
    async function fetchAndRenderFeaturedRecipes(): Promise<void> {
        const container = document.getElementById("featured-recipes");
        if (!container) return;
        // Show a simple loading text or small spinner for featured recipes.
        container.innerHTML = '<div class="text-muted small p-2">Loading featured...</div>';
        try {
            // Example: Fetch recipes with a minimum rating of 4.5.
            const res = await fetch(`${apiBase}/recipes?minRating=4.5`); // Add limit
            if (!res.ok) throw new Error("Failed to fetch featured recipes");
            let recipes: RecipeCardData[] = await res.json();
            // Sort by rating (descending) and take the top 3.
            recipes = recipes.sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0)).slice(0, 3);
            renderFeaturedRecipes(recipes);
        } catch (e) {
            console.error("Error fetching featured recipes:", e);
            container.innerHTML = '<div class="alert alert-warning p-2 small">Could not load featured recipes.</div>';
        }
    }

    // --- INITIALIZATION AND EVENT LISTENERS ---
    document.addEventListener("DOMContentLoaded", () => {
        // Check for a 'query' parameter in the URL on page load.
        const url = new URL(window.location.href);
        const queryFromUrl = url.searchParams.get("query");
        const filterSidebarSearchInput = document.querySelector(
            '.col-xl-3 .input-group input[type="search"]'
        ) as HTMLInputElement | null;

        if (queryFromUrl && queryFromUrl.trim() !== "") {
            // If there's a query in the URL, fetch and render recipes based on it.
            // Also, populate the search input field in the filter sidebar.
            if (filterSidebarSearchInput) {
                filterSidebarSearchInput.value = queryFromUrl;
            }
            // And populate other search inputs on the page if they exist
            document.querySelectorAll('input[type="search"]').forEach((input) => {
                if (input !== filterSidebarSearchInput) (input as HTMLInputElement).value = queryFromUrl;
            });
            fetchAndRenderRecipes(queryFromUrl); // Initial fetch based on URL query.
        } else {
            // If no query in URL, fetch all recipes (or default set).
            fetchAndRenderRecipes();
        }

        // Event listener for the main search input in the filter sidebar.
        if (filterSidebarSearchInput) {
            const filterSidebarSearchButton = filterSidebarSearchInput
                .closest(".input-group")
                ?.querySelector(".input-group-text");

            const triggerSearch = () => {
                const query = filterSidebarSearchInput.value.trim();
                // Update other search bars on the page to match this one.
                document.querySelectorAll('input[type="search"]').forEach((input) => {
                    if (input !== filterSidebarSearchInput) (input as HTMLInputElement).value = query;
                });
                fetchAndRenderRecipes(query); // Fetch based on this search input.
            };

            filterSidebarSearchInput.addEventListener("keydown", (e) => {
                if ((e as KeyboardEvent).key === "Enter") {
                    e.preventDefault();
                    triggerSearch();
                }
            });
            if (filterSidebarSearchButton) {
                filterSidebarSearchButton.addEventListener("click", triggerSearch);
            }
        }

        // Event listener for the search button in the global search modal.
        const modalSearchBtn = document.querySelector("#searchModal .input-group-text");
        const modalSearchInput = document.querySelector('#searchModal input[type="search"]') as HTMLInputElement | null;
        if (modalSearchBtn && modalSearchInput) {
            modalSearchBtn.addEventListener("click", () => {
                const query = modalSearchInput.value.trim();
                if (filterSidebarSearchInput) filterSidebarSearchInput.value = query; // Sync sidebar search
                document.querySelectorAll('input[type="search"]').forEach((input) => {
                    (input as HTMLInputElement).value = query;
                });
                fetchAndRenderRecipes(query);
                // Close the modal after search if you have a Bootstrap modal instance
                // Example: bootstrap.Modal.getInstance(document.getElementById('searchModal'))?.hide();
            });
            modalSearchInput.addEventListener("keydown", (e) => {
                if ((e as KeyboardEvent).key === "Enter") {
                    e.preventDefault();
                    modalSearchBtn.dispatchEvent(new Event("click")); // Trigger click on button
                }
            });
        }

        // Event listener for "Apply Filters" button.
        const applyFiltersBtn = document.getElementById("applyFiltersBtn");
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const filters = collectRecipeFilters();
                fetchAndRenderRecipesWithFilters(filters);
            });
        }

        // Event listener for "Clear All" filters button.
        const clearFiltersBtn = document.getElementById("clearFiltersBtn"); // Assuming ID for clear button
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener("click", (e) => {
                e.preventDefault();
                // Uncheck all filter checkboxes.
                document
                    .querySelectorAll('input[type="checkbox"]')
                    .forEach((cb) => ((cb as HTMLInputElement).checked = false));
                // Reset difficulty radio to 'any'.
                const diffAny = document.getElementById("diff-any") as HTMLInputElement | null;
                if (diffAny) diffAny.checked = true;
                // Reset rating range slider and its display.
                const ratingRange = document.getElementById("ratingRange") as HTMLInputElement | null;
                const ratingValueDisplay = document.getElementById("ratingValue");
                if (ratingRange) {
                    ratingRange.value = ratingRange.min || "1";
                    if (ratingValueDisplay) ratingValueDisplay.textContent = `${ratingRange.value} ★`;
                }
                // Reset time range slider and its display.
                const timeRange = document.getElementById("timeRange") as HTMLInputElement | null;
                const timeValueDisplay = document.getElementById("timeValue");
                if (timeRange) {
                    timeRange.value = timeRange.defaultValue || timeRange.max || "120"; // Reset to default or max
                    if (timeValueDisplay) timeValueDisplay.textContent = `${timeRange.value} min`;
                }
                // Clear min/max calorie inputs.
                const minCalInput = document.getElementById("minCalories") as HTMLInputElement | null;
                if (minCalInput) minCalInput.value = "";
                const maxCalInput = document.getElementById("maxCalories") as HTMLInputElement | null;
                if (maxCalInput) maxCalInput.value = "";

                // Clear ingredient input and tags.
                const ingInput = document.getElementById("ingredientInput") as HTMLInputElement | null;
                if (ingInput) ingInput.value = "";

                const ingredientTagsContainer = document.getElementById("ingredientTags");
                if (ingredientTagsContainer) ingredientTagsContainer.innerHTML = "";
                // Deselect all tag badges.
                document
                    .querySelectorAll("#tagsCollapse .badge.bg-secondary.selected")
                    .forEach((badge) => badge.classList.remove("selected"));
                // Clear search input field(s).
                document
                    .querySelectorAll('input[type="search"]')
                    .forEach((input) => ((input as HTMLInputElement).value = ""));

                // Reset sorting dropdown to "none" or default
                if (sortingDropdown) sortingDropdown.value = "none";

                // Fetch all recipes (no filters, default sort).
                fetchAndRenderRecipesWithFilters({});
            });
        }

        // Event listener for tag selection in the filter sidebar.
        const tagBadgesContainer = document.getElementById("tagsCollapse");
        if (tagBadgesContainer) {
            tagBadgesContainer.addEventListener("click", function (e) {
                const target = e.target as HTMLElement;
                if (target.classList.contains("badge")) {
                    // Check if a badge was clicked
                    target.classList.toggle("selected"); // Toggle 'selected' class for styling.
                }
            });
        }

        // Event listener for the sorting dropdown.
        if (sortingDropdown) {
            sortingDropdown.addEventListener("change", (e) => {
                const value = (e.target as HTMLSelectElement).value;
                sortAndRenderRecipes(value); // Sort and re-render based on new selection.
            });
        }

        // Patch fetchAndRenderRecipes and fetchAndRenderRecipesWithFilters
        // to re-apply sorting after new data is fetched.
        const originalFetchAndRenderRecipes = fetchAndRenderRecipes;
        fetchAndRenderRecipes = async function (query?: string) {
            await originalFetchAndRenderRecipes(query); // Call original fetch logic.
            if (sortingDropdown && sortingDropdown.value !== "none") {
                // Re-apply sort if not "none"
                sortAndRenderRecipes(sortingDropdown.value);
            } else if (sortingDropdown && sortingDropdown.value === "none") {
                // If "none", ensure lastFetchedRecipes (from the fetch) is used directly by pagination
                renderRecipes(lastFetchedRecipes); // This calls renderRecipesPaged
            }
        };

        const originalFetchAndRenderRecipesWithFilters = fetchAndRenderRecipesWithFilters;
        fetchAndRenderRecipesWithFilters = async function (filters?: Record<string, any>) {
            await originalFetchAndRenderRecipesWithFilters(filters); // Call original fetch logic.
            if (sortingDropdown && sortingDropdown.value !== "none") {
                // Re-apply sort if not "none"
                sortAndRenderRecipes(sortingDropdown.value);
            } else if (sortingDropdown && sortingDropdown.value === "none") {
                renderRecipes(lastFetchedRecipes);
            }
        };

        // Fetch and render featured recipes for the sidebar.
        fetchAndRenderFeaturedRecipes();

        // Initialize range slider value displays
        const ratingRangeInput = document.getElementById("ratingRange") as HTMLInputElement;
        const ratingValueSpan = document.getElementById("ratingValue");
        if (ratingRangeInput && ratingValueSpan) {
            ratingValueSpan.textContent = `${ratingRangeInput.value} ★`;
            ratingRangeInput.addEventListener("input", () => {
                ratingValueSpan.textContent = `${ratingRangeInput.value} ★`;
            });
        }

        const timeRangeInput = document.getElementById("timeRange") as HTMLInputElement;
        const timeValueSpan = document.getElementById("timeValue");
        if (timeRangeInput && timeValueSpan) {
            timeValueSpan.textContent = `${timeRangeInput.value} min`;
            timeRangeInput.addEventListener("input", () => {
                timeValueSpan.textContent = `${timeRangeInput.value} min`;
            });
        }
    });

    // Make functionality accessible from outside the namespace if needed
    (window as any).RecipesDynamic = {
        fetchAndRenderRecipes,
        fetchAndRenderRecipesWithFilters,
        fetchAndRenderFeaturedRecipes
    };
}
