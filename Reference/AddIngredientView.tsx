import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

const COMMON_INGREDIENTS = [
  "Olive Oil", "Salt", "Pepper", "Tomato", "Onion", "Garlic", "Chicken Breast", 
  "Rice", "Pasta", "Egg", "Milk", "Butter", "Cheese", "Spinach", "Avocado", 
  "Apple", "Banana", "Almonds", "Peanut Butter", "Bread", "Yogurt", "Oats",
  "Lemon", "Honey", "Soy Sauce", "Ginger", "Cinnamon", "Mayonnaise", "Potato",
  "Carrot", "Broccoli", "Cucumber", "Bell Pepper", "Mushroom", "Salmon", "Tuna",
  "Beef", "Pork", "Turkey", "Shrimp", "Tofu", "Lentils", "Chickpeas", "Beans",
  "Quinoa", "Couscous", "Corn", "Peas", "Zucchini", "Eggplant", "Cauliflower"
];

interface AddIngredientViewProps {
  onBack: () => void;
  onAdd: (ingredient: { name: string; amount: string; detail: string }) => void;
}

export function AddIngredientView({ onBack, onAdd }: AddIngredientViewProps) {
  const [name, setName] = useState("");
  const [unitType, setUnitType] = useState<"quantity" | "size">("quantity");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("Medium");
  const [selectedUnit, setSelectedUnit] = useState("pieces"); // pieces, spoon, cup, etc.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualWeight, setManualWeight] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (name.trim().length > 0) {
      const filtered = COMMON_INGREDIENTS.filter(ing => 
        ing.toLowerCase().includes(name.toLowerCase()) && 
        ing.toLowerCase() !== name.toLowerCase()
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name]);

  const handleSelectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
  };

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleAdd = () => {
    if (!name) return;
    
    let amount = "";
    let detail = "";

    if (manualWeight) {
      amount = `${manualWeight} g`;
      detail = "Manual weight";
    } else if (unitType === "size") {
      amount = `${quantity} ${selectedSize} ${selectedUnit}`;
      detail = "Size based";
    } else {
      amount = `${quantity} ${selectedUnit}`;
      detail = "Quantity based";
    }

    onAdd({ name, amount, detail });
  };

  const isFormValid = name.trim().length > 0;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden z-[130]">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center justify-between z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Add ingredient</span>
        <div className="w-10" /> 
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32 scrollbar-hide">
        
        {/* Name Input */}
        <div className="mb-8 relative">
          <label className="text-sm text-zinc-400 font-medium mb-3 block uppercase tracking-wider">Ingredient Name</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => {
              if (name && suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              // Delay hide to allow click
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="e.g. Olive Oil"
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
          />
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 rounded-xl shadow-xl border border-zinc-700 overflow-hidden z-20 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-5 py-3 hover:bg-zinc-700 transition-colors text-white border-b border-zinc-700/50 last:border-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unit Type Selection (Hidden complexity for user, but useful for demo) */}
        {/* I'll use chips to switch between common units which drive the UI */}
        <div className="mb-6">
          <label className="text-sm text-zinc-400 font-medium mb-3 block uppercase tracking-wider">Unit Type</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {["pieces", "spoon", "bowl", "cup", "slice"].map((u) => {
              const isActive = selectedUnit === u;
              return (
                <button
                  key={u}
                  onClick={() => {
                    setSelectedUnit(u);
                    // Infer type based on unit
                    if (["bowl", "cup"].includes(u)) {
                      setUnitType("size");
                    } else {
                      setUnitType("quantity");
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                    isActive 
                      ? "bg-green-500 text-black border-green-500" 
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Portion Card */}
        <div className="bg-zinc-900 rounded-3xl p-6 mb-8 border border-zinc-800">
          
          {/* Case B: Size Selector */}
          {unitType === "size" && (
            <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wider">Serving Size</div>
              <div className="flex bg-zinc-800/50 p-1 rounded-full relative">
                {["Small", "Medium", "Large"].map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-200 z-10 ${
                        isSelected 
                          ? "bg-zinc-700 text-white shadow-sm" 
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
            <span className="text-sm text-zinc-500 capitalize">{selectedUnit}</span>
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
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-white"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Advanced / Precise Adjustment */}
          <div className="mt-6 flex flex-col items-center">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-zinc-500 flex items-center gap-1 font-medium hover:text-white transition-colors"
            >
              Advanced options
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div className="w-full mt-4 pt-4 border-t border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                <label className="text-xs text-zinc-400 mb-2 block uppercase tracking-wider">Manual Weight (g)</label>
                <input 
                  type="number"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-12">
        <button 
          onClick={handleAdd}
          disabled={!isFormValid}
          className={`w-full text-lg font-bold py-4 rounded-full transition-all shadow-lg ${
            isFormValid 
              ? "bg-green-500 text-black active:scale-[0.98] shadow-green-900/20" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Add ingredient
        </button>
      </div>
    </div>
  );
}
