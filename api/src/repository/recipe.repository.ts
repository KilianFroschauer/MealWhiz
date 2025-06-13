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
    ARRAY(
      SELECT fp.product_name
      FROM recipe_ingredient ri
      JOIN food_products fp ON ri.ingredient_code = fp.code
      WHERE ri.recipe_id = r.recipe_id
      ORDER BY fp.product_name
    ) as ingredients,
    ARRAY(
      SELECT CONCAT(ri.quantity::text, ' ', ri.unit)
      FROM recipe_ingredient ri
      WHERE ri.recipe_id = r.recipe_id
      ORDER BY ri.ingredient_code
    ) as ingredients_amount,
    r.meal_times
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
    ARRAY(
      SELECT fp.product_name
      FROM recipe_ingredient ri
      JOIN food_products fp ON ri.ingredient_code = fp.code
      WHERE ri.recipe_id = r.recipe_id
      ORDER BY fp.product_name
    ) as ingredients,
    ARRAY(
      SELECT CONCAT(ri.quantity::text, ' ', ri.unit)
      FROM recipe_ingredient ri
      WHERE ri.recipe_id = r.recipe_id
      ORDER BY ri.ingredient_code
    ) as ingredients_amount,
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
      // conditions.push(`
      //   (r.title ILIKE $${paramIndex} OR 
      //    r.ingredients ILIKE $${paramIndex} OR 
      //    c.cuisine ILIKE $${paramIndex})
      // `);
      conditions.push(`
        (r.title ILIKE $${paramIndex} OR 
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

    // Filter by ingredients (e.g., "tomato, onion")
if (filters.ingredients) {
  // Split the input string into an array of ingredient names
  const ingredientList = filters.ingredients.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);

  if (ingredientList.length > 0) {
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM recipe_ingredient ri
        JOIN food_products fp ON ri.ingredient_code = fp.code
        WHERE ri.recipe_id = r.recipe_id
          AND (${ingredientList.map((_, i) => `LOWER(fp.product_name) LIKE $${paramIndex + i}`).join(' OR ')})
      )`
    );
    ingredientList.forEach(ing => params.push(`%${ing}%`));
    paramIndex += ingredientList.length;
  }
}

    if (filters.mealTimes?.length) {
  // Capitalize first letter of each meal time to match the enum values in the database
  const capitalizedMealTimes = filters.mealTimes.map(
    mt => mt.charAt(0).toUpperCase() + mt.slice(1).toLowerCase()
  );
  
  // Use ANY to compare enum values directly
  conditions.push(`EXISTS (
    SELECT 1 FROM unnest(r.meal_times) mt 
    WHERE mt::text = ANY($${paramIndex}::text[])
  )`);
  
  params.push(capitalizedMealTimes);
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
export async function mapDbRowsToRecipes(rows: any[]): Promise<Recipe[]> {
  const recipePromises = rows.map(async row => {
    // const basicIngredients = parseIngredients(row.ingredients);
    const basicIngredients = row.ingredients;
    
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

/**
 * Updates the rating for a recipe from a specific user
 * @param recipeId The ID of the recipe being rated
 * @param rating The rating value (1-5)
 * @param userId The ID of the user submitting the rating
 * @returns The updated recipe with the new average rating
 */
export async function updateRecipeRating(recipeId: number, rating: number, userId: number): Promise<Recipe | undefined> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First check if recipe exists
    const recipeCheck = await client.query('SELECT recipe_id FROM recipe WHERE recipe_id = $1', [recipeId]);
    if (recipeCheck.rows.length === 0) {
      return undefined; // Recipe not found
    }

    // Check if user has already rated this recipe
    const existingRating = await client.query(
      'SELECT * FROM user_recipe_ratings WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    if (existingRating.rows.length > 0) {
      // Update existing rating
      await client.query(
        'UPDATE user_recipe_ratings SET rating = $1, updated_at = NOW() WHERE user_id = $2 AND recipe_id = $3',
        [rating, userId, recipeId]
      );
    } else {
      // Insert new rating
      await client.query(
        'INSERT INTO user_recipe_ratings (user_id, recipe_id, rating, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [userId, recipeId, rating]
      );
    }

    // Calculate new average rating
    const avgResult = await client.query(
      'SELECT AVG(rating) as avg_rating FROM user_recipe_ratings WHERE recipe_id = $1',
      [recipeId]
    );

    const avgRating = parseFloat(avgResult.rows[0].avg_rating);

    // Update the recipe with new average rating
    await client.query(
      'UPDATE recipe SET rating = $1 WHERE recipe_id = $2',
      [avgRating, recipeId]
    );

    await client.query('COMMIT');

    // Fetch the updated recipe
    return await getRecipeById(recipeId);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating recipe rating:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Toggle a recipe as favorite for a user
 * Adds the recipe to favorites if not already favorited, 
 * or removes it if already a favorite
 * 
 * @param recipeId The ID of the recipe to toggle
 * @param userId The ID of the user
 * @returns Object with added property indicating whether recipe was added (true) or removed (false)
 */
export async function toggleRecipeFavorite(recipeId: number, userId: number): Promise<{ added: boolean }> {
  const client = await pool.connect();

  try {
    // First, check if the recipe exists
    const recipeCheck = await client.query(
      'SELECT recipe_id FROM recipe WHERE recipe_id = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    // Check if the recipe is already favorited by this user
    const favoriteCheck = await client.query(
      'SELECT * FROM user_favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    // If already favorited, remove it
    if (favoriteCheck.rows.length > 0) {
      await client.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND recipe_id = $2',
        [userId, recipeId]
      );
      return { added: false };
    }

    // If not favorited, add it
    await client.query(
      'INSERT INTO user_favorites (user_id, recipe_id, created_at) VALUES ($1, $2, NOW())',
      [userId, recipeId]
    );

    return { added: true };
  } catch (error) {
    console.error('Error toggling recipe favorite status:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if a recipe is favorited by a specific user
 * 
 * @param recipeId The ID of the recipe to check
 * @param userId The ID of the user
 * @returns Boolean indicating whether the recipe is favorited
 */
export async function isRecipeFavorited(recipeId: number, userId: number): Promise<boolean> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM user_favorites WHERE user_id = $2 AND recipe_id = $1',
      [userId, recipeId]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  } finally {
    client.release();
  }
}