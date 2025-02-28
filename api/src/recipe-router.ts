import express from "express";
import { StatusCodes } from "http-status-codes";
import { getAllRecipes } from "./recipe-repository";

export const recipeRouter = express.Router();

recipeRouter.get("/", (request, response) => {
    response.status(StatusCodes.OK).send(getAllRecipes())
});