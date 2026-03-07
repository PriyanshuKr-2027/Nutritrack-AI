import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  ZoomIn,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  name: string;
  age: string;
  gender: Gender;
  height: string;
  weight: string;
  unit: UnitSystem;
  activityLevel: ActivityLevel;
  goal: Goal;
  targetWeight: string;
  weeks: string;
}

/** Metric stats passed to onComplete alongside NutritionPlan.
 *  Used by App.tsx to persist raw body stats to the profiles table. */
export interface OnboardingRawStats {
  name:          string;        // from ProfileStep
  weight_kg:     number;        // already converted to metric
  height_cm:     number;        // already converted to metric
  age:           number;
  gender:        Gender;
  activity_level: ActivityLevel;
}

interface CombinedOnboardingFlowProps {
  onComplete: (plan: NutritionPlan, rawStats: OnboardingRawStats) => void;
}

// ── Loading messages for Step 3 ───────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Calculating calorie needs…",
  "Balancing macros…",
  "Optimizing for sustainability…",
];

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

export function CombinedOnboardingFlow({
  onComplete,
}: CombinedOnboardingFlowProps) {
  const [step, setStep] = useState<Step>("profile");
  const [goingBack, setGoingBack] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [rawStats, setRawStats] = useState<OnboardingRawStats | null>(null);

  // Flat collected data — passed between steps
  const [data, setData] = useState<CollectedData>({
    name: "",
    age: "",
    gender: "male",
    height: "",
    weight: "",
    unit: "metric",
    activityLevel: "moderate",
    goal: "lose",
    targetWeight: "",
    weeks: "12",
  });

  const navigate = (to: Step, back = false) => {
    setGoingBack(back);
    setStep(to);
  };

  const handleGoalComplete = (goalData: Partial<CollectedData>) => {
    const merged = { ...data, ...goalData };
    setData(merged);
    navigate("calculation");
  };

  const handleCalculationComplete = () => {
    let weightKg = Number(data.weight);
    let heightCm = Number(data.height);
    if (data.unit === "imperial") {
      weightKg = lbsToKg(weightKg);
      heightCm = ftToCm(heightCm);
    }

    const result = calculatePlan({
      weight: weightKg,
      height: heightCm,
      age: Number(data.age),
      gender: data.gender,
      activityLevel: data.activityLevel,
      goal: data.goal,
      targetWeight:
        data.goal !== "maintain" && data.targetWeight
          ? data.unit === "imperial"
            ? lbsToKg(Number(data.targetWeight))
            : Number(data.targetWeight)
          : undefined,
      weeks:
        data.goal !== "maintain" && data.weeks ? Number(data.weeks) : undefined,
    });

    // Capture raw stats to pass through to App.tsx for DB persistence
    const rawStats: OnboardingRawStats = {
      name:           data.name.trim(),
      weight_kg:      weightKg,
      height_cm:      heightCm,
      age:            Number(data.age),
      gender:         data.gender,
      activity_level: data.activityLevel,
    };

    setPlan(result);
    // Store rawStats so PlanRevealStep can pass it through onStart
    setRawStats(rawStats);
    navigate("planReveal");
  };

  const enteringAnim = goingBack
    ? SlideInLeft.duration(300).springify()
    : SlideInRight.duration(300).springify();
  const exitingAnim = goingBack
    ? SlideOutRight.duration(300)
    : SlideOutLeft.duration(300);

  return (
    <View className="flex-1 bg-black w-full relative">
      {step === "profile" && (
        <Animated.View
          key="profile"
          entering={enteringAnim}
          exiting={exitingAnim}
          className="absolute inset-0"
        >
          <ProfileStep
            initial={data}
            onContinue={(profileData) => {
              setData((d) => ({ ...d, ...profileData }));
              navigate("goal");
            }}
          />
        </Animated.View>
      )}

      {step === "goal" && (
        <Animated.View
          key="goal"
          entering={enteringAnim}
          exiting={exitingAnim}
          className="absolute inset-0"
        >
          <GoalStep
            initial={data}
            unit={data.unit}
            currentWeight={Number(data.weight) || 70}
            onBack={() => navigate("profile", true)}
            onContinue={handleGoalComplete}
          />
        </Animated.View>
      )}

      {step === "calculation" && (
        <Animated.View
          key="calculation"
          entering={enteringAnim}
          exiting={exitingAnim}
          className="absolute inset-0"
        >
          <CalculationStep onComplete={handleCalculationComplete} />
        </Animated.View>
      )}

      {step === "planReveal" && plan && rawStats && (
        <Animated.View
          key="planReveal"
          entering={enteringAnim}
          exiting={exitingAnim}
          className="absolute inset-0"
        >
          <PlanRevealStep
            plan={plan}
            unit={data.unit}
            onStart={() => onComplete(plan, rawStats)}
            onAdjust={() => navigate("goal", true)}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Profile
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileStepProps {
  initial: CollectedData;
  onContinue: (data: Partial<CollectedData>) => void;
}

function ProfileStep({ initial, onContinue }: ProfileStepProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial.name);
  const [age, setAge] = useState(initial.age);
  const [gender, setGender] = useState<Gender>(initial.gender);
  const [height, setHeight] = useState(initial.height);
  const [weight, setWeight] = useState(initial.weight);
  const [unit, setUnit] = useState<UnitSystem>(initial.unit);
  const [activity, setActivity] = useState<ActivityLevel>(
    initial.activityLevel
  );

  const canContinue = !!age && !!height && !!weight;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full"
    >
      {/* Header */}
      <View
        className="px-6 pb-4"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center justify-between mb-8">
          {/* Step dots */}
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-8 bg-green-500 rounded-full" />
            <View className="h-1.5 w-8 bg-zinc-800 rounded-full" />
          </View>
        </View>
        <Text className="text-3xl font-bold text-white">About You</Text>
      </View>

      {/* Form */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-8 flex-col gap-6">
          {/* Name */}
          <View>
            <Text className="text-zinc-400 text-sm mb-3">Name (Optional)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#52525b"
              className="w-full bg-zinc-900 text-white px-5 py-4 rounded-xl border border-zinc-800 focus:border-green-500"
            />
          </View>

          {/* Age & Gender */}
          <View>
            <Text className="text-zinc-400 text-sm mb-3">Basic Info</Text>
            <View className="flex-row gap-3">
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="Age"
                placeholderTextColor="#52525b"
                keyboardType="numeric"
                className="flex-1 bg-zinc-900 text-white px-4 py-4 rounded-xl border border-zinc-800 focus:border-green-500"
              />
              <View className="flex-1 flex-row bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <Pressable
                  onPress={() => setGender("male")}
                  className={`flex-1 items-center justify-center py-4 ${
                    gender === "male" ? "bg-green-500" : ""
                  }`}
                >
                  <Text
                    className={
                      gender === "male"
                        ? "text-black font-semibold"
                        : "text-zinc-400"
                    }
                  >
                    M
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setGender("female")}
                  className={`flex-1 items-center justify-center py-4 ${
                    gender === "female" ? "bg-green-500" : ""
                  }`}
                >
                  <Text
                    className={
                      gender === "female"
                        ? "text-black font-semibold"
                        : "text-zinc-400"
                    }
                  >
                    F
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Units */}
          <View>
            <Text className="text-zinc-400 text-sm mb-3">Units</Text>
            <View className="flex-row gap-3">
              {(["metric", "imperial"] as UnitSystem[]).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  className={`flex-1 py-4 rounded-xl items-center border ${
                    unit === u
                      ? "bg-green-500 border-green-500"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      unit === u ? "text-black" : "text-zinc-400"
                    }`}
                  >
                    {u === "metric" ? "Metric (kg/cm)" : "Imperial (lb/ft)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Measurements */}
          <View>
            <Text className="text-zinc-400 text-sm mb-3">Measurements</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 relative justify-center">
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder={unit === "metric" ? "170" : "5.7"}
                  placeholderTextColor="#52525b"
                  keyboardType="numeric"
                  className="w-full bg-zinc-900 text-white px-4 py-4 pr-12 rounded-xl border border-zinc-800 focus:border-green-500"
                />
                <Text className="absolute right-4 text-zinc-500 text-sm">
                  {unit === "metric" ? "cm" : "ft"}
                </Text>
              </View>
              <View className="flex-1 relative justify-center">
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={unit === "metric" ? "70" : "154"}
                  placeholderTextColor="#52525b"
                  keyboardType="numeric"
                  className="w-full bg-zinc-900 text-white px-4 py-4 pr-12 rounded-xl border border-zinc-800 focus:border-green-500"
                />
                <Text className="absolute right-4 text-zinc-500 text-sm">
                  {unit === "metric" ? "kg" : "lb"}
                </Text>
              </View>
            </View>
          </View>

          {/* Activity Level */}
          <View>
            <Text className="text-zinc-400 text-sm mb-3">Activity Level</Text>
            <View className="flex-col gap-2">
              <ActivityButton
                selected={activity === "sedentary"}
                onPress={() => setActivity("sedentary")}
                title="Sedentary"
                description="Little to no exercise"
              />
              <ActivityButton
                selected={activity === "light"}
                onPress={() => setActivity("light")}
                title="Lightly Active"
                description="1–3 days/week"
              />
              <ActivityButton
                selected={activity === "moderate"}
                onPress={() => setActivity("moderate")}
                title="Moderately Active"
                description="3–5 days/week"
              />
              <ActivityButton
                selected={activity === "active"}
                onPress={() => setActivity("active")}
                title="Very Active"
                description="6–7 days/week"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="px-6 py-4 border-t border-zinc-800 bg-black"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={() =>
            onContinue({
              name,
              age,
              gender,
              height,
              weight,
              unit,
              activityLevel: activity,
            })
          }
          disabled={!canContinue}
          style={({ pressed }) => [
            { opacity: !canContinue ? 0.4 : pressed ? 0.8 : 1 },
          ]}
          className="w-full bg-green-500 py-4 rounded-xl items-center"
        >
          <Text className="text-black font-bold text-lg">Continue</Text>
        </Pressable>
        {!canContinue && (
          <Text className="text-zinc-600 text-xs text-center mt-3">
            Age, height, and weight required
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Goal
// ─────────────────────────────────────────────────────────────────────────────

interface GoalStepProps {
  initial: CollectedData;
  unit: UnitSystem;
  currentWeight: number;
  onBack: () => void;
  onContinue: (data: Partial<CollectedData>) => void;
}

function GoalStep({
  initial,
  unit,
  currentWeight,
  onBack,
  onContinue,
}: GoalStepProps) {
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState<Goal>(initial.goal);
  const [targetWeight, setTargetWeight] = useState(initial.targetWeight);
  const [weeks, setWeeks] = useState(initial.weeks || "12");

  const weightUnit = unit === "metric" ? "kg" : "lb";
  const targetWeightNum =
    Number(targetWeight) ||
    (goal === "lose" ? currentWeight - 10 : currentWeight + 10);
  const weeksNum = Number(weeks) || 12;
  const weightDiff = Math.abs(targetWeightNum - currentWeight);
  const perWeek = weightDiff / (weeksNum || 1);

  const canContinue = goal === "maintain" || !!targetWeight;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full"
    >
      {/* Header */}
      <View
        className="px-6 pb-4"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={onBack}>
            <Text className="text-zinc-500 text-sm">Back</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-8 bg-green-500 rounded-full" />
            <View className="h-1.5 w-8 bg-green-500 rounded-full" />
          </View>
        </View>
        <Text className="text-3xl font-bold text-white">Your Goal</Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-8 flex-col gap-6">
          {/* Goal selection */}
          <View>
            <Text className="text-zinc-400 text-sm mb-3">
              What do you want to achieve?
            </Text>
            <View className="flex-col gap-3">
              <GoalCard
                icon="trending-down"
                title="Lose Weight"
                selected={goal === "lose"}
                onPress={() => setGoal("lose")}
              />
              <GoalCard
                icon="minus"
                title="Maintain Weight"
                selected={goal === "maintain"}
                onPress={() => setGoal("maintain")}
              />
              <GoalCard
                icon="trending-up"
                title="Gain Weight"
                selected={goal === "gain"}
                onPress={() => setGoal("gain")}
              />
            </View>
          </View>

          {/* Target weight + timeline */}
          {goal !== "maintain" && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="flex-col gap-6 w-full overflow-hidden"
            >
              {/* Target weight input */}
              <View>
                <Text className="text-zinc-400 text-sm mb-3">
                  Target Weight ({weightUnit})
                </Text>
                <TextInput
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  placeholder={`${
                    goal === "lose" ? currentWeight - 10 : currentWeight + 10
                  }`}
                  placeholderTextColor="#71717a"
                  keyboardType="numeric"
                  className="w-full bg-zinc-900 text-white px-5 py-4 rounded-xl border border-zinc-800 focus:border-green-500 text-lg font-semibold"
                />
                <Text className="text-zinc-600 text-xs mt-2">
                  Current weight: {currentWeight} {weightUnit}
                </Text>
              </View>

              {/* Timeline slider */}
              <View>
                <Text className="text-zinc-400 text-sm mb-3">Timeline</Text>
                <View className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white font-medium">
                      Weeks to reach goal
                    </Text>
                    <Text className="text-green-500 text-xl font-bold">
                      {weeksNum}
                    </Text>
                  </View>
                  <Slider
                    style={{ width: "100%", height: 30 }}
                    minimumValue={4}
                    maximumValue={52}
                    step={1}
                    value={weeksNum}
                    onValueChange={(val) => setWeeks(val.toString())}
                    minimumTrackTintColor="#22c55e"
                    maximumTrackTintColor="#27272a"
                    thumbTintColor="#ffffff"
                  />
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-zinc-600">4 weeks</Text>
                    <Text className="text-xs text-zinc-600">52 weeks</Text>
                  </View>
                </View>
              </View>

              {/* Summary preview */}
              {targetWeight.length > 0 && (
                <Animated.View
                  entering={ZoomIn.duration(300)}
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-5"
                >
                  <View className="flex-row items-start gap-4">
                    <View className="w-10 h-10 bg-green-500/20 rounded-lg items-center justify-center">
                      <Feather name="target" size={20} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold mb-2">
                        Your Plan Preview
                      </Text>
                      <View className="flex-col gap-1">
                        <Text className="text-zinc-300 text-sm">
                          <Text className="text-zinc-500">Target:</Text>{" "}
                          {targetWeightNum.toFixed(1)} {weightUnit}
                        </Text>
                        <Text className="text-zinc-300 text-sm">
                          <Text className="text-zinc-500">Change:</Text>{" "}
                          {perWeek.toFixed(2)} {weightUnit}/week
                        </Text>
                        <Text className="text-zinc-300 text-sm">
                          <Text className="text-zinc-500">Duration:</Text>{" "}
                          {weeksNum} weeks
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="px-6 py-4 border-t border-zinc-800 bg-black"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={() => onContinue({ goal, targetWeight, weeks })}
          disabled={!canContinue}
          style={({ pressed }) => [
            { opacity: !canContinue ? 0.4 : pressed ? 0.8 : 1 },
          ]}
          className="w-full bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Text className="text-black font-bold text-lg">Calculate My Plan</Text>
          <Feather name="anchor" size={20} color="black" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Calculation
// ─────────────────────────────────────────────────────────────────────────────

const MIN_ANIM_DURATION = 1800; // ms

interface CalculationStepProps {
  onComplete: () => void;
}

function CalculationStep({ onComplete }: CalculationStepProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 600);

    const doneTimer = setTimeout(() => {
      onComplete();
    }, MIN_ANIM_DURATION);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <View className="flex-1 bg-black w-full items-center justify-center px-8">
      {/* Dot animation (pseudo implementation using a single spinning icon for simplicity, 
      or we can use Reanimated loops if desired. Let's stick with simple RN views.)
      */}
      <View className="mb-8 flex-row gap-2">
        {[0, 1, 2].map((i) => {
          return (
            <Animated.View
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              // In real implementation could use withRepeat + withSequence
            />
          );
        })}
      </View>

      <Text className="text-3xl font-bold mb-3 text-center text-white">
        Creating your plan…
      </Text>
      <Text className="text-zinc-500 text-center mb-8">
        Calculating your calorie target and macro balance
      </Text>

      {/* Rotating message */}
      <View className="h-6 justify-center items-center overflow-hidden">
        <Animated.Text
          key={msgIdx}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          className="text-sm text-zinc-600 text-center absolute"
        >
          {LOADING_MESSAGES[msgIdx]}
        </Animated.Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Plan Reveal
// ─────────────────────────────────────────────────────────────────────────────

interface PlanRevealStepProps {
  plan: NutritionPlan;
  unit: UnitSystem;
  onStart: () => void;
  onAdjust: () => void;
}

function PlanRevealStep({
  plan,
  unit,
  onStart,
  onAdjust,
}: PlanRevealStepProps) {
  const insets = useSafeAreaInsets();
  const weightUnit = unit === "metric" ? "kg" : "lb";

  const totalCals = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
  const proteinPct = Math.round(((plan.protein * 4) / totalCals) * 100);
  const carbsPct = Math.round(((plan.carbs * 4) / totalCals) * 100);
  const fatPct = Math.round(((plan.fat * 9) / totalCals) * 100);

  const weeklyDisplay = Math.abs(plan.weeklyWeightChange).toFixed(2);
  const direction = plan.goal === "lose" ? "loss" : "gain";

  return (
    <View className="flex-1 bg-black w-full">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 32),
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold mb-2 text-white">
          Your personalized plan
        </Text>

        {plan.targetWeight && plan.estimatedWeeks > 0 && (
          <Text className="text-sm text-zinc-500 mb-6">
            Reach {plan.targetWeight} {weightUnit} in ~{plan.estimatedWeeks}{" "}
            weeks ({weeklyDisplay} {weightUnit}/week {direction})
          </Text>
        )}
        {plan.goal === "maintain" && (
          <Text className="text-sm text-zinc-500 mb-6">
            Maintain your current weight
          </Text>
        )}

        {/* Warning banners */}
        {plan.warningCapped && plan.warningExtendedTimeline && (
          <View className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <Text className="text-sm text-amber-400 font-medium">
              ⚠️ Timeline adjusted for safety
            </Text>
            <Text className="text-xs text-amber-400/70 mt-1">
              Your original timeline required a deficit above 1,000 kcal/day.
              We've extended it to {plan.estimatedWeeks} weeks — safer and more
              sustainable.
            </Text>
          </View>
        )}
        {plan.warningAggressiveGain && (
          <View className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <Text className="text-sm text-amber-400 font-medium">
              ⚠️ Surplus capped at 500 kcal/day
            </Text>
            <Text className="text-xs text-amber-400/70 mt-1">
              Exceeding this leads to excess fat gain rather than muscle.
              Timeline extended to {plan.estimatedWeeks} weeks.
            </Text>
          </View>
        )}

        {/* Daily Calories */}
        <View className="mb-10 items-center py-8">
          <Text className="text-sm text-zinc-500 uppercase tracking-widest mb-3 font-medium">
            Daily Calories
          </Text>
          <Text className="text-6xl font-bold tracking-tight text-white">
            {plan.goalCalories.toLocaleString()}
          </Text>
          <Text className="text-zinc-600 text-lg mt-1">kcal</Text>
        </View>

        {/* Macro targets */}
        <View className="flex-col gap-6 mb-8">
          {[
            {
              label: "Protein",
              value: plan.protein,
              pct: proteinPct,
              color: "bg-cyan-500",
            },
            {
              label: "Carbs",
              value: plan.carbs,
              pct: carbsPct,
              color: "bg-yellow-500",
            },
            { label: "Fat", value: plan.fat, pct: fatPct, color: "bg-blue-500" },
          ].map(({ label, value, pct, color }) => (
            <View key={label}>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm font-medium text-zinc-400">
                  {label}
                </Text>
                <Text className="text-sm font-bold text-white">{value}g</Text>
              </View>
              <View className="w-full h-2 bg-zinc-900 rounded-full flex-row overflow-hidden">
                <View
                  className={`h-full ${color} rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Macro distribution bar */}
        <View className="mb-8 flex-col gap-3">
          <View className="flex-row h-3 rounded-full overflow-hidden">
            <View className="bg-cyan-500 h-full" style={{ width: `${proteinPct}%` }} />
            <View className="bg-yellow-500 h-full" style={{ width: `${carbsPct}%` }} />
            <View className="bg-blue-500 h-full" style={{ width: `${fatPct}%` }} />
          </View>
          <View className="flex-row justify-between mt-1">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 bg-cyan-500 rounded-full" />
              <Text className="text-zinc-500 text-xs">Protein {proteinPct}%</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 bg-yellow-500 rounded-full" />
              <Text className="text-zinc-500 text-xs">Carbs {carbsPct}%</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 bg-blue-500 rounded-full" />
              <Text className="text-zinc-500 text-xs">Fat {fatPct}%</Text>
            </View>
          </View>
        </View>

        {/* TDEE reference */}
        <View className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex-col gap-1 mb-8">
          <Text className="text-xs text-zinc-500">
            <Text className="text-zinc-400">BMR</Text> —{" "}
            {plan.bmr.toLocaleString()} kcal (base metabolic rate)
          </Text>
          <Text className="text-xs text-zinc-500">
            <Text className="text-zinc-400">TDEE</Text> —{" "}
            {plan.tdee.toLocaleString()} kcal (with activity)
          </Text>
          {plan.goal !== "maintain" && (
            <Text className="text-xs text-zinc-500">
              <Text className="text-zinc-400">
                Daily {plan.dailyDelta < 0 ? "deficit" : "surplus"}
              </Text>{" "}
              — {Math.abs(plan.dailyDelta).toLocaleString()} kcal
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View
        className="px-6 py-4 space-y-3 flex-col gap-3 border-t border-zinc-900 bg-black"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="w-full py-4 bg-white rounded-2xl items-center"
        >
          <Text className="text-black font-semibold text-base">
            Start Tracking
          </Text>
        </Pressable>
        <Pressable
          onPress={onAdjust}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          className="w-full py-4 bg-transparent border border-zinc-800 rounded-2xl items-center"
        >
          <Text className="text-zinc-400 font-medium text-base">
            Adjust Plan
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ActivityButton({
  selected,
  onPress,
  title,
  description,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  description: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-full p-4 rounded-xl border ${
        selected ? "bg-green-500/10 border-green-500" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <Text className="font-medium text-white text-sm">{title}</Text>
      <Text className="text-xs text-zinc-500 mt-1">{description}</Text>
    </Pressable>
  );
}

function GoalCard({
  icon,
  title,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-full p-4 rounded-xl flex-row items-center gap-4 border ${
        selected ? "bg-green-500/10 border-green-500" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <View
        className={`w-10 h-10 rounded-lg items-center justify-center ${
          selected ? "bg-green-500/20" : "bg-zinc-800"
        }`}
      >
        <Feather
          name={icon}
          size={20}
          color={selected ? "#22c55e" : "#71717a"}
        />
      </View>
      <Text className="flex-1 font-medium text-white">{title}</Text>
      {selected && (
        <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center">
          <View className="w-2 h-2 bg-black rounded-full" />
        </View>
      )}
    </Pressable>
  );
}
