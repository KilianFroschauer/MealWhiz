// Minimal interface for recipe cards (search results)
interface RecipeCardData {
    id: number;
    name: string;
    time: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ratings?: number;
}

function getRecipeImage(id: number): string {
    // Use the recipe-specific image if available
    return `../assets/img/recipe_imgs/${id}.jpg`;
}

function createRecipeCard(recipe: RecipeCardData): string {
    const difficultyClass = `badge-difficulty-${recipe.difficulty}`;
    const imageUrl = getRecipeImage(recipe.id);
    // Convert ratings to number if it's a string
    const ratingValue = recipe.ratings !== undefined ? Number(recipe.ratings) : undefined;
    // Add a skeleton overlay that will be removed on image load
    return `
    <div class="col-md-6 col-lg-6 col-xl-4">
      <a href="recipe-view.html?id=${recipe.id}" class="text-decoration-none">
        <div class="rounded position-relative food-item card-has-skeleton">
          <div class="food-img position-relative">
            <img src="${imageUrl}" class="img-fluid w-100 rounded-top recipe-img-loading" alt="${recipe.name}" loading="lazy" onload="this.parentElement.querySelector('.skeleton-img-overlay')?.classList.add('d-none'); this.classList.remove('recipe-img-loading'); this.closest('.card-has-skeleton')?.classList.remove('card-has-skeleton');">
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
                <span class="fw-bold text-dark">${ratingValue !== undefined && !isNaN(ratingValue) ? ratingValue.toFixed(1) : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
    `;
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Add sorting functionality for the dropdown
const sortingDropdown = document.getElementById('recipe-sorting') as HTMLSelectElement | null;
let lastFetchedRecipes: RecipeCardData[] = [];

// Patch renderRecipes to save last fetched recipes
let renderRecipes = function(recipes: RecipeCardData[]): void {
    lastFetchedRecipes = recipes.slice();
    const list = document.getElementById('recipe-list');
    if (!list) return;
    list.innerHTML = recipes.map(createRecipeCard).join('');
}

function sortAndRenderRecipes(sortType: string) {
    if (!lastFetchedRecipes.length) return;
    let sorted: RecipeCardData[] = lastFetchedRecipes.slice();
    if (sortType === 'rating') {
        // Ratings descending
        sorted.sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0));
    } else if (sortType === 'alpha') {
        // Alphabetically by name
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'none') {
        // No sorting, original order
        sorted = lastFetchedRecipes.slice();
    }
    renderRecipes(sorted);
}

function setLoadingState(isLoading: boolean): void {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    if (isLoading) {
        // Render 6 skeleton cards
        list.innerHTML = Array(6).fill('').map(() => `
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
        `).join('');
    }
}

// Helper: Collect filter values from the sidebar and build query params
function collectRecipeFilters(): Record<string, any> {
    const filters: Record<string, any> = {};
    // Name (search bar at top left)
    const nameInput = document.querySelector('.input-group input[type="search"]') as HTMLInputElement;
    if (nameInput && nameInput.value.trim() !== '') {
        filters.name = nameInput.value.trim();
    }
    // Dietary Preferences (dp-*)
    const dpChecked = Array.from(document.querySelectorAll('input[id^="dp-"]:checked')) as HTMLInputElement[];
    if (dpChecked.length) {
        filters.dp = dpChecked.map(cb => cb.id.replace('dp-', ''));
    }
    // Allergens (allergy-*)
    const aChecked = Array.from(document.querySelectorAll('input[id^="allergy-"]:checked')) as HTMLInputElement[];
    if (aChecked.length) {
        filters.a = aChecked.map(cb => cb.id.replace('allergy-', ''));
    }
    // Meal Times (meal-*)
    const mtChecked = Array.from(document.querySelectorAll('input[id^="meal-"]:checked')) as HTMLInputElement[];
    if (mtChecked.length) {
        filters.mt = mtChecked.map(cb => cb.id.replace('meal-', ''));
    }
    // Difficulty (radio)
    const diffRadio = document.querySelector('input[name="difficulty"]:checked') as HTMLInputElement;
    if (diffRadio && diffRadio.value !== 'any') {
        filters.diff = diffRadio.value;
    }
    // Minimum Rating (range)
    const ratingRange = document.getElementById('ratingRange') as HTMLInputElement;
    if (ratingRange && ratingRange.value) {
        filters.minRating = ratingRange.value;
    }
    // Max Preparation Time (range)
    const timeRange = document.getElementById('timeRange') as HTMLInputElement;
    if (timeRange && timeRange.value) {
        filters.maxTime = timeRange.value;
    }
    // Calories (min/max)
    const minCal = (document.getElementById('minCalories') as HTMLInputElement)?.value;
    const maxCal = (document.getElementById('maxCalories') as HTMLInputElement)?.value;
    if (minCal) filters.minCal = minCal;
    if (maxCal) filters.maxCal = maxCal;
    // Ingredients (comma separated from tags)
    const ingredientTags = Array.from(document.querySelectorAll('#ingredientTags .ingredient-tag')) as HTMLElement[];
    if (ingredientTags.length) {
        filters.ing = ingredientTags.map(tag => tag.textContent?.trim() || '').filter(Boolean);
    } else {
        // fallback: single input
        const ingInput = document.getElementById('ingredientInput') as HTMLInputElement;
        if (ingInput && ingInput.value.trim() !== '') {
            filters.ing = [ingInput.value.trim()];
        }
    }
    // Tags (from .badge.bg-secondary in #tagsCollapse)
    const tagBadges = Array.from(document.querySelectorAll('#tagsCollapse .badge.bg-secondary.selected')) as HTMLElement[];
    if (tagBadges.length) {
        filters.tags = tagBadges.map(b => b.textContent?.trim().toLowerCase() || '').filter(Boolean);
    }
    return filters;
}

// Helper: Build query string from filter object
function buildRecipeQueryString(filters: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (Array.isArray(filters[key])) {
            params.append(key, filters[key].join(','));
        } else {
            params.append(key, filters[key]);
        }
    }
    return params.toString();
}

// Overload fetchAndRenderRecipes to accept filters
let fetchAndRenderRecipesWithFilters = async function(filters?: Record<string, any>): Promise<void> {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    setLoadingState(true);
    try {
        let url = 'http://localhost:3000/recipes';
        if (filters && Object.keys(filters).length > 0) {
            url += '?' + buildRecipeQueryString(filters);
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch recipes');
        const recipes: RecipeCardData[] = await res.json();
        renderRecipes(recipes);
    } catch (err) {
        list.innerHTML = '<div class="alert alert-danger">Could not load recipes.</div>';
    }
};

let fetchAndRenderRecipes = async function(query?: string): Promise<void> {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    setLoadingState(true);
    try {
        let url = query && query.trim() !== ''
            ? 'http://localhost:3000/recipes/search?query=' + encodeURIComponent(query)
            : 'http://localhost:3000/recipes';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch recipes');
        const recipes: RecipeCardData[] = await res.json();
        renderRecipes(recipes);
    } catch (err) {
        list.innerHTML = '<div class="alert alert-danger">Could not load recipes.</div>';
    }
};

// --- PAGINATION LOGIC ---
let currentPage = 1;
let recipesPerPage = 9;
const paginationDropdown = document.getElementById('recipes-per-page') as HTMLSelectElement | null;
const paginationContainer = document.getElementById('recipe-pagination');

function renderRecipesPaged(recipes: RecipeCardData[]): void {
    lastFetchedRecipes = recipes.slice();
    updatePagination();
}

function updatePagination(): void {
    if (!paginationContainer) return;
    const totalRecipes = lastFetchedRecipes.length;
    const totalPages = Math.ceil(totalRecipes / recipesPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    // Render only the recipes for the current page
    const startIdx = (currentPage - 1) * recipesPerPage;
    const endIdx = startIdx + recipesPerPage;
    const pagedRecipes = lastFetchedRecipes.slice(startIdx, endIdx);
    const list = document.getElementById('recipe-list');
    if (list) list.innerHTML = pagedRecipes.map(createRecipeCard).join('');
    // Render pagination controls
    let html = '';
    html += `<li class="page-item${currentPage === 1 ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item${currentPage === totalPages ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Next</a></li>`;
    paginationContainer.innerHTML = html;
}

if (paginationContainer) {
    paginationContainer.addEventListener('click', function(e) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' && target.hasAttribute('data-page')) {
            e.preventDefault();
            const page = parseInt(target.getAttribute('data-page')!);
            if (!isNaN(page) && page >= 1 && page <= Math.ceil(lastFetchedRecipes.length / recipesPerPage)) {
                currentPage = page;
                updatePagination();
            }
        }
    });
}
if (paginationDropdown) {
    paginationDropdown.addEventListener('change', function() {
        recipesPerPage = parseInt(this.value);
        currentPage = 1;
        updatePagination();
    });
}
// Patch renderRecipes to use pagination
renderRecipes = renderRecipesPaged;

// --- FEATURED RECIPES LOGIC ---
function renderFeaturedRecipes(recipes: RecipeCardData[]): void {
    const container = document.getElementById('featured-recipes');
    if (!container) return;
    if (!recipes.length) {
        container.innerHTML = '<div class="alert alert-info">No featured recipes found.</div>';
        return;
    }
    container.innerHTML = recipes.map(r => `
        <a href="recipe-view.html?id=${r.id}" class="text-decoration-none text-dark">
            <div class="d-flex align-items-center justify-content-start mb-3 featured-recipe-card" style="cursor:pointer;">
                <div class="rounded me-3" style="width: 80px; height: 80px; overflow: hidden;">
                    <img src="${getRecipeImage(r.id)}" class="img-fluid rounded" alt="${r.name}">
                </div>
                <div>
                    <h6 class="mb-1">${r.name}</h6>
                    <div class="d-flex align-items-center mb-1">
                        <span class="badge badge-difficulty-${r.difficulty} me-2">${capitalize(r.difficulty)}</span>
                        <span class="small text-muted"><i class="far fa-clock me-1"></i>${r.time} min</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-star text-warning me-1"></i>
                        <span class="fw-bold">${Number(r.ratings).toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </a>
    `).join('');
}

async function fetchAndRenderFeaturedRecipes(): Promise<void> {
    const container = document.getElementById('featured-recipes');
    if (!container) return;
    container.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
    try {
        // Fetch top 3 recipes by rating (or random if you prefer)
        const res = await fetch('http://localhost:3000/recipes?minRating=4.5');
        if (!res.ok) throw new Error('Failed to fetch featured recipes');
        let recipes: RecipeCardData[] = await res.json();
        // Sort by rating descending, take top 3
        recipes = recipes.sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0)).slice(0, 3);
        renderFeaturedRecipes(recipes);
    } catch (e) {
        container.innerHTML = '<div class="alert alert-danger">Could not load featured recipes.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check for ?query=... in URL
    const url = new URL(window.location.href);
    const query = url.searchParams.get('query');
    if (query && query.trim() !== '') {
        fetchAndRenderRecipes(query);
        // Optionally, set the search input value to the query
        document.querySelectorAll('input[type="search"]').forEach(input => {
            (input as HTMLInputElement).value = query;
        });
    } else {
        fetchAndRenderRecipes();
    }

    // Search form connection
    const searchInputs = document.querySelectorAll('.input-group input[type="search"]');
    searchInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            const event = e as KeyboardEvent;
            if (event.key === 'Enter') {
                event.preventDefault();
                const value = (event.target as HTMLInputElement).value;
                // Set all sidebar search inputs to this value
                searchInputs.forEach(inp => (inp as HTMLInputElement).value = value);
                fetchAndRenderRecipes(value);
            }
        });
    });
    // Modal search button
    const modalSearchBtn = document.querySelector('#searchModal .input-group-text');
    if (modalSearchBtn) {
        modalSearchBtn.addEventListener('click', () => {
            const modalInput = document.querySelector('#searchModal input[type="search"]') as HTMLInputElement;
            if (modalInput) {
                // Set all sidebar search inputs to this value
                searchInputs.forEach(inp => (inp as HTMLInputElement).value = modalInput.value);
                fetchAndRenderRecipes(modalInput.value);
            }
        });
    }
    // Main page search button
    const mainSearchBtn = document.querySelector('.input-group .input-group-text');
    if (mainSearchBtn) {
        mainSearchBtn.addEventListener('click', () => {
            const mainInput = document.querySelector('.input-group input[type="search"]') as HTMLInputElement;
            if (mainInput) {
                // Set all sidebar search inputs to this value
                searchInputs.forEach(inp => (inp as HTMLInputElement).value = mainInput.value);
                fetchAndRenderRecipes(mainInput.value);
            }
        });
    }
    // Add event listener for the right-side search button below "Recipes Collection"
    const rightSideSearchBtn = document.querySelector('.col-xl-3 .input-group .input-group-text');
    const rightSideSearchInput = document.querySelector('.col-xl-3 .input-group input[type="search"]') as HTMLInputElement | null;
    if (rightSideSearchBtn && rightSideSearchInput) {
        rightSideSearchBtn.addEventListener('click', () => {
            const query = rightSideSearchInput.value.trim();
            if (query.length > 0) {
                // Set all sidebar search inputs to this value
                document.querySelectorAll('.input-group input[type="search"]').forEach(inp => (inp as HTMLInputElement).value = query);
                fetchAndRenderRecipes(query);
            }
        });
    }
    // Add event listener for Apply Filters button
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const filters = collectRecipeFilters();
            fetchAndRenderRecipesWithFilters(filters);
        });
    }
    // Add event listener for Clear All button
    const clearBtn = document.querySelector('.btn.btn-outline-secondary.px-4');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Uncheck all checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb as HTMLInputElement).checked = false);
            // Reset difficulty radio to 'Any'
            const diffAny = document.getElementById('diff-any') as HTMLInputElement;
            if (diffAny) diffAny.checked = true;
            // Reset rating range
            const ratingRange = document.getElementById('ratingRange') as HTMLInputElement;
            const ratingValue = document.getElementById('ratingValue');
            if (ratingRange) {
                ratingRange.value = ratingRange.min || '1';
                if (ratingValue) ratingValue.textContent = ratingRange.value + ' ★';
            }
            // Reset time range
            const timeRange = document.getElementById('timeRange') as HTMLInputElement;
            const timeValue = document.getElementById('timeValue');
            if (timeRange) {
                timeRange.value = timeRange.defaultValue || timeRange.min || '10';
                if (timeValue) timeValue.textContent = timeRange.value + ' min';
            }
            // Clear min/max calories
            const minCal = document.getElementById('minCalories') as HTMLInputElement;
            const maxCal = document.getElementById('maxCalories') as HTMLInputElement;
            if (minCal) minCal.value = '';
            if (maxCal) maxCal.value = '';
            // Clear ingredient input and tags
            const ingInput = document.getElementById('ingredientInput') as HTMLInputElement;
            if (ingInput) ingInput.value = '';
            const ingredientTags = document.getElementById('ingredientTags');
            if (ingredientTags) ingredientTags.innerHTML = '';
            // Deselect all tag badges
            document.querySelectorAll('#tagsCollapse .badge.bg-secondary.selected').forEach(badge => badge.classList.remove('selected'));
            // Clear search input(s)
            document.querySelectorAll('.input-group input[type="search"]').forEach(input => (input as HTMLInputElement).value = '');
            // Fetch all recipes (no filters)
            fetchAndRenderRecipesWithFilters({});
        });
    }
    // Tag selection for tags filter (toggle selected class)
    const tagBadges = document.querySelectorAll('#tagsCollapse .badge.bg-secondary');
    tagBadges.forEach(badge => {
        badge.addEventListener('click', function (this: HTMLElement) {
            this.classList.toggle('selected');
        });
    });

    if (sortingDropdown) {
        sortingDropdown.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            sortAndRenderRecipes(value);
        });
    }
    // Patch fetchAndRenderRecipes and fetchAndRenderRecipesWithFilters to re-sort after fetch
    const origFetchAndRenderRecipes = fetchAndRenderRecipes;
    fetchAndRenderRecipes = async function(query?: string) {
        await origFetchAndRenderRecipes(query);
        if (sortingDropdown) sortAndRenderRecipes(sortingDropdown.value);
    };
    const origFetchAndRenderRecipesWithFilters = fetchAndRenderRecipesWithFilters;
    fetchAndRenderRecipesWithFilters = async function(filters?: Record<string, any>) {
        await origFetchAndRenderRecipesWithFilters(filters);
        if (sortingDropdown) sortAndRenderRecipes(sortingDropdown.value);
    };
    fetchAndRenderFeaturedRecipes();
});