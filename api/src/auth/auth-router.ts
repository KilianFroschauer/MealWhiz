import express from "express";
import { authenticateUser, registerUser } from "./auth-handler";
import "express-session";

declare module "express-session" {
    interface SessionData {
        user?: string;
    }
}

const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).send("Benutzername und Passwort erforderlich");
    } else {
        const success = await authenticateUser(username, password);

        if (success) {
            req.session.user = username;
            res.send("Login erfolgreich!");
        } else {
            res.status(401).send("Login fehlgeschlagen");
        }
    }
});

router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).send("Benutzername und Passwort erforderlich");
    } else {
        const success = await registerUser(username, password);

        if (success) {
            res.send("Registrierung erfolgreich!");
        } else {
            res.status(500).send("Fehler bei der Registrierung (evtl. Benutzername schon vergeben)");
        }
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.send("Logout erfolgreich!");
    });
});

export default router;
