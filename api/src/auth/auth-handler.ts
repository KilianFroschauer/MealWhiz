import bcrypt from "bcrypt";
import pool from "../database";

export async function registerUser(username: string, password: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
        await client.query('INSERT INTO "user" (user_name, user_password, rating) VALUES ($1, $2, $3)', [
            username,
            hashedPassword,
            null,
        ]);
        return true;
    } catch (err) {
        console.error("Registrierungsfehler:", err);
        return false;
    }
}

export async function authenticateUser(username: string, password: string): Promise<boolean> {
    try {
        const client = await pool.connect();

        console.log("in auth");
        const result = await client.query('SELECT user_password FROM "user" WHERE user_name = $1', [username]);
        console.log("request sent");
        if (result.rows.length === 0) return false;

        const hashedPassword = result.rows[0].user_password;

        console.log(hashedPassword);
        console.log(bcrypt.hash(password, 10));

        return await bcrypt.compare(password, hashedPassword);
    } catch (err) {
        console.error("Loginfehler:", err);
        return false;
    }
}
