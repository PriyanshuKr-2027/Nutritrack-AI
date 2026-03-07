import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
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

interface VoiceRecordViewProps {
  onClose: () => void;
  onComplete: (transcript: string) => void;
}

type RecordingState = "idle" | "recording" | "processing" | "complete";

// A custom Waveform component to replicate the Framer Motion height animation
const WaveformBar = ({ index }: { index: number }) => {
  const heightProgress = useSharedValue(20);

  useEffect(() => {
    heightProgress.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(100, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(40, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(80, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(30, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite repeat
        true // reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${heightProgress.value}%`,
  }));

  return (
    <Animated.View
      className="w-1.5 bg-green-500 rounded-full"
      style={animatedStyle}
    />
  );
};

// Processing circle spinner
const ProcessingSpinner = () => {
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
    <Animated.View
      style={[styles.spinner, animatedStyle]}
      className="w-16 h-16 rounded-full mx-auto mb-6"
    />
  );
};

export function VoiceRecordView({ onClose, onComplete }: VoiceRecordViewProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const insets = useSafeAreaInsets();

  // Pulse animation for "Listening..." text
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (state === "recording") {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [state]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Timer for recording duration
  useEffect(() => {
    if (state === "recording") {
      const interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleStartRecording = () => {
    setState("recording");
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setState("processing");

    // Simulate transcription processing
    setTimeout(() => {
      const mockTranscript =
        "I had 2 samosas and 1 plate of chowmein for lunch";
      setTranscript(mockTranscript);
      setState("complete");
    }, 1500);
  };

  const handleRetry = () => {
    setState("idle");
    setTranscript("");
    setRecordingTime(0);
  };

  const handleConfirm = () => {
    onComplete(transcript);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={StyleSheet.absoluteFillObject} className="z-[180] bg-black">
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
      <View className="flex-1 items-center justify-center w-full px-8 pb-12">
        {/* Idle State */}
        {state === "idle" && (
          <Animated.View
            key="idle"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute"
          >
            <View className="mb-8 items-center">
              <Text className="text-2xl font-bold text-white mb-2">
                Voice Log
              </Text>
              <Text className="text-zinc-400">
                Tap the mic to describe your meal
              </Text>
            </View>

            <Pressable
              onPress={handleStartRecording}
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                  elevation: 10,
                },
              ]}
              className="w-24 h-24 rounded-full bg-green-500 items-center justify-center"
            >
              <Feather name="mic" size={40} color="black" />
            </Pressable>

            <Text className="text-xs text-zinc-600 mt-8 max-w-[200px] text-center">
              Example: "I had 2 samosas and a cup of tea"
            </Text>
          </Animated.View>
        )}

        {/* Recording State */}
        {state === "recording" && (
          <Animated.View
            key="recording"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute"
          >
            {/* Waveform Animation */}
            <View className="mb-8 flex-row items-center justify-center gap-2 h-32">
              {[...Array(12)].map((_, i) => (
                <WaveformBar key={i} index={i} />
              ))}
            </View>

            <View className="mb-8 items-center">
              <Text className="text-4xl font-bold tabular-nums text-green-400 mb-2">
                {formatTime(recordingTime)}
              </Text>
              <Animated.Text style={animatedPulseStyle} className="text-zinc-400">
                Listening...
              </Animated.Text>
            </View>

            <Pressable
              onPress={handleStopRecording}
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  shadowColor: "#ef4444",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                  elevation: 10,
                },
              ]}
              className="w-20 h-20 rounded-full bg-red-500 items-center justify-center"
            >
              <Feather name="square" size={24} color="white" fill="white" />
            </Pressable>
          </Animated.View>
        )}

        {/* Processing State */}
        {state === "processing" && (
          <Animated.View
            key="processing"
            layout={Layout.springify().damping(20).stiffness(200)}
            entering={FadeIn.springify().damping(20).stiffness(200)}
            exiting={FadeOut.duration(200)}
            className="items-center absolute"
          >
            <ProcessingSpinner />
            <Text className="text-xl font-semibold text-white mb-2">
              Processing...
            </Text>
            <Text className="text-sm text-zinc-500">
              Converting speech to text
            </Text>
          </Animated.View>
        )}

        {/* Complete State */}
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
              <Text className="text-xl font-bold text-white mb-2">
                Recording Complete
              </Text>
              <Text className="text-sm text-zinc-500">
                Review your transcript below
              </Text>
            </View>

            {/* Transcript Display */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6 w-full">
              <Text className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-3">
                Transcript
              </Text>
              <Text className="text-base leading-relaxed text-white">
                "{transcript}"
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 w-full">
              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                className="flex-1 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl items-center justify-center flex-row gap-2"
              >
                <Feather name="rotate-ccw" size={18} color="white" />
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
              
              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                className="flex-[2] py-4 bg-green-500 rounded-2xl items-center justify-center"
              >
                <Text className="text-black font-semibold">Continue</Text>
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
    borderColor: "#27272a", // zinc-800
    borderTopColor: "#22c55e", // green-500
  },
});
