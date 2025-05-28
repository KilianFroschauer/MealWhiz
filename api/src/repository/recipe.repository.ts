import { pool } from "../config";
import { Recipe, SimpleRecipe } from "../models/recipe.models";

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
        ) as allergen_list
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

export async function getRecipeById(id: number): Promise<Recipe | undefined> {
  try {
    const query = `
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
        ) as allergen_list
      FROM recipe r
      LEFT JOIN difficulty d ON r.difficulty = d.difficulty_id
      LEFT JOIN diary_pref dp ON r.diary_pref_id = dp.diary_pref_id
      LEFT JOIN cuisine c ON r.cuisine_id = c.cuisine_id
      WHERE r.recipe_id = $1
    `;

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

export async function getFilteredRecipes(filters: {
  query?: string;
  name?: string;
  minRating?: number;
  maxCal?: number;
  minCal?: number;
  diff?: string;
  maxTime?: number;
  dietaryPreferences?: string[];
  allergens?: string[];
  mealTimes?: string[];
  tags?: string[];
  ingredients?: string;
}): Promise<Recipe[]> {
  try {
    // Start building the query
    let queryText = `
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
        ) as allergen_list
      FROM recipe r
      LEFT JOIN difficulty d ON r.difficulty = d.difficulty_id
      LEFT JOIN diary_pref dp ON r.diary_pref_id = dp.diary_pref_id
      LEFT JOIN cuisine c ON r.cuisine_id = c.cuisine_id
    `;

    // Where clause conditions and parameters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Add all the filter conditions
    if (filters.query) {
      conditions.push(`
        (r.title ILIKE $${paramIndex} OR 
         r.ingredients ILIKE $${paramIndex} OR 
         c.cuisine ILIKE $${paramIndex})
      `);
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.name) {
      conditions.push(`r.title ILIKE $${paramIndex}`);
      params.push(`%${filters.name}%`);
      paramIndex++;
    }

    if (filters.minRating !== undefined) {
      conditions.push(`r.rating >= $${paramIndex}`);
      params.push(filters.minRating);
      paramIndex++;
    }

    if (filters.maxTime !== undefined) {
      conditions.push(`r.total_time <= $${paramIndex}`);
      params.push(filters.maxTime);
      paramIndex++;
    }

    if (filters.diff) {
      conditions.push(`d.difficulty = $${paramIndex}`);
      params.push(filters.diff);
      paramIndex++;
    }

    if (filters.dietaryPreferences?.length) {
      conditions.push(`dp.diary_pref = ANY($${paramIndex})`);
      params.push(filters.dietaryPreferences);
      paramIndex++;
    }

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

    if (filters.ingredients) {
      conditions.push(`r.ingredients ILIKE $${paramIndex}`);
      params.push(`%${filters.ingredients}%`);
      paramIndex++;
    }

    if (filters.mealTimes?.length) {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM unnest(r.meal_times) AS mt
          WHERE LOWER(mt::text) = ANY(SELECT LOWER(t) FROM unnest($${paramIndex}::text[]) AS t)
        )
      `);
      params.push(filters.mealTimes);
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

export function convertToSimpleRecipe(recipes: Recipe[]): SimpleRecipe[] {
  return recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    time: recipe.time,
    ratings: recipe.ratings,
    difficulty: recipe.difficulty
  }));
}

async function mapDbRowsToRecipes(rows: any[]): Promise<Recipe[]> {
  const recipePromises = rows.map(async row => {
    // Parse ingredients from text to array
    const basicIngredients = parseIngredients(row.ingredients);
    
    // Map difficulty from database to enum value
    const difficulty = mapDifficultyToEnum(row.difficulty);
    
    // Calculate nutrition info
    const nutrition = await calculateRecipeNutrition(row.recipe_id);

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
        // If we have structured ingredient data, use it instead
        ingredients = result.rows.map(r => r.ingredient_name);
        ingredientsAmount = result.rows.map(r => `${r.quantity} ${r.unit}`);
      } else {
        // If no structured data, set empty amounts or try to parse from text
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
      ratings: row.rating || 0,
      dietaryPreferences: row.diary_pref ? [row.diary_pref] : [],
      desciption: row.description || '',
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

function parseIngredients(ingredientsText: string): string[] {
  if (!ingredientsText) return [];

  // Try to handle different formats
  // Could be JSON, comma-separated, or line-separated
  try {
    // Try as JSON first
    return JSON.parse(ingredientsText);
  } catch (e) {
    // If not JSON, try comma-separated
    if (ingredientsText.includes(',')) {
      return ingredientsText.split(',').map(i => i.trim());
    }
    // Otherwise, try line breaks
    return ingredientsText.split(/\r?\n/).filter(line => line.trim().length > 0);
  }
}

function mapDifficultyToEnum(difficultyText: string): "easy" | "medium" | "hard" {
  if (!difficultyText) return "medium"; // Default

  const lowercaseDiff = difficultyText.toLowerCase();
  if (lowercaseDiff.includes('easy')) return "easy";
  if (lowercaseDiff.includes('hard')) return "hard";
  return "medium";
}

function determineMealTimes(row: any): string[] {
  // Use the meal_times array from the database if available
  if (row.meal_times && Array.isArray(row.meal_times)) {
    return row.meal_times;
  }

  // Fallback to the old method if database value is not available
  const mealTimes: string[] = [];
  const titleLower = row.title?.toLowerCase() || '';
  const descLower = row.description?.toLowerCase() || '';

  if (titleLower.includes('breakfast') || descLower.includes('breakfast')) {
    mealTimes.push('Breakfast');
  }
  if (titleLower.includes('lunch') || descLower.includes('lunch')) {
    mealTimes.push('Lunch');
  }
  if (titleLower.includes('dinner') || descLower.includes('dinner')) {
    mealTimes.push('Dinner');
  }
  if (titleLower.includes('dessert') || descLower.includes('dessert')) {
    mealTimes.push('Dessert');
  }
  if (titleLower.includes('snack') || descLower.includes('snack')) {
    mealTimes.push('Snack');
  }

  // If no meal times detected, default to both lunch and dinner
  if (mealTimes.length === 0) {
    mealTimes.push('Lunch', 'Dinner');
  }

  return mealTimes;
}


// Function to get calories only (existing or modified)
async function calculateRecipeCalories(recipeId: number): Promise<number> {
  const nutrition = await calculateRecipeNutrition(recipeId);
  return nutrition.calories;
}



interface NutritionValues {
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
}

// New function to calculate nutritional information for a recipe
async function calculateRecipeNutrition(recipeId: number): Promise<NutritionValues> {
  try {
    const client = await pool.connect();

    // Query to join recipe_ingredient with food_products to get nutritional info
    const nutritionQuery = `
      SELECT 
        SUM(ri.quantity * fp.energy_kcal_100g / 100) AS total_calories,
        SUM(ri.quantity * fp.proteins_100g / 100) AS total_proteins,
        SUM(ri.quantity * fp.carbohydrates_100g / 100) AS total_carbs,
        SUM(ri.quantity * fp.fat_100g / 100) AS total_fat
      FROM recipe_ingredient ri
      JOIN food_products fp ON ri.ingredient_code = fp.code
      WHERE ri.recipe_id = $1
    `;

    const result = await client.query(nutritionQuery, [recipeId]);
    client.release();

    const nutrition = result.rows[0];

    return {
      calories: Math.round(nutrition.total_calories || 0),
      proteins: Math.round(nutrition.total_proteins || 0),
      carbs: Math.round(nutrition.total_carbs || 0),
      fat: Math.round(nutrition.total_fat || 0)
    };
  } catch (error) {
    console.error(`Error calculating nutrition for recipe ${recipeId}:`, error);
    return { calories: 0, proteins: 0, carbs: 0, fat: 0 };
  }
}