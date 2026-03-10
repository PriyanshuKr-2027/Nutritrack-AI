// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// --- CORS Configuration ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- API Provider Definitions ---
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
    id: "groq_1",
    key: Deno.env.get("GROQ_KEY_1") || "",
    dailyBudget: 950,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    rpmLimit: 30,
  },
  {
    id: "groq_2",
    key: Deno.env.get("GROQ_KEY_2") || "",
    dailyBudget: 950,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    rpmLimit: 30,
  },
  {
    id: "groq_3",
    key: Deno.env.get("GROQ_KEY_3") || "",
    dailyBudget: 950,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    rpmLimit: 30,
  },
  {
    id: "groq_4",
    key: Deno.env.get("GROQ_KEY_4") || "",
    dailyBudget: 950,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    rpmLimit: 30,
  },
  {
    id: "openrouter",
    key: Deno.env.get("OPENROUTER_KEY") || "",
    dailyBudget: 180,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "qwen/qwen3-vl:free",
    rpmLimit: 60,
  },
];

// --- AI Prompts ---
const VISION_PROMPT = `
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
`;

const VOICE_SYSTEM_PROMPT = `
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
`;

const NUTRITION_PROMPT = `
You are a nutrition database. Provide accurate per-100g nutrition data for the following food. Use average values from reliable sources. Return ONLY valid JSON with no explanations or markdown.

Food: {FOOD_NAME}

Return format:
{
  "calories": 250,
  "protein": 12.5,
  "carbs": 8.0,
  "fat": 18.0,
  "fiber": 1.5
}
`;

// --- Global State for Round-Robin ---
let roundRobinIndex = 0;

// --- Helper Types ---
interface FoodItemWithNutrition {
  name: string;
  portion: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  source: "ifct" | "usda" | "ai_generated" | "openfoodfacts";
  confidence: number;
}

// --- Round Robin Load Balancer for Vision ---
async function getNextVisionProvider(
  supabaseAdmin: any,
): Promise<Provider | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data: usageData } = await supabaseAdmin
    .from("api_daily_usage")
    .select("provider, call_count")
    .eq("date", today);

  const usageMap = Object.fromEntries(
    usageData?.map((u: any) => [u.provider, u.call_count]) || [],
  );

  const availableProviders = VISION_PROVIDERS.filter(
    (p) => (usageMap[p.id] ?? 0) < p.dailyBudget && p.key !== "",
  );

  if (availableProviders.length === 0) return null;

  const selectedProvider =
    availableProviders[roundRobinIndex % availableProviders.length];
  roundRobinIndex++;
  console.log(`[Load Balancer] Selected ${selectedProvider.id}`);

  return selectedProvider;
}

// --- Vision API Call (with retries) ---
async function callVisionAPI(
  provider: Provider,
  imageBase64: string,
  supabaseAdmin: any,
  retries = 3,
): Promise<any> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const isOpenRouter = provider.id === "openrouter";
    const reqBody: any = {
      model: provider.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    };

    if (!isOpenRouter) {
      reqBody.response_format = { type: "json_object" };
    }

    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    if (response.status === 429 && retries > 0) {
      console.log(`[Rate Limit] ${provider.id} hit 429`);
      const nextProvider = await getNextVisionProvider(supabaseAdmin);
      if (!nextProvider) throw new Error("All providers exhausted");
      return await callVisionAPI(
        nextProvider,
        imageBase64,
        supabaseAdmin,
        retries - 1,
      );
    }

    if (!response.ok) {
      throw new Error(`${provider.id} API error: ${response.status}`);
    }

    const data = await response.json();

    // Track API usage via RPC (handles upsert + increment atomically)
    try {
      await supabaseAdmin.rpc("increment_api_usage", {
        p_provider: provider.id,
        p_date: today,
      });
    } catch (e) {
      console.warn(`[Usage] Could not record usage for ${provider.id}:`, e);
    }

    let contentStr = data.choices[0]?.message?.content || "{}";
    if (isOpenRouter) {
      // Strip markdown code fences if present
      const jsonMatch = contentStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      contentStr = jsonMatch ? jsonMatch[1] : contentStr.trim();
    }

    return { data: JSON.parse(contentStr), provider: provider.id };
  } catch (error) {
    if (retries > 0) {
      const nextProvider = await getNextVisionProvider(supabaseAdmin);
      if (nextProvider)
        return await callVisionAPI(
          nextProvider,
          imageBase64,
          supabaseAdmin,
          retries - 1,
        );
    }
    throw error;
  }
}

// --- Nutrition Lookup Pipeline ---
async function getLLMNutrition(foodName: string): Promise<any> {
  const prompt = NUTRITION_PROMPT.replace("{FOOD_NAME}", foodName);
  const provider = VISION_PROVIDERS.find(
    (p) => p.id.startsWith("groq") && p.key,
  ); // Use first available Groq for text

  if (!provider) throw new Error("No Groq key available for nutrition lookup");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile", // Use larger model for factual accuracy
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 300,
      }),
    },
  );

  const data = await response.json();
  const contentStr = data.choices[0]?.message?.content || "{}";
  const nutrition = JSON.parse(contentStr);

  return {
    calories_per_100g: nutrition.calories || 100,
    protein_per_100g: nutrition.protein || 0,
    carbs_per_100g: nutrition.carbs || 0,
    fat_per_100g: nutrition.fat || 0,
    fiber_per_100g: nutrition.fiber || 0,
    source: "ai_generated",
    confidence: 0.85,
  };
}

async function getNutritionForFood(
  foodName: string,
  supabaseAdmin: any,
): Promise<any> {
  let offData = null;

  // Try OpenFoodFacts API first (Free, real product data)
  try {
    const offResponse = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&json=true&page_size=1`,
    );
    const parsed = await offResponse.json();

    if (parsed.products && parsed.products.length > 0) {
      const nut = parsed.products[0].nutriments;
      if (nut && nut["energy-kcal_100g"]) {
        offData = {
          calories_per_100g: nut["energy-kcal_100g"] || 0,
          protein_per_100g: nut.proteins_100g || 0,
          carbs_per_100g: nut.carbohydrates_100g || 0,
          fat_per_100g: nut.fat_100g || 0,
          fiber_per_100g: nut.fiber_100g || 0,
          source: "openfoodfacts",
          confidence: 0.95,
        };
      }
    }
  } catch (error) {
    console.warn(`[Nutrition] OFF fetch failed for ${foodName}`, error);
  }

  // Fallback to LLM
  return offData || (await getLLMNutrition(foodName));
}

// Auto-add pipeline
async function lookupNutritionWithAutoAdd(
  foodItem: { name: string; portion?: string; quantity?: number },
  supabaseAdmin: any,
): Promise<FoodItemWithNutrition> {
  console.log(`[Lookup] Checking DB for: ${foodItem.name}`);

  // 1 & 2 & 3. Try to find in priority: IFCT -> USDA -> AI Generated
  const { data: searchResults, error } = await supabaseAdmin.rpc(
    "search_all_foods",
    {
      search_term: foodItem.name,
    },
  );

  if (searchResults && searchResults.length > 0) {
    const existing = searchResults[0];
    return {
      name: foodItem.name || existing.name,
      portion: foodItem.portion || `${foodItem.quantity || 1} serving`,
      calories_per_100g: existing.calories_per_100g,
      protein_per_100g: existing.protein_per_100g,
      carbs_per_100g: existing.carbs_per_100g,
      fat_per_100g: existing.fat_per_100g,
      fiber_per_100g: existing.fiber_per_100g || 0,
      source: existing.source,
      confidence: existing.source === "ai_generated" ? 0.85 : 0.99,
    };
  }

  // 4. Fallback + Auto Add to ai_generated_foods
  console.log(`[Lookup] Not found in DB, generating for: ${foodItem.name}`);
  const autoNutrition = await getNutritionForFood(foodItem.name, supabaseAdmin);

  const newEntry = {
    name: foodItem.name.toLowerCase(),
    calories_per_100g: autoNutrition.calories_per_100g,
    protein_per_100g: autoNutrition.protein_per_100g,
    carbs_per_100g: autoNutrition.carbs_per_100g,
    fat_per_100g: autoNutrition.fat_per_100g,
    fiber_per_100g: autoNutrition.fiber_per_100g,
    source: autoNutrition.source,
    confidence: autoNutrition.confidence,
  };

  // Upsert to handle race conditions (duplicate inserts from concurrent users)
  const { data: upserted, error: insertError } = await supabaseAdmin
    .from("ai_generated_foods")
    .upsert(newEntry, { onConflict: "name", ignoreDuplicates: false })
    .select()
    .single();

  if (insertError) {
    console.warn(
      `[AutoAdd] Upsert error for ${foodItem.name}:`,
      insertError.message,
    );
    // Fetch existing record if upsert failed
    const { data: existing } = await supabaseAdmin
      .from("ai_generated_foods")
      .select()
      .eq("name", foodItem.name.toLowerCase())
      .single();
    if (existing) {
      return {
        name: existing.name,
        portion: foodItem.portion || `${foodItem.quantity || 1} serving`,
        calories_per_100g: existing.calories_per_100g,
        protein_per_100g: existing.protein_per_100g,
        carbs_per_100g: existing.carbs_per_100g,
        fat_per_100g: existing.fat_per_100g,
        fiber_per_100g: existing.fiber_per_100g || 0,
        source: existing.source,
        confidence: existing.confidence,
      };
    }
  }

  console.log(
    `[AutoAdd] Inserted new food: ${foodItem.name} (source: ${autoNutrition.source})`,
  );
  return {
    portion: foodItem.portion || `${foodItem.quantity || 1} serving`,
    ...newEntry,
  };
}

// --- Main Request Handler ---
serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse Request
    const { mode, imageBase64, audioBase64, mimeType } = await req.json();

    // 3A. PHOTO MODE
    if (mode === "photo") {
      if (!imageBase64) throw new Error("Missing imageBase64");

      const provider = await getNextVisionProvider(supabaseAdmin);
      if (!provider) {
        return new Response(
          JSON.stringify({ tier: "manual", reason: "daily_limit_reached" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log(`Starting Vision process for user: ${user.id}`);
      const { data: visionData, provider: usedProviderId } =
        await callVisionAPI(provider, imageBase64, supabaseAdmin);

      if (!visionData.foods || visionData.foods.length === 0) {
        return new Response(
          JSON.stringify({ tier: "manual", reason: "no_foods_detected" }),
          { headers: corsHeaders },
        );
      }

      // Auto-add nutrition loop
      const enrichedFoods = await Promise.all(
        visionData.foods.map((food: any) =>
          lookupNutritionWithAutoAdd(food, supabaseAdmin),
        ),
      );

      return new Response(
        JSON.stringify({
          tier: "api",
          provider: usedProviderId,
          foods: enrichedFoods,
          meal_type: visionData.meal_type || "snack",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3B. VOICE MODE
    if (mode === "voice") {
      if (!audioBase64) throw new Error("Missing audioBase64");

      // Round-robin across Groq keys for Whisper load distribution
      const groqKeys = [
        Deno.env.get("GROQ_KEY_1"),
        Deno.env.get("GROQ_KEY_2"),
        Deno.env.get("GROQ_KEY_3"),
        Deno.env.get("GROQ_KEY_4"),
      ].filter(Boolean);
      if (groqKeys.length === 0)
        throw new Error("Missing Groq keys for Whisper");
      const groqKey = groqKeys[roundRobinIndex % groqKeys.length];

      // Convert base64 to File object using modern Web APIs
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioFile = new File(
        [bytes],
        "recording" + (mimeType.includes("mp4") ? ".m4a" : ".tmp"),
        { type: mimeType },
      );
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-large-v3");
      formData.append("language", "hi"); // Essential for Hinglish
      formData.append("response_format", "json");
      formData.append("temperature", "0.0");

      // Step 1: Whisper Transcription
      const whisperResp = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}` },
          body: formData,
        },
      );

      if (!whisperResp.ok) throw new Error("Transcription failed");
      const { text: transcript } = await whisperResp.json();

      // Step 2: Voice Parser (Llama)
      const parserResp = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: VOICE_SYSTEM_PROMPT },
              { role: "user", content: transcript },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
          }),
        },
      );

      if (!parserResp.ok) throw new Error("Voice parsing failed");

      const parserData = await parserResp.json();
      const parsedItems = JSON.parse(
        parserData.choices[0]?.message?.content || '{"items":[]}',
      );

      // Step 3: Auto-add Nutrition
      const enrichedItems = await Promise.all(
        (parsedItems.items || []).map((item: any) =>
          lookupNutritionWithAutoAdd(item, supabaseAdmin),
        ),
      );

      return new Response(
        JSON.stringify({
          transcript,
          items: enrichedItems,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
