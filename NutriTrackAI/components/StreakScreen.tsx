import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
} from "react-native-reanimated";

interface StreakScreenProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  daysThisWeek: number;
  totalDaysLogged: number;
}

type Achievement = {
  id: number;
  name: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  reqDays?: number;
  reqStreak?: number;
};

const ACHIEVEMENTS: Achievement[] = [
  { id: 1, name: "First Steps", description: "Log your first meal", reqDays: 1, icon: "target" },
  { id: 2, name: "3-Day Warrior", description: "Maintain a 3-day streak", reqStreak: 3, icon: "zap" },
  { id: 3, name: "Week Champion", description: "Log meals for 7 days straight", reqStreak: 7, icon: "award" },
  { id: 4, name: "Consistency King", description: "Reach a 14-day streak", reqStreak: 14, icon: "trending-up" },
  { id: 5, name: "Month Master", description: "Complete a 30-day streak", reqStreak: 30, icon: "star" }, // Replaced Crown with star
  { id: 6, name: "Dedicated Logger", description: "Log 100 total days", reqDays: 100, icon: "calendar" },
];

export function StreakScreen({
  isOpen,
  onClose,
  currentStreak,
  longestStreak,
  daysThisWeek,
  totalDaysLogged,
}: StreakScreenProps) {
  if (!isOpen) return null;

  const getMotivationalMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today! 🚀";
    if (streak < 3) return "Great start! Keep the momentum going 💪";
    if (streak < 7) return "You're building a habit! Stay consistent 🎯";
    if (streak < 14) return "One week strong! You're unstoppable 🚀";
    if (streak < 30) return "Two weeks! You're a tracking champion 🏆";
    return "Incredible! A full month of dedication 🌟";
  };

  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.reqDays ? totalDaysLogged >= a.reqDays : longestStreak >= a.reqStreak!,
  }));

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Animated.View
      entering={SlideInRight.springify().damping(25).stiffness(300)}
      exiting={SlideOutRight.springify().damping(25).stiffness(300)}
      style={[StyleSheet.absoluteFill, { backgroundColor: "black", zIndex: 50, elevation: 5 }]}
      className="flex flex-col overflow-hidden"
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6 relative">
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onClose();
          }}
          className="absolute left-4 top-16 p-2 -ml-2 rounded-full"
        >
          <Feather name="x" size={24} color="white" />
        </Pressable>
        <Text className="text-xl font-semibold text-center text-white tracking-tight">Your Streak</Text>
      </View>

      {/* Content */}
      <Animated.ScrollView
        className="flex-1 px-6 space-y-6 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Main Streak Card */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="bg-orange-500/10 border-2 border-orange-500/40 rounded-3xl p-8 items-center"
        >
          <Feather name="activity" size={48} color="#f97316" style={{ marginBottom: 16 }} />

          <Text className="text-7xl font-black text-white leading-none mb-2">{currentStreak}</Text>
          <Text className="text-xl text-orange-400 font-bold uppercase tracking-wider">
            Day{currentStreak !== 1 ? "s" : ""} Streak
          </Text>

          {/* Motivational Message */}
          <View className="mt-6 pt-6 border-t border-orange-500/30 w-full items-center">
            <Text className="text-sm text-zinc-300 text-center">
              {getMotivationalMessage(currentStreak)}
            </Text>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View className="flex-row justify-between mb-2">
          <Animated.View
            entering={FadeIn.delay(200)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex-[0.48]"
          >
            <View className="w-12 h-12 bg-orange-500/10 rounded-full items-center justify-center mb-3">
              <Feather name="trending-up" size={24} color="#f97316" />
            </View>
            <Text className="text-sm text-zinc-400 mb-1">Longest Streak</Text>
            <Text className="text-3xl font-black text-white">{longestStreak}</Text>
            <Text className="text-xs text-zinc-500 mt-1">days</Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(250)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex-[0.48]"
          >
            <View className="w-12 h-12 bg-green-500/10 rounded-full items-center justify-center mb-3">
              <Feather name="calendar" size={24} color="#22c55e" />
            </View>
            <Text className="text-sm text-zinc-400 mb-1">This Week</Text>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-black text-white">{daysThisWeek}</Text>
              <Text className="text-lg text-zinc-600">/7</Text>
            </View>
            <Text className="text-xs text-zinc-500 mt-1">days logged</Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeIn.delay(300)}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex-row justify-between items-center mb-4"
        >
          <View>
            <Text className="text-sm text-zinc-400 mb-1">Total Days Logged</Text>
            <Text className="text-3xl font-black text-white">{totalDaysLogged}</Text>
          </View>
          <View className="w-16 h-16 bg-blue-500/10 rounded-full items-center justify-center">
            <Feather name="calendar" size={28} color="#3b82f6" />
          </View>
        </Animated.View>

        {/* Weekly Calendar */}
        <Animated.View entering={FadeIn.delay(350)} className="mb-4">
          <Text className="text-sm font-bold text-white mb-4">This Week</Text>
          <View className="flex-row justify-between">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
              const isLogged = index < daysThisWeek;
              const isToday = index === daysThisWeek - 1;

              return (
                <View
                  key={index}
                  className={`w-10 h-10 rounded-xl items-center justify-center border-2 ${
                    isLogged
                      ? "bg-green-500/20 border-green-500/50"
                      : "bg-zinc-900 border-zinc-800"
                  } ${isToday ? "border-green-500" : ""}`}
                >
                  <Text className="text-xs font-medium text-zinc-400 mb-0.5">{day}</Text>
                  {isLogged && <Feather name="check" size={14} color="#22c55e" />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeIn.delay(400)}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-white">Achievements</Text>
            <Text className="text-xs text-zinc-500 font-medium">
              {unlockedCount}/{achievements.length} unlocked
            </Text>
          </View>
          <View className="space-y-3 pb-8">
            {achievements.map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                entering={FadeIn.delay(450 + index * 50)}
                className={`p-4 rounded-2xl border-2 flex-row items-center gap-4 mb-2 ${
                  achievement.unlocked
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-zinc-900/50 border-zinc-800 opacity-60"
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    achievement.unlocked ? "bg-green-500/20" : "bg-zinc-800"
                  }`}
                >
                  <Feather
                    name={achievement.icon as any}
                    size={20}
                    color={achievement.unlocked ? "#22c55e" : "#52525b"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-bold text-sm ${
                      achievement.unlocked ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {achievement.name}
                  </Text>
                  <Text className="text-xs text-zinc-500 mt-0.5" numberOfLines={1}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                    <Feather name="check" size={12} color="black" />
                  </View>
                )}
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </Animated.View>
  );
}
