import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Utensils } from "lucide-react";
import { motion } from "motion/react";

export interface FoodItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  calories: number;
  caloriesPerUnit: number;
  unit: string;
}

interface MultiItemConfirmViewProps {
  onBack: () => void;
  onConfirm: (items: FoodItem[]) => void;
  initialItems: FoodItem[];
  capturedImage?: string;
  onAddItem?: () => void;
}

export function MultiItemConfirmView({ 
  onBack, 
  onConfirm, 
  initialItems,
  capturedImage,
  onAddItem
}: MultiItemConfirmViewProps) {
  const [items, setItems] = useState<FoodItem[]>(initialItems);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity, calories: Math.round(item.caloriesPerUnit * newQuantity) }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

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
        <span className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Review Your Meal</span>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-40 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Captured Photo Preview (if available) */}
        {capturedImage && (
          <div className="mt-6 mb-6">
            <div className="w-full h-48 rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-900">
              <img 
                src={capturedImage} 
                alt="Captured meal" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Total Calories Card */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-3xl p-6 mb-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-400 font-medium mb-1">Total Meal</p>
              <p className="text-4xl font-bold text-white">{totalCalories}</p>
            </div>
            <div className="text-sm text-green-400 font-medium">
              <span className="text-xs uppercase tracking-wider">kcal</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <p className="text-xs text-green-400/80">{items.length} item{items.length !== 1 ? 's' : ''} detected</p>
          </div>
        </div>

        {/* Food Items List */}
        <div className="space-y-4 mb-6">
          <h3 className="text-base font-semibold text-zinc-400 uppercase tracking-wider text-sm">Detected Foods</h3>
          
          {items.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden"
            >
              {/* Delete Button */}
              <button 
                onClick={() => handleRemoveItem(item.id)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-red-500/20 hover:text-red-500 transition-colors z-10"
              >
                <Trash2 size={16} />
              </button>

              {/* Item Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 pr-8">
                  <h4 className="font-semibold text-base mb-1">{item.name}</h4>
                  <p className="text-sm text-zinc-500">{item.unit}</p>
                </div>
              </div>

              {/* Portion Slider */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Quantity</span>
                  <span className="text-lg font-bold text-green-400">{item.quantity}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-5 
                    [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-green-500 
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,197,94,0.5)]
                    [&::-moz-range-thumb]:w-5 
                    [&::-moz-range-thumb]:h-5 
                    [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-green-500 
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>

              {/* Calories Display */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Calories</span>
                <span className="text-xl font-bold text-white">{item.calories} <span className="text-sm text-zinc-500">kcal</span></span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Another Item Button */}
        <button 
          onClick={onAddItem}
          className="w-full py-4 mb-4 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-500 text-sm font-medium hover:border-zinc-700 hover:text-zinc-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add another item
        </button>
      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-12">
        <button 
          onClick={() => onConfirm(items)}
          disabled={items.length === 0}
          className="w-full bg-green-500 text-black text-lg font-bold py-4 rounded-full active:scale-[0.98] transition-transform shadow-lg shadow-green-900/20 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:shadow-none"
        >
          Confirm Meal ({totalCalories} kcal)
        </button>
      </div>
    </div>
  );
}