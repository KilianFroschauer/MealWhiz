import express from "express";
import { isAuthenticated } from "../middlewares/auth.middlware";
import { CartController } from "../controller/cart.controller";

export const cartRouter = express.Router();
const cartController = new CartController();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Retrieve the user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of items in the shopping cart.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ingredients:
 *                     type: string
 *                     description: The name of the ingredient.
 *                     example: "Tomatoes"
 *                   quantity:
 *                     type: number
 *                     description: The quantity of the ingredient.
 *                     example: 2
 *                   unit:
 *                     type: string
 *                     description: The unit of measurement.
 *                     example: "piece"
 *       401:
 *         description: Unauthorized - User identification in token invalid or not found.
 *       500:
 *         description: Server error while retrieving the shopping cart.
 */
cartRouter.get("/", isAuthenticated, cartController.getCart);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add or update an item in the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredient
 *               - quantity
 *             properties:
 *               ingredient:
 *                 type: string
 *                 description: The name of the ingredient.
 *                 example: "Flour"
 *               quantity:
 *                 type: number
 *                 description: The quantity of the ingredient.
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item saved/updated in the cart.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Eintrag im Warenkorb gespeichert/aktualisiert
 *       400:
 *         description: Invalid request - ingredient and quantity required.
 *       401:
 *         description: Unauthorized - User identification in token invalid or not found.
 *       500:
 *         description: Server error while adding to the shopping cart.
 */
cartRouter.post("/", isAuthenticated, cartController.addToCart);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Remove an item from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredient
 *             properties:
 *               ingredient:
 *                 type: string
 *                 description: The name of the ingredient to remove.
 *                 example: "Tomatoes"
 *     responses:
 *       200:
 *         description: Item removed from the cart.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Eintrag aus dem Warenkorb gelöscht
 *       400:
 *         description: Invalid request - ingredient required.
 *       401:
 *         description: Unauthorized - User identification in token invalid or not found.
 *       404:
 *         description: Item not found in the cart or already deleted.
 *       500:
 *         description: Server error while deleting from the shopping cart.
 */
cartRouter.delete("/", isAuthenticated, cartController.removeFromCart);

/**
 * @swagger
 * /cart/recipe/{recipeId}:
 *   post:
 *     summary: Add all ingredients from a recipe to the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe
 *     responses:
 *       200:
 *         description: Recipe ingredients added to cart
 *       401:
 *         description: Unauthorized - User identification in token invalid
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
cartRouter.post("/recipe/:recipeId", isAuthenticated, cartController.addRecipeToCart);

/**
 * @swagger
 * /cart/export/{format}:
 *   get:
 *     summary: Export shopping cart in specified format
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, csv]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Shopping list exported
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
cartRouter.get("/export/:format", isAuthenticated, cartController.exportCart);

/**
 * @swagger
 * /cart/all:
 *   delete:
 *     summary: Delete all items from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All items removed from cart
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
cartRouter.delete("/all", isAuthenticated, cartController.clearCart);

export default cartRouter;