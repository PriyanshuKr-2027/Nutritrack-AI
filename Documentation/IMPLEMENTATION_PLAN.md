# NutriTrack AI — Implementation Plan

**Version:** 1.0 | **Date:** March 2026

This document is the step-by-step build guide. Each module has: what to build, exact prompts to use with your AI coding assistant (Cursor/Windsurf), acceptance criteria, and dependencies.

---

## Prerequisites

Before starting any module:

```bash
# 1. Create Expo project
npx create-expo-app NutriTrackAI --template blank-typescript
cd NutriTrackAI

# 2. Install core dependencies
npx expo install expo-camera expo-av expo-image-manipulator expo-file-system expo-secure-store
npm install @supabase/supabase-js @tanstack/react-query zustand
npm install @react-native-async-storage/async-storage
npm install rn-mlkit-ocr

# 3. Create Supabase project at supabase.com
# 4. Copy URL + anon key to .env:
#    EXPO_PUBLIC_SUPABASE_URL=...
#    EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# 5. Get API keys:
#    Groq ×4: console.groq.com (4 different emails)
#    OpenRouter ×1: openrouter.ai
```

---

## Module 0 — Figma UI to React Native

**What:** Convert the Figma web components (React + Tailwind) to React Native components.

**Dependency:** Nothing. Do this first — it gives you all screens in RN.

**Prompt for Cursor:**

```
I have a React web app built with Tailwind CSS that serves as my UI design reference.
I need to convert each component to React Native using NativeWind (Tailwind for RN).

Convert [ComponentName].tsx from web React to React Native:
- Replace div → View, p/span → Text, img → Image, button → Pressable
- Keep all Tailwind classes (NativeWind supports most of them)
- Replace motion/react animations → react-native-reanimated equivalents
- Replace lucide-react icons → @expo/vector-icons equivalents
- Remove all web-specific classes: fixed, inset-0 → use StyleSheet.absoluteFillObject
- Keep all props, state, and logic identical

Reference file: [paste component code]
```

**Convert in this order:**

1. `BottomNav` (no deps)
2. `DashboardView` (needs BottomNav)
3. `FinalResultsView` (no deps — needed by all flows)
4. `MultiItemConfirmView`
5. `VoiceRecordView`
6. `LabelResultView`
7. `ScanningView`
8. `CameraView`
9. `ScanLabelView`
10. `SearchFoodView`, `EditEntryView`, `CreateCustomFoodView`
11. `HistoryView`, `MealDetailView`, `DayDetailView`
12. `TrendsView`, `ProfileView`
13. Auth screens (Login, SignUp, ForgotPassword)
14. `CombinedOnboardingFlow` (use this — do NOT convert `QuickOnboardingFlow` or `OnboardingFlow`, both are replaced)

**Acceptance criteria:** Each screen renders on device, all buttons are tappable, animations are smooth.

---

## Module 1 — Supabase Setup

**What:** Database schema, RLS, auth, Edge Function skeleton.

**Prompt:**

```
Set up a Supabase project for NutriTrack AI, a food logging app.

Run these migrations in order:

1. profiles table (extends auth.users)
2. ifct_foods table (Indian Food Composition Tables, pre-seed later)
3. usda_foods table (USDA FoodData Central, pre-seed later)
4. custom_foods table (user-created foods)
5. meals table (with detection_source column)
6. meal_items table
7. label_nutrients table
8. api_daily_usage table + increment_api_usage RPC function

Enable RLS on profiles, meals, meal_items, custom_foods.
Create policies: users can only read/write their own data.
ifct_foods and usda_foods are read-only for all authenticated users.

[paste full schema from TRD_v5.md Section 10 — includes expanded profiles table with bmr, tdee, weight_kg, height_cm, age, gender, activity_level, goal, target_weight_kg, goal_weeks columns]
```

**After schema:**

```
Create a Supabase client in lib/supabase.ts:
- Use expo-secure-store as the auth storage adapter
- autoRefreshToken: true, persistSession: true
- Export typed supabase client
- Include a useSession hook that returns current user
```

**Acceptance criteria:** Tables created, RLS active, test insert via dashboard fails without auth.

---

## Module 2 — Authentication

**What:** Login, signup, forgot password screens wired to Supabase Auth.

**Prompt:**

```
Wire up Supabase Auth to these React Native screens: LoginView, SignUpView, ForgotPasswordView.

Requirements:
- Email + password auth only (no OAuth, no magic links)
- On signup: create profile row via trigger (already in DB)
- On login success: navigate to Onboarding (if first time) or Dashboard
- Persist session via expo-secure-store (already configured in supabase.ts)
- Show loading state during auth calls
- Show inline error messages (not alerts)
- "Forgot password" sends reset email via supabase.auth.resetPasswordForEmail

Use the existing screen components — just add the auth logic.
```

**Acceptance criteria:** Can create account, log in, log out, reset password email arrives.

---

## Module 3 — Onboarding + User Goals

**What:** 4-step `CombinedOnboardingFlow` wired to `lib/nutritionCalc.ts`, saving results to `profiles` table.

**Dependencies:** Module 1 (Supabase schema with expanded profiles table), Module 2 (Auth — need user.id to save)

**Step 1 — Create `lib/nutritionCalc.ts`:**

```
This file already exists in the Figma reference export.
Copy it to your RN project as-is. It has zero dependencies.
Exports: calculateBMR, calculateTDEE, calculateGoalCalories,
         calculateMacros, calculatePlan, lbsToKg, ftToCm
```

**Step 2 — Convert `CombinedOnboardingFlow` to React Native:**

```
Prompt for Cursor:

Convert CombinedOnboardingFlow.tsx from web React to React Native.
The file has 4 inline step components: ProfileStep, GoalStep, CalculationStep, PlanRevealStep.
Standard RN conversions apply (div→View, etc).

Critical: do NOT change any logic. The calculatePlan() import, the
handleCalculationComplete() conversion logic, and all NutritionPlan
field references must stay exactly as-is.

The lib/nutritionCalc.ts import path will be: '../lib/nutritionCalc'
```

**Step 3 — Wire `onComplete` in App.tsx:**

```typescript
// App.tsx — replace showOnboarding block:
<CombinedOnboardingFlow
  onComplete={async (plan: NutritionPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({
      calorie_goal:      plan.goalCalories,
      protein_goal_g:    plan.protein,
      carbs_goal_g:      plan.carbs,
      fat_goal_g:        plan.fat,
      bmr:               plan.bmr,
      tdee:              plan.tdee,
      // Store raw stats for Profile edit recalculation
      weight_kg:         weightKg,   // from plan context
      height_cm:         heightCm,
      age:               age,
      gender:            gender,
      activity_level:    activityLevel,
      goal:              plan.goal,
      target_weight_kg:  plan.targetWeight,
      goal_weeks:        plan.inputWeeks,
    }).eq('id', user.id);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
  }}
/>
```

**Formula reference (do NOT change these — already correct in nutritionCalc.ts):**

```
BMR (Mifflin-St Jeor):
  Male:   10×weight + 6.25×height − 5×age + 5
  Female: 10×weight + 6.25×height − 5×age − 161
  Other:  10×weight + 6.25×height − 5×age − 78

TDEE = BMR × activity_multiplier
  sedentary=1.2 | light=1.375 | moderate=1.55 | active=1.725
  (No 1.9 level — "active" at 1.725 is the maximum)

Goal calories (target-week aware — NOT flat ±500):
  dailyDelta = (weightDiff × 7700) / (weeks × 7)
  Safety cap: max 1000 kcal deficit, max 500 kcal surplus
  If cap hit: estimatedWeeks recalculated, warning flags set to true

Macros:
  protein_g = 2 × body_weight_kg           ← body-weight based, NOT % of calories
  fat_g     = (goalCalories × 0.25) / 9
  carbs_g   = remaining / 4
```

**Acceptance criteria:**
- Complete flow saves correct values to profiles table
- PlanRevealScreen shows real calculated numbers (not hardcoded)
- Safety warning banner appears when deficit > 1000 kcal/day
- "Adjust Plan" returns to Goal step with inputs preserved
- Re-opening app skips onboarding (AsyncStorage flag checked)
- Imperial input (lbs/ft) correctly converts before calculation

---

## Module 4 — Food Database Seeding

**What:** Seed IFCT and USDA data into Supabase tables.

**Prompt:**

```
Seed the NutriTrack AI food database.

Step 1 — USDA:
Download the USDA FoodData Central Foundation Foods JSON from:
https://fdc.nal.usda.gov/download-data.html

Write a Node.js script that:
- Reads the JSON file
- Extracts: description (name), Energy (kcal), Protein (g), Carbohydrate (g), Total lipid/fat (g)
- Inserts in batches of 500 into usda_foods table via Supabase service role key
- Target: ~5,000 most common foods

Step 2 — IFCT:
The IFCT dataset has 528 Indian foods. Create a seed file with at minimum these entries
with accurate per-100g values from the IFCT 2017 publication:
dal (various), chawal, roti, paratha, samosa, idli, dosa, poha, upma, biryani,
chole, rajma, palak paneer, paneer tikka, sambar, rasam, khichdi, pav bhaji,
vada, medu vada, uttapam, appam, puttu, dhokla, thepla, bajra roti, jowar roti

Insert into ifct_foods table.
```

**Acceptance criteria:** SearchFoodView finds "dal", "samosa", "biryani". Results show accurate nutrition values.

---

## Module 5 — Food Search + Manual Entry

**What:** SearchFoodView wired to DB, EditEntryView saves to meals.

**Prompt:**

```
Implement food search and manual entry for NutriTrack AI.

SearchFoodView:
- Query input → search ifct_foods first, then usda_foods using tsvector full-text search
- Show results with food name + estimated calories per standard serving
- If no results: show "Create custom food" option
- Recent searches stored in AsyncStorage, shown when input is empty
- Debounce search: 300ms

EditEntryView:
- Receives selected FoodItemData (name, nutrition per 100g, portion model)
- Quantity model: stepper (+/-) with piece count
- Size model: Small/Medium/Large toggle + quantity stepper
- Advanced: manual gram input (overrides size/quantity)
- Live calorie calculation: (weight_g / 100) × calories_per_100g
- Meal type selector: Breakfast/Lunch/Dinner/Snack
- Save → insert into meals + meal_items tables

CreateCustomFoodView:
- Fields: name, calories per 100g, protein, carbs, fat
- Save → insert into custom_foods table
- Navigate to EditEntryView with the new food
```

**Acceptance criteria:** Search finds Indian foods, calories update live, meal saves and appears on Dashboard.

---

## Module 6 — Edge Function: food-detect

**What:** Deploy the Supabase Edge Function that handles photo + voice AI calls with true round-robin routing.

**Prompt:**

```
Create a Supabase Edge Function called food-detect that handles two modes.

File: supabase/functions/food-detect/index.ts

Requirements:

1. Auth: reject requests without valid Supabase JWT

2. Photo mode ({ mode: 'photo', imageBase64: string }):

   ROUTING — True round-robin with error + budget threshold failover:
   - Keep an in-memory currentProviderIndex (module-level let, resets on cold start)
   - On each request: start at currentProviderIndex, advance it immediately (before calling)
   - If provider's daily call_count >= 800: skip, try next
   - If provider call returns 429 or any error: skip, try next (do NOT increment usage)
   - If provider succeeds: increment api_daily_usage via RPC, return result
   - If all 5 providers fail/exhausted: return { tier: 'manual', reason: 'all_providers_exhausted' }

   PROVIDERS (in order):
   groq_1(800) → groq_2(800) → groq_3(800) → groq_4(800) → openrouter(180)

   - Call selected provider's vision API with Indian food detection prompt
   - Return: { tier: 'api', provider, foods: DetectedFood[], meal_type }

3. Voice mode ({ mode: 'voice', audioBase64: string, mimeType: string }):
   - Call Groq Whisper with language='hi' (Hindi handles Hinglish better)
   - Parse transcript with Groq Llama 3.1 8B using Hinglish food parser prompt
   - Return: { transcript, items: VoiceItem[] }

4. Secrets: GROQ_KEY_1, GROQ_KEY_2, GROQ_KEY_3, GROQ_KEY_4, OPENROUTER_KEY

Vision prompt: [paste from ai_prompts.md VISION PROMPT section]
Voice prompt: [paste from ai_prompts.md VOICE SYSTEM PROMPT section]

DetectedFood: { name: string, portion: string, confidence: number, category: string }
NO estimated_calories in response — nutrition comes from DB.
```

**Deploy:**

```bash
supabase secrets set GROQ_KEY_1=gsk_xxxx
supabase secrets set GROQ_KEY_2=gsk_xxxx
supabase secrets set GROQ_KEY_3=gsk_xxxx
supabase secrets set GROQ_KEY_4=gsk_xxxx
supabase secrets set OPENROUTER_KEY=sk-or-xxxx
supabase functions deploy food-detect
```

**Step 2 — Daily Reset for `api_daily_usage` (add inside Edge Function):**

Without this, call counts grow forever and all providers get permanently blocked after day 1.

```typescript
// Add a `date` column to api_daily_usage table:
// ALTER TABLE api_daily_usage ADD COLUMN date DATE DEFAULT CURRENT_DATE;

// Call this at the top of every food-detect invocation, before routing:
async function resetDailyUsageIfNeeded(supabase: SupabaseClient) {
  const today = new Date().toISOString().split('T')[0]; // "2026-03-04"

  const { data } = await supabase
    .from('api_daily_usage')
    .select('date')
    .limit(1)
    .maybeSingle();

  if (!data || data.date !== today) {
    // New day — reset all provider counts
    await supabase.from('api_daily_usage').upsert([
      { provider_id: 'groq_1',     call_count: 0, date: today },
      { provider_id: 'groq_2',     call_count: 0, date: today },
      { provider_id: 'groq_3',     call_count: 0, date: today },
      { provider_id: 'groq_4',     call_count: 0, date: today },
      { provider_id: 'openrouter', call_count: 0, date: today },
    ], { onConflict: 'provider_id' });
  }
}
```

Intentionally simple — no pg_cron needed. The first request after midnight on a warm function resets everything. On cold start it always resets. Worst case: one extra reset on midnight boundary — harmless.

**Acceptance criteria:** POST with valid JWT + test image returns detected food names. POST without JWT returns 401. Second day after deployment: call counts reset to 0 (verify in Supabase dashboard).

---

## Module 7 — Photo Detection Flow

**What:** Camera → ScanningView → MultiItemConfirmView → FinalResultsView wired end-to-end.

**Prompt:**

```
Wire up the photo detection flow for NutriTrack AI.

lib/foodDetect.ts:
  async function detectFoodFromPhoto(imageUri: string):
    1. Validate: check file size (50KB-10MB), resolution (≥300×300)
    2. Compress: expo-image-manipulator resize to 1024px max, 80% JPEG quality
    3. Convert to base64: expo-file-system readAsStringAsync
    4. Call: supabase.functions.invoke('food-detect', { body: { mode: 'photo', imageBase64 } })
    5. Return result or { tier: 'manual', reason } on failure

lib/nutritionLookup.ts:
  async function lookupNutrition(foods: DetectedFood[]): Promise<FoodItem[]>:
    For each food name:
      1. Search ifct_foods by name similarity
      2. If not found: search usda_foods
      3. Apply portion default from INDIAN_PORTION_DEFAULTS
      4. Calculate: caloriesPerUnit = (defaultWeight / 100) × calories_per_100g
      5. Return FoodItem for MultiItemConfirmView

CameraView → ScanningView:
  - Pass capturedImage URI to ScanningView
  - ScanningView shows captured photo in circular pulsing container
  - Steps advance as detectFoodFromPhoto + lookupNutrition complete
  - On timeout (10s): call onTimeout() → navigate to SearchFood

ScanningView → MultiItemConfirmView:
  - Pass populated FoodItem[] array
  - Pass capturedImage for header preview

MultiItemConfirmView → FinalResultsView:
  - Save confirmed items to meals + meal_items tables
  - Navigate to FinalResultsView with summary data
  - Then Dashboard on "Done"
```

**Acceptance criteria:** Take photo of Indian food → 2-3 items detected → sliders shown → save → appears on Dashboard with correct calories.

---

## Module 8 — Voice Logging Flow

**What:** VoiceRecordView → Edge Function → MultiItemConfirmView wired end-to-end.

**Prompt:**

```
Wire up the voice logging flow for NutriTrack AI.

lib/voiceRecorder.ts:
  - startRecording(): request mic permission, expo-av Audio.Recording
  - stopRecording(): stop, return local URI of m4a file
  - Auto-stop after 15 seconds

lib/foodDetect.ts (add):
  async function detectFoodFromVoice(audioUri: string):
    1. Read as base64 via expo-file-system
    2. Call: supabase.functions.invoke('food-detect', { body: { mode: 'voice', audioBase64, mimeType: 'audio/m4a' } })
    3. Return { transcript, items } or error

VoiceRecordView wiring:
  - idle → tap green mic → call startRecording()
  - recording → tap red stop → call stopRecording() → setState('processing')
  - processing → call detectFoodFromVoice() → show real Whisper transcript
  - complete → "Continue" → navigate to MultiItemConfirmView with:
      lookupNutrition(parsedItems) result

Hinglish examples to test:
  "dal chawal khaya"
  "aaj lunch mein 2 roti aur sabzi thi"
  "ek samosa aur chai"
  "biryani khaya half plate"
```

**Acceptance criteria:** Record Hinglish → transcript shown → foods parsed → MultiItemConfirmView populated with correct items.

---

## Module 9 — Label Scan Flow

**What:** ScanLabelView → rn-mlkit-ocr → LabelResultView → FinalResultsView.

**Prompt:**

```
Wire up the nutrition label scan flow for NutriTrack AI.

lib/ocrParser.ts:
  function parseNutritionLabel(rawText: string): Partial<LabelData>:
    Extract with regex (case insensitive):
    - energy_kcal: /energy[:\s]+(\d+)\s*kcal/i  (also handle kJ → ÷4.184)
    - protein_g: /protein[:\s]+(\d+\.?\d*)\s*g/i
    - carbs_g: /carbohydrate[s]?[:\s]+(\d+\.?\d*)\s*g/i  (also "total carb")
    - fat_g: /(?:total\s+)?fat[:\s]+(\d+\.?\d*)\s*g/i
    - sodium_mg: /sodium[:\s]+(\d+\.?\d*)\s*mg/i
    - sugar_g: /sugar[s]?[:\s]+(\d+\.?\d*)\s*g/i
    - serving_size: /serving size[:\s]+(.+?)(?:\n|$)/i
    Missing fields return "" (empty string, user can fill in)

ScanLabelView:
  - On capture: call rn-mlkit-ocr.recognizeText(imageUri)
  - Call parseNutritionLabel(rawText)
  - Navigate to LabelResultView with extracted data + imageUri

LabelResultView:
  - All fields pre-filled from OCR, all editable
  - Serving stepper: 1–10 (integer + allow 0.5 via long-press)
  - calculateTotal: parseFloat(field) × servings (live, updates as user types)
  - On confirm: save to meals table (source='label') + meal_items + label_nutrients
  - Navigate to FinalResultsView

RULE: label values are NEVER mixed with or replaced by IFCT/USDA values.
```

**Acceptance criteria:** Point at Maggi packet label → calories/protein/carbs/fat extracted → serving count adjusts totals live → saves correctly.

---

## Module 10 — Meal Cache

**What:** Smart meal pattern detection and cache-confirm overlay.

**Prompt:**

```
Implement the smart meal cache for NutriTrack AI.

lib/mealCache.ts:

syncMealPatterns(userId):
  - Fetch last 30 meals with meal_items and food_name
  - Group by food fingerprint: sort food names alphabetically, join with "|"
  - For each group: track frequency, array of logged hours, last nutrition totals
  - Filter: keep only patterns with frequency >= 3
  - Store in AsyncStorage key 'meal_patterns'
  - Call on app open (after auth) and after each meal save

checkMealCache():
  - Read patterns from AsyncStorage
  - currentHour = new Date().getHours()
  - Match: pattern where any typical_hour is within ±1.5 hours of currentHour
  - Return highest-frequency match, or null

Cache confirm overlay:
  - Add to MultiItemConfirmView: if cacheMatch prop provided, show overlay card:
    "Looks like your usual [meal_type]!"
    List: food1, food2, food3
    Total: XXX kcal
    Buttons: "Yes, save this!" | "Not quite →"
  - "Yes, save this!" → use cached items, skip current AI items, save immediately
  - "Not quite →" → dismiss overlay, show AI-detected items on sliders

Trigger cache check:
  - After ScanningView complete (before showing MultiItemConfirmView)
  - After VoiceRecordView complete (before showing MultiItemConfirmView)
```

**Acceptance criteria:** Log Dal+Rice+Papad for dinner 3 times → 4th time at dinner hour → cache overlay appears with correct items.

---

## Module 11 — Dashboard + History

**What:** Dashboard shows real data. History is queryable.

**Prompt:**

```
Wire Dashboard and History to real Supabase data for NutriTrack AI.

DashboardView:
  - useQuery: fetch today's meals for current user
  - Sum total_calories, total_protein_g, total_carbs_g, total_fat_g
  - Show vs profile goals
  - CircularProgress: value=totalCalories, max=calorie_goal
  - Macro bars: actual/goal for protein, carbs, fat
  - Meal list: today's meals sorted by created_at
  - Show SkeletonLoaders while loading
  - Show NoMealsEmptyState if no meals today

HistoryView:
  - Paginated query: meals grouped by logged_at, last 30 days
  - Day cards: date header + meal list + total calories
  - Pull-to-refresh
  - Tap meal → MealDetailView with full macro + ingredients

MealDetailView:
  - Show meal_items with food names and amounts
  - Macro breakdown bars
  - Edit → navigate to EditEntryView with pre-filled data
  - Delete → confirm dialog → delete meal + items → navigate back

DayDetailView:
  - Full day breakdown: calories, protein, carbs, fat vs goals
  - Meal type tabs: All/Breakfast/Lunch/Dinner/Snack
  - Horizontal day swipe → adjacent days
```

**Acceptance criteria:** After logging a meal, Dashboard updates. History shows last 7 days. Meal detail shows correct macros.

---

## Module 12 — Profile + Settings

**What:** Profile screen with user goals, edit capability.

**Prompt:**

```
Implement the Profile screen for NutriTrack AI.

ProfileView:
  - Show: name, calorie goal, macro goals (protein/carbs/fat), BMR, TDEE
  - Fetch from profiles table on mount
  - Edit button → inline editing for each stat field (weight, height, age, activity level, goal)
  - Recalculate goals → call calculatePlan() from lib/nutritionCalc.ts with updated stats
    (same function used in CombinedOnboardingFlow — do NOT reimplement the formula inline)
  - Save → update profiles table with new goals AND updated raw stats
  - Sign out → supabase.auth.signOut() → navigate to Login

Stats grid:
  - Days logged (count distinct logged_at from meals)
  - Total meals logged (count from meals)
  - Average daily calories (last 7 days)
  - Current streak (consecutive days with ≥1 meal)
```

---

## Module 13 — Error Handling + Polish

**What:** Wire all error states, add loading skeletons, final polish.

**Prompt:**

```
Add production error handling to NutriTrack AI.

1. Wrap all network calls in try/catch, show appropriate ErrorModal:
   - Camera permission denied → type='camera'
   - No internet → type='network'
   - Edge Function error / all providers failed → type='scanning'
   - Generic unexpected error → type='generic'

2. Add SkeletonLoaders:
   - DashboardView: show DashboardStatSkeleton + MealCardSkeleton while loading
   - HistoryView: show HistoryDaySkeleton while loading
   - SearchFoodView: show skeleton rows while searching

3. ErrorToast for non-blocking errors:
   - Failed to save meal → retry option
   - Cache sync failed → silent retry in background

4. Offline detection:
   - @react-native-community/netinfo
   - If offline: disable Camera/Voice buttons, show tooltip "Needs internet"
   - Manual entry and label scan always work offline
```

---

## Module 14 — Testing

**What:** Core flow tests before release.

**Test checklist:**

```
Photo flow:
  □ Valid photo → Groq detects 2+ foods → sliders shown → save → Dashboard updates
  □ Poor quality photo → validation error shown
  □ All providers exhausted → manual entry shown (test by setting budgets to 9999)
  □ 10s timeout → manual entry redirect

Voice flow:
  □ "dal chawal khaya" → dal + chawal detected
  □ "aaj lunch mein 2 roti aur sabzi" → roti×2 + sabzi detected
  □ "ek samosa aur chai" → samosa + chai detected
  □ Mic permission denied → error handled
  □ Empty recording → friendly retry message

Label scan:
  □ Maggi noodles packet → calories/protein/carbs/fat extracted
  □ Parle-G packet → values extracted
  □ Serving ×2 → all totals double correctly
  □ Missing field → blank, user can type

Cache:
  □ Log Dal+Rice×3 at 8pm → 4th logging at 8pm → cache overlay appears
  □ "Not quite" → cache dismissed, AI items shown
  □ "Yes, save this!" → cached meal saved

Manual:
  □ Search "samosa" → IFCT result found with correct nutrition
  □ Search "xyz123" → no results → create custom food option shown
  □ Custom food created → appears in future searches

Security:
  □ API keys not visible in app binary (check with apktool)
  □ Supabase anon key visible but harmless (RLS blocks cross-user access)
```

---

## Build Order Summary

```
Week 1:  Module 0 (RN conversion) + Module 1 (Supabase setup) + Module 2 (Auth)
Week 2:  Module 3 (Onboarding) + Module 4 (DB seed) + Module 5 (Manual entry)
Week 3:  Module 6 (Edge Function) + Module 7 (Photo flow)
Week 4:  Module 8 (Voice) + Module 9 (Label scan) + Module 10 (Cache)
Week 5:  Module 11 (Dashboard/History) + Module 12 (Profile)
Week 6:  Module 13 (Error handling) + Module 14 (Testing) + App Store prep
```

---

_Implementation Plan v2.1 — NutriTrack AI. v2.0: Module 0 (CombinedOnboardingFlow), Module 3 (4-step + nutritionCalc.ts), Module 6 (true round-robin). v2.1: Module 1 (TRD_v5 schema ref), Module 6 (daily reset mechanism for api_daily_usage), Module 12 (calculatePlan() reuse for profile recalculation). 14 modules, 6 weeks, solo developer pace._
