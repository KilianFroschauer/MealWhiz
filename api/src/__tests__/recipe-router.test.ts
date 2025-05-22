import request from 'supertest';
import express from 'express';
import { recipeRouter } from '../recipe-router';
import { Recipe } from '../recipe-repository';

const app = express();
app.use('/recipes', recipeRouter);

// Note: These tests assume your database is populated with the data from the SQL script you shared

describe('Recipe Router with Real Database', () => {
  // Add a longer timeout for these tests since they use a real database
  jest.setTimeout(10000);

  test('GET /recipes?mt=Dinner returns dinner recipes', async () => {
    const response = await request(app).get('/recipes?mt=Dinner');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Check if we have the dinner recipes we expect from the database
    const recipeNames: string[] = response.body.map((recipe: Recipe) => recipe.name);
    expect(recipeNames).toContain('Spaghetti Carbonara');
    expect(recipeNames).toContain('Käsespätzle');
    expect(recipeNames).toContain('Tomatensuppe');
    expect(recipeNames).toContain('Wiener Schnitzel');
  });

  test('GET /recipes?mt=Dessert returns dessert recipes', async () => {
    const response = await request(app).get('/recipes?mt=Dessert');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // We expect Apfelstrudel to be returned
    const recipeNames: string[] = response.body.map((recipe: Recipe) => recipe.name);
    expect(recipeNames).toContain('Apfelstrudel');
    expect(response.body.length).toBe(1); // We should only have one dessert
  });

  test('GET /recipes?mt=Breakfast returns empty array when no breakfast recipes exist', async () => {
    const response = await request(app).get('/recipes?mt=Breakfast');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0); // No breakfast recipes in our test data
  });

  test('GET /recipes?mt=Lunch,Dinner returns recipes for either meal time', async () => {
    const response = await request(app).get('/recipes?mt=Lunch,Dinner');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Check if we have lunch and dinner recipes
    const recipeNames: string[] = response.body.map((recipe: Recipe) => recipe.name);
    expect(recipeNames).toContain('Spaghetti Carbonara');
    expect(recipeNames).toContain('Käsespätzle');
    expect(recipeNames).toContain('Tomatensuppe');
    expect(recipeNames).toContain('Wiener Schnitzel');
  });

  test('GET /recipes combines meal time with other filters', async () => {
    // Test for Italian dinner recipes
    const response = await request(app).get('/recipes?mt=Dinner&tags=Italian');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // We should only get Spaghetti Carbonara (Italian dinner)
    const recipeNames: string[] = response.body.map((recipe: Recipe) => recipe.name);
    expect(recipeNames).toContain('Spaghetti Carbonara');
    expect(recipeNames).not.toContain('Käsespätzle'); // German, not Italian
    expect(recipeNames).not.toContain('Apfelstrudel'); // Not a dinner recipe
  });

  test('GET /recipes with multiple filters returns correct recipes', async () => {
    // Test for vegetarian dinner recipes that take less than 30 minutes
    const response = await request(app).get('/recipes?mt=Dinner&dp=vegetarian&maxTime=30');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // We should only get Tomatensuppe (vegetarian dinner under 30 mins)
    const recipeNames: string[] = response.body.map((recipe: { name: string }) => recipe.name);
    expect(recipeNames).toContain('Tomatensuppe');
    expect(recipeNames).not.toContain('Käsespätzle'); // Takes 30 minutes exactly
    expect(recipeNames).not.toContain('Spaghetti Carbonara'); // Not vegetarian
  });

  // Optional: Test for partial response structure
  test('Recipe response has correct structure', async () => {
    const response = await request(app).get('/recipes?mt=Dinner');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Check first recipe structure
    const recipe = response.body[0];
    expect(recipe).toHaveProperty('id');
    expect(recipe).toHaveProperty('name');
    expect(recipe).toHaveProperty('time');
    expect(recipe).toHaveProperty('difficulty');
    expect(recipe).toHaveProperty('ratings');
    
    // You can add more detailed structure checks if needed
  });
});