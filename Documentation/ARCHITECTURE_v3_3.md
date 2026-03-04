# NutriTrack AI — Architecture Decision Document (v4)
**Date:** March 2026 | Supersedes: v3.3

---

## Decision Log

### ADR-001: Multi-Account Groq Instead of Single Account

**Decision:** Use 4 Groq accounts + OpenRouter as backup.

**Context:** Groq free tier = 1,000 vision calls/day per account. At 500 DAU with 50% cache hit, need ~750 vision calls/day. Single account works at launch, but provides no buffer.

**Chosen:** 4 accounts × 1,000 = 4,000/day + OpenRouter 200 = 4,200/day total.
- Covers ~3,000 DAU on $0
- ToS risk accepted by team — manageable at launch scale
- If terminated: upgrade Groq to paid (~$15/month at 500 DAU)

**Routing:** True round-robin with error + budget threshold failover, tracked in `api_daily_usage` Supabase table.

**Round-robin behavior (updated from v3.3):**
- A persistent `currentProviderIndex` rotates across all 5 providers on every request — not sequential "fill groq_1 first"
- **Failover triggers on either condition:**
  1. Provider returns a 429 (rate limit) or any non-200 error
  2. Provider's `call_count` for today reaches **800** (not 950 — leaves buffer below the 1,000 hard limit)
- On failover: increment index, try next provider transparently, log the skip
- If all 5 providers are exhausted or errored: return `{ tier: 'manual' }` to client
- `currentProviderIndex` is stored in the Edge Function's in-memory state (resets on cold start — acceptable, doesn't affect correctness)

---

### ADR-002: All API Keys in Edge Function Secrets

**Decision:** Zero API keys in app binary. All in Supabase Edge Function secrets.

**Context:** `EXPO_PUBLIC_` env vars are bundled in APK/IPA. APK decompilation takes 30 seconds. Any key in the binary is public.

**Chosen:** Single `food-detect` Edge Function holds all keys. Client sends base64 image/audio → Edge Function calls providers → returns food names. Client never sees keys.

**Safe in app binary:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` — these are public by Supabase design. RLS enforces data access, not the anon key.

---

### ADR-003: Nutrition from DB, Never from AI

**Decision:** Vision AI returns food names only. Calories/macros always from IFCT/USDA database.

**Context:** Vision models cannot accurately estimate portion weight from 2D photos. "Dal 165 kcal" from AI is a plausible-sounding hallucination. Users make health decisions from this data.

**Chosen:** AI → food names → DB lookup → per_100g values → user confirms portion weight → deterministic calculation.

`estimated_calories` field removed from all vision prompts and response schemas.

---

### ADR-004: IFCT Priority Over USDA for Indian Foods

**Decision:** IFCT (Indian Food Composition Tables) is checked before USDA.

**Context:** USDA has poor coverage for Indian preparations. "Dal makhani" in USDA returns no result or a generic approximation. IFCT has 528 Indian-specific food entries with accurate values.

**Chosen:** Lookup order: IFCT → USDA → OpenFoodFacts API → custom_foods → CreateCustomFood.

IFCT source: https://www.nin.res.in/ifct/ — seed once, free forever.

---

### ADR-005: Label Scan is Zero-API-Call

**Decision:** Nutrition label scan uses on-device OCR only (`rn-mlkit-ocr`).

**Context:** Packaged food labels contain exact nutrition data. There is no benefit to sending the image to a vision AI — the label IS the ground truth. ML Kit OCR is accurate on printed text.

**Chosen:** Camera → `rn-mlkit-ocr` on-device → regex extraction → `LabelResultView` (editable fields) → user confirms → save.

Label values stored in `label_nutrients` table. Never mixed with or replaced by IFCT/USDA values.

---

### ADR-006: Cache is a Suggestion, Not an Interception

**Decision:** Meal cache shows as a confirmation overlay, not an automatic pre-API shortcut.

**Context:** Original v3.2 proposed triggering cache before sending image to API, based on time-of-day pattern matching. Problem: cache doesn't analyze the photo. User could photograph pizza at 8pm and get "Dal + Rice?" because that's their dinner pattern.

**Chosen:** Cache check runs in parallel. If pattern matches current time: show "Looks like your usual dinner?" overlay on `MultiItemConfirmView`. User confirms → save. User denies → proceed with AI-detected items. Photo always gets scanned.

---

### ADR-007: Dropped TFLite On-Device Classifier

**Decision:** Removed bundled TFLite MobileNetV2 model.

**Context:** On-device model was 17MB, required retraining on Indian food dataset before launch, had 70-80% accuracy, couldn't handle multi-food thali plates.

**Chosen:** Groq Llama 4 Scout Vision via Edge Function. Better accuracy (85-95% food ID), handles thali plates, no retraining required, no app size overhead. Minor trade-off: requires internet for photo detection.

---

### ADR-008: Whisper in Hindi Mode for Hinglish

**Decision:** Groq Whisper called with `language=hi` (Hindi) not `language=en`.

**Context:** Hinglish is a mix of Hindi and English. Testing showed Hindi mode handles mixed-language speech better than English mode — English words in Hindi speech are transcribed correctly, while Hindi words in English mode are often dropped or mistranscribed.

---

### ADR-009: Single Edge Function for Photo + Voice

**Decision:** One `food-detect` Edge Function handles both modes via `mode: 'photo' | 'voice'` parameter.

**Context:** Deploying and maintaining one function is simpler. Both modes share the same auth check, error handling, and logging infrastructure. Budget tracking table is shared.

**Chosen:** `{ mode: 'photo', imageBase64 }` → vision pipeline. `{ mode: 'voice', audioBase64 }` → Whisper + Llama pipeline.

---

## Provider Capacity Reference

```
Free capacity per day:

Vision (Llama 4 Scout):
  Groq Account 1:  1,000
  Groq Account 2:  1,000
  Groq Account 3:  1,000
  Groq Account 4:  1,000
  OpenRouter:        200
  Total:           4,200  →  ~3,000 DAU on $0

Whisper transcription:
  4 Groq accounts: 8,000/day  →  ~5,700 DAU on $0 (at 1 voice/user/day)

Text LLM (Llama 3.1 8B):
  4 Groq accounts: 57,600/day  →  never limiting

Upgrade trigger: ~2,500 DAU
Upgrade cost: Groq paid ~$15/month at that scale
```

---

## Security Model

```
In app binary (public — safe):
  SUPABASE_URL         always public
  SUPABASE_ANON_KEY    public by design, RLS enforces access

In Edge Function secrets (never leave server):
  GROQ_KEY_1..4        vision + whisper + LLM
  OPENROUTER_KEY       vision backup

Attack surface eliminated:
  APK decompilation    → finds only Supabase anon key → can't bypass RLS
  Network interception → finds only JWT tokens → valid only for that user
  Source code leak     → no secrets in source
```

---

---

### ADR-010: Nutrition Calculation Lives in `lib/nutritionCalc.ts`, Not in Components

**Decision:** All BMR/TDEE/macro math is in a pure-function library, not inside onboarding components.

**Context:** Original `OnboardingFlow.tsx` had `calculatePlan()` defined inline inside the component. This made it impossible to reuse on the Profile edit screen, impossible to unit test, and meant the formula lived in UI code.

**Chosen:** `lib/nutritionCalc.ts` — pure functions, zero imports, zero side effects. Exports: `calculateBMR`, `calculateTDEE`, `calculateGoalCalories`, `calculateMacros`, `calculatePlan` (master fn), `lbsToKg`, `ftToCm`.

`CombinedOnboardingFlow` calls `calculatePlan()` during Step 3 animation. Profile edit screen will call the same function when goals are recalculated. Server-side audit (future) can import the same logic.

---

### ADR-011: Onboarding is `CombinedOnboardingFlow` (4-step Hybrid)

**Decision:** Replace both `QuickOnboardingFlow` and `OnboardingFlow` with a single `CombinedOnboardingFlow`.

**Context:** `QuickOnboardingFlow` (2 steps) had good UX but no calculation — it called `onComplete()` without ever computing or saving goals. `OnboardingFlow` (8 steps) had correct math but poor UX — too many steps, redundant screens. Both coexisted in the codebase as dead/broken code.

**Chosen:** 4-step hybrid:
- Steps 1–2: QuickOnboardingFlow UI (unchanged — clean single-page forms)
- Step 3: FullFlow animation screen — but `calculatePlan()` actually fires here
- Step 4: FullFlow PlanReveal — receives real calculated `NutritionPlan`, shows safety warnings if caps were hit

`QuickOnboardingFlow.tsx` and `OnboardingFlow.tsx` kept as dead files — safe to delete post-QA.

---

### ADR-012: Protein Target is Body-Weight Based, Not Percentage

**Decision:** `protein_g = 2 × body_weight_kg`, not `calories × 0.30 / 4`.

**Context:** The original `OnboardingFlow.calculatePlan()` used a 30% calories split for protein. This produces wildly different protein targets depending on the user's calorie goal, not their actual body weight. A user on 1,200 kcal gets only 90g protein — insufficient for muscle preservation. A user on 3,000 kcal gets 225g — excessive.

**Chosen:** ISSN (International Society of Sports Nutrition) recommendation: 1.6–2.2g/kg for active individuals. We use 2g/kg as a single clean number suitable for the app's target demographic (gym-goers, fitness-aware users). Fat is 25% of goal calories. Carbs fill the remainder.

**Trade-off:** For very low calorie goals (<1,200 kcal), protein alone may consume >50% of calories, leaving minimal carbs. This is an edge case — the safety cap on deficits prevents goalCalories from going dangerously low.

---

*ADR v4 — NutriTrack AI. Adds ADR-010 (nutritionCalc.ts), ADR-011 (CombinedOnboardingFlow), ADR-012 (body-weight protein). Updates ADR-001 routing to true round-robin with 800-call threshold + error failover.*
