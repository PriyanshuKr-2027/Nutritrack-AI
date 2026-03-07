#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/seed_usda_foods.js  (v2 — no service-role key needed)
//
// Reads one or more USDA FoodData Central JSON files, extracts nutrition data,
// and writes it directly into usda_foods via the Supabase REST API (anon key
// is fine because the script runs server-side where RLS is bypassed by default
// when using the service-role key, OR we can use direct pg insertion).
//
// This version uses the @supabase/supabase-js client with the SERVICE ROLE KEY
// which bypasses RLS.  Set it via env or CLI arg 3.
//
// Usage:
//   node scripts/seed_usda_foods.js <json-file-path> [--limit=5000]
//     SUPABASE_URL=...
//     SUPABASE_SERVICE_ROLE_KEY=...
//
// JSON files accepted:
//   - Foundation Foods  (FoundationFoods array)
//   - SR Legacy         (SRLegacyFoods array)
//   - Branded Foods     (BrandedFoods array)
//   - Any FDC format
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── Config (edit these or set env vars) ──────────────────────────────────────

const SUPABASE_URL             = process.env.SUPABASE_URL
                                   || 'https://ehbkgvhiexvxzalrzzin.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const USDA_JSON_PATH           = process.env.USDA_JSON_PATH || process.argv[2] || '';
const BATCH_SIZE               = 500;
const TARGET                   = parseInt(process.env.LIMIT || '') || 5000;

// USDA FDC nutrient IDs
const NID = { ENERGY: 1008, PROTEIN: 1003, CARBS: 1005, FAT: 1004 };

// ── Nutrient extraction ───────────────────────────────────────────────────────

function getNutrient(arr, targetId) {
  if (!Array.isArray(arr)) return null;
  for (const fn of arr) {
    // Format A: { nutrient: { id }, amount }  ← Foundation, SR Legacy, Survey
    if (fn.nutrient?.id === targetId)  return fn.amount ?? null;
    // Format B: { nutrientId, value }          ← some Branded exports
    if (fn.nutrientId === targetId)    return fn.value  ?? null;
    // Format C: { number (string), amount }
    if (Number(fn.number) === targetId) return fn.amount ?? null;
    // Format D: { id, amount } flat
    if (fn.id === targetId)            return fn.amount ?? null;
  }
  return null;
}

// ── Food array detection ──────────────────────────────────────────────────────

function extractFoods(parsed) {
  for (const key of ['FoundationFoods','SRLegacyFoods','SurveyFoods','BrandedFoods','Foods','foods']) {
    if (Array.isArray(parsed[key])) {
      console.log(`  Format: "${key}" (${parsed[key].length.toLocaleString()} entries)`);
      return parsed[key];
    }
  }
  if (Array.isArray(parsed)) {
    console.log(`  Format: top-level array (${parsed.length.toLocaleString()} entries)`);
    return parsed;
  }
  for (const [k, v] of Object.entries(parsed)) {
    if (Array.isArray(v) && v.length > 0) {
      console.log(`  Format: "${k}" (${v.length.toLocaleString()} entries, auto-detected)`);
      return v;
    }
  }
  throw new Error('No food array found in JSON');
}

// ── Row builder ───────────────────────────────────────────────────────────────

function toRow(food) {
  const name = (food.description || food.lowercaseDescription || '').trim();
  if (!name || name.length > 500) return null;

  const nutrients = food.foodNutrients || food.nutrients || [];

  const calories = getNutrient(nutrients, NID.ENERGY);
  if (calories == null || calories <= 0) return null;    // skip if no energy data

  return {
    name,
    calories_per_100g: round2(calories),
    protein_per_100g:  round2(getNutrient(nutrients, NID.PROTEIN)),
    carbs_per_100g:    round2(getNutrient(nutrients, NID.CARBS)),
    fat_per_100g:      round2(getNutrient(nutrients, NID.FAT)),
  };
}

function round2(v) {
  return v != null ? Math.round(Number(v) * 100) / 100 : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seedFile(supabase, jsonPath, rows, seen) {
  console.log(`\n📂  Loading: ${path.basename(jsonPath)}`);
  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const foods  = extractFoods(parsed);

  let added = 0;
  for (const food of foods) {
    if (rows.length >= TARGET) break;
    const row = toRow(food);
    if (!row) continue;
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    added++;
  }
  console.log(`  Added ${added.toLocaleString()} unique rows (total so far: ${rows.length.toLocaleString()})`);
}

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  Missing SUPABASE_SERVICE_ROLE_KEY');
    console.error('    Set it as an env var before running:');
    console.error('    $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."');
    console.error('    node scripts/seed_usda_foods.js <json-path>');
    process.exit(1);
  }

  // Determine which files to process
  const jsonFiles = [];

  if (USDA_JSON_PATH && fs.existsSync(USDA_JSON_PATH)) {
    jsonFiles.push(USDA_JSON_PATH);
  } else {
    // Auto-find extracted files
    const extractDir = path.join(__dirname, '..', '..', '..', '..', 'usda_extracted');
    if (fs.existsSync(extractDir)) {
      (function walk(d) {
        for (const f of fs.readdirSync(d)) {
          const fp = path.join(d, f);
          if (fs.statSync(fp).isDirectory()) walk(fp);
          else if (f.endsWith('.json') && !f.includes('peek')) jsonFiles.push(fp);
        }
      })(extractDir);
    }
  }

  if (jsonFiles.length === 0) {
    console.error('❌  No JSON files found. Pass path as argument or set USDA_JSON_PATH.');
    process.exit(1);
  }

  console.log(`🗂️   Processing ${jsonFiles.length} file(s), target: ${TARGET.toLocaleString()} foods`);

  const rows = [];
  const seen = new Set();

  // Process: SR Legacy first (best data quality), then Foundation, then Branded
  const prioritized = [
    ...jsonFiles.filter(f => f.includes('sr_legacy')),
    ...jsonFiles.filter(f => f.includes('foundation')),
    ...jsonFiles.filter(f => !f.includes('sr_legacy') && !f.includes('foundation')),
  ];

  for (const fp of prioritized) {
    if (rows.length >= TARGET) break;
    await seedFile(null, fp, rows, seen);
  }

  console.log(`\n✅  Total rows to insert: ${rows.length.toLocaleString()}`);

  // ── Insert into Supabase ──────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let inserted = 0, failed = 0;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const n = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`  Batch ${n}/${totalBatches} (${batch.length} rows)… `);

    const { error } = await supabase
      .from('usda_foods')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });

    if (error) {
      console.error(`FAIL: ${error.message}`);
      failed += batch.length;
    } else {
      console.log('✓');
      inserted += batch.length;
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log(`✅  Inserted : ${inserted.toLocaleString()}`);
  console.log(`❌  Failed   : ${failed.toLocaleString()}`);
  console.log('════════════════════════════════════════');
}

main().catch(e => { console.error(e); process.exit(1); });
