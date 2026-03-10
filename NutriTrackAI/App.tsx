import React, { useEffect, useRef, useState } from 'react';
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
import { CameraView } from './components/CameraView';
import { ScanningView } from './components/ScanningView';
import { MultiItemConfirmView } from './components/MultiItemConfirmView';
import { FinalResultsView } from './components/FinalResultsView';
import { VoiceRecordView } from './components/VoiceRecordView';
import { ScanLabelView } from './components/ScanLabelView';
import { LabelResultView } from './components/LabelResultView';
import { HistoryView } from './components/HistoryView';
import { TrendsView } from './components/TrendsView';
import { BottomNav } from './components/BottomNav';
import { MealDetailView } from './components/MealDetailView';
import { DayDetailView } from './components/DayDetailView';
import { ProfileView } from './components/ProfileView';
import { ErrorToast } from './components/ErrorToast';
import type { ErrorToastRef } from './components/ErrorToast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { syncMealPatterns, checkMealCache } from './lib/mealCache';
import type { CachedMealPattern } from './lib/mealCache';
import type { FinalResultData } from './components/FinalResultsView';
import type { NutritionPlan } from './lib/nutritionCalc';
import type { FoodItem } from './lib/nutritionLookup';
import type { LabelData } from './components/LabelResultView';

// ─── AsyncStorage key ─────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'onboarding_complete';

// ─── Auth screen names ────────────────────────────────────────────────────────

type AuthScreen = 'login' | 'signup' | 'forgotPassword';

// ─── App view names ───────────────────────────────────────────────────────────

type AppView =
  | 'dashboard'
  | 'search'
  | 'customFood'
  | 'editEntry'
  | 'camera'
  | 'scanning'
  | 'multiConfirm'
  | 'finalResults'
  | 'voice'
  | 'scanLabel'
  | 'labelResult'
  | 'history'
  | 'trends'
  | 'mealDetail'
  | 'dayDetail'
  | 'profile';

// ─── Root navigator ───────────────────────────────────────────────────────────

const queryClient = new QueryClient();

export default function App() {
  const { session, user, loading } = useSession();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const toastRef = useRef<ErrorToastRef>(null);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Cached meal state
  const [currentCacheMatch, setCurrentCacheMatch] = useState<CachedMealPattern | null>(null);

  // History flow state
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ─── Main App Navigation State ─────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedFood, setSelectedFood] = useState<FoodItemData | null>(null);

  // Photo flow state
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<FoodItem[]>([]);
  const [detectedMealType, setDetectedMealType] = useState('snack');
  const [finalResultData, setFinalResultData] = useState<FinalResultData | null>(null);

  // Label scan flow state
  const [scannedLabelData, setScannedLabelData] = useState<LabelData | null>(null);
  const [labelScanSource, setLabelScanSource] = useState<'openfoodfacts' | 'ocr'>('openfoodfacts');

  // ── When a session appears, resolve onboarding status ─────────────────────
  useEffect(() => {
    if (!user) {
      setHasCompletedOnboarding(null);
      return;
    }

    (async () => {
      const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (flag === 'true') {
        setHasCompletedOnboarding(true);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('calorie_goal')
        .eq('id', user.id)
        .single();

      const done = data?.calorie_goal != null;
      if (done) {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        syncMealPatterns(user.id).catch(() => {});
      }
      setHasCompletedOnboarding(done);
    })();
  }, [user]);

  // ── Onboarding complete handler ────────────────────────────────────────────
  const handleOnboardingComplete = async (
    plan: NutritionPlan,
    rawStats: OnboardingRawStats,
  ) => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        name:             rawStats.name || null,
        calorie_goal:     plan.goalCalories,
        protein_goal_g:   plan.protein,
        carbs_goal_g:     plan.carbs,
        fat_goal_g:       plan.fat,
        bmr:              plan.bmr,
        tdee:             plan.tdee,
        weight_kg:        rawStats.weight_kg,
        height_cm:        rawStats.height_cm,
        age:              rawStats.age,
        gender:           rawStats.gender,
        activity_level:   rawStats.activity_level,
        goal:             plan.goal,
        target_weight_kg: plan.targetWeight ?? null,
        goal_weeks:       plan.inputWeeks ?? null,
      })
      .eq('id', user.id);

    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
    syncMealPatterns(user.id).catch(() => {});
  };

  // ── Manual food logging handler (search → editEntry flow) ─────────────────
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
      const today = new Date().toISOString().split('T')[0];

      let { data: meal, error: mealError } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00.000Z`)
        .lte('logged_at', `${today}T23:59:59.999Z`)
        .eq('meal_type', entry.mealType.toLowerCase())
        .maybeSingle();

      if (mealError && mealError.code !== 'PGRST116') throw mealError;

      if (!meal) {
        const { data: newMeal, error: insertMealError } = await supabase
          .from('meals')
          .insert({
            user_id:    user.id,
            logged_at:  new Date().toISOString(),
            meal_type:  entry.mealType.toLowerCase(),
          })
          .select('id')
          .single();
        if (insertMealError) throw insertMealError;
        meal = newMeal;
      }

      if (meal) {
        const { error: itemError } = await supabase
          .from('meal_items')
          .insert({
            meal_id:     meal.id,
            food_name:   entry.foodData.name,
            food_source: entry.foodData.source || 'custom',
            calories:    entry.calculatedCalories,
            protein_g:   entry.calculatedProtein,
            carbs_g:     entry.calculatedCarbs,
            fat_g:       entry.calculatedFat,
            weight_g:    entry.totalWeightProcessed,
            quantity:    entry.quantity,
          });
        if (itemError) throw itemError;
      }

      setCurrentView('dashboard');
      setSelectedFood(null);
    } catch (err) {
      console.error('Error logging food:', err);
      toastRef.current?.show('Failed to save meal', () => handleLogFood(entry));
    }
  };

  // ── Photo flow: save confirmed items → FinalResults ────────────────────────
  const handleConfirmMeal = async (confirmedItems: FoodItem[]) => {
    if (!user || confirmedItems.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const mealType = detectedMealType;

      let { data: meal, error: mealError } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00.000Z`)
        .lte('logged_at', `${today}T23:59:59.999Z`)
        .eq('meal_type', mealType)
        .maybeSingle();

      if (mealError && mealError.code !== 'PGRST116') throw mealError;

      if (!meal) {
        const { data: newMeal, error: insertMealError } = await supabase
          .from('meals')
          .insert({
            user_id:          user.id,
            logged_at:        new Date().toISOString(),
            meal_type:        mealType,
            detection_source: 'photo',
          })
          .select('id')
          .single();
        if (insertMealError) throw insertMealError;
        meal = newMeal;
      }

      if (meal) {
        const payload = confirmedItems.map(item => {
          const sw = item.defaultWeight * item.quantity;
          return {
            meal_id:     meal!.id,
            food_name:   item.name,
            food_source: item.food_source ?? 'ai_generated',
            calories:    item.calories,
            protein_g:   Math.round((sw / 100) * item.protein_per_100g * 10) / 10,
            carbs_g:     Math.round((sw / 100) * item.carbs_per_100g   * 10) / 10,
            fat_g:       Math.round((sw / 100) * item.fat_per_100g     * 10) / 10,
            weight_g:    sw,
            quantity:    item.quantity,
          };
        });
        const { error: itemsError } = await supabase.from('meal_items').insert(payload);
        if (itemsError) throw itemsError;
      }

      // Build summary data for FinalResultsView
      const totalCalories = confirmedItems.reduce((s, i) => s + i.calories, 0);
      const totalProtein  = Math.round(confirmedItems.reduce((s, i) => s + (i.defaultWeight * i.quantity / 100) * i.protein_per_100g, 0));
      const totalCarbs    = Math.round(confirmedItems.reduce((s, i) => s + (i.defaultWeight * i.quantity / 100) * i.carbs_per_100g,   0));
      const totalFat      = Math.round(confirmedItems.reduce((s, i) => s + (i.defaultWeight * i.quantity / 100) * i.fat_per_100g,     0));

      const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
      const now = new Date();
      const timeStr = `Today, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

      setFinalResultData({
        name: confirmedItems.length === 1 ? confirmedItems[0].name : `${confirmedItems.length} items`,
        mealType: mealLabel,
        timestamp: timeStr,
        image: capturedImageUri || confirmedItems[0]?.image || '',
        calories: totalCalories,
        macros: {
          protein: { label: 'Protein', value: totalProtein, unit: 'g', color: 'bg-green-500' },
          carbs:   { label: 'Carbs',   value: totalCarbs,   unit: 'g', color: 'bg-yellow-500' },
          fat:     { label: 'Fat',     value: totalFat,     unit: 'g', color: 'bg-blue-500' },
        },
        ingredients: confirmedItems.map(i => ({ name: i.name, amount: `${i.defaultWeight * i.quantity}g` })),
      });
      setCurrentView('finalResults');
      
      // Update cache in the background
      syncMealPatterns(user.id).catch(() => {
        toastRef.current?.show('Cache sync failed', undefined, 3000);
      });
    } catch (err) {
      console.error('Error saving meal:', err);
      toastRef.current?.show('Failed to save meal', () => handleConfirmMeal(confirmedItems));
    }
  };

  // ── Handle confirm label result ──────────────────────────────────────────
  const handleConfirmLabel = async (data: LabelData, servings: number) => {
    if (!user) return;
    try {
      const getNum = (str: string) => parseFloat(str) || 0;
      const totalCal = Math.round(getNum(data.calories) * servings);
      const totalP = getNum(data.protein) * servings;
      const totalC = getNum(data.carbs) * servings;
      const totalF = getNum(data.fat) * servings;
      const totalSodium = getNum(data.sodium) * servings;
      const totalSugar = getNum(data.sugar) * servings;

      // 1. Insert meal
      const { data: mealRow, error: mealErr } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          meal_type: 'snack', // Defaulting to snack for label scan; could be chosen
          total_calories: totalCal,
          logged_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (mealErr) throw mealErr;

      // 2. Insert meal_item
      const { data: miRow, error: miErr } = await supabase
        .from('meal_items')
        .insert({
          meal_id: mealRow.id,
          food_name: (data as any).productName || 'Packaged Food',
          quantity: servings,
          weight_g: 100, // or approximate
          calories: totalCal,
          protein_g: totalP,
          carbs_g: totalC,
          fat_g: totalF,
          food_source: labelScanSource === 'ocr' ? 'ocr_label' : 'openfoodfacts',
        })
        .select('id')
        .single();

      if (miErr) throw miErr;

      // 3. Insert label_nutrients referencing meal_item
      const { error: lnErr } = await supabase
        .from('label_nutrients')
        .insert({
          meal_item_id: miRow.id,
          serving_size: data.servingSize || null,
          energy_kcal: getNum(data.calories),
          protein_g: getNum(data.protein),
          carbs_g: getNum(data.carbs),
          fat_g: getNum(data.fat),
          sodium_mg: getNum(data.sodium),
          sugar_g: getNum(data.sugar),
        });
        
      if (lnErr) throw lnErr;

      const now = new Date();
      const timeStr = `Today, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

      setFinalResultData({
        name: (data as any).productName || 'Packaged Food',
        mealType: 'Snack',
        timestamp: timeStr,
        image: capturedImageUri || '',
        calories: totalCal,
        macros: {
          protein: { label: 'Protein', value: totalP, unit: 'g', color: 'bg-green-500' },
          carbs:   { label: 'Carbs',   value: totalC, unit: 'g', color: 'bg-yellow-500' },
          fat:     { label: 'Fat',     value: totalF, unit: 'g', color: 'bg-blue-500' },
        },
        ingredients: [{ name: (data as any).productName || 'Packaged Food', amount: `${servings} serving(s)` }]
      });
      setCurrentView('finalResults');

      // Update cache
      syncMealPatterns(user.id).catch(() => {
        toastRef.current?.show('Cache sync failed', undefined, 3000);
      });
    } catch (err: any) {
      console.error('[handleConfirmLabel] Error:', err);
      toastRef.current?.show(err.message || 'Failed to log packaged food');
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={{ color: '#3f3f46', fontSize: 13, marginTop: 16 }}>NutriTrack AI</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // ─── Not authenticated ─────────────────────────────────────────────────────
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
            <SignUpView onLogin={() => setAuthScreen('login')} onBack={() => setAuthScreen('login')} />
          )}
          {authScreen === 'forgotPassword' && (
            <ForgotPasswordView onBack={() => setAuthScreen('login')} />
          )}
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  // ─── Resolving onboarding ──────────────────────────────────────────────────
  if (hasCompletedOnboarding === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </SafeAreaProvider>
    );
  }

  // ─── Onboarding ────────────────────────────────────────────────────────────
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

  // ─── Main App Views ────────────────────────────────────────────────────────
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={{ flex: 1, backgroundColor: '#000' }}>

        {/* ── Dashboard ─────────────────────────────────────────────────── */}
        {currentView === 'dashboard' && (
          <DashboardView
            onOpenSearch={() => setCurrentView('search')}
            onOpenCam={() => setCurrentView('camera')}
            onOpenVoice={() => setCurrentView('voice')}
            onOpenScanLabel={() => setCurrentView('scanLabel')}
            onOpenHistory={() => { setCurrentView('history'); setActiveTab('history'); }}
            onOpenProfile={() => { setCurrentView('profile'); setActiveTab('profile'); }}
            onOpenDayDetail={(date) => {
              setSelectedDate(date);
              setCurrentView('dayDetail');
            }}
            onOpenMealDetail={(id) => {
              setSelectedMealId(id);
              setCurrentView('mealDetail');
            }}
          />
        )}

        {/* ── Manual search flow ────────────────────────────────────────── */}
        {currentView === 'search' && (
          <SearchFoodView
            onBack={() => setCurrentView('dashboard')}
            onSelect={(data) => {
              if (data.length > 0) {
                setSelectedFood(data[0]);
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
            onBack={() => { setSelectedFood(null); setCurrentView('search'); }}
            onAddIngredient={() => {}}
            onConfirm={handleLogFood}
          />
        )}

        {/* ── Photo flow: Camera → Scanning → MultiConfirm → FinalResults ─ */}
        {currentView === 'camera' && (
          <CameraView
            onClose={() => setCurrentView('dashboard')}
            onCapture={(uri) => {
              setCapturedImageUri(uri);
              setCurrentView('scanning');
            }}
          />
        )}

        {currentView === 'scanning' && capturedImageUri && (
          <ScanningView
            capturedImage={capturedImageUri}
            onClose={() => { setCapturedImageUri(null); setCurrentView('dashboard'); }}
            onComplete={async (foods, mealType) => {
              setDetectedFoods(foods);
              setDetectedMealType(mealType);
              // Check cache before showing multiconfirm
              const match = await checkMealCache();
              setCurrentCacheMatch(match);
              setCurrentView('multiConfirm');
            }}
            onTimeout={() => { setCapturedImageUri(null); setCurrentView('search'); }}
            onManualFallback={() => { setCapturedImageUri(null); setCurrentView('search'); }}
          />
        )}

        {currentView === 'multiConfirm' && (
          <MultiItemConfirmView
            initialItems={detectedFoods}
            capturedImage={capturedImageUri ?? undefined}
            cacheMatch={currentCacheMatch}
            onBack={() => setCurrentView('camera')}
            onConfirm={handleConfirmMeal}
            onAddItem={() => setCurrentView('search')}
          />
        )}

        {currentView === 'finalResults' && finalResultData && (
          <FinalResultsView
            data={finalResultData}
            onBack={() => setCurrentView('dashboard')}
            onDone={() => {
              setCapturedImageUri(null);
              setDetectedFoods([]);
              setFinalResultData(null);
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'voice' && (
          <VoiceRecordView
            onClose={() => setCurrentView('dashboard')}
            onComplete={async (foods, mealType, text) => {
              setDetectedFoods(foods);
              setDetectedMealType(mealType);
              const match = await checkMealCache();
              setCurrentCacheMatch(match);
              setCurrentView('multiConfirm');
            }}
          />
        )}

        {/* ── Scan Label Flow ────────────────────────────────────────────── */}
        {currentView === 'scanLabel' && (
          <ScanLabelView
            onClose={() => setCurrentView('dashboard')}
            onComplete={(data, source, uri) => {
              setScannedLabelData(data);
              setLabelScanSource(source);
              if (uri) setCapturedImageUri(uri);
              else setCapturedImageUri(null);
              setCurrentView('labelResult');
            }}
          />
        )}

        {currentView === 'labelResult' && scannedLabelData && (
          <LabelResultView
            initialData={scannedLabelData}
            capturedImage={capturedImageUri ?? undefined}
            onBack={() => {
              setScannedLabelData(null);
              setCapturedImageUri(null);
              setCurrentView('scanLabel');
            }}
            onConfirm={handleConfirmLabel}
          />
        )}

        {currentView === 'trends' && <TrendsView />}

        {currentView === 'history' && (
          <HistoryView
            onBack={() => { setCurrentView('dashboard'); setActiveTab('home'); }}
            onOpenMealDetail={(id: string) => {
              setSelectedMealId(id);
              setCurrentView('mealDetail');
            }}
            onOpenDayDetail={(date: string) => {
              setSelectedDate(date);
              setCurrentView('dayDetail');
            }}
          />
        )}

        {currentView === 'mealDetail' && selectedMealId && (
          <MealDetailView
            mealId={selectedMealId}
            onBack={() => setCurrentView('history')}
            onEdit={(mealData: any) => {
              // Implementation detail depends on how strict EditEntryView is
            }}
          />
        )}

        {currentView === 'dayDetail' && selectedDate && (
          <DayDetailView
            initialDate={selectedDate}
            onBack={() => setCurrentView('history')}
            onOpenMealDetail={(id: string) => {
              setSelectedMealId(id);
              setCurrentView('mealDetail');
            }}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onBack={() => { setCurrentView('dashboard'); setActiveTab('home'); }}
            onLogout={async () => {
              await supabase.auth.signOut();
            }}
          />
        )}

        {['dashboard', 'history', 'trends', 'profile'].includes(currentView) && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'home') setCurrentView('dashboard');
              else if (tab === 'history') setCurrentView('history');
              else if (tab === 'trends') setCurrentView('trends');
              else if (tab === 'profile') setCurrentView('profile');
            }}
          />
        )}
          </View>
        <ErrorToast ref={toastRef} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  </QueryClientProvider>
  );
}
