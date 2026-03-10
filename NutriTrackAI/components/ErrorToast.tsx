// components/ErrorToast.tsx
// Non-blocking toast for minor errors (failed save, cache sync, etc.)

import React, { useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ErrorToastRef {
  show: (message: string, onRetry?: () => void, autoDismissMs?: number) => void;
  hide: () => void;
}

interface ToastState {
  message: string;
  onRetry?: () => void;
}

/**
 * Usage:
 *   const toastRef = useRef<ErrorToastRef>(null);
 *   toastRef.current?.show('Failed to save meal', handleRetry);
 *   <ErrorToast ref={toastRef} />
 */
export const ErrorToast = React.forwardRef<ErrorToastRef, {}>((_props, ref) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = React.useCallback(() => {
    translateY.value = withTiming(-100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) runOnJS(setToast)(null);
    });
  }, [translateY, opacity]);

  const show = React.useCallback(
    (message: string, onRetry?: () => void, autoDismissMs = 4000) => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
      setToast({ message, onRetry });
      translateY.value = withSpring(0, { damping: 20, stiffness: 280 });
      opacity.value = withTiming(1, { duration: 200 });
      if (autoDismissMs > 0) {
        autoDismissTimer.current = setTimeout(hide, autoDismissMs);
      }
    },
    [translateY, opacity, hide],
  );

  React.useImperativeHandle(ref, () => ({ show, hide }), [show, hide]);

  useEffect(() => {
    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: "absolute",
          top: Math.max(insets.top + 8, 16),
          left: 16,
          right: 16,
          zIndex: 9999,
        },
      ]}
    >
      <View
        style={{
          backgroundColor: "#1c1c1e",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ef444440",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          gap: 12,
        }}
      >
        <Feather name="alert-circle" size={18} color="#ef4444" />
        <Text
          style={{
            color: "#e4e4e7",
            fontSize: 14,
            flex: 1,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {toast.message}
        </Text>
        {toast.onRetry && (
          <Pressable
            onPress={() => {
              hide();
              toast.onRetry?.();
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: "#22c55e", fontWeight: "700", fontSize: 13 }}>
              Retry
            </Text>
          </Pressable>
        )}
        <Pressable onPress={hide} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 2 }]}>
          <Feather name="x" size={16} color="#71717a" />
        </Pressable>
      </View>
    </Animated.View>
  );
});

ErrorToast.displayName = "ErrorToast";
