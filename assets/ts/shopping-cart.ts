
namespace ShoppingCart {
    const apiBase: string = (typeof MealWhizConfig !== 'undefined' ? 
                            MealWhizConfig.apiBaseURL : 
                            'https://mealhwiz.at:3000');

    // Helper function to get the token and prepare headers
    function getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem("accessToken");
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    async function loadCart(): Promise<void> {
        const token = localStorage.getItem("accessToken");
        const cartDiv = document.getElementById("cart");
        if (!cartDiv) return;

        if (!token) {
            showMessage("Please log in to view your shopping list", true);
            cartDiv.innerHTML = "";
            return;
        }

        try {
            const res = await fetch(`${apiBase}/cart`, {
                method: "GET",
                headers: getAuthHeaders(),
            });


            if (res.ok) {
                const items = await res.json();

                if (items.length === 0) {
                    cartDiv.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="fas fa-shopping-basket fa-3x mb-3"></i>
                        <p>Your shopping list is empty.</p>
                    </div>`;
                } else {
                    let html = "";

                    items.forEach((item: { ingredients: string; quantity: number; unit?: string }) => {
                        // Get unit or default to "piece" if none exists
                        const unit = item.unit || "piece";

                        html += `
                    <div class="cart-item">
                        <span>${item.ingredients}</span>
                        <div class="quantity-control">
                            <button class="btn-quantity decrease-qty" data-ingredient="${item.ingredients}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="text" value="${item.quantity}" min="1"
                                   class="mx-2 item-quantity"
                                   data-ingredient="${item.ingredients}"
                                   onchange="updateQuantity('${item.ingredients}', (this as HTMLInputElement).value)">
                            <span class="unit-display">${unit}</span>
                            <button class="btn-quantity increase-qty" data-ingredient="${item.ingredients}">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteFromCart('${item.ingredients}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
                    });

                    cartDiv.innerHTML = html;

                    // Add event listeners to quantity buttons
                    document.querySelectorAll(".decrease-qty").forEach((btn) => {
                        btn.addEventListener("click", function (this: HTMLButtonElement) {
                            const ingredient = this.getAttribute("data-ingredient");
                            if (!ingredient) return;
                            const input = document.querySelector<HTMLInputElement>(
                                `.item-quantity[data-ingredient="${ingredient}"]`
                            );
                            if (!input) return;
                            let value = parseInt(input.value) - 1;
                            if (value < 1) value = 1;
                            input.value = value.toString();
                            updateQuantity(ingredient, value);
                        });
                    });

                    document.querySelectorAll(".increase-qty").forEach((btn) => {
                        btn.addEventListener("click", function (this: HTMLButtonElement) {
                            const ingredient = this.getAttribute("data-ingredient");
                            if (!ingredient) return;
                            const input = document.querySelector<HTMLInputElement>(
                                `.item-quantity[data-ingredient="${ingredient}"]`
                            );
                            if (!input) return;
                            let value = parseInt(input.value) + 1;
                            input.value = value.toString();
                            updateQuantity(ingredient, value);
                        });
                    });
                }

                AuthNav.updateCartCount(); // Update cart count in header
            } else {
                handleError(res);
            }
        } catch (error) {
            console.error("Error loading cart:", error);
            showMessage("Error loading your shopping list", true);
        }
    }

    async function addToCart(): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showMessage("Please log in to add items", true);
            return;
        }

        const ingredientInput = document.getElementById("ingredient") as HTMLInputElement;
        const quantityInputEl = document.getElementById("quantity") as HTMLInputElement;
        const unitInput = document.getElementById("unit") as HTMLSelectElement;

        const ingredient = ingredientInput.value;
        const quantityValue = quantityInputEl.value;
        const unit = unitInput.value; // Get selected unit

        if (!ingredient || !quantityValue) {
            showMessage("Please enter both ingredient and quantity", true);
            return;
        }

        const quantity = parseInt(quantityValue);
        if (isNaN(quantity) || quantity <= 0) {
            showMessage("Please enter a valid quantity", true);
            return;
        }

        try {
            const res = await fetch(`${apiBase}/cart`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ ingredient, quantity, unit }), // Include unit in the request
            });

            if (res.ok) {
                ingredientInput.value = "";
                quantityInputEl.value = "1";
                // Keep the unit selection as is for convenience
                loadCart();
                showMessage("Item added to shopping list", false);
            } else {
                handleError(res);
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            showMessage("Error adding item to shopping list", true);
        }
    }

    async function deleteFromCart(ingredient: string): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showMessage("Please log in to remove items", true);
            return;
        }

        try {
            const res = await fetch(`${apiBase}/cart`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                body: JSON.stringify({ ingredient }),
            });

            if (res.ok) {
                loadCart();
                showMessage("Item removed from shopping list", false);
            } else {
                handleError(res);
            }
        } catch (error) {
            console.error("Error deleting from cart:", error);
            showMessage("Error removing item from shopping list", true);
        }
    }

    async function updateQuantity(ingredient: string, quantityStr: string | number): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showMessage("Please log in to update items", true);
            return;
        }

        let quantity = typeof quantityStr === 'string' ? parseInt(quantityStr) : quantityStr;
        if (isNaN(quantity) || quantity < 1) {
            quantity = 1;
            // Optionally update the input field if it was invalid
            const inputElement = document.querySelector<HTMLInputElement>(`.item-quantity[data-ingredient="${ingredient}"]`);
            if (inputElement) {
                inputElement.value = "1";
            }
        }

        try {
            // First, fetch the current item to get its unit, as the unit is not passed to this function
            const getRes = await fetch(`${apiBase}/cart`, {
                method: "GET",
                headers: getAuthHeaders(),
            });

            if (getRes.ok) {
                const items = await getRes.json();
                const item = items.find((i: { ingredients: string }) => i.ingredients === ingredient);

                if (item) {
                    // Update with preserved unit
                    const updateRes = await fetch(`${apiBase}/cart`, {
                        method: "POST", // Assuming your backend uses POST for updates, or PUT
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            ingredient,
                            quantity,
                            unit: item.unit || "piece", // Use existing unit or default
                        }),
                    });

                    if (!updateRes.ok) {
                        handleError(updateRes);
                        loadCart(); // Reload to restore correct state if update failed
                    }
                    // No explicit success message here to avoid spamming on every quantity change
                    // loadCart() will refresh the view, or you can update the specific item in DOM
                } else {
                    showMessage("Item not found for update.", true);
                    loadCart();
                }
            } else {
                handleError(getRes);
                loadCart(); // Reload to restore correct state
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
            showMessage("Error updating quantity", true);
            loadCart(); // Reload to restore correct state
        }
    }


    async function deleteAllFromCart(): Promise<void> {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showMessage("Please log in to clear your shopping list", true);
            return;
        }
        const cartDiv = document.getElementById("cart");
        if (!cartDiv) return;

        try {
            const res = await fetch(`${apiBase}/cart/all`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            if (res.ok) {
                cartDiv.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-shopping-basket fa-3x mb-3"></i>
                    <p>Your shopping list is empty.</p>
                </div>`;
                AuthNav.updateCartCount(); // Update cart count in header
                showMessage("All items removed from shopping list", false);
            } else {
                handleError(res);
            }
        } catch (error) {
            console.error("Error clearing cart:", error);
            showMessage("Error clearing shopping list", true);
        }
    }

    function exportList(format: 'csv' | 'pdf'): void {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showMessage("Please log in to export your shopping list", true);
            return;
        }

        // Show export in progress message
        showMessage(`Preparing ${format.toUpperCase()} export...`, false);

        fetch(`${apiBase}/cart/export/${format}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Export failed: ${response.status}`);
                }
                return response.blob();
            })
            .then((blob) => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = `shopping-list.${format}`;

                // Trigger download
                document.body.appendChild(a);
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                showMessage(`Shopping list exported as ${format.toUpperCase()}`, false);
            })
            .catch((error) => {
                console.error("Export error:", error);
                showMessage(`Failed to export shopping list: ${error.message}`, true);
            });
    }

    function handleError(response: Response): void {
        if (response.status === 401) {
            showMessage("Session invalid or expired. Please log in again.", true);
            // Optional: Redirect to login page
            // localStorage.removeItem('accessToken');
            // window.location.href = '/pages/login.html';
        } else {
            response.text().then((text) => {
                showMessage(text, true);
            });
        }
    }

    function showMessage(msg: string, isError: boolean = false): void {
        const messageEl = document.getElementById("message");
        if (!messageEl) return;

        messageEl.textContent = msg;
        messageEl.className = isError ? "alert alert-danger" : "alert alert-success";
        messageEl.style.display = "block";

        // Hide message after 5 seconds
        setTimeout(() => {
            messageEl.style.display = "none";
        }, 5000);
    }

    // Hide spinner once page is loaded
    window.addEventListener("load", function () {
        const spinner = document.querySelector("#spinner");
        if (spinner) {
            spinner.classList.remove("show");
        }
    });

    // Load cart when page loads
    document.addEventListener("DOMContentLoaded", loadCart);

    // Make functions accessible from HTML inline event handlers
    (window as any).addToCart = addToCart;
    (window as any).loadCart = loadCart;
    (window as any).deleteAllFromCart = deleteAllFromCart;
    (window as any).exportList = exportList;
    (window as any).deleteFromCart = deleteFromCart;
    (window as any).updateQuantity = updateQuantity;
}