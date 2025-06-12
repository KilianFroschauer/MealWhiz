import express, { Request, Response } from "express";
import { pool } from "../config";
import { isAuthenticated, AuthRequest } from "../middlewares/auth.middlware"; // Assuming AuthRequest is exported from auth-handler

// Removed: declare module "express-session" and import "express-session" as sessions are not used with JWT for this.

export const cartRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

// The getUserId function might still be useful if you only have username from JWT,
// but if JWT payload directly contains userId, it might be less needed here.
// For this example, we'll assume the JWT payload gives us the userId directly.
// async function getUserId(username: string): Promise<number | null> {
//     const result = await pool.query('SELECT id FROM "user" WHERE user_name = $1', [username]);
//     return result.rows[0]?.id || null;
// }

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Retrieve the user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of items in the shopping cart.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ingredients:
 *                     type: string
 *                     description: The name of the ingredient.
 *                     example: "Tomatoes"
 *                   quantity:
 *                     type: number
 *                     description: The quantity of the ingredient.
 *                     example: 2
 *       401:
 *         description: Unauthorized - User identification in token invalid or not found.
 *       500:
 *         description: Server error while retrieving the shopping cart.
 */
cartRouter.get("/", isAuthenticated, async (req: Request, res: Response) => {
    // Cast req to AuthRequest to access the payload
    const authReq = req as AuthRequest;
    let userId: number | undefined;

    // Access userId from JWT payload. Adjust path based on your JWT structure.
    if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
        userId = authReq.payload.user.userId;
    } else if (authReq.payload && typeof authReq.payload.userId === 'number') { // Alternative structure
        userId = authReq.payload.userId;
    }
    // console.log("User ID from token:", userId); // Good for debugging

    if (!userId) {
        // This case should ideally be caught by isAuthenticated if token is invalid or malformed
        // Or if the token doesn't contain the expected userId.
        res.status(401).send("Benutzeridentifikation im Token ungültig oder nicht gefunden."); // LINE 34 (approx)
        return; // IMPORTANT: Ensure you return after sending a response
    }

    try {
        // console.log("Fetching cart for userId:", userId); // Good for debugging
        const result = await pool.query("SELECT ingredients, quantity FROM shopping_cart WHERE user_id = $1", [userId]);
        res.json(result.rows); // This is another response
    } catch (err) {
        console.error("Fehler beim Abrufen des Warenkorbs:", err);
        res.status(500).send("Serverfehler beim Abrufen des Warenkorbs"); // This is another response
    }
});

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add or update an item in the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredient
 *               - quantity
 *             properties:
 *               ingredient:
 *                 type: string
 *                 description: The name of the ingredient.
 *                 example: "Flour"
 *               quantity:
 *                 type: number
 *                 description: The quantity of the ingredient.
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item saved/updated in the cart.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Eintrag im Warenkorb gespeichert/aktualisiert
 *       400:
 *         description: Invalid request - ingredient and quantity required.
 *       401:
 *         description: Unauthorized - User identification in token invalid or not found.
 *       500:
 *         description: Server error while adding to the shopping cart.
 */
cartRouter.post("/", isAuthenticated, async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { ingredient, quantity } = req.body;
    let userId: number | undefined;

    if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
        userId = authReq.payload.user.userId;
    } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
        userId = authReq.payload.userId;
    }

    console.log("User ID from token:", userId); // Good for debugging

    if (!userId) {
        res.status(401).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
        return;
    }

    if (!ingredient || typeof quantity !== "number") {
        res.status(400).send("Ungültige Anfrage: Zutat und Menge erforderlich.");
        return;
    }

    try {
        await pool.query(
            `
            INSERT INTO shopping_cart (user_id, ingredients, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, ingredients)
            DO UPDATE SET quantity = EXCLUDED.quantity
        `,
            [userId, ingredient, quantity]
        );
        res.send("Eintrag im Warenkorb gespeichert/aktualisiert");
    } catch (err) {
        console.error("Fehler beim Hinzufügen zum Warenkorb:", err);
        res.status(500).send("Serverfehler beim Hinzufügen zum Warenkorb");
    }
});

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Remove an item from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredient
 *             properties:
 *               ingredient:
 *                 type: string
 *                 description: The name of the ingredient to remove.
 *                 example: "Tomatoes"
 *     responses:
 *       200:
 *         description: Item removed from the cart.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Eintrag aus dem Warenkorb gelöscht
 *       400:
 *         description: Invalid request - ingredient required.
 *       401:
 *         description: Unauthorized - User identification in token invalid or not found.
 *       404:
 *         description: Item not found in the cart or already deleted.
 *       500:
 *         description: Server error while deleting from the shopping cart.
 */
cartRouter.delete("/", isAuthenticated, async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { ingredient } = req.body; // Assuming ingredient name is sent in the body
    let userId: number | undefined;

    if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
        userId = authReq.payload.user.userId;
    } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
        userId = authReq.payload.userId;
    }

    if (!userId) {
        res.status(401).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
        return;
    }

    if (!ingredient) {
        res.status(400).send("Ungültige Anfrage: Zutat erforderlich.");
        return;
    }

    try {
        const deleteResult = await pool.query("DELETE FROM shopping_cart WHERE user_id = $1 AND ingredients = $2", [userId, ingredient]);
        if (deleteResult.rowCount != null && deleteResult.rowCount > 0) {
            res.send("Eintrag aus dem Warenkorb gelöscht");
        } else {
            res.status(404).send("Eintrag nicht im Warenkorb gefunden oder bereits gelöscht");
        }
    } catch (err) {
        console.error("Fehler beim Löschen aus dem Warenkorb:", err);
        res.status(500).send("Serverfehler beim Löschen aus dem Warenkorb");
    }
});

/**
 * @swagger
 * /cart/recipe/{recipeId}:
 *   post:
 *     summary: Add all ingredients from a recipe to the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe
 *     responses:
 *       200:
 *         description: Recipe ingredients added to cart
 *       401:
 *         description: Unauthorized - User identification in token invalid
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
cartRouter.post("/recipe/:recipeId", isAuthenticated, async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const recipeId = parseInt(req.params.recipeId);
    let userId: number | undefined;

    // Extract userId from token
    if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
        userId = authReq.payload.user.userId;
    } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
        userId = authReq.payload.userId;
    }

    if (!userId) {
        res.status(401).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
        return;
    }

    try {
        // Get recipe ingredients
        const recipeResult = await pool.query(
            `SELECT ingredients, ingredientsAmount FROM recipe WHERE recipe_id = $1`,
            [recipeId]
        );

        if (recipeResult.rows.length === 0) {
            res.status(404).send("Rezept nicht gefunden");
            return;
        }

        const recipe = recipeResult.rows[0];
        const ingredients = recipe.ingredients;
        const amounts = recipe.ingredientsAmount;

        // Add each ingredient to shopping cart
        for (let i = 0; i < ingredients.length; i++) {
            await pool.query(
                `INSERT INTO shopping_cart (user_id, ingredients, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, ingredients)
                DO UPDATE SET quantity = shopping_cart.quantity + $3`,
                [userId, ingredients[i], amounts[i] || 1]
            );
        }

        res.send("Rezeptzutaten zum Warenkorb hinzugefügt");
    } catch (err) {
        console.error("Fehler beim Hinzufügen der Rezeptzutaten:", err);
        res.status(500).send("Serverfehler beim Hinzufügen der Rezeptzutaten");
    }
});

/**
 * @swagger
 * /cart/export/{format}:
 *   get:
 *     summary: Export shopping cart in specified format
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, csv]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Shopping list exported
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
cartRouter.get("/export/:format", isAuthenticated, async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const format = req.params.format.toLowerCase();
    let userId: number | undefined;

    // Extract userId from token
    if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
        userId = authReq.payload.user.userId;
    } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
        userId = authReq.payload.userId;
    }

    if (!userId) {
        res.status(401).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
        return;
    }

    try {
        const result = await pool.query(
            "SELECT ingredients, quantity FROM shopping_cart WHERE user_id = $1",
            [userId]
        );

        if (format === "csv") {
            // Generate CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=shopping-list.csv');
            
            // CSV header
            res.write('Ingredient,Quantity\n');
            
            // Add rows
            result.rows.forEach(item => {
                res.write(`"${item.ingredients}",${item.quantity}\n`);
            });
            
            res.end();
        } 
        else if (format === "pdf") {
            // For PDF you'll need a library like pdfkit
            // This is a simplified example
            res.status(501).send("PDF export wird bald verfügbar sein");
        }
        else {
            res.status(400).send("Ungültiges Exportformat. Unterstützte Formate: pdf, csv");
        }
    } catch (err) {
        console.error("Fehler beim Exportieren der Einkaufsliste:", err);
        res.status(500).send("Serverfehler beim Exportieren der Einkaufsliste");
    }
});

export default cartRouter;