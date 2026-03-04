import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Target, TrendingDown, TrendingUp, Minus, ArrowRight, Sparkles, Calendar } from "lucide-react";

type OnboardingStep = "welcome" | "profile" | "goal";

interface OnboardingData {
  name?: string;
  age?: string;
  gender?: "male" | "female" | "other";
  height?: string;
  weight?: string;
  unit?: "metric" | "imperial";
  activityLevel?: "sedentary" | "light" | "moderate" | "active";
  goal?: "lose" | "maintain" | "gain";
  targetWeight?: string;
  weeks?: string;
}

interface QuickOnboardingFlowProps {
  onComplete: () => void;
}

export function QuickOnboardingFlow({ onComplete }: QuickOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile");
  const [data, setData] = useState<OnboardingData>({ unit: "metric", activityLevel: "moderate" });

  // All hooks must be at the top level - not conditional
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active">("moderate");
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">("lose");
  const [targetWeight, setTargetWeight] = useState("");
  const [weeks, setWeeks] = useState("12");

  // Sync local state with data when switching steps
  useEffect(() => {
    if (currentStep === "profile") {
      setName(data.name || "");
      setAge(data.age || "");
      setGender(data.gender || "male");
      setHeight(data.height || "");
      setWeight(data.weight || "");
      setUnit(data.unit || "metric");
      setActivity(data.activityLevel || "moderate");
    } else if (currentStep === "goal") {
      setGoal(data.goal || "lose");
      setTargetWeight(data.targetWeight || "");
      setWeeks(data.weeks || "12");
    }
  }, [currentStep, data]);

  const slideVariants = {
    enter: { x: "100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  };

  // Step 1: Profile - Simplified & Clean
  if (currentStep === "profile") {
    const handleContinue = () => {
      setData({
        ...data,
        name,
        age,
        gender,
        height,
        weight,
        unit,
        activityLevel: activity,
      });
      setCurrentStep("goal");
    };

    return (
      <motion.div
        key="profile"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="h-full w-full bg-black flex flex-col overflow-hidden"
      >
        {/* Simple Header */}
        <div className="px-6 pt-10 pb-8">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={onComplete} 
              className="text-zinc-500 text-sm"
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-green-500 rounded-full"></div>
              <div className="h-1 w-8 bg-zinc-800 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">About You</h2>
        </div>

        {/* Clean Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide space-y-8">
          
          {/* Name */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-zinc-900 text-white px-5 py-4 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          {/* Age & Gender */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Basic Info</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                className="w-full bg-zinc-900 text-white px-4 py-4 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors placeholder:text-zinc-600"
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-zinc-900 text-white px-4 py-4 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Units Toggle */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Units</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUnit("metric")}
                className={`py-3.5 rounded-xl font-medium transition-all ${
                  unit === "metric"
                    ? "bg-green-500 text-black"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                onClick={() => setUnit("imperial")}
                className={`py-3.5 rounded-xl font-medium transition-all ${
                  unit === "imperial"
                    ? "bg-green-500 text-black"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                Imperial (lb/ft)
              </button>
            </div>
          </div>

          {/* Height & Weight */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Measurements</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={unit === "metric" ? "170" : "5.7"}
                  step={unit === "metric" ? "1" : "0.1"}
                  className="w-full bg-zinc-900 text-white px-4 py-4 pr-12 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  {unit === "metric" ? "cm" : "ft"}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unit === "metric" ? "70" : "154"}
                  step="0.1"
                  className="w-full bg-zinc-900 text-white px-4 py-4 pr-12 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  {unit === "metric" ? "kg" : "lb"}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Activity Level</label>
            <div className="space-y-2">
              <ActivityButton
                selected={activity === "sedentary"}
                onClick={() => setActivity("sedentary")}
                title="Sedentary"
                description="Little to no exercise"
              />
              <ActivityButton
                selected={activity === "light"}
                onClick={() => setActivity("light")}
                title="Lightly Active"
                description="1-3 days/week"
              />
              <ActivityButton
                selected={activity === "moderate"}
                onClick={() => setActivity("moderate")}
                title="Moderately Active"
                description="3-5 days/week"
              />
              <ActivityButton
                selected={activity === "active"}
                onClick={() => setActivity("active")}
                title="Very Active"
                description="6-7 days/week"
              />
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="p-6 border-t border-zinc-800 bg-black">
          <button
            onClick={handleContinue}
            disabled={!age || !height || !weight}
            className="w-full bg-green-500 text-black font-bold text-lg py-4 rounded-xl active:scale-98 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
          {(!age || !height || !weight) && (
            <p className="text-zinc-600 text-xs text-center mt-3">
              Age, height, and weight required
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Step 2: Goal - Simplified with Timeline
  if (currentStep === "goal") {
    const currentWeight = Number(data.weight) || 70;
    const targetWeightNum = Number(targetWeight) || (goal === "lose" ? currentWeight - 10 : currentWeight + 10);
    const weeksNum = Number(weeks) || 12;
    
    // Simple calculation for display
    const weightDiff = Math.abs(targetWeightNum - currentWeight);
    const perWeek = weightDiff / weeksNum;

    const handleComplete = () => {
      setData({ ...data, goal, targetWeight, weeks });
      onComplete();
    };

    return (
      <motion.div
        key="goal"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="h-full w-full bg-black flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-10 pb-8">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setCurrentStep("profile")} 
              className="text-zinc-500 text-sm"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-green-500 rounded-full"></div>
              <div className="h-1 w-8 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Your Goal</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide space-y-8">
          
          {/* Goal Selection */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">What do you want to achieve?</label>
            <div className="space-y-3">
              <GoalCardSimple
                icon={TrendingDown}
                title="Lose Weight"
                selected={goal === "lose"}
                onClick={() => setGoal("lose")}
              />
              <GoalCardSimple
                icon={Minus}
                title="Maintain Weight"
                selected={goal === "maintain"}
                onClick={() => setGoal("maintain")}
              />
              <GoalCardSimple
                icon={TrendingUp}
                title="Gain Weight"
                selected={goal === "gain"}
                onClick={() => setGoal("gain")}
              />
            </div>
          </div>

          {/* Target Weight & Timeline */}
          {goal !== "maintain" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Target Weight */}
              <div>
                <label className="text-zinc-400 text-sm mb-3 block">
                  Target Weight ({data.unit === "metric" ? "kg" : "lb"})
                </label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder={`${goal === "lose" ? currentWeight - 10 : currentWeight + 10}`}
                  step="0.1"
                  className="w-full bg-zinc-900 text-white px-5 py-4 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors placeholder:text-zinc-600 text-lg font-semibold"
                />
                <p className="text-zinc-600 text-xs mt-2">
                  Current weight: {currentWeight} {data.unit === "metric" ? "kg" : "lb"}
                </p>
              </div>

              {/* Timeline in Weeks */}
              <div>
                <label className="text-zinc-400 text-sm mb-3 block">Timeline</label>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium">Weeks to reach goal</span>
                    <span className="text-green-500 text-xl font-bold">{weeks}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="52"
                    step="1"
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${((Number(weeks) - 4) / (52 - 4)) * 100}%, rgb(39 39 42) ${((Number(weeks) - 4) / (52 - 4)) * 100}%, rgb(39 39 42) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-zinc-600 mt-2">
                    <span>4 weeks</span>
                    <span>52 weeks</span>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              {targetWeight && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target size={20} className="text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Your Plan</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">Target:</span> {targetWeightNum.toFixed(1)} {data.unit === "metric" ? "kg" : "lb"}
                        </p>
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">Change:</span> {perWeek.toFixed(2)} {data.unit === "metric" ? "kg" : "lb"}/week
                        </p>
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">Duration:</span> {weeksNum} weeks
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="p-6 border-t border-zinc-800 bg-black">
          <button
            onClick={handleComplete}
            disabled={goal !== "maintain" && !targetWeight}
            className="w-full bg-green-500 text-black font-bold text-lg py-4 rounded-xl active:scale-98 transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Start Tracking
            <Sparkles size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

// Simplified Components
function ActivityButton({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all border ${
        selected
          ? "bg-green-500/10 border-green-500"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className="font-medium text-white text-sm">{title}</div>
      <div className="text-xs text-zinc-500 mt-1">{description}</div>
    </button>
  );
}

function GoalCardSimple({
  icon: Icon,
  title,
  selected,
  onClick,
}: {
  icon: any;
  title: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 border ${
        selected 
          ? "bg-green-500/10 border-green-500" 
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        selected ? "bg-green-500/20" : "bg-zinc-800"
      }`}>
        <Icon size={20} className={selected ? "text-green-500" : "text-zinc-500"} />
      </div>
      <div className="flex-1 font-medium text-white">{title}</div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-full" />
        </div>
      )}
    </button>
  );
}
