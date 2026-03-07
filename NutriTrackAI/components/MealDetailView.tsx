import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageWithFallback } from "./ImageWithFallback";

// Types
export interface MealDetailData {
  id: string;
  name: string;
  image: string;
  calories: number;
  mealType: string;
  timestamp: string;
  macros: {
    protein: { value: number; max: number; color: string };
    carbs: { value: number; max: number; color: string };
    fat: { value: number; max: number; color: string };
  };
  ingredients?: { name: string; amount: string }[];
  labelNutrients?: { name: string; value: string }[];
  isLabelBased?: boolean;
}

interface MealDetailViewProps {
  data: MealDetailData;
  onBack: () => void;
  onDelete: () => void;
}

export function MealDetailView({
  data,
  onBack,
  onDelete,
}: MealDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [isLabelExpanded, setIsLabelExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // Helper for progress bars
  const getProgress = (val: number, max: number) =>
    Math.min((val / max) * 100, 100);

  // Animation for the chevron
  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(isLabelExpanded ? "180deg" : "0deg"),
        },
      ],
    };
  });

  return (
    <View className="flex-1 bg-black w-full relative">
      {/* Header */}
      <View
        className="px-4 pb-4 flex-row items-center justify-between z-10 bg-black/90 border-b border-zinc-900"
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

        <View className="flex-col items-center flex-1 px-2">
          <Text className="text-lg font-bold text-white text-center" numberOfLines={1}>
            {data.name}
          </Text>
          <Text className="text-xs text-zinc-500 font-medium text-center">
            {data.mealType} • {data.timestamp}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowMenu(true)}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-10 h-10 rounded-full items-center justify-center bg-zinc-900"
        >
          <Feather name="more-horizontal" size={20} color="white" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View className="items-center mb-8">
          <View className="w-40 h-40 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 justify-center items-center shadow-lg shadow-white/5">
            <View className="absolute inset-0 rounded-full border border-white/10 z-10" />
            <ImageWithFallback
              source={{ uri: data.image }}
              className="w-full h-full"
              style={{ resizeMode: "cover" }}
            />
          </View>
        </View>

        {/* Nutrition Summary Card */}
        <View className="bg-zinc-900 rounded-[32px] p-6 mb-6 border border-zinc-800">
          <View className="items-center mb-8">
            <Text className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-1">
              Total Energy
            </Text>
            <View className="flex-row items-baseline justify-center gap-1">
              <Text className="text-5xl font-bold text-white tracking-tighter">
                {data.calories}
              </Text>
              <Text className="text-lg text-zinc-500 font-medium">kcal</Text>
            </View>
          </View>

          <View className="flex-col gap-6">
            {/* Protein */}
            <View>
              <View className="flex-row justify-between text-sm mb-2">
                <Text className="text-zinc-400 font-medium">Protein</Text>
                <Text className="text-white font-bold">
                  {data.macros.protein.value}g
                </Text>
              </View>
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex-row">
                <View
                  className={`h-full rounded-full ${data.macros.protein.color}`}
                  style={{
                    width: `${getProgress(
                      data.macros.protein.value,
                      data.macros.protein.max
                    )}%`,
                  }}
                />
              </View>
            </View>

            {/* Carbs */}
            <View>
              <View className="flex-row justify-between text-sm mb-2">
                <Text className="text-zinc-400 font-medium">Carbs</Text>
                <Text className="text-white font-bold">
                  {data.macros.carbs.value}g
                </Text>
              </View>
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex-row">
                <View
                  className={`h-full rounded-full ${data.macros.carbs.color}`}
                  style={{
                    width: `${getProgress(
                      data.macros.carbs.value,
                      data.macros.carbs.max
                    )}%`,
                  }}
                />
              </View>
            </View>

            {/* Fat */}
            <View>
              <View className="flex-row justify-between text-sm mb-2">
                <Text className="text-zinc-400 font-medium">Fat</Text>
                <Text className="text-white font-bold">
                  {data.macros.fat.value}g
                </Text>
              </View>
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex-row">
                <View
                  className={`h-full rounded-full ${data.macros.fat.color}`}
                  style={{
                    width: `${getProgress(
                      data.macros.fat.value,
                      data.macros.fat.max
                    )}%`,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Label Nutrients (Conditional) */}
        {data.isLabelBased && data.labelNutrients && (
          <View className="mb-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
            <Pressable
              onPress={() => setIsLabelExpanded(!isLabelExpanded)}
              className="w-full flex-row items-center justify-between p-4"
            >
              <Text className="font-bold text-white text-base">
                Label Nutrients
              </Text>
              <Animated.View style={chevronStyle}>
                <Feather name="chevron-down" size={20} color="#71717a" />
              </Animated.View>
            </Pressable>

            {isLabelExpanded && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="overflow-hidden"
              >
                <View className="px-4 pb-4 flex-col gap-3">
                  {data.labelNutrients.map((item, idx) => (
                    <View
                      key={idx}
                      className={`flex-row justify-between pb-2 ${
                        idx < data.labelNutrients!.length - 1
                          ? "border-b border-zinc-800/50"
                          : ""
                      }`}
                    >
                      <Text className="text-sm text-zinc-400">{item.name}</Text>
                      <Text className="text-sm text-white font-medium">
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {/* Ingredients Section */}
        {data.ingredients && data.ingredients.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-bold mb-4 px-1 text-white">
              Ingredients
            </Text>
            <View className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50 flex-col">
              {data.ingredients.map((ing, idx) => (
                <View
                  key={idx}
                  className={`flex-row items-center justify-between p-4 ${
                    idx < data.ingredients!.length - 1
                      ? "border-b border-zinc-800"
                      : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-2 h-2 rounded-full bg-zinc-700" />
                    <Text className="font-medium text-zinc-200">
                      {ing.name}
                    </Text>
                  </View>
                  <Text className="text-sm text-zinc-500 font-medium tabular-nums">
                    {ing.amount}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => setShowMenu(false)}
          />

          <Animated.View
            entering={SlideInDown.springify().damping(25).stiffness(300)}
            exiting={SlideOutDown}
            className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />

            <Pressable
              onPress={() => {
                onDelete();
                setShowMenu(false);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? "rgba(239, 68, 68, 0.1)"
                    : "transparent",
                },
              ]}
              className="w-full flex-row items-center gap-4 p-4 rounded-xl"
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text className="text-red-500 font-medium text-base">
                Delete Entry
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowMenu(false)}
              className="w-full mt-4 py-4 items-center"
            >
              <Text className="text-zinc-500 font-medium text-base">Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
