// Persistent state via localStorage

const STORAGE_KEY = 'mealplan_v1';

const defaultProfile = {
  name: '',
  age: 30,
  gender: 'male',
  heightFt: 5,
  heightIn: 10,
  currentWeight: 185,
  goalWeight: 170,
  goalWeeks: 12,
  activityLevel: 'moderate',
  increaseMuscle: false,
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
