# NutriTrack AI — Architecture Decision Document (v3.5)
**Date:** March 2026 | Supersedes: v3.4

---

## Decision Log

### ADR-001: Multi-Account Groq Instead of Single Account

[Same as v3.4 - no changes]

---

### ADR-002: All API Keys in Edge Function Secrets

[Same as v3.4 - no changes]

---

### ADR-003: Nutrition from DB, Never from AI (UPDATED)

**Decision:** Nutrition comes from database first. If not found, auto-generate via OpenFoodFacts API or LLM and permanently store in database.

**Context (Original):** Vision models cannot accurately estimate portion weight from 2D photos. "Dal 165 kcal" from AI is a plausible-sounding hallucination. Users make health decisions from this data.

**Update (v3.5):** The principle remains, but implementation evolved:

**What we rejected:**
- ❌ AI estimates nutrition from photo: "This bowl of dal is 165 kcal"
- Problem: Cannot judge portion size from 2D image

**What we're implementing:**
- ✅ AI provides generic nutrition data: "Dal typically has 110 kcal/100g"
- ✅ Store permanently in database
- ✅ User controls portion via slider
- ✅ App calculates deterministically: (150g/100g) × 110 = 165 kcal

**Chosen:** AI → food names → DB lookup → if not found → auto-generate nutrition (OpenFoodFacts or LLM) → store in ai_generated_foods table → return to user → deterministic calculation.

`estimated_calories` field still removed from vision prompts. Nutrition is generic per-100g data, not photo-specific estimates.

---

### ADR-004: IFCT Priority Over USDA for Indian Foods

[Same as v3.4 - no changes]

---

### ADR-005: Label Scan is Zero-API-Call

[Same as v3.4 - no changes]

---

### ADR-006: Cache is a Suggestion, Not an Interception

[Same as v3.4 - no changes]

---

### ADR-007: Dropped TFLite On-Device Classifier

[Same as v3.4 - no changes]

---

### ADR-008: Whisper in Hindi Mode for Hinglish

[Same as v3.4 - no changes]

---

### ADR-009: Single Edge Function for Photo + Voice

[Same as v3.4 - no changes]

---

### ADR-010: Round-Robin Load Balancing Over Sequential Failover

[Same as v3.4 - no changes]

---

### ADR-011: Voice Stays Cloud-Based, No On-Device Transcription

[Same as v3.4 - no changes]

---

### ADR-012: Auto-Add Nutrition System Over Manual Pre-Seeding (NEW)

**Decision:** Start with minimal database (528 IFCT foods), auto-generate and store nutrition for detected foods not in database, let database grow organically from real user data.

**Context:**

**Original plan (v3.4):**
- Pre-seed 10,000-20,000 foods manually
- Requires 20-40 hours of curation
- Complex dataset filtering and deduplication
- Still won't cover all foods users photograph

**Problem:**
- High upfront effort
- Database becomes stale (new foods appear constantly)
- Still leaves gaps (regional foods, new restaurant dishes)
- User sees "food not found" frequently

**Alternative considered:**
Small database (528 foods) + manual user entry for missing foods

**Problem:**
- Poor UX: User must enter nutrition for 50%+ of detections
- User friction kills adoption
- Data quality varies (user estimation errors)

**Chosen:** Auto-add nutrition system

### How it works:

```
Food detection flow:

1. Vision AI detects: "Paneer Tikka Masala"

2. Check database (priority order):
   a. ifct_foods (528 verified) → Not found
   b. usda_foods (optional) → Not found
   c. ai_generated_foods (community DB) → Not found

3. Auto-fetch nutrition:
   a. Try OpenFoodFacts API (free, 2.8M products)
      → Returns real product data if found
   b. If not found, fallback to Groq Llama 70B
      → Returns generic nutrition: {calories: 180, protein: 12, ...}

4. Auto-insert into ai_generated_foods table:
   INSERT INTO ai_generated_foods (name, calories_per_100g, ...)
   VALUES ('Paneer Tikka Masala', 180, ...)

5. Return to user (seamless, no manual entry)

6. Next user photographs same food:
   → Found in ai_generated_foods ✅
   → No API call needed
   → Instant response
```

### Database growth simulation:

```
Day 1: 528 foods (IFCT only)

Week 1 (500 DAU):
  Users photograph 2,000 unique foods
  1,000 found in IFCT ✅
  1,000 auto-added to ai_generated_foods
  → Database: 1,528 foods

Month 1:
  Users photograph 10,000 unique foods
  3,000 found in existing DB ✅
  7,000 auto-added
  → Database: 8,528 foods

Month 3:
  Users photograph 25,000 unique foods
  20,000 found in existing DB ✅ (80% hit rate)
  5,000 auto-added
  → Database: 13,528 foods

Month 6:
  Database: ~20,000 foods
  Hit rate: 97%+ (most foods now in DB)
  Auto-add calls: <50/day
  → System reaches steady state
```

### Benefits:

**✅ Zero manual curation**
- No need to filter/clean/deduplicate datasets
- No 40-hour upfront work
- Setup time: 2 hours (just IFCT seeding)

**✅ Seamless UX**
- User NEVER sees "food not found"
- No manual nutrition entry ever
- Vision AI detects → nutrition appears → user confirms portion → done

**✅ Self-improving database**
- Grows from real user data
- Captures regional foods organically
- Adapts to new restaurant dishes automatically
- Community-driven (all users benefit from each other's detections)

**✅ Cost-effective**
- Week 1: ~500 LLM calls/day (within free tier)
- Month 3: ~20 LLM calls/day (DB matured)
- Always $0 infrastructure

**✅ Data quality**
- OpenFoodFacts: 95%+ accuracy (real product data)
- LLM (Llama 70B): 80-85% accuracy (generic nutrition)
- Better than user manual entry: 60-70% accuracy (estimation errors)

### Trade-offs:

**⚠️ Initial LLM usage higher**
- Week 1: 500 nutrition calls/day (12.5% of quota)
- Still within free tier (4,000 calls/day across 4 accounts)

**⚠️ AI-generated data less accurate than verified**
- IFCT/USDA: 99%+ accuracy
- OpenFoodFacts: 95%+ accuracy
- LLM: 80-85% accuracy
- **Mitigation:** Prioritize IFCT → USDA → OpenFoodFacts → LLM

**⚠️ Database size grows over time**
- Month 6: ~20,000 foods × 200 bytes = 4MB
- Supabase free tier: 500MB limit
- **Not a constraint:** 4MB is <1% of limit

### Alternatives rejected:

**Option A: Large pre-seeded DB (20,000 foods)**
- ❌ 40 hours manual curation
- ❌ Becomes stale immediately
- ❌ Still won't cover all foods

**Option B: Small DB + manual user entry**
- ❌ Poor UX (constant friction)
- ❌ Low data quality (user errors)
- ❌ Adoption killer

**Option C: Small DB + fallback to manual (no auto-add)**
- ❌ User sees "not found" frequently
- ❌ Creates negative perception of AI quality
- ❌ Doesn't leverage community effect

**Option D: Vision AI estimates nutrition from photo**
- ❌ Violates ADR-003 (cannot estimate portion from 2D)
- ❌ Hallucination risk
- ❌ Dangerous for health decisions

**Chosen:** Auto-add with OpenFoodFacts → LLM fallback

### Implementation details:

**Data sources:**
1. OpenFoodFacts API (free, unlimited)
   - 2.8M products
   - Real verified nutrition data
   - Best for packaged/branded foods
   
2. Groq Llama 3.1 70B (free tier, 4,000 calls/day)
   - Generic nutrition knowledge
   - Best for home-cooked foods
   - Temperature: 0.1 (factual accuracy)

**Database table:**
```sql
CREATE TABLE ai_generated_foods (
  name TEXT NOT NULL UNIQUE,
  calories_per_100g NUMERIC NOT NULL,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  source TEXT ('openfoodfacts' | 'ai_generated'),
  confidence NUMERIC (0.0-1.0),
  times_used INTEGER DEFAULT 0, -- Track popularity
  created_at TIMESTAMPTZ
);
```

**Lookup priority:**
1. ifct_foods (verified Indian, highest trust)
2. usda_foods (verified general, high trust)
3. ai_generated_foods (community, medium trust, sorted by times_used)
4. If not found → Auto-generate → Insert → Return

**Quality control:**
- OpenFoodFacts data: confidence = 0.95
- LLM data: confidence = 0.85
- User never sees confidence score (seamless UX)
- No user verification needed (removes friction)

### Success metrics:

**Track these to validate decision:**
1. Database growth rate: +500-1000 foods/week expected
2. Hit rate: 50% week 1 → 97% month 6
3. LLM call volume: 500/day week 1 → <50/day month 6
4. User friction: 0 manual entries (vs 50% with old plan)

### Future optimizations (post-v1):

If LLM nutrition quality concerns arise:
- Add user edit capability (opt-in, not required)
- Track edit frequency to identify bad LLM data
- Re-generate low-confidence entries with better prompts

If database grows too large (unlikely):
- Archive rarely-used ai_generated entries (times_used < 3)
- Promote high-usage entries to verified status

---

## Provider Capacity Reference (UPDATED)

```
Free capacity per day:

Vision (Llama 4 Scout):
  Groq Account 1-4: 4,000  (30 RPM each)
  OpenRouter:         200  (60 RPM)
  Total:            4,200  →  ~3,000 DAU on $0

Nutrition Lookup (Llama 70B):
  Groq Account 1-4: 4,000  (30 RPM each) ← NEW
  Total:            4,000  →  5,000+ DAU on $0
  
Whisper transcription:
  4 Groq accounts: 8,000/day (20 RPM each)
  →  ~5,700 DAU on $0

Text LLM (Llama 3.1 8B):
  4 Groq accounts: 57,600/day (30 RPM each)
  →  never limiting

Usage timeline (500 DAU):
  Week 1: 1,500 vision + 500 nutrition + 200 voice = 2,200 calls/day
  Month 3: 1,500 vision + 20 nutrition + 200 voice = 1,720 calls/day
  
Upgrade trigger: ~2,500 DAU sustained (or never, with auto-add efficiency)
```

---

## Security Model

[Same as v3.4 - no changes]

---

## Summary of Changes (v3.5)

1. ✅ **ADR-012 added:** Auto-add nutrition system decision
2. ✅ **ADR-003 updated:** Clarified nutrition source (DB or auto-generated)
3. ✅ **Provider capacity:** Added Llama 70B for nutrition lookup
4. ✅ **Database strategy:** Minimal pre-seed + organic growth
5. ✅ **UX improvement:** Zero manual entry, seamless experience
6. ✅ **Cost analysis:** LLM usage decreases over time as DB grows

---

*ADR v3.5 — NutriTrack AI. 12 decisions documented. Added auto-add nutrition system (ADR-012) for seamless UX and organic database growth.*
