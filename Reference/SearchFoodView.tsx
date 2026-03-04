import React, { useState } from "react";
import { ArrowLeft, Search, Plus, X, Check } from "lucide-react";
import { FoodItemData, SAMOSA_DATA, CHOWMEIN_DATA } from "./EditEntryView";
import { haptics } from "../utils/haptics";

interface SearchFoodViewProps {
  onBack: () => void;
  onSelect: (data: FoodItemData[]) => void;
  onCustomFood: () => void;
}

const SEARCH_DB: { name: string; category: string; data: FoodItemData }[] = [
  { name: "Samosa", category: "Snack", data: SAMOSA_DATA },
  { name: "Golgappe", category: "Snack", data: { ...SAMOSA_DATA, name: "Golgappe", mealType: "Snack" } },
  { name: "Chowmein", category: "Meal", data: CHOWMEIN_DATA },
  { name: "Rajma Chawal", category: "Meal", data: { ...CHOWMEIN_DATA, name: "Rajma Chawal", mealType: "Meal" } },
  { name: "Banana", category: "Fruit", data: { ...SAMOSA_DATA, name: "Banana", mealType: "Fruit", unit: "pieces" } },
  { name: "Coke", category: "Drink", data: { ...SAMOSA_DATA, name: "Coke", mealType: "Drink", unit: "can" } },
];

export function SearchFoodView({ onBack, onSelect, onCustomFood }: SearchFoodViewProps) {
  const [query, setQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<FoodItemData[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const filtered = query.trim() === "" 
    ? [] 
    : SEARCH_DB.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  const displayList = query.trim() === "" ? SEARCH_DB : filtered;
  const showEmptyState = query.trim() !== "" && filtered.length === 0;

  const isItemSelected = (itemData: FoodItemData) => {
    return selectedItems.some(selected => selected.name === itemData.name);
  };

  const toggleItemSelection = (itemData: FoodItemData) => {
    setSelectedItems(prev => {
      const isAlreadySelected = prev.some(item => item.name === itemData.name);
      if (isAlreadySelected) {
        return prev.filter(item => item.name !== itemData.name);
      } else {
        return [...prev, itemData];
      }
    });
  };

  // Handle touch start - start long press timer
  const handleTouchStart = (itemData: FoodItemData) => {
    const timer = setTimeout(() => {
      // Long press detected - trigger haptic feedback
      haptics.impact();
      // Enter multi-select mode
      setIsMultiSelectMode(true);
      toggleItemSelection(itemData);
      // Clear the timer to mark it as "executed"
      setLongPressTimer(null);
    }, 500); // 500ms long press threshold
    setLongPressTimer(timer);
  };

  // Handle touch end - clear timer if not yet fired
  const handleTouchEnd = (itemData: FoodItemData, e: React.TouchEvent) => {
    if (longPressTimer) {
      // Timer hasn't fired yet, this was a tap
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      // Execute the tap action
      handleItemClick(itemData);
      e.preventDefault(); // Prevent click event
    }
    // If timer is null, the long press already fired, do nothing
  };

  const handleItemClick = (itemData: FoodItemData, e?: React.MouseEvent) => {
    // Prevent double execution from touch events
    if (e && e.type === 'click' && longPressTimer !== null) {
      return;
    }
    
    if (isMultiSelectMode) {
      // Multi-select mode: toggle checkbox
      toggleItemSelection(itemData);
    } else {
      // Single tap in normal mode: go directly to confirmation
      onSelect([itemData]);
    }
  };

  const handleContinue = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
    }
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedItems([]);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col z-[150] relative">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center gap-4 z-10 shrink-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center pr-8">Search food</h1>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <Search size={20} />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food"
            autoFocus
            className="w-full bg-zinc-800 rounded-full pl-12 pr-12 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all text-base"
          />
          {query.length > 0 && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white bg-zinc-700/50 rounded-full p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Multi-select mode indicator */}
        {isMultiSelectMode && (
          <div className="mt-3 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-sm text-green-400 font-medium">
              Multi-select mode • Tap items to select
            </span>
            <button
              onClick={exitMultiSelectMode}
              className="text-green-400 hover:text-green-300 font-medium text-sm"
            >
              Exit
            </button>
          </div>
        )}

        {/* Hint text */}
        {!isMultiSelectMode && (
          <p className="text-xs text-zinc-600 mt-3 text-center">
            Tap to select • Press & hold to multi-select
          </p>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center mt-20 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
             {/* Empty state content if needed, but the footer handles the action */}
             <p className="text-zinc-500">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {displayList.map((item, idx) => {
              const isSelected = isItemSelected(item.data);
              return (
                <div 
                  key={idx}
                  onClick={(e) => handleItemClick(item.data, e)}
                  onTouchStart={() => handleTouchStart(item.data)}
                  onTouchEnd={(e) => handleTouchEnd(item.data, e)}
                  className={`group flex items-center gap-3 py-4 border-b border-zinc-900 active:bg-zinc-900/30 transition-all cursor-pointer ${isSelected && isMultiSelectMode ? 'bg-zinc-900/50' : ''}`}
                >
                  {/* Checkbox - Only show in multi-select mode */}
                  {isMultiSelectMode && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemSelection(item.data);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-zinc-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={14} className="text-black font-bold" />}
                    </div>
                  )}

                  {/* Food Info */}
                  <div className="flex-1">
                    <div className="font-bold text-white text-[17px] mb-0.5">{item.name}</div>
                    <div className="text-sm text-zinc-500">{item.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-black via-black to-transparent pointer-events-none">
        <div className="flex flex-col gap-3">
          {/* Continue Button - Only show in multi-select mode when items are selected */}
          {isMultiSelectMode && selectedItems.length > 0 && (
            <button 
              onClick={handleContinue}
              className="pointer-events-auto w-full bg-green-500 text-black font-bold rounded-2xl px-6 py-5 shadow-lg shadow-green-900/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <span>Continue with {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Custom Food Button - More subtle, secondary action */}
          <button 
            onClick={onCustomFood}
            className="pointer-events-auto w-full text-center py-3 active:scale-95 transition-transform"
          >
            <span className="text-zinc-500 text-sm">Can't find your food? </span>
            <span className="text-green-500 font-medium text-sm underline underline-offset-2">Add custom food</span>
          </button>
        </div>
      </div>
    </div>
  );
}