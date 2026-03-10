import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageWithFallback } from "./ImageWithFallback";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase, useSession } from "../lib/supabase";
import { HistoryDaySkeleton } from "./SkeletonLoaders";

// Types
export interface HistoryItem {
  id: string;
  name: string;
  image: string;
  calories: number;
  mealType: string;
  time: string;
  timestampRaw?: number; // for sorting/filtering
}

interface DailyHistory {
  date: string;
  fullDate?: string;
  totalCalories: number;
  items: HistoryItem[];
}

interface HistoryViewProps {
  onBack: () => void;
  onOpenMealDetail?: (id: string) => void;
  onOpenDayDetail?: (date: string) => void;
}

export function HistoryView({
  onBack,
  onOpenMealDetail,
  onOpenDayDetail,
}: HistoryViewProps) {
  const insets = useSafeAreaInsets();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Filter States
  const [selectedMealType, setSelectedMealType] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("All Time");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom Date Range States
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Handlers
  const handleItemClick = (item: HistoryItem, date: string) => {
    onOpenMealDetail?.(item.id);
  };

  const handleOptionsClick = (item: HistoryItem) => {
    setSelectedItem(item);
    setShowOptions(true);
  };

  const closeOptions = () => {
    setShowOptions(false);
    setSelectedItem(null);
  };

  const { user } = useSession();
  const PAGE_SIZE = 20;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["historyMeals", user?.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
      if (!user) return [];
      const { data: meals, error } = await supabase
        .from("meals")
        .select(`
          id, meal_type, logged_at, total_calories,
          meal_items(id, food_name, calories)
        `)
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching history meals:", error);
        return [];
      }
      return meals || [];
    },
    getNextPageParam: (lastPage: any[], allPages: any[][]) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: !!user,
  });

  const formatHeaderDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const parsedHistory = useMemo(() => {
    if (!data) return [];
    
    const allMeals = data.pages.flat();
    const grouped: Record<string, DailyHistory> = {};

    allMeals.forEach((meal: any) => {
      const dateStr = meal.logged_at.split("T")[0]; // YYYY-MM-DD
      const headerDate = formatHeaderDate(meal.logged_at);
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: headerDate,
          fullDate: dateStr,
          totalCalories: 0,
          items: [],
        };
      }

      grouped[dateStr].totalCalories += Math.round(meal.total_calories || 0);

      let representativeName = meal.meal_type; 
      let repImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
      
      if (meal.meal_items && meal.meal_items.length > 0) {
        representativeName = meal.meal_items.map((i: any) => i.food_name).join(", ");
      }

      const timeStr = new Date(meal.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      grouped[dateStr].items.push({
        id: String(meal.id),
        name: representativeName,
        image: repImage,
        calories: Math.round(meal.total_calories || 0),
        mealType: meal.meal_type,
        time: timeStr,
        timestampRaw: new Date(meal.logged_at).getTime(),
      });
    });

    return Object.values(grouped).sort((a, b) => {
        if (!a.items.length || !b.items.length) return 0;
        return b.items[0].timestampRaw! - a.items[0].timestampRaw!;
    });
  }, [data]);

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return parsedHistory.map((day) => {
      // 1. Filter items by meal type and search query
      const items = day.items.filter((item) => {
        // Meal type filter
        const matchesMealType =
          selectedMealType === "All" || item.mealType === selectedMealType;

        // Search filter
        const matchesSearch =
          searchQuery.trim() === "" ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

        return matchesMealType && matchesSearch;
      });

      // 2. Filter days by date range
      let includeDay = true;
      if (dateRange === "Today" && day.date !== "Today") includeDay = false;
      if (dateRange === "Yesterday" && day.date !== "Yesterday")
        includeDay = false;
      
      if (!includeDay || items.length === 0) return null;

      // Recalculate total calories for filtered items
      const totalCalories = items.reduce(
        (sum, item) => sum + item.calories,
        0
      );

      return {
        ...day,
        items,
        totalCalories,
      };
    }).filter(Boolean) as DailyHistory[];
  }, [
    parsedHistory,
    selectedMealType,
    dateRange,
    searchQuery,
  ]);

  const hasHistory = filteredHistory.length > 0;

  return (
    <View className="flex-1 bg-black w-full relative">
      {/* Header */}
      <View
        className="bg-black/90 z-20 border-b border-zinc-900"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="px-4 pb-4 flex-row items-center justify-between">
          <View className="w-10 h-10 -ml-2" />
          <Text className="text-lg font-bold text-center flex-1 text-white">
            History
          </Text>
          <Pressable
            onPress={() => setShowFilterMenu(true)}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              selectedMealType !== "All" || dateRange !== "All Time"
                ? "bg-green-500/10"
                : "bg-transparent"
            }`}
          >
            <Feather
              name="filter"
              size={20}
              color={
                selectedMealType !== "All" || dateRange !== "All Time"
                  ? "#22c55e"
                  : "#a1a1aa"
              }
            />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-3">
          <View className="relative justify-center">
            <View className="absolute left-3 z-10">
              <Feather name="search" size={18} color="#71717a" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for food..."
              placeholderTextColor="#71717a"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-white focus:border-zinc-700"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                className="absolute right-3 items-center justify-center w-6 h-6 z-10"
              >
                <Feather name="x" size={16} color="#71717a" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Quick Filter Chips (Horizontal Scroll) */}
        <View className="pb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {["All", "Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedMealType(type)}
                className={`px-4 py-2 rounded-full border ${
                  selectedMealType === type
                    ? "bg-white border-white"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selectedMealType === type ? "text-black" : "text-zinc-400"
                  }`}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching && !isFetchingNextPage} 
            onRefresh={refetch} 
            tintColor="#22c55e"
          />
        }
        onScroll={({ nativeEvent }) => {
          if (!hasNextPage || isFetchingNextPage) return;
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
          if (isCloseToBottom) {
            fetchNextPage();
          }
        }}
        scrollEventThrottle={400}
      >
        {isLoading ? (
          <>
            <HistoryDaySkeleton />
            <HistoryDaySkeleton />
            <HistoryDaySkeleton />
          </>
        ) : !hasHistory ? (
          <View className="flex-1 items-center justify-center mt-20">
            <View className="w-20 h-20 rounded-full bg-zinc-900 items-center justify-center mb-6">
              <Feather name="calendar" size={32} color="#52525b" />
            </View>
            <Text className="text-xl font-bold text-white mb-2">
              No meals found
            </Text>
            <Text className="text-zinc-500 text-center max-w-[250px] mb-8">
              Try adjusting your filters or log a new meal.
            </Text>
            {(selectedMealType !== "All" ||
              dateRange !== "All Time" ||
              searchQuery) && (
              <Pressable
                onPress={() => {
                  setSelectedMealType("All");
                  setDateRange("All Time");
                  setSearchQuery("");
                  setShowCustomDatePicker(false);
                }}
                className="mb-6"
              >
                <Text className="text-green-500 font-bold">Clear Filters</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              className="bg-green-500 py-3 px-8 rounded-full"
            >
              <Text className="text-black font-bold">Log a meal</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-col gap-8">
            {filteredHistory.map((day, idx) => (
              <View key={`${day.date}-${idx}`}>
                {/* Date Header */}
                <Pressable 
                  onPress={() => onOpenDayDetail?.(day.fullDate || day.date)}
                  className="flex-row items-center justify-between mb-3 px-1"
                >
                  <Text className="text-sm font-bold text-zinc-400 uppercase tracking-wide">
                    {day.date}
                  </Text>
                  <View className="bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800/50 flex-row items-center gap-2">
                    <Text className="text-xs font-medium text-zinc-500">
                      {day.totalCalories.toLocaleString()} kcal
                    </Text>
                    <Feather name="chevron-right" size={12} color="#71717a" />
                  </View>
                </Pressable>

                {/* Divider */}
                <View className="h-[1px] bg-zinc-800/50 w-full mb-4" />

                {/* Meal List */}
                <View className="flex-col gap-3">
                  {day.items.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleItemClick(item, day.date)}
                      style={({ pressed }) => [
                        { backgroundColor: pressed ? "#27272a" : "#18181b" },
                      ]}
                      className="border border-zinc-800 rounded-2xl p-3 flex-row items-center gap-4 overflow-hidden"
                    >
                      {/* Image */}
                      <View className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/30">
                        <ImageWithFallback
                          source={{ uri: item.image }}
                          className="w-full h-full"
                          style={{ resizeMode: "cover" }}
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1 pr-6">
                        <Text
                          className="font-bold text-white text-base mb-0.5"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <View className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
                          <Text className="text-xs text-zinc-400">
                            {item.mealType}
                          </Text>
                          <Text className="text-xs text-zinc-600">•</Text>
                          <Text className="text-xs text-zinc-400">
                            {item.time}
                          </Text>
                        </View>
                      </View>

                      {/* Calories */}
                      <View className="flex-col items-end pl-2">
                        <Text className="text-lg font-bold text-white tabular-nums leading-none">
                          {item.calories}
                        </Text>
                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mt-1">
                          kcal
                        </Text>
                      </View>

                      {/* Overflow Menu Button */}
                      <Pressable
                        onPress={() => handleOptionsClick(item)}
                        hitSlop={15}
                        className="absolute top-2.5 right-2 p-1.5 rounded-full items-center justify-center z-10"
                      >
                        <Feather
                          name="more-horizontal"
                          size={18}
                          color="#71717a"
                        />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
        
        {isFetchingNextPage && (
            <View className="py-4 items-center">
              <ActivityIndicator color="#22c55e" />
            </View>
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <Modal
        visible={showFilterMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowFilterMenu(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => setShowFilterMenu(false)}
          />
          <Animated.View
            entering={SlideInDown.springify().damping(25).stiffness(300)}
            exiting={SlideOutDown}
            className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-white">
                Filter History
              </Text>
              <Pressable
                onPress={() => setShowFilterMenu(false)}
                className="w-8 h-8 bg-zinc-800 rounded-full items-center justify-center"
              >
                <Feather name="x" size={16} color="#a1a1aa" />
              </Pressable>
            </View>

            {/* Date Range Section */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">
                Date Range
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {["All Time", "Last 7 Days", "Last 30 Days", "Custom"].map(
                  (range) => (
                    <Pressable
                      key={range}
                      onPress={() => {
                        setDateRange(range);
                        setShowCustomDatePicker(range === "Custom");
                      }}
                      className={`py-3 px-4 rounded-xl border w-[48%] items-center ${
                        dateRange === range
                          ? "bg-green-500/20 border-green-500"
                          : "bg-zinc-800 border-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          dateRange === range
                            ? "text-green-500"
                            : "text-zinc-400"
                        }`}
                      >
                        {range}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {/* Custom Date Picker (Simplified for RN without Native Datepicker library yet) */}
              {showCustomDatePicker && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  className="mt-4 p-5 bg-zinc-800 rounded-2xl border border-zinc-700"
                >
                  <View className="flex-col gap-4">
                    <View>
                      <Text className="text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wider">
                        Start Date
                      </Text>
                      {/* For a real RN app, we'd use DateTimePicker from @react-native-community/datetimepicker */}
                      {/* Using TextInput as fallback mockup */}
                      <TextInput
                        value={customStartDate}
                        onChangeText={setCustomStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#71717a"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-green-500"
                      />
                    </View>
                    <View>
                      <Text className="text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wider">
                        End Date
                      </Text>
                      <TextInput
                        value={customEndDate}
                        onChangeText={setCustomEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#71717a"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-green-500"
                      />
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Apply Button */}
            <Pressable
              onPress={() => setShowFilterMenu(false)}
              className="w-full bg-green-500 py-4 rounded-full items-center"
            >
              <Text className="text-black font-bold text-base">
                Apply Filters
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Options Bottom Sheet */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="none"
        onRequestClose={closeOptions}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={closeOptions}
          />
          {selectedItem && (
            <Animated.View
              entering={SlideInDown.springify().damping(25).stiffness(300)}
              exiting={SlideOutDown}
              className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <View className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />

              <View className="flex-row items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
                <View className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 shrink-0">
                  <ImageWithFallback
                    source={{ uri: selectedItem.image }}
                    className="w-full h-full"
                    style={{ resizeMode: "cover" }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-lg text-white">
                    {selectedItem.name}
                  </Text>
                  <Text className="text-sm text-zinc-400">
                    {selectedItem.mealType} • {selectedItem.calories} kcal
                  </Text>
                </View>
              </View>

              <View className="flex-col gap-2">
                <Pressable
                  onPress={() => {
                    handleItemClick(selectedItem, "Selected");
                    closeOptions();
                  }}
                  style={({ pressed }) => [
                    { backgroundColor: pressed ? "#27272a" : "transparent" },
                  ]}
                  className="w-full flex-row items-center gap-4 p-4 rounded-xl"
                >
                  <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                    <Feather name="edit-2" size={20} color="#a1a1aa" />
                  </View>
                  <Text className="text-white font-medium text-base">
                    View Details
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    console.log("Delete", selectedItem.id);
                    closeOptions();
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: pressed
                        ? "rgba(239, 68, 68, 0.2)"
                        : "transparent",
                    },
                  ]}
                  className="w-full flex-row items-center gap-4 p-4 rounded-xl"
                >
                  <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center">
                    <Feather name="trash-2" size={20} color="#ef4444" />
                  </View>
                  <Text className="text-red-500 font-medium text-base">
                    Delete Entry
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={closeOptions}
                className="w-full mt-4 py-4 items-center"
              >
                <Text className="text-zinc-500 font-medium text-base">
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}
