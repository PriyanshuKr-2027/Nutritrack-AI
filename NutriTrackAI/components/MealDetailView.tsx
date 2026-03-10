import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageWithFallback } from "./ImageWithFallback";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, useSession } from "../lib/supabase";

// Removed unused mock MealDetailData
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

interface MealDetailViewProps {
  mealId: string;
  onBack: () => void;
  onEdit?: (mealData: any) => void;
}

export function MealDetailView({
  mealId,
  onBack,
  onEdit,
}: MealDetailViewProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);

  const { data: mealData, isLoading } = useQuery({
    queryKey: ["meal", mealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select(`
          id, meal_type, logged_at, total_calories, total_protein_g, total_carbs_g, total_fat_g,
          meal_items (
            id, food_name, calories, protein_g, carbs_g, fat_g, weight_g, food_source
          )
        `)
        .eq("id", mealId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!mealId && !!user,
  });

  const handleDelete = () => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("meals").delete().eq("id", mealId);
              if (error) throw error;
              
              queryClient.invalidateQueries({ queryKey: ["historyMeals"] });
              queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
              onBack();
            } catch (error) {
              console.error("Error deleting meal:", error);
              Alert.alert("Error", "Failed to delete meal.");
            }
          }
        }
      ]
    );
  };

  // Helper for progress bars
  const getProgress = (val: number, max: number) =>
    Math.min(((val || 0) / max) * 100, 100);

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

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
          {isLoading ? (
             <ActivityIndicator color="#22c55e" />
          ) : (
            <>
              <Text className="text-lg font-bold text-white text-center" numberOfLines={1}>
                {mealData?.meal_items?.[0]?.food_name || mealData?.meal_type || "Meal Details"}
              </Text>
              <Text className="text-xs text-zinc-500 font-medium text-center">
                {mealData?.meal_type} • {formatTime(mealData?.logged_at)}
              </Text>
            </>
          )}
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
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator color="#22c55e" size="large" />
          </View>
        ) : mealData ? (
          <>
            {/* Image */}
            <View className="items-center mb-8">
              <View className="w-40 h-40 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 justify-center items-center shadow-lg shadow-white/5">
                <View className="absolute inset-0 rounded-full border border-white/10 z-10" />
                <ImageWithFallback
                  source={{ uri: DEFAULT_IMAGE }}
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
                    {Math.round(mealData.total_calories || 0)}
                  </Text>
                  <Text className="text-lg text-zinc-500 font-medium">kcal</Text>
                </View>
              </View>

              <View className="flex-col gap-6">
                {/* Protein */}
                <View>
                  <View className="flex-row justify-between text-sm mb-2">
                     <Text className="text-zinc-400 font-medium">Protein</Text>
                     <Text className="text-white font-bold">{Math.round(mealData.total_protein_g || 0)}g</Text>
                  </View>
                  <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex-row">
                     <View 
                       className="h-full rounded-full bg-cyan-400" 
                       style={{ width: `${getProgress(mealData.total_protein_g || 0, 100)}%` }} 
                     />
                  </View>
                </View>

                {/* Carbs */}
                <View>
                  <View className="flex-row justify-between text-sm mb-2">
                     <Text className="text-zinc-400 font-medium">Carbs</Text>
                     <Text className="text-white font-bold">{Math.round(mealData.total_carbs_g || 0)}g</Text>
                  </View>
                  <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex-row">
                     <View 
                       className="h-full rounded-full bg-yellow-400" 
                       style={{ width: `${getProgress(mealData.total_carbs_g || 0, 150)}%` }} 
                     />
                  </View>
                </View>

                {/* Fat */}
                <View>
                  <View className="flex-row justify-between text-sm mb-2">
                     <Text className="text-zinc-400 font-medium">Fat</Text>
                     <Text className="text-white font-bold">{Math.round(mealData.total_fat_g || 0)}g</Text>
                  </View>
                  <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex-row">
                     <View 
                       className="h-full rounded-full bg-blue-500" 
                       style={{ width: `${getProgress(mealData.total_fat_g || 0, 50)}%` }} 
                     />
                  </View>
                </View>
              </View>
            </View>

            {/* Ingredients Section */}
            {mealData.meal_items && mealData.meal_items.length > 0 && (
              <View className="mb-4">
                <Text className="text-lg font-bold mb-4 px-1 text-white">
                  Items
                </Text>
                <View className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50 flex-col">
                  {mealData.meal_items.map((ing: any, idx: number) => (
                    <View
                      key={idx}
                      className={`flex-row items-center justify-between p-4 ${
                        idx < mealData.meal_items.length - 1
                          ? "border-b border-zinc-800"
                          : ""
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-2 h-2 rounded-full bg-zinc-700" />
                        <Text className="font-medium text-zinc-200">
                          {ing.food_name}
                        </Text>
                      </View>
                      <Text className="text-sm text-zinc-500 font-medium tabular-nums">
                        {Math.round(ing.weight_g || 100)}g • {Math.round(ing.calories || 0)} kcal
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="items-center justify-center py-20">
            <Text className="text-zinc-500">Meal not found.</Text>
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
                setShowMenu(false);
                handleDelete();
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
