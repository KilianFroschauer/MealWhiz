import express from "express";
import { RecipeController } from "../controller/recipe.controller";
import { isAuthenticated } from "../middlewares/auth.middlware";

export const recipeRouter = express.Router();
const recipeController = new RecipeController();

/**
 * @swagger
 * tags:
 *   name: recipe
 *   description: API endpoints for managing recipes
 */

/**
 * @swagger
 * /recipes/search:
 *   get:
 *     tags:
 *       - recipe
 *     summary: Search for recipes based on query
 *     description: This endpoint allows searching for recipes by name, ingredients, or tags using a query string.
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The search query string to filter recipes by name, ingredients, or tags.
 *     responses:
 *       200:
 *         description: A list of recipes that match the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The unique identifier for the recipe.
 *                   name:
 *                     type: string
 *                   time:
 *                     type: integer
 *                     description: Preparation time in minutes.
 *                   difficulty:
 *                     type: string
 *                     enum: [easy, medium, hard]
 *                     description: Difficulty level of the recipe.
 *       400:
 *         description: Query parameter is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Query parameter is required"
 */
recipeRouter.get("/search", recipeController.searchRecipes);

/**
 * @swagger
 * /recipes:
 *   get:
 *     tags:
 *       - recipe
 *     summary: Get filtered recipes
 *     description: Retrieve a list of recipes based on various filters.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter recipes by name (partial match)
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum recipe rating (0-5)
 *       - in: query
 *         name: maxCal
 *         schema:
 *           type: integer
 *         description: Maximum calories
 *       - in: query
 *         name: minCal
 *         schema:
 *           type: integer
 *         description: Minimum calories
 *       - in: query
 *         name: diff
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: maxTime
 *         schema:
 *           type: number
 *         description: Maximum preparation time in minutes
 *       - in: query
 *         name: dp
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [standard, vegetarian, vegan, pescetarian, keto, paleo, flexitarian]
 *         description: Filter by dietary preferences (comma-separated)
 *       - in: query
 *         name: a
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [
 *               'Egg', 
 *               'Milk or lactose', 
 *               'Gluten-containing grains',
 *               'Crustaceans',
 *               'Fish',
 *               'Peanut', 
 *               'Soy',
 *               'Edible nuts',
 *               'Celery',
 *               'Mustard',
 *               'Sesame',
 *               'Sulphites',
 *               'Lupines',
 *               'Molluscs'
 *             ]
 *         description: Filter by allergens to exclude (comma-separated)
 *       - in: query
*         name: mt
*         schema:
*           type: array
*           items:
*             type: string
*             enum: [Breakfast, Lunch, Dinner, Snack, Dessert]
*         description: Filter by meal times (comma-separated)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by recipe tags (comma-separated)
 *       - in: query
 *         name: ing
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter recipes that must contain all specified ingredients
 *     responses:
 *       200:
 *         description: A list of filtered recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The unique identifier for the recipe.
 *                   name:
 *                     type: string
 *                   time:
 *                     type: integer
 *                     description: Preparation time in minutes.
 *                   difficulty:
 *                     type: string
 *                     enum: [easy, medium, hard]
 *                     description: Difficulty level of the recipe.
 */
recipeRouter.get("/", recipeController.getFilteredRecipes);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     tags:
 *       - recipe
 *     summary: Get a specific recipe
 *     description: Retrieve a single recipe by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe
 *     responses:
 *       200:
 *         description: Successfully retrieved the recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The unique identifier for the recipe.
 *                 name:
 *                   type: string
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: string
 *                 ingredientsAmount:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Quantities and units for each ingredient (e.g., "200 g").
 *                 instructions:
 *                   type: string
 *                   description: Step-by-step cooking instructions (may contain markdown).
 *                 ratings:
 *                   type: number
 *                   description: Rating of the recipe.
 *                 dietaryPreferences:
 *                   type: array
 *                   items:
 *                     type: string
 *                 desciption:
 *                   type: string
 *                   description: Recipe description or background information.
 *                 allergens:
 *                   type: array
 *                   items:
 *                     type: string
 *                 calories:
 *                   type: integer
 *                   description: Calories in the recipe.
 *                 proteins:
 *                   type: integer
 *                   description: Total protein content in grams.
 *                 carbs:
 *                   type: integer
 *                   description: Total carbohydrate content in grams.
 *                 fat:
 *                   type: integer
 *                   description: Total fat content in grams.
 *                 time:
 *                   type: integer
 *                   description: Preparation time in minutes.
 *                 difficulty:
 *                   type: string
 *                   enum: [easy, medium, hard]
 *                   description: Difficulty level of the recipe.
 *                 mealTimes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 servings:
 *                   type: integer
 *                   description: Number of servings the recipe makes.
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Recipe not found"
 */
recipeRouter.get("/:id", recipeController.getRecipeById);

/**
 * @swagger
 * /recipes/{id}/rate:
 *   post:
 *     tags:
 *       - recipe
 *     summary: Rate a recipe
 *     description: Submit a rating for a recipe (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value from 1 to 5
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 newRating:
 *                   type: number
 *                   example: 4.5
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - user must be logged in
 *       404:
 *         description: Recipe not found
 */
recipeRouter.post("/:id/rate", isAuthenticated, recipeController.rateRecipe);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   post:
 *     tags:
 *       - recipe
 *     summary: Toggle a recipe as favorite
 *     description: Add or remove a recipe from the user's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe to favorite/unfavorite
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isFavorite:
 *                   type: boolean
 *                   description: Whether the recipe is now favorited
 *                 count:
 *                   type: integer
 *                   description: Total number of users who favorited this recipe
 *       401:
 *         description: Unauthorized - user must be logged in
 */
recipeRouter.post("/:id/favorite", isAuthenticated, recipeController.toggleFavorite);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   get:
 *     tags:
 *       - recipe
 *     summary: Check if a recipe is favorited
 *     description: Check if the current user has favorited a specific recipe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe to check
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *       401:
 *         description: Unauthorized - user must be logged in
 */
recipeRouter.get("/:id/favorite", isAuthenticated, recipeController.checkFavorite);
