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
  ActivityIndicator,
  Alert
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
  ArrowLeft,
  Flame,
  Calendar,
  Zap
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, useSession } from "../lib/supabase";
import { calculatePlan } from "../lib/nutritionCalc";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ProfileViewProps {
  onLogout?: () => void;
  onBack?: () => void;
}

export function ProfileView({ onLogout, onBack }: ProfileViewProps) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activityLevel: "sedentary",
    goal: "maintain",
    targetWeight: "",
    weeks: ""
  });

  // Settings states (mocked visually)
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminders: true, mealAlerts: true, goalUpdates: false
  });
  const [unitsSettings, setUnitsSettings] = useState({
    weightUnit: "Kilograms (kg)", heightUnit: "Centimeters (cm)", energyUnit: "Kilocalories (kcal)", language: "English"
  });
  const [privacySettings, setPrivacySettings] = useState({
    privateProfile: false, showInLeaderboard: true, dataSharing: false, biometricLock: false
  });

  // Fetch Profile Data
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch App Stats
  const { data: appStats, isLoading: isAppStatsLoading } = useQuery({
    queryKey: ['profileStats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('meals')
        .select('logged_at, total_calories')
        .eq('user_id', user!.id)
        .gte('logged_at', thirtyDaysAgo.toISOString());
        
      if (error) throw error;

      let daysLogged = new Set<string>();
      let totalMeals = data ? data.length : 0;
      let caloriesLast7Days = 0;
      let daysInLast7Days = new Set<string>();
      
      const now = new Date();
      now.setHours(0,0,0,0);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      
      if (data) {
        data.forEach(m => {
          const dateStr = m.logged_at.split('T')[0];
          daysLogged.add(dateStr);
          
          const mDate = new Date(m.logged_at);
          if (mDate >= sevenDaysAgo) {
            caloriesLast7Days += m.total_calories || 0;
            daysInLast7Days.add(dateStr);
          }
        });
      }
      
      const avgCalories = daysInLast7Days.size > 0 
        ? Math.round(caloriesLast7Days / daysInLast7Days.size) 
        : 0;

      // Calculate streak
      let currentStreak = 0;
      const sortedDays = Array.from(daysLogged).sort((a, b) => b.localeCompare(a));
      let currentCheckDate = new Date();
      currentCheckDate.setHours(0,0,0,0);
      let todayStr = currentCheckDate.toISOString().split('T')[0];
      
      let yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      yesterdayDate.setHours(0,0,0,0);
      let yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      if (sortedDays.includes(todayStr) || sortedDays.includes(yesterdayStr)) {
         let checkDate = sortedDays.includes(todayStr) ? new Date(currentCheckDate) : new Date(yesterdayDate);
         for (const d of sortedDays) {
           const checkStr = checkDate.toISOString().split('T')[0];
           if (d === checkStr) {
             currentStreak++;
             checkDate.setDate(checkDate.getDate() - 1);
           } else if (d < checkStr) {
             break;
           }
         }
      }

      return {
        daysLogged: daysLogged.size,
        totalMeals,
        avgCalories,
        streak: currentStreak
      };
    }
  });

  const openEditProfile = () => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        weight: profile.weight_kg?.toString() || "",
        height: profile.height_cm?.toString() || "",
        age: profile.age?.toString() || "",
        gender: profile.gender || "male",
        activityLevel: profile.activity_level || "sedentary",
        goal: profile.goal || "maintain",
        targetWeight: profile.target_weight_kg?.toString() || "",
        weeks: profile.goal_weeks?.toString() || ""
      });
      setShowEditProfile(true);
      Haptics.selectionAsync();
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const plan = calculatePlan({
        weight: parseFloat(editForm.weight) || 0,
        height: parseFloat(editForm.height) || 0,
        age: parseInt(editForm.age) || 0,
        gender: editForm.gender as any,
        activityLevel: editForm.activityLevel as any,
        goal: editForm.goal as any,
        targetWeight: editForm.goal !== 'maintain' ? parseFloat(editForm.targetWeight) : undefined,
        weeks: editForm.goal !== 'maintain' ? parseInt(editForm.weeks) : undefined,
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          weight_kg: parseFloat(editForm.weight),
          height_cm: parseFloat(editForm.height),
          age: parseInt(editForm.age),
          gender: editForm.gender,
          activity_level: editForm.activityLevel,
          goal: editForm.goal,
          target_weight_kg: editForm.goal !== 'maintain' ? parseFloat(editForm.targetWeight) : null,
          goal_weeks: editForm.goal !== 'maintain' ? parseInt(editForm.weeks) : null,
          calorie_goal: plan.goalCalories,
          protein_goal_g: plan.protein,
          carbs_goal_g: plan.carbs,
          fat_goal_g: plan.fat,
          bmr: plan.bmr,
          tdee: plan.tdee,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowEditProfile(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
       Alert.alert("Error saving profile", error.message);
    }
  };

  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isProfileLoading || !profile) {
    return (
      <View className="flex-1 bg-black w-full items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Formatting helpers
  const userInitials = profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?';
  const email = user?.email || "";

  return (
    <View className="flex-1 bg-black w-full relative">
      <View
        className="px-6 pb-6 items-center flex-row justify-center relative"
        style={{ paddingTop: Math.max(insets.top, 32) }}
      >
        <Pressable 
          onPress={onBack} 
          className="absolute left-6 w-10 h-10 items-center justify-center" 
          style={{ top: Math.max(insets.top, 24) }}
        >
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
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
            <View className="flex-row items-start gap-4 mb-6">
              <View className="relative">
                <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center">
                  <Text className="text-3xl font-bold text-black uppercase">
                    {userInitials}
                  </Text>
                </View>
                <Pressable
                  className="absolute bottom-[-4px] right-[-4px] w-8 h-8 bg-green-500 rounded-full items-center justify-center border-2 border-black"
                >
                  <Camera size={14} color="black" />
                </Pressable>
              </View>

              <View className="flex-1 pt-2">
                <Text className="text-xl font-bold text-white mb-1">{profile.name || 'User'}</Text>
                <Text className="text-sm text-zinc-400">{email}</Text>
              </View>
            </View>

            <Pressable
              onPress={openEditProfile}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="w-full bg-zinc-800 border border-zinc-700 py-3 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Edit2 size={16} color="white" />
              <Text className="text-white font-medium">Edit Profile</Text>
            </Pressable>
          </View>

          {/* App Stats Section */}
          <View>
            <Text className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Your Stats</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Flame size={18} color="#f97316" />
                  <Text className="text-xs text-zinc-500 font-medium">Streak</Text>
                </View>
                <Text className="text-xl font-bold text-white mb-1">{appStats?.streak || 0}</Text>
                <Text className="text-[10px] text-zinc-500">Consecutive days</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Calendar size={18} color="#a855f7" />
                  <Text className="text-xs text-zinc-500 font-medium">Days</Text>
                </View>
                <Text className="text-xl font-bold text-white mb-1">{appStats?.daysLogged || 0}</Text>
                <Text className="text-[10px] text-zinc-500">Total days logged</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Target size={18} color="#3b82f6" />
                  <Text className="text-xs text-zinc-500 font-medium">Meals</Text>
                </View>
                <Text className="text-xl font-bold text-white mb-1">{appStats?.totalMeals || 0}</Text>
                <Text className="text-[10px] text-zinc-500">Total meals logged</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Activity size={18} color="#22c55e" />
                  <Text className="text-xs text-zinc-500 font-medium">Daily Avg</Text>
                </View>
                <Text className="text-xl font-bold text-white mb-1">{appStats?.avgCalories || 0}</Text>
                <Text className="text-[10px] text-zinc-500">Last 7 days (kcal)</Text>
              </View>
            </View>
          </View>

          {/* Nutritional Goals Section */}
          <View>
            <Text className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Nutritional Goals</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <View className="flex-row justify-between mb-4 border-b border-zinc-800 pb-4">
                 <View className="items-center flex-1">
                   <Text className="text-xs text-zinc-500 mb-1">Daily Calories</Text>
                   <Text className="text-lg font-bold text-white">{profile.calorie_goal} kcal</Text>
                 </View>
                 <View className="items-center border-l border-zinc-800 flex-1">
                   <Text className="text-xs text-zinc-500 mb-1">Target Weight</Text>
                   <Text className="text-lg font-bold text-white">{profile.target_weight_kg ? `${profile.target_weight_kg} kg` : '--'}</Text>
                 </View>
              </View>

              <View className="flex-row justify-between items-center mb-4">
                 <View className="items-center flex-1">
                   <Text className="text-xs text-green-400 mb-1">Protein</Text>
                   <Text className="text-sm font-bold text-white">{profile.protein_goal_g}g</Text>
                 </View>
                 <View className="items-center border-l border-zinc-800 flex-1">
                   <Text className="text-xs text-blue-400 mb-1">Fat</Text>
                   <Text className="text-sm font-bold text-white">{profile.fat_goal_g}g</Text>
                 </View>
                 <View className="items-center border-l border-zinc-800 flex-1">
                   <Text className="text-xs text-yellow-400 mb-1">Carbs</Text>
                   <Text className="text-sm font-bold text-white">{profile.carbs_goal_g}g</Text>
                 </View>
              </View>

              <View className="bg-zinc-800/50 p-3 rounded-xl flex-row justify-between">
                <View>
                   <Text className="text-xs text-zinc-500 mb-0.5">BMR</Text>
                   <Text className="text-sm font-bold text-zinc-300">{profile.bmr} kcal</Text>
                </View>
                <View className="items-end">
                   <Text className="text-xs text-zinc-500 mb-0.5">TDEE</Text>
                   <Text className="text-sm font-bold text-zinc-300">{profile.tdee} kcal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Body Stats Section */}
          <View>
            <Text className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Body Stats</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Ruler size={16} color="#22c55e" />
                  <Text className="text-xs text-zinc-500 font-medium">Height</Text>
                </View>
                <Text className="text-lg font-bold text-white">{profile.height_cm} cm</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Scale size={16} color="#22c55e" />
                  <Text className="text-xs text-zinc-500 font-medium">Weight</Text>
                </View>
                <Text className="text-lg font-bold text-white">{profile.weight_kg} kg</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <User size={16} color="#22c55e" />
                  <Text className="text-xs text-zinc-500 font-medium">Age</Text>
                </View>
                <Text className="text-lg font-bold text-white">{profile.age} yrs</Text>
              </View>

              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-[48%]">
                <View className="flex-row items-center gap-3 mb-2">
                  <Zap size={16} color="#22c55e" />
                  <Text className="text-xs text-zinc-500 font-medium">Activity</Text>
                </View>
                <Text className="text-[13px] font-bold text-white capitalize">{profile.activity_level}</Text>
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

      {/* Edit Profile Full Sheet */}
      {showEditProfile && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 z-40 bg-black"
          style={{ paddingTop: Math.max(insets.top, 24) }}
        >
           <View className="flex-row justify-between items-center px-6 pb-4">
              <Text className="text-2xl font-bold text-white tracking-tight">Edit Profile</Text>
              <Pressable onPress={() => setShowEditProfile(false)} className="p-2 bg-zinc-800 rounded-full">
                <X size={20} color="#a1a1aa" />
              </Pressable>
           </View>

           <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
             <View className="flex-col gap-6">

                {/* Account Details */}
                <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <Text className="text-sm font-bold text-white mb-4">Account</Text>
                  <View className="gap-4">
                    <View>
                      <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Name</Text>
                      <TextInput
                        value={editForm.name}
                        onChangeText={(t) => setEditForm(s => ({...s, name: t}))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-medium"
                      />
                    </View>
                  </View>
                </View>

                {/* Body Stats */}
                <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                   <Text className="text-sm font-bold text-white mb-4">Body Stats</Text>
                   <View className="flex-row flex-wrap justify-between gap-y-4">
                      <View className="w-[48%]">
                         <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Weight (kg)</Text>
                         <TextInput
                            value={editForm.weight}
                            onChangeText={(t) => setEditForm(s => ({...s, weight: t}))}
                            keyboardType="numeric"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-medium"
                         />
                      </View>
                      <View className="w-[48%]">
                         <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Height (cm)</Text>
                         <TextInput
                            value={editForm.height}
                            onChangeText={(t) => setEditForm(s => ({...s, height: t}))}
                            keyboardType="numeric"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-medium"
                         />
                      </View>
                      <View className="w-[48%]">
                         <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Age</Text>
                         <TextInput
                            value={editForm.age}
                            onChangeText={(t) => setEditForm(s => ({...s, age: t}))}
                            keyboardType="numeric"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-medium"
                         />
                      </View>
                      <View className="w-[48%]">
                         <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Gender</Text>
                         <View className="flex-row rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden">
                           <Pressable 
                             onPress={() => setEditForm(s => ({...s, gender: 'male'}))}
                             className={`flex-1 py-3 items-center ${editForm.gender === 'male' ? 'bg-zinc-700' : ''}`}
                           >
                             <Text className={`font-medium ${editForm.gender === 'male' ? 'text-white' : 'text-zinc-500'}`}>M</Text>
                           </Pressable>
                           <Pressable 
                             onPress={() => setEditForm(s => ({...s, gender: 'female'}))}
                             className={`flex-1 py-3 items-center ${editForm.gender === 'female' ? 'bg-zinc-700' : ''}`}
                           >
                             <Text className={`font-medium ${editForm.gender === 'female' ? 'text-white' : 'text-zinc-500'}`}>F</Text>
                           </Pressable>
                         </View>
                      </View>
                   </View>
                </View>

                {/* Goals */}
                <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                   <Text className="text-sm font-bold text-white mb-4">Fitness Goal</Text>
                   <View className="gap-4">
                      <View>
                        <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Goal</Text>
                        <View className="flex-row rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden">
                           {['lose', 'maintain', 'gain'].map(g => (
                             <Pressable 
                               key={g}
                               onPress={() => setEditForm(s => ({...s, goal: g}))}
                               className={`flex-1 py-3 items-center ${editForm.goal === g ? 'bg-green-500' : ''}`}
                             >
                               <Text className={`font-bold capitalize text-xs ${editForm.goal === g ? 'text-black' : 'text-zinc-400'}`}>{g}</Text>
                             </Pressable>
                           ))}
                        </View>
                      </View>

                      {editForm.goal !== 'maintain' && (
                        <View className="flex-row justify-between gap-4">
                           <View className="flex-1">
                             <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Target (kg)</Text>
                             <TextInput
                                value={editForm.targetWeight}
                                onChangeText={(t) => setEditForm(s => ({...s, targetWeight: t}))}
                                keyboardType="numeric"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-medium"
                             />
                           </View>
                           <View className="flex-1">
                             <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Weeks to Goal</Text>
                             <TextInput
                                value={editForm.weeks}
                                onChangeText={(t) => setEditForm(s => ({...s, weeks: t}))}
                                keyboardType="numeric"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white font-medium"
                             />
                           </View>
                        </View>
                      )}

                      <View>
                         <Text className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Activity Level</Text>
                         <View className="flex-col gap-2">
                           {[
                             { id: 'sedentary', label: 'Sedentary' },
                             { id: 'light', label: 'Lightly Active' },
                             { id: 'moderate', label: 'Moderately Active' },
                             { id: 'active', label: 'Very Active' }
                           ].map(act => (
                             <Pressable 
                               key={act.id}
                               onPress={() => setEditForm(s => ({...s, activityLevel: act.id}))}
                               className={`w-full flex-row items-center justify-between p-3 rounded-xl border ${editForm.activityLevel === act.id ? 'bg-green-500/10 border-green-500' : 'bg-zinc-800 border-zinc-700'}`}
                             >
                               <Text className={`font-medium ${editForm.activityLevel === act.id ? 'text-green-500' : 'text-zinc-300'}`}>{act.label}</Text>
                               {editForm.activityLevel === act.id && <Check size={16} color="#22c55e" />}
                             </Pressable>
                           ))}
                         </View>
                      </View>
                   </View>
                </View>
             </View>

             <Pressable 
               onPress={handleSaveProfile}
               className="w-full bg-green-500 py-4 rounded-full flex-row items-center justify-center gap-2 mt-8"
             >
               <Check size={20} color="black" />
               <Text className="text-black font-bold text-base">Save & Recalculate</Text>
             </Pressable>
           </ScrollView>
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
              <Pressable onPress={() => setExpandedSection(null)} className="p-2 bg-zinc-800 rounded-full">
                <X size={20} color="#a1a1aa" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View className="pb-8">
                {expandedSection === "notifications" && (
                  <View>
                    <Text className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Notifications</Text>
                    <View className="flex-col gap-2">
                      <SettingToggle label="Daily Reminders" enabled={notificationSettings.dailyReminders} onToggle={(v: boolean) => setNotificationSettings(s => ({...s, dailyReminders: v}))} />
                      <SettingToggle label="Meal Logging Alerts" enabled={notificationSettings.mealAlerts} onToggle={(v: boolean) => setNotificationSettings(s => ({...s, mealAlerts: v}))} />
                      <SettingToggle label="Goal Progress Updates" enabled={notificationSettings.goalUpdates} onToggle={(v: boolean) => setNotificationSettings(s => ({...s, goalUpdates: v}))} />
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
                      <SettingToggle label="Private Profile" enabled={privacySettings.privateProfile} onToggle={(v: boolean) => setPrivacySettings(s => ({...s, privateProfile: v}))} />
                      <SettingToggle label="Show in Leaderboard" enabled={privacySettings.showInLeaderboard} onToggle={(v: boolean) => setPrivacySettings(s => ({...s, showInLeaderboard: v}))} />
                      <SettingToggle label="Data Sharing" enabled={privacySettings.dataSharing} onToggle={(v: boolean) => setPrivacySettings(s => ({...s, dataSharing: v}))} />
                      <SettingToggle label="Biometric Lock" enabled={privacySettings.biometricLock} onToggle={(v: boolean) => setPrivacySettings(s => ({...s, biometricLock: v}))} />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <Pressable onPress={() => setExpandedSection(null)} className="w-full mt-4 bg-green-500 py-4 rounded-full items-center">
              <Text className="text-black font-bold text-base">Done</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

// Sub-components

function MenuItem({ icon: Icon, label, badge, onClick, isFirst = false, isLast = false }: any) {
  return (
    <Pressable onPress={onClick} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} className={`w-full flex-row items-center justify-between p-4 ${!isLast ? "border-b border-zinc-800" : ""}`}>
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

function SettingToggle({ label, enabled, onToggle }: any) {
  return (
    <View className="flex-row items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
      <Text className="text-sm font-medium text-white">{label}</Text>
      <Switch value={enabled} onValueChange={onToggle} trackColor={{ false: "#3f3f46", true: "#22c55e" }} thumbColor={"#ffffff"} />
    </View>
  );
}

function SettingOption({ label, value, isLast = false }: any) {
  return (
    <Pressable className={`w-full flex-row items-center justify-between p-4 ${!isLast ? "border-b border-zinc-700" : ""}`}>
      <Text className="text-sm text-zinc-400">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-medium text-white">{value}</Text>
        <ChevronRight size={16} color="#52525b" />
      </View>
    </Pressable>
  );
}
