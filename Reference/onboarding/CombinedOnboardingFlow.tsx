// ─────────────────────────────────────────────────────────────────────────────
// onboarding/CombinedOnboardingFlow.tsx
//
// 4-step onboarding:
//   Step 1  — Profile        (from QuickOnboardingFlow — single page, all inputs)
//   Step 2  — Goal           (from QuickOnboardingFlow — goal + target + slider)
//   Step 3  — Calculation    (from OnboardingFlow — animated loading screen)
//             ↑ calculatePlan() runs HERE during the animation, not on a timer
//   Step 4  — Plan Reveal    (from OnboardingFlow — full macro breakdown)
//
// Replaces both QuickOnboardingFlow and OnboardingFlow.
// App.tsx change: swap QuickOnboardingFlow → CombinedOnboardingFlow (1 line).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";
import {
  calculatePlan,
  lbsToKg,
  ftToCm,
  type NutritionPlan,
  type Gender,
  type ActivityLevel,
  type Goal,
} from "../lib/nutritionCalc";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "profile" | "goal" | "calculation" | "planReveal";
type UnitSystem = "metric" | "imperial";

interface CollectedData {
  name:          string;
  age:           string;
  gender:        Gender;
  height:        string;
  weight:        string;
  unit:          UnitSystem;
  activityLevel: ActivityLevel;
  goal:          Goal;
  targetWeight:  string;
  weeks:         string;
}

interface CombinedOnboardingFlowProps {
  onComplete: (plan: NutritionPlan) => void;
}

// ── Slide animation shared across all steps ──────────────────────────────────

const slideVariants = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

const slideBack = {
  enter: { x: "-100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

// ── Loading messages for Step 3 ───────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Calculating calorie needs…",
  "Balancing macros…",
  "Optimizing for sustainability…",
];

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

export function CombinedOnboardingFlow({ onComplete }: CombinedOnboardingFlowProps) {
  const [step, setStep]         = useState<Step>("profile");
  const [goingBack, setGoingBack] = useState(false);
  const [plan, setPlan]         = useState<NutritionPlan | null>(null);

  // Flat collected data — passed between steps
  const [data, setData] = useState<CollectedData>({
    name: "", age: "", gender: "male",
    height: "", weight: "", unit: "metric", activityLevel: "moderate",
    goal: "lose", targetWeight: "", weeks: "12",
  });

  const navigate = (to: Step, back = false) => {
    setGoingBack(back);
    setStep(to);
  };

  // Called when Step 2 (Goal) is done — triggers calculation step
  const handleGoalComplete = (goalData: Partial<CollectedData>) => {
    const merged = { ...data, ...goalData };
    setData(merged);
    navigate("calculation");
  };

  // Called by PlanCalculationScreen once the animation duration is done
  // At this point we run the actual calculation and advance to reveal
  const handleCalculationComplete = () => {
    // Convert units if imperial
    let weightKg = Number(data.weight);
    let heightCm = Number(data.height);
    if (data.unit === "imperial") {
      weightKg = lbsToKg(weightKg);
      heightCm = ftToCm(heightCm);
    }

    const result = calculatePlan({
      weight:        weightKg,
      height:        heightCm,
      age:           Number(data.age),
      gender:        data.gender,
      activityLevel: data.activityLevel,
      goal:          data.goal,
      targetWeight:  data.goal !== "maintain" && data.targetWeight
                       ? (data.unit === "imperial"
                           ? lbsToKg(Number(data.targetWeight))
                           : Number(data.targetWeight))
                       : undefined,
      weeks:         data.goal !== "maintain" && data.weeks
                       ? Number(data.weeks)
                       : undefined,
    });

    setPlan(result);
    navigate("planReveal");
  };

  const variants = goingBack ? slideBack : slideVariants;

  return (
    <div className="h-full w-full bg-black overflow-hidden relative">
      <AnimatePresence initial={false} mode="wait">
        {step === "profile" && (
          <motion.div
            key="profile"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <ProfileStep
              initial={data}
              onContinue={(profileData) => {
                setData((d) => ({ ...d, ...profileData }));
                navigate("goal");
              }}
            />
          </motion.div>
        )}

        {step === "goal" && (
          <motion.div
            key="goal"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <GoalStep
              initial={data}
              unit={data.unit}
              currentWeight={Number(data.weight) || 70}
              onBack={() => navigate("profile", true)}
              onContinue={handleGoalComplete}
            />
          </motion.div>
        )}

        {step === "calculation" && (
          <motion.div
            key="calculation"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <CalculationStep onComplete={handleCalculationComplete} />
          </motion.div>
        )}

        {step === "planReveal" && plan && (
          <motion.div
            key="planReveal"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <PlanRevealStep
              plan={plan}
              unit={data.unit}
              onStart={() => onComplete(plan)}
              onAdjust={() => navigate("goal", true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Profile  (UI unchanged from QuickOnboardingFlow)
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileStepProps {
  initial:    CollectedData;
  onContinue: (data: Partial<CollectedData>) => void;
}

function ProfileStep({ initial, onContinue }: ProfileStepProps) {
  const [name,     setName]     = useState(initial.name);
  const [age,      setAge]      = useState(initial.age);
  const [gender,   setGender]   = useState<Gender>(initial.gender);
  const [height,   setHeight]   = useState(initial.height);
  const [weight,   setWeight]   = useState(initial.weight);
  const [unit,     setUnit]     = useState<UnitSystem>(initial.unit);
  const [activity, setActivity] = useState<ActivityLevel>(initial.activityLevel);

  const canContinue = !!age && !!height && !!weight;

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-10 pb-8">
        <div className="flex items-center justify-between mb-8">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-green-500 rounded-full" />
            <div className="h-1 w-8 bg-zinc-800 rounded-full" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">About You</h2>
      </div>

      {/* Form */}
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
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full bg-zinc-900 text-white px-4 py-4 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Units */}
        <div>
          <label className="text-zinc-400 text-sm mb-3 block">Units</label>
          <div className="grid grid-cols-2 gap-3">
            {(["metric", "imperial"] as UnitSystem[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`py-3.5 rounded-xl font-medium transition-all ${
                  unit === u
                    ? "bg-green-500 text-black"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                {u === "metric" ? "Metric (kg/cm)" : "Imperial (lb/ft)"}
              </button>
            ))}
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
            <ActivityButton selected={activity === "sedentary"} onClick={() => setActivity("sedentary")} title="Sedentary"         description="Little to no exercise" />
            <ActivityButton selected={activity === "light"}     onClick={() => setActivity("light")}     title="Lightly Active"    description="1–3 days/week" />
            <ActivityButton selected={activity === "moderate"}  onClick={() => setActivity("moderate")}  title="Moderately Active" description="3–5 days/week" />
            <ActivityButton selected={activity === "active"}    onClick={() => setActivity("active")}    title="Very Active"       description="6–7 days/week" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 border-t border-zinc-800 bg-black">
        <button
          onClick={() => onContinue({ name, age, gender, height, weight, unit, activityLevel: activity })}
          disabled={!canContinue}
          className="w-full bg-green-500 text-black font-bold text-lg py-4 rounded-xl transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
        {!canContinue && (
          <p className="text-zinc-600 text-xs text-center mt-3">Age, height, and weight required</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Goal  (UI unchanged from QuickOnboardingFlow)
// ─────────────────────────────────────────────────────────────────────────────

interface GoalStepProps {
  initial:       CollectedData;
  unit:          UnitSystem;
  currentWeight: number;
  onBack:        () => void;
  onContinue:    (data: Partial<CollectedData>) => void;
}

function GoalStep({ initial, unit, currentWeight, onBack, onContinue }: GoalStepProps) {
  const [goal,         setGoal]         = useState<Goal>(initial.goal);
  const [targetWeight, setTargetWeight] = useState(initial.targetWeight);
  const [weeks,        setWeeks]        = useState(initial.weeks || "12");

  const weightUnit     = unit === "metric" ? "kg" : "lb";
  const targetWeightNum = Number(targetWeight) || (goal === "lose" ? currentWeight - 10 : currentWeight + 10);
  const weeksNum        = Number(weeks) || 12;
  const weightDiff      = Math.abs(targetWeightNum - currentWeight);
  const perWeek         = weightDiff / weeksNum;

  const canContinue = goal === "maintain" || !!targetWeight;

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-10 pb-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-zinc-500 text-sm">Back</button>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-green-500 rounded-full" />
            <div className="h-1 w-8 bg-green-500 rounded-full" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Your Goal</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide space-y-8">
        {/* Goal selection */}
        <div>
          <label className="text-zinc-400 text-sm mb-3 block">What do you want to achieve?</label>
          <div className="space-y-3">
            <GoalCard icon={TrendingDown} title="Lose Weight"     selected={goal === "lose"}     onClick={() => setGoal("lose")} />
            <GoalCard icon={Minus}        title="Maintain Weight" selected={goal === "maintain"} onClick={() => setGoal("maintain")} />
            <GoalCard icon={TrendingUp}   title="Gain Weight"     selected={goal === "gain"}     onClick={() => setGoal("gain")} />
          </div>
        </div>

        {/* Target weight + timeline (hidden for maintain) */}
        {goal !== "maintain" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Target weight input */}
            <div>
              <label className="text-zinc-400 text-sm mb-3 block">Target Weight ({weightUnit})</label>
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder={`${goal === "lose" ? currentWeight - 10 : currentWeight + 10}`}
                step="0.1"
                className="w-full bg-zinc-900 text-white px-5 py-4 rounded-xl border border-zinc-800 focus:border-green-500 focus:outline-none transition-colors placeholder:text-zinc-600 text-lg font-semibold"
              />
              <p className="text-zinc-600 text-xs mt-2">
                Current weight: {currentWeight} {weightUnit}
              </p>
            </div>

            {/* Timeline slider */}
            <div>
              <label className="text-zinc-400 text-sm mb-3 block">Timeline</label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-medium">Weeks to reach goal</span>
                  <span className="text-green-500 text-xl font-bold">{weeks}</span>
                </div>
                <input
                  type="range"
                  min="4" max="52" step="1"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${((Number(weeks) - 4) / 48) * 100}%, rgb(39 39 42) ${((Number(weeks) - 4) / 48) * 100}%, rgb(39 39 42) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-2">
                  <span>4 weeks</span>
                  <span>52 weeks</span>
                </div>
              </div>
            </div>

            {/* Summary preview */}
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
                    <h4 className="text-white font-semibold mb-2">Your Plan Preview</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-zinc-300">
                        <span className="text-zinc-500">Target:</span> {targetWeightNum.toFixed(1)} {weightUnit}
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-500">Change:</span> {perWeek.toFixed(2)} {weightUnit}/week
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

      {/* CTA */}
      <div className="p-6 border-t border-zinc-800 bg-black">
        <button
          onClick={() => onContinue({ goal, targetWeight, weeks })}
          disabled={!canContinue}
          className="w-full bg-green-500 text-black font-bold text-lg py-4 rounded-xl transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Calculate My Plan
          <Sparkles size={20} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Calculation  (UI from OnboardingFlow — but NOW runs real calc)
//
// The animation runs for MIN_DURATION ms. calculatePlan() is called at mount
// via the onComplete callback from the parent. Both paths (anim done + calc
// done) must complete before advancing — whichever finishes last wins.
// ─────────────────────────────────────────────────────────────────────────────

const MIN_ANIM_DURATION = 1800; // ms — feels fast but not rushed

interface CalculationStepProps {
  onComplete: () => void;
}

function CalculationStep({ onComplete }: CalculationStepProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 600);

    // Advance after minimum animation duration
    const doneTimer = setTimeout(() => {
      onComplete();
    }, MIN_ANIM_DURATION);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="h-full w-full bg-black text-white flex flex-col items-center justify-center px-8">
      {/* Dot animation */}
      <div className="mb-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-white rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <h1 className="text-3xl font-bold mb-3 text-center">Creating your plan…</h1>
      <p className="text-zinc-500 text-center mb-8">Calculating your calorie target and macro balance</p>

      {/* Rotating message */}
      <div className="h-6 relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-zinc-600 absolute inset-0 text-center"
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Plan Reveal  (UI from OnboardingFlow + warning banners added)
// ─────────────────────────────────────────────────────────────────────────────

interface PlanRevealStepProps {
  plan:     NutritionPlan;
  unit:     UnitSystem;
  onStart:  () => void;
  onAdjust: () => void;
}

function PlanRevealStep({ plan, unit, onStart, onAdjust }: PlanRevealStepProps) {
  const weightUnit = unit === "metric" ? "kg" : "lb";

  // Macro % for bars (using kcal contribution)
  const totalCals     = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
  const proteinPct    = Math.round((plan.protein * 4 / totalCals) * 100);
  const carbsPct      = Math.round((plan.carbs   * 4 / totalCals) * 100);
  const fatPct        = Math.round((plan.fat     * 9 / totalCals) * 100);

  const weeklyDisplay = Math.abs(plan.weeklyWeightChange).toFixed(2);
  const direction     = plan.goal === "lose" ? "loss" : "gain";

  return (
    <div className="h-full w-full bg-black text-white flex flex-col px-6">
      <div className="flex-1 overflow-y-auto pt-12 pb-4">
        <h1 className="text-3xl font-bold mb-2">Your personalized plan</h1>

        {/* Context subtitle */}
        {plan.targetWeight && plan.estimatedWeeks > 0 && (
          <p className="text-sm text-zinc-500 mb-6">
            Reach {plan.targetWeight} {weightUnit} in ~{plan.estimatedWeeks} weeks
            &nbsp;({weeklyDisplay} {weightUnit}/week {direction})
          </p>
        )}
        {plan.goal === "maintain" && (
          <p className="text-sm text-zinc-500 mb-6">Maintain your current weight</p>
        )}

        {/* Warning banners — only shown when safety caps were hit */}
        {plan.warningCapped && plan.warningExtendedTimeline && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <p className="text-sm text-amber-400 font-medium">⚠️ Timeline adjusted for safety</p>
            <p className="text-xs text-amber-400/70 mt-1">
              Your original timeline required a deficit above 1,000 kcal/day.
              We've extended it to {plan.estimatedWeeks} weeks — safer and more sustainable.
            </p>
          </div>
        )}
        {plan.warningAggressiveGain && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <p className="text-sm text-amber-400 font-medium">⚠️ Surplus capped at 500 kcal/day</p>
            <p className="text-xs text-amber-400/70 mt-1">
              Exceeding this leads to excess fat gain rather than muscle. Timeline extended to {plan.estimatedWeeks} weeks.
            </p>
          </div>
        )}

        {/* Daily Calories — hero number */}
        <div className="mb-10 text-center py-8">
          <div className="text-sm text-zinc-500 uppercase tracking-wider mb-3 font-medium">
            Daily Calories
          </div>
          <div className="text-6xl font-bold tracking-tight">
            {plan.goalCalories.toLocaleString()}
          </div>
          <div className="text-zinc-600 text-lg mt-1">kcal</div>
        </div>

        {/* Macro targets */}
        <div className="space-y-6 mb-8">
          {[
            { label: "Protein", value: plan.protein, pct: proteinPct, color: "bg-cyan-500"   },
            { label: "Carbs",   value: plan.carbs,   pct: carbsPct,   color: "bg-yellow-500" },
            { label: "Fat",     value: plan.fat,     pct: fatPct,     color: "bg-blue-500"   },
          ].map(({ label, value, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-zinc-400">{label}</span>
                <span className="text-sm font-bold text-white">{value}g</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Macro distribution bar */}
        <div className="mb-8">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-cyan-500"   style={{ width: `${proteinPct}%` }} />
            <div className="bg-yellow-500" style={{ width: `${carbsPct}%`   }} />
            <div className="bg-blue-500"   style={{ width: `${fatPct}%`     }} />
          </div>
          <div className="flex justify-between mt-3 text-xs">
            <span className="text-zinc-500"><span className="inline-block w-2 h-2 bg-cyan-500   rounded-full mr-1" />Protein {proteinPct}%</span>
            <span className="text-zinc-500"><span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1" />Carbs {carbsPct}%</span>
            <span className="text-zinc-500"><span className="inline-block w-2 h-2 bg-blue-500   rounded-full mr-1" />Fat {fatPct}%</span>
          </div>
        </div>

        {/* TDEE reference — useful context */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-500 space-y-1">
          <p><span className="text-zinc-400">BMR</span> — {plan.bmr.toLocaleString()} kcal (base metabolic rate)</p>
          <p><span className="text-zinc-400">TDEE</span> — {plan.tdee.toLocaleString()} kcal (with activity)</p>
          {plan.goal !== "maintain" && (
            <p>
              <span className="text-zinc-400">Daily {plan.dailyDelta < 0 ? "deficit" : "surplus"}</span>
              &nbsp;— {Math.abs(plan.dailyDelta).toLocaleString()} kcal
            </p>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ActivityButton({
  selected, onClick, title, description,
}: { selected: boolean; onClick: () => void; title: string; description: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all border ${
        selected ? "bg-green-500/10 border-green-500" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className="font-medium text-white text-sm">{title}</div>
      <div className="text-xs text-zinc-500 mt-1">{description}</div>
    </button>
  );
}

function GoalCard({
  icon: Icon, title, selected, onClick,
}: { icon: any; title: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 border ${
        selected ? "bg-green-500/10 border-green-500" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-green-500/20" : "bg-zinc-800"}`}>
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
