import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { ImageWithFallback } from "./ImageWithFallback";

interface MealItemProps {
  title: string;
  sub: string;
  time: string;
  cal: number;
  img: string;
}

export function MealItem({ title, sub, time, cal, img }: MealItemProps) {
  return (
    <View className="flex-row items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 mb-3">
      <View className="flex-row items-center gap-4">
        <View className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
          <ImageWithFallback source={{ uri: img }} style={styles.image} />
        </View>
        <View>
          <Text className="font-bold text-white text-sm">{title}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <Text className="text-xs text-zinc-400">
              {sub} • {time}
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-col items-end">
        <Text className="text-white font-bold">{cal}</Text>
        <Text className="text-[10px] text-zinc-500 font-bold uppercase">Kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
