# NutriTrack AI — Technical Requirements Document (v5)
**Version:** 5.0 | **Date:** March 2026

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  React Native App (Expo)                 │
│                                                         │
│  CameraView  VoiceRecordView  ScanLabelView  SearchFood │
│       │            │               │              │     │
│  ┌────▼────────────▼───┐    ┌──────▼───┐   ┌─────▼──┐  │
│  │  Tier 1: Validate   │    │ ML Kit   │   │Supabase│  │
│  │  Tier 2: Cache      │    │ OCR      │   │  DB    │  │
│  └──────────┬──────────┘    └──────────┘   └────────┘  │
└─────────────┼───────────────────────────────────────────┘
              │ HTTPS (JWT)
┌─────────────▼───────────────────────────────────────────┐
│          Supabase Edge Function: food-detect             │
│                                                         │
│  Photo mode:  Budget Router → Groq/OpenRouter/Gemini    │
│  Voice mode:  Groq Whisper → Groq Llama 3.1 8B          │
│                                                         │
│  All API keys in Supabase secrets — never in app binary │
└─────────────────────────────────────────────────────────┘
```

**Core principle:** AI identifies food names only. Nutrition always comes from IFCT/USDA database. Nothing is hallucinated.

---

## 2. API Provider Stack

### Vision — Photo Flow

| Priority | Provider | Model | Free/day | Notes |
|---|---|---|---|---|
| 1 | Groq Account 1 | llama-4-scout-17b-16e-instruct | 1,000 | Primary |
| 2 | Groq Account 2 | llama-4-scout-17b-16e-instruct | 1,000 | Secondary |
| 3 | Groq Account 3 | llama-4-scout-17b-16e-instruct | 1,000 | Tertiary |
| 4 | Groq Account 4 | llama-4-scout-17b-16e-instruct | 1,000 | Buffer |
| 5 | OpenRouter | qwen/qwen3-vl:free | 200 | Different provider backup |
| Fallback | Manual entry | — | Unlimited | Always available |

**Total free vision: 4,200/day → covers ~3,000 DAU**

### Voice — Separate Groq Quota Buckets

| Step | Model | Free/day (×4 accounts) | Notes |
|---|---|---|---|
| Transcription | whisper-large-v3 | 8,000 | Hinglish: use language=hi |
| Food parsing | llama-3.1-8b-instant | 57,600 | Text-only, cheap |

Voice never consumes vision quota. Entirely separate Groq rate limit buckets.

### Label Scan — Zero API Calls
On-device only via `rn-mlkit-ocr` (Google ML Kit). No external calls.

---

## 3. Multi-Account Routing Logic

True round-robin: index rotates on every call. Failover on error OR when a provider hits 800 calls/day.

```typescript
// Edge Function in-memory state (resets on cold start — acceptable)
let currentProviderIndex = 0;

const PROVIDERS = [
  { id: 'groq_1',     key: Deno.env.get('GROQ_KEY_1'),     dailyLimit: 800 },
  { id: 'groq_2',     key: Deno.env.get('GROQ_KEY_2'),     dailyLimit: 800 },
  { id: 'groq_3',     key: Deno.env.get('GROQ_KEY_3'),     dailyLimit: 800 },
  { id: 'groq_4',     key: Deno.env.get('GROQ_KEY_4'),     dailyLimit: 800 },
  { id: 'openrouter', key: Deno.env.get('OPENROUTER_KEY'), dailyLimit: 180 },
];

// Called once per photo request
async function callVisionWithRoundRobin(
  imageBase64: string,
  usage: Record<string, number>
): Promise<VisionResult | null> {

  const totalProviders = PROVIDERS.length;

  for (let attempt = 0; attempt < totalProviders; attempt++) {
    const provider = PROVIDERS[currentProviderIndex % totalProviders];

    // Advance index regardless of outcome — true round-robin
    currentProviderIndex = (currentProviderIndex + 1) % totalProviders;

    // Skip if daily budget hit
    if ((usage[provider.id] ?? 0) >= provider.dailyLimit) {
      console.log(`[router] ${provider.id} at daily limit, skipping`);
      continue;
    }

    try {
      const result = await callProvider(provider, imageBase64);
      // Success — increment usage counter
      await incrementApiUsage(provider.id);
      return { ...result, provider: provider.id };

    } catch (err: any) {
      // Failover: 429 rate limit OR any provider error — try next
      console.warn(`[router] ${provider.id} failed (${err?.status ?? 'error'}), trying next`);
      // Do NOT increment usage on failure
      continue;
    }
  }

  // All providers failed or exhausted
  return null; // → caller returns { tier: 'manual' }
}
```

**Why 800 not 950 (previous value):**
Leaves a 200-call buffer below the 1,000 hard limit. Protects against clock drift between providers and our usage counter. The 200-call buffer costs nothing — we have 4,200 total capacity vs ~750 needed at 500 DAU.

**Why true round-robin not sequential:**
Sequential always hammers groq_1 first until it hits 800, then groq_2, etc. This creates uneven wear and means groq_1 is always at risk of triggering Groq's unusual-usage detection first. Round-robin distributes evenly — all 4 Groq accounts age at the same rate.

---

## 4. Supabase Edge Function: `food-detect`

Single function handles photo + voice modes.

**Secrets required:**
```bash
supabase secrets set GROQ_KEY_1=gsk_xxxx
supabase secrets set GROQ_KEY_2=gsk_xxxx
supabase secrets set GROQ_KEY_3=gsk_xxxx
supabase secrets set GROQ_KEY_4=gsk_xxxx
supabase secrets set OPENROUTER_KEY=sk-or-xxxx
```

**Photo mode request/response:**
```typescript
// Request
{ mode: 'photo', imageBase64: string }

// Response (success)
{ tier: 'api', provider: string, foods: DetectedFood[], meal_type: string }

// Response (exhausted/failed)
{ tier: 'manual', reason: string, message: string }
```

**Voice mode request/response:**
```typescript
// Request
{ mode: 'voice', audioBase64: string, mimeType: 'audio/m4a' }

// Response (success)
{ transcript: string, items: VoiceItem[] }

// Response (failed)
{ error: string, message: string, items: [] }
```

**DetectedFood schema:**
```typescript
interface DetectedFood {
  name: string;        // "Dal (yellow lentils)"
  portion: string;     // "1 katori (150ml)"
  confidence: number;  // 0.0–1.0
  category: 'main' | 'bread' | 'side' | 'condiment';
}
// NO estimated_calories — nutrition from DB only
```

---

## 5. Vision Prompt Strategy

The prompt must handle Indian thali plates (multiple items), recognize regional variants, and return structured JSON with no calorie estimates.

Key elements:
- Explicit Indian food dictionary (dal, chawal, roti, sabzi, samosa, idli, dosa, etc.)
- Standard Indian portion references (katori, cup, piece)
- Instruction: detect ALL items, scan left-to-right
- `response_format: { type: "json_object" }` for Groq
- Strip markdown fences for Gemini responses

---

## 6. Voice Prompt Strategy

Two-step pipeline:
1. Whisper `language=hi` — Hindi mode handles Hinglish better than English mode
2. Llama 3.1 8B with Hinglish food parser system prompt

Hindi quantity words mapped in prompt: ek=1, do=2, aadha=0.5, thoda sa=small, bada=large.
Output: `{ items: [{ name, quantity, size, meal_type }] }` — no calories from LLM.

---

## 7. Client-Side: Three-Tier Detection

```
Tier 1 — Validate (client, <100ms, $0):
  File size: 50KB–10MB
  Resolution: ≥300×300
  Format: JPEG/PNG
  Fail → "Retake photo" message

Tier 2 — Cache (client + AsyncStorage, ~150ms, $0):
  Last 30 meals synced via Supabase
  Pattern: ≥3 occurrences, time-aware (±1.5 hours)
  Hit → CacheConfirmDialog overlay on MultiItemConfirmView
  Miss → Tier 3

Tier 3 — Edge Function (~500ms–2s):
  Compressed to max 1024px, 80% JPEG quality
  Sent as base64 to food-detect function
  Returns food names → DB lookup → portion defaults applied
  → MultiItemConfirmView populated
```

---

## 8. Nutrition Lookup Pipeline

```
For each detected food name:

1. Search ifct_foods (Supabase)     → Indian foods, best for dal/roti/sabzi
2. Search usda_foods (Supabase)     → General foods, best for rice/vegetables
3. Call OpenFoodFacts API           → Branded/packaged products
4. Offer CreateCustomFoodView       → User-created entry

Calculation (always deterministic):
  calories = (weight_g / 100) × calories_per_100g
  protein  = (weight_g / 100) × protein_per_100g
  ... etc

weight_g = from user-confirmed portion on MultiItemConfirmView
```

---

## 9. Label Scan — On-Device OCR

**Library:** `rn-mlkit-ocr`
**Cost:** $0 — Google ML Kit, fully on-device

```
ScanLabelView (camera + green frame)
  → rn-mlkit-ocr.recognizeText(imageUri)
  → Raw text → regex parser extracts:
    energy_kcal, protein_g, carbs_g, fat_g, sodium_mg, sugar_g, serving_size
  → LabelResultView:
    All fields shown as editable inputs
    Missing fields: blank but editable (user fills in)
    Serving stepper: ×1, ×2, etc.
    Live totals: serving_count × per_serving
  → Confirm → FinalResultsView

Label values stored in label_nutrients table as-is.
NEVER replaced by USDA/IFCT values.
```

---

## 10. Database Schema

### Core tables

```sql
-- User profiles
CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id),
  name           TEXT,
  calorie_goal   INTEGER DEFAULT 2000,
  protein_goal_g INTEGER,
  carbs_goal_g   INTEGER,
  fat_goal_g     INTEGER,
  -- Stored for Profile edit recalculation and future audit
  bmr            INTEGER,
  tdee           INTEGER,
  weight_kg      NUMERIC,
  height_cm      NUMERIC,
  age            INTEGER,
  gender         TEXT CHECK (gender IN ('male','female','other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary','light','moderate','active')),
  goal           TEXT CHECK (goal IN ('lose','maintain','gain')),
  target_weight_kg NUMERIC,
  goal_weeks     INTEGER,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- IFCT Indian foods (pre-seeded)
CREATE TABLE ifct_foods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  local_names       TEXT[],
  calories_per_100g NUMERIC,
  protein_per_100g  NUMERIC,
  carbs_per_100g    NUMERIC,
  fat_per_100g      NUMERIC,
  fiber_per_100g    NUMERIC,
  name_search       TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name)) STORED
);
CREATE INDEX ifct_search ON ifct_foods USING GIN (name_search);

-- USDA foods (pre-seeded, ~5,000 common foods)
CREATE TABLE usda_foods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  calories_per_100g NUMERIC,
  protein_per_100g  NUMERIC,
  carbs_per_100g    NUMERIC,
  fat_per_100g      NUMERIC,
  name_search       TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name)) STORED
);
CREATE INDEX usda_search ON usda_foods USING GIN (name_search);

-- Custom user foods
CREATE TABLE custom_foods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  calories_per_100g NUMERIC,
  protein_per_100g  NUMERIC,
  carbs_per_100g    NUMERIC,
  fat_per_100g      NUMERIC,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Meals
CREATE TABLE meals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type        TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  logged_at        DATE NOT NULL,
  total_calories   NUMERIC,
  total_protein_g  NUMERIC,
  total_carbs_g    NUMERIC,
  total_fat_g      NUMERIC,
  detection_source TEXT CHECK (detection_source IN (
    'manual','voice','photo_groq_1','photo_groq_2','photo_groq_3',
    'photo_groq_4','photo_openrouter','label','cache'
  )),
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX meals_user_date ON meals (user_id, logged_at DESC);

-- Meal items
CREATE TABLE meal_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id           UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_source       TEXT CHECK (food_source IN ('ifct','usda','custom','label')),
  food_id           UUID,
  food_name         TEXT NOT NULL,
  quantity          NUMERIC NOT NULL DEFAULT 1,
  size              TEXT CHECK (size IN ('small','medium','large')),
  weight_g          NUMERIC,
  calories          NUMERIC NOT NULL,
  protein_g         NUMERIC,
  carbs_g           NUMERIC,
  fat_g             NUMERIC
);

-- Label scan nutrients (label values stored raw)
CREATE TABLE label_nutrients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_item_id UUID REFERENCES meal_items(id) ON DELETE CASCADE,
  energy_kcal  NUMERIC,
  protein_g    NUMERIC,
  carbs_g      NUMERIC,
  fat_g        NUMERIC,
  sodium_mg    NUMERIC,
  sugar_g      NUMERIC,
  serving_size TEXT,
  raw_ocr_text TEXT
);

-- API daily usage tracking
CREATE TABLE api_daily_usage (
  date       DATE NOT NULL,
  provider   TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(date, provider)
);

CREATE OR REPLACE FUNCTION increment_api_usage(p_provider TEXT, p_date DATE)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO api_daily_usage (date, provider, call_count)
  VALUES (p_date, p_provider, 1)
  ON CONFLICT (date, provider)
  DO UPDATE SET call_count = api_daily_usage.call_count + 1;
END;
$$;
```

### RLS policies
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles FOR ALL USING (id = auth.uid());

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meals" ON meals FOR ALL USING (user_id = auth.uid());

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal items" ON meal_items FOR ALL
  USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own custom foods" ON custom_foods FOR ALL USING (user_id = auth.uid());
```

---

## 11. Environment Variables

### App binary (safe — no secrets)
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

### Supabase Edge Function secrets (never in app)
```bash
supabase secrets set GROQ_KEY_1=gsk_xxxx
supabase secrets set GROQ_KEY_2=gsk_xxxx
supabase secrets set GROQ_KEY_3=gsk_xxxx
supabase secrets set GROQ_KEY_4=gsk_xxxx
supabase secrets set OPENROUTER_KEY=sk-or-xxxx
```

---

## 12. Libraries

| Package | Purpose |
|---|---|
| `expo-camera` | Photo capture |
| `expo-av` | Voice recording (m4a) |
| `expo-image-manipulator` | Compress photos before sending |
| `expo-file-system` | Read files as base64 |
| `rn-mlkit-ocr` | On-device nutrition label OCR |
| `@supabase/supabase-js` | All DB + Edge Function calls |
| `expo-secure-store` | JWT token storage |
| `@tanstack/react-query` | Server state |
| `zustand` | Local UI state |
| `@react-native-async-storage/async-storage` | Meal pattern cache |

**Removed vs v3:** `@react-native-voice/voice`, `@tensorflow/tfjs-*` — no longer needed.

---

## 13. Capacity Math (Honest)

```
At 500 DAU:
  Photo: 500 × 3 photos × 50% cache miss = 750 vision calls/day
  Voice: 500 × 1 voice × 40% adoption × 70% cache miss = 140 calls/day
  
  Free vision capacity: 4,200/day (4 Groq + OpenRouter)
  Vision utilization: 750/4,200 = 18% — massive headroom
  
  Upgrade trigger: ~2,500 DAU (vision calls hit 2,000/day)
```

---

## 14. Nutrition Calculation Architecture

### Location
`lib/nutritionCalc.ts` — pure functions, no UI, no Supabase imports. See `NUTRITION_CALC.md` for full formula reference and worked examples.

### Formula Summary

```
BMR  (Mifflin-St Jeor):
  Male:   10w + 6.25h − 5a + 5
  Female: 10w + 6.25h − 5a − 161
  Other:  10w + 6.25h − 5a − 78

TDEE = BMR × activity_multiplier
  sedentary=1.2 | light=1.375 | moderate=1.55 | active=1.725

Goal calories (target-week aware):
  dailyDelta = (|targetWeight − currentWeight| × 7700) / (weeks × 7)
  Capped at: 1000 kcal deficit | 500 kcal surplus
  If cap hit → estimatedWeeks recalculated, warning flags set

Macros:
  protein_g = 2 × weight_kg
  fat_g     = (goalCalories × 0.25) / 9
  carbs_g   = (goalCalories − protein_kcal − fat_kcal) / 4
```

### What Gets Saved to profiles Table

```typescript
// Called in App.tsx onComplete(plan) after CombinedOnboardingFlow
await supabase.from('profiles').update({
  calorie_goal:      plan.goalCalories,
  protein_goal_g:    plan.protein,
  carbs_goal_g:      plan.carbs,
  fat_goal_g:        plan.fat,
  bmr:               plan.bmr,
  tdee:              plan.tdee,
  // Raw stats — stored so Profile edit can recalculate without re-onboarding
  weight_kg,
  height_cm,
  age,
  gender,
  activity_level,
  goal:              stats.goal,
  target_weight_kg:  stats.targetWeight,
  goal_weeks:        stats.weeks,
}).eq('id', user.id);
```

### Meal Nutrition Calculation (Current — Client Side)

```
calories = (weight_g / 100) × calories_per_100g
```

Runs on client in `MultiItemConfirmView` after DB lookup. Result saved to `meal_items.calories`.

**Known limitation:** No server-side validation. Client value is trusted as-is.

### Meal Nutrition Calculation (Future — Server Audit)

Backlog item: `audit-meal-calc`

```
Client sends: { food_id, weight_g, food_source }
Server:       lookup calories_per_100g from ifct_foods / usda_foods
              calculate and return { calories, protein_g, carbs_g, fat_g }
Client:       uses server value — never its own calculation
```

Prevents calorie manipulation. Not required for v1 — add at scale when data integrity matters.

---

*TRD v5 — NutriTrack AI. Updates: true round-robin routing (Section 3), expanded profiles schema with BMR/TDEE/stats columns (Section 10), new Section 14 nutrition calculation architecture.*
