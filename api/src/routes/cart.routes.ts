import express, { Request, Response } from "express";
import { pool } from "../config";
import { isAuthenticated, AuthRequest } from "../middlewares/auth.middlware"; // Assuming AuthRequest is exported from auth-handler
import PDFDocument from 'pdfkit';

export const cartRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

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
 *                   unit:
 *                     type: string
 *                     description: The unit of measurement.
 *                     example: "piece"
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

    if (!userId) {
        res.status(401).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
        return;
    }

    try {
        // Update query to include the unit column
        const result = await pool.query(
            "SELECT ingredients, quantity, unit FROM shopping_cart WHERE user_id = $1",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Fehler beim Abrufen des Warenkorbs:", err);
        res.status(500).send("Serverfehler beim Abrufen des Warenkorbs");
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
    const { ingredient, quantity, unit } = req.body; // Extract unit from request
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
            INSERT INTO shopping_cart (user_id, ingredients, quantity, unit)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, ingredients)
            DO UPDATE SET quantity = EXCLUDED.quantity, unit = EXCLUDED.unit
        `,
            [userId, ingredient, quantity, unit || 'piece'] // Default to 'piece' if no unit provided
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
        // Updated query to fetch ingredient units alongside names and quantities
        const recipeResult = await pool.query(
            `SELECT 
                ARRAY(
                    SELECT fp.product_name
                    FROM recipe_ingredient ri
                    JOIN food_products fp ON ri.ingredient_code = fp.code
                    WHERE ri.recipe_id = r.recipe_id
                    ORDER BY ri.ingredient_code
                ) as ingredients,
                ARRAY(
                    SELECT ri.quantity::text 
                    FROM recipe_ingredient ri 
                    WHERE ri.recipe_id = r.recipe_id
                    ORDER BY ri.ingredient_code
                ) as quantities,
                ARRAY(
                    SELECT COALESCE(ri.unit, 'piece')::text
                    FROM recipe_ingredient ri
                    WHERE ri.recipe_id = r.recipe_id
                    ORDER BY ri.ingredient_code
                ) as units
             FROM recipe r
             WHERE r.recipe_id = $1`,
            [recipeId]
        );

        if (recipeResult.rows.length === 0) {
            res.status(404).send("Rezept nicht gefunden");
            return;
        }

        const recipe = recipeResult.rows[0];
        const ingredients = recipe.ingredients;

        // Handle ingredients based on whether it's stored as text or array
        const ingredientsArray = Array.isArray(ingredients)
            ? ingredients
            : typeof ingredients === 'string'
                ? ingredients.split(',').map(item => item.trim())
                : [];

        const quantities = recipe.quantities || [];
        const units = recipe.units || []; // Get the units array

        // Add each ingredient to shopping cart with its proper unit
        for (let i = 0; i < ingredientsArray.length; i++) {
            const quantity = i < quantities.length ? parseFloat(quantities[i] || '1') : 1;
            const unit = i < units.length ? units[i] : 'piece'; // Use the unit from the database or default

            await pool.query(
                `INSERT INTO shopping_cart (user_id, ingredients, quantity, unit)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, ingredients)
                DO UPDATE SET quantity = shopping_cart.quantity + $3, unit = $4`,
                [userId, ingredientsArray[i], quantity, unit]
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
        // Update query to include the unit column
        const result = await pool.query(
            "SELECT ingredients, quantity, unit FROM shopping_cart WHERE user_id = $1",
            [userId]
        );

        if (format === "csv") {
            // Generate CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=shopping-list.csv');

            // CSV header
            res.write('Ingredient;Quantity;Unit\n');

            // Add rows
            result.rows.forEach(item => {
                res.write(`"${item.ingredients}";${item.quantity};"${item.unit || 'piece'}"\n`);
            });

            res.end();
        }
        else if (format === "pdf") {
            // Create a PDF document
            const doc = new PDFDocument();

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=shopping-list.pdf');

            // Pipe the PDF directly to the response
            doc.pipe(res);

            // Add content to the PDF
            doc.fontSize(20).text('MealWhiz Shopping List', {
                align: 'center'
            });

            // Add date
            doc.fontSize(12)
                .text(`Generated on ${new Date().toLocaleDateString()}`, {
                    align: 'center'
                });

            doc.moveDown(2);

            // Create a table-like structure for items
            let y = doc.y;
            const startX = 50;
            const colWidth = 200;  // Make columns narrower to fit unit
            const unitWidth = 100;

            // Headers
            doc.font('Helvetica-Bold')
                .text('Ingredient', startX, y)
                .text('Quantity', startX + colWidth, y)
                .text('Unit', startX + colWidth + unitWidth, y);

            doc.moveDown();
            y = doc.y;
            doc.font('Helvetica');

            // Add each shopping list item
            result.rows.forEach(item => {
                const unit = item.unit || 'piece';
                doc.text(item.ingredients, startX, y)
                    .text(item.quantity.toString(), startX + colWidth, y)
                    .text(unit, startX + colWidth + unitWidth, y);
                y = doc.y + 10;
                doc.y = y;
            });

            // Add footer
            doc.moveDown(2);
            doc.fontSize(10).text('Thank you for using MealWhiz!', {
                align: 'center'
            });

            // Finalize the PDF
            doc.end();
        }
        else {
            res.status(400).send("Ungültiges Exportformat. Unterstützte Formate: pdf, csv");
        }
    } catch (err) {
        console.error("Fehler beim Exportieren der Einkaufsliste:", err);
        res.status(500).send("Serverfehler beim Exportieren der Einkaufsliste");
    }
});

/**
 * @swagger
 * /cart/all:
 *   delete:
 *     summary: Delete all items from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All items removed from cart
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
cartRouter.delete("/all", isAuthenticated, async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
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
        await pool.query(
            "DELETE FROM shopping_cart WHERE user_id = $1",
            [userId]
        );
        res.send("Alle Einträge im Warenkorb gelöscht");
    } catch (err) {
        console.error("Fehler beim Löschen aller Einträge im Warenkorb:", err);
        res.status(500).send("Serverfehler beim Löschen aller Einträge im Warenkorb");
    }
});

export default cartRouter;