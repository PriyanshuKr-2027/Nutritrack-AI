import React, { useState } from "react";
import { ArrowLeft, ChevronDown, Plus, Check, Trash2 } from "lucide-react";
import { FoodItemData } from "./EditEntryView";

interface CreateCustomFoodViewProps {
  onBack: () => void;
  onComplete: (data: FoodItemData) => void;
}

const CATEGORIES = ["Snack", "Meal", "Drink", "Fruit"];

export function CreateCustomFoodView({ onBack, onComplete }: CreateCustomFoodViewProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [portionType, setPortionType] = useState<"quantity" | "size" | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isValid = name.trim().length > 0 && category !== "" && portionType !== null;

  const handleAddIngredient = () => {
    // Simple mock implementation: Add a placeholder or allow typing
    // Ideally this would open an input dialog. For now, adding an empty string to focus?
    // Or just adding "New Ingredient" that they can rename?
    // Let's just add a blank string and render an input for it.
    setIngredients([...ingredients, ""]);
  };

  const updateIngredient = (index: number, val: string) => {
    const newIngs = [...ingredients];
    newIngs[index] = val;
    setIngredients(newIngs);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const data: FoodItemData = {
      name: name,
      mealType: category,
      timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // Use a generic placeholder image or empty
      image: "", 
      type: portionType as "quantity" | "size",
      unit: portionType === "quantity" ? "pieces" : "serving", // Default unit
      defaultQuantity: 1,
      // Map string ingredients to object structure if needed, or leave empty
      ingredients: ingredients
        .filter(i => i.trim() !== "")
        .map((i, idx) => ({
          id: `custom-${idx}`,
          name: i,
          detail: "Custom ingredient",
          amount: "1 serving",
          icon: <div className="w-2 h-2 bg-zinc-500 rounded-full" />
        }))
    };
    
    onComplete(data);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col z-[160]">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center gap-4 z-10 shrink-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center pr-8">Add custom food</h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
        
        {/* Food Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Food Name</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Homemade Paratha"
            className="w-full bg-zinc-900 rounded-2xl px-4 py-4 text-white placeholder-zinc-500 border border-transparent focus:border-green-500 focus:outline-none transition-all"
          />
        </div>

        {/* Category */}
        <div className="mb-8 relative">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full bg-zinc-900 rounded-2xl px-4 py-4 text-left flex items-center justify-between border ${isDropdownOpen ? 'border-green-500' : 'border-transparent'} transition-all`}
          >
            <span className={category ? "text-white" : "text-zinc-500"}>
              {category || "Select category"}
            </span>
            <ChevronDown size={20} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden z-20 shadow-xl">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center justify-between"
                >
                  {cat}
                  {category === cat && <Check size={16} className="text-green-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Portion Type */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-white mb-4">How is this food usually eaten?</h3>
          
          <div className="space-y-3">
            {/* Quantity Option */}
            <div 
              onClick={() => setPortionType("quantity")}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                portionType === "quantity" 
                  ? "bg-green-500/10 border-green-500" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="font-bold text-white mb-0.5">Quantity</div>
                <div className="text-xs text-zinc-500">pieces / plates</div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                portionType === "quantity" ? "border-green-500" : "border-zinc-600"
              }`}>
                {portionType === "quantity" && <div className="w-3 h-3 rounded-full bg-green-500" />}
              </div>
            </div>

            {/* Size Option */}
            <div 
              onClick={() => setPortionType("size")}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                portionType === "size" 
                  ? "bg-green-500/10 border-green-500" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="font-bold text-white mb-0.5">Size</div>
                <div className="text-xs text-zinc-500">small / medium / large</div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                portionType === "size" ? "border-green-500" : "border-zinc-600"
              }`}>
                {portionType === "size" && <div className="w-3 h-3 rounded-full bg-green-500" />}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-zinc-600 mt-3">This helps us choose the right portion controls later.</p>
        </div>

        {/* Ingredient Template */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Ingredient template <span className="text-zinc-500 font-normal">(optional)</span></h3>
          </div>

          <div className="space-y-3 mb-4">
            {ingredients.map((ing, idx) => (
               <div key={idx} className="flex items-center gap-3">
                 <input 
                   type="text"
                   value={ing}
                   onChange={(e) => updateIngredient(idx, e.target.value)}
                   placeholder="Ingredient name"
                   autoFocus={ing === ""}
                   className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 text-white placeholder-zinc-500 border border-zinc-800 focus:border-green-500 focus:outline-none text-sm"
                 />
                 <button 
                   onClick={() => removeIngredient(idx)}
                   className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-500"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
            ))}
          </div>

          <button 
            onClick={handleAddIngredient}
            className="w-full py-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 flex items-center justify-center gap-2 text-green-500 font-medium transition-colors"
          >
            <Plus size={18} />
            Add ingredient
          </button>
        </div>
      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-12 z-20">
        <button 
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full text-lg font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 ${
            isValid 
              ? "bg-green-800 text-white shadow-[0_4px_20px_-4px_rgba(22,101,52,0.5)] active:scale-[0.98]" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Create & Continue
          {isValid && <ArrowLeft size={20} className="rotate-180" />}
        </button>
      </div>
    </div>
  );
}
