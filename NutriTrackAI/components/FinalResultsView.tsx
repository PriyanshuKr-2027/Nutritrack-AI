import React from "react";
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ImageWithFallback } from "./ImageWithFallback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Replace figma import with a placeholder URI or require
const foodImg = "https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1vc2F8ZW58MHx8fHwxNzcwMTQ2NjMxfDA&ixlib=rb-4.1.0&q=80&w=1080";

export interface MacroData {
  label: string;
  value: number; // in grams
  unit: string;
  color: string; // Tailwind color class for bar
  total?: number; // for progress calculation (optional, or we assume a max)
}

export interface FinalResultData {
  name: string;
  mealType: string;
  timestamp: string;
  image: string;
  calories: number;
  macros: {
    protein: MacroData;
    carbs: MacroData;
    fat: MacroData;
  };
  ingredients: {
    name: string;
    amount: string;
  }[];
}

// Mock Data matching the design
const MOCK_RESULT: FinalResultData = {
  name: "Samosa",
  mealType: "Snack",
  timestamp: "Today, 4:30 PM",
  image: foodImg,
  calories: 550,
  macros: {
    protein: { label: "Protein", value: 10, unit: "g", color: "bg-green-500" },
    carbs: { label: "Carbs", value: 65, unit: "g", color: "bg-yellow-500" },
    fat: { label: "Fat", value: 32, unit: "g", color: "bg-blue-500" },
  },
  ingredients: [
    { name: "Potato filling", amount: "80g" },
    { name: "Wheat flour", amount: "40g" },
    { name: "Oil", amount: "15ml" },
    { name: "Spices", amount: "5g" },
  ],
};

interface FinalResultsViewProps {
  onBack: () => void;
  onDone: () => void;
  data?: FinalResultData;
}

export function FinalResultsView({
  onBack,
  onDone,
  data = MOCK_RESULT,
}: FinalResultsViewProps) {
  const insets = useSafeAreaInsets();
  
  // Helper to calculate progress bar width
  const maxMacro =
    Math.max(data.macros.protein.value, data.macros.carbs.value, data.macros.fat.value) *
    1.2; // 20% buffer

  const getWidth = (val: number) => {
    const percentage = Math.min((val / maxMacro) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <View className="flex-1 bg-black w-full">
      {/* Header */}
      <View
        className="p-4 flex-row items-center justify-between z-10"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="white" />
        </Pressable>

        <View className="items-center">
          <Text className="text-lg font-bold text-white">{data.name}</Text>
          <Text className="text-xs text-zinc-500">
            {data.mealType} • {data.timestamp}
          </Text>
        </View>

        <Pressable
          onPress={onBack} // assuming pencil is another back or edit action
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
        >
          <Feather name="edit-2" size={18} color="white" />
        </Pressable>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Image */}
        <View className="items-center justify-center mb-8 mt-4">
          <View className="w-48 h-48 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 relative items-center justify-center shadow-lg shadow-white/10">
            <View className="absolute inset-0 rounded-full border border-white/5 z-10" />
            <ImageWithFallback
              source={{ uri: data.image }}
              className="w-full h-full"
              style={{ resizeMode: "cover" }}
            />
          </View>
        </View>

        {/* Nutrition Card */}
        <View className="bg-zinc-900 rounded-[32px] p-6 mb-8 border border-zinc-800">
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

          <View className="space-y-6">
            {/* Protein */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-zinc-400 font-medium">Protein</Text>
                <Text className="text-sm text-white font-bold">
                  {data.macros.protein.value}
                  {data.macros.protein.unit}
                </Text>
              </View>
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${data.macros.protein.color}`}
                  style={{ width: getWidth(data.macros.protein.value) as any }}
                />
              </View>
            </View>

            {/* Carbs */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-zinc-400 font-medium">Carbs</Text>
                <Text className="text-sm text-white font-bold">
                  {data.macros.carbs.value}
                  {data.macros.carbs.unit}
                </Text>
              </View>
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${data.macros.carbs.color}`}
                  style={{ width: getWidth(data.macros.carbs.value) as any }}
                />
              </View>
            </View>

            {/* Fat */}
            <View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-zinc-400 font-medium">Fat</Text>
                <Text className="text-sm text-white font-bold">
                  {data.macros.fat.value}
                  {data.macros.fat.unit}
                </Text>
              </View>
              <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${data.macros.fat.color}`}
                  style={{ width: getWidth(data.macros.fat.value) as any }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Ingredients Section */}
        <View>
          <Text className="text-lg font-bold text-white mb-4 px-1">
            Ingredients
          </Text>
          <View className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50">
            {data.ingredients.map((ing, idx) => (
              <View
                key={idx}
                className={`flex-row items-center justify-between p-4 ${
                  idx !== data.ingredients.length - 1
                    ? "border-b border-zinc-800"
                    : ""
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-2 h-2 rounded-full bg-zinc-700" />
                  <Text className="font-medium text-zinc-200">{ing.name}</Text>
                </View>
                <Text className="text-sm text-zinc-500 font-medium tabular-nums">
                  {ing.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View
        className="absolute bottom-0 left-0 right-0 p-6 pt-12 z-20"
        style={{
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: Platform.select({
             ios: 'transparent',
             android: 'rgba(0,0,0,0.8)'
          })
        }}
      >
        <Pressable
          onPress={onDone}
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 8,
            },
          ]}
          className="w-full bg-green-500 py-4 rounded-full items-center justify-center"
        >
          <Text className="text-black text-lg font-bold">Done</Text>
        </Pressable>
      </View>
    </View>
  );
}
