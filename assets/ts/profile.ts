namespace ProfilePage {
    const apiBase: string = (typeof MealWhizConfig !== 'undefined' ? 
                            MealWhizConfig.apiBaseURL : 
                            'https://mealhwiz.at:3000');

    // Define types for our data structures
    interface User {
        username?: string;
        email?: string;
        bio?: string;
        joinDate?: string;
    }

    interface Recipe {
        id: number;
        name: string;
        difficulty: 'easy' | 'medium' | 'hard';
        time: number;
    }

    interface UserUpdateData {
        username: string;
        email: string;
        bio?: string;
        password?: string;
    }

    // Initialize page on load
    document.addEventListener("DOMContentLoaded", function () {
        // Hide spinner once page is loaded
        const spinner = document.querySelector("#spinner");
        if (spinner) {
            spinner.classList.remove("show");
        }

        // Check for login token
        const token = localStorage.getItem("accessToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        // Load user data
        loadUserData();

        // Call updateCartCount - note: this function needs to be exported from AuthNav namespace
        // For now, we'll assume it's accessible through the namespace
        AuthNav.updateCartCount();

        // Load favorite recipes
        loadFavoriteRecipes();
    });

    /**
     * Fetches and displays user profile data
     */
    async function loadUserData(): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            const res = await fetch(`${apiBase}/users/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const user: User = await res.json();
                const usernameDisplay = document.getElementById("username-display");
                if (usernameDisplay) {
                    usernameDisplay.textContent = user.username || "User";
                }

                // Set other user data if available
                if (user.joinDate) {
                    const joinDate = new Date(user.joinDate);
                    const memberSinceElement = document.getElementById("member-since");
                    if (memberSinceElement) {
                        memberSinceElement.textContent = joinDate.getFullYear().toString();
                    }
                }

                // Pre-fill settings form
                const displayNameInput = document.getElementById("display-name") as HTMLInputElement | null;
                const emailInput = document.getElementById("email") as HTMLInputElement | null;
                const bioInput = document.getElementById("bio") as HTMLTextAreaElement | null;

                if (displayNameInput) displayNameInput.value = user.username || "";
                if (emailInput) emailInput.value = user.email || "";
                if (bioInput) bioInput.value = user.bio || "";
            } else {
                showNotification("Could not load user data", true);
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            showNotification("Error connecting to server", true);
        }
    }

    /**
     * Shows the settings section
     */
    function openSettings(): void {
        const settingsSection = document.getElementById("settings-section");
        if (settingsSection) {
            settingsSection.style.display = "block";
            // Smooth scroll to settings section
            window.scrollTo({
                top: settingsSection.offsetTop - 100, // Offset to account for fixed header
                behavior: "smooth"
            });
        }
    }

    /**
     * Scrolls to the favorites section
     */
    function scrollToFavorites(): void {
        // Smooth scroll to favorites section
        const favoritesSection = document.getElementById("my-favorites-section");
        if (favoritesSection) {
            // favoritesSection.scrollIntoView({ behavior: "smooth" });
            window.scrollTo({
                top: favoritesSection.offsetTop - 100, // Offset to account for fixed header
                behavior: "smooth"
            });
        }
    }

    /**
     * Hides the settings section
     */
    function closeSettings(): void {
        const settingsSection = document.getElementById("settings-section");
        if (settingsSection) {
            settingsSection.style.display = "none";
        }
    }

    /**
     * Saves user settings from form data
     */
    async function saveSettings(): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const displayNameInput = document.getElementById("display-name") as HTMLInputElement;
        const emailInput = document.getElementById("email") as HTMLInputElement;
        const bioInput = document.getElementById("bio") as HTMLTextAreaElement;
        const newPasswordInput = document.getElementById("new-password") as HTMLInputElement;
        const confirmPasswordInput = document.getElementById("confirm-password") as HTMLInputElement;

        if (!displayNameInput || !emailInput || !bioInput || !newPasswordInput || !confirmPasswordInput) {
            showNotification("Form elements not found", true);
            return;
        }

        const username = displayNameInput.value;
        const email = emailInput.value;
        const bio = bioInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Basic validation
        if (newPassword && newPassword !== confirmPassword) {
            showNotification("Passwords do not match", true);
            return;
        }

        const userData: UserUpdateData = {
            username,
            email,
            bio,
        };

        if (newPassword) {
            userData.password = newPassword;
        }

        try {
            const res = await fetch(`${apiBase}/users/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            if (res.ok) {
                showNotification("Settings updated successfully");
                closeSettings();
                loadUserData(); // Refresh displayed user data
            } else {
                const error = await res.text();
                showNotification(`Failed to update settings: ${error}`, true);
            }
        } catch (error) {
            console.error("Error updating user settings:", error);
            showNotification("Error connecting to server", true);
        }
    }

    /**
     * Shows a notification message
     * @param message - The message to display
     * @param isError - Whether this is an error message
     */
    function showNotification(message: string, isError: boolean = false): void {
        // Create notification element if it doesn't exist
        let notification = document.getElementById("notification");
        if (!notification) {
            notification = document.createElement("div");
            notification.id = "notification";
            notification.style.position = "fixed";
            notification.style.bottom = "20px";
            notification.style.right = "20px";
            notification.style.padding = "15px 25px";
            notification.style.borderRadius = "5px";
            notification.style.zIndex = "9999";
            notification.style.transition = "opacity 0.5s";
            document.body.appendChild(notification);
        }

        // Set colors based on type
        notification.style.backgroundColor = isError ? "#dc3545" : "#28a745";
        notification.style.color = "white";

        // Set message and show
        notification.textContent = message;
        notification.style.opacity = "1";

        // Hide after 3 seconds
        setTimeout(() => {
            if (notification) { // Add null check to fix the error
                notification.style.opacity = "0";
            }
        }, 3000);
    }

    /**
     * Loads and displays the user's favorite recipes
     */
    async function loadFavoriteRecipes(): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            const response = await fetch(`${apiBase}/users/favorites`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load favorites");
            }

            const favorites: Recipe[] = await response.json();
            const container = document.getElementById("favorite-recipes");

            if (!container) return;

            if (favorites.length === 0) {
                container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p>You haven't saved any favorite recipes yet.</p>
                    <a href="recipes.html" class="btn btn-primary">Browse Recipes</a>
                </div>
            `;
                return;
            }

            container.innerHTML = favorites
                .map(
                    (recipe) => `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="rounded position-relative fruite-item">
                    <div class="fruite-img">
                        <img src="../assets/img/recipe_imgs/${recipe.id}.jpg" class="img-fluid w-100 rounded-top" alt="${recipe.name}" 
                            onerror="this.onerror=null;this.src='../assets/img/recipe_placeholder.jpg';">
                    </div>
                    <div class="text-white bg-secondary px-3 py-1 rounded position-absolute" style="top: 10px; left: 10px;">${recipe.difficulty}</div>
                    <div class="p-4 border border-secondary border-top-0 rounded-bottom">
                        <h4>${recipe.name}</h4>
                        <div class="d-flex justify-content-between flex-lg-wrap">
                            <p class="text-dark fs-5 fw-bold mb-0">
                                <i class="far fa-clock text-primary me-1"></i> ${recipe.time} min
                            </p>
                            <div class="d-flex align-items-center">
                                <a href="recipe-view.html?id=${recipe.id}" class="btn border border-secondary rounded-pill px-3 text-primary">
                                    <i class="fa fa-eye me-2"></i> View Recipe
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
                )
                .join("");
        } catch (error) {
            console.error("Error loading favorites:", error);
            const container = document.getElementById("favorite-recipes");
            if (container) {
                container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">Error loading favorite recipes.</p>
                </div>
            `;
            }
        }
    }

    // Make functions accessible to HTML event handlers
    (window as any).openSettings = openSettings;
    (window as any).scrollToFavorites = scrollToFavorites;
    (window as any).closeSettings = closeSettings;
    (window as any).saveSettings = saveSettings;
    // Expose logout from AuthNav namespace
    (window as any).logout = AuthNav.logout;
}