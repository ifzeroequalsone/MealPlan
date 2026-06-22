// Mifflin-St Jeor BMR → TDEE → goal-adjusted targets

const ACTIVITY = {
  sedentary:  { label: 'Sedentary (desk job, little exercise)',   mult: 1.2  },
  light:      { label: 'Lightly Active (1-3x/week)',              mult: 1.375 },
  moderate:   { label: 'Moderately Active (3-5x/week)',           mult: 1.55  },
  active:     { label: 'Active (6-7x/week)',                      mult: 1.725 },
  veryActive: { label: 'Very Active (2x/day or physical job)',    mult: 1.9   },
};

function lbsToKg(lbs) { return lbs * 0.453592; }
function ftInToCm(ft, inches) { return (ft * 12 + inches) * 2.54; }

function calcBMR(profile) {
  const weightKg = lbsToKg(profile.currentWeight);
  const heightCm = ftInToCm(profile.heightFt, profile.heightIn);
  const base = 10 * weightKg + 6.25 * heightCm - 5 * profile.age;
  return profile.gender === 'male' ? base + 5 : base - 161;
}

function calcTDEE(profile) {
  const bmr = calcBMR(profile);
  const mult = ACTIVITY[profile.activityLevel]?.mult ?? 1.55;
  return Math.round(bmr * mult);
}

function calcTargets(profile) {
  const tdee = calcTDEE(profile);
  const { currentWeight, goalWeight, goalWeeks, increaseMuscle } = profile;

  let targetCals;
  if (increaseMuscle) {
    targetCals = tdee + 350;
  } else {
    const lbsDiff = currentWeight - goalWeight;
    if (lbsDiff <= 0) {
      targetCals = tdee;
    } else {
      const weeklyDeficit = (lbsDiff * 3500) / goalWeeks;
      const dailyDeficit = weeklyDeficit / 7;
      const clampedDeficit = Math.min(Math.max(dailyDeficit, 0), 1000);
      targetCals = Math.max(tdee - clampedDeficit, profile.gender === 'female' ? 1200 : 1500);
    }
  }

  const proteinPerLb = increaseMuscle ? 1.1 : 0.9;
  const proteinG = Math.round(profile.currentWeight * proteinPerLb);
  const fatCals = targetCals * 0.25;
  const fatG = Math.round(fatCals / 9);
  const proteinCals = proteinG * 4;
  const carbCals = targetCals - proteinCals - fatCals;
  const carbG = Math.max(0, Math.round(carbCals / 4));

  return {
    tdee,
    calories: Math.round(targetCals),
    protein: proteinG,
    carbs: carbG,
    fat: fatG,
  };
}

function goalSummary(profile) {
  const { currentWeight, goalWeight, goalWeeks, increaseMuscle } = profile;
  const diff = Math.abs(currentWeight - goalWeight);
  if (increaseMuscle) return `Build muscle — ${goalWeeks}w plan`;
  if (currentWeight > goalWeight) return `Lose ${diff} lbs in ${goalWeeks} weeks`;
  if (currentWeight < goalWeight) return `Gain ${diff} lbs in ${goalWeeks} weeks`;
  return 'Maintain weight';
}

function daysLeft(profile) {
  const end = new Date(profile.startDate);
  end.setDate(end.getDate() + profile.goalWeeks * 7);
  const diff = Math.ceil((end - new Date()) / 86400000);
  return Math.max(0, diff);
}

function weightProgress(profile) {
  const { currentWeight, goalWeight } = profile;
  if (currentWeight === goalWeight) return 100;
  return 0; // updated live by user; this is placeholder
}

export { ACTIVITY, calcTDEE, calcTargets, goalSummary, daysLeft };
