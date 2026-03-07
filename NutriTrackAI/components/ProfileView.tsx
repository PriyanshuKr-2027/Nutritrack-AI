import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Switch,
  Dimensions,
} from "react-native";
import {
  User,
  ChevronRight,
  Scale,
  Ruler,
  Target,
  Activity,
  Bell,
  Globe,
  HelpCircle,
  Shield,
  LogOut,
  Edit2,
  X,
  Camera,
  Check,
  Clock,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ProfileViewProps {
  onLogout?: () => void;
}

export function ProfileView({ onLogout }: ProfileViewProps) {
  const insets = useSafeAreaInsets();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const [editName, setEditName] = useState("Priyanshu Kumar");
  const [editEmail, setEditEmail] = useState("Priyanshu@nutritrack.com");

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminders: true,
    mealAlerts: true,
    goalUpdates: false,
    breakfastTime: "08:00",
    lunchTime: "13:00",
    dinnerTime: "19:00",
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "07:00",
  });

  // Units settings
  const [unitsSettings, setUnitsSettings] = useState({
    weightUnit: "Kilograms (kg)",
    heightUnit: "Centimeters (cm)",
    energyUnit: "Kilocalories (kcal)",
    language: "English",
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    privateProfile: false,
    showInLeaderboard: true,
    dataSharing: false,
    biometricLock: false,
  });

  // Mock
  const userData = {
    name: "Priyanshu Kumar",
    email: "Priyanshu@nutritrack.com",
    avatar: null,
    isPremium: true,
    stats: {
      height: "175 cm",
      weight: "72 kg",
      age: "28 years",
      gender: "Male"
    },
    goal: {
      type: "Weight Loss",
      target: "68 kg",
      weekly: "-0.5 kg/week"
    },
    activityLevel: "Moderately Active"
  };

  const handleSaveProfile = () => {
    setShowEditProfile(false);
  };

  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View className="flex-1 bg-black w-full relative">
      {/* Header */}
      <View
        className="px-6 pb-6 items-center"
        style={{ paddingTop: Math.max(insets.top, 32) }}
      >
        <Text className="text-2xl font-bold text-white tracking-tight">Profile</Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pb-24"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="flex-col gap-6">
          {/* Profile Header Card */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            {/* Profile Info */}
            <View className="flex-row items-start gap-4 mb-6">
              {/* Avatar */}
              <View className="relative">
                <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center">
                  <Text className="text-2xl font-bold text-black border border-green-500 bg-green-500 rounded-full overflow-hidden w-full h-full text-center" style={{ lineHeight: 80 }}>
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Pressable
                  className="absolute bottom-[-4px] right-[-4px] w-8 h-8 bg-green-500 rounded-full items-center justify-center border-2 border-black"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <Camera size={14} color="black" />
                </Pressable>
              </View>

              {/* Name & Email */}
              <View className="flex-1 pt-2">
                <Text className="text-xl font-bold text-white mb-1">{userData.name}</Text>
                <Text className="text-sm text-zinc-400">{userData.email}</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <Pressable
              onPress={() => setShowEditProfile(true)}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="w-full bg-zinc-800 border border-zinc-700 py-3 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Edit2 size={16} color="white" />
              <Text className="text-white font-medium">Edit Profile</Text>
            </Pressable>
          </View>

          {/* Body Stats Section */}
          <View>
            <Text className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Body Stats</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                    <Ruler size={18} color="#22c55e" />
                  </View>
                  <Text className="text-xs text-zinc-500 font-medium">Height</Text>
                </View>
                <Text className="text-lg font-bold text-white">{userData.stats.height}</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                    <Scale size={18} color="#22c55e" />
                  </View>
                  <Text className="text-xs text-zinc-500 font-medium">Weight</Text>
                </View>
                <Text className="text-lg font-bold text-white">{userData.stats.weight}</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                    <User size={18} color="#22c55e" />
                  </View>
                  <Text className="text-xs text-zinc-500 font-medium">Age</Text>
                </View>
                <Text className="text-lg font-bold text-white">{userData.stats.age}</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                    <Activity size={18} color="#22c55e" />
                  </View>
                  <Text className="text-xs text-zinc-500 font-medium">Gender</Text>
                </View>
                <Text className="text-lg font-bold text-white">{userData.stats.gender}</Text>
              </View>
            </View>
          </View>

          {/* Goal Section */}
          <View>
            <Text className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Your Goal</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-12 h-12 bg-green-500/10 rounded-full items-center justify-center">
                  <Target size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-white text-base">{userData.goal.type}</Text>
                  <Text className="text-xs text-zinc-500 mt-0.5">{userData.activityLevel}</Text>
                </View>
              </View>
              <View className="border-t border-zinc-800 pt-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-zinc-500 mb-1">Target Weight</Text>
                  <Text className="text-sm font-bold text-white">{userData.goal.target}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-zinc-500 mb-1">Weekly Goal</Text>
                  <Text className="text-sm font-bold text-green-500">{userData.goal.weekly}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Menu Section */}
          <View>
            <Text className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Settings</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <MenuItem icon={Bell} label="Notifications" onClick={() => toggleSection("notifications")} isFirst />
              <MenuItem icon={Globe} label="Units & Language" badge="Metric" onClick={() => toggleSection("units")} />
              <MenuItem icon={Shield} label="Privacy & Security" onClick={() => toggleSection("privacy")} />
              <MenuItem icon={HelpCircle} label="Help & Support" isLast />
            </View>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-full bg-red-500/10 border border-red-500/30 py-4 rounded-2xl flex-row items-center justify-center gap-2 mb-8"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      {showEditProfile && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 z-40 bg-black/60"
        >
          <Pressable className="flex-1" onPress={() => setShowEditProfile(false)} />
          <Animated.View
            entering={SlideInDown.duration(300).springify()}
            exiting={SlideOutDown.duration(300)}
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl"
          >
            <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mb-6 opacity-50" />
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-white">Edit Profile</Text>
              <Pressable 
                onPress={() => setShowEditProfile(false)} 
                className="p-2 bg-zinc-800 rounded-full"
              >
                <X size={20} color="#a1a1aa" />
              </Pressable>
            </View>

            <View className="flex-col gap-4 mb-6">
              <View>
                <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-4 px-4 text-white font-medium"
                />
              </View>
              <View>
                <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Email</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-4 px-4 text-white font-medium"
                />
              </View>
            </View>

            <Pressable 
              onPress={handleSaveProfile}
              className="w-full bg-green-500 py-4 rounded-full flex-row items-center justify-center gap-2"
            >
              <Check size={20} color="black" />
              <Text className="text-black font-bold text-base">Save Changes</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* Settings Bottom Sheet */}
      {expandedSection !== null && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 z-40 bg-black/60"
        >
          <Pressable className="flex-1" onPress={() => setExpandedSection(null)} />
          <Animated.View
            entering={SlideInDown.duration(300).springify()}
            exiting={SlideOutDown.duration(300)}
            style={{ 
              paddingBottom: Math.max(insets.bottom, 24),
              maxHeight: SCREEN_HEIGHT * 0.8 
            }}
            className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl overflow-hidden"
          >
            <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mb-6 opacity-50" />
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-white">Settings</Text>
              <Pressable 
                onPress={() => setExpandedSection(null)} 
                className="p-2 bg-zinc-800 rounded-full"
              >
                <X size={20} color="#a1a1aa" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View className="pb-8">
                {expandedSection === "notifications" && (
                  <View>
                    <Text className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Notifications</Text>
                    <View className="flex-col gap-2">
                      <SettingToggle 
                        label="Daily Reminders" 
                        enabled={notificationSettings.dailyReminders} 
                        onToggle={(v) => setNotificationSettings(s => ({...s, dailyReminders: v}))}
                      />
                      <SettingToggle 
                        label="Meal Logging Alerts" 
                        enabled={notificationSettings.mealAlerts} 
                        onToggle={(v) => setNotificationSettings(s => ({...s, mealAlerts: v}))}
                      />
                      <SettingToggle 
                        label="Goal Progress Updates" 
                        enabled={notificationSettings.goalUpdates} 
                        onToggle={(v) => setNotificationSettings(s => ({...s, goalUpdates: v}))}
                      />
                    </View>
                  </View>
                )}

                {expandedSection === "units" && (
                  <View>
                    <Text className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Units</Text>
                    <View className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                      <SettingOption label="Weight Unit" value={unitsSettings.weightUnit} isFirst />
                      <SettingOption label="Height Unit" value={unitsSettings.heightUnit} />
                      <SettingOption label="Energy Unit" value={unitsSettings.energyUnit} />
                      <SettingOption label="Language" value={unitsSettings.language} isLast />
                    </View>
                  </View>
                )}

                {expandedSection === "privacy" && (
                  <View>
                    <Text className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Privacy & Security</Text>
                    <View className="flex-col gap-2">
                      <SettingToggle 
                        label="Private Profile" 
                        enabled={privacySettings.privateProfile} 
                        onToggle={(v) => setPrivacySettings(s => ({...s, privateProfile: v}))}
                      />
                      <SettingToggle 
                        label="Show in Leaderboard" 
                        enabled={privacySettings.showInLeaderboard} 
                        onToggle={(v) => setPrivacySettings(s => ({...s, showInLeaderboard: v}))}
                      />
                      <SettingToggle 
                        label="Data Sharing" 
                        enabled={privacySettings.dataSharing} 
                        onToggle={(v) => setPrivacySettings(s => ({...s, dataSharing: v}))}
                      />
                      <SettingToggle 
                        label="Biometric Lock" 
                        enabled={privacySettings.biometricLock} 
                        onToggle={(v) => setPrivacySettings(s => ({...s, biometricLock: v}))}
                      />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <Pressable 
              onPress={() => setExpandedSection(null)}
              className="w-full mt-4 bg-green-500 py-4 rounded-full items-center"
            >
              <Text className="text-black font-bold text-base">Done</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

// Sub-components

function MenuItem({ 
  icon: Icon, 
  label, 
  badge, 
  onClick,
  isFirst = false,
  isLast = false
}: { 
  icon: any; 
  label: string; 
  badge?: string; 
  onClick?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable 
      onPress={onClick}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className={`w-full flex-row items-center justify-between p-4 ${
        !isLast ? "border-b border-zinc-800" : ""
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
          <Icon size={18} color="#a1a1aa" />
        </View>
        <Text className="font-medium text-white">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {badge && <Text className="text-xs text-zinc-500 font-medium">{badge}</Text>}
        <ChevronRight size={18} color="#52525b" />
      </View>
    </Pressable>
  );
}

function SettingToggle({ 
  label, 
  enabled,
  onToggle
}: { 
  label: string; 
  enabled: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
      <Text className="text-sm font-medium text-white">{label}</Text>
      <Switch 
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#3f3f46", true: "#22c55e" }}
        thumbColor={"#ffffff"}
      />
    </View>
  );
}

function SettingOption({ 
  label, 
  value,
  isFirst = false,
  isLast = false
}: { 
  label: string; 
  value: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable className={`w-full flex-row items-center justify-between p-4 ${
      !isLast ? "border-b border-zinc-700" : ""
    }`}>
      <Text className="text-sm text-zinc-400">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-medium text-white">{value}</Text>
        <ChevronRight size={16} color="#52525b" />
      </View>
    </Pressable>
  );
}
