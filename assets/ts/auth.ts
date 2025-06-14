// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\auth.ts
// This script handles user authentication, including login and registration.

namespace Auth {
    // Global API base URL with fallback if MealWhizConfig is not defined
    const apiBase: string = (typeof MealWhizConfig !== 'undefined' ? 
                            MealWhizConfig.apiBaseURL : 
                            'https://mealhwiz.at:3000');

    // Defines the structure of an authentication form, extending HTMLFormElement
    // to include specific input fields for username and password.
    type AuthForm = HTMLFormElement & {
        username: HTMLInputElement;
        password: HTMLInputElement;
        confirmPassword?: HTMLInputElement; // Added for registration form, make it optional
    };

    // Waits for the HTML document to be fully loaded before executing the script.
    document.addEventListener("DOMContentLoaded", () => {
        // Retrieves the login form element by its ID.
        const loginForm = document.getElementById("login-form") as AuthForm | null;
        // Retrieves the registration form element by its ID.
        const registerForm = document.getElementById("register-form") as AuthForm | null;

        // If the login form exists, add an event listener for its submission.
        if (loginForm) {
            loginForm.addEventListener("submit", async (e: Event) => {
                e.preventDefault(); // Prevents the default form submission behavior.
                // Gets the username and password values from the form inputs.
                const username = loginForm.username.value; // Assuming your form input for username is named 'username'
                const password = loginForm.password.value;
                console.log("Login attempt with credentials:", { username, password });

                // Sends a POST request to the /login endpoint with the credentials.
                const res = await fetch(`${apiBase}/login`, { // Ensure this path matches your backend route
                    method: "POST",
                    headers: { "Content-Type": "application/json" }, // Sets the content type to JSON.
                    // Ensure the body matches what your backend /login expects (e.g., email or username)
                    body: JSON.stringify({ username, password }), // Sending 'username' as 'email' if backend expects email
                    // Or change to { username: username, password } if backend expects username
                });

                if (!res.ok) {
                    const errorText = await res.text(); // Or res.json() if error response is JSON
                    alert(errorText); // Displays the server's error response.
                } else {
                    // Login was successful.
                    const data = await res.json(); // Parse the JSON response
                    console.log("Login successful. Response data:", data);

                    console.log("Access token received:", data.accessToken);

                    if (data.accessToken) {
                        console.log("Access token received:", data.accessToken);
                        localStorage.setItem('accessToken', data.accessToken); // Store the token
                        console.log("Access token stored in localStorage.");
                        // Optionally store userClaims or expiresAt if needed client-side
                        // localStorage.setItem('userClaims', JSON.stringify(data.userClaims));
                        // localStorage.setItem('tokenExpiresAt', data.expiresAt);

                        // Redirect to a protected page or the main page after successful login
                        // Replace "index.html" or "/dashboard.html" with the actual page you want to redirect to.
                        window.location.href = "/index.html"; // Or e.g., "/pages/dashboard.html" or just "/" if your server handles that
                    } else {
                        console.error("Login response did not include an accessToken.");
                        alert("Login successful, but no token received. Please contact support.");
                    }
                }
            });
        }

        // If the registration form exists, add an event listener for its submission.
        if (registerForm) {
            registerForm.addEventListener("submit", async (e: Event) => {
                e.preventDefault(); // Prevents the default form submission behavior.
                // Gets the username and password values from the form inputs.
                const username = registerForm.username.value;
                const password = registerForm.password.value;
                const confirmPassword = registerForm.confirmPassword?.value; // Get confirm password value

                // Check if passwords match
                if (password !== confirmPassword) {
                    alert("Passwords do not match!");
                    return; // Stop submission if passwords don't match
                }

                // Sends a POST request to the /register endpoint with the credentials.
                const res = await fetch(`${apiBase}/register`, { // Ensure this path matches your backend route
                    method: "POST",
                    headers: { "Content-Type": "application/json" }, // Sets the content type to JSON.
                    // Ensure the body matches what your backend /register expects
                    // The backend /register endpoint only needs username and password, not confirmPassword
                    body: JSON.stringify({ username, password }),
                });

                console.log("Response status:", res.status); // Logs the response status for debugging.
                // console.log("Response headers:", res.headers); // Logs the response headers for debugging.

                const text = await res.text(); // Or res.json() if response is JSON

                if (!res.ok) {
                    alert(text); // Displays the server's error response.
                } else {
                    console.log("Registration successful. Response data:", text);
                    alert("Registration successful! You can now log in."); 
                    window.location.href = "/pages/login.html";
                }
            });
        }
    });
}
