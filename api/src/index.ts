import express from "express";
import { setupSwagger } from "./swagger";
import { recipeRouter } from "./recipe-router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/recipes", recipeRouter);

setupSwagger(app);

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
 *       400:
 *         description: Invalid request
 */

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
 *       400:
 *         description: Recipe not found
 */


app.get("/", (request, response) => {
    response.send("Mealwhiz api!")
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });