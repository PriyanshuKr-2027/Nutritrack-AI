# NutriTrack AI — AI Prompts
**Version:** 1.0 | **Date:** March 2026

Prompts used by the `food-detect` Supabase Edge Function.
When updating a prompt: bump version, add changelog entry, test with 20+ samples before deploying.

**Changelog:**
- v1.0 (March 2026) — Initial prompts. Vision: Groq Llama 4 Scout + OpenRouter Qwen3-VL. Voice: Whisper Large v3 + Llama 3.1 8B.

---

## VISION PROMPT — Indian Food Detection
## Use as user message for Groq Llama 4 Scout Vision and OpenRouter Qwen3-VL

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


---

## VOICE SYSTEM PROMPT — Hinglish Food Parser
## System prompt for Groq Llama 3.1 8B Instant
## User message = raw Whisper transcript (passed directly, no wrapping)

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
"dal chawal khaya" -> [{dal,1},{chawal,1}]
"2 roti aur sabzi" -> [{roti,2},{sabzi,1}]
"aadha plate biryani" -> [{biryani,0.5}]
"ek samosa aur chai" -> [{samosa,1},{chai,1}]
