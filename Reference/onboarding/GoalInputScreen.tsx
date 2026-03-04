import React, { useState } from "react";

type Goal = "lose" | "maintain" | "gain";

interface GoalInputScreenProps {
  goal: Goal;
  currentWeight: number;
  onContinue: (data: { targetWeight?: number; duration?: string }) => void;
  currentStep: number;
  totalSteps: number;
}

const durations = [
  { id: "8weeks", label: "8 weeks" },
  { id: "12weeks", label: "12 weeks" },
  { id: "16weeks", label: "16 weeks" },
  { id: "custom", label: "Custom" },
];

export function GoalInputScreen({
  goal,
  currentWeight,
  onContinue,
  currentStep,
  totalSteps,
}: GoalInputScreenProps) {
  const [targetWeight, setTargetWeight] = useState("");
  const [duration, setDuration] = useState("8weeks");
  const [customWeeks, setCustomWeeks] = useState("");

  // Maintain goal doesn't need inputs
  if (goal === "maintain") {
    return (
      <div className="h-full w-full bg-black text-white flex flex-col px-6">
        {/* Progress Indicator */}
        <div className="pt-8 pb-6">
          <p className="text-xs text-zinc-500 text-center font-medium uppercase tracking-wider">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4">Perfect</h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              We'll calculate your maintenance plan.
            </p>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="pb-8 pt-4">
          <button
            onClick={() => onContinue({})}
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl active:scale-[0.98] transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const isValidTarget = targetWeight.trim() && !isNaN(Number(targetWeight)) && Number(targetWeight) > 0;
  const isValidDuration = duration !== "custom" || (customWeeks.trim() && !isNaN(Number(customWeeks)) && Number(customWeeks) > 0);
  const isValid = isValidTarget && isValidDuration;
  
  // Check if target is aggressive
  const weightDiff = Math.abs(Number(targetWeight) - currentWeight);
  const weeksMap: Record<string, number> = { "8weeks": 8, "12weeks": 12, "16weeks": 16 };
  const weeks = duration === "custom" ? Number(customWeeks) : (weeksMap[duration] || 8);
  const weeklyChange = weightDiff / weeks;
  const isAggressive = weeklyChange > 1; // More than 1kg per week is aggressive

  const handleContinue = () => {
    const finalDuration = duration === "custom" ? `${customWeeks}weeks` : duration;
    onContinue({ targetWeight: Number(targetWeight), duration: finalDuration });
  };

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
        <h1 className="text-3xl font-bold mb-8">Set your target</h1>

        {/* Current Weight (Read-only) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">Current Weight</label>
          <div className="w-full px-4 py-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500">
            {currentWeight} kg
          </div>
        </div>

        {/* Target Weight */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">
            Target Weight (kg)
          </label>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder={goal === "lose" ? "e.g., 70" : "e.g., 80"}
            className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Duration Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">Target Duration</label>
          <div className="grid grid-cols-2 gap-3">
            {durations.map((d) => (
              <button
                key={d.id}
                onClick={() => setDuration(d.id)}
                className={`py-4 rounded-2xl font-medium transition-all ${
                  duration === d.id
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration Input */}
        {duration === "custom" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              Number of Weeks
            </label>
            <input
              type="number"
              value={customWeeks}
              onChange={(e) => setCustomWeeks(e.target.value)}
              placeholder="e.g., 10"
              className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
        )}

        {/* Warning */}
        {isValid && isAggressive && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-sm text-amber-400">
              ⚠️ This goal may be difficult to sustain.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="pb-8 pt-4">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-zinc-800 active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}