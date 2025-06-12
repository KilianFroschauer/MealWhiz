import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config';
import { UserCredentials } from '../models/auth.models';
import { AuthRequest } from '../middlewares/auth.middlware';

// TODO: move db operations in an auth repository

export class AuthController {
    /**
     * Retrieves a list of all users (excluding sensitive information).
     * @param {Request} req - Express request object.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await pool.query('SELECT user_id, user_name FROM "user"');
            res.status(StatusCodes.OK).json(result.rows);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve users" });
        }
    }

    /**
     * Authenticates a user and returns a JWT token upon successful login.
     * @param {Request} req - Express request object, body should contain UserCredentials.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        const loginUser: UserCredentials = req.body;
        console.log("Login attempt with credentials:", loginUser);

        const usernameToLogin = loginUser.username;
        console.log("Username to login:", usernameToLogin);

        try {
            const userResult = await pool.query(
                'SELECT user_id, user_password, user_name FROM "user" WHERE user_name = $1',
                [usernameToLogin]
            );
            console.log("User query result rows:", userResult.rows);
            const user = userResult.rows[0];

            if (!user) {
                console.log("Login failed: User not found with username:", usernameToLogin);
                res.status(StatusCodes.UNAUTHORIZED).json({ error: "User does not exist" });
                return;
            }

            if (typeof loginUser.password !== 'string' || typeof user.user_password !== 'string') {
                console.error("Login failed: Password from request or stored hash is undefined or not a string.");
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Password processing error." });
                return;
            }

            if (!bcrypt.compareSync(loginUser.password, user.user_password)) {
                console.log("Login failed: Password mismatch for username:", usernameToLogin);
                res.status(StatusCodes.UNAUTHORIZED).json({ error: "Wrong password" });
                return;
            }

            const userClaims = {
                userId: user.user_id,
                username: user.user_name,
            };
            const minutes = 15; // Token expiration time
            const expiresAt = new Date(Date.now() + minutes * 60000);

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("JWT_SECRET is not defined. Cannot sign token.");
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server configuration error, cannot issue token." });
                return;
            }

            const token = jwt.sign(
                {
                    user: userClaims,
                    exp: expiresAt.getTime() / 1000,
                },
                secret
            );

            res.status(StatusCodes.OK).json({
                userClaims: userClaims,
                expiresAt: expiresAt.getTime(),
                accessToken: token,
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Login failed due to a server error" });
        }
    }

    /**
     * Registers a new user.
     * @param {Request} req - Express request object, body should contain UserCredentials.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { username, password }: UserCredentials = req.body;
        console.log("Registration attempt with credentials:", { username, password });

        if (!username || !password) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Username and password are required." });
            return;
        }
        // TODO: implement better password policy
        if (password.length < 6) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Password must be at least 6 characters long." });
            return;
        }

        try {
            const existingUser = await pool.query(
                'SELECT user_id FROM "user" WHERE user_name = $1',
                [username]
            );

            if (existingUser.rows.length > 0) {
                console.log("Registration failed: User already exists with username:", username);
                res.status(StatusCodes.CONFLICT).json({ message: "User already exists" });
                return;
            }

            const saltRounds = 10;
            const hashedPassword = bcrypt.hashSync(password, saltRounds);

            const result = await pool.query(
                'INSERT INTO "user" (user_name, user_password) VALUES ($1, $2) RETURNING user_id',
                [username, hashedPassword]
            );

            const userId = result.rows[0].user_id;
            console.log("User registered successfully with ID:", userId);
            res.status(StatusCodes.CREATED).json({ message: "User registered successfully", userId: userId });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Registration failed due to a server error" });
        }
    }

    /**
 * Retrieves the current user's profile information based on JWT token.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
    async getCurrentUser(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            let userId: number | undefined;

            // Extract userId from token
            if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
                userId = authReq.payload.user.userId;
            } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
                userId = authReq.payload.userId;
            }

            if (!userId) {
                res.status(StatusCodes.UNAUTHORIZED).send("Invalid user identification in token");
                return;
            }

            // Query user data, excluding password
            const userResult = await pool.query(
                `SELECT user_id, user_name, email, bio, 
                    created_at as join_date
             FROM "user" 
             WHERE user_id = $1`,
                [userId]
            );

            if (userResult.rows.length === 0) {
                res.status(StatusCodes.NOT_FOUND).send("User not found");
                return;
            }

            // Return user data
            const userData = userResult.rows[0];

            // Format response to match frontend expectations
            const response = {
                userId: userData.user_id,
                username: userData.user_name,
                email: userData.email || null,
                bio: userData.bio || null,
                joinDate: userData.join_date || new Date().toISOString()
            };

            res.status(StatusCodes.OK).json(response);
        } catch (error) {
            console.error("Error fetching current user:", error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Failed to retrieve user profile");
        }
    }

    /**
     * Updates the current user's profile information.
     * @param {Request} req - Express request object with user data in body.
     * @param {Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async updateCurrentUser(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            let userId: number | undefined;

            // Extract userId from token
            if (authReq.payload && authReq.payload.user && typeof authReq.payload.user.userId === 'number') {
                userId = authReq.payload.user.userId;
            } else if (authReq.payload && typeof authReq.payload.userId === 'number') {
                userId = authReq.payload.userId;
            }

            if (!userId) {
                res.status(StatusCodes.UNAUTHORIZED).send("Invalid user identification in token");
                return;
            }

            // Extract update data from request body
            const { username, email, bio, password } = req.body;

            // Build update query dynamically based on provided fields
            let updateFields = [];
            let queryParams = [];
            let paramCounter = 1;

            if (username !== undefined) {
                // Check if username is already taken
                const usernameCheck = await pool.query(
                    'SELECT user_id FROM "user" WHERE user_name = $1 AND user_id != $2',
                    [username, userId]
                );

                if (usernameCheck.rows.length > 0) {
                    res.status(StatusCodes.CONFLICT).send("Username already taken");
                    return;
                }

                updateFields.push(`user_name = $${paramCounter++}`);
                queryParams.push(username);
            }

            if (email !== undefined) {
                // Check if email format is valid
                if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    res.status(StatusCodes.BAD_REQUEST).send("Invalid email format");
                    return;
                }

                updateFields.push(`email = $${paramCounter++}`);
                queryParams.push(email);
            }

            if (bio !== undefined) {
                updateFields.push(`bio = $${paramCounter++}`);
                queryParams.push(bio);
            }

            if (password !== undefined && password.trim() !== '') {
                // Hash the new password
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push(`user_password = $${paramCounter++}`);
                queryParams.push(hashedPassword);
            }

            // If no fields to update
            if (updateFields.length === 0) {
                res.status(StatusCodes.BAD_REQUEST).send("No valid update fields provided");
                return;
            }

            // Add the user_id as the last parameter
            queryParams.push(userId);

            // Execute the update query
            const updateQuery = `
            UPDATE "user" 
            SET ${updateFields.join(', ')}, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $${paramCounter}
            RETURNING user_id, user_name, email, bio, created_at as join_date
        `;

            const result = await pool.query(updateQuery, queryParams);

            if (result.rows.length === 0) {
                res.status(StatusCodes.NOT_FOUND).send("User not found");
                return;
            }

            // Format the response
            const updatedUser = result.rows[0];
            const response = {
                userId: updatedUser.user_id,
                username: updatedUser.user_name,
                email: updatedUser.email || null,
                bio: updatedUser.bio || null,
                joinDate: updatedUser.join_date
            };

            res.status(StatusCodes.OK).json(response);
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Failed to update user profile");
        }
    }
}