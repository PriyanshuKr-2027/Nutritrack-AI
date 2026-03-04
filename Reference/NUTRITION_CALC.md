# NutriTrack AI — Nutrition Calculation Reference

**Version:** 1.0 | **Date:** March 2026  
**Covers:** `lib/nutritionCalc.ts`, `onboarding/CombinedOnboardingFlow.tsx`

---

## Overview

All nutrition calculations live in a single pure-function library (`lib/nutritionCalc.ts`).  
No UI. No side effects. No Supabase imports. Fully testable in isolation.

The onboarding flow (`CombinedOnboardingFlow.tsx`) collects user inputs across 4 steps and calls `calculatePlan()` once — during the animated calculation screen. The result (`NutritionPlan`) is passed to `onComplete()` in `App.tsx`, which is responsible for saving it to the `profiles` table.

---

## Onboarding Flow Structure

```
Step 1 — Profile        (QuickOnboardingFlow UI)
  Collects: name, age, gender, height, weight, unit, activityLevel

Step 2 — Goal           (QuickOnboardingFlow UI)
  Collects: goal, targetWeight, weeks (slider 4–52)

Step 3 — Calculation    (OnboardingFlow UI)
  Triggers: calculatePlan() runs here during 1.8s animation
  Nothing is faked — real math happens during the loading dots

Step 4 — Plan Reveal    (OnboardingFlow UI)
  Displays: goalCalories, protein, carbs, fat, BMR, TDEE
  Safety banners shown if warningCapped or warningAggressiveGain is true
  Buttons: "Start Tracking" → onComplete(plan) | "Adjust Plan" → back to Step 2
```

---

## Formula Reference

### Step 1 — BMR (Basal Metabolic Rate)

**Formula:** Mifflin-St Jeor (1990)  
**Why:** Most validated equation for general population. More accurate than Harris-Benedict for modern sedentary lifestyles.

```
Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
Female: BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
Other:  BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 78
              (midpoint of male/female offsets: average of +5 and -161)
```

---

### Step 2 — TDEE (Total Daily Energy Expenditure)

```
TDEE = BMR × activity_multiplier
```

| Activity Level | Label              | Multiplier | Use Case                    |
|----------------|--------------------|------------|-----------------------------|
| sedentary      | Sedentary          | 1.2        | Desk job, no exercise       |
| light          | Lightly Active     | 1.375      | Exercise 1–3 days/week      |
| moderate       | Moderately Active  | 1.55       | Exercise 3–5 days/week      |
| active         | Very Active        | 1.725      | Exercise 6–7 days/week      |

Note: "Very Active" (1.9) is intentionally excluded. The 1.725 level covers the vast majority of fitness-aware users (the app's target demographic). Athletes with training >2x/day are an edge case not prioritised in v1.

---

### Step 3 — Goal-Adjusted Calories (Target-Week Aware)

This is where the app differs from generic calculators that blindly apply ±500 kcal.

**Core calculation:**
```
totalKcalNeeded = |targetWeight - currentWeight| × 7,700
dailyDelta      = totalKcalNeeded ÷ (weeks × 7)
goalCalories    = TDEE − dailyDelta   (lose)
               or TDEE + dailyDelta   (gain)
```

**Why 7,700 kcal/kg?**  
1 kg of body weight ≈ 7,700 kcal. This is the accepted clinical approximation (actual value varies 7,000–8,000 based on body composition, but 7,700 is the standard used by NHS, WHO nutrition guidelines).

**Safety caps:**

| Goal | Cap              | Reason                                               |
|------|------------------|------------------------------------------------------|
| Lose | 1,000 kcal/day deficit | Medical consensus safety ceiling (~1 kg/week loss) |
| Gain | 500 kcal/day surplus   | Beyond this, additional calories become fat, not muscle |

**If cap is hit:**
1. `warningCapped = true`
2. `warningExtendedTimeline = true`
3. `estimatedWeeks` is recalculated: `ceil(totalKcalNeeded ÷ (cap × 7))`
4. User sees a warning banner in PlanRevealScreen explaining the extension

**If goal = "maintain":**  
`goalCalories = TDEE`. No delta. No warnings. Target weight and weeks are ignored.

---

### Step 4 — Macros

**Protein — body-weight based (not percentage)**
```
protein_g = 2 × body_weight_kg
```
**Why 2g/kg?** ISSN (International Society of Sports Nutrition) position stand for active individuals and those in caloric deficit. Preserves lean mass during weight loss. Generic apps use 15–30% of calories, which under-allocates protein for heavier users and over-allocates for lighter ones.

**Fat — percentage of goal calories**
```
fat_kcal = goalCalories × 0.25
fat_g    = fat_kcal ÷ 9
```
25% of calories from fat. Minimum for hormonal health (testosterone, cortisol regulation). Going below 20% is not recommended for active users.

**Carbs — remainder**
```
proteinKcal  = protein_g × 4
fatKcal      = fat_g × 9
remainingKcal = goalCalories − proteinKcal − fatKcal
carbs_g      = remainingKcal ÷ 4
```
Carbs fill whatever is left after protein and fat are allocated. This means carb % varies based on the user's body weight and goal — intentional, not a bug.

---

## Example Calculation

**User:** Male, 28 years, 75 kg, 175 cm, Moderately Active, Lose weight  
**Goal:** 68 kg in 12 weeks

```
BMR  = (10 × 75) + (6.25 × 175) − (5 × 28) + 5
     = 750 + 1093.75 − 140 + 5
     = 1708.75 → 1709 kcal

TDEE = 1709 × 1.55 = 2648.95 → 2649 kcal

totalKcalNeeded = |68 − 75| × 7700 = 7 × 7700 = 53,900 kcal
dailyDelta      = 53,900 ÷ (12 × 7) = 53,900 ÷ 84 = 641.7 kcal/day

641.7 < 1,000 (cap not hit) → no warning
goalCalories    = 2649 − 642 = 2007 kcal

protein = 2 × 75 = 150g    (600 kcal)
fat     = 2007 × 0.25 = 501.75 kcal → 55.8g → 56g
carbs   = (2007 − 600 − 502) ÷ 4 = 905 ÷ 4 = 226g

weeklyWeightChange = −(642 × 7 / 7700) = −0.58 kg/week
estimatedWeeks     = 12 (no cap, matches input)
```

**Result:** 2007 kcal | 150g protein | 226g carbs | 56g fat | −0.58 kg/week

---

## Example: Cap Hit

**User:** Female, 24 years, 80 kg, 165 cm, Light Active, Lose weight  
**Goal:** 60 kg in 8 weeks (aggressive)

```
BMR  = (10 × 80) + (6.25 × 165) − (5 × 24) − 161
     = 800 + 1031.25 − 120 − 161 = 1550.25 → 1550 kcal

TDEE = 1550 × 1.375 = 2131.25 → 2131 kcal

totalKcalNeeded = 20 × 7700 = 154,000 kcal
dailyDelta      = 154,000 ÷ 56 = 2750 kcal/day

2750 > 1,000 (CAP HIT) → warningCapped = true, warningExtendedTimeline = true
cappedDelta     = 1000 kcal/day
goalCalories    = 2131 − 1000 = 1131 kcal

estimatedWeeks  = ceil(154,000 / (1000 × 7)) = ceil(22) = 22 weeks
                  (user asked for 8, gets 22 — banner shown)

protein = 2 × 80 = 160g     (640 kcal)
fat     = 1131 × 0.25 = 282.75 kcal → 31.4g → 31g
carbs   = (1131 − 640 − 283) ÷ 4 = 208 ÷ 4 = 52g
```

**Result:** 1131 kcal | 160g protein | 52g carbs | 31g fat  
**Warning shown:** "Timeline adjusted for safety — extended to 22 weeks"

---

## Unit Conversion (Imperial → Metric)

All calculations run in metric. Conversion happens in `CombinedOnboardingFlow.tsx` before calling `calculatePlan()`. `nutritionCalc.ts` is unit-agnostic.

```
lbs → kg:  weight_kg = lbs × 0.453592
ft  → cm:  totalInches = floor(ft) × 12 + (ft % 1) × 10
           cm = totalInches × 2.54
```

Note on ft input: the app uses decimal feet (e.g. 5.7 = 5 feet 7 inches). The conversion treats the decimal part as inches directly, so 5.7 → (5 × 12) + 7 = 67 inches → 170.2 cm. This is unconventional but matches the placeholder in the UI. A future improvement would be a separate feet + inches input.

---

## What Gets Saved to Supabase

After `onComplete(plan)` fires in `App.tsx`, the following fields should be written to the `profiles` table:

```typescript
{
  calorie_goal:   plan.goalCalories,
  protein_goal_g: plan.protein,
  carbs_goal_g:   plan.carbs,
  fat_goal_g:     plan.fat,
  // Optional — for display in ProfileView
  bmr:            plan.bmr,
  tdee:           plan.tdee,
}
```

The full `NutritionPlan` object (including `dailyDelta`, `estimatedWeeks`, warnings) does not need to be persisted — it's only used during onboarding display. Goals can be recalculated at any time from the stored profile stats.

---

## Server-Side Audit (Future)

Currently, meal nutrition calculation (`weight_g / 100 × calories_per_100g`) runs on the client in `MultiItemConfirmView`. The result is saved to `meal_items.calories`.

When server-side audit is implemented:
1. Client sends `food_id`, `weight_g`, `food_source` to a Supabase RPC or Edge Function
2. Server looks up `calories_per_100g` from `ifct_foods` / `usda_foods`
3. Server calculates and returns `calories`, `protein_g`, `carbs_g`, `fat_g`
4. Client never trusts its own calculated calorie values — uses server response

This removes the possibility of client-side manipulation of calorie values. Track in backlog as `audit-meal-calc`.

---

## Files Changed in This Update

| File | Change |
|------|--------|
| `lib/nutritionCalc.ts` | **New** — all calculation logic |
| `onboarding/CombinedOnboardingFlow.tsx` | **New** — merged 4-step flow |
| `App.tsx` | **Updated** — imports `CombinedOnboardingFlow`, passes plan to `onComplete` |
| `onboarding/QuickOnboardingFlow.tsx` | Kept, now unused (safe to delete post-QA) |
| `onboarding/OnboardingFlow.tsx` | Kept, now unused (safe to delete post-QA) |

---

*NUTRITION_CALC.md v1.0 — NutriTrack AI*
