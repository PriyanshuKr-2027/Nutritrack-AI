// components/SkeletonLoaders.tsx
// Lightweight skeleton loading placeholders.
// Uses Reanimated for the shimmer sweep — no external packages needed.

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

// ─── Shimmer wrapper ──────────────────────────────────────────────────────────

function Shimmer({ children, style }: { children?: React.ReactNode; style?: object }) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 300 }],
  }));

  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#27272a" }, style]}>
      {children}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          shimmerStyle,
          {
            backgroundColor: "rgba(255,255,255,0.05)",
            width: "60%",
          },
        ]}
      />
    </View>
  );
}

// ─── DashboardStatSkeleton ────────────────────────────────────────────────────

export function DashboardStatSkeleton() {
  return (
    <View
      style={{
        backgroundColor: "#18181b",
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: "#27272a",
        marginBottom: 16,
      }}
    >
      {/* Circular ring placeholder */}
      <Shimmer style={{ width: 140, height: 140, borderRadius: 70, alignSelf: "center", marginBottom: 16 }} />
      <Shimmer style={{ height: 14, width: 160, borderRadius: 8, alignSelf: "center", marginBottom: 8 }} />

      {/* Macro bars */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Shimmer style={{ height: 12, width: 60, borderRadius: 6 }} />
            <Shimmer style={{ height: 12, width: 50, borderRadius: 6 }} />
          </View>
          <Shimmer style={{ height: 8, width: "100%", borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

// ─── MealCardSkeleton ─────────────────────────────────────────────────────────

export function MealCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: "#18181b",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#27272a",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <Shimmer style={{ width: 48, height: 48, borderRadius: 12 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <Shimmer style={{ height: 14, width: "55%", borderRadius: 6 }} />
        <Shimmer style={{ height: 11, width: "35%", borderRadius: 6 }} />
      </View>
      <Shimmer style={{ height: 14, width: 50, borderRadius: 6 }} />
    </View>
  );
}

// ─── HistoryDaySkeleton ───────────────────────────────────────────────────────

export function HistoryDaySkeleton() {
  return (
    <View
      style={{
        backgroundColor: "#18181b",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: "#27272a",
        marginBottom: 12,
      }}
    >
      {/* Day header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View style={{ gap: 6 }}>
          <Shimmer style={{ height: 14, width: 72, borderRadius: 6 }} />
          <Shimmer style={{ height: 11, width: 100, borderRadius: 6 }} />
        </View>
        <Shimmer style={{ width: 40, height: 40, borderRadius: 20 }} />
      </View>

      {/* Meal rows */}
      {[1, 2].map((i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Shimmer style={{ width: 44, height: 44, borderRadius: 10 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer style={{ height: 13, width: "50%", borderRadius: 6 }} />
            <Shimmer style={{ height: 10, width: "30%", borderRadius: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── SearchRowSkeleton ────────────────────────────────────────────────────────

export function SearchRowSkeleton() {
  return (
    <View
      style={{
        backgroundColor: "#18181b",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#27272a",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <Shimmer style={{ width: 44, height: 44, borderRadius: 10 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <Shimmer style={{ height: 14, width: "50%", borderRadius: 6 }} />
        <Shimmer style={{ height: 11, width: "30%", borderRadius: 6 }} />
      </View>
    </View>
  );
}

// ─── SearchResultsSkeleton (list of rows) ─────────────────────────────────────

export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SearchRowSkeleton key={i} />
      ))}
    </>
  );
}
