import express from "express";
import { StatusCodes } from "http-status-codes";
// import { users } from "./data/user-store"; // No longer needed for this route
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isAdmin, isAuthenticated } from "./auth-handler";
import pool from "../database"; // Assuming database.ts is in the src directory

export interface UserCredentials {
    username: string; // If this field actually contains the username, consider renaming it to 'username'
    password: string;
}

// create router
export const authRouter = express.Router();

// return all users from the database
authRouter.get("/users", isAuthenticated, async (request, response) => {
    try {
        // Select user data. IMPORTANT: Do NOT select password hashes or sensitive data to return to the client.
        // Adjust columns based on your 'user' table structure.
        const result = await pool.query('SELECT user_id, user_name FROM "user"'); // Assuming 'user_name' and 'role' columns exist
        response.status(StatusCodes.OK).json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve users" });
    }
});

// login - unprotected route
authRouter.post("/login", async (request, response) => {
    const loginUser: UserCredentials = request.body;
    console.log("Login attempt with credentials:", loginUser);

    // Assuming loginUser.email actually contains the username for now
    const usernameToLogin = loginUser.username; // Adjust based on your actual field names
    console.log("Username to login:", usernameToLogin);

    try {
        // Fetch user from database by user_name
        const userResult = await pool.query(
            'SELECT user_id, user_password, user_name FROM "user" WHERE user_name = $1',
            [usernameToLogin]
        );
        console.log("User query result rows:", userResult.rows);
        const user = userResult.rows[0];

        if (!user) {
            console.log("Login failed: User not found with username:", usernameToLogin);
            response.status(StatusCodes.UNAUTHORIZED).json("User does not exist");
            return;
        }

        // Ensure loginUser.password and user.user_password are valid strings
        if (typeof loginUser.password !== 'string' || typeof user.user_password !== 'string') {
            console.error("Login failed: Password from request or stored hash is undefined or not a string.");
            console.error("loginUser.password type:", typeof loginUser.password);
            console.error("user.user_password type:", typeof user.user_password, "value:", user.user_password);
            response.status(StatusCodes.INTERNAL_SERVER_ERROR).json("Password processing error.");
            return;
        }
        console.log(loginUser.password, user.user_password);
        if (!bcrypt.compareSync(loginUser.password, user.user_password)) {
            console.log("Login failed: Password mismatch for username:", usernameToLogin);
            response.status(StatusCodes.UNAUTHORIZED).json("Wrong password");
            return;
        }

        // Since there's no 'role' or 'email' in the DB, we use what's available.
        const userClaims = {
            userId: user.user_id,
            username: user.user_name,
            // If you need a 'role' claim, you'd have to decide how to determine it
            // or add a 'role' column to your user table. For now, it's omitted.
        };
        const minutes = 15;
        const expiresAt = new Date(Date.now() + minutes * 60000);
        const token = jwt.sign(
            {
                user: userClaims, // The 'user' object within the token payload
                exp: expiresAt.getTime() / 1000,
            },
            "SECRET_KEY" // Store your secret key in an environment variable
        );

        response.status(StatusCodes.OK).json({
            userClaims: userClaims, // Sending back the claims for client-side use if needed
            expiresAt: expiresAt.getTime(),
            accessToken: token,
        });
    } catch (error) {
        console.error("Login error:", error);
        response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Login failed due to a server error" });
    }
});

// ... (rest of your auth-router.ts, e.g., register, logout routes if they exist)

