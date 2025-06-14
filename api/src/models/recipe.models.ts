export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  ingredientsAmount: string[]; 
  ratings: number;
  dietaryPreferences: string[];
  description: string;
  allergens: string[];
  calories: number;
  proteins: number; 
  carbs: number;    
  fat: number;      
  time: number;
  difficulty: "easy" | "medium" | "hard";
  mealTimes: string[];
  tags: string[];
  servings: number; 
  instructions: string;
}

export interface SimpleRecipe {
  id: number;
  name: string;
  time: number;
  ratings: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface NutritionValues {
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
}

export type RecipeFilterOptions = {
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
  ingredients?: string[];
};