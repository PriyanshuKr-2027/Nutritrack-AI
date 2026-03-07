import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ImageWithFallback } from "./ImageWithFallback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Replace figma import with a placeholder URI or require
const cameraPreview = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kX2Jvd2x8ZW58MHx8fHwxNzcwMTU4NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface CameraViewProps {
  onClose: () => void;
  onCapture: () => void;
}

export function CameraView({ onClose, onCapture }: CameraViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black w-full relative overflow-hidden">
      {/* Camera Preview (Simulated) */}
      <ImageWithFallback
        source={{ uri: cameraPreview }}
        style={[StyleSheet.absoluteFillObject, { resizeMode: "cover" }]}
      />

      {/* Top Controls */}
      <View
        className="absolute top-0 left-0 right-0 p-6 z-10"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
        >
          <Feather name="x" size={24} color="white" />
        </Pressable>
      </View>

      {/* Bottom Controls */}
      <View
        className="absolute bottom-0 left-0 right-0 p-8 z-10 flex-row items-center justify-between"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        {/* Gallery Button */}
        <Pressable
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-12 h-12 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
        >
          <Feather name="image" size={24} color="white" />
        </Pressable>

        {/* Capture Button */}
        <Pressable
          onPress={onCapture}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
          className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
        >
          <View className="w-16 h-16 rounded-full bg-white" />
        </Pressable>

        {/* Flash Toggle */}
        <Pressable
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-12 h-12 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
        >
          <Feather name="zap" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
