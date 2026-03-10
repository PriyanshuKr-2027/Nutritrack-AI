import { LabelData } from '../components/LabelResultView';

export function parseNutritionLabel(rawText: string): Partial<LabelData> {
  const parseVal = (regex: RegExp): string => {
    const match = rawText.match(regex);
    return match && match[1] ? match[1].trim() : '';
  };

  // Convert kJ to kcal if 'energy' only has kJ, but standard regex looks for kcal
  let energy = parseVal(/energy[\s:]+([\d.]+)\s*kcal/i);
  if (!energy) {
    // try to find kJ and convert
    const kj = parseVal(/energy[\s:]+([\d.]+)\s*kj/i);
    if (kj) {
      energy = Math.round(parseFloat(kj) / 4.184).toString();
    }
  }

  return {
    servingSize: parseVal(/serving\s+size[\s:]+(.+?)(?:\n|$)/i),
    calories: energy || parseVal(/(?:calories|energy)[\s:]+([\d.]+)/i),
    protein: parseVal(/protein[\s:]+([\d.]+)\s*g/i),
    carbs: parseVal(/carbohydrate[s]?[\s:]+([\d.]+)\s*g/i),
    fat: parseVal(/(?:total\s+)?fat[\s:]+([\d.]+)\s*g/i),
    sodium: parseVal(/sodium[\s:]+([\d.]+)\s*mg/i),
    sugar: parseVal(/sugar[s]?[\s:]+([\d.]+)\s*g/i),
  };
}
