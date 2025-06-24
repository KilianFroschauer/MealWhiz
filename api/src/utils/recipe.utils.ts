import { pool } from "../config";
import { Recipe, SimpleRecipe, NutritionValues } from "../models/recipe.models";

/**
 * Parses a string of ingredients into an array.
 * Handles JSON, comma-separated, or line-separated formats.
 * @param ingredientsText The string representation of ingredients.
 * @returns An array of ingredient strings.
 */
export function parseIngredients(ingredientsText: string): string[] {
  if (!ingredientsText) return [];

  try {
    return JSON.parse(ingredientsText);
  } catch (e) {
    if (ingredientsText.includes(',')) {
      return ingredientsText.split(',').map(i => i.trim());
    }
    return ingredientsText.split(/\r?\n/).filter(line => line.trim().length > 0);
  }
}

/**
 * Maps a difficulty string from the database to a predefined enum.
 * @param difficultyText The difficulty string (e.g., "Easy", "Medium", "Hard").
 * @returns The corresponding difficulty enum value.
 */
export function mapDifficultyToEnum(difficultyText: string): "easy" | "medium" | "hard" {
  if (!difficultyText) return "medium"; // Default

  const lowercaseDiff = difficultyText.toLowerCase();
  if (lowercaseDiff.includes('easy')) return "easy";
  if (lowercaseDiff.includes('hard')) return "hard";
  return "medium";
}

/**
 * Determines the meal times for a recipe based on its title or description,
 * or uses the meal_times array from the database if available.
 * @param row The database row object for a recipe.
 * @returns An array of meal time strings.
 */
export function determineMealTimes(row: any): string[] {
  if (row.meal_times && Array.isArray(row.meal_times)) {
    return row.meal_times;
  }
  
  const mealTimes: string[] = [];
//   const titleLower = row.title?.toLowerCase() || '';
//   const descLower = row.description?.toLowerCase() || '';

//   if (titleLower.includes('breakfast') || descLower.includes('breakfast')) mealTimes.push('Breakfast');
//   if (titleLower.includes('lunch') || descLower.includes('lunch')) mealTimes.push('Lunch');
//   if (titleLower.includes('dinner') || descLower.includes('dinner')) mealTimes.push('Dinner');
//   if (titleLower.includes('dessert') || descLower.includes('dessert')) mealTimes.push('Dessert');
//   if (titleLower.includes('snack') || descLower.includes('snack')) mealTimes.push('Snack');

  if (mealTimes.length === 0) mealTimes.push('Lunch', 'Dinner');
  return mealTimes;
}

/**
 * Calculates the nutritional information for a recipe.
 * @param recipeId The ID of the recipe.
 * @returns A promise that resolves to an object with calorie, protein, carb, and fat values.
 */
export async function calculateRecipeNutrition(recipeId: number): Promise<NutritionValues> {
  try {
    const client = await pool.connect();
    const nutritionQuery = `
      SELECT 
        SUM(ri.quantity * fp.energy_kcal_100g / 100) AS total_calories,
        SUM(ri.quantity * fp.proteins_100g / 100) AS total_proteins,
        SUM(ri.quantity * fp.carbohydrates_100g / 100) AS total_carbs,
        SUM(ri.quantity * fp.fat_100g / 100) AS total_fat,
        r.servings
      FROM recipe_ingredient ri
      JOIN food_products fp ON ri.ingredient_code = fp.code
      JOIN recipe r ON ri.recipe_id = r.recipe_id
      WHERE ri.recipe_id = $1
      GROUP BY r.servings
    `;
    const result = await client.query(nutritionQuery, [recipeId]);
    client.release();
    
    if (result.rows.length === 0) {
      // No ingredients found for this recipe
      return { calories: 0, proteins: 0, carbs: 0, fat: 0 };
    }
    
    const nutrition = result.rows[0];
    const servings = nutrition.servings || 4; // Default to 4 servings if not specified
    
    return {
      calories: Math.round((nutrition.total_calories || 0) / servings),
      proteins: Math.round((nutrition.total_proteins || 0) / servings),
      carbs: Math.round((nutrition.total_carbs || 0) / servings),
      fat: Math.round((nutrition.total_fat || 0) / servings)
    };
  } catch (error) {
    console.error(`Error calculating nutrition for recipe ${recipeId}:`, error);
    return { calories: 0, proteins: 0, carbs: 0, fat: 0 };
  }
}

/**
 * Converts an array of full Recipe objects to an array of SimpleRecipe objects.
 * @param recipes An array of Recipe objects.
 * @returns An array of SimpleRecipe objects.
 */
export function convertToSimpleRecipe(recipes: Recipe[]): SimpleRecipe[] {
  return recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    time: recipe.time,
    ratings: recipe.ratings,
    difficulty: recipe.difficulty
  }));
}