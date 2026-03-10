# NutriTrack AI — AI Agents Documentation

**Version:** 2.0 | **Date:** March 2026

---

## Overview

NutriTrack AI uses **4 specialized AI agents** across 4 input modes. Each agent has a single, well-defined responsibility. Agents identify food names and provide generic nutrition data. All nutrition is stored in database permanently for instant future lookups.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Input Modes                          │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   📷 Photo   │   🎤 Voice   │  📄 Label    │   ✏️ Manual        │
│              │              │              │                    │
│   Agent 1    │   Agent 2    │      —       │        —           │
│   Vision     │   Agent 3    │   On-Device  │   Database         │
│              │   Voice      │   OCR        │   Search           │
│   +          │              │              │                    │
│   Agent 4    │              │              │                    │
│   Nutrition  │              │              │                    │
│   (if needed)│              │              │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## Agent 1: Vision Food Detector

**Purpose:** Identify ALL food items in a photo and return structured food names with portion estimates.

**Models Used (Round-Robin):**

1. Groq Llama 4 Scout (17B) — Accounts 1-4
2. OpenRouter Qwen3-VL (free tier)

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

````typescript
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
````

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
  temperature: 0.0,
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
    { role: "user", content: transcript },
  ],
  response_format: { type: "json_object" },
  max_tokens: 500,
  temperature: 0.1,
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

## Agent 4: Nutrition Auto-Add (NEW in v2)

**Purpose:** Automatically fetch and store nutrition data for foods not in database. Uses real product data (OpenFoodFacts) or AI-generated generic nutrition (Llama 70B).

**Models Used:**

1. OpenFoodFacts API (free, priority)
2. Groq Llama 3.1 70B Versatile (fallback)

**Invoked By:** Photo flow and Voice flow (when food not found in database)

**Input:**

- Food name string (from Vision AI or Voice Parser)
- Example: "Paneer Tikka Masala"

**Output:**

```typescript
{
  "calories_per_100g": 180,
  "protein_per_100g": 12.5,
  "carbs_per_100g": 8.0,
  "fat_per_100g": 14.0,
  "fiber_per_100g": 1.5,
  "source": "openfoodfacts" | "ai_generated",
  "confidence": 0.95 | 0.85
}
```

**Critical Rules:**

- ✅ Return GENERIC per-100g nutrition data (not photo-specific)
- ✅ Store permanently in ai_generated_foods table
- ✅ Try OpenFoodFacts first (real product data, higher confidence)
- ✅ Fallback to LLM if not found (generic nutrition knowledge)
- ❌ NEVER estimate nutrition from photo (cannot judge portion from 2D)
- ✅ Seamless to user (no manual entry, happens automatically)

### Nutrition Lookup Prompt (Llama 70B)

```
You are a nutrition database. Provide accurate per-100g nutrition data for the following food. Use average values from reliable sources like USDA or Indian Food Composition Tables. Return ONLY valid JSON with no explanations or markdown.

Food: ${foodName}

Return format:
{
  "calories": 250,
  "protein": 12.5,
  "carbs": 8.0,
  "fat": 18.0,
  "fiber": 1.5
}

Rules:
- Values must be per 100g
- Use decimal numbers (not integers)
- Be conservative with estimates
- For Indian foods, use IFCT values if known
- For packaged foods, use manufacturer data if known
```

**API Configuration:**

```typescript
// OpenFoodFacts (try first)
const offResponse = await fetch(
  `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&json=true&page_size=1`,
);

const offData = await offResponse.json();

if (offData.products?.[0]?.nutriments?.energy_kcal_100g) {
  return {
    calories_per_100g: offData.products[0].nutriments["energy-kcal_100g"],
    protein_per_100g: offData.products[0].nutriments.proteins_100g,
    carbs_per_100g: offData.products[0].nutriments.carbohydrates_100g,
    fat_per_100g: offData.products[0].nutriments.fat_100g,
    fiber_per_100g: offData.products[0].nutriments.fiber_100g,
    source: "openfoodfacts",
    confidence: 0.95,
  };
}

// Groq Llama 70B (fallback)
const llmRequest = {
  model: "llama-3.1-70b-versatile",
  messages: [{ role: "user", content: NUTRITION_PROMPT }],
  response_format: { type: "json_object" },
  temperature: 0.1, // Low temp for factual data
  max_tokens: 300,
};
```

**Post-Processing:**

1. Parse JSON response
2. Validate all fields present and numeric
3. Insert into ai_generated_foods table
4. Return nutrition data to Edge Function
5. Increment times_used counter on future lookups

**Error Handling:**

- OpenFoodFacts timeout: Skip to LLM (don't block user)
- LLM invalid JSON: Retry once with stricter prompt
- LLM missing fields: Use 0 as default
- Database insert conflict (duplicate): Fetch existing entry
- All failures: Return generic fallback (150 kcal, 5g protein, etc.)

**Success Criteria:**

- OpenFoodFacts hit rate: ≥30% (for packaged foods)
- LLM accuracy: ≥80% (compare against USDA spot checks)
- Latency: <2s (p95) including DB insert
- Database growth: +500-1000 foods/week

---

## Agent Interaction Flow (UPDATED)

### Photo Flow (2-3 agents)

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
│  - Detects: ["Paneer Tikka", "Naan"]│
│  - Returns: food names only         │
└─────────────────────────────────────┘
    ↓
For each food name:
  Check database (ifct → usda → ai_generated)

  If "Paneer Tikka" NOT found:
    ↓
  ┌─────────────────────────────────────┐
  │  Agent 4: Nutrition Auto-Add        │
  │  - Try OpenFoodFacts API → Not found│
  │  - Fallback to Llama 70B → Success  │
  │  - Returns: {calories: 180, ...}    │
  │  - Inserts into ai_generated_foods  │
  └─────────────────────────────────────┘
    ↓
  If "Naan" found in IFCT:
    → Use existing nutrition ✅
    ↓
App: Apply portion defaults
    ↓
MultiItemConfirmView (user adjusts portions)
    ↓
FinalResultsView → Save to Supabase
    ↓
Next user photographs "Paneer Tikka":
  → Found in ai_generated_foods ✅
  → No Agent 4 call needed!
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

## Agent Configuration Matrix (UPDATED)

| Agent         | Model                 | Provider    | RPD (Requests/Day) | RPM     | Quota Usage @ 500 DAU       |
| ------------- | --------------------- | ----------- | ------------------ | ------- | --------------------------- |
| Vision        | Llama 4 Scout 17B     | Groq ×4     | 4,000              | 30      | 1,500 (37.5%)               |
| Vision        | Qwen3-VL              | OpenRouter  | 200                | 60      | Backup only                 |
| Whisper       | Whisper Large v3      | Groq ×4     | 8,000              | 20      | 200 (2.5%)                  |
| Voice Parser  | Llama 3.1 8B          | Groq ×4     | 57,600             | 30      | 200 (<1%)                   |
| **Nutrition** | **Llama 3.1 70B**     | **Groq ×4** | **4,000**          | **30**  | **500 week 1 → 20 month 3** |
| **Nutrition** | **OpenFoodFacts API** | **Public**  | **Unlimited**      | **100** | **150 week 1 → 5 month 3**  |

**Total API Cost @ 500 DAU:** $0/month (all free tier)

**Note:** Nutrition quota usage decreases over time as database grows organically. Week 1 requires frequent auto-adds; Month 3+ has 97% hit rate in existing database.

---

## Agent Error Handling

### Vision Agent (Agent 1)

| Error                   | Response                 | User Impact                | Recovery              |
| ----------------------- | ------------------------ | -------------------------- | --------------------- |
| 429 Rate Limit          | Auto-retry next provider | None (transparent)         | Round-robin failover  |
| Timeout (>10s)          | Show manual entry        | See "No detection" message | User enters manually  |
| Invalid JSON            | Retry once, then manual  | See error modal            | Manual entry fallback |
| No foods detected       | Return empty array       | Show "No food detected"    | Manual entry          |
| All providers exhausted | tier: 'manual'           | Show quota message         | Manual entry only     |

### Whisper Agent (Agent 2)

| Error                 | Response                | User Impact              | Recovery                      |
| --------------------- | ----------------------- | ------------------------ | ----------------------------- |
| 429 Rate Limit        | Auto-retry next account | None (transparent)       | Round-robin across 4 accounts |
| Empty transcript      | Return empty text       | Show "Try again" message | User re-records               |
| Audio too short (<1s) | Reject at client        | Show validation error    | User records longer           |
| Network failure       | Show error toast        | See network error        | Retry button                  |

### Voice Parser (Agent 3)

| Error              | Response        | User Impact                        | Recovery                     |
| ------------------ | --------------- | ---------------------------------- | ---------------------------- |
| Invalid JSON       | Retry once      | Slight delay                       | Fallback to manual           |
| Empty items array  | Show transcript | User sees what was heard           | Manual entry                 |
| Unknown food names | Pass through    | MultiItemConfirm shows "Not found" | User edits or creates custom |

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

| Agent        | Calls/Day | Provider    | Cost/Call | Daily Cost | Monthly Cost |
| ------------ | --------- | ----------- | --------- | ---------- | ------------ |
| Vision       | 750       | Groq (free) | $0        | $0         | $0           |
| Whisper      | 140       | Groq (free) | $0        | $0         | $0           |
| Voice Parser | 140       | Groq (free) | $0        | $0         | $0           |
| **Total**    | **1,030** | —           | —         | **$0**     | **$0**       |

**At 2,500 DAU (upgrade trigger):**

| Agent        | Calls/Day | Provider    | Cost/Call | Daily Cost | Monthly Cost |
| ------------ | --------- | ----------- | --------- | ---------- | ------------ |
| Vision       | 3,750     | Groq (paid) | $0.0005   | $1.88      | $56          |
| Whisper      | 700       | Groq (free) | $0        | $0         | $0           |
| Voice Parser | 700       | Groq (free) | $0        | $0         | $0           |
| **Total**    | **5,150** | —           | —         | **$1.88**  | **~$56**     |

**Upgrade path:** Vision API only (Whisper + Llama stay free until much higher scale)

---

_AGENTS.md v1.0 — NutriKulcha AI. Complete documentation of all AI agents, prompts, configurations, and monitoring._
