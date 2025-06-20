import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pool } from '../config';
import { AuthRequest } from '../middlewares/auth.middlware';
import PDFDocument from 'pdfkit';

export class CartController {
    /**
     * Retrieves the user's shopping cart
     */
    async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        let userId: number | undefined;

        if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
            userId = authReq.payload.user.userId;
        } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
            userId = authReq.payload.userId;
        }

        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
            return;
        }

        try {
            const result = await pool.query(
                "SELECT ingredients, quantity, unit FROM shopping_cart WHERE user_id = $1",
                [userId]
            );
            res.json(result.rows);
        } catch (err) {
            console.error("Fehler beim Abrufen des Warenkorbs:", err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Serverfehler beim Abrufen des Warenkorbs");
        }
    }

    /**
     * Add or update an item in the shopping cart
     */
    async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        const { ingredient, quantity, unit } = req.body;
        let userId: number | undefined;

        if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
            userId = authReq.payload.user.userId;
        } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
            userId = authReq.payload.userId;
        }

        console.log("User ID from token:", userId);

        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
            return;
        }

        if (!ingredient || typeof quantity !== "number") {
            res.status(StatusCodes.BAD_REQUEST).send("Ungültige Anfrage: Zutat und Menge erforderlich.");
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
                [userId, ingredient, quantity, unit || 'piece']
            );
            res.send("Eintrag im Warenkorb gespeichert/aktualisiert");
        } catch (err) {
            console.error("Fehler beim Hinzufügen zum Warenkorb:", err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Serverfehler beim Hinzufügen zum Warenkorb");
        }
    }

    /**
     * Remove an item from the shopping cart
     */
    async removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        const { ingredient } = req.body;
        let userId: number | undefined;

        if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
            userId = authReq.payload.user.userId;
        } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
            userId = authReq.payload.userId;
        }

        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
            return;
        }

        if (!ingredient) {
            res.status(StatusCodes.BAD_REQUEST).send("Ungültige Anfrage: Zutat erforderlich.");
            return;
        }

        try {
            const deleteResult = await pool.query(
                "DELETE FROM shopping_cart WHERE user_id = $1 AND ingredients = $2", 
                [userId, ingredient]
            );
            
            if (deleteResult.rowCount != null && deleteResult.rowCount > 0) {
                res.send("Eintrag aus dem Warenkorb gelöscht");
            } else {
                res.status(StatusCodes.NOT_FOUND).send("Eintrag nicht im Warenkorb gefunden oder bereits gelöscht");
            }
        } catch (err) {
            console.error("Fehler beim Löschen aus dem Warenkorb:", err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Serverfehler beim Löschen aus dem Warenkorb");
        }
    }

    /**
     * Add all ingredients from a recipe to the shopping cart
     */
    async addRecipeToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        const recipeId = parseInt(req.params.recipeId);
        let userId: number | undefined;

        if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
            userId = authReq.payload.user.userId;
        } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
            userId = authReq.payload.userId;
        }

        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
            return;
        }

        try {
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
                res.status(StatusCodes.NOT_FOUND).send("Rezept nicht gefunden");
                return;
            }

            const recipe = recipeResult.rows[0];
            const ingredients = recipe.ingredients;

            const ingredientsArray = Array.isArray(ingredients)
                ? ingredients
                : typeof ingredients === 'string'
                    ? ingredients.split(',').map((item: string) => item.trim())
                    : [];

            const quantities = recipe.quantities || [];
            const units = recipe.units || [];

            for (let i = 0; i < ingredientsArray.length; i++) {
                const quantity = i < quantities.length ? parseFloat(quantities[i] || '1') : 1;
                const unit = i < units.length ? units[i] : 'piece';

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
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Serverfehler beim Hinzufügen der Rezeptzutaten");
        }
    }

    /**
     * Export shopping cart in specified format
     */
    async exportCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        const format = req.params.format.toLowerCase();
        let userId: number | undefined;

        if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
            userId = authReq.payload.user.userId;
        } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
            userId = authReq.payload.userId;
        }

        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
            return;
        }

        try {
            const result = await pool.query(
                "SELECT ingredients, quantity, unit FROM shopping_cart WHERE user_id = $1",
                [userId]
            );

            if (format === "csv") {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=shopping-list.csv');

                res.write('Ingredient;Quantity;Unit\n');

                result.rows.forEach(item => {
                    res.write(`"${item.ingredients}";${item.quantity};"${item.unit || 'piece'}"\n`);
                });

                res.end();
            }
            else if (format === "pdf") {
                const doc = new PDFDocument();

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=shopping-list.pdf');

                doc.pipe(res);

                doc.fontSize(20).text('MealWhiz Shopping List', {
                    align: 'center'
                });

                doc.fontSize(12)
                    .text(`Generated on ${new Date().toLocaleDateString()}`, {
                        align: 'center'
                    });

                doc.moveDown(2);

                let y = doc.y;
                const startX = 50;
                const colWidth = 200;
                const unitWidth = 100;

                doc.font('Helvetica-Bold')
                    .text('Ingredient', startX, y)
                    .text('Quantity', startX + colWidth, y)
                    .text('Unit', startX + colWidth + unitWidth, y);

                doc.moveDown();
                y = doc.y;
                doc.font('Helvetica');

                result.rows.forEach(item => {
                    const unit = item.unit || 'piece';
                    doc.text(item.ingredients, startX, y)
                        .text(item.quantity.toString(), startX + colWidth, y)
                        .text(unit, startX + colWidth + unitWidth, y);
                    y = doc.y + 10;
                    doc.y = y;
                });

                doc.moveDown(2);
                doc.fontSize(10).text('Thank you for using MealWhiz!', {
                    align: 'center'
                });

                doc.end();
            }
            else {
                res.status(StatusCodes.BAD_REQUEST).send("Ungültiges Exportformat. Unterstützte Formate: pdf, csv");
            }
        } catch (err) {
            console.error("Fehler beim Exportieren der Einkaufsliste:", err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Serverfehler beim Exportieren der Einkaufsliste");
        }
    }

    /**
     * Delete all items from the shopping cart
     */
    async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthRequest;
        let userId: number | undefined;

        if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
            userId = authReq.payload.user.userId;
        } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
            userId = authReq.payload.userId;
        }

        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).send("Benutzeridentifikation im Token ungültig oder nicht gefunden.");
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
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Serverfehler beim Löschen aller Einträge im Warenkorb");
        }
    }
}
