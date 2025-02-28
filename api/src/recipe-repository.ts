export interface Recipe {
    id: number;
    name: string;
    zutaten: string[];
    dauerMin: number;
    vegetarisch: boolean;
    vegan: boolean;
    glutenfrei: boolean;
  }
  
const exampleRecipes: Recipe[] = [
    {
      id: 1,
      name: "Spaghetti Carbonara",
      zutaten: ["Spaghetti", "Eier", "Parmesan", "Speck", "Pfeffer", "Salz"],
      dauerMin: 20,
      vegetarisch: false,
      vegan: false,
      glutenfrei: false,
    },
    {
      id: 2,
      name: "Käsespätzle",
      zutaten: ["Spätzle", "Käse", "Zwiebeln", "Butter", "Salz", "Pfeffer"],
      dauerMin: 30,
      vegetarisch: true,
      vegan: false,
      glutenfrei: false,
    },
    {
      id: 3,
      name: "Apfelstrudel",
      zutaten: ["Äpfel", "Blätterteig", "Zucker", "Zimt", "Rosinen", "Butter"],
      dauerMin: 45,
      vegetarisch: true,
      vegan: false,
      glutenfrei: false,
    },
    {
      id: 4,
      name: "Tomatensuppe",
      zutaten: ["Tomaten", "Zwiebeln", "Knoblauch", "Brühe", "Olivenöl", "Salz", "Pfeffer"],
      dauerMin: 25,
      vegetarisch: true,
      vegan: true,
      glutenfrei: true,
    },
    {
      id: 5,
      name: "Wiener Schnitzel",
      zutaten: ["Kalbfleisch", "Mehl", "Eier", "Paniermehl", "Butter", "Salz", "Pfeffer", "Zitrone"],
      dauerMin: 35,
      vegetarisch: false,
      vegan: false,
      glutenfrei: false,
    },
  ];

  export function getAllRecipes(): Recipe[] {
    return exampleRecipes;
  }
  
  export function getRecipeById(id: number): Recipe | undefined {
    return exampleRecipes.find(e => e.id === id)
  }