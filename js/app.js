import { getInitialState, saveState } from './state.js';
import { ACTIVITY, calcTDEE, calcTargets, goalSummary, daysLeft } from './macros.js';

// ── State ──────────────────────────────────────────────
let state = getInitialState();
function persist() { saveState(state); }

// ── Router ─────────────────────────────────────────────
const pages = ['dashboard', 'goals', 'recipes', 'mealplan', 'grocery'];

function navigate(id) {
  pages.forEach(p => {
    document.getElementById(`page-${p}`)?.classList.toggle('active', p === id);
    document.getElementById(`nav-${p}`)?.classList.toggle('active', p === id);
    document.getElementById(`bnav-${p}`)?.classList.toggle('active', p === id);
  });
  render(id);
}

document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    navigate(el.dataset.nav);
  });
});

// ── Helpers ────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function macroBar(label, value, max, cls) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return `
    <div class="macro-bar-wrap">
      <div class="macro-bar-label"><span>${label}</span><span>${value}g / ${max}g</span></div>
      <div class="macro-bar"><div class="macro-bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
}

function calBar(value, max) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return `
    <div class="macro-bar-wrap">
      <div class="macro-bar-label"><span>Calories</span><span>${value} / ${max} kcal</span></div>
      <div class="macro-bar"><div class="macro-bar-fill bar-calories" style="width:${pct}%"></div></div>
    </div>`;
}

// ── Dashboard ──────────────────────────────────────────
function render_dashboard() {
  const p = state.profile;
  const targets = calcTargets(p);
  const dl = daysLeft(p);

  const todayKey = getTodayKey();
  const weekKey = getWeekKey();
  const todayMeals = state.mealPlan.weeks?.[weekKey]?.[todayKey] ?? {};
  let todayMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  Object.values(todayMeals).flat().forEach(rid => {
    const recipe = state.recipes.find(r => r.id === rid);
    if (recipe) {
      todayMacros.calories += recipe.macros.calories;
      todayMacros.protein  += recipe.macros.protein;
      todayMacros.carbs    += recipe.macros.carbs;
      todayMacros.fat      += recipe.macros.fat;
    }
  });

  const lbsTo = p.goalWeight;
  const lbsFrom = p.currentWeight;
  const totalDiff = Math.abs(lbsFrom - lbsTo);
  const progressPct = totalDiff === 0 ? 100 : 0;

  const proteinGap = Math.max(0, targets.protein - todayMacros.protein);
  const summary = goalSummary(p);
  const tdee = calcTDEE(p);

  document.getElementById('dash-content').innerHTML = `
    <div class="notice notice-${p.increaseMuscle ? 'success' : p.bulkCut ? 'info' : dl < 14 ? 'warn' : 'info'}">
      ${p.increaseMuscle ? '💪 Muscle-building mode active — eating at a caloric surplus.' :
        p.bulkCut ? '⚡ Bulk+Cut mode — calorie deficit with elevated protein for body recomposition.' :
        dl === 0 ? '🎯 Goal period has ended! Update your goals.' :
        `🎯 ${summary} — <strong>${dl} days</strong> remaining`}
    </div>

    <div class="grid-4 stats-row" style="margin-bottom:16px">
      <div class="stat-card green">
        <span class="stat-label">Target Calories</span>
        <span class="stat-value">${targets.calories}</span>
        <span class="stat-sub">kcal / day</span>
      </div>
      <div class="stat-card blue">
        <span class="stat-label">Protein Goal</span>
        <span class="stat-value">${targets.protein}<span style="font-size:1rem">g</span></span>
        <span class="stat-sub">per day</span>
      </div>
      <div class="stat-card orange">
        <span class="stat-label">Carb Goal</span>
        <span class="stat-value">${targets.carbs}<span style="font-size:1rem">g</span></span>
        <span class="stat-sub">per day</span>
      </div>
      <div class="stat-card purple">
        <span class="stat-label">Fat Goal</span>
        <span class="stat-value">${targets.fat}<span style="font-size:1rem">g</span></span>
        <span class="stat-sub">per day</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Today's Nutrition</div>
        ${calBar(todayMacros.calories, targets.calories)}
        ${macroBar('Protein', todayMacros.protein, targets.protein, 'bar-protein')}
        ${macroBar('Carbs', todayMacros.carbs, targets.carbs, 'bar-carbs')}
        ${macroBar('Fat', todayMacros.fat, targets.fat, 'bar-fat')}
        <div style="margin-top:12px;font-size:0.82rem;color:var(--text-muted)">
          Meals logged today: <strong>${Object.values(todayMeals).flat().length}</strong>
          &nbsp;·&nbsp;
          <a href="#" data-nav="mealplan" style="color:var(--green)">Open Planner →</a>
        </div>
        ${proteinGap > 10 ? `<div style="margin-top:10px;padding:8px 12px;background:var(--blue-light);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="color:var(--blue);font-size:0.82rem">💪 ${proteinGap}g protein still needed today</span><button class="btn btn-primary btn-sm" onclick="addProteinShakeToday()">+ Shake</button></div>` : ''}
      </div>

      <div class="card">
        <div class="card-title">Weight Goal</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:2rem;font-weight:700">${p.currentWeight} <span style="font-size:1rem;color:var(--text-muted)">lbs</span></div>
            <div style="font-size:0.85rem;color:var(--text-muted)">Current weight</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.4rem;font-weight:700;color:var(--green)">${p.goalWeight} <span style="font-size:1rem;color:var(--text-muted)">lbs</span></div>
            <div style="font-size:0.85rem;color:var(--text-muted)">Goal weight</div>
          </div>
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px">
          ${Math.abs(p.currentWeight - p.goalWeight)} lbs to go · ${p.goalWeeks} weeks
        </div>
        <div class="macro-bar">
          <div class="macro-bar-fill bar-calories" style="width:${progressPct}%"></div>
        </div>
        <div style="margin-top:12px">
          <a href="#" data-nav="goals" class="btn btn-outline btn-sm">Update Weight →</a>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Energy Balance</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
          <div>
            <div style="font-size:1.3rem;font-weight:700">${tdee}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">TDEE</div>
          </div>
          <div>
            <div style="font-size:1.3rem;font-weight:700;color:${targets.calories < tdee ? 'var(--red)' : 'var(--green)'}">${targets.calories < tdee ? '−' : '+'}${Math.abs(targets.calories - tdee)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${targets.calories < tdee ? 'Deficit' : 'Surplus'}</div>
          </div>
          <div>
            <div style="font-size:1.3rem;font-weight:700;color:var(--green)">${targets.calories}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Target</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <a href="#" data-nav="mealplan" class="btn btn-outline btn-sm" style="justify-content:center">📅 Plan This Week's Meals</a>
          <a href="#" data-nav="grocery" class="btn btn-outline btn-sm" style="justify-content:center">🛒 Generate Grocery List</a>
          <a href="#" data-nav="recipes" class="btn btn-outline btn-sm" style="justify-content:center">🍳 Browse Recipes</a>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.nav); });
  });
}

// ── Goals ──────────────────────────────────────────────
function render_goals() {
  const p = state.profile;
  const targets = calcTargets(p);

  document.getElementById('goals-content').innerHTML = `
    <div class="grid-2">
      <div>
        <div class="card">
          <div class="card-title">Personal Info</div>
          <div class="form-row">
            <div class="form-group">
              <label>Age</label>
              <input type="number" id="g-age" value="${p.age}" min="15" max="99">
            </div>
            <div class="form-group">
              <label>Biological Sex</label>
              <select id="g-gender">
                <option value="male" ${p.gender==='male'?'selected':''}>Male</option>
                <option value="female" ${p.gender==='female'?'selected':''}>Female</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Height (ft)</label>
              <input type="number" id="g-hft" value="${p.heightFt}" min="3" max="8">
            </div>
            <div class="form-group">
              <label>Height (in)</label>
              <input type="number" id="g-hin" value="${p.heightIn}" min="0" max="11">
            </div>
          </div>
          <div class="form-group">
            <label>Activity Level</label>
            <select id="g-activity">
              ${Object.entries(ACTIVITY).map(([k,v]) => `<option value="${k}" ${p.activityLevel===k?'selected':''}>${v.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Weight & Goal</div>
          <div class="form-row">
            <div class="form-group">
              <label>Current Weight (lbs)</label>
              <input type="number" id="g-cw" value="${p.currentWeight}" min="50" max="600" step="0.5">
            </div>
            <div class="form-group">
              <label>Goal Weight (lbs)</label>
              <input type="number" id="g-gw" value="${p.goalWeight}" min="50" max="600" step="0.5">
            </div>
          </div>
          <div class="form-group">
            <label>Time to Reach Goal (weeks)</label>
            <input type="number" id="g-weeks" value="${p.goalWeeks}" min="1" max="104">
          </div>
          <div class="form-group">
            <label>Goal Start Date</label>
            <input type="date" id="g-start" value="${p.startDate}" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:0.95rem;background:#fafafa;outline:none;">
          </div>
          <div class="toggle-group" style="margin-top:8px">
            <label class="toggle">
              <input type="checkbox" id="g-muscle" ${p.increaseMuscle?'checked':''}>
              <span class="toggle-slider"></span>
            </label>
            <label for="g-muscle" style="font-weight:600">💪 Muscle-Building Mode <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400">(caloric surplus)</span></label>
          </div>
          <div class="toggle-group" style="margin-top:8px">
            <label class="toggle">
              <input type="checkbox" id="g-bulkcut" ${p.bulkCut?'checked':''}>
              <span class="toggle-slider"></span>
            </label>
            <label for="g-bulkcut" style="font-weight:600">⚡ Bulk+Cut Mode <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400">(deficit + high protein recomp)</span></label>
          </div>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="saveGoals()">Save Goals</button>
          <button class="btn btn-secondary" onclick="render_goals()">Reset</button>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-title">Calculated Targets</div>
          <div id="goals-targets">${renderTargetCards(targets, p)}</div>
        </div>

        <div class="card">
          <div class="card-title">Macro Breakdown</div>
          ${calBar(targets.calories, targets.calories)}
          ${macroBar('Protein', targets.protein, targets.protein, 'bar-protein')}
          ${macroBar('Carbs', targets.carbs, targets.carbs, 'bar-carbs')}
          ${macroBar('Fat', targets.fat, targets.fat, 'bar-fat')}
          <div style="margin-top:12px;font-size:0.82rem;color:var(--text-muted)">
            <strong>${Math.round(targets.protein * 4 / targets.calories * 100)}%</strong> protein ·
            <strong>${Math.round(targets.carbs * 4 / targets.calories * 100)}%</strong> carbs ·
            <strong>${Math.round(targets.fat * 9 / targets.calories * 100)}%</strong> fat
          </div>
        </div>

        <div class="card">
          <div class="card-title">Goal Summary</div>
          <div id="goals-summary">${renderGoalSummary(p, targets)}</div>
        </div>
      </div>
    </div>
  `;

  const inputs = ['g-age','g-gender','g-hft','g-hin','g-activity','g-cw','g-gw','g-weeks','g-start'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', liveRecalc);
  });
  const muscleEl = document.getElementById('g-muscle');
  const bulkcutEl = document.getElementById('g-bulkcut');
  if (muscleEl) muscleEl.addEventListener('change', () => { if (muscleEl.checked) bulkcutEl.checked = false; liveRecalc(); });
  if (bulkcutEl) bulkcutEl.addEventListener('change', () => { if (bulkcutEl.checked) muscleEl.checked = false; liveRecalc(); });
}

function liveRecalc() {
  const draft = readGoalForm();
  const targets = calcTargets(draft);
  document.getElementById('goals-targets').innerHTML = renderTargetCards(targets, draft);
  document.getElementById('goals-summary').innerHTML = renderGoalSummary(draft, targets);
}

function renderTargetCards(targets, p) {
  return `
    <div class="grid-2" style="gap:10px;margin-bottom:12px">
      <div style="text-align:center;padding:12px;background:var(--green-light);border-radius:10px">
        <div style="font-size:1.8rem;font-weight:700;color:var(--green)">${targets.calories}</div>
        <div style="font-size:0.75rem;color:var(--green);font-weight:600">DAILY CALORIES</div>
      </div>
      <div style="text-align:center;padding:12px;background:#f5f5f5;border-radius:10px">
        <div style="font-size:1.8rem;font-weight:700;color:var(--text-muted)">${targets.tdee}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600">TDEE (MAINTENANCE)</div>
      </div>
    </div>
    <div class="grid-3" style="gap:10px">
      <div style="text-align:center;padding:10px;background:var(--blue-light);border-radius:10px">
        <div style="font-size:1.5rem;font-weight:700;color:var(--blue)">${targets.protein}g</div>
        <div style="font-size:0.72rem;color:var(--blue);font-weight:600">PROTEIN</div>
      </div>
      <div style="text-align:center;padding:10px;background:var(--orange-light);border-radius:10px">
        <div style="font-size:1.5rem;font-weight:700;color:var(--orange)">${targets.carbs}g</div>
        <div style="font-size:0.72rem;color:var(--orange);font-weight:600">CARBS</div>
      </div>
      <div style="text-align:center;padding:10px;background:var(--purple-light);border-radius:10px">
        <div style="font-size:1.5rem;font-weight:700;color:var(--purple)">${targets.fat}g</div>
        <div style="font-size:0.72rem;color:var(--purple);font-weight:600">FAT</div>
      </div>
    </div>`;
}

function renderGoalSummary(p, targets) {
  const dl = daysLeft(p);
  const diff = p.currentWeight - p.goalWeight;
  const lossPerWeek = (p.increaseMuscle || p.bulkCut) ? null : (Math.abs(diff) / p.goalWeeks).toFixed(1);
  return `
    <div style="display:flex;flex-direction:column;gap:8px;font-size:0.9rem">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Mode</span><strong>${p.increaseMuscle ? '💪 Build Muscle' : p.bulkCut ? '⚡ Bulk+Cut' : diff > 0 ? '📉 Lose Weight' : diff < 0 ? '📈 Gain Weight' : '⚖️ Maintain'}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Duration</span><strong>${p.goalWeeks} weeks (${dl} days left)</strong></div>
      ${(!p.increaseMuscle && !p.bulkCut && diff !== 0) ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Rate</span><strong>${lossPerWeek} lbs / week</strong></div>` : ''}
      <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Calorie ${targets.calories < targets.tdee ? 'Deficit' : 'Surplus'}</span><strong>${Math.abs(targets.calories - targets.tdee)} kcal/day</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Protein per lb</span><strong>${(targets.protein / p.currentWeight).toFixed(2)}g</strong></div>
    </div>`;
}

function readGoalForm() {
  return {
    age: parseInt(document.getElementById('g-age')?.value) || state.profile.age,
    gender: document.getElementById('g-gender')?.value ?? state.profile.gender,
    heightFt: parseInt(document.getElementById('g-hft')?.value) || state.profile.heightFt,
    heightIn: parseInt(document.getElementById('g-hin')?.value) || state.profile.heightIn,
    activityLevel: document.getElementById('g-activity')?.value ?? state.profile.activityLevel,
    currentWeight: parseFloat(document.getElementById('g-cw')?.value) || state.profile.currentWeight,
    goalWeight: parseFloat(document.getElementById('g-gw')?.value) || state.profile.goalWeight,
    goalWeeks: parseInt(document.getElementById('g-weeks')?.value) || state.profile.goalWeeks,
    increaseMuscle: document.getElementById('g-muscle')?.checked ?? state.profile.increaseMuscle,
    bulkCut: document.getElementById('g-bulkcut')?.checked ?? state.profile.bulkCut,
    startDate: document.getElementById('g-start')?.value ?? state.profile.startDate,
  };
}

window.saveGoals = function() {
  state.profile = readGoalForm();
  persist();
  showToast('Goals saved!');
  render_goals();
};

window.addProteinShakeToday = function() {
  const shake = state.recipes.find(r => r.tags.some(t => /protein shake/i.test(t)));
  if (!shake) { showToast('No protein shake recipe found. Add one in Recipes!', 'warn'); return; }
  const weekKey = getWeekKey();
  const dayKey = getTodayKey();
  if (!state.mealPlan.weeks) state.mealPlan.weeks = {};
  if (!state.mealPlan.weeks[weekKey]) state.mealPlan.weeks[weekKey] = {};
  if (!state.mealPlan.weeks[weekKey][dayKey]) state.mealPlan.weeks[weekKey][dayKey] = {};
  const free = ['snack','breakfast','lunch','dinner'].find(s => !state.mealPlan.weeks[weekKey][dayKey][s]) ?? 'snack';
  state.mealPlan.weeks[weekKey][dayKey][free] = shake.id;
  persist();
  render_dashboard();
  showToast(`${shake.name} added to today's ${free}!`);
};

// ── Recipes ────────────────────────────────────────────
function render_recipes(filter = '') {
  let recipes = state.recipes;
  if (recipeTagFilter) {
    recipes = recipes.filter(r => r.tags.some(t => t.toLowerCase().includes(recipeTagFilter.toLowerCase())));
  }
  if (filter) {
    recipes = recipes.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(filter.toLowerCase())));
  }

  const chips = [
    { label: 'All', filter: '' },
    { label: "🛒 Trader Joe's", filter: 'Trader' },
    { label: '🍽️ Eat Out', filter: 'Eat Out' },
    { label: '🥤 Protein Shakes', filter: 'Protein Shake' },
    { label: '💪 High Protein', filter: 'High Protein' },
    { label: '⚡ Quick', filter: 'Quick' },
  ];
  const filterChips = `<div class="filter-chips">${chips.map(c => `<button class="filter-chip ${recipeTagFilter === c.filter ? 'active' : ''}" onclick="setRecipeFilter('${c.filter}')">${c.label}</button>`).join('')}</div>`;

  const grid = recipes.length === 0
    ? `<div class="empty-state"><div class="icon">🍽️</div><p>No recipes found. Add one!</p></div>`
    : `<div class="recipe-grid">${recipes.map(recipeCard).join('')}</div>`;

  document.getElementById('recipes-content').innerHTML = filterChips + grid;
}

window.setRecipeFilter = function(tag) {
  recipeTagFilter = tag;
  render_recipes(document.getElementById('recipe-search')?.value ?? '');
};

function recipeCard(r) {
  return `
    <div class="recipe-card" onclick="viewRecipe('${r.id}')">
      <div class="recipe-thumb ${r.color ?? 'green'}"></div>
      <div class="recipe-body">
        <div class="recipe-name">${esc(r.name)}${r.type === 'component' ? ' <span style="font-size:0.7rem;font-weight:600;color:#888;background:#f0f0f0;padding:1px 6px;border-radius:4px;vertical-align:middle">add-on</span>' : ''}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">⏱ ${r.prepTime} min · ${r.servings} serving${r.servings>1?'s':''}</div>
        <div class="recipe-tags">
          ${r.tags.map(t => `<span class="tag ${tagColor(t)}">${esc(t)}</span>`).join('')}
        </div>
        <div class="recipe-macros">
          <div class="recipe-macro-item"><div class="val cal">${r.macros.calories}</div><div class="lbl">cal</div></div>
          <div class="recipe-macro-item"><div class="val pro">${r.macros.protein}g</div><div class="lbl">protein</div></div>
          <div class="recipe-macro-item"><div class="val carb">${r.macros.carbs}g</div><div class="lbl">carbs</div></div>
          <div class="recipe-macro-item"><div class="val fat">${r.macros.fat}g</div><div class="lbl">fat</div></div>
        </div>
      </div>
      <div class="recipe-actions">
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();addToGroceryFromRecipe('${r.id}')">🛒 Add to List</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editRecipe('${r.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteRecipe('${r.id}')">✕</button>
      </div>
    </div>`;
}

// Step-by-step directions for the built-in recipes, keyed by id so they apply
// even to recipes already saved in localStorage. A recipe's own `directions`
// array (e.g. user-created) takes precedence.
const DIRECTIONS_BY_ID = {
  r1: [
    'Season the chicken breast with garlic powder, salt, and pepper.',
    'Heat olive oil in a pan over medium-high; cook chicken 6–7 min per side until 165°F. Rest, then slice.',
    'Steam or microwave the broccoli until tender-crisp.',
    'Add the cooked brown rice to a bowl and top with sliced chicken and broccoli.',
  ],
  r2: [
    'Spoon half the Greek yogurt into a glass or bowl.',
    'Layer with half the blueberries and granola.',
    'Add the remaining yogurt, then the rest of the blueberries and granola.',
    'Drizzle with honey and serve.',
  ],
  r3: [
    'Drain the tuna and mix with Greek yogurt, Dijon mustard, and chopped celery; season with salt and pepper.',
    'Lay the spinach over the tortilla.',
    'Spoon the tuna salad on top.',
    'Roll up tightly and slice in half.',
  ],
  r4: [
    'Sauté the bell pepper, mushrooms, and spinach in an olive-oil-sprayed pan until soft.',
    'Pour in the egg whites and cook over medium heat until the edges set.',
    'Sprinkle feta over one half, fold the omelette, and cook 1 more minute.',
  ],
  r5: [
    'Add almond milk, banana, protein powder, peanut butter, and ice to a blender.',
    'Blend until smooth, about 30–45 seconds.',
    'Pour into a glass and serve.',
  ],
  r6: [
    'Combine the cooked quinoa, chickpeas, cucumber, and cherry tomatoes in a bowl.',
    'Whisk the lemon juice with olive oil, salt, and pepper.',
    'Toss the salad with the dressing and top with crumbled feta.',
  ],
  r7: [
    'Mix the ground turkey with egg, minced garlic, and Italian seasoning; form into meatballs.',
    'Cook the meatballs in a pan over medium heat until browned and cooked through, 12–15 min.',
    'Add the marinara and simmer 5 min.',
    'Warm the spiralized zucchini 2–3 min, then top with meatballs and sauce.',
  ],
  r8: [
    'Stir together the rolled oats, almond milk, chia seeds, and protein powder in a jar.',
    'Cover and refrigerate overnight (at least 4 hours).',
    'In the morning, top with strawberries and almond butter.',
  ],
  tj1: ['Remove the film lid.', 'Microwave 2.5–3 min, stirring halfway through.', 'Let stand 1 min, then enjoy.'],
  tj2: ['Microwave the chicken strips 60–90 sec, or pan-fry 3–4 min until warmed through.'],
  tj3: ['Heat the meatballs in a pan with sauce, or microwave 1.5–2 min until hot.'],
  tj4: ['Empty into a pan and heat over medium 5–6 min (or microwave ~3 min), stirring occasionally.', 'Serve over rice.'],
  tj5: ['Pan-fry the patty 3–4 min per side, or microwave about 1.5 min.'],
  tj6: ['Heat in a pan over medium 5 min (or microwave ~3 min), stirring.', 'Serve with rice or naan.'],
  tj7: ['Bake or air-fry the chicken per package, about 12–15 min.', 'Toss with the orange sauce and serve.'],
  ps1: ['Add the water or milk and protein powder to a shaker.', 'Shake 20–30 sec until smooth.'],
  ps2: ['Add almond milk, banana, Greek yogurt, protein powder, and ice to a blender.', 'Blend until smooth and serve.'],
  ps3: ['Add the almond milk and casein powder to a shaker or blender.', 'Mix until smooth and drink before bed.'],
  co1: [
    'Order a burrito bowl.',
    'Choose white rice and pinto beans.',
    'Add grilled chicken.',
    'Top with fajita veggies, romaine, and pico de gallo.',
  ],
  co2: [
    'Order a double-protein bowl with chicken and steak.',
    'Choose white rice and pinto beans.',
    'Top with fajita veggies, romaine, and pico de gallo.',
  ],
  po1: [
    'Order a poke bowl on a sushi-rice base.',
    'Add ahi tuna, edamame, cucumber, avocado, and seaweed salad.',
    'Finish with soy sauce.',
  ],
};

function recipeDirections(recipe) {
  return (recipe.directions && recipe.directions.length) ? recipe.directions : (DIRECTIONS_BY_ID[recipe.id] ?? []);
}

// Recipes don't store directions, so link out to a web search for them.
function directionsUrl(recipe) {
  return 'https://www.google.com/search?q=' + encodeURIComponent(`${recipe.name} recipe directions`);
}

function tagColor(tag) {
  const t = tag.toLowerCase();
  if (t.includes('protein') || t.includes('chicken') || t.includes('turkey')) return 'blue';
  if (t.includes('breakfast') || t.includes('quick')) return 'orange';
  if (t.includes('eat out')) return 'purple';
  return '';
}

window.viewRecipe = function(id) {
  const r = state.recipes.find(r => r.id === id);
  if (!r) return;
  const targets = calcTargets(state.profile);
  openModal('Recipe Details', `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
      ${r.tags.map(t => `<span class="tag ${tagColor(t)}">${esc(t)}</span>`).join('')}
      <span class="tag" style="background:#f5f5f5;color:var(--text-muted)">⏱ ${r.prepTime} min</span>
    </div>
    <div class="grid-4" style="margin-bottom:20px">
      <div style="text-align:center;padding:10px;background:var(--green-light);border-radius:8px"><div style="font-size:1.4rem;font-weight:700;color:var(--green)">${r.macros.calories}</div><div style="font-size:0.72rem;color:var(--green);font-weight:600">CALORIES</div></div>
      <div style="text-align:center;padding:10px;background:var(--blue-light);border-radius:8px"><div style="font-size:1.4rem;font-weight:700;color:var(--blue)">${r.macros.protein}g</div><div style="font-size:0.72rem;color:var(--blue);font-weight:600">PROTEIN</div></div>
      <div style="text-align:center;padding:10px;background:var(--orange-light);border-radius:8px"><div style="font-size:1.4rem;font-weight:700;color:var(--orange)">${r.macros.carbs}g</div><div style="font-size:0.72rem;color:var(--orange);font-weight:600">CARBS</div></div>
      <div style="text-align:center;padding:10px;background:var(--purple-light);border-radius:8px"><div style="font-size:1.4rem;font-weight:700;color:var(--purple)">${r.macros.fat}g</div><div style="font-size:0.72rem;color:var(--purple);font-weight:600">FAT</div></div>
    </div>
    <div style="margin-bottom:4px;font-size:0.85rem;color:var(--text-muted)">% of daily target · ${Math.round(r.macros.calories/targets.calories*100)}% calories · ${Math.round(r.macros.protein/targets.protein*100)}% protein</div>
    <div class="divider"></div>
    <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:10px">Ingredients</h4>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${r.ingredients.map(ing => `
        <div style="display:flex;justify-content:space-between;padding:7px 10px;background:#f9f9f9;border-radius:6px;font-size:0.9rem">
          <span>${esc(ing.name)}</span>
          <span style="color:var(--text-muted);font-weight:600">${esc(ing.amount)} ${esc(ing.unit)}</span>
        </div>`).join('')}
    </div>
    <div class="divider"></div>
    <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:10px">Directions</h4>
    ${(() => {
      const steps = recipeDirections(r);
      if (steps.length) {
        return `
          <ol style="margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:7px;font-size:0.9rem;line-height:1.4">
            ${steps.map(s => `<li>${esc(s)}</li>`).join('')}
          </ol>
          <a href="${directionsUrl(r)}" target="_blank" rel="noopener" style="font-size:0.82rem;color:var(--green);font-weight:600;text-decoration:none">🔗 See other versions online →</a>`;
      }
      return `<a href="${directionsUrl(r)}" target="_blank" rel="noopener" class="btn btn-outline" style="width:100%;justify-content:center">🔗 Find directions for ${esc(r.name)}</a>`;
    })()}
  `, [
    { label: '🛒 Add to Grocery', cls: 'btn-primary', onclick: `addToGroceryFromRecipe('${id}');closeModal()` },
    { label: '✏️ Edit Recipe', cls: 'btn-secondary', onclick: `closeModal();editRecipe('${id}')` },
  ]);
};

window.editRecipe = function(id) {
  const r = id ? state.recipes.find(r => r.id === id) : null;
  openRecipeEditor(r);
};

window.deleteRecipe = function(id) {
  if (!confirm('Delete this recipe?')) return;
  state.recipes = state.recipes.filter(r => r.id !== id);
  persist();
  render_recipes(document.getElementById('recipe-search')?.value ?? '');
  showToast('Recipe deleted.');
};

function openRecipeEditor(r) {
  const isNew = !r;
  const recipe = r ?? { id: uid(), name: '', color: 'green', type: 'meal', tags: [], prepTime: 15, servings: 1, ingredients: [{ name: '', amount: '', unit: 'oz' }], macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };

  openModal(isNew ? 'New Recipe' : 'Edit Recipe', `
    <div class="form-group"><label>Recipe Name</label><input type="text" id="re-name" value="${esc(recipe.name)}" placeholder="e.g. Grilled Salmon"></div>
    <div class="form-row">
      <div class="form-group"><label>Prep Time (min)</label><input type="number" id="re-prep" value="${recipe.prepTime}" min="1"></div>
      <div class="form-group"><label>Servings</label><input type="number" id="re-servings" value="${recipe.servings}" min="1"></div>
    </div>
    <div class="form-group"><label>Tags (comma-separated)</label><input type="text" id="re-tags" value="${esc(recipe.tags.join(', '))}" placeholder="Breakfast, High Protein, Quick"></div>
    <div class="form-group">
      <label>Type</label>
      <select id="re-type">
        <option value="meal" ${(!recipe.type || recipe.type==='meal')?'selected':''}>🍽️ Full Meal</option>
        <option value="component" ${recipe.type==='component'?'selected':''}>🧩 Component / Add-on</option>
      </select>
    </div>
    <div class="form-group">
      <label>Color Theme</label>
      <select id="re-color">
        <option value="green" ${recipe.color==='green'?'selected':''}>🟢 Green</option>
        <option value="orange" ${recipe.color==='orange'?'selected':''}>🟠 Orange</option>
        <option value="blue" ${recipe.color==='blue'?'selected':''}>🔵 Blue</option>
        <option value="purple" ${recipe.color==='purple'?'selected':''}>🟣 Purple</option>
      </select>
    </div>
    <div class="divider"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <strong style="font-size:0.85rem">Ingredients</strong>
      <button class="btn btn-secondary btn-sm" onclick="addIngRow()">+ Add</button>
    </div>
    <div id="ing-list">
      ${recipe.ingredients.map((ing, i) => ingredientRow(ing, i)).join('')}
    </div>
    <div class="divider"></div>
    <strong style="font-size:0.85rem;display:block;margin-bottom:10px">Nutrition (per serving)</strong>
    <div class="form-row">
      <div class="form-group"><label>Calories</label><input type="number" id="re-cal" value="${recipe.macros.calories}" min="0"></div>
      <div class="form-group"><label>Protein (g)</label><input type="number" id="re-prot" value="${recipe.macros.protein}" min="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Carbs (g)</label><input type="number" id="re-carb" value="${recipe.macros.carbs}" min="0"></div>
      <div class="form-group"><label>Fat (g)</label><input type="number" id="re-fat" value="${recipe.macros.fat}" min="0"></div>
    </div>
  `, [
    { label: isNew ? 'Add Recipe' : 'Save Changes', cls: 'btn-primary', onclick: `saveRecipe('${recipe.id}', ${isNew})` },
  ]);
  window._editIngredients = [...recipe.ingredients];
}

function ingredientRow(ing, i) {
  return `
    <div class="ingredient-row" id="ingrow-${i}">
      <input type="text" value="${esc(ing.name)}" placeholder="Ingredient" oninput="updateIng(${i},'name',this.value)">
      <input type="text" value="${esc(ing.amount)}" placeholder="Amount" oninput="updateIng(${i},'amount',this.value)">
      <input type="text" value="${esc(ing.unit)}" placeholder="Unit" oninput="updateIng(${i},'unit',this.value)">
      <button class="btn btn-danger btn-icon btn-sm" onclick="removeIng(${i})">✕</button>
    </div>`;
}

window.updateIng = function(i, field, val) { if (window._editIngredients) window._editIngredients[i][field] = val; };
window.removeIng = function(i) {
  if (window._editIngredients) {
    window._editIngredients.splice(i, 1);
    document.getElementById('ing-list').innerHTML = window._editIngredients.map((ing, idx) => ingredientRow(ing, idx)).join('');
  }
};
window.addIngRow = function() {
  if (!window._editIngredients) window._editIngredients = [];
  window._editIngredients.push({ name: '', amount: '', unit: 'oz' });
  document.getElementById('ing-list').innerHTML = window._editIngredients.map((ing, idx) => ingredientRow(ing, idx)).join('');
};

window.saveRecipe = function(id, isNew) {
  const name = document.getElementById('re-name')?.value.trim();
  if (!name) { showToast('Please enter a recipe name.', 'error'); return; }
  const recipe = {
    id,
    name,
    color: document.getElementById('re-color')?.value ?? 'green',
    type: document.getElementById('re-type')?.value ?? 'meal',
    tags: (document.getElementById('re-tags')?.value ?? '').split(',').map(t => t.trim()).filter(Boolean),
    prepTime: parseInt(document.getElementById('re-prep')?.value) || 15,
    servings: parseInt(document.getElementById('re-servings')?.value) || 1,
    ingredients: window._editIngredients ?? [],
    macros: {
      calories: parseInt(document.getElementById('re-cal')?.value) || 0,
      protein: parseInt(document.getElementById('re-prot')?.value) || 0,
      carbs: parseInt(document.getElementById('re-carb')?.value) || 0,
      fat: parseInt(document.getElementById('re-fat')?.value) || 0,
    },
  };
  if (isNew) {
    state.recipes.push(recipe);
  } else {
    const idx = state.recipes.findIndex(r => r.id === id);
    if (idx >= 0) state.recipes[idx] = recipe;
  }
  persist();
  closeModal();
  render_recipes(document.getElementById('recipe-search')?.value ?? '');
  showToast(isNew ? 'Recipe added!' : 'Recipe saved!');
};

// ── Meal Plan ──────────────────────────────────────────
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MEALS = ['Breakfast','Lunch','Dinner','Snack'];
const MEAL_KEYS = ['breakfast','lunch','dinner','snack'];

function getWeekKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
  return d.toISOString().slice(0, 10);
}

function getTodayKey() {
  const day = new Date().getDay();
  const dayIdx = day === 0 ? 6 : day - 1;
  return DAYS[dayIdx].toLowerCase();
}

let mealPlanWeekOffset = 0;
let mealPlanSelectedDay = getTodayKey();
let recipeTagFilter = '';

function isMobile() { return window.innerWidth <= 768; }

// A "what to cook" summary for the week: each cookable (non-eat-out) recipe and
// how many servings to make. Returns '' when there's nothing to prep.
function prepListHTML(weekData) {
  const counts = {};
  Object.values(weekData).forEach(day => Object.values(day).flat().forEach(rid => {
    counts[rid] = (counts[rid] ?? 0) + 1;
  }));
  const items = Object.keys(counts)
    .map(rid => ({ recipe: state.recipes.find(r => r.id === rid), qty: counts[rid] }))
    .filter(x => x.recipe && !x.recipe.tags.some(t => /eat out/i.test(t)))
    .sort((a, b) => b.qty - a.qty || a.recipe.name.localeCompare(b.recipe.name));
  if (!items.length) return '';

  const rows = items.map(({ recipe, qty }) => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
      <span style="background:var(--green);color:#fff;font-weight:700;font-size:0.8rem;border-radius:6px;padding:2px 8px;min-width:34px;text-align:center">${qty}×</span>
      <span style="flex:1;font-weight:600;font-size:0.9rem">${esc(recipe.name)}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;white-space:nowrap">${recipe.macros.protein}g P · ⏱ ${recipe.prepTime}min</span>
    </div>`).join('');
  const totalServings = items.reduce((s, x) => s + x.qty, 0);
  return `
    <div class="card" style="margin-top:14px">
      <div class="card-title">🍱 This Week's Prep List</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px">${items.length} recipe(s) · ${totalServings} servings to make</div>
      ${rows}
    </div>`;
}

function render_mealplan() {
  const weekKey = getWeekKey(mealPlanWeekOffset);
  const weekData = state.mealPlan.weeks?.[weekKey] ?? {};
  const targets = calcTargets(state.profile);

  const weekStart = new Date(weekKey);
  const dayLabels = DAYS.map((d, i) => {
    const dt = new Date(weekStart);
    dt.setDate(dt.getDate() + i);
    const isToday = dt.toDateString() === new Date().toDateString();
    return { d, isToday, key: d.toLowerCase(), date: `${dt.getMonth()+1}/${dt.getDate()}` };
  });

  const dailyTotals = {};
  dayLabels.forEach(({ key }) => {
    const meals = weekData[key] ?? {};
    let cal = 0, pro = 0, carb = 0, fat = 0;
    Object.values(meals).flat().forEach(rid => {
      const r = state.recipes.find(r => r.id === rid);
      if (r) { cal += r.macros.calories; pro += r.macros.protein; carb += r.macros.carbs; fat += r.macros.fat; }
    });
    dailyTotals[key] = { calories: cal, protein: pro, carbs: carb, fat: fat };
  });

  const weekStr = weekKey + ' – ' + new Date(new Date(weekKey).setDate(new Date(weekKey).getDate() + 6)).toISOString().slice(0, 10);
  const weekNav = `
    <div class="week-nav" style="margin-bottom:14px">
      <button class="btn btn-secondary btn-sm" onclick="shiftWeek(-1)">← Prev</button>
      <span style="font-weight:600;font-size:0.9rem;flex:1;text-align:center">${weekStr}</span>
      <button class="btn btn-secondary btn-sm" onclick="shiftWeek(1)">Next →</button>
      ${mealPlanWeekOffset !== 0 ? `<button class="btn btn-outline btn-sm" onclick="shiftWeek(${-mealPlanWeekOffset})">Today</button>` : ''}
    </div>`;

  if (isMobile()) {
    if (!dayLabels.find(dl => dl.key === mealPlanSelectedDay)) {
      mealPlanSelectedDay = getTodayKey();
    }
    const selDay = mealPlanSelectedDay;
    const dayMeals = weekData[selDay] ?? {};
    const dt = dailyTotals[selDay];
    const pct = Math.round(dt.calories / targets.calories * 100);
    const calColor = pct > 110 ? 'var(--red)' : pct > 90 ? 'var(--green)' : 'var(--text-muted)';

    document.getElementById('mealplan-content').innerHTML = `
      ${weekNav}
      <div class="day-tabs">
        ${dayLabels.map(({ d, key, isToday, date }) => `
          <button class="day-tab ${isToday ? 'today' : ''} ${key === selDay ? 'active' : ''}" onclick="selectMealDay('${weekKey}','${key}')">${d}<br><span style="font-size:0.65rem;font-weight:400">${date}</span></button>
        `).join('')}
      </div>
      <div class="mobile-day-total">
        <span style="color:var(--text-muted);font-size:0.8rem">Today's total</span>
        <div style="text-align:right">
          <strong style="color:${calColor}">${dt.calories} cal</strong>
          <span style="color:var(--text-muted);font-size:0.8rem"> · ${dt.protein}g P · ${dt.carbs}g C · ${dt.fat}g F</span>
        </div>
      </div>
      ${MEAL_KEYS.map((mk, mi) => {
        const rid = dayMeals[mk];
        const recipe = rid ? state.recipes.find(r => r.id === rid) : null;
        return `
          <div class="mobile-meal-row">
            <div class="mobile-meal-header">
              <span>${MEALS[mi]}</span>
              ${recipe ? `<button class="btn btn-danger btn-sm" style="min-height:0;padding:3px 8px" onclick="clearMeal('${weekKey}','${selDay}','${mk}')">✕ Clear</button>` : ''}
            </div>
            <div class="mobile-meal-body ${recipe ? '' : 'empty'}" onclick="openMealPicker('${weekKey}','${selDay}','${mk}')">
              ${recipe
                ? `<div style="flex:1"><div class="mobile-meal-name">${esc(recipe.name)}</div><div class="mobile-meal-macros">${recipe.macros.calories} cal · ${recipe.macros.protein}g protein · ⏱ ${recipe.prepTime}min</div></div><span style="color:var(--green);font-size:1.1rem">›</span>`
                : `<span class="mobile-meal-add">+ Tap to add a meal</span>`}
            </div>
          </div>`;
      }).join('')}
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary" style="width:100%;justify-content:center" onclick="autoGenerateWeek()">⚡ Auto-Generate Week</button>
        <button class="btn btn-secondary" style="width:100%;justify-content:center" onclick="autoGenerateWeek(true)">🍱 Meal-Prep Week</button>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateGroceryFromPlan()">🛒 Generate Grocery List</button>
      </div>
      ${prepListHTML(weekData)}`;
  } else {
    document.getElementById('mealplan-content').innerHTML = `
      ${weekNav}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px">
        <button class="btn btn-secondary btn-sm" onclick="autoGenerateWeek()">⚡ Auto-Generate Week</button>
        <button class="btn btn-secondary btn-sm" onclick="autoGenerateWeek(true)">🍱 Meal-Prep Week</button>
        <button class="btn btn-primary btn-sm" onclick="generateGroceryFromPlan()">🛒 Generate Grocery List</button>
      </div>
      <div style="overflow-x:auto">
        <div class="week-grid" style="margin-bottom:8px">
          <div></div>
          ${dayLabels.map(({ d, date, isToday }) => `<div class="week-day-header ${isToday ? 'today' : ''}">${d}<br><span style="font-size:0.7rem;font-weight:400">${date}</span></div>`).join('')}
          ${MEAL_KEYS.map((mk, mi) => `
            <div class="meal-label">${MEALS[mi]}</div>
            ${dayLabels.map(({ key }) => {
              const rid = weekData?.[key]?.[mk];
              const recipe = rid ? state.recipes.find(r => r.id === rid) : null;
              return recipe
                ? `<div class="meal-slot filled" onclick="openMealPicker('${weekKey}','${key}','${mk}')">
                    <button class="meal-slot-clear" onclick="event.stopPropagation();clearMeal('${weekKey}','${key}','${mk}')">✕</button>
                    <div class="meal-slot-recipe">${esc(recipe.name)}</div>
                    <div class="meal-slot-macros">${recipe.macros.calories} cal · ${recipe.macros.protein}g P</div>
                  </div>`
                : `<div class="meal-slot" onclick="openMealPicker('${weekKey}','${key}','${mk}')"><div class="meal-slot-add">+ Add</div></div>`;
            }).join('')}
          `).join('')}
          <div class="meal-label" style="font-size:0.7rem">TOTAL</div>
          ${dayLabels.map(({ key }) => {
            const t = dailyTotals[key];
            const pct = Math.round(t.calories / targets.calories * 100);
            const color = pct > 110 ? 'var(--red)' : pct > 90 ? 'var(--green)' : 'var(--text-muted)';
            return `<div style="background:var(--surface);border-radius:8px;padding:6px 8px;text-align:center;font-size:0.72rem">
              <div style="font-weight:700;color:${color}">${t.calories} cal</div>
              <div style="color:var(--text-muted)">${t.protein}g P</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      ${prepListHTML(weekData)}`;
  }
}

window.shiftWeek = function(delta) {
  mealPlanWeekOffset += delta;
  render_mealplan();
};

window.selectMealDay = function(weekKey, dayKey) {
  mealPlanSelectedDay = dayKey;
  render_mealplan();
};

window.openMealPicker = function(weekKey, dayKey, mealKey) {
  const mealLabel = MEALS[MEAL_KEYS.indexOf(mealKey)];
  const dayLabel = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
  openModal(`${dayLabel} — ${mealLabel}`, `
    <div class="form-group">
      <label>Search Recipes</label>
      <input type="text" id="mp-search" placeholder="Filter recipes…" oninput="filterMealPicker(this.value,'${weekKey}','${dayKey}','${mealKey}')">
    </div>
    <div id="mp-list">
      ${mealPickerList(state.recipes, weekKey, dayKey, mealKey)}
    </div>
  `, [
    { label: 'Clear Meal', cls: 'btn-secondary', onclick: `clearMeal('${weekKey}','${dayKey}','${mealKey}');closeModal()` },
  ]);
};

function mealPickerList(recipes, weekKey, dayKey, mealKey) {
  if (recipes.length === 0) return '<div style="color:var(--text-muted);text-align:center;padding:24px">No recipes found</div>';
  return recipes.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);margin-bottom:6px;transition:border-color 0.1s" onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--border)'" onclick="assignMeal('${weekKey}','${dayKey}','${mealKey}','${r.id}')">
      <div>
        <div style="font-weight:600;font-size:0.9rem">${esc(r.name)}${r.type === 'component' ? ' <span style="font-size:0.7rem;color:#aaa">(add-on)</span>' : ''}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${r.macros.calories} cal · ${r.macros.protein}g protein · ⏱ ${r.prepTime}min</div>
      </div>
      <span class="btn btn-primary btn-sm">Select</span>
    </div>`).join('');
}

window.filterMealPicker = function(val, weekKey, dayKey, mealKey) {
  const filtered = val
    ? state.recipes.filter(r => r.name.toLowerCase().includes(val.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(val.toLowerCase())))
    : state.recipes;
  document.getElementById('mp-list').innerHTML = mealPickerList(filtered, weekKey, dayKey, mealKey);
};

window.assignMeal = function(weekKey, dayKey, mealKey, recipeId) {
  if (!state.mealPlan.weeks) state.mealPlan.weeks = {};
  if (!state.mealPlan.weeks[weekKey]) state.mealPlan.weeks[weekKey] = {};
  if (!state.mealPlan.weeks[weekKey][dayKey]) state.mealPlan.weeks[weekKey][dayKey] = {};
  state.mealPlan.weeks[weekKey][dayKey][mealKey] = recipeId;
  persist();
  closeModal();
  render_mealplan();
};

window.clearMeal = function(weekKey, dayKey, mealKey) {
  if (state.mealPlan.weeks?.[weekKey]?.[dayKey]?.[mealKey]) {
    delete state.mealPlan.weeks[weekKey][dayKey][mealKey];
    persist();
    render_mealplan();
  }
};

// How many distinct recipes a meal-prep week uses per meal slot (cook this many
// batches, eat each across several days).
const PREP_VARIETY = 2;

window.autoGenerateWeek = function(mealPrep = false) {
  const confirmMsg = mealPrep
    ? 'Generate a meal-prep week (same meals batched across several days)? This overwrites this week\'s plan.'
    : 'Auto-generate will overwrite this week\'s meal plan. Continue?';
  if (!confirm(confirmMsg)) return;
  const weekKey = getWeekKey(mealPlanWeekOffset);
  const p = state.profile;
  const isProteinMode = p.bulkCut || p.increaseMuscle;
  if (!state.mealPlan.weeks) state.mealPlan.weeks = {};
  state.mealPlan.weeks[weekKey] = {};

  const THURSDAY_LUNCH_ID = 'po1'; // Ahi Tuna Poke Bowl pinned to Thu lunch

  function poolFor(mk) {
    const patterns = { breakfast: /breakfast/i, lunch: /lunch/i, dinner: /dinner/i, snack: /snack/i };
    let pool = state.recipes.filter(r => r.tags.some(t => patterns[mk].test(t)));
    // Main meal slots only use full meals, not components (sides, shakes, add-ons)
    if (mk !== 'snack') {
      const mealsOnly = pool.filter(r => !r.type || r.type === 'meal');
      if (mealsOnly.length > 0) pool = mealsOnly;
    }
    if (pool.length === 0) pool = state.recipes.filter(r => !r.type || r.type === 'meal');
    if (pool.length === 0) pool = [...state.recipes];
    if (isProteinMode && mk === 'snack') {
      const shakes = pool.filter(r => r.tags.some(t => /protein shake/i.test(t)));
      if (shakes.length > 0) pool = [...shakes, ...pool.filter(r => !r.tags.some(t => /protein shake/i.test(t)))];
    }
    if (isProteinMode) {
      pool = [...pool].sort((a, b) => (b.macros.protein / Math.max(b.macros.calories, 1)) - (a.macros.protein / Math.max(a.macros.calories, 1)));
    }
    return pool;
  }

  // Meal-prep: pick PREP_VARIETY recipes for a slot and spread them across the 7
  // days in contiguous blocks, so each batch is eaten on consecutive days.
  function prepPlanFor(mk) {
    // Eat-out meals can't be batch-cooked, so they're never a meal-prep option.
    const pool = poolFor(mk).filter(r => !r.tags.some(t => /eat out/i.test(t)));
    if (!pool.length) return [];
    const count = Math.min(PREP_VARIETY, pool.length);
    const chosen = pool.slice(0, count);
    const perBlock = Math.ceil(DAYS.length / count);
    return DAYS.map((_, dayIdx) => chosen[Math.min(Math.floor(dayIdx / perBlock), count - 1)]);
  }

  const prepPlan = {};
  if (mealPrep) MEAL_KEYS.forEach(mk => { prepPlan[mk] = prepPlanFor(mk); });

  DAYS.forEach((d, dayIdx) => {
    const dayKey = d.toLowerCase();
    const dayData = {};
    const used = new Set();
    MEAL_KEYS.forEach(mk => {
      // Thursday (dayIdx 3) lunch is always the poke bowl
      if (dayIdx === 3 && mk === 'lunch') {
        const pinned = state.recipes.find(r => r.id === THURSDAY_LUNCH_ID);
        if (pinned) { dayData[mk] = THURSDAY_LUNCH_ID; used.add(THURSDAY_LUNCH_ID); return; }
      }
      if (mealPrep) {
        const pick = prepPlan[mk]?.[dayIdx];
        if (pick) dayData[mk] = pick.id;
        return;
      }
      const pool = poolFor(mk);
      if (!pool.length) return;
      const offset = dayIdx % pool.length;
      const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
      const pick = rotated.find(r => !used.has(r.id)) ?? rotated[0];
      if (pick) { dayData[mk] = pick.id; used.add(pick.id); }
    });
    state.mealPlan.weeks[weekKey][dayKey] = dayData;
  });

  persist();
  render_mealplan();
  showToast(mealPrep ? 'Meal-prep week generated!' : 'Week auto-generated!');
};

window.generateGroceryFromPlan = function() {
  const weekKey = getWeekKey(mealPlanWeekOffset);
  const weekData = state.mealPlan.weeks?.[weekKey] ?? {};
  // Count how many times each recipe is eaten this week so quantities scale.
  const counts = {};
  Object.values(weekData).forEach(day => Object.values(day).flat().forEach(rid => {
    counts[rid] = (counts[rid] ?? 0) + 1;
  }));
  const recipeIds = Object.keys(counts);

  if (recipeIds.length === 0) { showToast('No meals planned this week.', 'warn'); return; }

  recipeIds.forEach(rid => {
    const recipe = state.recipes.find(r => r.id === rid);
    if (!recipe) return;
    const qty = counts[rid];
    if (recipe.tags.some(t => /eat out/i.test(t))) { addEatOutItem(recipe, qty); return; } // eat-out meals get a price line, not ingredients
    recipe.ingredients.forEach(ing => {
      const amt = parseFloat(ing.amount);
      const scaled = isNaN(amt) ? ing.amount : trimNum(amt * qty);
      addGroceryItem(ing.name, scaled, ing.unit, recipe.name);
    });
  });

  persist();
  navigate('grocery');
  showToast(`Grocery list updated from ${recipeIds.size} recipe(s)!`);
};

// ── Grocery ────────────────────────────────────────────
const GROCERY_CATS = ['Produce', 'Meat & Fish', 'Dairy & Eggs', 'Grains & Bread', 'Pantry', 'Frozen', 'Beverages', 'Eat Out', 'Other'];

// Collapse interchangeable ingredient variants onto a single shopping name.
// First match wins.
const CANONICAL_INGREDIENTS = [
  [/protein powder/i, 'Protein powder'], // whey, casein, vanilla, plain → one line
];

// Turn recipe-specific ingredient names into generic shopping-list names,
// e.g. "Brown rice (cooked)" → "Brown rice", "Greek yogurt (0%)" → "Greek yogurt".
function genericizeName(name) {
  const stripped = String(name).replace(/\s*\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  const canon = CANONICAL_INGREDIENTS.find(([re]) => re.test(stripped));
  return canon ? canon[1] : stripped;
}

function formatPrice(price) {
  const p = Number(price) || 0;
  return p > 0 ? `$${p.toFixed(2)}` : '$0';
}

// Fallback prices by meal name, for eat-out recipes saved to localStorage
// before the price field existed. recipe.price always takes precedence.
const EAT_OUT_PRICES = {
  'Chipotle Chicken Bowl': 10.95,
  'Chipotle Chicken + Steak Bowl': 14.45,
  'Ahi Tuna Poke Bowl': 0, // provided by work
};

function eatOutPrice(recipe) {
  return recipe.price ?? EAT_OUT_PRICES[recipe.name] ?? 0;
}

function categorize(name) {
  const n = name.toLowerCase();
  if (/trader joe/.test(n)) return 'Frozen';
  if (/casein|whey|protein powder/.test(n)) return 'Dairy & Eggs';
  if (/chicken|turkey|beef|pork|salmon|tuna|fish|shrimp|egg/.test(n)) return 'Meat & Fish';
  if (/milk|yogurt|cheese|butter|cream/.test(n)) return 'Dairy & Eggs';
  if (/rice|oat|bread|tortilla|pasta|quinoa|granola|flour/.test(n)) return 'Grains & Bread';
  if (/apple|banana|berry|tomato|lettuce|spinach|broccoli|zucchini|cucumber|pepper|onion|garlic|lemon|lime|strawberry|blueberry|cherry/.test(n)) return 'Produce';
  if (/oil|sauce|vinegar|mustard|salt|pepper|spice|honey|soy|sriracha|powder/.test(n)) return 'Pantry';
  if (/almond milk|juice|water|coffee|tea|shake/.test(n)) return 'Beverages';
  if (/frozen/.test(n)) return 'Frozen';
  return 'Other';
}

// Format a number without trailing zeros, e.g. 1.5 -> "1.5", 2.0 -> "2".
function trimNum(n) {
  return String(+n.toFixed(2));
}

function roundUpTo(value, step) {
  return Math.ceil(value / step) * step;
}

// Canonicalize units so plural/variant spellings sum into one line.
const UNIT_ALIASES = {
  cups: 'cup', tbsps: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsps: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', ounce: 'oz', ounces: 'oz',
  cloves: 'clove', pieces: 'piece', slices: 'slice', sprays: 'spray',
  servings: 'serving', scoops: 'scoop', bowls: 'bowl', patties: 'patty',
  pounds: 'lb', lbs: 'lb', pound: 'lb', cans: 'can',
};
function normalizeUnit(unit) {
  const u = String(unit ?? '').trim().toLowerCase();
  return UNIT_ALIASES[u] ?? u;
}

// Pluralize a unit for display when the amount isn't exactly 1.
const UNIT_PLURALS = {
  cup: 'cups', clove: 'cloves', piece: 'pieces', slice: 'slices',
  serving: 'servings', scoop: 'scoops', can: 'cans', patty: 'patties',
  bowl: 'bowls', lb: 'lbs',
};
function displayUnit(amount, unit) {
  const n = parseFloat(amount);
  return (!isNaN(n) && n !== 1 && UNIT_PLURALS[unit]) ? UNIT_PLURALS[unit] : unit;
}

// Convert summed recipe amounts toward how you'd actually buy the item. First
// match wins; anything unmatched stays in its recipe unit. Trader Joe's items
// are sold as packages, so they're left alone.
const PURCHASE_RULES = [
  { match: /canned tuna/i, when: u => u === 'oz', apply: amt => ({ amount: trimNum(Math.max(1, Math.ceil(amt / 5))), unit: 'can' }) },
  { match: /chicken|turkey|beef|steak|pork|salmon|shrimp/i, when: u => u === 'oz', apply: amt => ({ amount: trimNum(roundUpTo(amt / 16, 0.25)), unit: 'lb' }) },
];
function purchaseQty(name, amount, unit) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || /trader joe/i.test(name)) return { amount, unit };
  const rule = PURCHASE_RULES.find(r => r.match.test(name) && r.when(normalizeUnit(unit)));
  return rule ? rule.apply(amt) : { amount, unit };
}

// Final display quantity: convert to purchase units, then pluralize.
function shoppingQty(g) {
  const { amount, unit } = purchaseQty(g.name, g.amount, g.unit);
  return { amount, unit: displayUnit(amount, unit) };
}

function addGroceryItem(name, amount, unit, source, category) {
  const gname = genericizeName(name);
  unit = normalizeUnit(unit);
  // Same item + same unit = one line; sum the amounts when both are numeric.
  const existing = state.grocery.find(g =>
    g.name.toLowerCase() === gname.toLowerCase() && g.unit === unit && !g.checked);
  if (existing) {
    const a = parseFloat(existing.amount), b = parseFloat(amount);
    if (!isNaN(a) && !isNaN(b)) existing.amount = trimNum(a + b);
    return;
  }
  state.grocery.push({
    id: uid(),
    name: gname,
    amount,
    unit,
    category: category ?? categorize(gname),
    checked: false,
    source: source ?? '',
  });
}

// Add an eat-out meal to the grocery list under "Eat Out", showing its total
// price (price × times eaten) where the quantity goes. $0 = provided by work.
function addEatOutItem(recipe, qty = 1) {
  const price = eatOutPrice(recipe);
  let note = qty > 1 ? `×${qty}` : '';
  if (price === 0) note = note ? `${note}, work` : 'work';
  addGroceryItem(recipe.name, formatPrice(price * qty), note ? `(${note})` : '', recipe.name, 'Eat Out');
}

window.addToGroceryFromRecipe = function(id) {
  const recipe = state.recipes.find(r => r.id === id);
  if (!recipe) return;
  if (recipe.tags.some(t => /eat out/i.test(t))) {
    addEatOutItem(recipe);
    persist();
    showToast(`${recipe.name} added to your Eat Out list!`);
    return;
  }
  recipe.ingredients.forEach(ing => addGroceryItem(ing.name, ing.amount, ing.unit, recipe.name));
  persist();
  showToast(`${recipe.ingredients.length} ingredients added to grocery list!`);
};

function render_grocery() {
  const el = document.getElementById('grocery-content');
  const unchecked = state.grocery.filter(g => !g.checked);
  const checked = state.grocery.filter(g => g.checked);

  if (state.grocery.length === 0) {
    el.innerHTML = `
      <div class="notice notice-info">Generate a grocery list from your meal plan, or add items manually below.</div>
      ${addGroceryForm()}
      <div class="empty-state"><div class="icon">🛒</div><p>Your grocery list is empty.<br>Plan meals and click "Generate Grocery List".</p></div>`;
    bindAddGrocery();
    return;
  }

  const byCat = {};
  GROCERY_CATS.forEach(c => byCat[c] = []);
  unchecked.forEach(g => {
    const cat = byCat[g.category] ? g.category : 'Other';
    byCat[cat].push(g);
  });

  const catHTML = GROCERY_CATS.filter(c => byCat[c].length > 0).map(cat => `
    <div class="grocery-category">
      <h4>${cat}</h4>
      ${byCat[cat].map(g => groceryItemHTML(g)).join('')}
    </div>`).join('');

  const checkedHTML = checked.length > 0 ? `
    <div class="grocery-category" style="opacity:0.6">
      <h4>✓ Done (${checked.length})</h4>
      ${checked.map(g => groceryItemHTML(g)).join('')}
    </div>` : '';

  el.innerHTML = `
    <div class="section-actions">
      <div style="font-size:0.9rem;color:var(--text-muted)">
        <strong>${unchecked.length}</strong> items remaining · <strong>${checked.length}</strong> done
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="copyGrocery()">📋 Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="clearChecked()">Clear Done</button>
        <button class="btn btn-danger btn-sm" onclick="clearAll()">Clear All</button>
      </div>
    </div>
    ${addGroceryForm()}
    <div class="grocery-categories">
      ${catHTML}
      ${checkedHTML}
    </div>`;
  bindAddGrocery();
}

function groceryItemHTML(g) {
  const { amount, unit } = shoppingQty(g);
  return `
    <div class="grocery-item ${g.checked ? 'checked' : ''}" id="gi-${g.id}">
      <input type="checkbox" ${g.checked ? 'checked' : ''} onchange="toggleGrocery('${g.id}')">
      <span class="grocery-text">${esc(g.name)}</span>
      <span class="grocery-amount">${esc(amount)} ${esc(unit)}</span>
      <button class="grocery-del" onclick="deleteGrocery('${g.id}')">✕</button>
    </div>`;
}

function addGroceryForm() {
  return `
    <div class="card" style="padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
        <div class="form-group" style="margin:0;flex:2;min-width:150px">
          <label style="margin-bottom:4px">Item</label>
          <input type="text" id="ag-name" placeholder="e.g. Chicken breast">
        </div>
        <div class="form-group" style="margin:0;width:80px">
          <label style="margin-bottom:4px">Amount</label>
          <input type="text" id="ag-amt" placeholder="2">
        </div>
        <div class="form-group" style="margin:0;width:80px">
          <label style="margin-bottom:4px">Unit</label>
          <input type="text" id="ag-unit" placeholder="lbs">
        </div>
        <button class="btn btn-primary" id="ag-btn">+ Add Item</button>
      </div>
    </div>`;
}

function bindAddGrocery() {
  const btn = document.getElementById('ag-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const name = document.getElementById('ag-name')?.value.trim();
    const amt  = document.getElementById('ag-amt')?.value.trim() || '1';
    const unit = document.getElementById('ag-unit')?.value.trim() || 'unit';
    if (!name) return;
    addGroceryItem(name, amt, unit, '');
    persist();
    render_grocery();
  });
  document.getElementById('ag-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

window.toggleGrocery = function(id) {
  const item = state.grocery.find(g => g.id === id);
  if (item) { item.checked = !item.checked; persist(); render_grocery(); }
};

window.deleteGrocery = function(id) {
  state.grocery = state.grocery.filter(g => g.id !== id);
  persist();
  render_grocery();
};

window.clearChecked = function() {
  state.grocery = state.grocery.filter(g => !g.checked);
  persist();
  render_grocery();
};

window.clearAll = function() {
  if (confirm('Clear entire grocery list?')) {
    state.grocery = [];
    persist();
    render_grocery();
  }
};

window.copyGrocery = async function() {
  const items = state.grocery.filter(g => !g.checked);
  if (!items.length) { showToast('Nothing to copy — list is empty.', 'warn'); return; }
  const byCat = {};
  GROCERY_CATS.forEach(c => byCat[c] = []);
  items.forEach(g => { (byCat[g.category] ?? byCat['Other']).push(g); });
  const text = GROCERY_CATS.filter(c => byCat[c].length > 0).map(cat =>
    `${cat}\n` + byCat[cat].map(g => {
      const s = shoppingQty(g);
      const qty = [s.amount, s.unit].filter(Boolean).join(' ').trim();
      return `- ${g.name}${qty ? ` — ${qty}` : ''}`;
    }).join('\n')
  ).join('\n\n');

  try {
    await navigator.clipboard.writeText(text);
    showToast('Grocery list copied!');
  } catch {
    // Fallback for browsers/contexts without the async clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Grocery list copied!'); }
    catch { showToast('Copy failed — try selecting manually.', 'error'); }
    document.body.removeChild(ta);
  }
};

// ── Modal ──────────────────────────────────────────────
function openModal(title, body, actions = []) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  const footer = document.getElementById('modal-footer');
  footer.innerHTML = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>` +
    actions.map(a => `<button class="btn ${a.cls}" onclick="${a.onclick}">${a.label}</button>`).join('');
  document.getElementById('modal-overlay').classList.add('open');
}

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('open');
};
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ── Toast ──────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = type === 'error' ? 'var(--red)' : type === 'warn' ? 'var(--orange)' : 'var(--green)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Render dispatcher ──────────────────────────────────
function render(page) {
  if (page === 'dashboard') render_dashboard();
  else if (page === 'goals') render_goals();
  else if (page === 'recipes') {
    render_recipes();
    const si = document.getElementById('recipe-search');
    if (si) si.addEventListener('input', e => render_recipes(e.target.value));
  }
  else if (page === 'mealplan') render_mealplan();
  else if (page === 'grocery') render_grocery();
}

// ── Boot ───────────────────────────────────────────────
navigate('dashboard');
