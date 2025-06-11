import express from "express";
import { isAuthenticated } from "../middlewares/auth.middlware";
import { AuthController } from "../controller/auth.controller";

export const authRouter = express.Router();

const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and management
 */

// TODO: Secure /users route
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
authRouter.get("/users", isAuthenticated, authController.getAllUsers);

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
authRouter.post("/login", authController.loginUser);

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
authRouter.post("/register", authController.registerUser);