import express, { Request, Response } from "express";
import pool from "./database";
import "express-session";

declare module "express-session" {
    interface SessionData {
        user?: string;
    }
}

const cartRouter = express.Router();

async function getUserId(username: string): Promise<number | null> {
    const result = await pool.query('SELECT id FROM "user" WHERE user_name = $1', [username]);
    return result.rows[0]?.id || null;
}

cartRouter.get("/", async (req: Request, res: Response) => {
    if (!req.session?.user) return res.status(401).send("Nicht eingeloggt");

    const userId = await getUserId(req.session.user);
    if (!userId) return res.status(404).send("Benutzer nicht gefunden");

    try {
        const result = await pool.query("SELECT ingredients, quantity FROM shopping_cart WHERE user_id = $1", [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Fehler beim Abrufen:", err);
        res.status(500).send("Serverfehler");
    }
});

cartRouter.post("/", async (req: Request, res: Response) => {
    const { ingredient, quantity } = req.body;
    if (!req.session?.user || !ingredient || typeof quantity !== "number") {
        return res.status(400).send("Ungültige Anfrage");
    }

    const userId = await getUserId(req.session.user);
    if (!userId) return res.status(404).send("Benutzer nicht gefunden");

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
        res.send("Eintrag gespeichert");
    } catch (err) {
        console.error("Fehler beim Hinzufügen:", err);
        res.status(500).send("Serverfehler");
    }
});

// DELETE /cart – Zutat entfernen
cartRouter.delete("/", async (req: Request, res: Response) => {
    const { ingredient } = req.body;
    if (!req.session?.user || !ingredient) {
        return res.status(400).send("Ungültige Anfrage");
    }

    const userId = await getUserId(req.session.user);
    if (!userId) return res.status(404).send("Benutzer nicht gefunden");

    try {
        await pool.query("DELETE FROM shopping_cart WHERE user_id = $1 AND ingredients = $2", [userId, ingredient]);
        res.send("Eintrag gelöscht");
    } catch (err) {
        console.error("Fehler beim Löschen:", err);
        res.status(500).send("Serverfehler");
    }
});

export default cartRouter;
