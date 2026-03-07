import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Stop, Path, Line, Text as SvgText, G, Circle, Rect } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock data for the chart (7 days of calorie data)
const mockData7DaysReal = [
  { day: "Tue", value: 1750, date: "Tue, 06 Feb" },
  { day: "Wed", value: 1850, date: "Wed, 07 Feb" },
  { day: "Thu", value: 1920, date: "Thu, 08 Feb" },
  { day: "Fri", value: 2100, date: "Fri, 09 Feb" },
  { day: "Sat", value: 2450, date: "Sat, 10 Feb" },
  { day: "Mon", value: 1920, date: "Mon, 12 Feb" },
  { day: "Sun", value: 1680, date: "Sun, 13 Feb" },
];

const mockData7Days = mockData7DaysReal;

// Generate 30 days of realistic calorie data
const mockData30Days = Array.from({ length: 30 }, (_, i) => {
  const dayNum = i + 1;
  const date = new Date(2024, 0, dayNum);
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseCalories = isWeekend ? 2100 : 1900;
  const variation = Math.sin(dayNum / 3) * 300 + Math.random() * 200;
  const value = Math.round(baseCalories + variation);

  return {
    day: dayNum.toString(),
    value: Math.max(1600, Math.min(2600, value)),
    date: `${dayName}, ${dateStr}`,
  };
});

type MetricType = "calories" | "protein" | "carbs" | "fat";
type PeriodType = "7days" | "30days";

export function TrendsView() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("7days");
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("calories");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

  const data = selectedPeriod === "7days" ? mockData7Days : mockData30Days;
  const goalValue = 2000;

  const hasData = data.length > 0;

  const highest = hasData ? Math.max(...data.map((d) => d.value)) : 0;
  const lowest = hasData ? Math.min(...data.map((d) => d.value)) : 0;
  const average = hasData ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length) : 0;
  const goalsAchieved = hasData ? data.filter((d) => d.value <= goalValue).length : 0;

  // Chart dimensions
  const chartWidth = SCREEN_WIDTH - 48; // padding 24 on each side
  const chartHeight = 250;
  const padding = { top: 40, right: 10, bottom: 40, left: 30 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const maxValue = Math.max(...data.map((d) => d.value), goalValue) * 1.1;
  const xScale = (index: number) => (index / (data.length - 1)) * innerWidth;
  const yScale = (value: number) => innerHeight - (value / maxValue) * innerHeight;

  // Generate smooth curve path
  const generateSmoothPath = () => {
    if (data.length === 0) return "";

    const points = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.value),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;

      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  const generateFillPath = () => {
    const smoothPath = generateSmoothPath();
    return `${smoothPath} L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`;
  };

  const goalLineY = yScale(goalValue);

  return (
    <View className="flex-1 bg-black w-full">
      {/* Header */}
      <View className="px-6 pt-12 pb-6 items-center">
        <Text className="text-xl font-semibold text-white tracking-tight">Trends</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View className="flex-row bg-zinc-900 rounded-2xl p-1 mb-8 border border-zinc-800/50">
          <Pressable
            onPress={() => setSelectedPeriod("7days")}
            className={`flex-1 py-3 items-center rounded-xl ${
              selectedPeriod === "7days" ? "bg-zinc-800" : ""
            }`}
          >
            <Text
              className={`font-medium ${
                selectedPeriod === "7days" ? "text-white" : "text-zinc-500"
              }`}
            >
              7 Days
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedPeriod("30days")}
            className={`flex-1 py-3 items-center rounded-xl ${
              selectedPeriod === "30days" ? "bg-zinc-800" : ""
            }`}
          >
            <Text
              className={`font-medium ${
                selectedPeriod === "30days" ? "text-white" : "text-zinc-500"
              }`}
            >
              30 Days
            </Text>
          </Pressable>
        </View>

        {!hasData ? (
          <View className="flex-col items-center justify-center mt-12 py-12">
            <View className="w-24 h-24 rounded-full bg-zinc-900 items-center justify-center mb-6 border-2 border-zinc-800">
              <Feather name="trending-up" size={40} color="#52525b" />
            </View>
            <Text className="text-2xl font-bold text-white mb-3 text-center">
              Keep logging to see trends
            </Text>
            <Text className="text-zinc-500 text-center mb-8 px-4 leading-relaxed">
              Track your meals for at least {selectedPeriod === "7days" ? "7" : "30"} days to unlock personalized insights and progress trends.
            </Text>
            {/* CTA Button */}
            <Pressable className="bg-green-500 rounded-full px-8 py-4 flex-row items-center justify-center gap-2">
              <Feather name="plus" size={20} color="black" />
              <Text className="text-black font-bold">Log Your First Meal</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} className="w-full">
            {/* Average Section */}
            <View className="mb-6 flex-row items-start justify-between">
              <View>
                <Text className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">
                  Average
                </Text>
                <View className="flex-row items-end gap-2">
                  <Text className="text-5xl font-bold tracking-tight text-white">
                    {average.toLocaleString()}
                  </Text>
                  <Text className="text-zinc-500 text-base font-medium mb-1.5">kcal</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700">
                <Feather name="arrow-up-right" size={14} color="#a1a1aa" />
                <Text className="text-xs text-zinc-400 font-medium">+2.4%</Text>
              </View>
            </View>

            {/* Metric Selector */}
            <View className="flex-row items-center justify-between mb-8 pb-1 flex-wrap pl-1 mt-6 border-b border-zinc-900">
              {(["calories", "protein", "carbs", "fat"] as MetricType[]).map((metric) => {
                const isActive = selectedMetric === metric;
                return (
                  <Pressable
                    key={metric}
                    onPress={() => setSelectedMetric(metric)}
                    className="pb-3 px-1 relative"
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive
                          ? metric === "calories" ? "text-white"
                          : metric === "protein" ? "text-cyan-400"
                          : metric === "carbs" ? "text-yellow-400"
                          : "text-blue-500"
                          : "text-zinc-500"
                      }`}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </Text>
                    {isActive && (
                      <View
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                          metric === "calories" ? "bg-white"
                          : metric === "protein" ? "bg-cyan-400"
                          : metric === "carbs" ? "bg-yellow-400"
                          : "bg-blue-500"
                        }`}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Chart */}
            <View className="mb-6 bg-black" style={{ height: chartHeight + 10 }}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
                    <Stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                  </LinearGradient>
                </Defs>

                <G x={padding.left} y={padding.top}>
                  {/* Y-axis labels */}
                  {[0.5, 1.0, 1.5, 2.0, 2.5].map((val) => {
                    const y = yScale(val * 1000);
                    return (
                      <SvgText
                        key={val}
                        x={-10}
                        y={y}
                        fill="#52525b"
                        fontSize={10}
                        fontWeight="500"
                        textAnchor="end"
                        alignmentBaseline="middle"
                      >
                        {val}k
                      </SvgText>
                    );
                  })}

                  {/* Goal line */}
                  <Line
                    x1={0}
                    y1={goalLineY}
                    x2={innerWidth}
                    y2={goalLineY}
                    stroke="#3f3f46"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.5}
                  />
                  <SvgText
                    x={innerWidth + 5}
                    y={goalLineY}
                    fill="#52525b"
                    fontSize={10}
                    fontWeight="500"
                    alignmentBaseline="middle"
                  >
                    GOAL
                  </SvgText>

                  {/* Gradient fill */}
                  <Path d={generateFillPath()} fill="url(#chartGradient)" />

                  {/* Line path */}
                  <Path
                    d={generateSmoothPath()}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={3}
                  />

                  {/* X-axis labels */}
                  {data.map((d, i) => {
                    const shouldShowLabel = selectedPeriod === "7days" || i % 5 === 0 || i === data.length - 1;
                    if (!shouldShowLabel) return null;

                    return (
                      <SvgText
                        key={i}
                        x={xScale(i)}
                        y={innerHeight + 20}
                        fill="#71717a"
                        fontSize={11}
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        {d.day}
                      </SvgText>
                    );
                  })}

                  {/* Simple invisible overlay for touch if we want tooltips, 
                      but in React Native SVG touch tracking requires PanResponders.
                      Skipping complex tooltip interactions for now to keep it lightweight. */}
                </G>
              </Svg>
            </View>

            {/* Summary Stats */}
            <View className="flex-row justify-between mb-8 w-full border-t border-zinc-900 pt-6">
              <View className="flex-1 items-start">
                <Text className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1">
                  Highest
                </Text>
                <Text className="text-xl font-bold text-white">
                  {highest.toLocaleString()} kcal
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1">
                  Lowest
                </Text>
                <Text className="text-xl font-bold text-white">
                  {lowest.toLocaleString()} kcal
                </Text>
              </View>
            </View>

            {/* Goal Achievement */}
            <View className="bg-zinc-900/50 rounded-2xl p-4 flex-row items-center border border-zinc-800">
              <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center mr-4 border border-green-500/30">
                <Feather name="check" size={16} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-zinc-400 font-medium">
                  Goal achieved <Text className="text-white font-bold">{goalsAchieved} / {data.length}</Text> days
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
