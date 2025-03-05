import express from "express";
import { StatusCodes } from "http-status-codes";
import { convertToSimpleRecipe, getAllRecipes, getRecipeById, Recipe } from "./recipe-repository";
import { error } from "console";

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
recipeRouter.get("/search", (request, response) => {
    const query = request.query.query as string | undefined;

    if (!query || typeof query !== "string") {
        response.status(400).json({ error: "Query parameter is required" });
    }
    else {
        const lowerQuery = query.toLowerCase();

        const searchResults = getAllRecipes().filter(recipe =>
            recipe.name.toLowerCase().includes(lowerQuery) ||  // Match in name
            recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerQuery)) ||  // Match in ingredients
            recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) // Match in tags
        );

        response.status(200).json(convertToSimpleRecipe(searchResults));
    }
})

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
recipeRouter.get("/", (req, res) => {
    let filteredRecipes = getAllRecipes();

    // Get parameter
    const { minRating, maxCal, minCal, diff, maxTime } = req.query;
    const dietaryPreferences = parseArrayParam(req.query.dp as string | string[] | undefined);
    const allergens = parseArrayParam(req.query.a as string | string[] | undefined);
    const mealTimes = parseArrayParam(req.query.mt as string | string[] | undefined);
    const tags = parseArrayParam(req.query.tags as string | string[] | undefined);
    const ingredients = parseArrayParam(req.query.ing as string | string[] | undefined);

    // Filter by ingredients
    if (ingredients.length) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            ingredients.every(ing => recipe.ingredients.includes(ing))
        );
    }

    // Filter by dietary preferneces
    if (dietaryPreferences.length) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            dietaryPreferences.every(diet => recipe.dietaryPreferences.includes(diet))
        );
    }

    // Filter by allergens
    if (allergens.length) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            !allergens.some(allergen => recipe.allergens.includes(allergen))
        );
    }

    // Filter by maximum calories
    if (maxCal) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.calories <= parseInt(maxCal as string)
        );
    }

    // Filter by minimum calories
    if (minCal) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.calories >= parseInt(minCal as string)
        );
    }

    // Filter by minimum rating
    if (minRating) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.ratings >= parseFloat(minRating as string)
        );
    }

    // Filter by maximum time
    if (maxTime) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.time <= parseFloat(maxTime as string)
        );
    }

    // Filter by difficulty
    if (diff) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.difficulty === diff);
    }

    // Filter by meal times
    if (mealTimes.length) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            mealTimes.some(meal => recipe.mealTimes.includes(meal))
        );
    }

    // Filter by tags
    if (tags.length) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            tags.some(tag => recipe.tags.includes(tag))
        );
    }

    res.status(StatusCodes.OK).send(convertToSimpleRecipe(filteredRecipes));
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
 *       400:
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
recipeRouter.get("/:id", (request, response) => {
    const bookId: number = parseInt(request.params.id);
    const recipe: Recipe | undefined = getRecipeById(bookId);

    if (recipe !== undefined) {
        response.status(StatusCodes.OK).send(recipe);
    }

    response.status(StatusCodes.BAD_REQUEST).send({error: "Recipe not found"});
});