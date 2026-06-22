// Persistent state via localStorage

const STORAGE_KEY = 'mealplan_v1';

const defaultProfile = {
  age: 30,
  gender: 'male',
  heightFt: 6,
  heightIn: 0,
  currentWeight: 225,
  goalWeight: 210,
  goalWeeks: 12,
  activityLevel: 'moderate',
  increaseMuscle: false,
  bulkCut: false,
  unit: 'imperial',
  startDate: new Date().toISOString().slice(0, 10),
};

const defaultRecipes = [
  {
    id: 'r1',
    name: 'Grilled Chicken & Rice Bowl',
    color: 'green',
    tags: ['High Protein', 'Lunch', 'Dinner'],
    prepTime: 25,
    servings: 1,
    ingredients: [
      { name: 'Chicken breast', amount: '6', unit: 'oz' },
      { name: 'Brown rice (cooked)', amount: '1', unit: 'cup' },
      { name: 'Broccoli', amount: '1', unit: 'cup' },
      { name: 'Olive oil', amount: '1', unit: 'tsp' },
      { name: 'Garlic powder', amount: '0.5', unit: 'tsp' },
    ],
    macros: { calories: 480, protein: 52, carbs: 44, fat: 8 },
  },
  {
    id: 'r2',
    name: 'Greek Yogurt Parfait',
    color: 'blue',
    tags: ['Breakfast', 'Snack', 'Quick'],
    prepTime: 5,
    servings: 1,
    ingredients: [
      { name: 'Greek yogurt (0%)', amount: '1', unit: 'cup' },
      { name: 'Blueberries', amount: '0.5', unit: 'cup' },
      { name: 'Granola', amount: '3', unit: 'tbsp' },
      { name: 'Honey', amount: '1', unit: 'tsp' },
    ],
    macros: { calories: 290, protein: 22, carbs: 40, fat: 3 },
  },
  {
    id: 'r3',
    name: 'Tuna Salad Wrap',
    color: 'orange',
    tags: ['Lunch', 'Quick', 'High Protein'],
    prepTime: 8,
    servings: 1,
    ingredients: [
      { name: 'Canned tuna (in water)', amount: '5', unit: 'oz' },
      { name: 'Whole wheat tortilla', amount: '1', unit: 'piece' },
      { name: 'Greek yogurt (plain)', amount: '2', unit: 'tbsp' },
      { name: 'Celery', amount: '0.5', unit: 'cup' },
      { name: 'Spinach', amount: '1', unit: 'cup' },
      { name: 'Dijon mustard', amount: '1', unit: 'tsp' },
    ],
    macros: { calories: 340, protein: 40, carbs: 32, fat: 5 },
  },
  {
    id: 'r4',
    name: 'Egg White Omelette',
    color: 'orange',
    tags: ['Breakfast', 'Low Carb', 'Quick'],
    prepTime: 10,
    servings: 1,
    ingredients: [
      { name: 'Egg whites', amount: '5', unit: 'large' },
      { name: 'Bell pepper', amount: '0.5', unit: 'cup' },
      { name: 'Spinach', amount: '1', unit: 'cup' },
      { name: 'Mushrooms', amount: '0.5', unit: 'cup' },
      { name: 'Feta cheese', amount: '1', unit: 'oz' },
      { name: 'Olive oil spray', amount: '1', unit: 'spray' },
    ],
    macros: { calories: 210, protein: 28, carbs: 8, fat: 7 },
  },
  {
    id: 'r5',
    name: 'Protein Smoothie',
    color: 'purple',
    tags: ['Breakfast', 'Snack', 'Quick'],
    prepTime: 3,
    servings: 1,
    ingredients: [
      { name: 'Protein powder (vanilla)', amount: '1', unit: 'scoop' },
      { name: 'Banana', amount: '1', unit: 'medium' },
      { name: 'Almond milk', amount: '1', unit: 'cup' },
      { name: 'Peanut butter', amount: '1', unit: 'tbsp' },
      { name: 'Ice', amount: '0.5', unit: 'cup' },
    ],
    macros: { calories: 350, protein: 30, carbs: 38, fat: 9 },
  },
  {
    id: 'r6',
    name: 'Quinoa Power Salad',
    color: 'green',
    tags: ['Lunch', 'Vegetarian', 'Meal Prep'],
    prepTime: 20,
    servings: 1,
    ingredients: [
      { name: 'Quinoa (cooked)', amount: '1', unit: 'cup' },
      { name: 'Chickpeas (canned)', amount: '0.5', unit: 'cup' },
      { name: 'Cucumber', amount: '0.5', unit: 'cup' },
      { name: 'Cherry tomatoes', amount: '0.5', unit: 'cup' },
      { name: 'Feta cheese', amount: '1', unit: 'oz' },
      { name: 'Lemon juice', amount: '2', unit: 'tbsp' },
      { name: 'Olive oil', amount: '1', unit: 'tbsp' },
    ],
    macros: { calories: 420, protein: 18, carbs: 56, fat: 14 },
  },
  {
    id: 'r7',
    name: 'Turkey Meatballs & Zoodles',
    color: 'orange',
    tags: ['Dinner', 'Low Carb', 'High Protein'],
    prepTime: 30,
    servings: 1,
    ingredients: [
      { name: 'Ground turkey (93%)', amount: '5', unit: 'oz' },
      { name: 'Zucchini (spiralized)', amount: '2', unit: 'cups' },
      { name: 'Marinara sauce', amount: '0.5', unit: 'cup' },
      { name: 'Egg', amount: '1', unit: 'large' },
      { name: 'Garlic', amount: '2', unit: 'cloves' },
      { name: 'Italian seasoning', amount: '1', unit: 'tsp' },
    ],
    macros: { calories: 380, protein: 46, carbs: 18, fat: 14 },
  },
  {
    id: 'r8',
    name: 'Overnight Oats',
    color: 'blue',
    tags: ['Breakfast', 'Meal Prep', 'Quick'],
    prepTime: 5,
    servings: 1,
    ingredients: [
      { name: 'Rolled oats', amount: '0.5', unit: 'cup' },
      { name: 'Almond milk', amount: '0.75', unit: 'cup' },
      { name: 'Chia seeds', amount: '1', unit: 'tbsp' },
      { name: 'Protein powder', amount: '0.5', unit: 'scoop' },
      { name: 'Strawberries', amount: '0.5', unit: 'cup' },
      { name: 'Almond butter', amount: '1', unit: 'tbsp' },
    ],
    macros: { calories: 395, protein: 24, carbs: 46, fat: 12 },
  },

  // ── Trader Joe's Premade Items ──
  {
    id: 'tj1',
    name: "TJ's Chicken Burrito Bowl",
    color: 'orange',
    tags: ["Trader Joe's", 'Lunch', 'Dinner', 'High Protein'],
    prepTime: 5,
    servings: 1,
    ingredients: [{ name: "Trader Joe's Chicken Burrito Bowl", amount: '1', unit: 'bowl' }],
    macros: { calories: 440, protein: 28, carbs: 48, fat: 13 },
  },
  {
    id: 'tj2',
    name: "TJ's Grilled Chicken Strips",
    color: 'green',
    tags: ["Trader Joe's", 'High Protein', 'Lunch', 'Quick'],
    type: 'component',
    prepTime: 3,
    servings: 1,
    ingredients: [{ name: "Trader Joe's Grilled Chicken Strips", amount: '3', unit: 'oz' }],
    macros: { calories: 100, protein: 20, carbs: 1, fat: 2 },
  },
  {
    id: 'tj3',
    name: "TJ's Turkey Meatballs",
    color: 'orange',
    tags: ["Trader Joe's", 'High Protein', 'Dinner'],
    type: 'component',
    prepTime: 8,
    servings: 1,
    ingredients: [{ name: "Trader Joe's Turkey Meatballs", amount: '6', unit: 'meatballs' }],
    macros: { calories: 170, protein: 18, carbs: 10, fat: 6 },
  },
  {
    id: 'tj4',
    name: "TJ's Chicken Tikka Masala",
    color: 'orange',
    tags: ["Trader Joe's", 'Dinner', 'High Protein'],
    prepTime: 5,
    servings: 1,
    ingredients: [{ name: "Trader Joe's Chicken Tikka Masala", amount: '1', unit: 'serving' }],
    macros: { calories: 300, protein: 25, carbs: 22, fat: 11 },
  },
  {
    id: 'tj5',
    name: "TJ's High Protein Veggie Burger",
    color: 'green',
    tags: ["Trader Joe's", 'High Protein', 'Lunch', 'Vegetarian'],
    type: 'component',
    prepTime: 5,
    servings: 1,
    ingredients: [{ name: "Trader Joe's High Protein Veggie Burger", amount: '1', unit: 'patty' }],
    macros: { calories: 170, protein: 26, carbs: 9, fat: 3 },
  },
  {
    id: 'tj6',
    name: "TJ's Palak Paneer",
    color: 'green',
    tags: ["Trader Joe's", 'Dinner', 'Vegetarian'],
    prepTime: 5,
    servings: 1,
    ingredients: [{ name: "Trader Joe's Palak Paneer", amount: '1', unit: 'serving' }],
    macros: { calories: 310, protein: 13, carbs: 22, fat: 18 },
  },
  {
    id: 'tj7',
    name: "TJ's Mandarin Orange Chicken",
    color: 'orange',
    tags: ["Trader Joe's", 'Lunch', 'Dinner'],
    prepTime: 10,
    servings: 1,
    ingredients: [{ name: "Trader Joe's Mandarin Orange Chicken", amount: '4', unit: 'oz' }],
    macros: { calories: 310, protein: 14, carbs: 42, fat: 9 },
  },

  // ── Protein Shakes ──
  {
    id: 'ps1',
    name: 'Whey Protein Shake',
    color: 'blue',
    tags: ['Protein Shake', 'Snack', 'Quick', 'High Protein'],
    type: 'component',
    prepTime: 2,
    servings: 1,
    ingredients: [
      { name: 'Whey protein powder', amount: '1', unit: 'scoop' },
      { name: 'Water or milk', amount: '8', unit: 'oz' },
    ],
    macros: { calories: 130, protein: 25, carbs: 5, fat: 2 },
  },
  {
    id: 'ps2',
    name: 'High Protein Smoothie',
    color: 'purple',
    tags: ['Protein Shake', 'Breakfast', 'Snack', 'High Protein'],
    prepTime: 3,
    servings: 1,
    ingredients: [
      { name: 'Whey protein powder', amount: '1', unit: 'scoop' },
      { name: 'Banana', amount: '0.5', unit: 'medium' },
      { name: 'Almond milk', amount: '1', unit: 'cup' },
      { name: 'Greek yogurt', amount: '0.5', unit: 'cup' },
      { name: 'Ice', amount: '0.5', unit: 'cup' },
    ],
    macros: { calories: 290, protein: 38, carbs: 26, fat: 4 },
  },
  {
    id: 'ps3',
    name: 'Casein Night Shake',
    color: 'blue',
    tags: ['Protein Shake', 'Snack', 'Quick', 'High Protein'],
    type: 'component',
    prepTime: 2,
    servings: 1,
    ingredients: [
      { name: 'Casein protein powder', amount: '1', unit: 'scoop' },
      { name: 'Almond milk', amount: '8', unit: 'oz' },
    ],
    macros: { calories: 140, protein: 27, carbs: 6, fat: 2 },
  },

  // ── Eat Out ──
  {
    id: 'co1',
    name: 'Chipotle Chicken Bowl',
    color: 'orange',
    tags: ['Eat Out', 'Lunch', 'Dinner', 'High Protein'],
    prepTime: 5,
    servings: 1,
    price: 10.95,
    ingredients: [
      { name: 'Chicken (grilled)', amount: '4', unit: 'oz' },
      { name: 'White rice', amount: '1', unit: 'serving' },
      { name: 'Pinto beans', amount: '1', unit: 'serving' },
      { name: 'Fajita veggies', amount: '1', unit: 'serving' },
      { name: 'Romaine lettuce', amount: '1', unit: 'serving' },
      { name: 'Pico de gallo', amount: '1', unit: 'serving' },
    ],
    macros: { calories: 655, protein: 44, carbs: 77, fat: 16 },
  },
  {
    id: 'co2',
    name: 'Chipotle Chicken + Steak Bowl',
    color: 'orange',
    tags: ['Eat Out', 'Lunch', 'Dinner', 'High Protein'],
    prepTime: 5,
    servings: 1,
    price: 14.45,
    ingredients: [
      { name: 'Chicken (grilled)', amount: '4', unit: 'oz' },
      { name: 'Steak', amount: '4', unit: 'oz' },
      { name: 'White rice', amount: '1', unit: 'serving' },
      { name: 'Pinto beans', amount: '1', unit: 'serving' },
      { name: 'Fajita veggies', amount: '1', unit: 'serving' },
      { name: 'Romaine lettuce', amount: '1', unit: 'serving' },
      { name: 'Pico de gallo', amount: '1', unit: 'serving' },
    ],
    macros: { calories: 805, protein: 65, carbs: 78, fat: 23 },
  },
  {
    id: 'po1',
    name: 'Ahi Tuna Poke Bowl',
    color: 'blue',
    tags: ['Eat Out', 'Lunch', 'High Protein'],
    prepTime: 5,
    servings: 1,
    price: 0, // provided by work
    ingredients: [
      { name: 'Ahi tuna', amount: '4', unit: 'oz' },
      { name: 'Sushi rice', amount: '1', unit: 'cup' },
      { name: 'Edamame', amount: '0.5', unit: 'cup' },
      { name: 'Cucumber', amount: '0.5', unit: 'cup' },
      { name: 'Avocado', amount: '0.25', unit: 'medium' },
      { name: 'Seaweed salad', amount: '1', unit: 'serving' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp' },
    ],
    macros: { calories: 580, protein: 38, carbs: 62, fat: 14 },
  },
];

const defaultMealPlan = { weeks: {} };

const defaultGrocery = [];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function getInitialState() {
  const saved = loadState();
  if (saved) return saved;
  return {
    profile: { ...defaultProfile },
    recipes: defaultRecipes,
    mealPlan: defaultMealPlan,
    grocery: defaultGrocery,
  };
}

export { getInitialState, saveState, defaultProfile, defaultRecipes };
