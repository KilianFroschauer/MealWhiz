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

// TODO secure user routes with authentication middleware
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

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the profile information of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: number
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   nullable: true
 *                   example: john@example.com
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: I love cooking Italian food
 *                 joinDate:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-01-15T00:00:00.000Z
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.get("/users/me", isAuthenticated, authController.getCurrentUser);

/**
 * @swagger
 * /users/update:
 *   put:
 *     summary: Update current user profile
 *     description: Updates the profile information of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe2
 *                 description: New username
 *               email:
 *                 type: string
 *                 example: john.new@example.com
 *                 description: New email address
 *               bio:
 *                 type: string
 *                 example: Food enthusiast from Italy
 *                 description: User biography
 *               password:
 *                 type: string
 *                 example: newSecretPassword
 *                 description: New password (will be hashed)
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: number
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe2
 *                 email:
 *                   type: string
 *                   nullable: true
 *                   example: john.new@example.com
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: Food enthusiast from Italy
 *                 joinDate:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-01-15T00:00:00.000Z
 *       400:
 *         description: Bad request - invalid data provided
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict - username already exists
 *       500:
 *         description: Server error
 */
authRouter.put("/users/update", isAuthenticated, authController.updateCurrentUser);

/**
 * @swagger
 * /validate-token:
 *   get:
 *     summary: Validate JWT token
 *     description: Checks if the current JWT token is still valid
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Token is invalid or expired
 */
authRouter.get("/validate-token", isAuthenticated, authController.validateToken);

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     tags:
 *       - user
 *     summary: Get user's favorite recipes
 *     description: Get all recipes that the current user has favorited
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized - user must be logged in
 */
authRouter.get("/users/favorites", isAuthenticated, authController.getFavorites);