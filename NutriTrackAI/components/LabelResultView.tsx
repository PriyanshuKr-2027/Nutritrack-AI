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
import { ImageWithFallback } from "./ImageWithFallback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface LabelData {
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  sugar: string;
}

interface LabelResultViewProps {
  onBack: () => void;
  onConfirm: (data: LabelData, servings: number) => void;
  initialData: LabelData;
  capturedImage?: string;
}

export function LabelResultView({
  onBack,
  onConfirm,
  initialData,
  capturedImage,
}: LabelResultViewProps) {
  const [servings, setServings] = useState(1);
  const [editedData, setEditedData] = useState<LabelData>(initialData);
  const insets = useSafeAreaInsets();

  const handleFieldChange = (field: keyof LabelData, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const incrementServings = () => setServings((s) => s + 1);
  const decrementServings = () => setServings((s) => Math.max(1, s - 1));

  // Calculate totals based on servings
  const calculateTotal = (baseValue: string): string => {
    const num = parseFloat(baseValue) || 0;
    return (num * servings).toFixed(1);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full"
    >
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
          Nutrition Label
        </Text>
        <View className="w-10" />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Captured Label Preview */}
        {capturedImage && (
          <View className="mt-6 mb-6">
            <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
              Scanned Label
            </Text>
            <View className="w-full h-56 rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-900">
              <ImageWithFallback
                source={{ uri: capturedImage }}
                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
              />
            </View>
          </View>
        )}

        {/* Servings Counter */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6 mt-4">
          <View className="items-start mb-4">
            <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">
              Number of Servings
            </Text>
            <Text className="text-sm text-zinc-400">
              {editedData.servingSize || "Per serving"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between gap-4 h-16 bg-zinc-950/50 rounded-2xl px-2">
            <Pressable
              onPress={decrementServings}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              className="w-12 h-12 items-center justify-center rounded-xl bg-zinc-800"
            >
              <Feather name="minus" size={20} color="#d4d4d8" />
            </Pressable>

            <Text className="text-3xl font-semibold w-16 text-center text-white tabular-nums">
              {servings}
            </Text>

            <Pressable
              onPress={incrementServings}
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.95 : 1 }],
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
        </View>

        {/* Extracted Values - Editable */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Nutrition Facts
          </Text>

          {/* Serving Size */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
              Serving Size
            </Text>
            <TextInput
              value={editedData.servingSize}
              onChangeText={(val) => handleFieldChange("servingSize", val)}
              placeholder="e.g., 1 cup (240ml)"
              placeholderTextColor="#52525b"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Calories */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Calories
              </Text>
              <Text className="text-sm text-green-400 font-bold">
                {calculateTotal(editedData.calories)} kcal total
              </Text>
            </View>
            <TextInput
              value={editedData.calories}
              onChangeText={(val) => handleFieldChange("calories", val)}
              placeholder="e.g., 200"
              placeholderTextColor="#52525b"
              keyboardType="numeric"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Protein */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Protein (g)
              </Text>
              <Text className="text-sm text-zinc-400 font-medium">
                {calculateTotal(editedData.protein)}g
              </Text>
            </View>
            <TextInput
              value={editedData.protein}
              onChangeText={(val) => handleFieldChange("protein", val)}
              placeholder="e.g., 8"
              placeholderTextColor="#52525b"
              keyboardType="numeric"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Carbs */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Carbs (g)
              </Text>
              <Text className="text-sm text-zinc-400 font-medium">
                {calculateTotal(editedData.carbs)}g
              </Text>
            </View>
            <TextInput
              value={editedData.carbs}
              onChangeText={(val) => handleFieldChange("carbs", val)}
              placeholder="e.g., 24"
              placeholderTextColor="#52525b"
              keyboardType="numeric"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Fat */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Fat (g)
              </Text>
              <Text className="text-sm text-zinc-400 font-medium">
                {calculateTotal(editedData.fat)}g
              </Text>
            </View>
            <TextInput
              value={editedData.fat}
              onChangeText={(val) => handleFieldChange("fat", val)}
              placeholder="e.g., 8"
              placeholderTextColor="#52525b"
              keyboardType="numeric"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Sodium */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Sodium (mg)
              </Text>
              <Text className="text-sm text-zinc-400 font-medium">
                {calculateTotal(editedData.sodium)}mg
              </Text>
            </View>
            <TextInput
              value={editedData.sodium}
              onChangeText={(val) => handleFieldChange("sodium", val)}
              placeholder="e.g., 140"
              placeholderTextColor="#52525b"
              keyboardType="numeric"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Sugar */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Sugar (g)
              </Text>
              <Text className="text-sm text-zinc-400 font-medium">
                {calculateTotal(editedData.sugar)}g
              </Text>
            </View>
            <TextInput
              value={editedData.sugar}
              onChangeText={(val) => handleFieldChange("sugar", val)}
              placeholder="e.g., 12"
              placeholderTextColor="#52525b"
              keyboardType="numeric"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
            />
          </View>
        </View>
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
          onPress={() => onConfirm(editedData, servings)}
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
          <Text className="text-black text-lg font-bold">Add to Meal</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
