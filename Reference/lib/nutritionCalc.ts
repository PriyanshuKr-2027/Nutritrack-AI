// ─────────────────────────────────────────────────────────────────────────────
// lib/nutritionCalc.ts
//
// Pure nutrition calculation functions — no UI, no side effects, no imports.
// Reusable across: CombinedOnboardingFlow, Profile edit, server-side audit.
//
// Formula sources:
//   BMR  — Mifflin-St Jeor (1990), most validated for general population
//   TDEE — Standard activity multipliers (Ainsworth et al.)
//   Deficit cap — 1,000 kcal/day = ~1kg/week, accepted clinical safety ceiling
//   Protein — 2g/kg body weight (ISSN position stand for active individuals)
// ─────────────────────────────────────────────────────────────────────────────

export type Gender        = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal          = "lose" | "maintain" | "gain";

// ── Input ────────────────────────────────────────────────────────────────────

export interface UserStats {
  weight:        number;        // kg (convert imperial before calling)
  height:        number;        // cm (convert imperial before calling)
  age:           number;
  gender:        Gender;
  activityLevel: ActivityLevel;
  goal:          Goal;
  targetWeight?: number;        // kg — required when goal !== "maintain"
  weeks?:        number;        // target duration — required when goal !== "maintain"
}

// ── Output ───────────────────────────────────────────────────────────────────

export interface NutritionPlan {
  // Core numbers — what gets saved to profiles table
  goalCalories:  number;        // kcal/day
  protein:       number;        // g/day
  carbs:         number;        // g/day
  fat:           number;        // g/day

  // Intermediate — useful for display / debugging
  bmr:           number;
  tdee:          number;

  // Goal tracking
  dailyDelta:          number;  // kcal (negative = deficit, positive = surplus)
  weeklyWeightChange:  number;  // kg/week (negative = loss)
  estimatedWeeks:      number;  // may differ from input.weeks if capped

  // Safety flags — show warnings in PlanRevealScreen if true
  warningCapped:           boolean; // deficit was capped at MAX_DAILY_DEFICIT
  warningExtendedTimeline: boolean; // had to add weeks because of cap
  warningAggressiveGain:   boolean; // surplus > 500 kcal (bulk too fast)

  // Pass-through for display
  goal:          Goal;
  targetWeight?: number;
  inputWeeks?:   number;        // what the user asked for
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** kcal needed to lose/gain 1 kg of body weight */
const KCAL_PER_KG = 7700;

/** Hard safety ceiling on daily deficit — never go below this */
const MAX_DAILY_DEFICIT = 1000;

/** Hard ceiling on daily surplus for muscle gain — beyond this is mostly fat */
const MAX_DAILY_SURPLUS = 500;

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // desk job, no exercise
  light:     1.375,  // light exercise 1–3 days/week
  moderate:  1.55,   // moderate exercise 3–5 days/week
  active:    1.725,  // hard exercise 6–7 days/week
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — BMR (Mifflin-St Jeor)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateBMR(
  weight: number,
  height: number,
  age:    number,
  gender: Gender,
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male")   return Math.round(base + 5);
  if (gender === "female") return Math.round(base - 161);
  return Math.round(base - 78); // "other" — midpoint of male/female offsets
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — TDEE
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Goal-adjusted calories (target-week aware)
//
// For lose/gain:
//   1. Calculate total kcal needed:  weightDiff × 7700
//   2. Spread over user's timeline:  totalKcal ÷ (weeks × 7)  = daily delta
//   3. Cap at safety limits
//   4. If cap was hit, recalculate how many weeks it will actually take
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalCaloriesResult {
  goalCalories:            number;
  dailyDelta:              number;
  weeklyWeightChange:      number;
  estimatedWeeks:          number;
  warningCapped:           boolean;
  warningExtendedTimeline: boolean;
  warningAggressiveGain:   boolean;
}

export function calculateGoalCalories(
  tdee:          number,
  goal:          Goal,
  currentWeight: number,
  targetWeight?: number,
  weeks?:        number,
): GoalCaloriesResult {
  // Maintain — trivial case
  if (goal === "maintain" || targetWeight === undefined || weeks === undefined) {
    return {
      goalCalories:            tdee,
      dailyDelta:              0,
      weeklyWeightChange:      0,
      estimatedWeeks:          0,
      warningCapped:           false,
      warningExtendedTimeline: false,
      warningAggressiveGain:   false,
    };
  }

  const weightDiff    = Math.abs(targetWeight - currentWeight);   // kg
  const totalKcal     = weightDiff * KCAL_PER_KG;                 // total kcal to move
  const rawDailyDelta = totalKcal / (weeks * 7);                  // kcal/day needed

  let warningCapped           = false;
  let warningExtendedTimeline = false;
  let warningAggressiveGain   = false;
  let cappedDelta             = rawDailyDelta;

  if (goal === "lose") {
    if (rawDailyDelta > MAX_DAILY_DEFICIT) {
      cappedDelta             = MAX_DAILY_DEFICIT;
      warningCapped           = true;
      warningExtendedTimeline = true;
    }
    const goalCalories   = Math.round(tdee - cappedDelta);
    // How long will it actually take at the capped rate?
    const estimatedWeeks = warningCapped
      ? Math.ceil(totalKcal / (cappedDelta * 7))
      : weeks;
    return {
      goalCalories,
      dailyDelta:         -cappedDelta,
      weeklyWeightChange: Math.round(-(cappedDelta * 7 / KCAL_PER_KG) * 100) / 100,
      estimatedWeeks,
      warningCapped,
      warningExtendedTimeline,
      warningAggressiveGain: false,
    };
  }

  // goal === "gain"
  if (rawDailyDelta > MAX_DAILY_SURPLUS) {
    cappedDelta           = MAX_DAILY_SURPLUS;
    warningCapped         = true;
    warningAggressiveGain = true;
    warningExtendedTimeline = true;
  }
  const goalCalories   = Math.round(tdee + cappedDelta);
  const estimatedWeeks = warningCapped
    ? Math.ceil(totalKcal / (cappedDelta * 7))
    : weeks;
  return {
    goalCalories,
    dailyDelta:         cappedDelta,
    weeklyWeightChange: Math.round((cappedDelta * 7 / KCAL_PER_KG) * 100) / 100,
    estimatedWeeks,
    warningCapped,
    warningExtendedTimeline,
    warningAggressiveGain,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Macros
//
//   Protein:  2g × body_weight_kg  (ISSN recommendation for active users)
//   Fat:      25% of goalCalories  → grams = (cals × 0.25) ÷ 9
//   Carbs:    remaining calories   → grams = remaining ÷ 4
//
// Note: protein is body-weight based, NOT a percentage of calories.
// This means macro % will shift based on the user's weight and calorie goal.
// ─────────────────────────────────────────────────────────────────────────────

export interface MacroResult {
  protein: number; // g
  fat:     number; // g
  carbs:   number; // g
}

export function calculateMacros(
  goalCalories: number,
  bodyWeightKg: number,
): MacroResult {
  const protein     = Math.round(2 * bodyWeightKg);            // g
  const proteinKcal = protein * 4;

  const fatKcal     = Math.round(goalCalories * 0.25);
  const fat         = Math.round(fatKcal / 9);                 // g

  const remainingKcal = Math.max(0, goalCalories - proteinKcal - fatKcal);
  const carbs         = Math.round(remainingKcal / 4);         // g

  return { protein, fat, carbs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit conversions (imperial input → metric for calculations)
// ─────────────────────────────────────────────────────────────────────────────

/** lbs → kg */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

/** ft (decimal, e.g. 5.11) → cm */
export function ftToCm(ft: number): number {
  const totalInches = Math.floor(ft) * 12 + (ft % 1) * 10;
  return Math.round(totalInches * 2.54);
}

// ─────────────────────────────────────────────────────────────────────────────
// Master function — call this from CombinedOnboardingFlow
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePlan(stats: UserStats): NutritionPlan {
  // Convert imperial to metric if needed (unit flag not part of UserStats,
  // caller should convert before passing — keeps this file unit-agnostic)
  const bmr  = calculateBMR(stats.weight, stats.height, stats.age, stats.gender);
  const tdee = calculateTDEE(bmr, stats.activityLevel);

  const goalResult = calculateGoalCalories(
    tdee,
    stats.goal,
    stats.weight,
    stats.targetWeight,
    stats.weeks,
  );

  const macros = calculateMacros(goalResult.goalCalories, stats.weight);

  return {
    bmr,
    tdee,
    goalCalories:            goalResult.goalCalories,
    protein:                 macros.protein,
    carbs:                   macros.carbs,
    fat:                     macros.fat,
    dailyDelta:              goalResult.dailyDelta,
    weeklyWeightChange:      goalResult.weeklyWeightChange,
    estimatedWeeks:          goalResult.estimatedWeeks,
    warningCapped:           goalResult.warningCapped,
    warningExtendedTimeline: goalResult.warningExtendedTimeline,
    warningAggressiveGain:   goalResult.warningAggressiveGain,
    goal:                    stats.goal,
    targetWeight:            stats.targetWeight,
    inputWeeks:              stats.weeks,
  };
}
