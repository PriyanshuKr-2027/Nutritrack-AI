import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ImageWithFallback } from "./ImageWithFallback";
import { FoodItemData } from "./SearchFoodView";
import { supabase } from "../lib/supabase";

const FALLBACK_FOOD_DATA: FoodItemData = {
  name: "Unknown Food",
  calories: "0",
  protein: "0",
  carbs: "0",
  fat: "0",
  fiber: "0",
  sugar: "0",
  servingSize: "1",
  mealType: "Meal",
};

export type PortionType = "quantity" | "size";

export interface Ingredient {
  id: string;
  name: string;
  detail: string;
  amount: string;
  iconType?: "wheat" | "egg" | "utensils" | "color";
  iconColor?: string;
}

export interface EditEntryViewProps {
  onBack: () => void;
  onConfirm: (entry: {
    foodData: FoodItemData;
    quantity: number;
    mealType: string;
    totalWeightProcessed: number;
    calculatedCalories: number;
    calculatedProtein: number;
    calculatedCarbs: number;
    calculatedFat: number;
  }) => void;
  onAddIngredient: () => void;
  initialData?: FoodItemData;
  addedIngredients?: Ingredient[];
  mockIngredients?: Ingredient[]; 
}

// Default mock ingredients for Samosa if none provided
const DEFAULT_INGREDIENTS: Ingredient[] = [
  {
    id: "1",
    name: "Potato filling",
    detail: "Spiced mashed potatoes",
    amount: "80 g",
    iconType: "color",
    iconColor: "#fef08a",
  },
  {
    id: "2",
    name: "Wheat flour",
    detail: "Pastry shell",
    amount: "40 g",
    iconType: "wheat",
  },
];

export function EditEntryView({
  onBack,
  onConfirm,
  onAddIngredient,
  initialData = FALLBACK_FOOD_DATA,
  addedIngredients = [],
  mockIngredients = DEFAULT_INGREDIENTS,
}: EditEntryViewProps) {
  const insets = useSafeAreaInsets();
  
  // State
  const [quantity, setQuantity] = useState(
    parseInt(initialData.servingSize) || 1
  );
  const [selectedSize, setSelectedSize] = useState("Medium");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualWeight, setManualWeight] = useState("");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () => setQuantity((q) => q + 1);

  const handleDeleteIngredient = (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
  };

  const isSizeType = initialData.unit?.toLowerCase().includes("bowl") || initialData.unit?.toLowerCase().includes("piece") || initialData.unit?.toLowerCase().includes("serve");
  const sizes = ["Small", "Medium", "Large"];

  const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const [selectedMealType, setSelectedMealType] = useState(
    MEAL_TYPES.includes(initialData.mealType) ? initialData.mealType : "Snack"
  );
  
  const [isSaving, setIsSaving] = useState(false);

  // Derived Calculations
  const baseWeightG = parseInt(initialData.servingSize) || 100;
  
  // Total weight currently selected
  const calculatedWeight = manualWeight
    ? parseInt(manualWeight) || 0
    : isSizeType
    ? selectedSize === "Small"
      ? 150 * quantity
      : selectedSize === "Large"
      ? 350 * quantity
      : 250 * quantity
    : baseWeightG * quantity;

  // Macros per 1g
  const calPerG = (parseFloat(initialData.calories) || 0) / 100;
  const pPerG = (parseFloat(initialData.protein) || 0) / 100;
  const cPerG = (parseFloat(initialData.carbs) || 0) / 100;
  const fPerG = (parseFloat(initialData.fat) || 0) / 100;

  // Live calculated macros
  const displayCalories = Math.round(calPerG * calculatedWeight);
  const displayProtein = Math.round(pPerG * calculatedWeight);
  const displayCarbs = Math.round(cPerG * calculatedWeight);
  const displayFat = Math.round(fPerG * calculatedWeight);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm({
        foodData: initialData,
        quantity,
        mealType: selectedMealType,
        totalWeightProcessed: calculatedWeight,
        calculatedCalories: displayCalories,
        calculatedProtein: displayProtein,
        calculatedCarbs: displayCarbs,
        calculatedFat: displayFat,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderIcon = (ing: Ingredient) => {
    if (ing.iconType === "wheat") {
      return <Feather name="wind" size={16} color="#ca8a04" />; // Closest to wheat
    }
    if (ing.iconType === "color" && ing.iconColor) {
      return (
        <View
          style={{ backgroundColor: ing.iconColor }}
          className="w-3 h-3 rounded-full"
        />
      );
    }
    return <Feather name="coffee" size={16} color="#a1a1aa" />;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full"
    >
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
        <Text className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          Review & Adjust
        </Text>
        <View className="w-10" />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Image */}
        <View className="items-center justify-center mb-6 mt-2">
          <View className="w-40 h-40 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl">
             <ImageWithFallback
                source={{ uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" }} // Placeholder
                className="w-full h-full"
              />
          </View>
        </View>

        {/* Title Section */}
        <View className="items-center mb-8">
          <View className="flex-row items-center justify-center gap-2 mb-2">
            <Text className="text-3xl font-bold text-white">
              {initialData.name}
            </Text>
            <Feather name="edit-2" size={18} color="#71717a" />
          </View>
            {/* Total Calories Live Display */}
            <View className="flex-col items-end">
               <Text className="text-3xl font-bold text-white tracking-tight">
                {displayCalories}
              </Text>
              <Text className="text-sm text-zinc-500">kcal</Text>
            </View>
          </View>

          {/* Meal Type Selection */}
          <View className="flex-row items-center justify-center gap-2 flex-wrap">
            {MEAL_TYPES.map((type) => {
              const isActive = selectedMealType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedMealType(type)}
                  className={`flex-row items-center gap-1.5 px-3 py-1.5 justify-center rounded-full border border-transparent ${
                    isActive ? "bg-zinc-800 border-zinc-700" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isActive ? "text-white font-medium" : "text-zinc-500"
                    }`}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          
          <View className="mt-4 flex-row items-center justify-center gap-6">
             <View className="flex-col items-center">
               <Text className="text-sm font-bold text-zinc-300">{displayProtein}g</Text>
               <Text className="text-[10px] text-zinc-500 uppercase tracking-wider">Protein</Text>
             </View>
             <View className="flex-col items-center">
               <Text className="text-sm font-bold text-zinc-300">{displayCarbs}g</Text>
               <Text className="text-[10px] text-zinc-500 uppercase tracking-wider">Carbs</Text>
             </View>
             <View className="flex-col items-center">
               <Text className="text-sm font-bold text-zinc-300">{displayFat}g</Text>
               <Text className="text-[10px] text-zinc-500 uppercase tracking-wider">Fat</Text>
             </View>
          </View>

        {/* Portion Card */}
        <View className="bg-zinc-900 rounded-3xl p-6 mb-8 border border-zinc-800">
          {/* Size Selector (Conditional) */}
          {isSizeType && (
            <View className="mb-6">
              <Text className="text-sm text-zinc-400 font-medium mb-3 uppercase tracking-wider">
                Serving Size
              </Text>
              <View className="flex-row bg-zinc-800/50 p-1 rounded-full">
                {sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      className={`flex-1 py-2 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-green-800/30 border border-green-700/50"
                          : ""
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-green-400" : "text-zinc-500"
                        }`}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity Control */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-medium text-white">Quantity</Text>
            <Text className="text-sm text-zinc-500">{initialData.unit || "serving"}</Text>
          </View>

          <View className="flex-row items-center justify-between gap-4 h-16 bg-zinc-950/50 rounded-2xl px-2 border border-zinc-800/50">
            <Pressable
              onPress={handleDecrement}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              className="w-12 h-12 items-center justify-center rounded-xl bg-zinc-800"
            >
              <Feather name="minus" size={20} color="#d4d4d8" />
            </Pressable>

            <Text className="text-3xl font-semibold w-16 text-center text-white tabular-nums">
              {quantity}
            </Text>

            <Pressable
              onPress={handleIncrement}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
                {
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 15,
                  elevation: 8,
                },
              ]}
              className="w-12 h-12 items-center justify-center rounded-xl bg-green-500"
            >
              <Feather name="plus" size={20} color="black" />
            </Pressable>
          </View>

          {/* Advanced / Precise Adjustment */}
          <View className="mt-6 items-center">
            <Pressable
              onPress={() => setShowAdvanced(!showAdvanced)}
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm text-green-500 font-medium">
                Adjust precisely
              </Text>
              <Feather
                name={showAdvanced ? "chevron-up" : "chevron-down"}
                size={16}
                color="#22c55e"
              />
            </Pressable>

            {showAdvanced && (
              <Animated.View
                entering={FadeInUp.duration(200)}
                className="w-full mt-4 pt-4 border-t border-zinc-800"
              >
                <Text className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">
                  Manual Weight (g)
                </Text>
                <TextInput
                  value={manualWeight}
                  onChangeText={setManualWeight}
                  placeholder="e.g. 150"
                  placeholderTextColor="#71717a"
                  keyboardType="numeric"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500"
                />
              </Animated.View>
            )}
          </View>
        </View>

        {/* Ingredients Section */}
        <View className="mb-4">
          <Text className="text-base font-medium text-white mb-4">
            Ingredients
          </Text>
          <View className="flex-col gap-3">
            {[...mockIngredients, ...addedIngredients]
              .filter((ing) => !deletedIds.includes(ing.id))
              .map((ing) => (
                <View
                  key={ing.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-4 flex-1 pr-4">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                      {renderIcon(ing)}
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-white mb-0.5">
                        {ing.name}
                      </Text>
                      <Text className="text-xs text-zinc-500">
                        {ing.detail}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-sm text-zinc-300 font-medium">
                      {ing.amount}
                    </Text>
                    <Pressable
                      onPress={() => handleDeleteIngredient(ing.id)}
                      style={({ pressed }) => [
                        { opacity: pressed ? 0.5 : 1 },
                      ]}
                      className="w-8 h-8 items-center justify-center rounded-full bg-zinc-800/50"
                    >
                      <Feather name="trash-2" size={16} color="#71717a" />
                    </Pressable>
                  </View>
                </View>
              ))}
          </View>

          <Pressable
            onPress={onAddIngredient}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-full py-4 mt-2 flex-row items-center justify-center gap-2"
          >
            <Feather name="plus" size={16} color="#71717a" />
            <Text className="text-zinc-500 text-sm font-medium">
              Add new ingredient
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View
        className="absolute bottom-0 left-0 right-0 p-6 pt-12 z-20"
        style={{
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "black",
          }),
        }}
      >
        <Pressable
          onPress={handleConfirm}
          disabled={isSaving}
          style={({ pressed }) => [
            { transform: [{ scale: pressed && !isSaving ? 0.98 : 1 }] },
            { opacity: isSaving ? 0.7 : 1 }
          ]}
          className="w-full bg-green-500 py-4 rounded-full items-center shadow-lg shadow-green-900/30 flex-row justify-center"
        >
          <Text className="text-black text-lg font-bold">
            {isSaving ? "Saving..." : "Log Food"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
