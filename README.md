<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo-blue?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/Backend-Supabase-3ecf8e?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/AI-Groq_%7C_OpenRouter-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-V1_Development-yellow?style=for-the-badge" />
</p>

# 🍛 NutriTrack AI

**AI-powered nutrition tracking built for Indian food.** Photo, voice (Hinglish), nutrition label scan, and manual entry — all backed by a deterministic database, never AI-hallucinated calories.

> _"1 katori dal, 2 rotis, aadha plate biryani"_ — NutriTrack understands how Indians eat.

---

## 📌 Problem

Existing nutrition apps are built around Western food databases and barcode scanning. Indians eating home-cooked meals, street food, and restaurant food have no reliable way to track nutrition. Manual logging is tedious, and AI-based calorie estimation is untrustworthy.

**NutriTrack AI solves this** with three low-friction input methods backed by the **IFCT (Indian Food Composition Tables)** and **USDA** databases. AI identifies food. The database provides nutrition. The user confirms. Nothing is hallucinated.

---

## ✨ Features

### 📷 Photo Logging

Snap a photo of your meal — AI detects every item on your plate (including thali plates with 5+ items), looks up nutrition from the database, and lets you adjust portions before saving.

### 🎤 Voice Logging (Hinglish)

Say _"aaj lunch mein 2 roti aur sabzi thi"_ — Whisper transcribes, Llama parses the food items, and you confirm.

### 📄 Label Scan

Point your camera at a nutrition label — on-device OCR (ML Kit) extracts calories, protein, carbs, and fat instantly. **Zero API calls, works fully offline.**

### ✏️ Manual Entry

Search across 5,500+ foods (IFCT + USDA), or create your own custom food entries.

### 📊 Dashboard & Trends

Daily calorie & macro tracking with circular progress rings, weekly/monthly trend charts, and a full meal history with day-by-day detail views.

### 🧮 Smart Goal Calculation

Personalized calorie and macro targets using the **Mifflin-St Jeor** equation with target-week-aware deficits/surpluses (not a flat ±500 kcal). Protein set at **2g × body weight** per ISSN guidelines. Safety caps prevent dangerous deficits.

### 🧠 Meal Cache

Detects your eating patterns (≥3 occurrences, time-aware ±1.5hrs) and suggests _"Looks like your usual dinner?"_ — one tap to log.

---

## 🏗️ Architecture

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
│  Photo mode:  Budget Router → Groq/OpenRouter           │
│  Voice mode:  Groq Whisper → Groq Llama 3.1 8B          │
│                                                         │
│  All API keys in Supabase secrets — never in app binary │
└─────────────────────────────────────────────────────────┘
```

**Core principle:** AI identifies food names only. Nutrition always comes from the IFCT/USDA database. Nothing is ever hallucinated.

---

## 🤖 AI Agents

| Agent                 | Model             | Purpose                       | Provider             |
| --------------------- | ----------------- | ----------------------------- | -------------------- |
| **Vision Detector**   | Llama 4 Scout 17B | Identify food items in photos | Groq ×4 + OpenRouter |
| **Voice Transcriber** | Whisper Large v3  | Hinglish speech → text        | Groq ×4              |
| **Voice Parser**      | Llama 3.1 8B      | Parse transcript → food items | Groq ×4              |
| **Label OCR**         | Google ML Kit     | Extract label nutrition data  | On-device (free)     |

### Multi-Account Routing

True round-robin across 4 Groq accounts + OpenRouter backup = **4,200 free vision calls/day** (~3,000 DAU at $0/month). Failover triggers on 429 errors or when a provider hits 800 calls/day.

---

## 🛠️ Tech Stack

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| **Frontend**  | React Native (Expo), TypeScript                  |
| **State**     | Zustand (UI), TanStack React Query (server)      |
| **Backend**   | Supabase (Auth, PostgreSQL, Edge Functions, RLS) |
| **Vision AI** | Groq Llama 4 Scout, OpenRouter Qwen3-VL          |
| **Voice AI**  | Groq Whisper Large v3 + Llama 3.1 8B             |
| **OCR**       | `rn-mlkit-ocr` (Google ML Kit, on-device)        |
| **Camera**    | `expo-camera`, `expo-image-manipulator`          |
| **Audio**     | `expo-av`                                        |
| **Storage**   | `expo-secure-store` (JWT), AsyncStorage (cache)  |

---

## 🗄️ Database

### Food Sources (Priority Order)

1. **IFCT** — 528 Indian-specific entries (dal, roti, biryani, etc.)
2. **USDA** — ~5,000 common foods
3. **OpenFoodFacts API** — Runtime fallback for branded/packaged products
4. **Custom foods** — User-created entries

### Core Tables

- `profiles` — User goals, BMR, TDEE, macro targets
- `meals` — Logged meals with detection source tracking
- `meal_items` — Individual food items with nutrition data
- `ifct_foods` / `usda_foods` — Pre-seeded nutrition databases
- `custom_foods` — User-created food entries
- `label_nutrients` — Raw OCR-extracted label values
- `api_daily_usage` — Provider call tracking for routing

All tables have **Row Level Security (RLS)** — users can only access their own data.

---

## 📱 Screens

| Screen             | Component                | Triggered By           |
| ------------------ | ------------------------ | ---------------------- |
| Dashboard          | `DashboardView`          | Home tab               |
| History            | `HistoryView`            | History tab            |
| Trends             | `TrendsView`             | Trends tab             |
| Profile            | `ProfileView`            | Profile tab            |
| Camera             | `CameraView`             | FAB → Camera           |
| Scanning           | `ScanningView`           | Photo capture          |
| Multi-Item Confirm | `MultiItemConfirmView`   | AI detection complete  |
| Voice Record       | `VoiceRecordView`        | FAB → Mic              |
| Label Scan         | `ScanLabelView`          | FAB → Scan Label       |
| Label Result       | `LabelResultView`        | Label capture          |
| Search Food        | `SearchFoodView`         | FAB → Manual           |
| Edit Entry         | `EditEntryView`          | Food selected          |
| Create Custom Food | `CreateCustomFoodView`   | "Create custom"        |
| Final Results      | `FinalResultsView`       | Any confirmed flow     |
| Onboarding         | `CombinedOnboardingFlow` | First launch (4 steps) |

**Navigation:** `App.tsx` uses a `currentFlow` state machine (`camera | voice | label | manual`) with z-index layered modals. All flows converge at `FinalResultsView`.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Groq API keys ×4 (free tier)
- OpenRouter API key (free tier)

### Installation

```bash
# 1. Create Expo project
npx create-expo-app NutriTrackAI --template blank-typescript
cd NutriTrackAI

# 2. Install dependencies
npx expo install expo-camera expo-av expo-image-manipulator expo-file-system expo-secure-store
npm install @supabase/supabase-js @tanstack/react-query zustand
npm install @react-native-async-storage/async-storage
npm install rn-mlkit-ocr

# 3. Configure environment
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 4. Set Edge Function secrets
supabase secrets set GROQ_KEY_1=gsk_xxxx
supabase secrets set GROQ_KEY_2=gsk_xxxx
supabase secrets set GROQ_KEY_3=gsk_xxxx
supabase secrets set GROQ_KEY_4=gsk_xxxx
supabase secrets set OPENROUTER_KEY=sk-or-xxxx

# 5. Deploy Edge Function
supabase functions deploy food-detect

# 6. Start development
npx expo start
```

### Environment Variables

```env
# App binary (safe — public by Supabase design)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Edge Function secrets (never in app binary)
GROQ_KEY_1=gsk_xxxx
GROQ_KEY_2=gsk_xxxx
GROQ_KEY_3=gsk_xxxx
GROQ_KEY_4=gsk_xxxx
OPENROUTER_KEY=sk-or-xxxx
```

---

## 🔒 Security

- **Zero API keys in app binary** — all secrets stored in Supabase Edge Function secrets
- **RLS on all user tables** — users can only read/write their own data
- **JWT auth** — all Edge Function calls require valid Supabase JWT
- **APK-safe** — decompiling the APK reveals only the Supabase anon key (public by design)

---

## 🧮 Nutrition Calculation

All calculations live in `lib/nutritionCalc.ts` — pure functions, zero dependencies, fully testable.

| Step              | Formula                                     | Source                                |
| ----------------- | ------------------------------------------- | ------------------------------------- |
| **BMR**           | Mifflin-St Jeor (10w + 6.25h − 5a ± offset) | Most validated for general population |
| **TDEE**          | BMR × activity multiplier (1.2–1.725)       | Standard energy expenditure model     |
| **Goal Calories** | TDEE ± (weightDiff × 7700 ÷ days)           | Target-week aware, not flat ±500      |
| **Protein**       | 2g × body_weight_kg                         | ISSN recommendation                   |
| **Fat**           | 25% of goal calories                        | Minimum for hormonal health           |
| **Carbs**         | Remainder after protein + fat               | Fills the gap                         |

**Safety caps:** Max 1,000 kcal/day deficit, 500 kcal/day surplus. If caps are hit, the timeline auto-extends with a warning.

---

## 📊 Capacity & Cost

| Scale         | DAU     | Vision Calls/Day | Monthly Cost |
| ------------- | ------- | ---------------- | ------------ |
| Launch        | 50–200  | 100–400          | **$0**       |
| Growth        | 200–500 | 400–800          | **$0**       |
| Scale trigger | 2,500+  | 2,000+           | ~$56/mo      |

Free capacity: 4,200 vision/day, 8,000 whisper/day, 57,600 text LLM/day.

---

## 🗓️ Build Plan

| Week | Modules                                            |
| ---- | -------------------------------------------------- |
| 1    | UI conversion (Figma → RN) + Supabase setup + Auth |
| 2    | Onboarding + DB seeding + Manual entry             |
| 3    | Edge Function + Photo detection flow               |
| 4    | Voice logging + Label scan + Meal cache            |
| 5    | Dashboard/History wiring + Profile                 |
| 6    | Error handling + Testing + App Store prep          |

---

## 📁 Project Structure

```
NutriTrack v1/
├── Documentation/
│   ├── PRD_v3.md                # Product Requirements Document
│   ├── TRD_v4.md                # Technical Requirements Document
│   ├── TDD_v2.md                # Technical Design Document
│   ├── ARCHITECTURE_v3_3.md     # Architecture Decision Records
│   ├── IMPLEMENTATION_PLAN.md   # 14-module build guide
│   ├── AGENTS.md                # AI agents documentation
│   └── ai_prompts.md            # Vision & voice prompts
├── Reference/
│   ├── App.tsx                  # Main navigation & state machine
│   ├── DashboardView.tsx        # Home screen
│   ├── HistoryView.tsx          # Meal history
│   ├── TrendsView.tsx           # Weekly/monthly charts
│   ├── ProfileView.tsx          # User profile & goals
│   ├── CameraView.tsx           # Photo capture
│   ├── ScanningView.tsx         # AI detection progress
│   ├── MultiItemConfirmView.tsx # Portion adjustment
│   ├── VoiceRecordView.tsx      # Voice recording
│   ├── ScanLabelView.tsx        # Label camera view
│   ├── LabelResultView.tsx      # OCR results
│   ├── SearchFoodView.tsx       # Food database search
│   ├── EditEntryView.tsx        # Portion editor
│   ├── FinalResultsView.tsx     # Confirmation screen
│   ├── NUTRITION_CALC.md        # Formula reference + examples
│   ├── auth/                    # Login, SignUp, ForgotPassword
│   ├── onboarding/              # CombinedOnboardingFlow (4-step)
│   ├── settings/                # App settings screens
│   ├── ui/                      # Reusable UI components
│   └── lib/                     # nutritionCalc.ts
└── README.md
```

---

## 🎯 Success Metrics

| Metric                               | Target |
| ------------------------------------ | ------ |
| Activation (log 1 meal in session 1) | ≥60%   |
| Day-7 retention                      | ≥40%   |
| Photo detection confirmation rate    | ≥80%   |
| Voice parse accuracy (Hinglish)      | ≥80%   |
| Cache hit rate (after 2 weeks)       | ≥35%   |
| Manual fallback rate                 | <15%   |
| API success rate                     | ≥95%   |
| Infrastructure cost at 500 DAU       | **$0** |

---

## 🎯 Target Users

**Primary:** Gym-goers and fitness-aware Indians (18–35) who find existing apps too slow, too Western, or too English.

**Secondary:** Students and working professionals eating a mix of home food, canteen food, and street food.

---

## 🚧 Post-V1 Roadmap

- Barcode scanning
- Offline-first with background sync
- Micronutrient tracking
- Meal templates / quick-log favorites
- Push notifications
- Regional language support (Tamil, Telugu, Bengali)
- Premium subscription

---

## 📄 Documentation

| Document                                                       | Description                                         |
| -------------------------------------------------------------- | --------------------------------------------------- |
| [PRD_v3.md](Documentation/PRD_v3.md)                           | Product Requirements — features, flows, constraints |
| [TRD_v4.md](Documentation/TRD_v4.md)                           | Technical Requirements — schema, APIs, routing      |
| [TDD_v2.md](Documentation/TDD_v2.md)                           | Technical Design — screen specs, navigation, cache  |
| [ARCHITECTURE_v3_3.md](Documentation/ARCHITECTURE_v3_3.md)     | Architecture Decision Records (12 ADRs)             |
| [IMPLEMENTATION_PLAN.md](Documentation/IMPLEMENTATION_PLAN.md) | Step-by-step 14-module build guide                  |
| [AGENTS.md](Documentation/AGENTS.md)                           | AI agents configuration & prompts                   |
| [NUTRITION_CALC.md](Reference/NUTRITION_CALC.md)               | Calculation formulas & worked examples              |

---

## 📝 License

This project is private and proprietary.

---

<p align="center">
  <b>Built for India 🇮🇳 • Powered by AI 🤖 • Verified by Database ✅</b>
</p>
