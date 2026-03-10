// lib/foodDetect.ts
// Photo + Voice detection via Supabase Edge Function food-detect.

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Nutrition-enriched food item returned by the Edge Function. */
export interface DetectedFoodItem {
  name: string;
  portion: string;               // e.g. "1 katori (150ml)"
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  source: 'ifct' | 'usda' | 'ai_generated' | 'openfoodfacts';
  confidence: number;
}

/** Shape returned for photo mode success. */
export interface PhotoDetectResult {
  tier: 'api';
  provider: string;
  foods: DetectedFoodItem[];
  meal_type: string;
}

/** Shape returned when daily limit is reached or no foods detected. */
export interface PhotoDetectManual {
  tier: 'manual';
  reason: 'daily_limit_reached' | 'no_foods_detected' | 'timeout' | string;
}

export type PhotoDetectResponse = PhotoDetectResult | PhotoDetectManual;

// ─── Indian portion defaults ──────────────────────────────────────────────────
// Maps food name keywords → default serving weight in grams.

export const INDIAN_PORTION_DEFAULTS: Record<string, number> = {
  dal:           150,   // 1 katori (150ml bowl)
  chawal:        200,   // 1 cup cooked rice
  rice:          200,
  roti:           45,   // 1 roti / chapati
  chapati:        45,
  paratha:        80,
  naan:           90,
  bhatura:       100,
  puri:           40,
  samosa:         90,   // 1 medium samosa
  dosa:          100,
  idli:           60,   // 1 idli
  vada:           50,
  biryani:       250,   // 1 plate (half-plate)
  pulao:         200,
  khichdi:       200,
  raita:         100,
  papad:          12,
  dhokla:         60,
  pakoda:         50,
  gulab_jamun:    60,
  jalebi:         60,
  kheer:         150,
  halwa:         100,
  ladoo:          50,
  sabzi:         150,   // generic curry served in katori
  curry:         150,
  chai:          150,   // 1 cup tea
  milk:          200,
  curd:          100,
  paneer:        100,
  default:       100,   // fallback
};

/** Return default serving weight (g) for a detected food name. */
export function getPortionDefault(foodName: string): number {
  const lower = foodName.toLowerCase();
  for (const [key, grams] of Object.entries(INDIAN_PORTION_DEFAULTS)) {
    if (lower.includes(key)) return grams;
  }
  return INDIAN_PORTION_DEFAULTS.default;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const MIN_FILE_SIZE = 50 * 1024;       // 50 KB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_DIMENSION = 300;

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

async function validateImage(uri: string): Promise<ValidationResult> {
  try {
    const info = await FileSystem.getInfoAsync(uri) as any;
    if (!info.exists) return { valid: false, reason: 'File does not exist' };

    const size = (info as any).size ?? 0;
    if (size < MIN_FILE_SIZE) {
      return { valid: false, reason: `Image too small (${Math.round(size / 1024)} KB). Minimum 50 KB.` };
    }
    if (size > MAX_FILE_SIZE) {
      return { valid: false, reason: `Image too large (${Math.round(size / (1024 * 1024))} MB). Maximum 10 MB.` };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Cannot read image file.' };
  }
}

// ─── Compress ─────────────────────────────────────────────────────────────────

async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],         // max 1024px wide, height auto-scales
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

// ─── detectFoodFromPhoto ──────────────────────────────────────────────────────

/**
 * Full photo detection pipeline:
 *  1. Validate file (size + basic existence)
 *  2. Compress to 1024px / 80% JPEG
 *  3. Convert to base64
 *  4. Call food-detect Edge Function (photo mode)
 *  5. Return enriched foods or { tier: 'manual', reason }
 */
export async function detectFoodFromPhoto(
  imageUri: string,
): Promise<PhotoDetectResponse> {
  // 1. Validate
  const validation = await validateImage(imageUri);
  if (!validation.valid) {
    return { tier: 'manual', reason: validation.reason ?? 'invalid_image' };
  }

  // 2. Compress
  let processedUri: string;
  try {
    processedUri = await compressImage(imageUri);
  } catch {
    // If compression fails, continue with original (Edge Function will validate)
    processedUri = imageUri;
  }

  // 3. Convert to base64
  let imageBase64: string;
  try {
    imageBase64 = await FileSystem.readAsStringAsync(processedUri, {
      encoding: 'base64' as any,
    });
  } catch {
    return { tier: 'manual', reason: 'base64_conversion_failed' };
  }

  // 4. Call Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('food-detect', {
      body: { mode: 'photo', imageBase64 },
    });

    if (error) {
      console.error('[foodDetect] Edge Function error:', error);
      return { tier: 'manual', reason: 'edge_function_error' };
    }

    return data as PhotoDetectResponse;
  } catch (err) {
    console.error('[foodDetect] Network error:', err);
    return { tier: 'manual', reason: 'network_error' };
  }
}

// ─── Voice detection ──────────────────────────────────────────────────────────

import { buildFoodItemFromDetected } from './nutritionLookup';
import type { FoodItem } from './nutritionLookup';

export interface VoiceDetectResult {
  transcript: string;
  items: FoodItem[];
  meal_type: string;
}

/**
 * Full voice detection pipeline:
 *  1. Read audio file as base64
 *  2. Call food-detect Edge Function (voice mode)
 *  3. Edge Function returns { transcript, items (with nutrition) }
 *  4. Map items → FoodItem[] via buildFoodItemFromDetected
 */
export async function detectFoodFromVoice(
  audioUri: string,
  mimeType = 'audio/m4a',
): Promise<VoiceDetectResult> {
  // 1. Read audio as base64
  let audioBase64: string;
  try {
    audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64' as any,
    });
  } catch {
    throw new Error('Failed to read audio file as base64');
  }

  // 2. Call Edge Function
  const { data, error } = await supabase.functions.invoke('food-detect', {
    body: { mode: 'voice', audioBase64, mimeType },
  });

  if (error) throw new Error(error.message ?? 'Voice detection failed');

  const { transcript = '', items: rawItems = [], meal_type = 'snack' } = data as {
    transcript: string;
    items: DetectedFoodItem[];
    meal_type: string;
  };

  // 3. Map DetectedFoodItem[] → FoodItem[] using the same helper as photo mode
  const items: FoodItem[] = (rawItems as DetectedFoodItem[]).map(
    (item, i) => buildFoodItemFromDetected(item, i),
  );

  return { transcript, items, meal_type };
}

