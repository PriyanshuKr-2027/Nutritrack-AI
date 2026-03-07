import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { FoodItemData } from "./SearchFoodView";
import { supabase } from "../lib/supabase";

interface CreateCustomFoodViewProps {
  onBack: () => void;
  onComplete: (data: FoodItemData) => void;
}

const CATEGORIES = ["Snack", "Meal", "Drink", "Fruit"];

export function CreateCustomFoodView({
  onBack,
  onComplete,
}: CreateCustomFoodViewProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [portionType, setPortionType] = useState<"quantity" | "size" | null>(
    null
  );
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Nutrition States
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isValid =
    name.trim().length > 0 && 
    category !== "" && 
    portionType !== null &&
    calories.trim().length > 0;

  const handleAddIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const updateIngredient = (index: number, val: string) => {
    const newIngs = [...ingredients];
    newIngs[index] = val;
    setIngredients(newIngs);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      const cals = parseInt(calories) || 0;
      const p = parseFloat(protein) || 0;
      const c = parseFloat(carbs) || 0;
      const f = parseFloat(fat) || 0;

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('custom_foods') // Storing user custom foods here for now as requested
          .insert({
            user_id: user.id,
            name: name.trim(),
            calories_per_100g: cals,
            protein_per_100g: p,
            carbs_per_100g: c,
            fat_per_100g: f,
          });
          
        if (error) {
          console.warn("Could not save custom food to DB:", error);
        }
      }

      const data: FoodItemData = {
        name: name.trim(),
        mealType: category,
        calories: String(cals),
        protein: String(p),
        carbs: String(c),
        fat: String(f),
        fiber: "0",
        sugar: "0",
        servingSize: portionType === "quantity" ? "1" : "100", // Default baseline
        unit: portionType === "quantity" ? "pieces" : "g",
      };

      onComplete(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full"
    >
      {/* Header */}
      <View
        className="p-4 flex-row items-center gap-4 z-10 shrink-0"
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
        <Text className="text-lg font-bold flex-1 text-center pr-8 text-white">
          Add custom food
        </Text>
      </View>

      {/* Form Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Food Name */}
        <View className="mb-6 mt-4">
          <Text className="text-sm font-medium text-zinc-300 mb-2">
            Food Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Homemade Paratha"
            placeholderTextColor="#71717a"
            className="w-full bg-zinc-900 rounded-2xl px-4 py-4 text-white border border-transparent focus:border-green-500"
          />
        </View>

        {/* Category Dropdown */}
        <View className="mb-8 relative z-50">
          <Text className="text-sm font-medium text-zinc-300 mb-2">
            Category
          </Text>
          <Pressable
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full bg-zinc-900 rounded-2xl px-4 py-4 flex-row items-center justify-between border ${
              isDropdownOpen ? "border-green-500" : "border-transparent"
            }`}
          >
            <Text className={category ? "text-white" : "text-zinc-500"}>
              {category || "Select category"}
            </Text>
            <Feather
              name={isDropdownOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color="#71717a"
            />
          </Pressable>

          {isDropdownOpen && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="mt-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl"
            >
              {CATEGORIES.map((cat, index) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  style={({ pressed }) => [
                    { backgroundColor: pressed ? "#27272a" : "transparent" },
                  ]}
                  className={`w-full flex-row items-center justify-between px-4 py-4 ${
                    index < CATEGORIES.length - 1
                      ? "border-b border-zinc-800/50"
                      : ""
                  }`}
                >
                  <Text className="text-zinc-300">{cat}</Text>
                  {category === cat && (
                    <Feather name="check" size={16} color="#22c55e" />
                  )}
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Portion Type */}
        <View className="mb-8 z-10">
          <Text className="text-sm font-medium text-white mb-4">
            How is this food usually eaten?
          </Text>

          <View className="flex-col gap-3">
            {/* Quantity Option */}
            <Pressable
              onPress={() => setPortionType("quantity")}
              className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                portionType === "quantity"
                  ? "bg-green-500/10 border-green-500"
                  : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <View>
                <Text className="font-bold text-white mb-0.5">Quantity</Text>
                <Text className="text-xs text-zinc-500">pieces / plates</Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border items-center justify-center ${
                  portionType === "quantity"
                    ? "border-green-500"
                    : "border-zinc-600"
                }`}
              >
                {portionType === "quantity" && (
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                )}
              </View>
            </Pressable>

            {/* Size Option */}
            <Pressable
              onPress={() => setPortionType("size")}
              className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                portionType === "size"
                  ? "bg-green-500/10 border-green-500"
                  : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <View>
                <Text className="font-bold text-white mb-0.5">Size</Text>
                <Text className="text-xs text-zinc-500">
                  small / medium / large
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border items-center justify-center ${
                  portionType === "size"
                    ? "border-green-500"
                    : "border-zinc-600"
                }`}
              >
                {portionType === "size" && (
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                )}
              </View>
            </Pressable>
          </View>

          <Text className="text-xs text-zinc-600 mt-3">
            This helps us choose the right portion controls later.
          </Text>
        </View>

        {/* Nutrition Inputs */}
        <View className="mb-8 z-10">
          <Text className="text-sm font-medium text-white mb-4">
            Nutrition per 100g (or 1 piece)
          </Text>
          
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-zinc-400 mb-2">Calories (kcal) *</Text>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base focus:border-green-500"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-zinc-400 mb-2">Protein (g)</Text>
              <TextInput
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base focus:border-green-500"
              />
            </View>
          </View>
          
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-zinc-400 mb-2">Carbs (g)</Text>
              <TextInput
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base focus:border-green-500"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-zinc-400 mb-2">Fat (g)</Text>
              <TextInput
                value={fat}
                onChangeText={setFat}
                placeholder="0"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white text-base focus:border-green-500"
              />
            </View>
          </View>
        </View>

        {/* Ingredient Template */}
        <View className="z-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-medium text-white">
              Ingredient template{" "}
              <Text className="text-zinc-500 font-normal">(optional)</Text>
            </Text>
          </View>

          <View className="flex-col gap-3 mb-4">
            {ingredients.map((ing, idx) => (
              <View key={idx} className="flex-row items-center gap-3">
                <TextInput
                  value={ing}
                  onChangeText={(val) => updateIngredient(idx, val)}
                  placeholder="Ingredient name"
                  placeholderTextColor="#71717a"
                  autoFocus={ing === ""}
                  className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800 focus:border-green-500 text-sm"
                />
                <Pressable
                  onPress={() => removeIngredient(idx)}
                  className="w-10 h-10 items-center justify-center"
                >
                  <Feather name="trash-2" size={18} color="#71717a" />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleAddIngredient}
            style={({ pressed }) => [
              { backgroundColor: pressed ? "#27272a" : "rgba(24, 24, 27, 0.5)" },
            ]}
            className="w-full py-4 rounded-2xl border border-zinc-800 flex-row items-center justify-center gap-2"
          >
            <Feather name="plus" size={18} color="#22c55e" />
            <Text className="text-green-500 font-medium">Add ingredient</Text>
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
          onPress={handleSubmit}
          disabled={!isValid || isSaving}
          style={({ pressed }) => [
            { transform: [{ scale: pressed && isValid && !isSaving ? 0.98 : 1 }] },
          ]}
          className={`w-full py-4 rounded-full flex-row items-center justify-center gap-2 ${
            isValid
              ? "bg-green-800 shadow-lg shadow-green-900/50"
              : "bg-zinc-800"
          }`}
        >
          <Text
            className={`text-lg font-bold ${
              isValid ? "text-white" : "text-zinc-500"
            }`}
          >
            {isSaving ? "Saving..." : "Create & Continue"}
          </Text>
          {isValid && !isSaving && (
            <Feather
              name="arrow-right"
              size={20}
              color="white"
              style={{ marginTop: 2 }}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
