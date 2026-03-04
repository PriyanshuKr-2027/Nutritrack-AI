import React, { useState } from "react";

interface BodyStatsScreenProps {
  onContinue: (data: { height: string; weight: string; unit: "kg" | "lb" }) => void;
  currentStep: number;
  totalSteps: number;
}

export function BodyStatsScreen({ onContinue, currentStep, totalSteps }: BodyStatsScreenProps) {
  const [height, setHeight] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");

  // Convert feet/inches to cm
  const getHeightInCm = (): string => {
    if (heightUnit === "cm") {
      return height;
    } else {
      const feet = Number(heightFeet) || 0;
      const inches = Number(heightInches) || 0;
      const totalInches = feet * 12 + inches;
      const cm = totalInches * 2.54;
      return cm > 0 ? cm.toFixed(1) : "";
    }
  };

  const isValid = (() => {
    if (heightUnit === "cm") {
      return height.trim() && weight.trim() && !isNaN(Number(height)) && !isNaN(Number(weight)) && Number(height) > 0 && Number(weight) > 0;
    } else {
      return heightFeet.trim() && weight.trim() && !isNaN(Number(heightFeet)) && !isNaN(Number(weight)) && Number(heightFeet) >= 0 && Number(weight) > 0;
    }
  })();

  const handleContinue = () => {
    const heightInCm = getHeightInCm();
    onContinue({ height: heightInCm, weight, unit });
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
        <h1 className="text-3xl font-bold mb-8">Your body stats</h1>

        {/* Height Unit Toggle */}
        <div className="flex justify-between items-center mb-6">
          <label className="text-sm font-medium text-zinc-400">Height</label>
          <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              onClick={() => setHeightUnit("cm")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                heightUnit === "cm" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              cm
            </button>
            <button
              onClick={() => setHeightUnit("ft")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                heightUnit === "ft" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              ft
            </button>
          </div>
        </div>

        {/* Height Input - CM */}
        {heightUnit === "cm" && (
          <div className="mb-6">
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Enter height in cm"
              className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
        )}

        {/* Height Input - Feet & Inches */}
        {heightUnit === "ft" && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-2 ml-1">Feet</label>
              <input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                placeholder="5"
                className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-2 ml-1">Inches</label>
              <input
                type="number"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
        )}

        {/* Conversion Preview */}
        {heightUnit === "ft" && (heightFeet || heightInches) && (
          <div className="mb-6 -mt-3 px-1">
            <p className="text-xs text-green-500 font-medium">
              ≈ {getHeightInCm()} cm
            </p>
          </div>
        )}

        {/* Weight Unit Toggle */}
        <div className="flex justify-between items-center mb-6 mt-8">
          <label className="text-sm font-medium text-zinc-400">Weight</label>
          <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              onClick={() => setUnit("kg")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                unit === "kg" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              kg
            </button>
            <button
              onClick={() => setUnit("lb")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                unit === "lb" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              lb
            </button>
          </div>
        </div>

        {/* Weight Input */}
        <div className="mb-6">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={`Enter weight in ${unit}`}
            className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
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