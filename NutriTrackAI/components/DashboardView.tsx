import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { CircularProgress } from "./CircularProgress";
import { MealItem } from "./MealItem";
import { StreakScreen } from "./StreakScreen";

interface DashboardViewProps {
  onOpenCam?: () => void;
  onOpenSearch?: () => void;
  onOpenScanLabel?: () => void;
  onOpenDayDetail?: () => void;
  onOpenVoice?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DashboardView({
  onOpenCam,
  onOpenSearch,
  onOpenScanLabel,
  onOpenDayDetail,
  onOpenVoice,
}: DashboardViewProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showStreakScreen, setShowStreakScreen] = useState(false);

  // FAB Animation state
  const fabRotation = useSharedValue(0);

  const toggleFab = () => {
    setIsFabOpen(!isFabOpen);
    fabRotation.value = withSpring(isFabOpen ? 0 : 135, {
      stiffness: 200,
      damping: 20,
    });
  };

  const fabIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${fabRotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-white tracking-wide">
            NutriTrack
          </Text>
          <Pressable
            onPress={() => setShowStreakScreen(true)}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
            className="flex-row items-center gap-1.5 bg-[#2a1705] border border-orange-900/30 px-3 py-1.5 rounded-full"
          >
            <Feather name="activity" size={16} color="#f97316" />
            <Text className="text-orange-400 text-sm font-bold">3d</Text>
          </Pressable>
        </View>

        <View className="px-6 flex-1">
          {/* Calorie Card */}
          <View className="bg-zinc-900 rounded-[32px] p-8 items-center justify-center relative border border-zinc-800/50 overflow-hidden mb-6">
            {/* Custom Gradient Glow - Approximated with View since blur is hard in RN */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(34, 197, 94, 0.05)" },
              ]}
            />

            <CircularProgress value={1250} max={2500} />
            <Text className="mt-4 text-zinc-500 font-medium text-sm">
              of 2,500 kcal goal
            </Text>
          </View>

          {/* Macros Card */}
          <View className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800/50 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-white">Macros</Text>
              <Pressable onPress={onOpenDayDetail}>
                <Text className="text-green-500 text-xs font-bold">
                  View Details
                </Text>
              </Pressable>
            </View>

            <View className="">
              {/* Protein */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-zinc-300 font-medium">Protein</Text>
                  <View className="flex-row">
                    <Text className="text-sm text-white font-bold">80g</Text>
                    <Text className="text-sm text-zinc-600"> / 140g</Text>
                  </View>
                </View>
                <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <View className="h-full bg-cyan-400 w-[57%] rounded-full" />
                </View>
              </View>

              {/* Carbs */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-zinc-300 font-medium">Carbs</Text>
                  <View className="flex-row">
                    <Text className="text-sm text-white font-bold">240g</Text>
                    <Text className="text-sm text-zinc-600"> / 320g</Text>
                  </View>
                </View>
                <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <View className="h-full bg-yellow-400 w-[75%] rounded-full" />
                </View>
              </View>

              {/* Fat */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-zinc-300 font-medium">Fat</Text>
                  <View className="flex-row">
                    <Text className="text-sm text-white font-bold">45g</Text>
                    <Text className="text-sm text-zinc-600"> / 75g</Text>
                  </View>
                </View>
                <View className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <View className="h-full bg-blue-500 w-[60%] rounded-full" />
                </View>
              </View>
            </View>
          </View>

          {/* Meals Section */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-white">Today's Meals</Text>
              <Pressable className="w-8 h-8 rounded-full bg-zinc-900 items-center justify-center">
                <Feather name="more-horizontal" size={18} color="#a1a1aa" />
              </Pressable>
            </View>

            <MealItem
              title="Oatmeal & Berries"
              sub="Breakfast"
              time="8:00 AM"
              cal={350}
              img="https://images.unsplash.com/photo-1605782495071-f81088a16be8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvYXRtZWFsJTIwd2l0aCUyMGJlcnJpZXMlMjBib3dsJTIwZGFyayUyMG1vb2R5fGVufDF8fHx8MTc3MDE0NjYyOXww&ixlib=rb-4.1.0&q=80&w=1080"
            />
            <MealItem
              title="Grilled Chicken Salad"
              sub="Lunch"
              time="12:30 PM"
              cal={550}
              img="https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMHNhbGFkJTIwYm93bCUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc3MDE0NjYzMHww&ixlib=rb-4.1.0&q=80&w=1080"
            />
          </View>
        </View>
      </ScrollView>

      {/* FAB Overlay & Menu */}
      {isFabOpen && (
        <>
          {/* Dim Overlay */}
          <AnimatedPressable
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            onPress={toggleFab}
            style={StyleSheet.absoluteFill}
            className="bg-black/80 z-40 flex-1"
          />

          {/* FAB Options */}
          <View className="absolute bottom-[170px] right-6 z-50 flex-col items-end">
            <FabAction
              label="Manual Add"
              icon="edit-2"
              delay={50}
              onPress={() => {
                onOpenSearch?.();
                setIsFabOpen(false);
              }}
            />
            <FabAction
              label="Scan Label"
              icon="maximize"
              delay={100}
              onPress={() => {
                onOpenScanLabel?.();
                setIsFabOpen(false);
              }}
            />
            <FabAction
              label="Mic"
              icon="mic"
              delay={150}
              onPress={() => {
                onOpenVoice?.();
                setIsFabOpen(false);
              }}
            />
            <FabAction
              label="Camera"
              icon="camera"
              delay={200}
              onPress={() => {
                onOpenCam?.();
                setIsFabOpen(false);
              }}
            />
          </View>
        </>
      )}

      {/* Main FAB */}
      <AnimatedPressable
        onPress={toggleFab}
        className="absolute bottom-[96px] right-6 w-16 h-16 rounded-full items-center justify-center bg-green-500 z-50"
        style={[
          {
            shadowColor: "#064e3b",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Animated.View style={fabIconStyle}>
          <Feather name="plus" size={32} color="black" />
        </Animated.View>
      </AnimatedPressable>

      {/* Streak Screen */}
      <StreakScreen
        isOpen={showStreakScreen}
        onClose={() => setShowStreakScreen(false)}
        currentStreak={3}
        longestStreak={14}
        daysThisWeek={5}
        totalDaysLogged={42}
      />
    </View>
  );
}

// Helper component for FAB actions
function FabAction({
  label,
  icon,
  delay,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  delay: number;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).delay(delay)}
      exiting={SlideOutDown.duration(200)}
      className="flex-row items-center gap-4 mb-5"
    >
      <Text className="text-white font-bold text-base tracking-wide shadow-black shadow-sm">
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { transform: [{ scale: pressed ? 0.9 : 1 }] },
        ]}
        className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
      >
        <Feather name={icon} size={24} color="white" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContent: {
    paddingBottom: 200, // Make room for FAB
  },
});
