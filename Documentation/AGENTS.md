# NutriTrack AI — AI Agents Documentation
**Version:** 2.0 | **Date:** March 2026

---

## Overview

NutriTrack AI uses **3 specialized AI agents** across 4 input modes, plus a **deterministic nutrition calculation module** (`lib/nutritionCalc.ts`). Each agent has a single, well-defined responsibility. Agents NEVER hallucinate nutrition data — they only identify food names. All nutrition comes from the IFCT/USDA database.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Input Modes                          │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   📷 Photo   │   🎤 Voice   │  📄 Label    │   ✏️ Manual        │
│              │              │              │                    │
│   Agent 1    │   Agent 2    │      —       │        —           │
│   Vision     │   Agent 3    │   On-Device  │   Database         │
│              │   Voice      │   OCR        │   Search           │
└──────────────┴──────────────┴──────────────┴────────────────────┘
        ↓               ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────────┐
│   Nutrition Module: lib/nutritionCalc.ts (pure functions)        │
│   BMR → TDEE → goal calories → macros (onboarding + profile)    │
│   Separate from agents — no AI, fully deterministic             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent 1: Vision Food Detector

**Purpose:** Identify ALL food items in a photo and return structured food names with portion estimates.

**Models Used (True Round-Robin):**
1. Groq Llama 4 Scout (17B) — Accounts 1–4 (800 calls/day each before failover)
2. OpenRouter Qwen3-VL (free tier, 180 calls/day)

**Routing behavior:** `currentProviderIndex` rotates on every request — not "fill groq_1 first". Failover triggers on either: (a) provider returns 429 or any error, OR (b) provider's daily `call_count ≥ 800`. See TRD_v5.md Section 3 for full implementation.

**Invoked By:** Photo flow (CameraView → ScanningView)

**Input:**
- JPEG/PNG image (base64)
- Max resolution: 1024px
- Max size: 2MB (compressed)

**Output:**
```typescript
{
  "foods": [
    {
      "name": "Dal (yellow lentils)",
      "portion": "1 katori (150ml)",
      "confidence": 0.95,
      "category": "main"
    },
    {
      "name": "Chawal (white rice)",
      "portion": "1 cup (200g)",
      "confidence": 0.92,
      "category": "main"
    }
  ],
  "meal_type": "lunch",
  "total_items": 2
}
```

**Critical Rules:**
- ❌ NEVER include `estimated_calories` field
- ✅ Scan entire image, detect ALL items
- ✅ Use Indian portion terms (katori, cup, piece)
- ✅ Be specific: "Dal (yellow lentils)" not "soup"
- ✅ For thali: list EACH component separately

### Prompt (Vision)

```
You are an expert in Indian cuisine. Identify ALL food items in this meal photo.

INDIAN FOODS:
Staples: dal (yellow/black/masoor/toor/moong/rajma/chole), chawal/rice, roti/chapati, paratha, puri, bhatura, naan
Curries: palak paneer, matar paneer, kadai paneer, aloo gobhi, bhindi masala, mix veg
South Indian: dosa (plain/masala/rava), idli, vada, sambar, rasam, coconut chutney
Snacks: samosa, pakode, pav bhaji, chole bhature, aloo tikki, dhokla
Sides: raita, papad, achaar, chutney (green/red/coconut)
Sweets: gulab jamun, jalebi, kheer, halwa, ladoo
Rice: biryani, pulao, khichdi, curd rice

Standard portions: 1 katori=150ml, 1 cup rice=200g, 1 roti=45g, 1 papad=12g

RULES:
- Scan entire image, miss nothing
- For thali: list EACH component separately
- DO NOT include estimated_calories (nutrition from our database)
- Be specific: "Dal (yellow lentils)" not "soup"

Return ONLY valid JSON, no markdown:
{
  "foods": [
    {"name": "Dal (yellow lentils)", "portion": "1 katori (150ml)", "confidence": 0.95, "category": "main"}
  ],
  "meal_type": "breakfast|lunch|dinner|snack",
  "total_items": 1
}
category: "main"|"bread"|"side"|"condiment"|"sweet"|"drink"
```

**Prompt Location:** `/mnt/user-data/uploads/ai_prompts.md` (VISION PROMPT section)

**API Configuration:**

```typescript
// Groq
const groqRequest = {
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: VISION_PROMPT },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
      ]
    }
  ],
  response_format: { type: "json_object" },
  max_tokens: 1000,
  temperature: 0.3
};

// OpenRouter (fallback)
const openrouterRequest = {
  model: "qwen/qwen3-vl:free",
  messages: [...], // same structure
  // No response_format — strip ```json fences in post-processing
  max_tokens: 1000,
  temperature: 0.3
};
```

**Post-Processing:**
1. Parse JSON response
2. Strip markdown fences if present: `text.replace(/```json|```/g, '')`
3. Validate schema (foods array, meal_type string)
4. Filter out low-confidence items (< 0.7)
5. Map food names to IFCT/USDA database

**Error Handling:**
- Timeout: 10s → show manual entry fallback
- 429 Rate Limit: Auto-retry with next provider (round-robin)
- Invalid JSON: Retry once, then fallback to manual
- Empty foods array: Show "No food detected" → manual entry

**Success Criteria:**
- Detection accuracy: ≥85% (user confirms without editing food name)
- Multi-item detection: ≥90% (detects 9/10 items on thali plate)
- Latency: <2s (p95)

---

## Agent 2: Voice Transcription (Whisper)

**Purpose:** Convert Hinglish speech audio to text transcript.

**Model:** Groq Whisper Large v3

**Invoked By:** Voice flow (VoiceRecordView → processing state)

**Input:**
- Audio format: M4A (expo-av default)
- Duration: 3-15 seconds
- Base64 encoded
- Language hint: `hi` (Hindi mode)

**Output:**
```typescript
{
  "text": "aadha plate biryani aur do roti khaya"
}
```

**API Configuration:**

```typescript
const whisperRequest = {
  file: audioBase64, // or file upload
  model: "whisper-large-v3",
  language: "hi", // Critical: Hindi mode for Hinglish
  response_format: "json",
  temperature: 0.0
};

// Endpoint: https://api.groq.com/openai/v1/audio/transcriptions
```

**Why Hindi Mode:**
- Hinglish = Hindi + English mixed speech
- `language=hi` handles English words IN Hindi speech better than `language=en`
- English mode often drops Hindi words entirely
- Hindi mode preserves both languages in transcript

**Success Criteria:**
- Transcription accuracy: ≥90% (words correct)
- Latency: <1s
- Hinglish support: Handles mixed-language phrases correctly

---

## Agent 3: Voice Food Parser (Llama 3.1 8B)

**Purpose:** Parse Hinglish transcript into structured food items with quantities.

**Model:** Groq Llama 3.1 8B Instant

**Invoked By:** Voice flow (after Agent 2 transcription)

**Input:**
- Text transcript from Whisper
- System prompt with Hinglish food parser instructions

**Output:**
```typescript
{
  "items": [
    {
      "name": "biryani",
      "quantity": 0.5,
      "size": null,
      "meal_type": "dinner"
    },
    {
      "name": "roti",
      "quantity": 2,
      "size": null,
      "meal_type": "dinner"
    }
  ]
}
```

### System Prompt (Voice Parser)

```
You parse Indian food logs from Hinglish speech (mixed Hindi + English).

Hindi quantities: ek=1, do=2, teen=3, aadha=0.5, thoda sa=small, bada=large
Meal times: subah=breakfast, dopahar/lunch=lunch, shaam/raat/dinner=dinner
Shortenings: chawal=rice, sabzi=curry, dal=lentils, chai=tea, roti=flatbread

RULES:
- Default quantity=1, size=null if not stated
- Use Indian names: roti not bread, dal not lentil soup
- List each food separately
- Ignore fillers: bhai, yaar, aaj, toh, na

Return ONLY valid JSON:
{
  "items": [
    {"name": "dal", "quantity": 1, "size": null, "meal_type": "dinner"}
  ]
}

Examples:
"dal chawal khaya" -> [{"name":"dal","quantity":1},{"name":"chawal","quantity":1}]
"2 roti aur sabzi" -> [{"name":"roti","quantity":2},{"name":"sabzi","quantity":1}]
"aadha plate biryani" -> [{"name":"biryani","quantity":0.5}]
"ek samosa aur chai" -> [{"name":"samosa","quantity":1},{"name":"chai","quantity":1}]
```

**Prompt Location:** `/mnt/user-data/uploads/ai_prompts.md` (VOICE SYSTEM PROMPT section)

**API Configuration:**

```typescript
const llamaRequest = {
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "system", content: VOICE_PARSER_SYSTEM_PROMPT },
    { role: "user", content: transcript }
  ],
  response_format: { type: "json_object" },
  max_tokens: 500,
  temperature: 0.1
};
```

**Post-Processing:**
1. Parse JSON response
2. Validate items array
3. Map food names to IFCT/USDA database
4. Apply portion defaults (1 roti = 45g, 1 katori dal = 150ml)
5. Populate MultiItemConfirmView

**Success Criteria:**
- Parse accuracy: ≥80% (correct food items extracted)
- Quantity accuracy: ≥85% (correct numbers)
- Latency: <500ms

---

## Agent Interaction Flow

### Photo Flow (2 agents)

```
User takes photo
    ↓
CameraView → base64 encode → compress to 1024px
    ↓
ScanningView (visual feedback)
    ↓
Edge Function: food-detect (mode: photo)
    ↓
┌─────────────────────────────────────┐
│  Agent 1: Vision Food Detector      │
│  - Groq Llama 4 Scout (round-robin) │
│  - Detects: ["dal", "chawal"]       │
│  - Returns: food names + portions   │
└─────────────────────────────────────┘
    ↓
App: Lookup each food in IFCT/USDA
    ↓
App: Apply portion defaults (dal=150ml, rice=200g)
    ↓
MultiItemConfirmView (user adjusts portions)
    ↓
FinalResultsView → Save to Supabase
```

### Voice Flow (2 agents in sequence)

```
User records voice (3-15s)
    ↓
VoiceRecordView → base64 encode (m4a)
    ↓
Edge Function: food-detect (mode: voice)
    ↓
┌─────────────────────────────────────┐
│  Agent 2: Whisper Transcription     │
│  - Groq Whisper Large v3            │
│  - Input: m4a audio                 │
│  - Output: "aadha plate biryani"    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Agent 3: Voice Food Parser         │
│  - Groq Llama 3.1 8B                │
│  - Input: transcript                │
│  - Output: [{"biryani", 0.5}]       │
└─────────────────────────────────────┘
    ↓
App: Lookup "biryani" in IFCT/USDA
    ↓
App: Apply portion default (plate=250g)
    ↓
MultiItemConfirmView (user adjusts portions)
    ↓
FinalResultsView → Save to Supabase
```

### Label Flow (0 agents)

```
User scans nutrition label
    ↓
ScanLabelView → capture image
    ↓
On-device: rn-mlkit-ocr (Google ML Kit)
    ↓
Regex extraction: energy_kcal, protein_g, etc.
    ↓
LabelResultView (user edits/confirms values)
    ↓
FinalResultsView → Save to Supabase (label_nutrients table)
```

### Manual Flow (0 agents)

```
User taps "Manual Entry"
    ↓
SearchFoodView → full-text search IFCT/USDA
    ↓
EditEntryView (user sets quantity/size)
    ↓
FinalResultsView → Save to Supabase
```

---

## Agent Configuration Matrix

| Agent | Model | Provider | RPD (Requests/Day) | RPM | Quota Usage @ 500 DAU |
|---|---|---|---|---|---|
| Vision | Llama 4 Scout 17B | Groq ×4 | 4,000 | 30 | 750 (18%) |
| Vision | Qwen3-VL | OpenRouter | 200 | 60 | Backup only |
| Whisper | Whisper Large v3 | Groq ×4 | 8,000 | 20 | 140 (1.75%) |
| Voice Parser | Llama 3.1 8B | Groq ×4 | 57,600 | 30 | 140 (<1%) |

**Total API Cost @ 500 DAU:** $0/month (all free tier)

---

## Agent Error Handling

### Vision Agent (Agent 1)

| Error | Response | User Impact | Recovery |
|---|---|---|---|
| 429 Rate Limit | Auto-failover to next provider | None (transparent) | True round-robin: advance index, skip provider |
| Daily limit hit (≥800 calls) | Auto-failover to next provider | None (transparent) | Same failover path as 429 |
| Timeout (>10s) | Show manual entry | See "No detection" message | User enters manually |
| Invalid JSON | Retry once, then manual | See error modal | Manual entry fallback |
| No foods detected | Return empty array | Show "No food detected" | Manual entry |
| All providers exhausted | tier: 'manual' | Show quota message | Manual entry only |

### Whisper Agent (Agent 2)

| Error | Response | User Impact | Recovery |
|---|---|---|---|
| 429 Rate Limit | Auto-retry next account | None (transparent) | Round-robin across 4 accounts |
| Empty transcript | Return empty text | Show "Try again" message | User re-records |
| Audio too short (<1s) | Reject at client | Show validation error | User records longer |
| Network failure | Show error toast | See network error | Retry button |

### Voice Parser (Agent 3)

| Error | Response | User Impact | Recovery |
|---|---|---|---|
| Invalid JSON | Retry once | Slight delay | Fallback to manual |
| Empty items array | Show transcript | User sees what was heard | Manual entry |
| Unknown food names | Pass through | MultiItemConfirm shows "Not found" | User edits or creates custom |

---

## Agent Monitoring & Logging

**Metrics to Track:**

```typescript
// Edge Function logs
{
  "agent": "vision",
  "provider": "groq_2",
  "latency_ms": 1847,
  "status": "success",
  "foods_detected": 3,
  "confidence_avg": 0.89,
  "user_confirmed": true, // Did user edit food names?
  "timestamp": "2026-03-03T12:34:56Z"
}

{
  "agent": "whisper",
  "provider": "groq_1",
  "latency_ms": 892,
  "status": "success",
  "transcript_length": 28,
  "timestamp": "2026-03-03T12:34:56Z"
}

{
  "agent": "voice_parser",
  "provider": "groq_3",
  "latency_ms": 312,
  "status": "success",
  "items_parsed": 2,
  "timestamp": "2026-03-03T12:34:56Z"
}
```

**Success Metrics (Weekly):**

1. **Vision Detection Rate:** `(successful_detections / total_photo_attempts) × 100`
   - Target: ≥85%

2. **Vision Confirmation Rate:** `(unedited_confirmations / successful_detections) × 100`
   - Target: ≥80% (user accepts AI food names without changing)

3. **Voice Parse Accuracy:** `(correct_items / total_voice_items) × 100`
   - Target: ≥80%

4. **Agent Latency (p95):**
   - Vision: <2s
   - Whisper: <1s
   - Voice Parser: <500ms

5. **Fallback Rate:** `(manual_entries / total_entries) × 100`
   - Target: <15% (most users succeed with AI)

---

## Agent Prompt Updates

**When to update prompts:**
- New Indian food categories added (regional cuisines)
- Detection accuracy drops below 80%
- Common misidentifications found (e.g., confusing dal types)
- New portion standards (e.g., restaurant vs home portions)

**Update process:**
1. Edit prompt in `/ai_prompts.md`
2. Test with 20 diverse images/transcripts
3. Measure accuracy improvement
4. Deploy to Edge Function via Supabase secrets (if needed) or code update
5. Monitor for 1 week

**Version control:**
- Keep prompt versions in `ai_prompts.md` with changelog
- Document A/B test results
- Track accuracy delta before/after

---

## Future Agent Enhancements (Post-v1)

### 1. Multi-Modal Agent (Vision + Text)
- Accept both photo AND text description
- "2 rotis with dal" + photo → better context
- Useful for ambiguous items

### 2. Meal Context Agent
- Learn user's typical meals
- "Your usual breakfast?" suggestion
- Requires meal history ML model

### 3. Nutrition Reasoning Agent
- Explain macro breakdown
- "High in carbs because of rice and roti"
- Educational, not health advice

### 4. Recipe Decomposition Agent
- Photo of "chicken biryani" → detect: rice, chicken, spices, oil
- Break down compound dishes into ingredients
- More accurate nutrition calculation

**Not planned:**
- ❌ Nutrition estimation from photos (hallucination risk)
- ❌ Cooking advice (out of scope)
- ❌ Meal recommendations (requires dietitian expertise)

---

## Appendix: Agent Cost Analysis

**At 500 DAU:**

| Agent | Calls/Day | Provider | Cost/Call | Daily Cost | Monthly Cost |
|---|---|---|---|---|---|
| Vision | 750 | Groq (free) | $0 | $0 | $0 |
| Whisper | 140 | Groq (free) | $0 | $0 | $0 |
| Voice Parser | 140 | Groq (free) | $0 | $0 | $0 |
| **Total** | **1,030** | — | — | **$0** | **$0** |

**At 2,500 DAU (upgrade trigger):**

| Agent | Calls/Day | Provider | Cost/Call | Daily Cost | Monthly Cost |
|---|---|---|---|---|---|
| Vision | 3,750 | Groq (paid) | $0.0005 | $1.88 | $56 |
| Whisper | 700 | Groq (free) | $0 | $0 | $0 |
| Voice Parser | 700 | Groq (free) | $0 | $0 | $0 |
| **Total** | **5,150** | — | — | **$1.88** | **~$56** |

**Upgrade path:** Vision API only (Whisper + Llama stay free until much higher scale)

---

---

## Nutrition Calculation Module (`lib/nutritionCalc.ts`)

This is **not an AI agent** — it's a pure deterministic function library. Documented here because it completes the picture of how user data flows from raw inputs to stored goals.

**Purpose:** Calculate BMR, TDEE, goal-adjusted daily calories, and macro targets during onboarding and profile edits.

**Invoked By:** `CombinedOnboardingFlow` Step 3 (CalculationStep), Profile edit screen (future)

**Input:** `UserStats` object — weight, height, age, gender, activityLevel, goal, targetWeight, weeks

**Output:** `NutritionPlan` object — goalCalories, protein, carbs, fat, bmr, tdee, weeklyWeightChange, estimatedWeeks, warning flags

**Key properties:**
- Zero AI involvement — no API calls, no hallucination risk
- Target-week aware: deficit = (weightDiff × 7700) ÷ (weeks × 7), not flat ±500 kcal
- Safety capped: max 1,000 kcal/day deficit, max 500 kcal/day surplus
- Protein: 2g × body_weight_kg (ISSN recommendation — not % of calories)
- Imperial → metric conversion handled before calling `calculatePlan()`

**Full formula reference:** See `NUTRITION_CALC.md`

---

*AGENTS.md v2.0 — NutriTrack AI. Updated: true round-robin routing with 800-call threshold (Agent 1), updated overview diagram, added Nutrition Calculation Module section.*
