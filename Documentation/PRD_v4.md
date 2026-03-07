# NutriTrack AI — Product Requirements Document (v4)
**Version:** 4.0 | **Date:** March 2026 | **Codename:** NutriTrack AI

---

## 1. Problem Statement

Indians eating home-cooked meals, street food, and restaurant food have no reliable way to track nutrition. Existing apps are built around Western foods and barcode databases. Manual logging is tedious, AI autologging is untrustworthy, and no app understands Indian portion language — "1 katori dal", "2 rotis", "aadha plate biryani".

NutriTrack AI solves this with three low-friction input methods: **photo**, **voice (Hinglish)**, and **nutrition label scan** — all backed by a deterministic, DB-powered nutrition engine. AI identifies food. The database provides nutrition. The user confirms portions. Nothing is ever hallucinated.

---

## 2. Target Users

**Primary:** Gym-goers and fitness-aware Indians (18–35) who find existing apps too slow, too Western, or too English.

**Secondary:** Students and working professionals who eat a mix of home food, canteen food, and street food and want a lightweight daily log.

**Not in v1:** Clinical dietitian workflows, children's nutrition, athletes with advanced micronutrient needs.

---

## 3. Target Scale & Cost

| Phase | DAU | API calls/day | Monthly cost |
|---|---|---|---|
| Launch | 50–200 | 100–400 | $0 |
| Growth | 200–500 | 400–800 | $0 |
| Scale trigger | 500+ sustained | 1,000+ | ~$15–35/mo |

**Free capacity with 4 Groq accounts + OpenRouter:**
- Vision (Llama 4 Scout): 4,000 calls/day — enough for ~3,000 DAU
- Whisper: 8,000 calls/day — essentially unlimited at launch scale
- Text LLM (Llama 3.1 8B): 57,600 calls/day — never an issue

---

## 4. Core User Flows

### Flow 1 — Photo Logging
FAB → Camera → Photo taken → `ScanningView` (Groq Vision via Edge Function) → step indicators: validate ✅ → identifying ⏳ → nutrition ⏳ → `MultiItemConfirmView` (detected foods + sliders) → `FinalResultsView` → Dashboard.

Timeout after 10s → `ErrorModal` (scanning) → Manual entry fallback.

### Flow 2 — Voice Logging (Hinglish)
FAB → `VoiceRecordView` → record 3–15s → stop → processing (Whisper + Llama) → transcript shown → Continue → `MultiItemConfirmView` (parsed foods + sliders) → `FinalResultsView` → Dashboard.

### Flow 3 — Nutrition Label Scan
FAB → `ScanLabelView` (camera with green frame overlay) → capture → `LabelResultView` (OCR extracted values, all editable, serving stepper) → Add to Meal → `FinalResultsView`.

Label values are ground truth — never overridden by USDA/IFCT.

### Flow 4 — Manual Entry
FAB → `SearchFoodView` → select food → `EditEntryView` (quantity/size stepper) → `FinalResultsView`.
Or: SearchFoodView → "Create Custom Food" → `CreateCustomFoodView` → `EditEntryView`.

### Flow 5 — History & Detail
History tab → day-grouped meal cards → tap meal → `MealDetailView` (macros, ingredients, edit/delete).
Dashboard → "View Details" → `DayDetailView` (full macro breakdown, meal type filter).

### Flow 6 — Onboarding
First launch → `CombinedOnboardingFlow` (4 steps):
1. **Profile** — name, age, gender, height, weight, units, activity level
2. **Goal** — lose/maintain/gain, target weight, timeline slider (4–52 weeks)
3. **Calculation** — animated screen; `calculatePlan()` from `lib/nutritionCalc.ts` runs here
4. **Plan Reveal** — shows goalCalories, protein, carbs, fat, BMR/TDEE reference; safety warning if deficit was capped → Dashboard.

Calculated plan saved to `profiles` table on "Start Tracking".

---

## 5. Feature List

### MVP (V1)

**Input methods (FAB → 4 options):**
- 📷 Camera — Groq Vision via Edge Function, multi-food detection
- 🎤 Voice — Whisper transcription + Llama parsing, Hinglish native
- 📄 Scan Label — On-device OCR (ML Kit), zero API calls
- ✏️ Manual — Full-text search across USDA + IFCT + custom foods

**Smart cache:**
- Pattern detection from last 30 meals
- Time-aware (±1.5 hours)
- Triggers for both photo and voice flows
- 3+ occurrence threshold
- Shown as suggestion — never auto-logs

**Nutrition database:**
1. IFCT (Indian Food Composition Tables) — pre-seeded in Supabase
2. USDA FoodData Central — pre-seeded in Supabase
3. OpenFoodFacts API — runtime fallback for packaged/branded foods
4. Custom foods — user-created

**Portion system:**
- Quantity model (rotis, samosas, eggs — stepper)
- Size model (small/medium/large toggle + quantity)
- Serving model (packaged food — count × per-serving)
- Smart Indian defaults: 1 katori dal (150ml), 1 cup rice (200g), 1 roti (45g)
- Sliders on `MultiItemConfirmView` for all AI-detected items

**Nutrition goal calculation (`lib/nutritionCalc.ts`):**
- BMR via Mifflin-St Jeor equation
- TDEE via activity multiplier (4 levels)
- Target-week aware daily deficit/surplus — not flat ±500 kcal
- Safety cap: max 1,000 kcal/day deficit, max 500 kcal/day surplus
- Timeline auto-extended + warning banner shown if cap is hit
- Protein: 2g × body weight kg (ISSN recommendation)
- Fat: 25% of goal calories; Carbs: remainder
- Imperial → metric conversion built in

**Confirmation gates:**
- Every input requires explicit user confirmation before saving
- No auto-logging under any circumstance, ever

**Screens:** Dashboard, History, DayDetail, MealDetail, Trends, Profile + full auth + onboarding

**Error handling:** `ErrorModal` (camera/network/scanning/generic), `InlineError`, `ErrorToast`, `EmptyState` variants, `SkeletonLoaders`

### Post-V1
- Barcode scanning
- Offline-first with background sync
- Micronutrient tracking
- Meal templates / quick-log favorites
- Push notifications
- Regional language support (Tamil, Telugu, Bengali)
- Premium subscription

---

## 6. UX Structure (from Figma)

```
App.tsx navigation (z-index layered modals):
  z-50   FAB overlay
  z-100  CameraView
  z-110  ScanningView
  z-120  EditEntryView
  z-130  AddIngredientView
  z-140  FinalResultsView
  z-150  SearchFoodView
  z-160  CreateCustomFoodView
  z-170  ScanLabelView
  z-175  LabelResultView
  z-180  VoiceRecordView
  z-185  MultiItemConfirmView
  z-190  DayDetailView
  z-200  MealDetailView

Bottom tabs: Home | History | Trends | Profile
```

**Flow routing via `currentFlow` state:** `"camera" | "voice" | "label" | "manual"`

All flows converge at `FinalResultsView`. Back-navigation is flow-aware.

---

## 7. Non-Goals (V1)
- No AI coaching or chatbot
- No barcode scanning
- No auto-logging without confirmation, ever
- No social features, streaks beyond indicator, badges, leaderboards
- No web app — mobile only
- No calorie burn / exercise tracking
- No custom backend — Supabase only
- No client-side API keys

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Activation (log 1 meal in session 1) | ≥60% |
| Day-7 retention | ≥40% |
| Photo detection confirmation rate | ≥80% (user confirms without changing food name) |
| Voice parse accuracy (Hinglish) | ≥80% correct items |
| Cache hit rate (after 2 weeks) | ≥35% |
| Manual fallback rate | <15% of logging attempts |
| API success rate (all providers combined) | ≥95% |
| Infrastructure cost at 500 DAU | $0 |

---

## 9. Constraints
- All API keys server-side only (Supabase Edge Function secrets)
- Label OCR must work fully offline
- Manual entry must work fully offline
- Camera requires internet only for Groq Vision call
- Voice requires internet for Whisper + Llama calls
- Must support Android API 26+ and iOS 14+
- App binary must not include bundled ML model (dropped TFLite)

---

*PRD v4 — NutriTrack AI. Updated: CombinedOnboardingFlow (4-step), lib/nutritionCalc.ts target-week aware calculation, body-weight protein formula.*
