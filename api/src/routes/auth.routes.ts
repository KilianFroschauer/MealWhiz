import express from "express";
import { StatusCodes } from "http-status-codes";
// import { users } from "./data/user-store"; // No longer needed for this route
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isAdmin, isAuthenticated } from "../auth/auth-handler";
import { pool } from "../config"; // Assuming database.ts is in the src directory

export interface UserCredentials {
    username: string; // If this field actually contains the username, consider renaming it to 'username'
    password: string;
}

// create router
export const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                     description: The user ID.
 *                     example: 1
 *                   user_name:
 *                     type: string
 *                     description: The username.
 *                     example: johndoe
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *                 example: testuser
 *               password:
 *                 type: string
 *                 description: The user's password.
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns user claims, expiration time, and access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userClaims:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: testuser
 *                 expiresAt:
 *                   type: number
 *                   description: Token expiration timestamp.
 *                   example: 1678886400000
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token.
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - User does not exist or wrong password
 *       500:
 *         description: Internal server error
 */
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

        // Ensure JWT_SECRET is available for signing
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not defined. Cannot sign token.");
            // This is a server configuration issue.
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server configuration error, cannot issue token." });
        }

        const token = jwt.sign(
            {
                user: userClaims, // The 'user' object within the token payload
                exp: expiresAt.getTime() / 1000,
            },
            secret // Use the secret from .env
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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The desired username.
 *                 example: newuser
 *               password:
 *                 type: string
 *                 description: The desired password (min 6 characters).
 *                 example: newpassword123
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 userId:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Bad request (e.g., missing fields, password too short)
 *       409:
 *         description: Conflict - User already exists
 *       500:
 *         description: Internal server error
 */
authRouter.post("/register", async (request, response) => {
    const { username, password }: UserCredentials = request.body; // Destructure for clarity and type safety
    console.log("Registration attempt with credentials:", { username, password });

    // Basic validation
    if (!username || !password) {
        return response.status(StatusCodes.BAD_REQUEST).json({ message: "Username and password are required." });
    }
    // Example: Minimum password length (adjust as needed)
    if (password.length < 6) {
        return response.status(StatusCodes.BAD_REQUEST).json({ message: "Password must be at least 6 characters long." });
    }

    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT user_id FROM "user" WHERE user_name = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            console.log("Registration failed: User already exists with username:", username);
            // Return to ensure no further code in the try block is executed for this case
            return response.status(StatusCodes.CONFLICT).json({ message: "User already exists" });
        }

        // Hash the password before storing it
        const saltRounds = 10; // It's good practice to define salt rounds
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        // Insert new user into the database
        const result = await pool.query(
            'INSERT INTO "user" (user_name, user_password) VALUES ($1, $2) RETURNING user_id',
            [username, hashedPassword]
        );

        const userId = result.rows[0].user_id;
        console.log("User registered successfully with ID:", userId);
        // Send a JSON object for consistency
        response.status(StatusCodes.CREATED).json({ message: "User registered successfully", userId: userId });
    } catch (error) {
        console.error("Registration error:", error);
        // Check for specific database errors if needed, e.g., unique constraint violation
        // if not caught by the first check (though the first check should handle it for user_name)
        response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Registration failed due to a server error" });
    }
});