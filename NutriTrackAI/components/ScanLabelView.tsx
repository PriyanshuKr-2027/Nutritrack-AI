import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageWithFallback } from "./ImageWithFallback";

// Replace figma import with a placeholder URI for camera preview styling
const exampleImage =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kX2Jvd2x8ZW58MHx8fHwxNzcwMTU4NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface ScanLabelViewProps {
  onClose: () => void;
  onCapture: () => void;
  onGallery: () => void;
  onComplete?: () => void;
}

export function ScanLabelView({
  onClose,
  onCapture,
  onGallery,
  onComplete,
}: ScanLabelViewProps) {
  const [flashOn, setFlashOn] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black w-full relative overflow-hidden">
      {/* Camera Feed - Full Screen */}
      <ImageWithFallback
        source={{ uri: exampleImage }}
        style={[StyleSheet.absoluteFillObject, { resizeMode: "cover" }]}
      />

      {/* UI Overlay */}
      <View
        className="flex-1 z-10"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        {/* Top Controls */}
        <View className="flex-row justify-between items-center p-4">
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
          >
            <Feather name="x" size={24} color="white" />
          </Pressable>

          <Pressable
            onPress={() => setFlashOn(!flashOn)}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
          >
            {flashOn ? (
              <Feather name="zap" size={24} color="white" />
            ) : (
              <Feather name="zap-off" size={24} color="white" />
            )}
          </Pressable>
        </View>

        {/* Primary Instruction */}
        <View className="items-center mt-2 px-6">
          <Text className="text-white/90 text-lg font-medium shadow-sm shadow-black shrink-0">
            Scan nutrition label
          </Text>
        </View>

        {/* Scanning Frame Area */}
        <View className="flex-1 items-center justify-center relative px-8 py-4">
          {/* The Frame */}
          <View className="w-full max-w-xs aspect-[3/4] rounded-3xl border-2 border-green-500 shadow-sm shadow-black/10 relative" />

          {/* Secondary Instruction */}
          <Text className="mt-6 text-white/80 text-sm font-medium shadow-sm shadow-black text-center max-w-[240px]">
            Align the label clearly inside the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <View className="p-8 pb-12 items-center justify-center relative mt-auto flex-row">
          {/* Gallery Button - Left */}
          <Pressable
            onPress={onGallery}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
            className="absolute left-8 w-12 h-12 rounded-xl bg-black/40 items-center justify-center backdrop-blur-sm"
          >
            <Feather name="image" size={24} color="white" />
          </Pressable>

          {/* Capture Button - Center */}
          <Pressable
            onPress={onCapture}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
            className="w-20 h-20 rounded-full border-4 border-white bg-white/20 items-center justify-center"
          >
            <View className="w-16 h-16 rounded-full bg-white shadow-lg shadow-black/20" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
