# NutriTrack AI — Technical Design Document (v3)
**Version:** 3.0 | **Date:** March 2026

---

## 1. Screen Inventory (from Figma)

All screens exist and are wired. This is ground truth from the codebase.

| Screen | Component | Triggered by |
|---|---|---|
| Dashboard | `DashboardView` | Bottom tab: Home |
| History | `HistoryView` | Bottom tab: History |
| Trends | `TrendsView` | Bottom tab: Trends |
| Profile | `ProfileView` | Bottom tab: Profile |
| Day Detail | `DayDetailView` | Dashboard "View Details" |
| Meal Detail | `MealDetailView` | History item tap |
| Camera | `CameraView` | FAB → Camera |
| Scanning | `ScanningView` | Camera capture |
| Multi-Item Confirm | `MultiItemConfirmView` | Scanning complete / Voice complete |
| Voice Record | `VoiceRecordView` | FAB → Mic |
| Scan Label | `ScanLabelView` | FAB → Scan Label |
| Label Result | `LabelResultView` | ScanLabel capture |
| Search Food | `SearchFoodView` | FAB → Manual / MultiItem "Add more" |
| Edit Entry | `EditEntryView` | Search select (single item) |
| Add Ingredient | `AddIngredientView` | EditEntry "Add ingredient" |
| Create Custom Food | `CreateCustomFoodView` | Search "Create custom" |
| Final Results | `FinalResultsView` | Any confirm flow |
| Login | `LoginView` | Auth gate |
| Sign Up | `SignUpView` | Login "Create account" |
| Forgot Password | `ForgotPasswordView` | Login "Forgot password" |
| Onboarding | `CombinedOnboardingFlow` | First launch |
| Error Modal | `ErrorModal` | Network/camera/scan failures |

---

## 2. Navigation Architecture

```typescript
// App.tsx state machine — currentFlow tracks which path user is on
type Flow = "camera" | "voice" | "label" | "manual" | null;

// Photo flow
Camera → Scanning → MultiItemConfirm → FinalResults → Dashboard

// Voice flow  
VoiceRecord → [processing] → MultiItemConfirm → FinalResults → Dashboard

// Label flow
ScanLabel → LabelResult → FinalResults → Dashboard

// Manual flow
SearchFood → EditEntry → [AddIngredient?] → FinalResults → Dashboard
         └→ CreateCustomFood → EditEntry → FinalResults → Dashboard

// Back navigation is flow-aware via currentFlow state
// MultiItemConfirm back:
//   camera/voice → close (go to dashboard)
//   manual → reopen SearchFood

// Timeout fallback (ScanningView onTimeout):
//   setShowScanning(false) → setShowSearchFood(true)
//   ErrorModal type="scanning" also shows onManualEntry
```

---

## 3. ScanningView — Real Implementation Notes

The Figma `ScanningView` already has:
- `capturedImage` prop → shows actual user photo (not placeholder)
- Step indicators: "Photo validated" ✅ → "Identifying foods..." ⏳ → "Looking up nutrition..." ⏳
- 10s timeout → `onTimeout()` → switches to manual entry
- Cancel button at bottom

**In real app:** Steps don't auto-advance on a timer. They advance when Edge Function responds:
```typescript
// Pseudocode for real implementation
const result = await detectFoodFromPhoto(imageUri);  // calls Edge Function
setStep('nutrition');   // advance step 3
const nutrition = await lookupNutrition(result.foods); // query Supabase
navigate('MultiItemConfirm', { items: nutrition });
```

---

## 4. MultiItemConfirmView — Key Behavior

From Figma code:
```typescript
interface FoodItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  calories: number;
  caloriesPerUnit: number;  // ← calories recalculate when quantity changes
  unit: string;
}

// Slider: range 1–10, step 1
// Calories update live: calories = caloriesPerUnit × quantity
// Total at top: sum of all items
// CTA: "Confirm Meal (521 kcal)"
// Disabled if items.length === 0
```

**Mapping from Edge Function response to FoodItem:**
```typescript
// Edge Function returns: { name: "Dal", portion: "1 katori (150ml)", confidence: 0.95 }
// App resolves:
//   1. Look up "dal" in ifct_foods → calories_per_100g: 110
//   2. Parse portion → weight_g: 150
//   3. caloriesPerUnit = (150/100) × 110 = 165
//   4. quantity = 1 (default)
//   5. calories = 165
```

---

## 5. VoiceRecordView — States

```
idle       → tap green mic button → recording
recording  → tap red stop button (or 15s auto-stop) → processing
processing → Whisper + Llama (1.5s) → complete
complete   → shows transcript in card → "Continue" → MultiItemConfirm
                                     → "Retry" → idle

In real app:
  recording: expo-av records m4a locally
  processing: send to food-detect Edge Function (mode: voice)
  complete: display real Whisper transcript
  Continue: navigate to MultiItemConfirm with parsed items
```

---

## 6. LabelResultView — OCR Integration

```
ScanLabelView captures image → rn-mlkit-ocr.recognizeText(uri) → raw text
→ regex parser:
  energy_kcal: /energy[:\s]+(\d+)\s*kcal/i
  protein_g:   /protein[:\s]+(\d+\.?\d*)\s*g/i
  carbs_g:     /carbohydrate[s]?[:\s]+(\d+\.?\d*)\s*g/i
  fat_g:       /fat[:\s]+(\d+\.?\d*)\s*g/i
  sodium_mg:   /sodium[:\s]+(\d+\.?\d*)\s*mg/i
  sugar_g:     /sugar[s]?[:\s]+(\d+\.?\d*)\s*g/i
  serving_size: /serving size[:\s]+(.+)/i

→ LabelResultView initialData populated with extracted values
→ Empty fields: blank string "" (editable by user)
→ calculateTotal(field): parseFloat(value) × servings

Rule: label values NEVER mixed with USDA/IFCT
```

---

## 7. Smart Cache Implementation

```typescript
// lib/mealCache.ts

// Sync: called on app open, syncs last 30 meals
async function syncMealPatterns(userId: string) {
  const meals = await supabase
    .from('meals')
    .select('*, meal_items(*, food_name, quantity, size, calories)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  // Group by food-name fingerprint
  // fingerprint = sorted food names joined: "chawal|dal|papad"
  // Track: frequency, typical hours, last nutrition
  // Filter: frequency >= 3
  // Store in AsyncStorage
}

// Check: called before Tier 3 (both photo and voice flows)
async function checkMealCache(): Promise<MealPattern | null> {
  const currentHour = new Date().getHours();
  const patterns = JSON.parse(await AsyncStorage.getItem('meal_patterns') ?? '[]');
  
  return patterns
    .filter(p => p.typical_hours.some(h => Math.abs(currentHour - h) <= 1.5))
    .sort((a, b) => b.frequency - a.frequency)[0] ?? null;
}
```

Cache hit → show overlay on `MultiItemConfirmView` with "Looks like your usual dinner?" dialog. User confirms → save cached items. User denies → proceed with AI detection.

---

## 8. Portion Defaults (Indian)

Used when AI returns food name — default weight assigned before user sees slider.

| Food | Default unit | Weight (g) | Cal/100g | Default cal |
|---|---|---|---|---|
| Dal | 1 katori | 150 | 110 | 165 |
| Chawal/Rice | 1 cup | 200 | 130 | 260 |
| Roti/Chapati | 1 piece | 45 | 300 | 135 |
| Paratha | 1 piece | 80 | 260 | 208 |
| Sabzi | 1 katori | 150 | 80 | 120 |
| Samosa | 1 piece | 85 | 265 | 225 |
| Idli | 2 pieces | 80 | 58 | 78 (×2) |
| Dosa | 1 piece | 80 | 168 | 134 |
| Biryani | 1 plate | 250 | 140 | 350 |
| Poha | 1 plate | 150 | 180 | 270 |
| Chai | 1 cup | 150 | 35 | 53 |
| Pakode | 4 pieces | 80 | 260 | 208 |
| Sambar | 1 katori | 150 | 45 | 68 |
| Raita | 1 katori | 100 | 62 | 62 |

---

## 9. Zustand Store Structure

```typescript
// stores/draftMealStore.ts
interface DraftMealStore {
  items: FoodItem[];        // from MultiItemConfirmView
  meal_type: MealType;
  source: Flow;
  provider: string | null;  // which Groq account / openrouter
  
  // Actions
  setItems, updateItem, removeItem, addItem;
  setMealType, setSource, setProvider;
  reset;
  
  // Computed
  totalCalories(): number;
  totalProtein(): number;
  totalCarbs(): number;
  totalFat(): number;
}

// stores/userStore.ts
interface UserStore {
  profile: Profile | null;
  goals: NutritionGoals;
  setProfile, setGoals;
}
```

---

## 10. Error Handling Matrix

| Scenario | Component shown | Recovery |
|---|---|---|
| Camera permission denied | `ErrorModal type="camera"` | "Open Settings" |
| Network unavailable | `ErrorModal type="network"` | Retry |
| Scanning failed / all providers down | `ErrorModal type="scanning"` | Retry or Manual Entry |
| ScanningView timeout (10s) | Inline timeout message → auto-redirect | Manual Entry |
| OCR field not extracted | Empty string in `LabelResultView` field | User types value |
| Voice transcript empty | Inline message in `VoiceRecordView` | Retry recording |
| Food not found in DB | Offer `CreateCustomFoodView` | User creates entry |
| Supabase save fails | `ErrorToast` | Retry save |

---

## 11. CombinedOnboardingFlow — Step Breakdown

Replaces both `QuickOnboardingFlow` and `OnboardingFlow`. 4 steps, single component file.

```
Step 1 — ProfileStep
  Component: inline in CombinedOnboardingFlow.tsx
  Collects:  name (optional), age, gender, height, weight, unit, activityLevel
  Advances:  on Continue — all fields stored in flat CollectedData state
  Validates: age + height + weight required; Continue disabled otherwise

Step 2 — GoalStep
  Component: inline in CombinedOnboardingFlow.tsx
  Collects:  goal (lose/maintain/gain), targetWeight, weeks (slider 4–52)
  Advances:  on "Calculate My Plan" — triggers Step 3
  Hides:     targetWeight + slider when goal = "maintain"
  Preview:   shows kg/week summary card when targetWeight is entered

Step 3 — CalculationStep
  Component: inline in CombinedOnboardingFlow.tsx
  Duration:  1,800ms minimum animation
  Triggers:  onComplete() callback → parent calls calculatePlan() → sets plan state
  UI:        3-dot pulsing animation + rotating loading messages (unchanged from FullFlow)
  NOTE:      calculatePlan() runs during this screen, not before it.
             Plan is available before Step 4 renders — no race condition.

Step 4 — PlanRevealStep
  Component: inline in CombinedOnboardingFlow.tsx
  Receives:  NutritionPlan from calculatePlan()
  Shows:     goalCalories (hero), protein/carbs/fat bars, macro % distribution bar
             BMR + TDEE reference block at bottom
             Safety warning banners (only if warningCapped or warningAggressiveGain = true)
  Buttons:   "Start Tracking" → onComplete(plan) → App.tsx saves to Supabase
             "Adjust Plan" → back to Step 2 (GoalStep)
```

**Back navigation:**
```
Step 2 → Step 1: back button in GoalStep header
Step 4 → Step 2: "Adjust Plan" button
Steps 3 → not navigable back (calculation in progress)
```

**Imperial conversion:**
Happens in `CombinedOnboardingFlow.handleCalculationComplete()` before calling `calculatePlan()`. `nutritionCalc.ts` is unit-agnostic — always receives metric.

---

## 12. nutritionCalc.ts — Data Flow

```
CombinedOnboardingFlow
  ↓ CollectedData (raw form values, may be imperial)
  ↓ handleCalculationComplete()
    → convert imperial → metric if unit === 'imperial'
    → calculatePlan(UserStats) from lib/nutritionCalc.ts
    → returns NutritionPlan
  ↓ setPlan(result)
  ↓ navigate to PlanRevealStep
  ↓ user taps "Start Tracking"
  ↓ onComplete(plan) in App.tsx
    → TODO: supabase.from('profiles').update({ calorie_goal, protein_goal_g, ... })
    → setShowOnboarding(false)
```

**NutritionPlan fields used at each stage:**

| Field | Used in | Purpose |
|---|---|---|
| `goalCalories` | PlanRevealStep, Dashboard | Hero number, CircularProgress max |
| `protein / carbs / fat` | PlanRevealStep, Dashboard | Macro bars |
| `bmr / tdee` | PlanRevealStep reference block | Educational context |
| `dailyDelta` | PlanRevealStep reference block | Shows actual deficit/surplus |
| `estimatedWeeks` | PlanRevealStep subtitle | "Reach X kg in ~N weeks" |
| `weeklyWeightChange` | PlanRevealStep subtitle | "−0.58 kg/week" |
| `warningCapped` | PlanRevealStep banner | Safety cap warning |
| `warningAggressiveGain` | PlanRevealStep banner | Surplus cap warning |
| `warningExtendedTimeline` | PlanRevealStep banner | Timeline extended notice |

**Reuse points (future):**
- Profile edit → recalculate on stat change → same `calculatePlan()` call
- Server-side audit → import same library → validate client-submitted meal calories

---

*TDD v3 — NutriTrack AI. Updated: CombinedOnboardingFlow in screen inventory, new Section 11 (4-step breakdown), new Section 12 (nutritionCalc data flow).*
