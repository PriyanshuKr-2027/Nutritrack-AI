import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { FoodItem } from './nutritionLookup';

export interface CachedMealPattern {
  fingerprint: string;
  mealType: string;
  frequency: number;
  typicalHours: number[];
  items: FoodItem[]; // The last saved item shape for this meal
}

const CACHE_KEY = 'meal_patterns';

/**
 * Sync overall meal history for the user from Supabase and cache recurrent combinations locally.
 */
export async function syncMealPatterns(userId: string): Promise<void> {
  if (!userId) return;

  try {
    // 1. Fetch last 30 meals with their items
    const { data: meals, error } = await supabase
      .from('meals')
      .select(`
        id, 
        meal_type, 
        logged_at, 
        meal_items ( id, food_name, calories, protein_g, carbs_g, fat_g, weight_g, quantity, food_source )
      `)
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    if (!meals || meals.length === 0) return;

    // 2. Group by fingerprint (alphabetical join of food names)
    const patternMap = new Map<string, CachedMealPattern>();

    for (const meal of meals) {
      if (!meal.meal_items || !Array.isArray(meal.meal_items) || (meal.meal_items as any[]).length === 0) continue;

      const itemsArr = meal.meal_items as any[];

      // Ensure stable string
      const sortedNames = itemsArr
        .map((i: any) => (i.food_name || '').toLowerCase().trim())
        .sort();
      const fingerprint = sortedNames.join('|');

      const hour = new Date(meal.logged_at).getHours();

      if (patternMap.has(fingerprint)) {
        const existing = patternMap.get(fingerprint)!;
        existing.frequency += 1;
        existing.typicalHours.push(hour);
      } else {
        // Map meal_items to the UI expect FoodItem shape
        const items: FoodItem[] = itemsArr.map((i: any) => {
          const qty = Math.max(1, i.quantity || 1);
          const weight = i.weight_g || 100;
          return {
            id: i.id,
            name: i.food_name,
            portion: `${weight}g`,
            caloriesPerUnit: Math.round(i.calories / qty),
            calories: i.calories,
            calories_per_100g: i.calories ? (i.calories / weight) * 100 : 0,
            protein_per_100g: i.protein_g ? (i.protein_g / weight) * 100 : 0,
            carbs_per_100g: i.carbs_g ? (i.carbs_g / weight) * 100 : 0,
            fat_per_100g: i.fat_g ? (i.fat_g / weight) * 100 : 0,
            defaultWeight: Math.round(weight / qty),
            unit: 'serving',
            quantity: qty,
            source: i.food_source || 'db',
            food_source: i.food_source || 'db',
            confidence: 1,
            image: '', // not stored
          };
        });

        patternMap.set(fingerprint, {
          fingerprint,
          mealType: meal.meal_type || 'snack',
          frequency: 1,
          typicalHours: [hour],
          items,
        });
      }
    }

    // 3. Keep patterns where frequency >= 3
    const frequentPatterns = Array.from(patternMap.values()).filter(p => p.frequency >= 3);

    // 4. Store in AsyncStorage
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(frequentPatterns));
  } catch (err) {
    console.warn('[mealCache] Error syncing patterns:', err);
  }
}

/**
 * Checks local cache for a meal matching the current time window (+/- 1.5 hours)
 */
export async function checkMealCache(): Promise<CachedMealPattern | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const patterns: CachedMealPattern[] = JSON.parse(raw);
    if (!patterns.length) return null;

    const currentHour = new Date().getHours();

    let bestMatch: CachedMealPattern | null = null;
    let highestFreq = 0;

    for (const p of patterns) {
      // Check if any typical hour is within +/- 1.5 hours. 
      // (Simplified to integer hours: diff <= 1 or diff >= 23 allows 1 hr boundary)
      const isMatch = p.typicalHours.some(h => {
        const diff = Math.abs(h - currentHour);
        return diff <= 1 || diff >= 23;
      });

      if (isMatch && p.frequency > highestFreq) {
        highestFreq = p.frequency;
        bestMatch = p;
      }
    }

    return bestMatch;
  } catch (err) {
    console.warn('[mealCache] Error checking cache:', err);
    return null;
  }
}
