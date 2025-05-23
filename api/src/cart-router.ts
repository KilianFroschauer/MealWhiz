import express, { Request, Response } from "express";
import pool from "./database";
import { isAuthenticated, AuthRequest } from "./auth/auth-handler"; // Assuming AuthRequest is exported from auth-handler

// Removed: declare module "express-session" and import "express-session" as sessions are not used with JWT for this.

const cartRouter = express.Router();

// The getUserId function might still be useful if you only have username from JWT,
// but if JWT payload directly contains userId, it might be less needed here.
// For this example, we'll assume the JWT payload gives us the userId directly.
// async function getUserId(username: string): Promise<number | null> {
//     const result = await pool.query('SELECT id FROM "user" WHERE user_name = $1', [username]);
//     return result.rows[0]?.id || null;
// }

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

cartRouter.post("/", isAuthenticated, async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { ingredient, quantity } = req.body;
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

export default cartRouter;
