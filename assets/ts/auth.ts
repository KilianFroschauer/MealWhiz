// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\auth.ts
// This script handles user authentication, including login and registration.

// Defines the structure of an authentication form, extending HTMLFormElement
// to include specific input fields for username and password.
type AuthForm = HTMLFormElement & {
    username: HTMLInputElement;
    password: HTMLInputElement;
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
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            // Sends a POST request to the /login endpoint with the credentials.
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" }, // Sets the content type to JSON.
                body: JSON.stringify({ username, password }), // Converts the data to a JSON string.
            });

            // Parses the server's response as text.
            const text = await res.text();
            // Displays the server's response in an alert dialog.
            alert(text);
        });
    }

    // If the registration form exists, add an event listener for its submission.
    if (registerForm) {
        registerForm.addEventListener("submit", async (e: Event) => {
            e.preventDefault(); // Prevents the default form submission behavior.
            // Gets the username and password values from the form inputs.
            const username = registerForm.username.value;
            const password = registerForm.password.value;

            // Sends a POST request to the /register endpoint with the credentials.
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" }, // Sets the content type to JSON.
                body: JSON.stringify({ username, password }), // Converts the data to a JSON string.
            });

            // Parses the server's response as text.
            const text = await res.text();
            // Displays the server's response in an alert dialog.
            alert(text);
        });
    }
});
