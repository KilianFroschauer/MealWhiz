/**
 * Authentication-aware navigation handler
 * Updates navigation elements based on login status
 */
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
    // Check if user is logged in with a valid token
    const isLoggedIn = await validateToken();
    
    // Determine if we're in the root directory or pages directory
    const isRootDirectory: boolean = window.location.pathname.endsWith('index.html') || 
                                    !window.location.pathname.includes('/pages/');
    
    // Find all user icon links - handle both root and pages directory paths
    const userIconLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
        'a[href="login.html"], a[href="profile.html"], ' +
        'a[href="pages/login.html"], a[href="pages/profile.html"]'
    );
    
    // Update each user icon link
    userIconLinks.forEach((link: HTMLAnchorElement): void => {
        // If logged in, point to profile; otherwise, point to login
        if (isRootDirectory) {
            // In root directory (index.html)
            link.href = isLoggedIn ? 'pages/profile.html' : 'pages/login.html';
        } else {
            // In pages directory
            link.href = isLoggedIn ? 'profile.html' : 'login.html';
        }
    });

    // Handle shopping cart link - should go to login if not logged in
    const cartLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.cart-icon');
    cartLinks.forEach((link: HTMLAnchorElement): void => {
        link.addEventListener('click', (e: MouseEvent): void => {
            if (!isLoggedIn) {
                e.preventDefault();
                window.location.href = isRootDirectory ? 'pages/login.html' : 'login.html';
            }
        });
    });
    
    // Update header UI based on login status
    updateHeaderUI(isLoggedIn);
});

/**
 * Validates the JWT token by checking:
 * 1. If it exists
 * 2. If it's not expired (by making a lightweight API call)
 * @returns Promise resolving to boolean indicating if token is valid
 */
async function validateToken(): Promise<boolean> {
    const token = localStorage.getItem('accessToken');
    
    // No token means not logged in
    if (!token) {
        return false;
    }
    
    // Check if token is valid by making a lightweight API call
    try {
        const apiBase: string = "http://localhost:3000";
        const response = await fetch(`${apiBase}/auth/validate-token`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // If response is OK, token is valid
        if (response.ok) {
            return true;
        }
        
        // If unauthorized response, token is expired or invalid
        if (response.status === 401) {
            console.log('Token expired or invalid. Logging out...');
            logout();
            return false;
        }
        
        // For other errors, assume token might be valid
        return true;
        
    } catch (error) {
        console.error('Error validating token:', error);
        // If network error, assume token is valid (to prevent logout when offline)
        return true;
    }
}

/**
 * Logs the user out by removing the token and redirecting
 */
function logout(): void {
    localStorage.removeItem('accessToken');
    
    // If we're on a protected page like profile, redirect to login
    const protectedPages = [
        '/profile.html',
        '/shopping_cart.html',
        '/pages/profile.html',
        '/pages/shopping_cart.html'
    ];
    
    const currentPath = window.location.pathname;
    if (protectedPages.some(page => currentPath.endsWith(page))) {
        const isRootDirectory = !currentPath.includes('/pages/');
        window.location.href = isRootDirectory ? 'pages/login.html' : 'login.html';
    }
}

/**
 * Updates the header UI elements based on login status
 * @param isLoggedIn - Whether the user is logged in
 */
function updateHeaderUI(isLoggedIn: boolean): void {
    // Elements to update based on login status
    const loginButton: HTMLElement | null = document.querySelector('.login-button');
    const profileLink: HTMLElement | null = document.querySelector('.profile-link');
    const cartCount: HTMLElement | null = document.getElementById('cart-count');
    
    // Update UI elements if they exist
    if (loginButton) {
        loginButton.style.display = isLoggedIn ? 'none' : 'inline-block';
    }
    
    if (profileLink) {
        profileLink.style.display = isLoggedIn ? 'inline-block' : 'none';
    }
    
    // Update cart count if logged in
    if (isLoggedIn && cartCount) {
        updateCartCount();
    }
}

/**
 * Fetches and updates the cart count
 */
async function updateCartCount(): Promise<void> {
    const token: string | null = localStorage.getItem('accessToken');
    if (!token) return;
    
    try {
        const apiBase: string = "http://localhost:3000";
        const res: Response = await fetch(`${apiBase}/cart`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const items: any[] = await res.json();
            const cartCount: HTMLElement | null = document.getElementById('cart-count');
            if (cartCount) {
                cartCount.textContent = items.length.toString();
            }
        } else if (res.status === 401) {
            // Token expired
            logout();
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}