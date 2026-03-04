import React, { useState } from "react";
import { ArrowLeft, Minus, Plus } from "lucide-react";

export interface LabelData {
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  sugar: string;
}

interface LabelResultViewProps {
  onBack: () => void;
  onConfirm: (data: LabelData, servings: number) => void;
  initialData: LabelData;
  capturedImage?: string;
}

export function LabelResultView({ 
  onBack, 
  onConfirm, 
  initialData,
  capturedImage 
}: LabelResultViewProps) {
  const [servings, setServings] = useState(1);
  const [editedData, setEditedData] = useState<LabelData>(initialData);

  const handleFieldChange = (field: keyof LabelData, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const incrementServings = () => setServings(s => s + 1);
  const decrementServings = () => setServings(s => Math.max(1, s - 1));

  // Calculate totals based on servings
  const calculateTotal = (baseValue: string): string => {
    const num = parseFloat(baseValue) || 0;
    return (num * servings).toFixed(1);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center justify-between z-10 border-b border-zinc-900">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Nutrition Label</span>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-40">
        
        {/* Captured Label Preview */}
        {capturedImage && (
          <div className="mt-6 mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Scanned Label</p>
            <div className="w-full h-56 rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-900">
              <img 
                src={capturedImage} 
                alt="Nutrition label" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Servings Counter */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Number of Servings</p>
              <p className="text-sm text-zinc-400">{editedData.servingSize || "Per serving"}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4 h-16 bg-zinc-950/50 rounded-2xl px-2">
            <button 
              onClick={decrementServings}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300"
            >
              <Minus size={20} />
            </button>
            
            <span className="text-3xl font-semibold w-16 text-center tabular-nums">
              {servings}
            </span>

            <button 
              onClick={incrementServings}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-400 active:scale-95 transition-all text-black shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Extracted Values - Editable */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Nutrition Facts</h3>
          
          {/* Serving Size */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium block mb-2">Serving Size</label>
            <input 
              type="text"
              value={editedData.servingSize}
              onChange={(e) => handleFieldChange("servingSize", e.target.value)}
              placeholder="e.g., 1 cup (240ml)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Calories */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Calories</label>
              <span className="text-sm text-green-400 font-bold">
                {calculateTotal(editedData.calories)} kcal total
              </span>
            </div>
            <input 
              type="text"
              value={editedData.calories}
              onChange={(e) => handleFieldChange("calories", e.target.value)}
              placeholder="e.g., 200"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Protein */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Protein (g)</label>
              <span className="text-sm text-zinc-400 font-medium">{calculateTotal(editedData.protein)}g</span>
            </div>
            <input 
              type="text"
              value={editedData.protein}
              onChange={(e) => handleFieldChange("protein", e.target.value)}
              placeholder="e.g., 8"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Carbs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Carbs (g)</label>
              <span className="text-sm text-zinc-400 font-medium">{calculateTotal(editedData.carbs)}g</span>
            </div>
            <input 
              type="text"
              value={editedData.carbs}
              onChange={(e) => handleFieldChange("carbs", e.target.value)}
              placeholder="e.g., 24"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Fat */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Fat (g)</label>
              <span className="text-sm text-zinc-400 font-medium">{calculateTotal(editedData.fat)}g</span>
            </div>
            <input 
              type="text"
              value={editedData.fat}
              onChange={(e) => handleFieldChange("fat", e.target.value)}
              placeholder="e.g., 8"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Sodium */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Sodium (mg)</label>
              <span className="text-sm text-zinc-400 font-medium">{calculateTotal(editedData.sodium)}mg</span>
            </div>
            <input 
              type="text"
              value={editedData.sodium}
              onChange={(e) => handleFieldChange("sodium", e.target.value)}
              placeholder="e.g., 140"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Sugar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Sugar (g)</label>
              <span className="text-sm text-zinc-400 font-medium">{calculateTotal(editedData.sugar)}g</span>
            </div>
            <input 
              type="text"
              value={editedData.sugar}
              onChange={(e) => handleFieldChange("sugar", e.target.value)}
              placeholder="e.g., 12"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-12">
        <button 
          onClick={() => onConfirm(editedData, servings)}
          className="w-full bg-green-500 text-black text-lg font-bold py-4 rounded-full active:scale-[0.98] transition-transform shadow-lg shadow-green-900/20"
        >
          Add to Meal
        </button>
      </div>
    </div>
  );
}
