import { LabelData } from '../components/LabelResultView';

export interface ProductData extends LabelData {
  productName: string;
}

export async function lookupBarcode(barcode: string): Promise<ProductData | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const n = data.product.nutriments || {};
    
    return {
      productName: data.product.product_name || 'Unknown Product',
      servingSize: '100g', // OFF typically provides per 100g if serving size isn't clear
      calories: (n['energy-kcal_100g'] || n['energy-kcal'] || 0).toString(),
      protein: (n['proteins_100g'] || n['proteins'] || 0).toString(),
      carbs: (n['carbohydrates_100g'] || n['carbohydrates'] || 0).toString(),
      fat: (n['fat_100g'] || n['fat'] || 0).toString(),
      sodium: (n['sodium_100g'] ? n['sodium_100g'] * 1000 : n['sodium'] ? n['sodium'] * 1000 : 0).toString(), // convert g to mg
      sugar: (n['sugars_100g'] || n['sugars'] || 0).toString(),
    };
  } catch (err) {
    console.error('[barcodeScanner] Error fetching barcode:', err);
    return null;
  }
}
