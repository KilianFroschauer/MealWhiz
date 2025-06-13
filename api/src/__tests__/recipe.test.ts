import { SimpleRecipe } from "../models/recipe.models";
import request from "supertest";
import app from "../app";

describe("Recipe API", () => {
    describe("GET /recipes/:id", () => {
        it("should return a recipe if a valid ID is provided", async () => {
            const recipeId = 1; // Assuming recipe with ID 1 exists in your test DB
            const res = await request(app).get(`/recipes/${recipeId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("id", recipeId);
            expect(res.body).toHaveProperty("name");
            // ... more assertions on the recipe object structure
        });

        it("should return 404 if recipe ID does not exist", async () => {
            const recipeId = 9999; // Non-existent ID
            const res = await request(app).get(`/recipes/${recipeId}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty("error", "Recipe not found");
        });

        it("should return 400 if recipe ID is invalid", async () => {
            const res = await request(app).get("/recipes/invalid-id");
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("error", "Invalid recipe ID");
        });
    });

    describe("GET /recipes", () => {
        it("should return a list of recipes", async () => {
            const res = await request(app).get("/recipes");
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            // Optionally, check if items have the SimpleRecipe structure
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty("id");
                expect(res.body[0]).toHaveProperty("name");
                expect(res.body[0]).not.toHaveProperty("instructions"); // SimpleRecipe
            }
        });

        it("should filter recipes by minRating", async () => {
            const res = await request(app).get("/recipes?minRating=4");
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach((recipe: SimpleRecipe) => {
                expect(recipe.ratings).toBeGreaterThanOrEqual(4);
            });
        });
        // ... more filter tests
    });

    describe("GET /recipes/search", () => {
        it("should return recipes matching the search query", async () => {
            const res = await request(app).get("/recipes/search?query=Chicken");
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            // Add more specific assertions based on expected search results
        });

        it("should return 400 if query parameter is missing", async () => {
            const res = await request(app).get("/recipes/search");
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("error", "Query parameter is required");
        });
    });
});
