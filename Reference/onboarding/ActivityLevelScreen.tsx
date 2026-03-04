import React, { useState } from "react";

type ActivityLevel = "sedentary" | "light" | "moderate" | "very";

interface ActivityLevelScreenProps {
  onContinue: (level: ActivityLevel) => void;
  currentStep: number;
  totalSteps: number;
}

const activities = [
  {
    id: "sedentary" as ActivityLevel,
    title: "Sedentary",
    description: "Little to no exercise",
  },
  {
    id: "light" as ActivityLevel,
    title: "Lightly Active",
    description: "1–3 workouts/week",
  },
  {
    id: "moderate" as ActivityLevel,
    title: "Moderately Active",
    description: "3–5 workouts/week",
  },
  {
    id: "very" as ActivityLevel,
    title: "Very Active",
    description: "Daily training",
  },
];

export function ActivityLevelScreen({ onContinue, currentStep, totalSteps }: ActivityLevelScreenProps) {
  const [selected, setSelected] = useState<ActivityLevel | null>(null);

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
        <h1 className="text-3xl font-bold mb-8">How active are you?</h1>

        <div className="space-y-4">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => setSelected(activity.id)}
              className={`w-full p-5 rounded-2xl text-left transition-all ${
                selected === activity.id
                  ? "bg-white text-black border-2 border-white"
                  : "bg-zinc-900 text-white border-2 border-zinc-800"
              }`}
            >
              <div className="font-semibold text-lg mb-1">{activity.title}</div>
              <div className={`text-sm ${selected === activity.id ? "text-zinc-700" : "text-zinc-500"}`}>
                {activity.description}
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
