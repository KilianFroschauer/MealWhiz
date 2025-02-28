import express from "express";
import { StatusCodes } from "http-status-codes";
import { getAllRecipes, getRecipeById, Recipe } from "./recipe-repository";

export const recipeRouter = express.Router();

recipeRouter.get("/", (request, response) => {
    response.status(StatusCodes.OK).send(getAllRecipes());
});

recipeRouter.get("/:id", (request, response) => {
    const bookId: number = parseInt(request.params.id);
    const recipe: Recipe | undefined = getRecipeById(bookId); 

    if(recipe !== undefined) {
        response.status(StatusCodes.OK).send(recipe);
    }

    response.status(StatusCodes.BAD_REQUEST).send();
});