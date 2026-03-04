import React, { useState } from "react";
import { 
  ArrowLeft, 
  Pencil, 
  Minus, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Wheat, 
  Egg,
  Trash2
} from "lucide-react";
import samosaImg from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";
import chowmeinImg from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";

export type PortionType = "quantity" | "size";

export interface Ingredient {
  id: string;
  name: string;
  detail: string;
  amount: string;
  icon?: React.ReactNode;
}

export interface FoodItemData {
  name: string;
  image: string;
  type: PortionType;
  mealType: string;
  timestamp: string;
  unit: string;
  defaultQuantity: number;
  ingredients: Ingredient[];
  sizes?: string[]; // e.g. ["Small", "Medium", "Large"]
}

// Mock Data for scenarios
export const SAMOSA_DATA: FoodItemData = {
  name: "Samosa",
  image: samosaImg,
  type: "quantity",
  mealType: "Snack",
  timestamp: "Today, 4:30 PM",
  unit: "pieces",
  defaultQuantity: 2,
  ingredients: [
    { id: "1", name: "Potato filling", detail: "Spiced mashed potatoes", amount: "80 g", icon: <div className="w-2 h-3 bg-yellow-200 rounded-full" /> },
    { id: "2", name: "Wheat flour", detail: "Pastry shell", amount: "40 g", icon: <Wheat size={16} className="text-yellow-600" /> },
  ]
};

export const CHOWMEIN_DATA: FoodItemData = {
  name: "Chowmein",
  image: chowmeinImg,
  type: "size",
  mealType: "Lunch",
  timestamp: "Today, 1:15 PM",
  unit: "plate(s)",
  defaultQuantity: 1,
  sizes: ["Small", "Medium", "Large"],
  ingredients: [
    { id: "1", name: "Noodles", detail: "Wheat noodles", amount: "150 g", icon: <Utensils size={16} className="text-yellow-100" /> },
    { id: "2", name: "Vegetables", detail: "Mixed cabbage, carrot", amount: "50 g", icon: <div className="w-3 h-3 bg-green-400 rounded-full" /> },
  ]
};

interface EditEntryViewProps {
  onBack: () => void;
  onConfirm: () => void;
  onAddIngredient: () => void;
  initialData?: FoodItemData; // Optional, defaults to Samosa if not provided
  addedIngredients?: Ingredient[];
}

export function EditEntryView({ onBack, onConfirm, onAddIngredient, initialData = SAMOSA_DATA, addedIngredients = [] }: EditEntryViewProps) {
  // State
  const [quantity, setQuantity] = useState(initialData.defaultQuantity);
  const [selectedSize, setSelectedSize] = useState("Medium");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualWeight, setManualWeight] = useState("");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleDeleteIngredient = (id: string) => {
    setDeletedIds(prev => [...prev, id]);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center justify-between z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Review & Adjust</span>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden px-6 pb-32">
        
        {/* Food Image */}
        <div className="flex justify-center mb-6 mt-2">
          <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-zinc-800 shadow-2xl bg-zinc-900">
            <img 
              src={initialData.image} 
              alt={initialData.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{initialData.name}</h1>
            <Pencil size={18} className="text-zinc-500" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
            <div className="flex items-center gap-1 bg-zinc-800 px-3 py-1 rounded-full">
              <Utensils size={12} className="text-green-500" />
              <span>{initialData.mealType}</span>
            </div>
            <span>•</span>
            <span>{initialData.timestamp}</span>
          </div>
        </div>

        {/* Portion Card */}
        <div className="bg-zinc-900 rounded-3xl p-6 mb-8 border border-zinc-800">
          
          {/* Size Selector (Conditional) */}
          {initialData.type === "size" && initialData.sizes && (
            <div className="mb-6">
              <div className="text-sm text-zinc-400 font-medium mb-3 uppercase tracking-wider">Serving Size</div>
              <div className="flex bg-zinc-800/50 p-1 rounded-full relative">
                {initialData.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-200 z-10 ${
                        isSelected 
                          ? "bg-green-800/30 text-green-400 border border-green-700/50" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Control */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-medium">Quantity</span>
            <span className="text-sm text-zinc-500">{initialData.unit}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4 h-16 bg-zinc-950/50 rounded-2xl px-2 border border-zinc-800/50">
            <button 
              onClick={handleDecrement}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300"
            >
              <Minus size={20} />
            </button>
            
            <span className="text-3xl font-semibold w-16 text-center tabular-nums">
              {quantity}
            </span>

            <button 
              onClick={handleIncrement}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-400 active:scale-95 transition-all text-black shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Advanced / Precise Adjustment */}
          <div className="mt-6 flex flex-col items-center">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-green-500 flex items-center gap-1 font-medium hover:text-green-400 transition-colors"
            >
              Adjust precisely
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div className="w-full mt-4 pt-4 border-t border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                <label className="text-xs text-zinc-400 mb-2 block uppercase tracking-wider">Manual Weight (g)</label>
                <input 
                  type="number"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="mb-4">
          <h3 className="text-base font-medium mb-4">Ingredients</h3>
          <div className="flex flex-col gap-3">
            {[...initialData.ingredients, ...addedIngredients]
              .filter(ing => !deletedIds.includes(ing.id))
              .map((ing) => (
              <div key={ing.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    {ing.icon || <div className="w-3 h-3 bg-zinc-500 rounded-full" />}
                  </div>
                  <div>
                    <div className="font-medium">{ing.name}</div>
                    <div className="text-xs text-zinc-500">{ing.detail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-300 font-medium">{ing.amount}</span>
                  <button 
                    onClick={() => handleDeleteIngredient(ing.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/50 text-zinc-500 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={onAddIngredient}
            className="w-full py-4 mt-2 text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add new ingredient
          </button>
        </div>

      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-12">
        <button 
          onClick={onConfirm}
          className="w-full bg-green-500 text-black text-lg font-bold py-4 rounded-full active:scale-[0.98] transition-transform shadow-lg shadow-green-900/20"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}