import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import { ImageWithFallback } from "./ImageWithFallback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface FoodItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  calories: number;
  caloriesPerUnit: number;
  unit: string;
}

interface MultiItemConfirmViewProps {
  onBack: () => void;
  onConfirm: (items: FoodItem[]) => void;
  initialItems: FoodItem[];
  capturedImage?: string;
  onAddItem?: () => void;
}

export function MultiItemConfirmView({
  onBack,
  onConfirm,
  initialItems,
  capturedImage,
  onAddItem,
}: MultiItemConfirmViewProps) {
  const [items, setItems] = useState<FoodItem[]>(initialItems);
  const insets = useSafeAreaInsets();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
              calories: Math.round(item.caloriesPerUnit * newQuantity),
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <View className="flex-1 bg-black w-full">
      {/* Header */}
      <View
        className="p-4 flex-row items-center justify-between z-10 border-b border-zinc-900"
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
        <Text className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          Review Your Meal
        </Text>
        <View className="w-10" />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Captured Photo Preview (if available) */}
        {capturedImage && (
          <View className="mt-6 mb-6">
            <View className="w-full h-48 rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-900">
              <ImageWithFallback
                source={{ uri: capturedImage }}
                style={{ width: "100%", height: "100%", resizeMode: "cover" }}
              />
            </View>
          </View>
        )}

        {/* Total Calories Card */}
        <View className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 mb-6 mt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-green-400 font-medium mb-1">
                Total Meal
              </Text>
              <Text className="text-4xl font-bold text-white">
                {totalCalories}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-green-400 font-medium uppercase tracking-wider">
                kcal
              </Text>
            </View>
          </View>
          <View className="mt-4 pt-4 border-t border-green-500/20">
            <Text className="text-xs text-green-400/80">
              {items.length} item{items.length !== 1 ? "s" : ""} detected
            </Text>
          </View>
        </View>

        {/* Food Items List */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Detected Foods
          </Text>

          {items.map((item) => (
            <Animated.View
              key={item.id}
              layout={Layout.springify().damping(20).stiffness(200)}
              entering={FadeIn.springify().damping(20).stiffness(200)}
              exiting={FadeOut.duration(200)}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden mb-4"
            >
              {/* Delete Button */}
              <Pressable
                onPress={() => handleRemoveItem(item.id)}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10"
              >
                <Feather name="trash-2" size={16} color="#71717a" />
              </Pressable>

              {/* Item Header */}
              <View className="flex-row items-center gap-4 mb-4">
                <View className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-700">
                  <ImageWithFallback
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                  />
                </View>
                <View className="flex-1 pr-8">
                  <Text className="font-semibold text-base text-white mb-1">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-zinc-500">{item.unit}</Text>
                </View>
              </View>

              {/* Portion Slider */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                    Quantity
                  </Text>
                  <Text className="text-lg font-bold text-green-400">
                    {item.quantity}
                  </Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={item.quantity}
                  onValueChange={(val) => handleQuantityChange(item.id, val)}
                  minimumTrackTintColor="#22c55e"
                  maximumTrackTintColor="#27272a"
                  thumbTintColor="#22c55e"
                />
              </View>

              {/* Calories Display */}
              <View className="flex-row items-center justify-between pt-3 border-t border-zinc-800">
                <Text className="text-xs text-zinc-500 uppercase tracking-wider">
                  Calories
                </Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-xl font-bold text-white">
                    {item.calories}
                  </Text>
                  <Text className="text-sm text-zinc-500">kcal</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Add Another Item Button */}
        <Pressable
          onPress={onAddItem}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          className="w-full py-4 mb-4 border-2 border-dashed border-zinc-800 rounded-3xl items-center justify-center flex-row gap-2"
        >
          <Feather name="plus" size={18} color="#71717a" />
          <Text className="text-zinc-500 text-sm font-medium">
            Add another item
          </Text>
        </Pressable>
      </ScrollView>

      {/* Footer Action */}
      <View
        className="absolute bottom-0 left-0 right-0 p-6 pt-12 z-20"
        style={{
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "rgba(0,0,0,0.8)",
          }),
        }}
      >
        <Pressable
          onPress={() => onConfirm(items)}
          disabled={items.length === 0}
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: items.length === 0 ? 0 : 0.4,
              shadowRadius: 20,
              elevation: 8,
            },
          ]}
          className={`w-full py-4 rounded-full items-center justify-center ${
            items.length === 0 ? "bg-zinc-900" : "bg-green-500"
          }`}
        >
          <Text
            className={`text-lg font-bold ${
              items.length === 0 ? "text-zinc-600" : "text-black"
            }`}
          >
            Confirm Meal ({totalCalories} kcal)
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
