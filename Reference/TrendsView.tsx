import React, { useState } from "react";
import { Check, Info, TrendingUp, Plus } from "lucide-react";

// Mock data for the chart (7 days of calorie data)
// Set to empty array to show empty state - change to mockData7DaysReal to show data
const mockData7DaysReal = [
  { day: "Tue", value: 1750, date: "Tue, 06 Feb" },
  { day: "Wed", value: 1850, date: "Wed, 07 Feb" },
  { day: "Thu", value: 1920, date: "Thu, 08 Feb" },
  { day: "Fri", value: 2100, date: "Fri, 09 Feb" },
  { day: "Sat", value: 2450, date: "Sat, 10 Feb" },
  { day: "Mon", value: 1920, date: "Mon, 12 Feb" },
  { day: "Sun", value: 1680, date: "Sun, 13 Feb" },
];

const mockData7Days = mockData7DaysReal; // Change to [] for empty state

// Generate 30 days of realistic calorie data
const mockData30Days = Array.from({ length: 30 }, (_, i) => {
  const dayNum = i + 1;
  const date = new Date(2024, 0, dayNum); // January 2024
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  // Generate realistic calorie values with some variation
  // Base value around 1900-2100, with weekends slightly higher
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseCalories = isWeekend ? 2100 : 1900;
  const variation = Math.sin(dayNum / 3) * 300 + Math.random() * 200;
  const value = Math.round(baseCalories + variation);

  return {
    day: dayNum.toString(),
    value: Math.max(1600, Math.min(2600, value)), // Clamp between 1600-2600
    date: `${dayName}, ${dateStr}`,
  };
});

type MetricType = "calories" | "protein" | "carbs" | "fat";
type PeriodType = "7days" | "30days";

export function TrendsView() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("7days");
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("calories");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; date: string } | null>(null);
  const [showPercentTooltip, setShowPercentTooltip] = useState(false);

  const data = selectedPeriod === "7days" ? mockData7Days : mockData30Days;
  const goalValue = 2000;

  // Check if we have any data
  const hasData = data.length > 0;

  // Calculate stats only if we have data
  const highest = hasData ? Math.max(...data.map((d) => d.value)) : 0;
  const lowest = hasData ? Math.min(...data.map((d) => d.value)) : 0;
  const average = hasData ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length) : 0;
  const goalsAchieved = hasData ? data.filter((d) => d.value <= goalValue).length : 0;

  // Metric colors
  const metricColors: Record<MetricType, { active: string; inactive: string }> = {
    calories: { active: "text-white border-white", inactive: "text-zinc-600" },
    protein: { active: "text-cyan-400 border-cyan-400", inactive: "text-zinc-600" },
    carbs: { active: "text-yellow-400 border-yellow-400", inactive: "text-zinc-600" },
    fat: { active: "text-blue-500 border-blue-500", inactive: "text-zinc-600" },
  };

  // Chart dimensions
  const chartWidth = 360;
  const chartHeight = 280;
  const padding = { top: 40, right: 20, bottom: 40, left: 20 };
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

  // Generate gradient fill path
  const generateFillPath = () => {
    const smoothPath = generateSmoothPath();
    return `${smoothPath} L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`;
  };

  const goalLineY = yScale(goalValue);

  const handleChartTouch = (e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left - padding.left;

    const index = Math.round((x / innerWidth) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    const dataPoint = data[clampedIndex];

    setTooltip({
      x: xScale(clampedIndex),
      y: yScale(dataPoint.value),
      value: dataPoint.value,
      date: dataPoint.date,
    });
  };

  const handleChartLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-xl font-semibold text-center text-white tracking-tight">Trends</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-6 pb-24">
        {/* Period Selector */}
        <div className="flex bg-zinc-900/40 p-1 rounded-2xl mb-8 border border-zinc-800/50">
          <button
            onClick={() => setSelectedPeriod("7days")}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedPeriod === "7days"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod("30days")}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedPeriod === "30days"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            30 Days
          </button>
        </div>

        {!hasData ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border-2 border-zinc-800">
              <TrendingUp size={40} className="text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Keep logging to see trends</h2>
            <p className="text-zinc-500 text-center max-w-xs mb-8 leading-relaxed">
              Track your meals for at least {selectedPeriod === "7days" ? "7" : "30"} days to unlock personalized insights and progress trends.
            </p>
            
            {/* Progress Indicator */}
            <div className="w-full max-w-xs mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">Progress</span>
                <span className="text-sm font-bold text-zinc-300">0 / {selectedPeriod === "7days" ? "7" : "30"} days</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: "0%" }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => {/* Navigate to log meal - would be passed as prop in real app */}}
              className="bg-green-500 text-black font-bold py-4 px-8 rounded-full hover:bg-green-400 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Log Your First Meal</span>
            </button>
          </div>
        ) : (
          // Data View
          <>
        {/* Average Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Average</div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">{average.toLocaleString()}</span>
                <span className="text-zinc-500 text-base font-medium">kcal</span>
              </div>
            </div>
            <div className="relative">
              <button
                onTouchStart={() => setShowPercentTooltip(true)}
                onTouchEnd={() => setShowPercentTooltip(false)}
                onMouseEnter={() => setShowPercentTooltip(true)}
                onMouseLeave={() => setShowPercentTooltip(false)}
                className="flex items-center gap-1.5 bg-zinc-800/50 text-zinc-400 px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-700/40"
              >
                <span>↗</span>
                <span>+2.4%</span>
                <Info size={12} className="opacity-50" />
              </button>
              {showPercentTooltip && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 shadow-xl z-10">
                  +2.4% increase compared to previous {selectedPeriod === "7days" ? "7" : "30"} days
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative mb-6">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="touch-none"
            onTouchMove={handleChartTouch}
            onTouchStart={handleChartTouch}
            onTouchEnd={handleChartLeave}
            onMouseMove={handleChartTouch}
            onMouseLeave={handleChartLeave}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
              </linearGradient>
            </defs>

            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Y-axis labels */}
              {[0.5, 1.0, 1.5, 2.0, 2.5].map((val) => {
                const y = yScale(val * 1000);
                return (
                  <text
                    key={val}
                    x={-8}
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-[10px] fill-zinc-600 font-medium"
                  >
                    {val}k
                  </text>
                );
              })}

              {/* Goal line */}
              <line
                x1={0}
                y1={goalLineY}
                x2={innerWidth}
                y2={goalLineY}
                stroke="rgb(63, 63, 70)"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.5}
              />
              <text
                x={innerWidth + 5}
                y={goalLineY}
                alignmentBaseline="middle"
                className="text-[9px] fill-zinc-600 font-medium uppercase tracking-wider"
              >
                Goal
              </text>

              {/* Gradient fill */}
              <path d={generateFillPath()} fill="url(#chartGradient)" />

              {/* Line path */}
              <path d={generateSmoothPath()} fill="none" stroke="rgb(34, 197, 94)" strokeWidth={2.5} />

              {/* Data points - hidden, only show on hover */}

              {/* Tooltip indicator */}
              {tooltip && (
                <>
                  {/* Vertical line */}
                  <line
                    x1={tooltip.x}
                    y1={0}
                    x2={tooltip.x}
                    y2={innerHeight}
                    stroke="rgb(161, 161, 170)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.5}
                  />
                  {/* Highlight point */}
                  <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="white" stroke="rgb(34, 197, 94)" strokeWidth={2} />
                  {/* Tooltip box */}
                  <g transform={`translate(${tooltip.x}, ${tooltip.y - 50})`}>
                    <rect
                      x={-50}
                      y={-30}
                      width={100}
                      height={50}
                      rx={8}
                      fill="rgb(24, 24, 27)"
                      stroke="rgb(63, 63, 70)"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={-15}
                      textAnchor="middle"
                      className="text-[10px] fill-zinc-400 font-medium uppercase"
                    >
                      {tooltip.date}
                    </text>
                    <text x={0} y={2} textAnchor="middle" className="text-sm fill-white font-bold">
                      {tooltip.value.toLocaleString()} kcal
                    </text>
                  </g>
                </>
              )}

              {/* X-axis labels */}
              {data.map((d, i) => {
                // For 30 days view, only show labels every 5 days to avoid crowding
                const shouldShowLabel = selectedPeriod === "7days" || i % 5 === 0 || i === data.length - 1;
                if (!shouldShowLabel) return null;
                
                return (
                  <text
                    key={i}
                    x={xScale(i)}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    className="text-[11px] fill-zinc-500 font-medium"
                  >
                    {d.day}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center justify-center gap-6 mb-8 border-b border-zinc-900 pb-1">
          {(["calories", "protein", "carbs", "fat"] as MetricType[]).map((metric) => {
            const isActive = selectedMetric === metric;
            const colors = metricColors[metric];
            return (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  isActive ? colors.active : colors.inactive
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
                {isActive && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      metric === "calories"
                        ? "bg-white"
                        : metric === "protein"
                        ? "bg-cyan-400"
                        : metric === "carbs"
                        ? "bg-yellow-400"
                        : "bg-blue-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-1">Highest</div>
            <div className="text-lg font-bold text-white">{highest.toLocaleString()} kcal</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-1">Lowest</div>
            <div className="text-lg font-bold text-white">{lowest.toLocaleString()} kcal</div>
          </div>
        </div>

        {/* Goal Achievement */}
        <div className="border-t border-zinc-900 pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Check size={12} className="text-green-500" strokeWidth={3} />
            </div>
            <span className="text-sm text-zinc-400 font-medium">
              Goal achieved{" "}
              <span className="text-white font-semibold">
                {goalsAchieved} / {data.length}
              </span>{" "}
              days
            </span>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}