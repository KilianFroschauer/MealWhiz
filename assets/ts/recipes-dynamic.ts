// Minimal interface for recipe cards (search results)
interface RecipeCardData {
    id: number;
    name: string;
    time: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ratings?: number;
}

function getRecipeImage(name: string): string {
    // Placeholder logic: use a default image for now
    return '../assets/img/Food_Example_06-unsplash.jpg';
}

function createRecipeCard(recipe: RecipeCardData): string {
    const difficultyClass = `badge-difficulty-${recipe.difficulty}`;
    const imageUrl = getRecipeImage(recipe.name); // Always returns placeholder for now
    // Convert ratings to number if it's a string
    const ratingValue = recipe.ratings !== undefined ? Number(recipe.ratings) : undefined;
    return `
    <div class="col-md-6 col-lg-6 col-xl-4">
      <a href="recipe-view.html?id=${recipe.id}" class="text-decoration-none">
        <div class="rounded position-relative food-item">
          <div class="food-img">
            <img src="${imageUrl}" class="img-fluid w-100 rounded-top" alt="${recipe.name}">
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

function renderRecipes(recipes: RecipeCardData[]): void {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    list.innerHTML = recipes.map(createRecipeCard).join('');
}

function setLoadingState(isLoading: boolean): void {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    if (isLoading) {
        list.innerHTML = '<div class="text-center w-100 py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    }
}

async function fetchAndRenderRecipes(query?: string): Promise<void> {
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
                fetchAndRenderRecipes((event.target as HTMLInputElement).value);
            }
        });
    });
    // Modal search button
    const modalSearchBtn = document.querySelector('#searchModal .input-group-text');
    if (modalSearchBtn) {
        modalSearchBtn.addEventListener('click', () => {
            const modalInput = document.querySelector('#searchModal input[type="search"]') as HTMLInputElement;
            if (modalInput) fetchAndRenderRecipes(modalInput.value);
        });
    }
    // Main page search button
    const mainSearchBtn = document.querySelector('.input-group .input-group-text');
    if (mainSearchBtn) {
        mainSearchBtn.addEventListener('click', () => {
            const mainInput = document.querySelector('.input-group input[type="search"]') as HTMLInputElement;
            if (mainInput) fetchAndRenderRecipes(mainInput.value);
        });
    }
});