import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageWithFallback } from "./ImageWithFallback";

// Mock image to replace Figma import
const exampleImage = 
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kX2Jvd2x8ZW58MHx8fHwxNzcwMTU4NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface ScanningViewProps {
  onClose: () => void;
  onComplete: () => void;
  onTimeout?: () => void;
  capturedImage?: string;
}

const SpinningLoader = ({ color }: { color: string }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather name="loader" size={14} color={color} />
    </Animated.View>
  );
};

export function ScanningView({
  onClose,
  onComplete,
  onTimeout,
  capturedImage,
}: ScanningViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const insets = useSafeAreaInsets();

  const steps = [
    { label: "Photo validated", key: "validate" },
    { label: "Identifying foods...", key: "identify" },
    { label: "Looking up nutrition...", key: "nutrition" },
  ];

  // Step progression
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(stepInterval);
  }, []);

  // Timeout after 10 seconds
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
      if (onTimeout) {
        setTimeout(() => onTimeout(), 2000); // Show message for 2s before fallback
      }
    }, 10000);

    return () => clearTimeout(timeoutTimer);
  }, [onTimeout]);

  // Auto-transition after all steps complete (if no timeout)
  useEffect(() => {
    if (currentStep === steps.length - 1 && !timedOut) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, timedOut, onComplete]);

  // Animations
  const pulseScale = useSharedValue(1);
  const sweepY = useSharedValue(-100);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    sweepY.value = withRepeat(
      withTiming(200, { duration: 2000, easing: Easing.linear }),
      -1
    );

    ringRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    top: `${sweepY.value}%`,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      className="z-[120] bg-black justify-between"
    >
      {/* Top Bar */}
      <View
        className="w-full p-6 flex-row justify-start z-20"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
          className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
        >
          <Feather name="x" size={20} color="white" />
        </Pressable>
      </View>

      {/* Main Content */}
      <View
        className="flex-1 items-center justify-center w-full px-8"
        style={{ marginTop: -80 }}
      >
        {/* Scanning Container */}
        <View className="relative mb-12 items-center justify-center">
          {/* Outer Glow (Approximate with shadow in RN) */}
          <View className="absolute inset-0 rounded-full scale-125 bg-green-500/10 shadow-[0_0_60px_rgba(34,197,94,0.3)]" />

          {/* Rotating Ring */}
          <Animated.View
            style={[ringStyle, { position: "absolute", top: -16, bottom: -16, left: -16, right: -16 }]}
            className="rounded-full border border-green-500/30 border-dashed z-0"
          />

          {/* Pulsing Image Container */}
          <Animated.View
            style={[pulseStyle]}
            className="w-64 h-64 rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-900 z-10"
          >
            <ImageWithFallback
              source={{ uri: capturedImage || exampleImage }}
              className="w-full h-full"
              style={{ resizeMode: "cover" }}
            />

            {/* Scanning Light Sweep */}
            <Animated.View
              style={[
                sweepStyle,
                { position: "absolute", left: 0, right: 0, height: "50%" },
              ]}
              className="bg-white/20"
            />
          </Animated.View>
        </View>

        {/* Status Message / Step Indicators */}
        <View className="w-full max-w-sm z-20">
          {/* Timeout Message */}
          {timedOut && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center"
            >
              <Text className="text-zinc-400 mb-3 text-center">
                Taking longer than expected...
              </Text>
              <Text className="text-white font-bold text-center">
                Switching to manual entry
              </Text>
            </Animated.View>
          )}

          {/* Step Indicators */}
          {!timedOut && (
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              {steps.map((step, index) => {
                const isComplete = index < currentStep;
                const isActive = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <Animated.View
                    key={step.key}
                    entering={FadeInLeft.delay(index * 200)}
                    className="flex-row items-center gap-3 mb-4 last:mb-0"
                  >
                    {/* Icon Container */}
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isComplete
                          ? "bg-green-500"
                          : isActive
                          ? "bg-zinc-800 border-2 border-green-500"
                          : "bg-zinc-800 border-2 border-zinc-700"
                      }`}
                    >
                      {isComplete ? (
                        <Feather name="check" size={14} color="black" />
                      ) : isActive ? (
                        <SpinningLoader color="#22c55e" />
                      ) : (
                        <View className="w-2 h-2 rounded-full bg-zinc-600" />
                      )}
                    </View>

                    {/* Label */}
                    <Text
                      className={`text-sm font-medium ${
                        isComplete
                          ? "text-white"
                          : isActive
                          ? "text-green-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {step.label}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Cancel Button */}
      <View
        className="w-full px-6 z-20"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            { opacity: pressed ? 0.7 : 1 },
          ]}
          className="w-full py-4 items-center"
        >
          <Text className="text-zinc-400 font-medium">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
