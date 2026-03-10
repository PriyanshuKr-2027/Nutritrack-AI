// components/ErrorModal.tsx
// Full-screen modal for blocking errors: camera, network, scanning, generic.

import React from "react";
import { View, Text, Pressable, Modal, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

export type ErrorModalType = "camera" | "network" | "scanning" | "generic";

interface ErrorModalProps {
  visible: boolean;
  type: ErrorModalType;
  onClose: () => void;
  onRetry?: () => void;
  onManualEntry?: () => void;
}

const CONFIG: Record<
  ErrorModalType,
  {
    icon: keyof typeof Feather.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  }
> = {
  camera: {
    icon: "camera-off",
    iconColor: "#ef4444",
    title: "Camera Access Needed",
    description:
      "NutriTrack needs camera permission to scan your meals. Please enable camera access in your device settings.",
    primaryLabel: "Open Settings",
    secondaryLabel: "Enter Manually",
  },
  network: {
    icon: "wifi-off",
    iconColor: "#f97316",
    title: "Connection Error",
    description:
      "We're having trouble connecting to the internet. Please check your connection and try again.",
    primaryLabel: "Retry",
    secondaryLabel: "Dismiss",
  },
  scanning: {
    icon: "alert-circle",
    iconColor: "#f59e0b",
    title: "Scanning Failed",
    description:
      "We couldn't identify the food in your photo. You can try taking another photo or enter the details manually.",
    primaryLabel: "Try Again",
    secondaryLabel: "Enter Manually",
  },
  generic: {
    icon: "x-circle",
    iconColor: "#ef4444",
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    primaryLabel: "Try Again",
    secondaryLabel: "Dismiss",
  },
};

export function ErrorModal({
  visible,
  type,
  onClose,
  onRetry,
  onManualEntry,
}: ErrorModalProps) {
  const cfg = CONFIG[type];

  const handlePrimary = () => {
    if (type === "camera") {
      Linking.openSettings();
    } else {
      onRetry?.();
      onClose();
    }
  };

  const handleSecondary = () => {
    if (type === "camera" || type === "scanning") {
      onManualEntry?.();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Pressable
          style={{ position: "absolute", inset: 0 } as any}
          onPress={onClose}
        />

        <Animated.View
          entering={ZoomIn.springify().damping(22).stiffness(300)}
          exiting={ZoomOut.duration(150)}
          style={{
            backgroundColor: "#18181b",
            borderRadius: 28,
            padding: 28,
            width: "100%",
            maxWidth: 360,
            borderWidth: 1,
            borderColor: "#27272a",
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: `${cfg.iconColor}18`,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 20,
            }}
          >
            <Feather name={cfg.icon} size={32} color={cfg.iconColor} />
          </View>

          {/* Text */}
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {cfg.title}
          </Text>
          <Text
            style={{
              color: "#a1a1aa",
              fontSize: 14,
              lineHeight: 22,
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            {cfg.description}
          </Text>

          {/* Actions */}
          <Pressable
            onPress={handlePrimary}
            style={({ pressed }) => [
              {
                backgroundColor: "#22c55e",
                borderRadius: 100,
                paddingVertical: 16,
                alignItems: "center",
                marginBottom: 12,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
              {cfg.primaryLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSecondary}
            style={({ pressed }) => [
              {
                backgroundColor: "#27272a",
                borderRadius: 100,
                paddingVertical: 16,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={{ color: "#e4e4e7", fontWeight: "600", fontSize: 16 }}>
              {cfg.secondaryLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
