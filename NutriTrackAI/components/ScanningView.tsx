import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageWithFallback } from './ImageWithFallback';
import { detectFoodFromPhoto, PhotoDetectResult } from '../lib/foodDetect';
import { buildFoodItemFromDetected, FoodItem } from '../lib/nutritionLookup';
import { ErrorModal, ErrorModalType } from './ErrorModal';

// ─────────────────────────────────────────────────────────────────────────────

interface ScanningViewProps {
  onClose: () => void;
  /** Called with enriched FoodItem[] on success. */
  onComplete: (foods: FoodItem[], mealType: string) => void;
  /** Called after 10s timeout — navigate to SearchFood. */
  onTimeout?: () => void;
  /** Called when Edge Function returns tier:'manual'. */
  onManualFallback?: (reason: string) => void;
  capturedImage: string;  // required now — passed from CameraView
}

// ─── Spinning loader icon ─────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────

export function ScanningView({
  onClose,
  onComplete,
  onTimeout,
  onManualFallback,
  capturedImage,
}: ScanningViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorModalType, setErrorModalType] = useState<ErrorModalType | null>(null);
  const insets = useSafeAreaInsets();
  const doneRef = useRef(false); // prevent double-fire

  const steps = [
    { label: 'Photo validated', key: 'validate' },
    { label: 'Identifying foods...', key: 'identify' },
    { label: 'Fetching nutrition...', key: 'nutrition' },
  ];

  // ── Run detection (single async call, drives step display) ──────────────────
  const runDetection = useCallback(async () => {
    if (doneRef.current) return;

    // Step 0: immediately validated (we got this far, so file exists)
    setCurrentStep(0);
    await new Promise(r => setTimeout(r, 600));
    if (doneRef.current) return;

    // Step 1: calling vision
    setCurrentStep(1);

    let result: Awaited<ReturnType<typeof detectFoodFromPhoto>>;
    try {
      result = await detectFoodFromPhoto(capturedImage);
    } catch (err: any) {
      if (doneRef.current) return;
      doneRef.current = true;
      const isNetworkErr =
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('fetch') ||
        err?.message?.toLowerCase().includes('internet');
      setErrorMsg(err?.message ?? 'Detection failed');
      setErrorModalType(isNetworkErr ? 'network' : 'scanning');
      return;
    }

    if (doneRef.current) return;

    if (result.tier === 'manual') {
      doneRef.current = true;
      const msg =
        result.reason === 'daily_limit_reached'
          ? 'Daily API limit reached'
          : result.reason === 'no_foods_detected'
          ? 'No food detected in photo'
          : 'Detection failed';
      setErrorMsg(msg);
      setErrorModalType('scanning');
      setTimeout(() => onManualFallback?.(result.reason), 1800);
      return;
    }

    // Step 2: nutrition (already embedded in result, but show the step briefly)
    setCurrentStep(2);
    await new Promise(r => setTimeout(r, 800));
    if (doneRef.current) return;

    // Build FoodItem[] from enriched Edge Function response
    const foodItems: FoodItem[] = (result as PhotoDetectResult).foods.map(
      (f, i) => buildFoodItemFromDetected(f, i),
    );

    doneRef.current = true;
    onComplete(foodItems, (result as PhotoDetectResult).meal_type || 'snack');
  }, [capturedImage, onComplete, onManualFallback]);

  useEffect(() => {
    runDetection();
  }, [runDetection]);

  // ── 10-second hard timeout ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setTimedOut(true);
      setTimeout(() => onTimeout?.(), 2000);
    }, 10000);
    return () => clearTimeout(timer);
  }, [onTimeout]);

  // ── Animations ───────────────────────────────────────────────────────────────
  const pulseScale = useSharedValue(1);
  const sweepY = useSharedValue(-100);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    sweepY.value = withRepeat(
      withTiming(200, { duration: 2000, easing: Easing.linear }),
      -1,
    );
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));
  const sweepStyle = useAnimatedStyle(() => ({ top: `${sweepY.value}%` }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ringRotation.value}deg` }] }));

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={StyleSheet.absoluteFillObject} className="z-[120] bg-black justify-between">
      <ErrorModal
        visible={errorModalType !== null}
        type={errorModalType ?? 'scanning'}
        onClose={() => setErrorModalType(null)}
        onRetry={() => {
          setErrorModalType(null);
          setErrorMsg(null);
          doneRef.current = false;
          runDetection();
        }}
        onManualEntry={onClose}
      />
      {/* Top Bar */}
      <View
        className="w-full p-6 flex-row justify-start z-20"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.9 : 1 }] }]}
          className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
        >
          <Feather name="x" size={20} color="white" />
        </Pressable>
      </View>

      {/* Main Content */}
      <View className="flex-1 items-center justify-center w-full px-8" style={{ marginTop: -80 }}>
        {/* Scanning Container */}
        <View className="relative mb-12 items-center justify-center">
          {/* Outer Glow */}
          <View className="absolute inset-0 rounded-full scale-125 bg-green-500/10" />

          {/* Rotating Ring */}
          <Animated.View
            style={[ringStyle, { position: 'absolute', top: -16, bottom: -16, left: -16, right: -16 }]}
            className="rounded-full border border-green-500/30 border-dashed z-0"
          />

          {/* Pulsing Image Container */}
          <Animated.View
            style={[pulseStyle]}
            className="w-64 h-64 rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-900 z-10"
          >
            <ImageWithFallback
              source={{ uri: capturedImage }}
              className="w-full h-full"
              style={{ resizeMode: 'cover' }}
            />
            {/* Scanning Light Sweep */}
            <Animated.View
              style={[sweepStyle, { position: 'absolute', left: 0, right: 0, height: '50%' }]}
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
              <Text className="text-zinc-400 mb-3 text-center">Taking longer than expected...</Text>
              <Text className="text-white font-bold text-center">Switching to manual entry</Text>
            </Animated.View>
          )}

          {/* Error / Manual fallback */}
          {!timedOut && errorMsg && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 items-center"
            >
              <Feather name="alert-circle" size={24} color="#f59e0b" style={{ marginBottom: 8 }} />
              <Text className="text-zinc-400 text-center">{errorMsg}</Text>
              <Text className="text-white font-bold text-center mt-2">Switching to manual entry</Text>
            </Animated.View>
          )}

          {/* Step Indicators */}
          {!timedOut && !errorMsg && (
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              {steps.map((step, index) => {
                const isComplete = index < currentStep;
                const isActive = index === currentStep;
                return (
                  <Animated.View
                    key={step.key}
                    entering={FadeInLeft.delay(index * 200)}
                    className="flex-row items-center gap-3 mb-4 last:mb-0"
                  >
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isComplete
                          ? 'bg-green-500'
                          : isActive
                          ? 'bg-zinc-800 border-2 border-green-500'
                          : 'bg-zinc-800 border-2 border-zinc-700'
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
                    <Text
                      className={`text-sm font-medium ${
                        isComplete ? 'text-white' : isActive ? 'text-green-400' : 'text-zinc-500'
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
      <View className="w-full px-6 z-20" style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="w-full py-4 items-center"
        >
          <Text className="text-zinc-400 font-medium">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
