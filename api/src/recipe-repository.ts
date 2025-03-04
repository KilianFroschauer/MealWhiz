export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  ratings: number;
  dietaryPreferences: string[];
  allergens: string[];
  calories: number;
  time: number;
  difficulty: "easy" | "medium" | "hard";
  mealTimes: string[];
  tags: string[];
}

const exampleRecipes: Recipe[] = [
  {
    id: 1,
    name: "Spaghetti Carbonara",
    ingredients: ["Spaghetti", "Eier", "Parmesan", "Speck", "Pfeffer", "Salz"],
    ratings: 4.5,
    dietaryPreferences: ["non-vegetarian"],
    allergens: ["Eggs", "Dairy", "Gluten"],
    calories: 600,
    time: 20,
    difficulty: "medium",
    mealTimes: ["Lunch", "Dinner"],
    tags: ["Italian", "Pasta", "Classic"],
  },
  {
    id: 2,
    name: "Käsespätzle",
    ingredients: ["Spätzle", "Käse", "Zwiebeln", "Butter", "Salz", "Pfeffer"],
    ratings: 4.7,
    dietaryPreferences: ["vegetarian"],
    allergens: ["Dairy", "Gluten"],
    calories: 750,
    time: 30,
    difficulty: "medium",
    mealTimes: ["Lunch", "Dinner"],
    tags: ["German", "Comfort Food", "Cheese"],
  },
  {
    id: 3,
    name: "Apfelstrudel",
    ingredients: ["Äpfel", "Blätterteig", "Zucker", "Zimt", "Rosinen", "Butter"],
    ratings: 4.6,
    dietaryPreferences: ["vegetarian"],
    allergens: ["Dairy", "Gluten"],
    calories: 500,
    time: 45,
    difficulty: "hard",
    mealTimes: ["Dessert"],
    tags: ["Austrian", "Pastry", "Sweet"],
  },
  {
    id: 4,
    name: "Tomatensuppe",
    ingredients: ["Tomaten", "Zwiebeln", "Knoblauch", "Brühe", "Olivenöl", "Salz", "Pfeffer"],
    ratings: 4.3,
    dietaryPreferences: ["vegetarian", "vegan", "gluten-free"],
    allergens: [],
    calories: 150,
    time: 25,
    difficulty: "easy",
    mealTimes: ["Lunch", "Dinner"],
    tags: ["Soup", "Healthy", "Quick"],
  },
  {
    id: 5,
    name: "Wiener Schnitzel",
    ingredients: ["Kalbfleisch", "Mehl", "Eier", "Paniermehl", "Butter", "Salz", "Pfeffer", "Zitrone"],
    ratings: 4.8,
    dietaryPreferences: ["non-vegetarian"],
    allergens: ["Eggs", "Gluten"],
    calories: 800,
    time: 35,
    difficulty: "hard",
    mealTimes: ["Lunch", "Dinner"],
    tags: ["Austrian", "Traditional", "Meat"],
  },
];


  export function getAllRecipes(): Recipe[] {
    return exampleRecipes;
  }
  
  export function getRecipeById(id: number): Recipe | undefined {
    return exampleRecipes.find(e => e.id === id)
  }