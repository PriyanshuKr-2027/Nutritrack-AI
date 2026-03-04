import React from "react";

interface PlanData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: string;
  targetWeight?: number;
  duration?: string;
}

interface PlanRevealScreenProps {
  plan: PlanData;
  onStart: () => void;
  onAdjust: () => void;
}

export function PlanRevealScreen({ plan, onStart, onAdjust }: PlanRevealScreenProps) {
  // Calculate percentages for macro bars
  const totalCals = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
  const proteinPercent = ((plan.protein * 4) / totalCals) * 100;
  const carbsPercent = ((plan.carbs * 4) / totalCals) * 100;
  const fatPercent = ((plan.fat * 9) / totalCals) * 100;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col px-6">
      {/* Content */}
      <div className="flex-1 overflow-y-auto pt-12 pb-4">
        <h1 className="text-3xl font-bold mb-2">Your personalized plan</h1>
        
        {plan.targetWeight && plan.duration && (
          <p className="text-sm text-zinc-500 mb-8">
            Based on your goal to reach {plan.targetWeight} kg in {plan.duration.replace("weeks", " weeks")}
          </p>
        )}

        {/* Daily Calories - Large Emphasis */}
        <div className="mb-12 text-center py-8">
          <div className="text-sm text-zinc-500 uppercase tracking-wider mb-3 font-medium">
            Daily Calories
          </div>
          <div className="text-6xl font-bold tracking-tight">
            {plan.calories.toLocaleString()}
          </div>
          <div className="text-zinc-600 text-lg mt-1">kcal</div>
        </div>

        {/* Macro Targets */}
        <div className="space-y-6 mb-8">
          {/* Protein */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Protein</span>
              <span className="text-sm font-bold text-white">{plan.protein}g</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Carbs</span>
              <span className="text-sm font-bold text-white">{plan.carbs}g</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Fat</span>
              <span className="text-sm font-bold text-white">{plan.fat}g</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Macro Distribution Visualization */}
        <div className="mb-8">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500"
              style={{ width: `${proteinPercent}%` }}
            />
            <div
              className="bg-yellow-500"
              style={{ width: `${carbsPercent}%` }}
            />
            <div
              className="bg-blue-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs">
            <span className="text-zinc-500">
              <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mr-1" />
              Protein {Math.round(proteinPercent)}%
            </span>
            <span className="text-zinc-500">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1" />
              Carbs {Math.round(carbsPercent)}%
            </span>
            <span className="text-zinc-500">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1" />
              Fat {Math.round(fatPercent)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="pb-8 pt-4 space-y-3">
        <button
          onClick={onStart}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl active:scale-[0.98] transition-all"
        >
          Start Tracking
        </button>
        <button
          onClick={onAdjust}
          className="w-full py-4 bg-transparent text-zinc-400 font-medium rounded-2xl border border-zinc-800 active:scale-[0.98] transition-all"
        >
          Adjust Plan
        </button>
      </div>
    </div>
  );
}
