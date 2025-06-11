import { pool } from "../config";
import { Recipe, RecipeFilterOptions } from "../models/recipe.models";
import {
  parseIngredients,
  mapDifficultyToEnum,
  determineMealTimes, 
  calculateRecipeNutrition,
} from "../utils/recipe.utils";

const BASE_RECIPE_SELECT_QUERY = `
  SELECT 
    r.recipe_id, 
    r.title, 
    r.ingredients, 
    r.instructions,
    r.total_time,
    r.rating,
    r.description,
    d.difficulty,
    dp.diary_pref,
    c.cuisine,
    ARRAY(
      SELECT a.allergen 
      FROM recipe_allergen ra 
      JOIN allergens a ON ra.allergen_id = a.allergens_id 
      WHERE ra.recipe_id = r.recipe_id
    ) as allergen_list,
    r.meal_times -- Assuming meal_times is a column in the recipe table
  FROM recipe r
  LEFT JOIN difficulty d ON r.difficulty = d.difficulty_id
  LEFT JOIN diary_pref dp ON r.diary_pref_id = dp.diary_pref_id
  LEFT JOIN cuisine c ON r.cuisine_id = c.cuisine_id
`;

/**
 * Fetches all recipes from the database.
 * @returns A promise that resolves to an array of Recipe objects.
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const query = `
      SELECT 
        r.recipe_id, 
        r.title, 
        r.ingredients, 
        r.total_time,
        r.rating,
        r.description,
        d.difficulty,
        dp.diary_pref,
        c.cuisine,
        ARRAY(
          SELECT a.allergen 
          FROM recipe_allergen ra 
          JOIN allergens a ON ra.allergen_id = a.allergens_id 
          WHERE ra.recipe_id = r.recipe_id
        ) as allergen_list,
        r.meal_times
      FROM recipe r
      LEFT JOIN difficulty d ON r.difficulty = d.difficulty_id
      LEFT JOIN diary_pref dp ON r.diary_pref_id = dp.diary_pref_id
      LEFT JOIN cuisine c ON r.cuisine_id = c.cuisine_id
    `;
    
    const result = await pool.query(query);
    return mapDbRowsToRecipes(result.rows);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
}

/**
 * Fetches a single recipe by its ID.
 * @param id The ID of the recipe to fetch.
 * @returns A promise that resolves to a Recipe object or undefined if not found.
 */
export async function getRecipeById(id: number): Promise<Recipe | undefined> {
  try {
    const query = `${BASE_RECIPE_SELECT_QUERY} WHERE r.recipe_id = $1`;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return undefined;
    }

    const recipes = await mapDbRowsToRecipes(result.rows);
    return recipes[0];
  } catch (error) {
    console.error(`Error fetching recipe with id ${id}:`, error);
    throw error;
  }
}

/**
 * Fetches recipes based on a set of filter criteria.
 * @param filters An object containing various filter options.
 * @returns A promise that resolves to an array of filtered Recipe objects.
 */
export async function getFilteredRecipes(filters: RecipeFilterOptions): Promise<Recipe[]> {
  try {
    let queryText = BASE_RECIPE_SELECT_QUERY;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // General query filter (searches title, ingredients, cuisine)
    if (filters.query) {
      conditions.push(`
        (r.title ILIKE $${paramIndex} OR 
         r.ingredients ILIKE $${paramIndex} OR 
         c.cuisine ILIKE $${paramIndex})
      `);
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    // Filter by recipe name
    if (filters.name) {
      conditions.push(`r.title ILIKE $${paramIndex}`);
      params.push(`%${filters.name}%`);
      paramIndex++;
    }

    // Filter by minimum rating
    if (filters.minRating !== undefined) {
      conditions.push(`r.rating >= $${paramIndex}`);
      params.push(filters.minRating);
      paramIndex++;
    }

    // Filter by maximum preparation/cooking time
    if (filters.maxTime !== undefined) {
      conditions.push(`r.total_time <= $${paramIndex}`);
      params.push(filters.maxTime);
      paramIndex++;
    }

    // Filter by difficulty
    if (filters.diff) {
      conditions.push(`d.difficulty = $${paramIndex}`);
      params.push(filters.diff);
      paramIndex++;
    }

    // Filter by dietary preferences
    if (filters.dietaryPreferences?.length) {
      conditions.push(`dp.diary_pref = ANY($${paramIndex})`);
      params.push(filters.dietaryPreferences);
      paramIndex++;
    }

    // Filter to exclude recipes containing specified allergens
    if (filters.allergens?.length) {
      // Exclude recipes with specified allergens
      conditions.push(`
        NOT EXISTS (
          SELECT 1 FROM recipe_allergen ra
          JOIN allergens a ON ra.allergen_id = a.allergens_id
          WHERE ra.recipe_id = r.recipe_id AND a.allergens_id = ANY($${paramIndex})
        )
      `);
      params.push(filters.allergens);
      paramIndex++;
    }

    // Filter by ingredients string (e.g., "tomato, onion")
    if (filters.ingredients) {
      conditions.push(`r.ingredients ILIKE $${paramIndex}`);
      params.push(`%${filters.ingredients}%`);
      paramIndex++;
    }

    // Filter by meal times (assumes r.meal_times is an array in the DB)
    if (filters.mealTimes?.length) {
      conditions.push(`r.meal_times && $${paramIndex}::text[]`); // Use array overlap operator
      params.push(filters.mealTimes);
      paramIndex++;
    }

     // Filter by tags (assuming tags are represented by cuisine in this context)
    if (filters.tags?.length) {
        conditions.push(`c.cuisine = ANY($${paramIndex}::text[])`);
        params.push(filters.tags);
        paramIndex++;
    }

    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Execute the query
    const result = await pool.query(queryText, params);
    return mapDbRowsToRecipes(result.rows);
  } catch (error) {
    console.error('Error filtering recipes:', error);
    throw error;
  }
}

/**
 * Maps database rows to Recipe objects.
 * This function handles fetching detailed ingredient lists and calculating nutrition.
 * @param rows An array of rows from the database.
 * @returns A promise that resolves to an array of Recipe objects.
 */
async function mapDbRowsToRecipes(rows: any[]): Promise<Recipe[]> {
  const recipePromises = rows.map(async row => {
    const basicIngredients = parseIngredients(row.ingredients);
    const difficulty = mapDifficultyToEnum(row.difficulty);
    const nutrition = await calculateRecipeNutrition(row.recipe_id);

    // Query to get structured ingredients (name, quantity, unit)
    const ingredientQuery = `
      SELECT 
        fp.product_name AS ingredient_name,
        ri.quantity,
        ri.unit
      FROM recipe_ingredient ri
      JOIN food_products fp ON ri.ingredient_code = fp.code
      WHERE ri.recipe_id = $1
      ORDER BY ingredient_name
    `;

    let ingredients = basicIngredients;
    let ingredientsAmount: string[] = [];
    
    try {
      const client = await pool.connect();
      const result = await client.query(ingredientQuery, [row.recipe_id]);
      client.release();
      
      if (result.rows.length > 0) {
        ingredients = result.rows.map(r => r.ingredient_name);
        ingredientsAmount = result.rows.map(r => `${r.quantity} ${r.unit}`);
      } else {
        ingredientsAmount = basicIngredients.map(() => "");
      }
    } catch (err) {
      console.error(`Error fetching ingredients for recipe ${row.recipe_id}:`, err);
      ingredientsAmount = basicIngredients.map(() => "");
    }

    return {
      id: row.recipe_id,
      name: row.title,
      ingredients: ingredients,
      ingredientsAmount: ingredientsAmount,
      ratings: parseFloat(row.rating) || 0,
      dietaryPreferences: row.diary_pref ? [row.diary_pref] : [],
      description: row.description || '',
      allergens: row.allergen_list || [],
      calories: nutrition.calories,
      proteins: nutrition.proteins,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      time: row.total_time,
      difficulty: difficulty,
      mealTimes: determineMealTimes(row),
      tags: row.cuisine ? [row.cuisine] : [],
      servings: row.servings || 4, 
      instructions: row.instructions || '' 
    };
  });
  
  return Promise.all(recipePromises);
}