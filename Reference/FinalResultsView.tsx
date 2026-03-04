import React from "react";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import foodImg from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";

export interface MacroData {
  label: string;
  value: number; // in grams
  unit: string;
  color: string; // Tailwind color class for bar
  total?: number; // for progress calculation (optional, or we assume a max)
}

export interface FinalResultData {
  name: string;
  mealType: string;
  timestamp: string;
  image: string;
  calories: number;
  macros: {
    protein: MacroData;
    carbs: MacroData;
    fat: MacroData;
  };
  ingredients: {
    name: string;
    amount: string;
  }[];
}

// Mock Data matching the design
const MOCK_RESULT: FinalResultData = {
  name: "Samosa",
  mealType: "Snack",
  timestamp: "Today, 4:30 PM",
  image: foodImg,
  calories: 550,
  macros: {
    protein: { label: "Protein", value: 10, unit: "g", color: "bg-green-500" },
    carbs: { label: "Carbs", value: 65, unit: "g", color: "bg-yellow-500" },
    fat: { label: "Fat", value: 32, unit: "g", color: "bg-blue-500" }
  },
  ingredients: [
    { name: "Potato filling", amount: "80g" },
    { name: "Wheat flour", amount: "40g" },
    { name: "Oil", amount: "15ml" },
    { name: "Spices", amount: "5g" }
  ]
};

interface FinalResultsViewProps {
  onBack: () => void;
  onDone: () => void;
  data?: FinalResultData;
}

export function FinalResultsView({ onBack, onDone, data = MOCK_RESULT }: FinalResultsViewProps) {
  // Helper to calculate progress bar width
  // Simple heuristic: max value ~ 100g or sum of macros
  const maxMacro = Math.max(
    data.macros.protein.value, 
    data.macros.carbs.value, 
    data.macros.fat.value
  ) * 1.2; // 20% buffer

  const getWidth = (val: number) => `${Math.min((val / maxMacro) * 100, 100)}%`;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center justify-between z-10 shrink-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold">{data.name}</h1>
          <span className="text-xs text-zinc-500">{data.mealType} • {data.timestamp}</span>
        </div>

        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <Pencil size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Food Image */}
        <div className="flex justify-center mb-8 mt-4">
          <div className="w-48 h-48 rounded-full overflow-hidden border border-zinc-800 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)] bg-zinc-900 relative">
             <div className="absolute inset-0 rounded-full border border-white/5 z-10"></div>
             <img 
               src={data.image} 
               alt={data.name} 
               className="w-full h-full object-cover"
             />
          </div>
        </div>

        {/* Nutrition Card */}
        <div className="bg-zinc-900 rounded-[32px] p-6 mb-8 border border-zinc-800">
          <div className="text-center mb-8">
            <h2 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-1">Total Energy</h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-white tracking-tighter">{data.calories}</span>
              <span className="text-lg text-zinc-500 font-medium">kcal</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400 font-medium">Protein</span>
                <span className="text-white font-bold">{data.macros.protein.value}{data.macros.protein.unit}</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${data.macros.protein.color}`} 
                  style={{ width: getWidth(data.macros.protein.value) }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400 font-medium">Carbs</span>
                <span className="text-white font-bold">{data.macros.carbs.value}{data.macros.carbs.unit}</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${data.macros.carbs.color}`} 
                  style={{ width: getWidth(data.macros.carbs.value) }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400 font-medium">Fat</span>
                <span className="text-white font-bold">{data.macros.fat.value}{data.macros.fat.unit}</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${data.macros.fat.color}`} 
                  style={{ width: getWidth(data.macros.fat.value) }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div>
          <h3 className="text-lg font-bold mb-4 px-1">Ingredients</h3>
          <div className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50">
            {data.ingredients.map((ing, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <span className="font-medium text-zinc-200">{ing.name}</span>
                </div>
                <span className="text-sm text-zinc-500 font-medium tabular-nums">{ing.amount}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-12 z-20">
        <button 
          onClick={onDone}
          className="w-full bg-green-500 text-black text-lg font-bold py-4 rounded-full active:scale-[0.98] transition-transform shadow-[0_4px_20px_-4px_rgba(34,197,94,0.4)]"
        >
          Done
        </button>
      </div>
    </div>
  );
}