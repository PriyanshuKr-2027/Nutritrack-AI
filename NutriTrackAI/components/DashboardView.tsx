import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { supabase, useSession } from "../lib/supabase";
import { CircularProgress } from "./CircularProgress";
import { MealItem } from "./MealItem";
import { StreakScreen } from "./StreakScreen";
import { DashboardStatSkeleton, MealCardSkeleton } from "./SkeletonLoaders";
import { useNetInfo } from "../lib/useNetInfo";

interface DashboardViewProps {
  onOpenCam?: () => void;
  onOpenSearch?: () => void;
  onOpenScanLabel?: () => void;
  onOpenDayDetail?: (date: string) => void;
  onOpenMealDetail?: (id: string) => void;
  onOpenHistory?: () => void;
  onOpenVoice?: () => void;
  onOpenProfile?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DashboardView({
  onOpenCam,
  onOpenSearch,
  onOpenScanLabel,
  onOpenDayDetail,
  onOpenMealDetail,
  onOpenHistory,
  onOpenVoice,
  onOpenProfile,
}: DashboardViewProps) {
  const { user } = useSession();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showStreakScreen, setShowStreakScreen] = useState(false);
  const { isConnected } = useNetInfo();

  // ─── Data Fetching with React Query ──────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // 1. Get profile goals
      const { data: profile } = await supabase
        .from("profiles")
        .select("calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g")
        .eq("id", user!.id)
        .single();

      const goals = {
        cal: profile?.calorie_goal || 2000,
        p: profile?.protein_goal_g || 150,
        c: profile?.carbs_goal_g || 200,
        f: profile?.fat_goal_g || 65,
      };

      // 2. Get today's consumed items
      const today = new Date().toISOString().split("T")[0];
      const { data: meals } = await supabase
        .from("meals")
        .select("id, meal_type, logged_at")
        .eq("user_id", user!.id)
        .gte("logged_at", `${today}T00:00:00.000Z`)
        .lte("logged_at", `${today}T23:59:59.999Z`);

      let consumed = { cal: 0, p: 0, c: 0, f: 0 };
      let recentMeals: any[] = [];

      if (meals && meals.length > 0) {
        const mealIds = meals.map((m) => m.id);
        const { data: items } = await supabase
          .from("meal_items")
          .select("*")
          .in("meal_id", mealIds);

        if (items) {
          consumed = items.reduce(
            (acc, curr) => {
              acc.cal += Math.round(curr.calories || 0);
              acc.p += Math.round(curr.protein_g || 0);
              acc.c += Math.round(curr.carbs_g || 0);
              acc.f += Math.round(curr.fat_g || 0);
              return acc;
            },
            { cal: 0, p: 0, c: 0, f: 0 }
          );

          recentMeals = items.map((item) => {
            const parentMeal = meals.find((m) => m.id === item.meal_id);
            const dateObj = new Date(parentMeal?.logged_at || Date.now());
            const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            
            return {
              id: item.id,
              mealId: parentMeal?.id,
              title: item.food_name,
              sub: parentMeal?.meal_type || "Snack",
              time: timeStr,
              cal: item.calories,
              img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
            };
          }).reverse();
        }
      }
      return { goals, consumed, recentMeals };
    }
  });

  const goals = data?.goals || { cal: 2000, p: 150, c: 200, f: 65 };
  const consumed = data?.consumed || { cal: 0, p: 0, c: 0, f: 0 };
  const recentMeals = data?.recentMeals || [];

  // FAB Animation state
  const fabRotation = useSharedValue(0);

  const toggleFab = () => {
    setIsFabOpen(!isFabOpen);
    fabRotation.value = withSpring(isFabOpen ? 0 : 135, {
      stiffness: 200,
      damping: 20,
    });
  };

  const fabIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${fabRotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-white tracking-wide">
            NutriTrack
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => setShowStreakScreen(true)}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              className="flex-row items-center gap-1.5 bg-[#2a1705] border border-orange-900/30 px-3 py-1.5 rounded-full"
            >
              <Feather name="activity" size={16} color="#f97316" />
              <Text className="text-orange-400 text-sm font-bold">3d</Text>
            </Pressable>
            <Pressable 
              onPress={onOpenProfile}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              className="w-9 h-9 items-center justify-center bg-zinc-900 border border-zinc-800 rounded-full"
            >
               <Feather name="user" size={18} color="#a1a1aa" />
            </Pressable>
          </View>
        </View>

        <View className="px-6 flex-1">
          {isLoading ? (
            <>
              <DashboardStatSkeleton />
              <MealCardSkeleton />
              <MealCardSkeleton />
              <MealCardSkeleton />
            </>
          ) : (
          <>
          {/* Calorie Card */}
          <View className="bg-zinc-900 rounded-[32px] p-8 items-center justify-center relative border border-zinc-800/50 overflow-hidden mb-6">
            {/* Custom Gradient Glow - Approximated with View since blur is hard in RN */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(34, 197, 94, 0.05)" },
              ]}
            />

            <CircularProgress value={consumed.cal} max={goals.cal} />
            <Text className="mt-4 text-zinc-500 font-medium text-sm">
              of {goals.cal.toLocaleString()} kcal goal
            </Text>
          </View>

          {/* Macros Card */}
          <View className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800/50 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-white">Macros</Text>
              <Pressable onPress={() => onOpenDayDetail?.(new Date().toISOString().split("T")[0])}>
                <Text className="text-green-500 text-xs font-bold">
                  View Details
                </Text>
              </Pressable>
            </View>

            <View className="">
              {/* Protein */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-zinc-300 font-medium">Protein</Text>
                  <View className="flex-row">
                    <Text className="text-sm text-white font-bold">{Math.round(consumed.p)}g</Text>
                    <Text className="text-sm text-zinc-600"> / {Math.round(goals.p)}g</Text>
                  </View>
                </View>
                <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <View 
                    style={{ width: `${Math.min(100, (consumed.p / Math.max(1, goals.p)) * 100)}%` }} 
                    className="h-full bg-cyan-400 rounded-full" 
                  />
                </View>
              </View>

              {/* Carbs */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-zinc-300 font-medium">Carbs</Text>
                  <View className="flex-row">
                    <Text className="text-sm text-white font-bold">{Math.round(consumed.c)}g</Text>
                    <Text className="text-sm text-zinc-600"> / {Math.round(goals.c)}g</Text>
                  </View>
                </View>
                <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <View 
                    style={{ width: `${Math.min(100, (consumed.c / Math.max(1, goals.c)) * 100)}%` }} 
                    className="h-full bg-yellow-400 rounded-full" 
                  />
                </View>
              </View>

              {/* Fat */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-zinc-300 font-medium">Fat</Text>
                  <View className="flex-row">
                    <Text className="text-sm text-white font-bold">{Math.round(consumed.f)}g</Text>
                    <Text className="text-sm text-zinc-600"> / {Math.round(goals.f)}g</Text>
                  </View>
                </View>
                <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <View 
                    style={{ width: `${Math.min(100, (consumed.f / Math.max(1, goals.f)) * 100)}%` }} 
                    className="h-full bg-blue-500 rounded-full" 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Meals Section */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-white">Today's Meals</Text>
              <Pressable onPress={onOpenHistory} className="w-8 h-8 rounded-full bg-zinc-900 items-center justify-center">
                <Feather name="more-horizontal" size={18} color="#a1a1aa" />
              </Pressable>
            </View>

            {recentMeals.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-zinc-500">No meals logged today yet.</Text>
                <Text className="text-zinc-600 text-sm mt-1">Tap + to add your first meal</Text>
              </View>
            ) : (
              recentMeals.map((meal, index) => (
                <Pressable key={`${meal.id}-${index}`} onPress={() => onOpenMealDetail?.(meal.mealId || meal.id)}>
                  <MealItem
                    title={meal.title}
                    sub={meal.sub}
                    time={meal.time}
                    cal={meal.cal}
                    img={meal.img}
                  />
                </Pressable>
              ))
            )}
          </View>
          </>
          )}
        </View>
      </ScrollView>

      {/* FAB Overlay & Menu */}
      {isFabOpen && (
        <>
          {/* Dim Overlay */}
          <AnimatedPressable
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            onPress={toggleFab}
            style={StyleSheet.absoluteFill}
            className="bg-black/80 z-40 flex-1"
          />

          {/* FAB Options */}
          <View className="absolute bottom-[170px] right-6 z-50 flex-col items-end">
            <FabAction
              label="Manual Add"
              icon="edit-2"
              delay={50}
              onPress={() => {
                onOpenSearch?.();
                setIsFabOpen(false);
              }}
            />
            <FabAction
              label="Scan Label"
              icon="maximize"
              delay={100}
              onPress={() => {
                onOpenScanLabel?.();
                setIsFabOpen(false);
              }}
            />
            <FabAction
              label="Mic"
              icon="mic"
              delay={150}
              disabled={!isConnected}
              tooltip="Needs internet"
              onPress={() => {
                onOpenVoice?.();
                setIsFabOpen(false);
              }}
            />
            <FabAction
              label="Camera"
              icon="camera"
              delay={200}
              disabled={!isConnected}
              tooltip="Needs internet"
              onPress={() => {
                onOpenCam?.();
                setIsFabOpen(false);
              }}
            />
          </View>
        </>
      )}

      {/* Main FAB */}
      <AnimatedPressable
        onPress={toggleFab}
        className="absolute bottom-[96px] right-6 w-16 h-16 rounded-full items-center justify-center bg-green-500 z-50"
        style={[
          {
            shadowColor: "#064e3b",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Animated.View style={fabIconStyle}>
          <Feather name="plus" size={32} color="black" />
        </Animated.View>
      </AnimatedPressable>

      {/* Streak Screen */}
      <StreakScreen
        isOpen={showStreakScreen}
        onClose={() => setShowStreakScreen(false)}
        currentStreak={3}
        longestStreak={14}
        daysThisWeek={5}
        totalDaysLogged={42}
      />
    </View>
  );
}

// Helper component for FAB actions
function FabAction({
  label,
  icon,
  delay,
  onPress,
  disabled = false,
  tooltip,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  delay: number;
  onPress: () => void;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).delay(delay)}
      exiting={SlideOutDown.duration(200)}
      className="flex-row items-center gap-4 mb-5"
    >
      <View style={{ alignItems: "flex-end" }}>
        <Text className="text-white font-bold text-base tracking-wide shadow-black shadow-sm">
          {label}
        </Text>
        {disabled && tooltip && (
          <Text style={{ color: "#f97316", fontSize: 10, marginTop: 2 }}>{tooltip}</Text>
        )}
      </View>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          {
            transform: [{ scale: pressed && !disabled ? 0.9 : 1 }],
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
      >
        <Feather name={icon} size={24} color={disabled ? "#52525b" : "white"} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContent: {
    paddingBottom: 200, // Make room for FAB
  },
});
