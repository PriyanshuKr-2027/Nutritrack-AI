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
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

interface SignUpViewProps {
  onLogin: () => void;
  onBack: () => void;
}

export function SignUpView({
  onLogin,
  onBack,
}: SignUpViewProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleInfo, setGoogleInfo] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });
    setIsLoading(false);

    if (authError) {
      setError(authError.message);
    }
    // On success: profile trigger fires, session created,
    // useSession() in App.tsx routes to Onboarding automatically
  };

  const handleGoogleSignIn = () => {
    setGoogleInfo(true);
    setTimeout(() => setGoogleInfo(false), 3000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black w-full relative"
    >
      {/* Decorative Background gradient overlay equivalent */}
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
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
              >
                <Feather name="arrow-left" size={20} color="#a1a1aa" />
              </Pressable>
              <Text className="text-2xl font-bold text-white">Sign up</Text>
            </View>

            {/* Social Buttons */}
            <View className="mb-6">
              <Text className="text-sm text-zinc-400 mb-3 text-center">
                Or continue with
              </Text>
              <Pressable
                onPress={handleGoogleSignIn}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 0.5 },
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                className="w-full flex-row items-center justify-center gap-2 py-3 px-4 bg-zinc-800 border border-zinc-700 rounded-xl"
              >
                <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                  <Text className="text-black font-bold text-xs">G</Text>
                </View>
                <Text className="text-sm font-medium text-zinc-400">Google</Text>
              </Pressable>
              {googleInfo && (
                <Animated.Text
                  entering={FadeInDown.duration(200)}
                  exiting={FadeOutUp.duration(200)}
                  className="text-zinc-500 text-xs text-center mt-2"
                >
                  Google Sign-In coming soon
                </Animated.Text>
              )}
            </View>

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
            <View className="flex-col gap-4">
              {/* Name */}
              <View>
                <Text className="text-sm font-medium text-zinc-300 mb-1.5 flex-row">
                  Name<Text className="text-green-500">*</Text>
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Tayyab Sajjad"
                    placeholderTextColor="#52525b"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500"
                  />
                  {name.length > 0 && (
                    <View className="absolute right-3">
                      <Feather name="check" size={16} color="#22c55e" />
                    </View>
                  )}
                </View>
              </View>

              {/* Email */}
              <View>
                <Text className="text-sm font-medium text-zinc-300 mb-1.5 flex-row">
                  Email<Text className="text-green-500">*</Text>
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#52525b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500"
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text className="text-sm font-medium text-zinc-300 mb-1.5 flex-row">
                  Password<Text className="text-green-500">*</Text>
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!showPassword}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-white focus:border-green-500"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={10}
                    className="absolute right-3 p-1"
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color="#71717a"
                    />
                  </Pressable>
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
                className="w-full bg-green-500 py-3.5 rounded-xl items-center shadow-lg shadow-green-900/40 mt-6"
              >
                <Text className="text-black font-semibold text-base">
                  {isLoading ? "Creating Account..." : "Sign up"}
                </Text>
              </Pressable>

              {/* Login Link */}
              <View className="flex-row items-center justify-center gap-1 mt-4">
                <Text className="text-sm text-zinc-400">
                  Already have an account?
                </Text>
                <Pressable onPress={onLogin}>
                  <Text className="text-sm text-green-500 font-semibold">
                    Log in
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
