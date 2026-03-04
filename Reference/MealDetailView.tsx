import React, { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, MoreHorizontal, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Reuse types or define specific ones for this view
export interface MealDetailData {
  id: string;
  name: string;
  image: string;
  calories: number;
  mealType: string;
  timestamp: string;
  macros: {
    protein: { value: number; max: number; color: string };
    carbs: { value: number; max: number; color: string };
    fat: { value: number; max: number; color: string };
  };
  ingredients?: { name: string; amount: string }[];
  labelNutrients?: { name: string; value: string }[];
  isLabelBased?: boolean;
}

interface MealDetailViewProps {
  data: MealDetailData;
  onBack: () => void;
  onDelete: () => void;
}

export function MealDetailView({ data, onBack, onDelete }: MealDetailViewProps) {
  const [isLabelExpanded, setIsLabelExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // Helper for progress bars
  const getProgress = (val: number, max: number) => Math.min((val / max) * 100, 100);

  return (
    <div className="h-full w-full bg-black text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center justify-between z-10 bg-black/80 backdrop-blur-md sticky top-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold">{data.name}</h1>
          <span className="text-xs text-zinc-500 font-medium">
            {data.mealType} • {data.timestamp}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowMenu(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 scrollbar-hide">
        
        {/* Image */}
        <div className="flex justify-center mb-8 mt-4">
          <div className="w-40 h-40 rounded-full overflow-hidden border border-zinc-800 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] bg-zinc-900 relative">
             <div className="absolute inset-0 rounded-full border border-white/5 z-10"></div>
             <img 
               src={data.image} 
               alt={data.name} 
               className="w-full h-full object-cover"
             />
          </div>
        </div>

        {/* Nutrition Summary Card */}
        <div className="bg-zinc-900 rounded-[32px] p-6 mb-6 border border-zinc-800">
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
                <span className="text-white font-bold">{data.macros.protein.value}g</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${data.macros.protein.color}`} 
                  style={{ width: `${getProgress(data.macros.protein.value, data.macros.protein.max)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400 font-medium">Carbs</span>
                <span className="text-white font-bold">{data.macros.carbs.value}g</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${data.macros.carbs.color}`} 
                  style={{ width: `${getProgress(data.macros.carbs.value, data.macros.carbs.max)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400 font-medium">Fat</span>
                <span className="text-white font-bold">{data.macros.fat.value}g</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${data.macros.fat.color}`} 
                  style={{ width: `${getProgress(data.macros.fat.value, data.macros.fat.max)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Label Nutrients (Conditional) */}
        {data.isLabelBased && data.labelNutrients && (
          <div className="mb-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
            <button 
              onClick={() => setIsLabelExpanded(!isLabelExpanded)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-bold text-white">Label Nutrients</span>
              {isLabelExpanded ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
            </button>
            
            <AnimatePresence>
              {isLabelExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    {data.labelNutrients.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b border-zinc-800/50 last:border-0 pb-2 last:pb-0">
                        <span className="text-zinc-400">{item.name}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Ingredients Section */}
        {data.ingredients && data.ingredients.length > 0 && (
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
        )}
      </div>

      {/* Bottom Sheet Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 p-6 pb-safe border-t border-zinc-800 shadow-2xl"
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
              <button 
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-500/10 active:bg-red-500/10 transition-colors text-red-500 font-medium"
              >
                <Trash2 size={20} />
                Delete Entry
              </button>
              <button 
                onClick={() => setShowMenu(false)}
                className="w-full mt-4 py-4 text-center text-zinc-500 font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}