import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
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
import { useQuery } from "@tanstack/react-query";
import { supabase, useSession } from "../lib/supabase";

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

// Removed MOCK_DAYS

interface DayDetailViewProps {
  initialDate: string;
  onBack: () => void;
  onOpenMealDetail?: (id: string) => void;
}

export function DayDetailView({
  initialDate,
  onBack,
  onOpenMealDetail,
}: DayDetailViewProps) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const [viewDate, setViewDate] = useState(initialDate); // YYYY-MM-DD format
  const [isNutrientsExpanded, setIsNutrientsExpanded] = useState(false);

  const { data: currentDay, isLoading } = useQuery({
    queryKey: ["dayStats", user?.id, viewDate],
    queryFn: async () => {
      // Get profile goals
      const { data: profile } = await supabase
        .from("profiles")
        .select("calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g")
        .eq("id", user!.id)
        .single();

      // Get meals for the day
      const { data: meals } = await supabase
        .from("meals")
        .select(`
          id, meal_type, logged_at, total_calories, total_protein_g, total_carbs_g, total_fat_g,
          meal_items(id, carbs_g, sodium_mg, sugar_g)
        `)
        .eq("user_id", user!.id)
        .gte("logged_at", `${viewDate}T00:00:00.000Z`)
        .lte("logged_at", `${viewDate}T23:59:59.999Z`);

      let tCal = 0, tPro = 0, tCarb = 0, tFat = 0;
      let tFiber = 0, tSugar = 0, tSodium = 0;
      let dayMeals: any[] = [];

      if (meals) {
        meals.forEach((m: any) => {
          tCal += Math.round(m.total_calories || 0);
          tPro += Math.round(m.total_protein_g || 0);
          tCarb += Math.round(m.total_carbs_g || 0);
          tFat += Math.round(m.total_fat_g || 0);
          
          if (m.meal_items) {
             m.meal_items.forEach((item: any) => {
               // Fake fiber for now since IFCT database doesn't pass fiber through to meal_items
               // But we do have sodium and sugar if OCR was used... 
               tSodium += Math.round(item.sodium_mg || 0);
               tSugar += Math.round(item.sugar_g || 0);
             });
          }

          dayMeals.push({
            id: String(m.id),
            type: m.meal_type || 'Snack',
            calories: Math.round(m.total_calories || 0),
          });
        });
      }

      const d = new Date(viewDate);
      const isToday = d.toDateString() === new Date().toDateString();
      const dateLabel = isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });

      return {
        date: dateLabel,
        totalCalories: tCal,
        goalCalories: profile?.calorie_goal || 2000,
        macros: {
          protein: { current: tPro, goal: profile?.protein_goal_g || 150 },
          carbs: { current: tCarb, goal: profile?.carbs_goal_g || 200 },
          fat: { current: tFat, goal: profile?.fat_goal_g || 65 },
        },
        nutrients: { fiber: tFiber, sugar: tSugar, sodium: tSodium },
        meals: dayMeals,
      };
    },
    enabled: !!user,
  });

  // Swipe Handlers
  const handlePrevDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 1);
    setViewDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (viewDate < todayStr) {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + 1);
      setViewDate(d.toISOString().split("T")[0]);
    }
  };

  const panGesture = Gesture.Pan()
    .onEnd((e: any) => {
      // Swipe Right -> View Prev Day (visually scrolling left reveals previous)
      if (e.translationX > 50) {
        handlePrevDay();
      }
      // Swipe Left -> View Next Day
      if (e.translationX < -50) {
        handleNextDay();
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
            className="p-2"
          >
            <Feather
              name="chevron-left"
              size={24}
              color="#a1a1aa"
            />
          </Pressable>
          <Text className="text-lg font-bold w-32 text-center text-white">
            {currentDay?.date}
          </Text>
          <Pressable
            onPress={handleNextDay}
            disabled={viewDate >= new Date().toISOString().split("T")[0]}
            className="p-2"
          >
            <Feather
              name="chevron-right"
              size={24}
              color={viewDate >= new Date().toISOString().split("T")[0] ? "#3f3f46" : "#a1a1aa"}
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
            {isLoading ? (
               <ActivityIndicator color="#22c55e" size="large" />
            ) : currentDay ? (
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
            ) : null}
          </View>
          
          {currentDay && (
            <>

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
                    onPress={() => onOpenMealDetail?.(meal.id)}
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
          </>
        )}
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
