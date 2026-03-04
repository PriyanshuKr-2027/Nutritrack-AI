import React, { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "motion/react";

// Types
export interface DayStats {
  date: string;
  totalCalories: number;
  goalCalories: number;
  macros: {
    protein: { current: number; goal: number };
    carbs: { current: number; goal: number };
    fat: { current: number; goal: number };
  };
  nutrients: {
    fiber: number;
    sugar: number;
    sodium: number;
  };
  meals: {
    type: string;
    calories: number;
  }[];
}

// Mock Data
const MOCK_DAYS: DayStats[] = [
  {
    date: "Today",
    totalCalories: 1850,
    goalCalories: 2200,
    macros: {
      protein: { current: 95, goal: 130 },
      carbs: { current: 210, goal: 250 },
      fat: { current: 60, goal: 70 },
    },
    nutrients: { fiber: 18, sugar: 42, sodium: 1900 },
    meals: [
      { type: "Breakfast", calories: 320 },
      { type: "Lunch", calories: 540 },
      { type: "Snack", calories: 270 },
      { type: "Dinner", calories: 720 },
    ]
  },
  {
    date: "Yesterday",
    totalCalories: 2100,
    goalCalories: 2200,
    macros: {
      protein: { current: 120, goal: 130 },
      carbs: { current: 240, goal: 250 },
      fat: { current: 65, goal: 70 },
    },
    nutrients: { fiber: 22, sugar: 38, sodium: 2100 },
    meals: [
      { type: "Breakfast", calories: 450 },
      { type: "Lunch", calories: 650 },
      { type: "Snack", calories: 320 },
      { type: "Dinner", calories: 680 },
    ]
  },
  {
    date: "Mon, 12 Feb",
    totalCalories: 1650,
    goalCalories: 2200,
    macros: {
      protein: { current: 80, goal: 130 },
      carbs: { current: 180, goal: 250 },
      fat: { current: 50, goal: 70 },
    },
    nutrients: { fiber: 15, sugar: 30, sodium: 1800 },
    meals: [
      { type: "Breakfast", calories: 300 },
      { type: "Lunch", calories: 500 },
      { type: "Dinner", calories: 850 },
    ]
  }
];

interface DayDetailViewProps {
  initialDayIndex?: number;
  onBack: () => void;
  onMealTypeSelect: (mealType: string) => void;
}

export function DayDetailView({ initialDayIndex = 0, onBack, onMealTypeSelect }: DayDetailViewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialDayIndex);
  const [direction, setDirection] = useState(0);
  const [isNutrientsExpanded, setIsNutrientsExpanded] = useState(false);

  const currentDay = MOCK_DAYS[currentIndex];

  // Handlers
  const handlePrevDay = () => {
    if (currentIndex < MOCK_DAYS.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleNextDay = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleNextDay();
    } else if (info.offset.x < -100) {
      handlePrevDay();
    }
  };

  // Helper for progress bar width
  const getProgress = (current: number, goal: number) => Math.min((current / goal) * 100, 100);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? -300 : 300,
      opacity: 0
    })
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 pt-safe flex items-center justify-between z-20 bg-black/80 backdrop-blur-md sticky top-0 border-b border-zinc-900/50">
        <button 
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrevDay}
            disabled={currentIndex >= MOCK_DAYS.length - 1}
            className="p-1 text-zinc-500 disabled:opacity-30 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-lg font-bold w-32 text-center">{currentDay.date}</span>
          <button 
            onClick={handleNextDay}
            disabled={currentIndex <= 0}
            className="p-1 text-zinc-500 disabled:opacity-30 hover:text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content Area with Swipe */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="h-full w-full overflow-y-auto pb-24 absolute top-0 left-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="px-6 py-6 space-y-8">
              
              {/* Daily Calories Section */}
              <section>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Total Calories</h2>
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold text-white tracking-tight mb-2">
                      {currentDay.totalCalories.toLocaleString()} <span className="text-xl text-zinc-500 font-medium">kcal</span>
                    </span>
                    <span className="text-zinc-400 font-medium mb-6">
                      {currentDay.totalCalories.toLocaleString()} / {currentDay.goalCalories.toLocaleString()} kcal
                    </span>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${getProgress(currentDay.totalCalories, currentDay.goalCalories)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Macro Breakdown Section */}
              <section>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Macro Breakdown</h2>
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-6">
                  
                  {/* Protein */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-white">Protein</span>
                      <span className="text-sm text-zinc-400 font-medium tabular-nums">
                        <span className="text-white">{currentDay.macros.protein.current}g</span> / {currentDay.macros.protein.goal}g
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${getProgress(currentDay.macros.protein.current, currentDay.macros.protein.goal)}%` }}
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-white">Carbs</span>
                      <span className="text-sm text-zinc-400 font-medium tabular-nums">
                        <span className="text-white">{currentDay.macros.carbs.current}g</span> / {currentDay.macros.carbs.goal}g
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${getProgress(currentDay.macros.carbs.current, currentDay.macros.carbs.goal)}%` }}
                      />
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-white">Fat</span>
                      <span className="text-sm text-zinc-400 font-medium tabular-nums">
                        <span className="text-white">{currentDay.macros.fat.current}g</span> / {currentDay.macros.fat.goal}g
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${getProgress(currentDay.macros.fat.current, currentDay.macros.fat.goal)}%` }}
                      />
                    </div>
                  </div>

                </div>
              </section>

              {/* Secondary Nutrients Section (Collapsible) */}
              <section>
                <div 
                  onClick={() => setIsNutrientsExpanded(!isNutrientsExpanded)}
                  className="flex items-center justify-between mb-4 cursor-pointer active:opacity-70 transition-opacity"
                >
                  <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Additional Nutrients</h2>
                  {isNutrientsExpanded ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
                </div>
                
                <AnimatePresence>
                  {isNutrientsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                          <span className="text-zinc-400 font-medium">Fiber</span>
                          <span className="text-white font-bold">{currentDay.nutrients.fiber}g</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                          <span className="text-zinc-400 font-medium">Sugar</span>
                          <span className="text-white font-bold">{currentDay.nutrients.sugar}g</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                          <span className="text-zinc-400 font-medium">Sodium</span>
                          <span className="text-white font-bold">{currentDay.nutrients.sodium}mg</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Meal Summary Section */}
              <section>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Meals</h2>
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  {currentDay.meals.map((meal, idx) => (
                    <button
                      key={idx}
                      onClick={() => onMealTypeSelect(meal.type)}
                      className="w-full flex items-center justify-between p-5 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 active:bg-zinc-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          meal.type === "Breakfast" ? "bg-orange-400" :
                          meal.type === "Lunch" ? "bg-yellow-400" :
                          meal.type === "Dinner" ? "bg-blue-400" : "bg-purple-400"
                        }`} />
                        <span className="font-bold text-white text-lg">{meal.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-medium">{meal.calories} kcal</span>
                        <ChevronRight size={20} className="text-zinc-600" />
                      </div>
                    </button>
                  ))}
                  {currentDay.meals.length === 0 && (
                    <div className="p-6 text-center text-zinc-500">
                      No meals logged for this day.
                    </div>
                  )}
                </div>
              </section>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}