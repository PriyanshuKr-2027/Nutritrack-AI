# NutriTrack AI — Implementation Plan v2
**Version:** 2.0 | **Date:** March 2026 | **Changes:** Auto-add nutrition system

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
14. Onboarding flow

**Acceptance criteria:** Each screen renders on device, all buttons are tappable, animations are smooth.

---

## Module 1 — Supabase Setup (UPDATED)

**What:** Database schema, RLS, auth, Edge Function skeleton. **Includes new ai_generated_foods table.**

**Prompt:**
```
Set up a Supabase project for NutriTrack AI, a food logging app with auto-add nutrition system.

Run these migrations in order:

1. profiles table (extends auth.users)
2. ifct_foods table (Indian Food Composition Tables, 528 foods - pre-seed later)
3. usda_foods table (OPTIONAL - can skip with auto-add system)
4. ai_generated_foods table (NEW - auto-populated from OpenFoodFacts/LLM)
5. meals table (with detection_source column)
6. meal_items table (food_source now includes 'ai_generated')
7. label_nutrients table
8. api_daily_usage table + increment_api_usage RPC function
9. search_all_foods() function (searches ifct → usda → ai_generated in priority order)

Enable RLS on profiles, meals, meal_items.
ai_generated_foods: SELECT for all, INSERT for authenticated only.
ifct_foods and usda_foods: read-only for all authenticated users.

[paste full schema from TRD_v6.md Section 9]

IMPORTANT: The ai_generated_foods table is where the system automatically stores
nutrition data for foods not found in IFCT/USDA. This grows organically from user data.
```

**After schema:**
```
Create a Supabase client in lib/supabase.ts:
- Use expo-secure-store as the auth storage adapter
- autoRefreshToken: true, persistSession: true
- Export typed supabase client
- Include a useSession hook that returns current user
```

**Acceptance criteria:** Tables created including ai_generated_foods, RLS active, search_all_foods() function works.

---

## Module 2 — Authentication

[Same as v1 - no changes]

---

## Module 3 — Onboarding + User Goals

[Same as v1 - no changes]

---

## Module 4 — Food Database Seeding (SIMPLIFIED)

**What:** Seed ONLY IFCT data (528 foods). USDA seeding is now OPTIONAL with auto-add system.

**Prompt:**
```
Seed the NutriTrack AI food database with Indian foods only.

IFCT (Indian Food Composition Tables):
The IFCT dataset has 528 Indian foods. Create a seed file with at minimum these entries
with accurate per-100g values from the IFCT 2017 publication:

Essential entries:
- Staples: dal (yellow/black/masoor/toor/moong/rajma/chole), chawal/rice (white/brown), 
  roti, chapati, paratha, puri, bhatura, naan
- Curries: palak paneer, matar paneer, kadai paneer, aloo gobhi, bhindi masala, mix veg
- South Indian: dosa (plain/masala/rava), idli, vada, sambar, rasam, coconut chutney
- Snacks: samosa, pakode, pav bhaji, chole bhature, aloo tikki, dhokla
- Sides: raita, papad, achaar, chutneys (green/red/coconut)
- Sweets: gulab jamun, jalebi, kheer, halwa, ladoo
- Rice dishes: biryani, pulao, khichdi, curd rice

Write a seed script that inserts these into ifct_foods table via Supabase service role key.
Use batches of 100 for efficiency.

USDA Seeding (OPTIONAL):
You can skip USDA seeding entirely. The auto-add system will handle any foods not in IFCT
by fetching from OpenFoodFacts API or generating via LLM, then permanently storing in
ai_generated_foods table.

If you still want to pre-seed USDA (~5,000 foods for better initial coverage):
Download USDA FoodData Central Foundation Foods JSON from:
https://fdc.nal.usda.gov/download-data.html

Filter to common items and insert into usda_foods table.
```

**Acceptance criteria:** SearchFoodView finds "dal", "samosa", "biryani" with accurate IFCT nutrition. USDA seeding optional (system works fine without it).

**Time saved:** 20-30 hours (no USDA curation needed with auto-add)

---

## Module 5 — Food Search + Manual Entry

[Same as v1 - no changes to search/manual entry UI]

---

## Module 6 — Edge Function: food-detect (UPDATED)

**What:** Deploy the Supabase Edge Function with **round-robin load balancing** and **auto-add nutrition system**.

**Prompt:**
```
Create a Supabase Edge Function called food-detect with round-robin load balancing
and auto-add nutrition system for NutriTrack AI.

File: supabase/functions/food-detect/index.ts

Requirements:

1. Auth: reject requests without valid Supabase JWT

2. Photo mode ({ mode: 'photo', imageBase64: string }):
   
   ROUND-ROBIN LOAD BALANCING (NEW):
   - Track api_daily_usage for today
   - Global counter roundRobinIndex
   - Filter providers under budget: groq_1(950) → groq_2(950) → groq_3(950) → groq_4(950) → openrouter(180)
   - Select: availableProviders[roundRobinIndex % length]
   - roundRobinIndex++
   - On 429 rate limit: auto-retry with next provider
   - [paste round-robin code from TRD_v6.md Section 3]
   
   VISION AI:
   - Call selected provider's vision API with Indian food detection prompt
   - Return: food NAMES only (no nutrition)
   
   AUTO-ADD NUTRITION (NEW):
   For each detected food name:
     a. Call search_all_foods(food_name) RPC
     b. If found in ifct/usda/ai_generated → use existing nutrition
     c. If NOT found → call getNutritionForFood(food_name):
        - Try OpenFoodFacts API first (real product data)
        - Fallback to Groq Llama 70B (generic nutrition)
        - Insert into ai_generated_foods table
        - Return nutrition data
     d. Apply portion defaults from INDIAN_PORTION_DEFAULTS
   
   Return: { tier: 'api', provider, foods: FoodItemWithNutrition[], meal_type }
   
   If all providers exhausted: return { tier: 'manual', reason: 'daily_limit_reached' }

3. Voice mode ({ mode: 'voice', audioBase64: string, mimeType: string }):
   - Call Groq Whisper with language='hi' (Hindi handles Hinglish better)
   - Parse transcript with Groq Llama 3.1 8B using Hinglish food parser prompt
   - For each parsed food: call getNutritionForFood() (same auto-add logic)
   - Return: { transcript, items: VoiceItemWithNutrition[] }

4. Secrets: 
   GROQ_KEY_1, GROQ_KEY_2, GROQ_KEY_3, GROQ_KEY_4, OPENROUTER_KEY

5. Helper function: getNutritionForFood(foodName: string)
   [paste implementation from TRD_v6.md Section 4]

Vision prompt: [paste from TRD_v6.md Section 6 or ai_prompts.md]
Voice prompt: [paste from TRD_v6.md Section 7 or ai_prompts.md]
Nutrition prompt (Llama 70B): [paste from AGENTS.md Agent 4]

FoodItemWithNutrition: { 
  name: string, 
  portion: string, 
  calories_per_100g: number,
  protein_per_100g: number,
  carbs_per_100g: number,
  fat_per_100g: number,
  source: 'ifct'|'usda'|'ai_generated'|'openfoodfacts',
  confidence: number 
}

NO estimated_calories from photo — nutrition is generic per-100g data.
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

**Acceptance criteria:** 
- POST with test image returns foods WITH nutrition (no separate lookup needed)
- Foods not in IFCT auto-added to ai_generated_foods table
- Round-robin distributes load across 4 Groq accounts
- OpenFoodFacts API called before LLM fallback

---

## Module 7 — Photo Detection Flow (UPDATED)

**What:** Camera → ScanningView → MultiItemConfirmView → FinalResultsView wired end-to-end. **Nutrition now comes from Edge Function.**

**Prompt:**
```
Wire up the photo detection flow for NutriTrack AI with auto-add nutrition.

lib/foodDetect.ts:
  async function detectFoodFromPhoto(imageUri: string): Promise<FoodItem[]>:
    1. Validate: check file size (50KB-10MB), resolution (≥300×300)
    2. Compress: expo-image-manipulator resize to 1024px max, 80% JPEG quality
    3. Convert to base64: expo-file-system readAsStringAsync
    4. Call: supabase.functions.invoke('food-detect', { 
         body: { mode: 'photo', imageBase64 } 
       })
    5. Edge Function returns foods WITH nutrition already attached
    6. Apply portion defaults (if not already applied server-side)
    7. Map to FoodItem format for MultiItemConfirmView:
       - quantity: from portion or default 1
       - caloriesPerUnit: (defaultWeight / 100) × calories_per_100g
       - calories: caloriesPerUnit × quantity
    8. Return FoodItem[] or throw error

REMOVED: lib/nutritionLookup.ts (no longer needed - Edge Function handles this)

CameraView → ScanningView:
  - Pass capturedImage URI to ScanningView
  - ScanningView shows captured photo in circular pulsing container
  - Steps advance as Edge Function completes (single call, includes nutrition)
  - Step 1: "Photo validated" ✅
  - Step 2: "Identifying foods..." → "Fetching nutrition..." (happens server-side)
  - Step 3: "Complete" ✅
  - On timeout (10s): call onTimeout() → navigate to SearchFood

ScanningView → MultiItemConfirmView:
  - Pass populated FoodItem[] array (already has nutrition)
  - Pass capturedImage for header preview
  - User adjusts portions via sliders
  - Calories recalculate live: quantity × caloriesPerUnit

MultiItemConfirmView → FinalResultsView:
  - Save confirmed items to meals + meal_items tables
  - Include food_source: 'ifct'|'usda'|'ai_generated' from Edge Function response
  - Navigate to FinalResultsView with summary data
  - Then Dashboard on "Done"
```

**Acceptance criteria:** 
- Take photo of Indian food → items shown with nutrition immediately
- Foods not in DB automatically added (check ai_generated_foods table grows)
- Sliders adjust calories correctly
- Save includes correct food_source field

---

## Module 8 — Voice Logging Flow (UPDATED)

**What:** VoiceRecordView → Edge Function → MultiItemConfirmView wired end-to-end. **Nutrition now from Edge Function.**

**Prompt:**
```
Wire up the voice logging flow for NutriTrack AI with auto-add nutrition.

lib/voiceRecorder.ts:
  - startRecording(): request mic permission, expo-av Audio.Recording
  - stopRecording(): stop, return local URI of m4a file
  - Auto-stop after 15 seconds

lib/foodDetect.ts (add):
  async function detectFoodFromVoice(audioUri: string): Promise<{transcript: string, items: FoodItem[]}>:
    1. Read as base64 via expo-file-system
    2. Call: supabase.functions.invoke('food-detect', { 
         body: { mode: 'voice', audioBase64, mimeType: 'audio/m4a' } 
       })
    3. Edge Function returns { transcript, items } where items ALREADY HAVE NUTRITION
    4. Map items to FoodItem format for MultiItemConfirmView
    5. Return { transcript, items: FoodItem[] } or throw error

VoiceRecordView wiring:
  - idle → tap green mic → call startRecording()
  - recording → tap red stop → call stopRecording() → setState('processing')
  - processing → call detectFoodFromVoice() → show real Whisper transcript
  - complete → "Continue" → navigate to MultiItemConfirmView with:
      FoodItem[] (already has nutrition from Edge Function)

Hinglish examples to test:
  "dal chawal khaya"
  "aaj lunch mein 2 roti aur sabzi thi"
  "ek samosa aur chai"
  "biryani khaya half plate"
```

**Acceptance criteria:** 
- Record Hinglish → transcript shown → foods shown with nutrition
- Foods not in DB automatically added
- MultiItemConfirmView populated correctly

---

## Module 9 — Barcode + Label Scan Combined Flow (UPDATED)

**What:** ScanLabelView handles BOTH barcode scanning AND OCR in single screen.

**Prompt:**
```
Wire up the combined barcode + label scan flow for NutriTrack AI.

Install: npx expo install expo-barcode-scanner

lib/barcodeScanner.ts:
  async function lookupBarcode(barcode: string): Promise<ProductData | null>:
    1. Call OpenFoodFacts API:
       GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=product_name,nutriments
    2. If found (status === 1): return nutrition data
    3. If not found (status === 0): return null
    4. Handle errors gracefully (network timeout, invalid barcode)

lib/ocrParser.ts:
  function parseNutritionLabel(rawText: string): Partial<LabelData>:
    Extract with regex (case insensitive):
    - energy_kcal: /energy[:\\s]+(\\d+)\\s*kcal/i  (also handle kJ → ÷4.184)
    - protein_g: /protein[:\\s]+(\\d+\\.?\\d*)\\s*g/i
    - carbs_g: /carbohydrate[s]?[:\\s]+(\\d+\\.?\\d*)\\s*g/i
    - fat_g: /(?:total\\s+)?fat[:\\s]+(\\d+\\.?\\d*)\\s*g/i
    - sodium_mg: /sodium[:\\s]+(\\d+\\.?\\d*)\\s*mg/i
    - sugar_g: /sugar[s]?[:\\s]+(\\d+\\.?\\d*)\\s*g/i
    - serving_size: /serving size[:\\s]+(.+?)(?:\\n|$)/i
    Missing fields return "" (empty string, user can fill in)

ScanLabelView:
  - Use BarCodeScanner component with live camera preview
  - Show green scanning frame (same as current design)
  - Instruction text: "Point at barcode or nutrition label"
  - Barcode scanner active in background
  
  On barcode detected:
    → Call lookupBarcode(barcode)
    → If found: Navigate to LabelResultView with barcode data (source='openfoodfacts', confidence=0.98)
    → If not found: Show toast "Product not in database. Scan nutrition label instead."
  
  User taps "Scan Label" button or waits 3s without barcode:
    → Capture image
    → Call rn-mlkit-ocr.recognizeText(imageUri)
    → Call parseNutritionLabel(rawText)
    → Navigate to LabelResultView with OCR data (source='ocr', confidence=0.85)

LabelResultView:
  - Product name (if barcode) or "Packaged Food" (if OCR)
  - All fields pre-filled from barcode/OCR, all editable
  - Serving stepper: 1–10 (integer + allow 0.5 via long-press)
  - calculateTotal: parseFloat(field) × servings (live, updates as user types)
  - Source indicator (small): "📊 From barcode" or "📋 From label" (optional, subtle)
  - On confirm: save to meals table (source='label') + meal_items + label_nutrients
  - Navigate to FinalResultsView

RULE: Barcode data has priority over OCR. Label values are NEVER mixed with IFCT/USDA.

Indian brands covered by OpenFoodFacts barcodes:
  - Maggi (all variants)
  - Parle (Parle-G, Monaco, Krackjack)
  - Britannia (Good Day, Marie, NutriChoice)
  - Amul (Butter, Cheese, Milk products)
  - Haldiram's (most namkeen varieties)
  - ITC (Aashirvaad, Sunfeast)
  - Nestlé India products
```

**Acceptance criteria:** 
- Point at Maggi packet barcode → instant nutrition data from OpenFoodFacts
- Point at regional brand without barcode → tap to capture → OCR extracts nutrition
- Serving count adjusts totals live
- Saves correctly with source tracking

**Implementation time:** 3-4 hours (barcode scanner adds minimal complexity)

---

## Module 10 — Meal Cache

[Same as v1 - no changes to cache logic]

---

## Module 11 — Dashboard + History

[Same as v1 - no changes]

---

## Module 12 — Profile + Settings

[Same as v1 - no changes]

---

## Module 13 — Error Handling + Polish

[Same as v1 - no changes]

---

## Module 14 — Testing (UPDATED)

**What:** Core flow tests before release. **Includes auto-add testing.**

**Test checklist:**
```
Photo flow:
  □ Valid photo → Groq detects 2+ foods → nutrition shown immediately → sliders work → save → Dashboard updates
  □ Photo with unknown food (e.g., "Paneer Tikka Masala") → auto-added to ai_generated_foods → shown with nutrition
  □ Same unknown food photographed again → instant hit from ai_generated_foods (no API call)
  □ Check ai_generated_foods table after 10 meals → should have new entries
  □ Poor quality photo → validation error shown
  □ All providers exhausted → manual entry shown
  □ 10s timeout → manual entry redirect

Voice flow:
  □ "dal chawal khaya" → nutrition shown immediately for both items
  □ "paneer tikka aur naan" → if paneer tikka not in DB, auto-added → shown with nutrition
  □ Mic permission denied → error handled
  □ Empty recording → friendly retry message

Label scan:
  □ Maggi noodles packet → calories/protein/carbs/fat extracted
  □ Serving ×2 → all totals double correctly

Database growth test:
  □ Day 1: ai_generated_foods has 0 rows
  □ Log 20 diverse meals over 3 days
  □ Check ai_generated_foods table → should have 5-10 new foods
  □ Re-log same foods → no new rows added (duplicate prevention working)
  □ Verify source field: 'openfoodfacts' for packaged, 'ai_generated' for home-cooked

Cache:
  □ Log Dal+Rice×3 at 8pm → 4th logging at 8pm → cache overlay appears

Manual:
  □ Search "samosa" → IFCT result found
  □ Search newly auto-added food → found in ai_generated_foods

API quota tracking:
  □ Check api_daily_usage table → round-robin distributes calls across groq_1, groq_2, groq_3, groq_4
  □ No single provider has >30% of calls (indicates load balancing works)

Security:
  □ API keys not visible in app binary (check with apktool)
  □ Supabase anon key visible but harmless (RLS blocks cross-user access)
  □ ai_generated_foods RLS: SELECT works for all, INSERT requires auth
```

---

## Module 15 — Database Growth Monitoring (NEW)

**What:** Add admin panel or simple query to track auto-add system performance.

**Prompt:**
```
Create a simple analytics query for NutriTrack AI auto-add system.

File: supabase/analytics/food_growth.sql

SELECT 
  date_trunc('day', created_at) as date,
  source,
  count(*) as foods_added,
  avg(confidence) as avg_confidence,
  sum(times_used) as total_usage
FROM ai_generated_foods
WHERE created_at >= now() - interval '30 days'
GROUP BY date_trunc('day', created_at), source
ORDER BY date DESC;

Also create a view for most popular auto-added foods:

CREATE VIEW popular_auto_foods AS
SELECT 
  name,
  source,
  confidence,
  times_used,
  created_at
FROM ai_generated_foods
WHERE times_used >= 3
ORDER BY times_used DESC
LIMIT 100;
```

**Acceptance criteria:** Can query to see database growth rate, most popular auto-added foods, confidence distribution.

---

## Build Order Summary (UPDATED)

```
Week 1:  Module 0 (RN conversion) + Module 1 (Supabase setup with ai_generated_foods) + Module 2 (Auth)
Week 2:  Module 3 (Onboarding) + Module 4 (IFCT seed only - 2 hours!) + Module 5 (Manual entry)
Week 3:  Module 6 (Edge Function with round-robin + auto-add) + Module 7 (Photo flow)
Week 4:  Module 8 (Voice) + Module 9 (Label scan) + Module 10 (Cache)
Week 5:  Module 11 (Dashboard/History) + Module 12 (Profile)
Week 6:  Module 13 (Error handling) + Module 14 (Testing) + Module 15 (Analytics) + App Store prep
```

**Time saved with auto-add:** 
- 20-30 hours (USDA curation eliminated)
- No manual nutrition entry UI needed
- No custom food creation complexity

---

## Key Differences from v1

| Aspect | v1 (Old) | v2 (Auto-Add) |
|---|---|---|
| **Database seeding** | IFCT + USDA (20-40 hours) | IFCT only (2 hours) |
| **Nutrition lookup** | Client-side, separate step | Server-side, automatic |
| **Missing foods** | User creates custom | System auto-adds |
| **Edge Function** | Returns food names only | Returns foods WITH nutrition |
| **Database tables** | 3 food tables | 4 food tables (+ ai_generated_foods) |
| **API calls** | Vision only | Vision + Nutrition (separate quotas) |
| **Database growth** | Static | Organic (528 → 15K+ over 3 months) |
| **Load balancing** | Sequential failover | Round-robin |
| **UX** | Manual entry friction | Seamless (zero friction) |

---

*Implementation Plan v2.0 — NutriTrack AI. 15 modules, 6 weeks, solo developer pace. Auto-add nutrition system eliminates manual curation and provides seamless UX.*
