import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  ZoomIn,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

interface ForgotPasswordViewProps {
  onBack: () => void;
}

export function ForgotPasswordView({
  onBack,
}: ForgotPasswordViewProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim()
    );
    setIsLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setIsSubmitted(true);
  };

  // Decorative Background Fragment
  const BackgroundDecorative = () => (
    <>
      <View
        className="absolute inset-x-0 top-0 h-64 opacity-20"
        style={{
          borderBottomLeftRadius: 100,
          borderBottomRightRadius: 100,
          backgroundColor: "#22c55e",
        }}
      />
      <View
        className="absolute inset-x-0 bottom-0 h-64 opacity-20"
        style={{
          borderTopLeftRadius: 100,
          borderTopRightRadius: 100,
          backgroundColor: "#22c55e",
        }}
      />
    </>
  );

  if (isSubmitted) {
    return (
      <View className="flex-1 bg-black w-full relative justify-center px-6">
        <BackgroundDecorative />

        <Animated.View
          entering={ZoomIn.duration(500).springify().damping(20).stiffness(200)}
          className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-6 shadow-xl shadow-green-900 self-center z-10"
        >
          <Feather name="check" size={36} color="black" style={{ fontWeight: "900" }} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
          className="items-center bg-zinc-900 rounded-3xl p-8 max-w-sm w-full self-center border border-zinc-800 shadow-xl shadow-black z-10"
        >
          <Text className="text-2xl font-bold text-white mb-2 text-center">
            Check Your Email
          </Text>
          <Text className="text-zinc-400 text-sm mb-1 text-center">
            Reset link sent to
          </Text>
          <Text className="text-white font-semibold mb-6 text-center">
            {email}
          </Text>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-green-500 text-sm font-semibold">
              Back to Log in
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full relative"
    >
      <BackgroundDecorative />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 32),
          paddingBottom: Math.max(insets.bottom, 32),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="w-full max-w-sm self-center"
        >
          {/* Card */}
          <View className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xl shadow-black">
            {/* Header */}
            <View className="flex-row items-center gap-3 mb-6">
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
              >
                <Feather name="arrow-left" size={20} color="#a1a1aa" />
              </Pressable>
              <Text className="text-2xl font-bold text-white">
                Reset Password
              </Text>
            </View>

            <Text className="text-sm text-zinc-400 mb-6">
              Enter your email to receive a reset link
            </Text>

            {/* Error */}
            {error ? (
              <Animated.View
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(200)}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4"
              >
                <Text className="text-red-400 text-xs text-center">{error}</Text>
              </Animated.View>
            ) : null}

            {/* Form */}
            <View className="flex-col gap-6">
              {/* Email */}
              <View>
                <Text className="text-sm font-medium text-zinc-300 mb-1.5 flex-row">
                  Email<Text className="text-green-500">*</Text>
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="joe.doe@email.com"
                    placeholderTextColor="#52525b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500"
                  />
                  {email.length > 0 && (
                    <View className="absolute right-3">
                      <Feather name="check" size={16} color="#22c55e" />
                    </View>
                  )}
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  { opacity: pressed || isLoading ? 0.7 : 1 },
                  { transform: [{ scale: pressed && !isLoading ? 0.98 : 1 }] },
                ]}
                className="w-full bg-green-500 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-green-900/40"
              >
                {isLoading ? (
                  <Text className="text-black font-semibold text-base">
                    Sending...
                  </Text>
                ) : (
                  <>
                    <Feather name="send" size={18} color="black" />
                    <Text className="text-black font-semibold text-base">
                      Send Reset Link
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
