import React, { useState, useMemo } from "react";
import { ArrowLeft, MoreHorizontal, Calendar, Trash2, Edit2, X, ChevronRight, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import samosaImg from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";
import chowmeinImg from "figma:asset/6ea5c9ca13f6233ff9a8b41e4ae1731e220ec604.png";
import oatmealImg from "figma:asset/711ce1a0b5e57e5ebbc9b3b2b218a224fdb20212.png";
import saladImg from "figma:asset/0f0442c993d068ee043387a879949a69358b54ee.png";

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
  totalCalories: number;
  items: HistoryItem[];
}

// Mock Data
const MOCK_HISTORY: DailyHistory[] = [
  {
    date: "Today",
    totalCalories: 1250,
    items: [
      { id: "1", name: "Samosa", image: samosaImg, calories: 550, mealType: "Snack", time: "4:30 PM", timestampRaw: Date.now() },
      { id: "2", name: "Grilled Chicken Salad", image: saladImg, calories: 350, mealType: "Lunch", time: "12:30 PM", timestampRaw: Date.now() - 3600000 * 4 },
      { id: "3", name: "Oatmeal & Berries", image: oatmealImg, calories: 350, mealType: "Breakfast", time: "8:00 AM", timestampRaw: Date.now() - 3600000 * 8 },
    ]
  },
  {
    date: "Yesterday",
    totalCalories: 2100,
    items: [
      { id: "4", name: "Chowmein", image: chowmeinImg, calories: 480, mealType: "Dinner", time: "8:15 PM", timestampRaw: Date.now() - 86400000 },
      { id: "5", name: "Banana Smoothie", image: samosaImg, calories: 320, mealType: "Snack", time: "4:00 PM", timestampRaw: Date.now() - 86400000 - 3600000 * 4 },
      { id: "6", name: "Rice & Curry", image: saladImg, calories: 650, mealType: "Lunch", time: "1:00 PM", timestampRaw: Date.now() - 86400000 - 3600000 * 7 },
      { id: "7", name: "Eggs & Toast", image: oatmealImg, calories: 450, mealType: "Breakfast", time: "9:00 AM", timestampRaw: Date.now() - 86400000 - 3600000 * 11 },
    ]
  },
  {
    date: "Wed, Oct 24",
    totalCalories: 1850,
    items: [
      { id: "8", name: "Paneer Wrap", image: samosaImg, calories: 520, mealType: "Dinner", time: "7:45 PM", timestampRaw: Date.now() - 86400000 * 2 },
      { id: "9", name: "Fruit Bowl", image: oatmealImg, calories: 250, mealType: "Snack", time: "3:30 PM", timestampRaw: Date.now() - 86400000 * 2 - 3600000 * 4 },
    ]
  }
];

interface HistoryViewProps {
  onBack: () => void;
  onLogMeal: () => void;
  onSelectMeal: (item: HistoryItem, dateContext: string) => void;
}

export function HistoryView({ onBack, onLogMeal, onSelectMeal }: HistoryViewProps) {
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
    onSelectMeal(item, date);
  };

  const handleOptionsClick = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowOptions(true);
  };

  const closeOptions = () => {
    setShowOptions(false);
    setSelectedItem(null);
  };

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return MOCK_HISTORY.map(day => {
      // 1. Filter items by meal type and search query
      const items = day.items.filter(item => {
        // Meal type filter
        const matchesMealType = selectedMealType === "All" || item.mealType === selectedMealType;
        
        // Search filter
        const matchesSearch = searchQuery.trim() === "" || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        
        return matchesMealType && matchesSearch;
      });

      // 2. Filter days by date range (Mock logic)
      let includeDay = true;
      if (dateRange === "Today" && day.date !== "Today") includeDay = false;
      if (dateRange === "Yesterday" && day.date !== "Yesterday") includeDay = false;
      if (dateRange === "Custom" && (customStartDate || customEndDate)) {
        // Custom date range logic (mock implementation)
        includeDay = true; // In real app, would check timestamps
      }
      // "Last 7 Days" would theoretically include all mock data here

      if (!includeDay || items.length === 0) return null;

      // Recalculate total calories for filtered items
      const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

      return {
        ...day,
        items,
        totalCalories
      };
    }).filter(Boolean) as DailyHistory[];
  }, [selectedMealType, dateRange, searchQuery, customStartDate, customEndDate]);

  const hasHistory = filteredHistory.length > 0;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col relative">
      {/* Header */}
      <div className="pt-safe bg-black/80 backdrop-blur-md sticky top-0 z-20 border-b border-zinc-900/50">
        <div className="p-4 flex items-center justify-between">
          <div className="w-10 h-10 -ml-2"></div>
          <h1 className="text-lg font-bold text-center flex-1">History</h1>
          <button 
             onClick={() => setShowFilterMenu(true)}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
               selectedMealType !== "All" || dateRange !== "All Time" 
                 ? "bg-green-500/10 text-green-500" 
                 : "active:bg-zinc-800 text-zinc-400 hover:text-white"
             }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for food..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips (Horizontal Scroll) */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {["All", "Breakfast", "Lunch", "Dinner", "Snack"].map(type => (
            <button
              key={type}
              onClick={() => setSelectedMealType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedMealType === type 
                  ? "bg-white text-black border-white" 
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!hasHistory ? (
          <div className="h-full flex flex-col items-center justify-center -mt-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
              <Calendar size={32} className="text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No meals found</h2>
            <p className="text-zinc-500 text-center max-w-xs mb-8">
              Try adjusting your filters or log a new meal.
            </p>
            {(selectedMealType !== "All" || dateRange !== "All Time" || searchQuery) && (
              <button 
                onClick={() => {
                  setSelectedMealType("All");
                  setDateRange("All Time");
                  setSearchQuery("");
                  setShowCustomDatePicker(false);
                }}
                className="text-green-500 font-bold mb-4"
              >
                Clear Filters
              </button>
            )}
            <button 
              onClick={onLogMeal}
              className="bg-green-500 text-black font-bold py-3 px-8 rounded-full hover:bg-green-400 transition-colors active:scale-95"
            >
              Log a meal
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredHistory.map((day, idx) => (
              <div key={`${day.date}-${idx}`} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">{day.date}</h3>
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800/50">
                    {day.totalCalories.toLocaleString()} kcal
                  </span>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-zinc-800/30 w-full mb-4" />

                {/* Meal List */}
                <div className="space-y-3">
                  {day.items.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleItemClick(item, day.date)}
                      className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-4 active:bg-zinc-800 transition-colors cursor-pointer overflow-hidden shadow-sm"
                    >
                      {/* Image */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/30">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-base truncate pr-6">{item.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500/80"></span>
                          <span>{item.mealType}</span>
                          <span className="text-zinc-600">•</span>
                          <span>{item.time}</span>
                        </div>
                      </div>

                      {/* Calories */}
                      <div className="flex flex-col items-end pl-2">
                        <span className="text-lg font-bold text-white tabular-nums leading-none">{item.calories}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mt-1">kcal</span>
                      </div>

                      {/* Overflow Menu Button */}
                      <button 
                        onClick={(e) => handleOptionsClick(e, item)}
                        className="absolute top-3 right-3 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors z-10"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilterMenu && (
           <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 p-6 pb-safe border-t border-zinc-800 shadow-2xl"
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Filter History</h3>
                <button onClick={() => setShowFilterMenu(false)} className="p-2 bg-zinc-800 rounded-full">
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              {/* Date Range Section */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  {["All Time", "Last 7 Days", "Last 30 Days", "Custom"].map(range => (
                    <button 
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        if (range === "Custom") {
                          setShowCustomDatePicker(true);
                        } else {
                          setShowCustomDatePicker(false);
                        }
                      }}
                      className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                        dateRange === range 
                        ? "bg-green-500/20 border-green-500 text-green-500" 
                        : "bg-zinc-800 border-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                {/* Custom Date Picker */}
                {showCustomDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-5 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-lg"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-zinc-300 mb-2 block uppercase tracking-wider">Start Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-300 mb-2 block uppercase tracking-wider">End Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                          />
                        </div>
                      </div>
                      {customStartDate && customEndDate && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl p-3 mt-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-green-400">Date Range Selected</span>
                          </div>
                          <span className="text-xs font-bold text-green-500">
                            {new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Apply Button */}
              <button 
                onClick={() => setShowFilterMenu(false)}
                className="w-full bg-green-500 text-black font-bold py-4 rounded-full active:scale-[0.98] transition-transform"
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Options Bottom Sheet */}
      <AnimatePresence>
        {showOptions && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOptions}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 p-6 pb-safe border-t border-zinc-800 shadow-2xl"
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 shrink-0">
                  <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{selectedItem.name}</h3>
                  <div className="text-sm text-zinc-400">{selectedItem.mealType} • {selectedItem.calories} kcal</div>
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    handleItemClick(selectedItem, "Selected"); // Open detail view
                    closeOptions();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-800 active:bg-zinc-800 transition-colors text-white font-medium"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Edit2 size={20} />
                  </div>
                  View Details
                </button>
                <button 
                  onClick={() => {
                    console.log("Delete", selectedItem.id);
                    closeOptions();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-500/10 active:bg-red-500/10 transition-colors text-red-500 font-medium"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Trash2 size={20} />
                  </div>
                  Delete Entry
                </button>
              </div>
              
              <button 
                onClick={closeOptions}
                className="w-full mt-4 py-4 text-center text-zinc-500 font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}