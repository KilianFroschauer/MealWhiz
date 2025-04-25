type AuthForm = HTMLFormElement & {
    username: HTMLInputElement;
    password: HTMLInputElement;
};

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form") as AuthForm | null;
    const registerForm = document.getElementById("register-form") as AuthForm | null;

    if (loginForm) {
        loginForm.addEventListener("submit", async (e: Event) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const text = await res.text();
            alert(text);
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e: Event) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;

            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const text = await res.text();
            alert(text);
        });
    }
});
