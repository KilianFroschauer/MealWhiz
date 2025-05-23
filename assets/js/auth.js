"use strict";
// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\auth.ts
// This script handles user authentication, including login and registration.
// Waits for the HTML document to be fully loaded before executing the script.
document.addEventListener("DOMContentLoaded", () => {
    // Retrieves the login form element by its ID.
    const loginForm = document.getElementById("login-form");
    // Retrieves the registration form element by its ID.
    const registerForm = document.getElementById("register-form");
    // If the login form exists, add an event listener for its submission.
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prevents the default form submission behavior.
            // Gets the username and password values from the form inputs.
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            // Sends a POST request to the /login endpoint with the credentials.
            const res = await fetch("http://127.0.0.1:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }), // Converts the data to a JSON string.
            });
            // Parses the server's response as text.
            const text = await res.text();
            // Only display an alert if the server response indicates an error (e.g., status 4xx or 5xx).
            if (!res.ok) {
                alert(text); // Displays the server's error response.
            }
            else {
                // Login was successful.
                // You can add code here to handle successful login, like redirecting the user
                // or updating the UI. For now, no popup will be shown on success.
                console.log("Login successful:", text);
                // Example: window.location.href = "/dashboard"; // Redirect to a dashboard page
            }
        });
    }
    // If the registration form exists, add an event listener for its submission.
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prevents the default form submission behavior.
            // Gets the username and password values from the form inputs.
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            // Sends a POST request to the /register endpoint with the credentials.
            const res = await fetch("http://127.0.0.1:3000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }), // Converts the data to a JSON string.
            });
            console.log("Response status:", res.status); // Logs the response status for debugging.
            console.log("Response headers:", res.headers); // Logs the response headers for debugging.
            // Parses the server's response as text.
            const text = await res.text();
            // Only display an alert if the server response indicates an error.
            if (!res.ok) {
                alert(text); // Displays the server's error response.
            }
            else {
                // Registration was successful.
                // You might want to inform the user or redirect.
                console.log("Registration successful:", text);
                alert(text); // Or, if you want to show the success message from the server: alert(text);
                // If you want no popup on successful registration either, remove the alert above.
            }
        });
    }
});
