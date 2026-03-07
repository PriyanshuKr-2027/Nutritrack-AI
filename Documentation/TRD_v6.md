# NutriTrack AI — Technical Requirements Document (v6)
**Version:** 6.0 | **Date:** March 2026 | **Changes:** Added auto-add nutrition system

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
│  Photo mode:  Round-Robin Router → Groq/OpenRouter      │
│  Voice mode:  Groq Whisper → Groq Llama 3.1 8B          │
│  Auto-add:    OpenFoodFacts API → Llama 70B (nutrition) │
│                                                         │
│  All API keys in Supabase secrets — never in app binary │
└─────────────────────────────────────────────────────────┘
```

**Core principle:** AI identifies food names. Nutrition comes from database (IFCT/USDA) OR auto-generated via OpenFoodFacts/LLM and stored permanently. Database grows organically from real user data.

---

## 2. API Provider Stack

### Vision — Photo Flow

| Priority | Provider | Model | Free/day | RPM Limit | Notes |
|---|---|---|---|---|---|
| 1 | Groq Account 1 | llama-4-scout-17b-16e-instruct | 1,000 | 30 | Primary |
| 2 | Groq Account 2 | llama-4-scout-17b-16e-instruct | 1,000 | 30 | Secondary |
| 3 | Groq Account 3 | llama-4-scout-17b-16e-instruct | 1,000 | 30 | Tertiary |
| 4 | Groq Account 4 | llama-4-scout-17b-16e-instruct | 1,000 | 30 | Buffer |
| 5 | OpenRouter | qwen/qwen3-vl:free | 200 | 60 | Different provider backup |

**Total free vision: 4,200/day → covers ~3,000 DAU**

### Voice — Separate Groq Quota Buckets

| Step | Model | Free/day (×4 accounts) | RPM Limit | Notes |
|---|---|---|---|---|
| Transcription | whisper-large-v3 | 8,000 | 20 | Hinglish: use language=hi |
| Food parsing | llama-3.1-8b-instant | 57,600 | 30 | Text-only, cheap |

### **Nutrition Auto-Add (NEW in v6)**

| Step | Provider | Model/API | Free/day | Notes |
|---|---|---|---|---|
| 1. Check OpenFoodFacts | OpenFoodFacts API | — | Unlimited | Real product data |
| 2. Fallback to LLM | Groq Account 1-4 | llama-3.1-70b-versatile | 1,000/account | Generic nutrition data |

**Total nutrition lookups: 4,000/day** (separate from vision quota)

Voice never consumes vision quota. Nutrition lookup never consumes vision quota. All separate Groq rate limit buckets.

### Barcode + Label Scan — Zero/Minimal API Calls
- **Barcode scan:** OpenFoodFacts API lookup (free, unlimited)
- **Label OCR:** On-device via `rn-mlkit-ocr` (Google ML Kit, zero API calls)
- **Combined flow:** Try barcode first, fallback to label OCR if not found

---

## 3. Round-Robin Load Balancer

[Same as v5 - no changes to this section]

### Problem Statement
**Previous approach (v4):** Sequential failover where all traffic goes to Account 1 until daily budget exhausted, then switches to Account 2, etc.

**Issue:** Account 1 hits **30 requests/minute** rate limit during peak usage (even with budget remaining), while Accounts 2-4 sit idle. System fails unnecessarily.

### Solution: Round-Robin Distribution

```typescript
// supabase/functions/food-detect/index.ts

interface Provider {
  id: string;
  key: string;
  dailyBudget: number;
  endpoint: string;
  model: string;
  rpmLimit: number;
}

const VISION_PROVIDERS: Provider[] = [
  { 
    id: 'groq_1', 
    key: Deno.env.get('GROQ_KEY_1')!, 
    dailyBudget: 950,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    rpmLimit: 30
  },
  { 
    id: 'groq_2', 
    key: Deno.env.get('GROQ_KEY_2')!, 
    dailyBudget: 950,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    rpmLimit: 30
  },
  { 
    id: 'groq_3', 
    key: Deno.env.get('GROQ_KEY_3')!, 
    dailyBudget: 950,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    rpmLimit: 30
  },
  { 
    id: 'groq_4', 
    key: Deno.env.get('GROQ_KEY_4')!, 
    dailyBudget: 950,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    rpmLimit: 30
  },
  { 
    id: 'openrouter', 
    key: Deno.env.get('OPENROUTER_KEY')!, 
    dailyBudget: 180,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen3-vl:free',
    rpmLimit: 60
  },
];

// Global round-robin counter (persists across function invocations via Supabase state)
let roundRobinIndex = 0;

async function getNextVisionProvider(supabase: any): Promise<Provider | null> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's usage from database
  const { data: usageData } = await supabase
    .from('api_daily_usage')
    .select('provider, call_count')
    .eq('date', today);
  
  const usageMap = Object.fromEntries(
    usageData?.map((u: any) => [u.provider, u.call_count]) || []
  );
  
  // Filter providers under daily budget
  const availableProviders = VISION_PROVIDERS.filter(
    p => (usageMap[p.id] ?? 0) < p.dailyBudget
  );
  
  if (availableProviders.length === 0) {
    return null; // All providers exhausted
  }
  
  // Round-robin: cycle through available providers
  const selectedProvider = availableProviders[roundRobinIndex % availableProviders.length];
  roundRobinIndex++;
  
  console.log(`[Load Balancer] Selected: ${selectedProvider.id} (index: ${roundRobinIndex - 1}, available: ${availableProviders.length})`);
  
  return selectedProvider;
}

// Call vision API with retry on rate limit (429)
async function callVisionAPI(
  provider: Provider,
  imageBase64: string,
  visionPrompt: string,
  supabase: any
): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              { 
                type: 'image_url', 
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ],
        response_format: provider.id === 'openrouter' ? undefined : { type: 'json_object' },
        max_tokens: 1000,
      })
    });
    
    // Handle rate limit (429)
    if (response.status === 429) {
      console.log(`[Rate Limit] ${provider.id} hit 429, trying next provider`);
      
      // Get next available provider
      const nextProvider = await getNextVisionProvider(supabase);
      if (!nextProvider) {
        throw new Error('All providers exhausted or rate limited');
      }
      
      // Retry with next provider
      return await callVisionAPI(nextProvider, imageBase64, visionPrompt, supabase);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Record successful usage
    await supabase.rpc('increment_api_usage', {
      p_provider: provider.id,
      p_date: today
    });
    
    const data = await response.json();
    return { data, provider: provider.id };
    
  } catch (error) {
    console.error(`[API Error] ${provider.id}:`, error);
    
    // Try next provider on any error
    const nextProvider = await getNextVisionProvider(supabase);
    if (!nextProvider) {
      throw error; // Re-throw if no providers left
    }
    
    return await callVisionAPI(nextProvider, imageBase64, visionPrompt, supabase);
  }
}
```

### Benefits of Round-Robin

1. **Distributes Load**: All 4 Groq accounts share traffic equally
2. **Prevents RPM Bottleneck**: No single account hits 30 req/min limit
3. **Maximizes Capacity**: Uses full 4,200 daily budget effectively
4. **Auto-Recovery**: Automatically retries with next provider on rate limit (429)
5. **Simple Implementation**: Minimal state management (just incrementing counter)

---

## 4. Auto-Add Nutrition System (NEW IN V6)

### Overview

**Problem:** Small pre-seeded database (528 IFCT foods) means frequent "food not found" scenarios.

**Solution:** Automatically fetch and store nutrition data for any food detected by AI but not in database.

**Result:** Database grows organically from 528 → 15,000+ foods over 3 months with ZERO manual curation.

### Architecture

```
AI detects: "Paneer Tikka Masala"
    ↓
Check database (priority order):
  1. ifct_foods → Not found
  2. usda_foods → Not found  
  3. ai_generated_foods → Not found
    ↓
Auto-fetch nutrition:
  Step 1: Try OpenFoodFacts API (real product data)
  Step 2: Fallback to Groq Llama 70B (generic nutrition)
    ↓
Auto-insert into ai_generated_foods table
    ↓
Return to user (seamless, no manual entry needed)
    ↓
Next user who photographs same food → instant DB hit! ✅
```

### Implementation

```typescript
// supabase/functions/food-detect/nutrition-lookup.ts

async function getNutritionForFood(
  foodName: string,
  supabase: any
): Promise<NutritionData> {
  
  // Step 1: Try OpenFoodFacts API (free, real data)
  try {
    const offResponse = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&json=true&page_size=1`
    );
    
    const offData = await offResponse.json();
    
    if (offData.products && offData.products.length > 0) {
      const product = offData.products[0];
      const nutriments = product.nutriments;
      
      if (nutriments.energy_kcal_100g) {
        console.log(`[Nutrition] Found in OpenFoodFacts: ${foodName}`);
        
        return {
          calories_per_100g: nutriments['energy-kcal_100g'] || nutriments.energy_kcal_100g,
          protein_per_100g: nutriments.proteins_100g || 0,
          carbs_per_100g: nutriments.carbohydrates_100g || 0,
          fat_per_100g: nutriments.fat_100g || 0,
          fiber_per_100g: nutriments.fiber_100g || 0,
          source: 'openfoodfacts',
          confidence: 0.95
        };
      }
    }
  } catch (error) {
    console.log(`[Nutrition] OpenFoodFacts failed for ${foodName}, trying LLM`);
  }
  
  // Step 2: Fallback to Groq Llama 70B (AI estimation)
  const llmNutrition = await getLLMNutrition(foodName);
  return llmNutrition;
}

async function getLLMNutrition(foodName: string): Promise<NutritionData> {
  const prompt = `You are a nutrition database. Provide accurate per-100g nutrition data for the following food. Use average values from reliable sources. Return ONLY valid JSON with no explanations or markdown.

Food: ${foodName}

Return format:
{
  "calories": 250,
  "protein": 12.5,
  "carbs": 8.0,
  "fat": 18.0,
  "fiber": 1.5
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_KEY_1')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile', // Better factual accuracy than 8B
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for factual data
      max_tokens: 300
    })
  });
  
  const data = await response.json();
  const nutrition = JSON.parse(data.choices[0].message.content);
  
  console.log(`[Nutrition] LLM generated for ${foodName}:`, nutrition);
  
  return {
    calories_per_100g: nutrition.calories,
    protein_per_100g: nutrition.protein,
    carbs_per_100g: nutrition.carbs,
    fat_per_100g: nutrition.fat,
    fiber_per_100g: nutrition.fiber || 0,
    source: 'ai_generated',
    confidence: 0.85
  };
}

// Main lookup function with auto-add
async function lookupNutritionWithAutoAdd(
  foodName: string,
  supabase: any
): Promise<FoodEntry> {
  
  // Check existing databases (priority order)
  const existingFood = await supabase
    .rpc('search_all_foods', { search_term: foodName })
    .single();
  
  if (existingFood.data) {
    console.log(`[Nutrition] Found in existing DB: ${foodName}`);
    return existingFood.data;
  }
  
  // Not found → Auto-generate nutrition
  console.log(`[Nutrition] Not found, auto-adding: ${foodName}`);
  
  const nutritionData = await getNutritionForFood(foodName, supabase);
  
  // Insert into ai_generated_foods table
  const { data: newFood, error } = await supabase
    .from('ai_generated_foods')
    .insert({
      name: foodName,
      calories_per_100g: nutritionData.calories_per_100g,
      protein_per_100g: nutritionData.protein_per_100g,
      carbs_per_100g: nutritionData.carbs_per_100g,
      fat_per_100g: nutritionData.fat_per_100g,
      fiber_per_100g: nutritionData.fiber_per_100g,
      source: nutritionData.source,
      confidence: nutritionData.confidence,
      times_used: 1
    })
    .select()
    .single();
  
  if (error) {
    // Handle race condition (another user added same food simultaneously)
    if (error.code === '23505') { // unique_violation
      console.log(`[Nutrition] Race condition, food already added by another user`);
      const { data } = await supabase
        .from('ai_generated_foods')
        .select()
        .eq('name', foodName)
        .single();
      return data;
    }
    throw error;
  }
  
  console.log(`[Nutrition] Auto-added to DB: ${foodName}`);
  return newFood;
}
```

### Database Schema Updates

```sql
-- New table for AI-generated nutrition data
CREATE TABLE ai_generated_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  calories_per_100g NUMERIC NOT NULL,
  protein_per_100g NUMERIC DEFAULT 0,
  carbs_per_100g NUMERIC DEFAULT 0,
  fat_per_100g NUMERIC DEFAULT 0,
  fiber_per_100g NUMERIC DEFAULT 0,
  
  -- Metadata
  source TEXT NOT NULL CHECK (source IN ('openfoodfacts', 'ai_generated')),
  confidence NUMERIC DEFAULT 0.85 CHECK (confidence >= 0 AND confidence <= 1),
  times_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Full-text search
  name_search TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name)) STORED
);

CREATE INDEX ai_foods_search ON ai_generated_foods USING GIN (name_search);
CREATE INDEX ai_foods_usage ON ai_generated_foods (times_used DESC);
CREATE INDEX ai_foods_created ON ai_generated_foods (created_at DESC);

-- Function to search all food tables in priority order
CREATE OR REPLACE FUNCTION search_all_foods(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  source TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  -- Priority 1: IFCT (verified Indian foods)
  RETURN QUERY
  SELECT 
    ifct_foods.id,
    ifct_foods.name,
    ifct_foods.calories_per_100g,
    ifct_foods.protein_per_100g,
    ifct_foods.carbs_per_100g,
    ifct_foods.fat_per_100g,
    ifct_foods.fiber_per_100g,
    'ifct'::TEXT as source
  FROM ifct_foods
  WHERE ifct_foods.name ILIKE '%' || search_term || '%'
  LIMIT 1;
  
  IF FOUND THEN RETURN; END IF;
  
  -- Priority 2: USDA (verified general foods)
  RETURN QUERY
  SELECT 
    usda_foods.id,
    usda_foods.name,
    usda_foods.calories_per_100g,
    usda_foods.protein_per_100g,
    usda_foods.carbs_per_100g,
    usda_foods.fat_per_100g,
    0::NUMERIC as fiber_per_100g,
    'usda'::TEXT as source
  FROM usda_foods
  WHERE usda_foods.name ILIKE '%' || search_term || '%'
  LIMIT 1;
  
  IF FOUND THEN RETURN; END IF;
  
  -- Priority 3: AI-generated (auto-added from user detections)
  RETURN QUERY
  SELECT 
    ai_generated_foods.id,
    ai_generated_foods.name,
    ai_generated_foods.calories_per_100g,
    ai_generated_foods.protein_per_100g,
    ai_generated_foods.carbs_per_100g,
    ai_generated_foods.fat_per_100g,
    ai_generated_foods.fiber_per_100g,
    ai_generated_foods.source
  FROM ai_generated_foods
  WHERE ai_generated_foods.name ILIKE '%' || search_term || '%'
  ORDER BY times_used DESC, confidence DESC
  LIMIT 1;
  
  RETURN;
END;
$$;

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_food_usage(food_id UUID, food_table TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF food_table = 'ai_generated' THEN
    UPDATE ai_generated_foods 
    SET times_used = times_used + 1, updated_at = now()
    WHERE id = food_id;
  END IF;
END;
$$;
```

### Updated Photo Flow with Auto-Add

```
User takes photo
    ↓
Camera → ScanningView → Edge Function
    ↓
Groq Vision detects: ["Paneer Tikka Masala", "Naan", "Raita"]
    ↓
For each food name:
  ┌─────────────────────────────────────┐
  │ lookupNutritionWithAutoAdd()        │
  │                                     │
  │ 1. Check ifct_foods                 │
  │    "Paneer Tikka Masala" → ❌       │
  │                                     │
  │ 2. Check usda_foods → ❌            │
  │                                     │
  │ 3. Check ai_generated_foods → ❌    │
  │                                     │
  │ 4. Call getNutritionForFood():      │
  │    - Try OpenFoodFacts → ❌         │
  │    - Fallback to Llama 70B → ✅     │
  │      Returns: {calories: 180, ...}  │
  │                                     │
  │ 5. Insert into ai_generated_foods   │
  │                                     │
  │ 6. Return nutrition to Edge Func    │
  └─────────────────────────────────────┘
    ↓
Repeat for "Naan":
  - Found in IFCT ✅ (no auto-add needed)
    ↓
Repeat for "Raita":
  - Found in IFCT ✅ (no auto-add needed)
    ↓
Edge Function returns to app:
  [
    {name: "Paneer Tikka Masala", calories_per_100g: 180, source: "ai_generated"},
    {name: "Naan", calories_per_100g: 260, source: "ifct"},
    {name: "Raita", calories_per_100g: 62, source: "ifct"}
  ]
    ↓
MultiItemConfirmView shows all 3 items with nutrition
    ↓
User adjusts portions via sliders → Confirms
    ↓
Saved to meals table
    ↓
Next user who photographs "Paneer Tikka Masala":
  → Found in ai_generated_foods ✅
  → No API call needed!
  → Database grows smarter! 🎉
```

### Cost Analysis with Auto-Add

```
Week 1 (DB has 528 IFCT foods):
  500 DAU × 3 photos/day = 1,500 photos
  
  Vision calls: 1,500 (detect food names)
  Foods detected: 4,500 items total
  Already in DB: 2,250 (50% hit IFCT)
  Need auto-add: 2,250 (50% not found)
  
  Nutrition LLM calls: 500 unique new foods × 1 call = 500
  (Many users photograph same foods, so deduplication happens)
  
  Total API calls: 1,500 vision + 500 nutrition = 2,000/day
  Cost: $0 (within free tier)

Week 4 (DB grown to ~3,000 foods):
  1,500 photos/day
  Foods detected: 4,500
  Already in DB: 3,600 (80% hit rate)
  Need auto-add: 900
  
  Nutrition LLM calls: 150 unique new foods
  Total API calls: 1,500 vision + 150 nutrition = 1,650/day
  Cost: $0

Month 3 (DB grown to ~15,000 foods):
  1,500 photos/day
  Foods detected: 4,500
  Already in DB: 4,400 (97% hit rate)
  Need auto-add: 100
  
  Nutrition LLM calls: 20 unique new foods
  Total API calls: 1,500 vision + 20 nutrition = 1,520/day
  Cost: $0
  
User experience: SEAMLESS (no manual entry ever) ✅
```

### Quota Usage

```
Groq Account 1-4 (each):
  Vision (Llama 4 Scout): 1,000 requests/day
  Nutrition (Llama 70B): 1,000 requests/day
  
  Separate buckets → No conflict!
```

---

## 5. Voice Mode — On-Device vs Cloud Analysis

[Same as v5 - no changes]

**Decision:** Keep cloud-based Groq Whisper (accuracy > latency)

---

## 6. Client-Side: Three-Tier Detection

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
  Vision AI detects food names
  Auto-lookup/auto-add nutrition for each food
  Returns complete nutrition data
  → MultiItemConfirmView populated (SEAMLESS, no manual entry)
```

---

## 7. Nutrition Lookup Pipeline (UPDATED)

```
For each detected food name:

1. Search ifct_foods (Supabase)           → 528 verified Indian foods
2. Search usda_foods (Supabase)           → Pre-seeded general foods (optional)
3. Search ai_generated_foods (Supabase)   → Community-generated database
4. If still not found:
   a. Try OpenFoodFacts API               → Real product nutrition data (free)
   b. Fallback to Groq Llama 70B          → AI-estimated nutrition
   c. Auto-insert into ai_generated_foods → Permanent storage
5. Return nutrition to user               → SEAMLESS (no manual entry)

User NEVER sees "food not found" → Always gets nutrition data automatically

Calculation (always deterministic):
  calories = (weight_g / 100) × calories_per_100g
  protein  = (weight_g / 100) × protein_per_100g
  ... etc

weight_g = from user-confirmed portion on MultiItemConfirmView
```

---

## 8. Barcode + Label Scan — Combined Flow (UPDATED)

### Overview

**Single screen handles BOTH barcode scanning AND nutrition label OCR.**

Users point camera at packaged food → System tries barcode first → Falls back to OCR if needed.

### Barcode Scanning

**Library:** `expo-barcode-scanner`
**Cost:** $0 — Built into Expo, no additional dependencies

**Lookup source:** OpenFoodFacts API (free, 2.8M+ products)
```
https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

**Flow:**
```
ScanLabelView (camera + barcode scanner active)
  → Barcode detected (EAN-13, UPC-A, etc.)
  → Fetch from OpenFoodFacts API
  → If found: Pre-fill LabelResultView with barcode data
  → If not found: Show "Scan nutrition label instead"
  → User taps screen → Capture image for OCR
```

**Implementation:**
```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

const handleBarCodeScanned = async ({ data }) => {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${data}.json?fields=product_name,nutriments`
  );
  
  const product = await response.json();
  
  if (product.status === 1) {
    // Product found in OpenFoodFacts
    const nutrition = {
      name: product.product.product_name,
      energy_kcal: product.product.nutriments['energy-kcal_100g'],
      protein_g: product.product.nutriments.proteins_100g,
      carbs_g: product.product.nutriments.carbohydrates_100g,
      fat_g: product.product.nutriments.fat_100g,
      sodium_mg: product.product.nutriments.sodium_100g,
      sugar_g: product.product.nutriments.sugars_100g,
      serving_size: product.product.serving_size,
      source: 'openfoodfacts',
      confidence: 0.98
    };
    
    navigate('LabelResultView', { mode: 'barcode', nutrition });
  } else {
    // Barcode not in database → fallback to OCR
    showMessage('Product not found. Scan nutrition label instead.');
  }
};
```

### Label OCR (Fallback)

**Library:** `rn-mlkit-ocr`
**Cost:** $0 — Google ML Kit, fully on-device

```
ScanLabelView (if barcode not detected or user taps to capture)
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

**Regex extraction patterns:**
```typescript
const patterns = {
  energy_kcal: /energy[:\s]+(\d+)\s*kcal/i,
  energy_kj: /energy[:\s]+(\d+)\s*kj/i, // Convert: kJ ÷ 4.184 = kcal
  protein_g: /protein[:\s]+(\d+\.?\d*)\s*g/i,
  carbs_g: /carbohydrate[s]?[:\s]+(\d+\.?\d*)\s*g/i,
  fat_g: /(?:total\s+)?fat[:\s]+(\d+\.?\d*)\s*g/i,
  sodium_mg: /sodium[:\s]+(\d+\.?\d*)\s*mg/i,
  sugar_g: /sugar[s]?[:\s]+(\d+\.?\d*)\s*g/i,
  serving_size: /serving size[:\s]+(.+?)(?:\n|$)/i
};
```

### Combined UI Flow

```
User taps FAB → "Scan Label"
    ↓
ScanLabelView opens
    ↓
Camera shows live preview with:
  - Green scanning frame (same as current design)
  - Instruction text: "Point at barcode or nutrition label"
  - Barcode scanner active in background
    ↓
┌─ PATH A: Barcode Detected ─────────────────┐
│  expo-barcode-scanner fires callback       │
│  → Call OpenFoodFacts API (instant)        │
│  → If found: LabelResultView (pre-filled)  │
│  → If not found: Show message, wait for OCR│
└────────────────────────────────────────────┘
    ↓
┌─ PATH B: User Taps to Capture ─────────────┐
│  Capture image → rn-mlkit-ocr             │
│  → Extract text via regex                  │
│  → LabelResultView (pre-filled from OCR)   │
└────────────────────────────────────────────┘
    ↓
LabelResultView
  - Product name (if barcode) or "Packaged Food" (if OCR)
  - All nutrition fields editable
  - Serving count stepper
  - Live total calculation
    ↓
Confirm → FinalResultsView → Dashboard
```

### Priority System

**Barcode data (OpenFoodFacts) has HIGHER priority than OCR:**

1. Barcode found → Use OpenFoodFacts nutrition (98% confidence)
2. Barcode not found → Fall back to OCR (85% confidence, user-editable)
3. Both fail → User manually enters values

**Why barcode is better:**
- ✅ Instant (no OCR processing time)
- ✅ More accurate (manufacturer data)
- ✅ Includes product name
- ✅ Covers Indian brands (Maggi, Parle-G, Amul, Britannia, Haldiram's, etc.)

### Coverage Analysis

**Indian packaged foods in OpenFoodFacts:**
- Maggi: ✅ Full range
- Parle: ✅ Parle-G, Monaco, Krackjack
- Britannia: ✅ Good Day, Marie, NutriChoice
- Amul: ✅ Butter, Cheese, Milk
- Haldiram's: ✅ Most namkeen varieties
- ITC: ✅ Aashirvaad, Sunfeast
- Nestlé: ✅ KitKat, Munch, Maggi

**Coverage:** ~70% of Indian packaged foods have barcodes in OpenFoodFacts

**For remaining 30%:** Label OCR handles nutrition labels on regional/local brands

---

## 9. Label Scan — On-Device OCR

[Same as v5 - no changes]

---

## 9. Database Schema (UPDATED)

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
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- IFCT Indian foods (pre-seeded, 528 foods)
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

-- USDA foods (optional, can skip pre-seeding with auto-add system)
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

-- AI-generated foods (NEW - auto-populated from user detections)
CREATE TABLE ai_generated_foods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  calories_per_100g NUMERIC NOT NULL,
  protein_per_100g  NUMERIC DEFAULT 0,
  carbs_per_100g    NUMERIC DEFAULT 0,
  fat_per_100g      NUMERIC DEFAULT 0,
  fiber_per_100g    NUMERIC DEFAULT 0,
  source            TEXT NOT NULL CHECK (source IN ('openfoodfacts', 'ai_generated')),
  confidence        NUMERIC DEFAULT 0.85 CHECK (confidence >= 0 AND confidence <= 1),
  times_used        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  name_search       TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name)) STORED
);
CREATE INDEX ai_foods_search ON ai_generated_foods USING GIN (name_search);
CREATE INDEX ai_foods_usage ON ai_generated_foods (times_used DESC);

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
  food_source       TEXT CHECK (food_source IN ('ifct','usda','ai_generated','label')),
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

-- Helper function: Search all food tables
CREATE OR REPLACE FUNCTION search_all_foods(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  source TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  -- Priority 1: IFCT
  RETURN QUERY
  SELECT i.id, i.name, i.calories_per_100g, i.protein_per_100g, 
         i.carbs_per_100g, i.fat_per_100g, i.fiber_per_100g, 'ifct'::TEXT
  FROM ifct_foods i
  WHERE i.name ILIKE '%' || search_term || '%'
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;
  
  -- Priority 2: USDA
  RETURN QUERY
  SELECT u.id, u.name, u.calories_per_100g, u.protein_per_100g,
         u.carbs_per_100g, u.fat_per_100g, 0::NUMERIC, 'usda'::TEXT
  FROM usda_foods u
  WHERE u.name ILIKE '%' || search_term || '%'
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;
  
  -- Priority 3: AI-generated (sorted by usage)
  RETURN QUERY
  SELECT a.id, a.name, a.calories_per_100g, a.protein_per_100g,
         a.carbs_per_100g, a.fat_per_100g, a.fiber_per_100g, a.source
  FROM ai_generated_foods a
  WHERE a.name ILIKE '%' || search_term || '%'
  ORDER BY a.times_used DESC, a.confidence DESC
  LIMIT 1;
  
  RETURN;
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

-- ai_generated_foods is READ-ONLY for all users (community database)
ALTER TABLE ai_generated_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_foods_read_all" ON ai_generated_foods FOR SELECT USING (true);
CREATE POLICY "ai_foods_insert_authenticated" ON ai_generated_foods FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 10. Environment Variables

[Same as v5 - no changes]

---

## 11. Libraries

| Package | Purpose |
|---|---|
| `expo-camera` | Photo capture |
| `expo-barcode-scanner` | Barcode scanning for packaged foods |
| `expo-av` | Voice recording (m4a) |
| `expo-image-manipulator` | Compress photos before sending |
| `expo-file-system` | Read files as base64 |
| `rn-mlkit-ocr` | On-device nutrition label OCR |
| `@supabase/supabase-js` | All DB + Edge Function calls |
| `expo-secure-store` | JWT token storage |
| `@tanstack/react-query` | Server state |
| `zustand` | Local UI state |
| `@react-native-async-storage/async-storage` | Meal pattern cache |

**Optional (for future on-device voice):** `expo-speech-recognition`

**Removed vs v3:** `@react-native-voice/voice`, `@tensorflow/tfjs-*` — no longer needed.

---

## 12. Capacity Math

```
At 500 DAU (Week 1):
  Photo vision calls: 500 × 3 = 1,500/day
  Nutrition LLM calls: ~500/day (unique new foods)
  Voice calls: 500 × 1 × 40% = 200/day
  
  Total API calls: 2,200/day
  Vision capacity: 4,200/day (19% utilization)
  Nutrition capacity: 4,000/day (12.5% utilization)
  Cost: $0

At 500 DAU (Month 3 - DB matured):
  Photo vision calls: 1,500/day
  Nutrition LLM calls: ~20/day (most foods in DB)
  Voice calls: 200/day
  
  Total API calls: 1,720/day
  Vision capacity: 4,200/day (36% utilization)
  Nutrition capacity: 4,000/day (<1% utilization)
  Cost: $0
  
Database growth:
  Week 1: 528 foods
  Month 1: ~3,000 foods
  Month 3: ~15,000 foods
  Month 6: ~20,000 foods (plateau, covers 99% of user meals)
  
Upgrade trigger: ~2,500 DAU sustained
```

---

## 13. Changes from v5

1. ✅ **Added auto-add nutrition system** (Section 4)
2. ✅ **New database table:** `ai_generated_foods`
3. ✅ **New API tier:** OpenFoodFacts + Llama 70B for nutrition
4. ✅ **Updated nutrition lookup pipeline** (Section 7)
5. ✅ **Database grows organically** from 528 → 15,000+ foods
6. ✅ **Zero manual curation** required
7. ✅ **Seamless UX** - user never sees "food not found"
8. ✅ **USDA pre-seeding now optional** (can skip with auto-add)

**Core benefit:** Start with minimal DB (528 foods), let system auto-populate from real user data. Database becomes comprehensive over time with ZERO manual effort.

---

*TRD v6 — NutriTrack AI. Auto-add nutrition system, round-robin load balancing, seamless UX with zero manual food entry.*
