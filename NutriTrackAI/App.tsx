import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase, useSession } from './lib/supabase';
import { LoginView } from './components/LoginView';
import { SignUpView } from './components/SignUpView';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { CombinedOnboardingFlow } from './components/CombinedOnboardingFlow';
import type { OnboardingRawStats } from './components/CombinedOnboardingFlow';
import { DashboardView } from './components/DashboardView';
import { SearchFoodView } from './components/SearchFoodView';
import type { FoodItemData } from './components/SearchFoodView';
import { EditEntryView } from './components/EditEntryView';
import { CreateCustomFoodView } from './components/CreateCustomFoodView';
import type { NutritionPlan } from './lib/nutritionCalc';

// ─── AsyncStorage key ─────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'onboarding_complete';

// ─── Auth screen names ────────────────────────────────────────────────────────

type AuthScreen = 'login' | 'signup' | 'forgotPassword';

// ─── Root navigator ───────────────────────────────────────────────────────────

export default function App() {
  const { session, user, loading } = useSession();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  /**
   * null  = not yet determined
   * true  = onboarding done → show Dashboard
   * false = first launch or cleared storage → show Onboarding
   */
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);

  // ─── Main App Navigation State ───────────────────────────────────────────────
  type AppView = 'dashboard' | 'search' | 'customFood' | 'editEntry';
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedFood, setSelectedFood] = useState<FoodItemData | null>(null);

  // ── When a session appears, resolve onboarding status ───────────────────────
  useEffect(() => {
    if (!user) {
      setHasCompletedOnboarding(null);
      return;
    }

    (async () => {
      // Fast path: AsyncStorage flag set during first onboarding completion
      const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (flag === 'true') {
        setHasCompletedOnboarding(true);
        return;
      }

      // Fallback: check DB in case storage was cleared (e.g. app reinstall)
      const { data } = await supabase
        .from('profiles')
        .select('calorie_goal')
        .eq('id', user.id)
        .single();

      const done = data?.calorie_goal != null;
      if (done) {
        // Re-stamp local flag so future cold starts are fast
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      }
      setHasCompletedOnboarding(done);
    })();
  }, [user]);

  // ── Onboarding complete handler ──────────────────────────────────────────────
  const handleOnboardingComplete = async (
    plan: NutritionPlan,
    rawStats: OnboardingRawStats,
  ) => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        // Display
        name: rawStats.name || null,

        // Daily goals (shown on Dashboard)
        calorie_goal:   plan.goalCalories,
        protein_goal_g: plan.protein,
        carbs_goal_g:   plan.carbs,
        fat_goal_g:     plan.fat,

        // Metabolic intermediates (used by profile edit recalculation)
        bmr:  plan.bmr,
        tdee: plan.tdee,

        // Raw body stats (stored for later recalculation when user edits profile)
        weight_kg:      rawStats.weight_kg,
        height_cm:      rawStats.height_cm,
        age:            rawStats.age,
        gender:         rawStats.gender,
        activity_level: rawStats.activity_level,

        // Goal tracking (stored for timeline display and progress calculation)
        goal:             plan.goal,
        target_weight_kg: plan.targetWeight ?? null,
        goal_weeks:       plan.inputWeeks ?? null,
      })
      .eq('id', user.id);

    // Stamp flag so next cold start skips onboarding without a DB round-trip
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

    setHasCompletedOnboarding(true);
  };

  // ── Food Logging Handler ─────────────────────────────────────────────────────
  const handleLogFood = async (entry: {
    foodData: FoodItemData;
    quantity: number;
    mealType: string;
    totalWeightProcessed: number;
    calculatedCalories: number;
    calculatedProtein: number;
    calculatedCarbs: number;
    calculatedFat: number;
  }) => {
    if (!user) return;

    try {
      // 1. Ensure a meal exists for today + this type
      const today = new Date().toISOString().split('T')[0];
      
      let { data: meal, error: mealError } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        // Adjusting date matching for timestamp column
        .gte('logged_at', `${today}T00:00:00.000Z`)
        .lte('logged_at', `${today}T23:59:59.999Z`)
        .eq('meal_type', entry.mealType)
        .maybeSingle();

      if (mealError && mealError.code !== 'PGRST116') {
        throw mealError;
      }

      if (!meal) {
        // Create the meal
        const { data: newMeal, error: insertMealError } = await supabase
          .from('meals')
          .insert({
            user_id: user.id,
            logged_at: new Date().toISOString(),
            meal_type: entry.mealType,
          })
          .select('id')
          .single();

        if (insertMealError) throw insertMealError;
        meal = newMeal;
      }

      // 2. Insert the meal item
      if (meal) {
        const { error: itemError } = await supabase
          .from('meal_items')
          .insert({
            meal_id: meal.id,
            food_name: entry.foodData.name,
            food_source: entry.foodData.source || 'custom',
            calories: entry.calculatedCalories,
            protein_g: entry.calculatedProtein,
            carbs_g: entry.calculatedCarbs,
            fat_g: entry.calculatedFat,
            serving_size_g: entry.totalWeightProcessed,
            serving_quantity: entry.quantity,
          });

        if (itemError) throw itemError;
      }

      // Ensure we go back to dashboard on success
      setCurrentView('dashboard');
      setSelectedFood(null);

    } catch (err) {
      console.error("Error logging food:", err);
      alert("Failed to log food. Please try again.");
    }
  };

  // ── Loading — hydrating session from SecureStore ─────────────────────────────
  if (loading) {
    return (
      <SafeAreaProvider>
        <View
          style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={{ color: '#3f3f46', fontSize: 13, marginTop: 16 }}>
            NutriTrack AI
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Not authenticated — show auth flow ───────────────────────────────────────
  if (!session) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {authScreen === 'login' && (
            <LoginView
              onSignUp={() => setAuthScreen('signup')}
              onForgotPassword={() => setAuthScreen('forgotPassword')}
            />
          )}

          {authScreen === 'signup' && (
            <SignUpView
              onLogin={() => setAuthScreen('login')}
              onBack={() => setAuthScreen('login')}
            />
          )}

          {authScreen === 'forgotPassword' && (
            <ForgotPasswordView
              onBack={() => setAuthScreen('login')}
            />
          )}
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  // ── Authenticated — resolving onboarding status ──────────────────────────────
  if (hasCompletedOnboarding === null) {
    return (
      <SafeAreaProvider>
        <View
          style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Onboarding ───────────────────────────────────────────────────────────────
  if (!hasCompletedOnboarding) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <CombinedOnboardingFlow onComplete={handleOnboardingComplete} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  // ── Main App Views ───────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {currentView === 'dashboard' && (
          <DashboardView 
            onOpenSearch={() => setCurrentView('search')}
          />
        )}

        {currentView === 'search' && (
          <SearchFoodView
            onBack={() => setCurrentView('dashboard')}
            onSelect={(data) => {
              if (data.length > 0) {
                setSelectedFood(data[0]); // Handles first selection for now
                setCurrentView('editEntry');
              }
            }}
            onCustomFood={() => setCurrentView('customFood')}
          />
        )}

        {currentView === 'customFood' && (
          <CreateCustomFoodView
            onBack={() => setCurrentView('search')}
            onComplete={(food) => {
              setSelectedFood(food);
              setCurrentView('editEntry');
            }}
          />
        )}

        {currentView === 'editEntry' && selectedFood && (
          <EditEntryView
            initialData={selectedFood}
            onBack={() => {
              setSelectedFood(null);
              setCurrentView('search');
            }}
            onAddIngredient={() => {
              // Stub for future functionality
            }}
            onConfirm={handleLogFood}
          />
        )}

      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
