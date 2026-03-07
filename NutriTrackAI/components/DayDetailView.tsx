import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// Types
export interface DayStats {
  date: string;
  totalCalories: number;
  goalCalories: number;
  macros: {
    protein: { current: number; goal: number };
    carbs: { current: number; goal: number };
    fat: { current: number; goal: number };
  };
  nutrients: {
    fiber: number;
    sugar: number;
    sodium: number;
  };
  meals: {
    type: string;
    calories: number;
  }[];
}

// Mock Data
const MOCK_DAYS: DayStats[] = [
  {
    date: "Today",
    totalCalories: 1850,
    goalCalories: 2200,
    macros: {
      protein: { current: 95, goal: 130 },
      carbs: { current: 210, goal: 250 },
      fat: { current: 60, goal: 70 },
    },
    nutrients: { fiber: 18, sugar: 42, sodium: 1900 },
    meals: [
      { type: "Breakfast", calories: 320 },
      { type: "Lunch", calories: 540 },
      { type: "Snack", calories: 270 },
      { type: "Dinner", calories: 720 },
    ],
  },
  {
    date: "Yesterday",
    totalCalories: 2100,
    goalCalories: 2200,
    macros: {
      protein: { current: 120, goal: 130 },
      carbs: { current: 240, goal: 250 },
      fat: { current: 65, goal: 70 },
    },
    nutrients: { fiber: 22, sugar: 38, sodium: 2100 },
    meals: [
      { type: "Breakfast", calories: 450 },
      { type: "Lunch", calories: 650 },
      { type: "Snack", calories: 320 },
      { type: "Dinner", calories: 680 },
    ],
  },
  {
    date: "Mon, 12 Feb",
    totalCalories: 1650,
    goalCalories: 2200,
    macros: {
      protein: { current: 80, goal: 130 },
      carbs: { current: 180, goal: 250 },
      fat: { current: 50, goal: 70 },
    },
    nutrients: { fiber: 15, sugar: 30, sodium: 1800 },
    meals: [
      { type: "Breakfast", calories: 300 },
      { type: "Lunch", calories: 500 },
      { type: "Dinner", calories: 850 },
    ],
  },
];

interface DayDetailViewProps {
  initialDayIndex?: number;
  onBack: () => void;
  onMealTypeSelect: (mealType: string) => void;
}

export function DayDetailView({
  initialDayIndex = 0,
  onBack,
  onMealTypeSelect,
}: DayDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialDayIndex);
  const [isNutrientsExpanded, setIsNutrientsExpanded] = useState(false);

  const currentDay = MOCK_DAYS[currentIndex];

  // Swipe Handlers
  const handlePrevDay = () => {
    if (currentIndex < MOCK_DAYS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleNextDay = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const panGesture = Gesture.Pan()
    .onEnd((e: any) => {
      // Swipe Right -> View Next Day
      if (e.translationX > 50) {
        handleNextDay();
      }
      // Swipe Left -> View Prev Day
      if (e.translationX < -50) {
        handlePrevDay();
      }
    });

  // Helper for progress bar width
  const getProgress = (current: number, goal: number) =>
    Math.min((current / goal) * 100, 100);

  // Chevron Animation
  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(isNutrientsExpanded ? "180deg" : "0deg"),
        },
      ],
    };
  });

  return (
    <View className="flex-1 bg-black w-full relative">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4 z-20 bg-black/90 border-b border-zinc-900"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-10 h-10 -ml-2 rounded-full items-center justify-center bg-zinc-900"
        >
          <Feather name="arrow-left" size={20} color="white" />
        </Pressable>

        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={handlePrevDay}
            disabled={currentIndex >= MOCK_DAYS.length - 1}
            className="p-2"
          >
            <Feather
              name="chevron-left"
              size={24}
              color={
                currentIndex >= MOCK_DAYS.length - 1 ? "#3f3f46" : "#a1a1aa"
              }
            />
          </Pressable>
          <Text className="text-lg font-bold w-32 text-center text-white">
            {currentDay.date}
          </Text>
          <Pressable
            onPress={handleNextDay}
            disabled={currentIndex <= 0}
            className="p-2"
          >
            <Feather
              name="chevron-right"
              size={24}
              color={currentIndex <= 0 ? "#3f3f46" : "#a1a1aa"}
            />
          </Pressable>
        </View>

        <View className="w-10" />
      </View>

      {/* Main Content Area with Swipe */}
      <GestureDetector gesture={panGesture}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Calories Section */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Total Calories
            </Text>
            <View className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800">
              <View className="items-center">
                <Text className="text-5xl font-bold text-white tracking-tight mb-2">
                  {currentDay.totalCalories.toLocaleString()}{" "}
                  <Text className="text-xl text-zinc-500 font-medium">kcal</Text>
                </Text>
                <Text className="text-zinc-400 font-medium mb-6">
                  {currentDay.totalCalories.toLocaleString()} /{" "}
                  {currentDay.goalCalories.toLocaleString()} kcal
                </Text>

                {/* Progress Bar */}
                <View className="w-full h-4 bg-zinc-800 rounded-full flex-row overflow-hidden">
                  <View
                    className="h-full bg-white rounded-full"
                    style={{
                      width: `${getProgress(
                        currentDay.totalCalories,
                        currentDay.goalCalories
                      )}%`,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Macro Breakdown Section */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Macro Breakdown
            </Text>
            <View className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 flex-col gap-6">
              {/* Protein */}
              <View>
                <View className="flex-row justify-between items-end mb-2">
                  <Text className="font-bold text-white">Protein</Text>
                  <Text className="text-sm text-zinc-400 font-medium tabular-nums">
                    <Text className="text-white">
                      {currentDay.macros.protein.current}g
                    </Text>{" "}
                    / {currentDay.macros.protein.goal}g
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-zinc-800 rounded-full flex-row overflow-hidden">
                  <View
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${getProgress(
                        currentDay.macros.protein.current,
                        currentDay.macros.protein.goal
                      )}%`,
                    }}
                  />
                </View>
              </View>

              {/* Carbs */}
              <View>
                <View className="flex-row justify-between items-end mb-2">
                  <Text className="font-bold text-white">Carbs</Text>
                  <Text className="text-sm text-zinc-400 font-medium tabular-nums">
                    <Text className="text-white">
                      {currentDay.macros.carbs.current}g
                    </Text>{" "}
                    / {currentDay.macros.carbs.goal}g
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-zinc-800 rounded-full flex-row overflow-hidden">
                  <View
                    className="h-full bg-yellow-500 rounded-full"
                    style={{
                      width: `${getProgress(
                        currentDay.macros.carbs.current,
                        currentDay.macros.carbs.goal
                      )}%`,
                    }}
                  />
                </View>
              </View>

              {/* Fat */}
              <View>
                <View className="flex-row justify-between items-end mb-2">
                  <Text className="font-bold text-white">Fat</Text>
                  <Text className="text-sm text-zinc-400 font-medium tabular-nums">
                    <Text className="text-white">
                      {currentDay.macros.fat.current}g
                    </Text>{" "}
                    / {currentDay.macros.fat.goal}g
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-zinc-800 rounded-full flex-row overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${getProgress(
                        currentDay.macros.fat.current,
                        currentDay.macros.fat.goal
                      )}%`,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Secondary Nutrients Section (Collapsible) */}
          <View className="mb-8">
            <Pressable
              onPress={() => setIsNutrientsExpanded(!isNutrientsExpanded)}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="flex-row items-center justify-between mb-4"
            >
              <Text className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">
                Additional Nutrients
              </Text>
              <Animated.View style={chevronStyle}>
                <Feather name="chevron-down" size={20} color="#71717a" />
              </Animated.View>
            </Pressable>

            {isNutrientsExpanded && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="overflow-hidden"
              >
                <View className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex-col gap-4">
                  <View className="flex-row justify-between items-center border-b border-zinc-800 pb-3">
                    <Text className="text-zinc-400 font-medium">Fiber</Text>
                    <Text className="text-white font-bold">
                      {currentDay.nutrients.fiber}g
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center border-b border-zinc-800 pb-3">
                    <Text className="text-zinc-400 font-medium">Sugar</Text>
                    <Text className="text-white font-bold">
                      {currentDay.nutrients.sugar}g
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center pb-1">
                    <Text className="text-zinc-400 font-medium">Sodium</Text>
                    <Text className="text-white font-bold">
                      {currentDay.nutrients.sodium}mg
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Meal Summary Section */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Meals
            </Text>
            <View className="bg-zinc-900 rounded-[32px] overflow-hidden border border-zinc-800">
              {currentDay.meals.map((meal, idx) => {
                let dotColor = "bg-purple-400";
                if (meal.type === "Breakfast") dotColor = "bg-orange-400";
                if (meal.type === "Lunch") dotColor = "bg-yellow-400";
                if (meal.type === "Dinner") dotColor = "bg-blue-400";

                return (
                  <Pressable
                    key={idx}
                    onPress={() => onMealTypeSelect(meal.type)}
                    style={({ pressed }) => [
                      { backgroundColor: pressed ? "#27272a" : "transparent" },
                    ]}
                    className={`w-full flex-row items-center justify-between p-5 ${
                      idx < currentDay.meals.length - 1
                        ? "border-b border-zinc-800"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`w-3 h-3 rounded-full ${dotColor}`} />
                      <Text className="font-bold text-white text-lg">
                        {meal.type}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-zinc-400 font-medium">
                        {meal.calories} kcal
                      </Text>
                      <Feather name="chevron-right" size={20} color="#52525b" />
                    </View>
                  </Pressable>
                );
              })}
              {currentDay.meals.length === 0 && (
                <View className="p-6 items-center">
                  <Text className="text-zinc-500">
                    No meals logged for this day.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
