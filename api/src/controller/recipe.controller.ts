import { Request, Response, NextFunction } from 'express';
import { getAllRecipes, getRecipeById, getFilteredRecipes, updateRecipeRating, getUserRecipeRating } from '../repository/recipe.repository';
import { convertToSimpleRecipe } from '../utils/recipe.utils';
import { AuthRequest } from '../middlewares/auth.middlware';
import { toggleRecipeFavorite as toggleFavoriteRecipe, isRecipeFavorited } from '../repository/recipe.repository';
// Convert query params to arrays (handles single or multiple values)
const parseArrayParam = (param: string | string[] | undefined) =>
    param ? (Array.isArray(param) ? param : param.split(",")) : [];

export class RecipeController {
    async getAllRecipes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const recipes = await getAllRecipes();
            res.json(recipes); // Return full recipe objects
        } catch (error) {
            next(error);
        }
    }

    async getRecipeById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const recipeId = parseInt(req.params.id);

            if (isNaN(recipeId)) {
                res.status(400).json({ error: "Invalid recipe ID" });
            }
            else {

                const recipe = await getRecipeById(recipeId);

                if (recipe) {
                    res.status(200).send(recipe);
                } else {
                    res.status(404).send({ error: "Recipe not found" });
                }
            }
        } catch (error) {
            console.error(`Error fetching recipe ${req.params.id}:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async searchRecipes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query.query as string | undefined;

            if (!query || typeof query !== "string") {
                res.status(400).json({ error: "Query parameter is required" });
            }
            else {
                const searchResults = await getFilteredRecipes({ query });
                res.status(200).json(convertToSimpleRecipe(searchResults));
            }

        } catch (error) {
            console.error('Error in search endpoint:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getFilteredRecipes(req: Request, res: Response, next: NextFunction): Promise<void> {
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
                    ingredients: ingredients // Pass the array directly
                });
                res.status(200).json(convertToSimpleRecipe(filteredRecipes));
            }
        } catch (error) {
            console.error('Error in filter endpoint:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async rateRecipe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const recipeId = parseInt(req.params.id);
            const { rating } = req.body;

            // Validate inputs
            if (isNaN(recipeId)) {
                res.status(400).json({ error: "Invalid recipe ID" });
                return;
            }

            // Check if rating is a number between 1-5
            const ratingValue = parseInt(rating);
            if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                res.status(400).json({ error: "Rating must be a number between 1 and 5" });
                return;
            }

            const updatedRecipe = await updateRecipeRating(recipeId, ratingValue, authReq.payload.user.userId);

            if (updatedRecipe) {
                res.status(200).json({ success: true, newRating: updatedRecipe.ratings });
            } else {
                res.status(404).json({ error: "Recipe not found" });
            }
        } catch (error) {
            console.error(`Error rating recipe:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const recipeId = parseInt(req.params.id);

            // Validate recipe ID
            if (isNaN(recipeId)) {
                res.status(400).json({ error: "Invalid recipe ID" });
                return;
            }

            const result = await toggleFavoriteRecipe(recipeId, authReq.payload.user.userId);

            res.status(200).json({
                success: true,
                isFavorite: result.added
            });
        } catch (error) {
            console.error(`Error toggling favorite for recipe:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async checkFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const recipeId = parseInt(req.params.id);

            // Validate recipe ID
            if (isNaN(recipeId)) {
                res.status(400).json({ error: "Invalid recipe ID" });
                return;
            }

            const isFavorite = await isRecipeFavorited(authReq.payload.user.userId, recipeId);

            res.status(200).json({
                isFavorite
            });
        } catch (error) {
            console.error(`Error checking favorite status:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getUserRatingForRecipe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const recipeId = parseInt(req.params.id);

            // Validate recipe ID
            if (isNaN(recipeId)) {
                res.status(400).json({ error: "Invalid recipe ID" });
                return;
            }

            const rating = await getUserRecipeRating(authReq.payload.user.userId, recipeId);
            res.status(200).json({ rating });
        } catch (error) {
            console.error(`Error getting user rating for recipe:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

}