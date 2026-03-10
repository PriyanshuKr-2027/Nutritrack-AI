// components/VoiceRecordView.tsx
// Real voice recording flow: idle → recording (expo-av) → processing (Whisper) → complete
// onComplete receives the full FoodItem[] + transcript + meal_type for MultiItemConfirmView.

import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { startRecording, RecorderHandle } from "../lib/voiceRecorder";
import { detectFoodFromVoice } from "../lib/foodDetect";
import { ErrorModal } from "./ErrorModal";
import type { FoodItem } from "../lib/nutritionLookup";

// ─── Props ────────────────────────────────────────────────────────────────────

interface VoiceRecordViewProps {
  onClose: () => void;
  /** Called after user taps "Continue" on the complete screen. */
  onComplete: (foods: FoodItem[], mealType: string, transcript: string) => void;
}

type RecordingState = "idle" | "recording" | "processing" | "complete" | "error";

// ─── Sub-components ───────────────────────────────────────────────────────────

const WaveformBar = ({ index }: { index: number }) => {
  const heightProgress = useSharedValue(20);
  useEffect(() => {
    heightProgress.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(100, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(40,  { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(80,  { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(30,  { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ height: `${heightProgress.value}%` as any }));
  return <Animated.View className="w-1.5 bg-green-500 rounded-full" style={animStyle} />;
};

const ProcessingSpinner = () => {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return <Animated.View style={[styles.spinner, animStyle]} className="w-16 h-16 rounded-full mx-auto mb-6" />;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function VoiceRecordView({ onClose, onComplete }: VoiceRecordViewProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [detectedFoods, setDetectedFoods] = useState<FoodItem[]>([]);
  const [detectedMealType, setDetectedMealType] = useState("snack");
  const [errorMsg, setErrorMsg] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const recorderRef = useRef<RecorderHandle | null>(null);
  const insets = useSafeAreaInsets();

  // ── Pulse animation while recording ──────────────────────────────────────
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (state === "recording") {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [state]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  // ── Recording timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== "recording") return;
    const id = setInterval(() => setRecordingTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  // ── Cleanup recorder on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => { recorderRef.current?.cancel().catch(() => {}); };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /** Called by manual stop OR by auto-stop timer — runs the detection pipeline. */
  const processAudio = async (uri: string) => {
    setState("processing");
    try {
      const result = await detectFoodFromVoice(uri);
      setTranscript(result.transcript);
      setDetectedFoods(result.items);
      setDetectedMealType(result.meal_type);
      setState("complete");
    } catch (err: any) {
      console.error("[VoiceRecordView] Detection error:", err);
      setErrorMsg(err?.message ?? "Could not process audio. Please try again.");
      setState("error");
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartRecording = async () => {
    setRecordingTime(0);
    setTranscript("");
    setDetectedFoods([]);
    setErrorMsg("");
    try {
      const handle = await startRecording((uri) => {
        // Auto-stop fired after 15 s
        recorderRef.current = null;
        processAudio(uri);
      });
      recorderRef.current = handle;
      setState("recording");
    } catch (err: any) {
      setShowPermissionModal(true);
    }
  };

  const handleStopRecording = async () => {
    const handle = recorderRef.current;
    if (!handle) return;
    recorderRef.current = null;
    const uri = await handle.stop();
    if (uri) {
      processAudio(uri);
    } else {
      setState("idle");
    }
  };

  const handleRetry = () => {
    setState("idle");
    setTranscript("");
    setDetectedFoods([]);
    setRecordingTime(0);
    setErrorMsg("");
  };

  const handleConfirm = () => {
    onComplete(detectedFoods, detectedMealType, transcript);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={StyleSheet.absoluteFillObject} className="z-[180] bg-black">
      <ErrorModal
        visible={showPermissionModal}
        type="camera"
        onClose={() => setShowPermissionModal(false)}
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
      <View className="flex-1 items-center justify-center w-full px-8 pb-12">

        {/* ── Idle ─────────────────────────────────────────────────────────── */}
        {state === "idle" && (
          <Animated.View
            key="idle"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute"
          >
            <View className="mb-8 items-center">
              <Text className="text-2xl font-bold text-white mb-2">Voice Log</Text>
              <Text className="text-zinc-400">Tap the mic to describe your meal</Text>
            </View>

            <Pressable
              onPress={handleStartRecording}
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.95 : 1 }],
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 10,
              }]}
              className="w-24 h-24 rounded-full bg-green-500 items-center justify-center"
            >
              <Feather name="mic" size={40} color="black" />
            </Pressable>

            <Text className="text-xs text-zinc-600 mt-8 max-w-[220px] text-center">
              Try: "dal chawal khaya" or "aaj 2 roti aur sabzi thi"
            </Text>
          </Animated.View>
        )}

        {/* ── Recording ─────────────────────────────────────────────────────── */}
        {state === "recording" && (
          <Animated.View
            key="recording"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute"
          >
            <View className="mb-8 flex-row items-center justify-center gap-2 h-32">
              {[...Array(12)].map((_, i) => <WaveformBar key={i} index={i} />)}
            </View>

            <View className="mb-8 items-center">
              <Text className="text-4xl font-bold tabular-nums text-green-400 mb-2">
                {formatTime(recordingTime)}
              </Text>
              <Animated.Text style={pulseStyle} className="text-zinc-400">
                Listening...
              </Animated.Text>
              <Text className="text-zinc-600 text-xs mt-1">Auto-stops at 0:15</Text>
            </View>

            <Pressable
              onPress={handleStopRecording}
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.95 : 1 }],
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 15,
                elevation: 10,
              }]}
              className="w-20 h-20 rounded-full bg-red-500 items-center justify-center"
            >
              <Feather name="square" size={24} color="white" />
            </Pressable>
          </Animated.View>
        )}

        {/* ── Processing ────────────────────────────────────────────────────── */}
        {state === "processing" && (
          <Animated.View
            key="processing"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute"
          >
            <ProcessingSpinner />
            <Text className="text-xl font-semibold text-white mb-2">Processing...</Text>
            <Text className="text-sm text-zinc-500">Transcribing via Whisper</Text>
            <Text className="text-xs text-zinc-600 mt-1">Looking up nutrition data</Text>
          </Animated.View>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {state === "error" && (
          <Animated.View
            key="error"
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute px-8 w-full max-w-md"
          >
            <View className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 items-center justify-center mb-4">
              <Feather name="alert-circle" size={28} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-white mb-2">Detection Failed</Text>
            <Text className="text-zinc-400 text-sm text-center mb-8">{errorMsg}</Text>
            <Pressable
              onPress={handleRetry}
              className="w-full py-4 bg-zinc-800 rounded-2xl items-center"
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Complete ──────────────────────────────────────────────────────── */}
        {state === "complete" && (
          <Animated.View
            key="complete"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={SlideInDown.springify().damping(20).stiffness(200)}
            exiting={SlideOutDown.duration(200)}
            className="w-full max-w-md absolute px-8"
          >
            <View className="mb-6 items-center">
              <View className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 items-center justify-center mb-4">
                <Feather name="mic" size={28} color="#22c55e" />
              </View>
              <Text className="text-xl font-bold text-white mb-1">Got it!</Text>
              <Text className="text-sm text-zinc-500">
                Found {detectedFoods.length} item{detectedFoods.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Transcript */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4">
              <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                Transcript
              </Text>
              <Text className="text-base leading-relaxed text-white">
                "{transcript}"
              </Text>
            </View>

            {/* Detected foods preview */}
            {detectedFoods.length > 0 && (
              <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">
                <Text className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
                  Detected Foods
                </Text>
                {detectedFoods.map((f, i) => (
                  <View key={f.id} className={`flex-row justify-between items-center ${i < detectedFoods.length - 1 ? "mb-2" : ""}`}>
                    <Text className="text-white text-sm flex-1" numberOfLines={1}>{f.name}</Text>
                    <Text className="text-green-400 text-sm font-bold ml-2">{f.calories} kcal</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-3 w-full">
              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                className="flex-1 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl items-center justify-center flex-row gap-2"
              >
                <Feather name="rotate-ccw" size={18} color="white" />
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                className="flex-[2] py-4 bg-green-500 rounded-2xl items-center justify-center"
              >
                <Text className="text-black font-bold">Continue</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spinner: {
    borderWidth: 4,
    borderColor: "#27272a",
    borderTopColor: "#22c55e",
  },
});
