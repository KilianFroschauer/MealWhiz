import pool from "./database";

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  ratings: number;
  dietaryPreferences: string[];
  desciption: string;
  allergens: string[];
  calories: number;
  time: number;
  difficulty: "easy" | "medium" | "hard";
  mealTimes: string[];
  tags: string[];
}

export interface SimpleRecipe {
  id: number;
  name: string;
  time: number;
  ratings: number;
  difficulty: "easy" | "medium" | "hard";
}

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
          WHERE ra.recipe_id = r.recipe_id AND a.allergen = ANY($${paramIndex})
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

// Helper function to map database rows to Recipe objects
async function mapDbRowsToRecipes(rows: any[]): Promise<Recipe[]> {
  const recipePromises = rows.map(async row => {
    // Parse ingredients from text to array
    const ingredients = parseIngredients(row.ingredients);
    
    // Map difficulty from database to enum value
    const difficulty = mapDifficultyToEnum(row.difficulty);
    
    // Calculate calories from recipe_ingredient junction table
    const calories = await calculateRecipeCalories(row.recipe_id);

    return {
      id: row.recipe_id,
      name: row.title,
      ingredients: ingredients,
      ratings: row.rating || 0,
      dietaryPreferences: row.diary_pref ? [row.diary_pref] : [],
      desciption: row.description || '',
      allergens: row.allergen_list || [],
      calories: calories,
      time: row.total_time,
      difficulty: difficulty,
      mealTimes: determineMealTimes(row),
      tags: row.cuisine ? [row.cuisine] : [],
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
  // This is a bit of a guess - we don't have this data in the schema
  // Could check the recipe title or description for keywords
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

/**
 * Calculate calories for a recipe using the recipe_ingredient junction table
 * and food_products nutritional information
 */
async function calculateRecipeCalories(recipeId: number): Promise<number> {
  try {
    const query = `
      SELECT SUM(fp.energy_kcal_100g * ri.quantity / 100) as total_calories
      FROM recipe_ingredient ri
      JOIN food_products fp ON ri.ingredient_code = fp.code
      WHERE ri.recipe_id = $1
      AND ri.unit IN ('g', 'ml', 'gram')
    `;
    
    const queryPcs = `
      SELECT SUM(fp.energy_kcal_100g * 0.5) as pcs_calories
      FROM recipe_ingredient ri 
      JOIN food_products fp ON ri.ingredient_code = fp.code
      WHERE ri.recipe_id = $1
      AND ri.unit IN ('pc', 'pcs', 'piece', 'pieces')
    `;
    
    // Get calories from weighted ingredients
    const weightResult = await pool.query(query, [recipeId]);
    let totalCalories = parseFloat(weightResult.rows[0]?.total_calories || '0');
    
    // Add calories from piece-based ingredients (est. 50g per piece)
    const pcsResult = await pool.query(queryPcs, [recipeId]);
    totalCalories += parseFloat(pcsResult.rows[0]?.pcs_calories || '0');
    
    return Math.round(totalCalories);
  } catch (error) {
    console.error(`Error calculating calories for recipe ${recipeId}:`, error);
    
    // Fallback to old method if there's an error
    return 0;
  }
}