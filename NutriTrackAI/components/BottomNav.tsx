import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

type TabOption = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
};

const TABS: TabOption[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "history", icon: "clock", label: "History" },
  { id: "trends", icon: "trending-up", label: "Trends" },
  { id: "profile", icon: "user", label: "Profile" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabOption;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const activeAnim = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeAnim.value = withSpring(isActive ? 1 : 0, {
      stiffness: 300,
      damping: 20,
    });
  }, [isActive, activeAnim]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(activeAnim.value, [0, 1], [1, 1.1]) },
        { translateY: interpolate(activeAnim.value, [0, 1], [0, -2]) },
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(activeAnim.value, [0, 1], [0.7, 1]),
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    return {
      opacity: activeAnim.value,
      transform: [{ scale: interpolate(activeAnim.value, [0, 1], [0.8, 1]) }],
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: activeAnim.value,
      transform: [{ scaleX: interpolate(activeAnim.value, [0, 1], [0.5, 1]) }],
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9))}
      onPressOut={() => (scale.value = withSpring(1))}
      className="flex-col items-center justify-center w-16 h-full space-y-1 relative"
      style={[{ transform: [{ scale }] }]}
    >
      {/* Background pill for active tab */}
      <Animated.View
        className="bg-green-500/10 rounded-2xl"
        style={[StyleSheet.absoluteFillObject, bgStyle]}
      />

      <Animated.View style={[animatedIconStyle, { zIndex: 10 }]}>
        <Feather
          name={tab.icon as any}
          size={24}
          color={isActive ? "#22c55e" : "#52525b"}
        />
      </Animated.View>

      <Animated.Text
        className={`text-[10px] relative z-10 ${
          isActive ? "font-semibold text-green-500" : "font-medium text-zinc-600"
        }`}
        style={animatedTextStyle}
      >
        {tab.label}
      </Animated.Text>

      {/* Bottom indicator */}
      <Animated.View
        className="absolute -bottom-0.5 w-10 h-1 bg-green-500 rounded-full"
        style={indicatorStyle}
      />
    </AnimatedPressable>
  );
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <View className="bg-black border-t border-zinc-900 pb-safe pt-1 px-6 z-30">
      <View className="flex-row justify-between items-center h-16">
        {TABS.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}
