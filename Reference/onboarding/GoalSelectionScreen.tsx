import React, { useState } from "react";

type Goal = "lose" | "maintain" | "gain";

interface GoalSelectionScreenProps {
  onContinue: (goal: Goal) => void;
  currentStep: number;
  totalSteps: number;
}

const goals = [
  {
    id: "lose" as Goal,
    title: "Lose Weight",
    description: "Create a calorie deficit",
  },
  {
    id: "maintain" as Goal,
    title: "Maintain Weight",
    description: "Balance your intake",
  },
  {
    id: "gain" as Goal,
    title: "Gain Muscle",
    description: "Build strength and size",
  },
];

export function GoalSelectionScreen({ onContinue, currentStep, totalSteps }: GoalSelectionScreenProps) {
  const [selected, setSelected] = useState<Goal | null>(null);

  return (
    <div className="h-full w-full bg-black text-white flex flex-col px-6">
      {/* Progress Indicator */}
      <div className="pt-8 pb-6">
        <p className="text-xs text-zinc-500 text-center font-medium uppercase tracking-wider">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        <h1 className="text-3xl font-bold mb-8">What's your goal?</h1>

        <div className="space-y-4">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelected(goal.id)}
              className={`w-full p-6 rounded-2xl text-left transition-all ${
                selected === goal.id
                  ? "bg-white text-black border-2 border-white"
                  : "bg-zinc-900 text-white border-2 border-zinc-800"
              }`}
            >
              <div className="font-semibold text-xl mb-1">{goal.title}</div>
              <div className={`text-sm ${selected === goal.id ? "text-zinc-700" : "text-zinc-500"}`}>
                {goal.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pb-8 pt-4">
        <button
          onClick={() => selected && onContinue(selected)}
          disabled={!selected}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-zinc-800 active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
