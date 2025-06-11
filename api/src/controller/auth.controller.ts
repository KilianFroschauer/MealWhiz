import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config';
import { UserCredentials } from '../models/auth.models';

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
}