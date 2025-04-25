import express from "express";
import { StatusCodes } from "http-status-codes";
import { convertToSimpleRecipe, getAllRecipes, getFilteredRecipes, getRecipeById, Recipe } from "./recipe-repository";

export const recipeRouter = express.Router();

// Convert query params to arrays (handles single or multiple values)
const parseArrayParam = (param: string | string[] | undefined) =>
    param ? (Array.isArray(param) ? param : param.split(",")) : [];

/**
 * @swagger
 * /recipes/search:
 *   get:
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
recipeRouter.get("/search", async (request, response) => {
    try {
        const query = request.query.query as string | undefined;

        if (!query || typeof query !== "string") {
            response.status(400).json({ error: "Query parameter is required" });
        }
        else {
            const searchResults = await getFilteredRecipes({ query });
            response.status(200).json(convertToSimpleRecipe(searchResults));
        }

    } catch (error) {
        console.error('Error in search endpoint:', error);
        response.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /recipes:
 *   get:
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
 *         description: Exclude recipes with these allergens (comma-separated)
 *       - in: query
 *         name: mt
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by meal times (e.g., breakfast, dinner)
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
recipeRouter.get("/", async (req, res) => {
    try {

        // Define all valid query parameters
        const validParams = [
            'name', 'minRating', 'maxCal', 'minCal', 'diff', 'maxTime',
            'dp', 'a', 'mt', 'tags', 'ing'
        ];

        // Check for invalid parameters
        const invalidParams = Object.keys(req.query).filter(param => !validParams.includes(param));

        // If invalid parameters were found, return a 400 error
        if (invalidParams.length > 0) {
            res.status(400).json({
                error: `Invalid query parameter(s): ${invalidParams.join(', ')}`,
                validParameters: validParams
            });
        }
        else {

            // Get parameter
            const { name, minRating, maxCal, minCal, diff, maxTime } = req.query;
            const dietaryPreferences = parseArrayParam(req.query.dp as string | string[] | undefined);
            const allergens = parseArrayParam(req.query.a as string | string[] | undefined);
            const mealTimes = parseArrayParam(req.query.mt as string | string[] | undefined);
            const tags = parseArrayParam(req.query.tags as string | string[] | undefined);
            const ingredients = parseArrayParam(req.query.ing as string | string[] | undefined);

            const filteredRecipes = await getFilteredRecipes({
                name: name ? (name as string) : undefined,
                minRating: minRating ? parseFloat(minRating as string) : undefined,
                maxCal: maxCal ? parseInt(maxCal as string) : undefined,
                minCal: minCal ? parseInt(minCal as string) : undefined,
                diff: diff as string,
                maxTime: maxTime ? parseInt(maxTime as string) : undefined,
                dietaryPreferences: dietaryPreferences as string[],
                allergens: allergens as string[],
                mealTimes: mealTimes as string[],
                tags: tags as string[],
                ingredients: ingredients.join(",")
            });
            res.status(200).json(convertToSimpleRecipe(filteredRecipes));
        }
    } catch (error) {
        console.error('Error in filter endpoint:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /recipes/{id}:
 *   get:
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
 *                 ratings:
 *                   type: number
 *                   description: Rating of the recipe.
 *                 dietaryPreferences:
 *                   type: array
 *                   items:
 *                     type: string
 *                 allergens:
 *                   type: array
 *                   items:
 *                     type: string
 *                 calories:
 *                   type: integer
 *                   description: Calories in the recipe.
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
recipeRouter.get("/:id", async (request, response) => {
    try {
        const recipeId = parseInt(request.params.id);

        if (isNaN(recipeId)) {
            response.status(400).json({ error: "Invalid recipe ID" });
        }
        else {

            const recipe = await getRecipeById(recipeId);

            if (recipe) {
                response.status(200).send(recipe);
            } else {
                response.status(404).send({ error: "Recipe not found" });
            }
        }
    } catch (error) {
        console.error(`Error fetching recipe ${request.params.id}:`, error);
        response.status(500).json({ error: "Internal server error" });
    }
});