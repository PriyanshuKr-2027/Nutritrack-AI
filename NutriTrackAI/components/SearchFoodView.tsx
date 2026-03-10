import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { supabase } from "../lib/supabase";
import { SearchResultsSkeleton } from "./SkeletonLoaders";

// Define these here for now to avoid circular dependencies if EditEntryView isn't created yet
export interface FoodItemData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  servingSize: string;
  mealType: string;
  unit?: string;
  source?: "ifct" | "usda" | "ai_generated";
}

// Mock data removed in favor of live DB search

// Helper to sanitize food names roughly
function formatFoodName(name: string) {
  // e.g. "Samosa (Veg)", "Egg (Hen, Whole, Raw)"
  const clean = name.split(',')[0].trim();
  return clean.replace(/\(.*?\)/g, "").trim();
}

interface SearchFoodViewProps {
  onBack: () => void;
  onSelect: (data: FoodItemData[]) => void;
  onCustomFood: () => void;
}

export function SearchFoodView({
  onBack,
  onSelect,
  onCustomFood,
}: SearchFoodViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; category: string; data: FoodItemData }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<FoodItemData[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const insets = useSafeAreaInsets();

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("search_all_foods" as any, {
          search_term: q,
        });

        if (error) throw error;

        // Map RPC result back to component's expected data structure
        const mapped = (data || []).map((row: any) => {
          const formattedName = formatFoodName(row.name);
          return {
            name: formattedName,
            category: row.source === "ifct" ? "Indian" : row.source === "usda" ? "General" : "AI",
            data: {
              name: row.name, // keep full name for exact match/DB
              calories: String(row.calories_per_100g || 0),
              protein: String(row.protein_per_100g || 0),
              carbs: String(row.carbs_per_100g || 0),
              fat: String(row.fat_per_100g || 0),
              fiber: String(row.fiber_per_100g || 0),
              sugar: "0", // optional in our DB schema
              servingSize: "100", // Standardized to 100g chunk
              mealType: "Custom", 
              unit: "g",
              source: row.source,
            },
          };
        });

        setResults(mapped);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const displayList = results;
  const showEmptyState = query.trim().length >= 2 && results.length === 0 && !isLoading;

  const isItemSelected = (itemData: FoodItemData) => {
    return selectedItems.some((selected) => selected.name === itemData.name);
  };

  const toggleItemSelection = (itemData: FoodItemData) => {
    setSelectedItems((prev) => {
      const isAlreadySelected = prev.some(
        (item) => item.name === itemData.name
      );
      if (isAlreadySelected) {
        return prev.filter((item) => item.name !== itemData.name);
      } else {
        return [...prev, itemData];
      }
    });
  };

  const handleLongPress = (itemData: FoodItemData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMultiSelectMode(true);
    toggleItemSelection(itemData);
  };

  const handlePress = (itemData: FoodItemData) => {
    if (isMultiSelectMode) {
      toggleItemSelection(itemData);
    } else {
      onSelect([itemData]);
    }
  };

  const handleContinue = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
    }
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedItems([]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full"
    >
      {/* Header */}
      <View
        className="p-4 flex-row items-center z-10 shrink-0"
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
          Search food
        </Text>
      </View>

      {/* Search Input Area */}
      <View className="px-4 pb-4 shrink-0 z-20">
        <View className="relative justify-center">
          <View className="absolute left-4 z-10">
            <Feather name="search" size={20} color="#a1a1aa" />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search food"
            placeholderTextColor="#71717a"
            autoFocus
            className="w-full bg-zinc-800 rounded-full pl-12 pr-12 py-3.5 text-white text-base border border-zinc-700 focus:border-zinc-500"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              className="absolute right-4 w-6 h-6 rounded-full bg-zinc-700/80 items-center justify-center"
            >
              <Feather name="x" size={14} color="#a1a1aa" />
            </Pressable>
          )}
        </View>

        {/* Multi-select Mode Indicator */}
        {isMultiSelectMode && (
          <Animated.View
            entering={FadeInUp.duration(200)}
            className="mt-3 flex-row items-center justify-between bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2.5"
          >
            <Text className="text-sm text-green-400 font-medium">
              Multi-select mode • Tap items to select
            </Text>
            <Pressable hitSlop={10} onPress={exitMultiSelectMode}>
              <Text className="text-green-400 font-medium text-sm">Exit</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Hint Text */}
        {!isMultiSelectMode && (
          <Text className="text-xs text-zinc-600 mt-3 text-center">
            Tap to select • Press & hold to multi-select
          </Text>
        )}
      </View>

      {/* Results List */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Allows tapping items without dismissing keyboard immediately
      >
        {showEmptyState ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-zinc-500 text-base">
              No results found for "{query}"
            </Text>
          </View>
        ) : isLoading && query.length >= 2 ? (
          <SearchResultsSkeleton count={5} />
        ) : (
          <View className="flex-col">
            {displayList.map((item, idx) => {
              const isSelected = isItemSelected(item.data);
              return (
                <Pressable
                  key={idx}
                  onPress={() => handlePress(item.data)}
                  onLongPress={() => handleLongPress(item.data)}
                  delayLongPress={500}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1 },
                    isSelected && isMultiSelectMode
                      ? { backgroundColor: "rgba(39, 39, 42, 0.5)" }
                      : {},
                  ]}
                  className="flex-row items-center py-4 border-b border-zinc-900"
                >
                  {/* Checkbox - Only show in multi-select mode */}
                  {isMultiSelectMode && (
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                        isSelected
                          ? "bg-green-500 border-green-500"
                          : "border-zinc-600 bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <Feather name="check" size={14} color="black" />
                      )}
                    </View>
                  )}

                  {/* Food Info */}
                  <View className="flex-1">
                    <Text className="font-bold text-white text-[17px] mb-0.5">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-zinc-800 px-2 py-0.5 rounded flex-row items-center">
                        <Text className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                          {item.category}
                        </Text>
                      </View>
                      <Text className="text-sm text-zinc-500">
                        {item.data.calories} kcal / 100g
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-4"
        style={{
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "black",
          }),
        }}
      >
        <View className="flex-col gap-3">
          {/* Continue Button - Only show in multi-select mode when items are selected */}
          {isMultiSelectMode && selectedItems.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Pressable
                onPress={handleContinue}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                className="w-full bg-green-500 rounded-2xl px-6 py-4 shadow-lg shadow-green-900/40 items-center justify-center flex-row"
              >
                <Text className="text-black font-bold text-base">
                  Continue with {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Custom Food Button - Secondary action */}
          <Pressable
            onPress={onCustomFood}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
            className="w-full py-3 items-center justify-center flex-row"
          >
            <Text className="text-zinc-500 text-sm">Can't find your food? </Text>
            <Text className="text-green-500 font-medium text-sm underline">
              Add custom food
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
