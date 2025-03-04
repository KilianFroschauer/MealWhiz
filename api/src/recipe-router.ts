import express from "express";
import { StatusCodes } from "http-status-codes";
import { getAllRecipes, getRecipeById, Recipe } from "./recipe-repository";

export const recipeRouter = express.Router();

// Convert query params to arrays (handles single or multiple values)
const parseArrayParam = (param: string | string[] | undefined) =>
    param ? (Array.isArray(param) ? param : param.split(",")) : [];

recipeRouter.get("/", (req, res) => {
    let filteredRecipes = getAllRecipes();

    // Get parameter
    const { name, minRating, maxCal, minCal, diff, maxTime } = req.query;
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

    // Filter by name
    //if (name) {
    //  filteredRecipes = filteredRecipes.filter(recipe =>
    //    recipe.name.toLowerCase().includes(name.toString().toLowerCase())
    //  );
    //}

    res.status(StatusCodes.OK).send(filteredRecipes);
});

recipeRouter.get("/:id", (request, response) => {
    const bookId: number = parseInt(request.params.id);
    const recipe: Recipe | undefined = getRecipeById(bookId);

    if (recipe !== undefined) {
        response.status(StatusCodes.OK).send(recipe);
    }

    response.status(StatusCodes.BAD_REQUEST).send();
});