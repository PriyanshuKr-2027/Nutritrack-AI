// lib/nutritionLookup.ts
// Client-side nutrition lookup + FoodItem builder for MultiItemConfirmView.
// This is a FALLBACK for the rare case where Edge Function returns food names
// without nutrition (e.g., legacy mode). The primary flow uses the enriched
// foods returned directly by the Edge Function (Module 6).

import { supabase } from './supabase';
import { DetectedFoodItem, getPortionDefault } from './foodDetect';

// ─── FoodItem ─────────────────────────────────────────────────────────────────
// Matches the shape expected by MultiItemConfirmView.

export interface FoodItem {
  id: string;
  name: string;
  image: string;           // placeholder per food category
  quantity: number;        // number of servings (slider value)
  calories: number;        // = caloriesPerUnit × quantity
  caloriesPerUnit: number; // cals at quantity=1 (i.e. for defaultWeight g)
  unit: string;            // e.g. "1 katori (150g)"
  // Extra nutrition for the save step
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  defaultWeight: number;   // g — the portion default used for calculation
  food_source: 'ifct' | 'usda' | 'ai_generated' | 'openfoodfacts' | 'custom';
}

// ─── Food category → thumbnail mapping ───────────────────────────────────────

const FOOD_IMAGES: Record<string, string> = {
  dal:      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200',
  rice:     'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200',
  roti:     'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200',
  biryani:  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200',
  samosa:   'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200',
  dosa:     'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200',
  default:  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
};

function getFoodImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return FOOD_IMAGES.default;
}

// ─── Build FoodItem from DetectedFoodItem (Edge Function output) ──────────────

/**
 * Convert an Edge Function DetectedFoodItem → FoodItem for MultiItemConfirmView.
 * The Edge Function already supplies nutrition, so no DB lookup is needed.
 */
export function buildFoodItemFromDetected(
  detected: DetectedFoodItem,
  index: number,
): FoodItem {
  const defaultWeight = getPortionDefault(detected.name);
  const caloriesPerUnit = Math.round((defaultWeight / 100) * detected.calories_per_100g);

  return {
    id: `detected_${index}_${Date.now()}`,
    name: detected.name,
    image: getFoodImage(detected.name),
    quantity: 1,
    calories: caloriesPerUnit,
    caloriesPerUnit,
    unit: detected.portion || `${defaultWeight}g`,
    protein_per_100g: detected.protein_per_100g,
    carbs_per_100g: detected.carbs_per_100g,
    fat_per_100g: detected.fat_per_100g,
    calories_per_100g: detected.calories_per_100g,
    defaultWeight,
    food_source: detected.source,
  };
}

// ─── lookupNutrition (fallback DB query, used if Edge Function returns names only) ──

/**
 * (Fallback path — not normally needed with v2 Edge Function)
 * For each food name, search IFCT → USDA → ai_generated via search_all_foods RPC.
 * Build FoodItem array for MultiItemConfirmView.
 */
export async function lookupNutrition(
  names: string[],
): Promise<FoodItem[]> {
  const results: FoodItem[] = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    try {
      const { data } = await (supabase as any).rpc('search_all_foods', {
        search_term: name,
      });

      if (data && data.length > 0) {
        const food = data[0];
        const defaultWeight = getPortionDefault(name);
        const caloriesPerUnit = Math.round((defaultWeight / 100) * food.calories_per_100g);

        results.push({
          id: `lookup_${i}_${Date.now()}`,
          name,
          image: getFoodImage(name),
          quantity: 1,
          calories: caloriesPerUnit,
          caloriesPerUnit,
          unit: `${defaultWeight}g`,
          protein_per_100g: food.protein_per_100g ?? 0,
          carbs_per_100g: food.carbs_per_100g ?? 0,
          fat_per_100g: food.fat_per_100g ?? 0,
          calories_per_100g: food.calories_per_100g ?? 0,
          defaultWeight,
          food_source: food.source ?? 'custom',
        });
      } else {
        // Food not found even in DB — placeholder so the user can adjust
        results.push({
          id: `unknown_${i}_${Date.now()}`,
          name,
          image: getFoodImage(name),
          quantity: 1,
          calories: 100,
          caloriesPerUnit: 100,
          unit: '100g',
          protein_per_100g: 5,
          carbs_per_100g: 15,
          fat_per_100g: 5,
          calories_per_100g: 100,
          defaultWeight: 100,
          food_source: 'custom',
        });
      }
    } catch (err) {
      console.error(`[nutritionLookup] Failed for ${name}:`, err);
    }
  }

  return results;
}
