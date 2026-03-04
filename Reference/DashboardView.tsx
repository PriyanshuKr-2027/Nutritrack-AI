import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Camera, ScanLine, PenLine, Plus, X, ChevronRight, MoreHorizontal, Mic } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { StreakScreen } from "./StreakScreen";
import imgOatmeal from "figma:asset/711ce1a0b5e57e5ebbc9b3b2b218a224fdb20212.png"; // Placeholder for oatmeal
import imgSalad from "figma:asset/0f0442c993d068ee043387a879949a69358b54ee.png"; // Placeholder for salad

// Circular Progress Component
const CircularProgress = ({ value, max, size = 200, strokeWidth = 15 }: { value: number; max: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = value / max;
  const dashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1f2937" // zinc-800
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Foreground Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22c55e" // green-500
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-zinc-500 text-sm font-medium">kcal</span>
      </div>
    </div>
  );
};

// Meal Item Component
const MealItem = ({ title, sub, time, cal, img }: { title: string; sub: string; time: string; cal: number; img: string }) => (
  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 mb-3">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
        <img src={img} alt={title} className="w-full h-full object-cover" />
      </div>
      <div>
        <h4 className="font-bold text-white text-sm">{title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-xs text-zinc-400">{sub} • {time}</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <span className="text-white font-bold">{cal}</span>
      <span className="text-[10px] text-zinc-500 font-bold uppercase">Kcal</span>
    </div>
  </div>
);

export function DashboardView({ onOpenCam, onOpenSearch, onOpenScanLabel, onOpenDayDetail, onOpenVoice }: { onOpenCam?: () => void; onOpenSearch?: () => void; onOpenScanLabel?: () => void; onOpenDayDetail?: () => void; onOpenVoice?: () => void }) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showStreakScreen, setShowStreakScreen] = useState(false);

  // FAB Toggle
  const toggleFab = () => setIsFabOpen(!isFabOpen);

  return (
    <div className="relative pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-wide">NutriTrack</h1>
        <button 
          onClick={() => setShowStreakScreen(true)}
          className="flex items-center gap-1.5 bg-[#2a1705] border border-orange-900/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          <Flame size={16} className="text-orange-500 fill-orange-500" />
          <span className="text-orange-400 text-sm font-bold">3d</span>
        </button>
      </div>

      <div className="px-6 space-y-6">
        {/* Calorie Card */}
        <div className="bg-zinc-900 rounded-[32px] p-8 flex flex-col items-center justify-center relative shadow-sm border border-zinc-800/50">
           {/* Custom Gradient Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-500/10 blur-[50px] rounded-full pointer-events-none"></div>
           
           <CircularProgress value={1250} max={2500} />
           <p className="mt-4 text-zinc-500 font-medium text-sm">of 2,500 kcal goal</p>
        </div>

        {/* Macros Card */}
        <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Macros</h3>
            <button 
              onClick={onOpenDayDetail} 
              className="text-green-500 text-xs font-bold hover:text-green-400"
            >
              View Details
            </button>
          </div>

          <div className="space-y-5">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-300 font-medium">Protein</span>
                <div>
                  <span className="text-white font-bold">80g</span>
                  <span className="text-zinc-600"> / 140g</span>
                </div>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-[57%] rounded-full" />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-300 font-medium">Carbs</span>
                <div>
                  <span className="text-white font-bold">240g</span>
                  <span className="text-zinc-600"> / 320g</span>
                </div>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 w-[75%] rounded-full" />
              </div>
            </div>

             {/* Fat */}
             <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-300 font-medium">Fat</span>
                <div>
                  <span className="text-white font-bold">45g</span>
                  <span className="text-zinc-600"> / 75g</span>
                </div>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Meals Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Today's Meals</h3>
            <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <MealItem 
            title="Oatmeal & Berries"
            sub="Breakfast"
            time="8:00 AM"
            cal={350}
            img="https://images.unsplash.com/photo-1605782495071-f81088a16be8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvYXRtZWFsJTIwd2l0aCUyMGJlcnJpZXMlMjBib3dsJTIwZGFyayUyMG1vb2R5fGVufDF8fHx8MTc3MDE0NjYyOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          />
          <MealItem 
            title="Grilled Chicken Salad"
            sub="Lunch"
            time="12:30 PM"
            cal={550}
            img="https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMHNhbGFkJTIwYm93bCUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc3MDE0NjYzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          />
        </div>
      </div>

      {/* FAB Overlay & Menu */}
      <AnimatePresence>
        {isFabOpen && (
          <>
            {/* Dim Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleFab}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-[2px]"
            />
            
            {/* FAB Options */}
            <div className="fixed bottom-[170px] right-6 z-50 flex flex-col items-end gap-5 pointer-events-none">
              <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.8 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.8 }}
                 transition={{ delay: 0.05 }}
                 className="flex items-center gap-4 pointer-events-auto"
              >
                <span className="text-white font-bold text-base tracking-wide drop-shadow-md">Manual Add</span>
                <motion.button 
                  onClick={() => {
                    onOpenSearch?.();
                    setIsFabOpen(false);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white border border-zinc-700 shadow-xl shadow-black/50"
                >
                   <PenLine size={24} />
                </motion.button>
              </motion.div>

              <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.8 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.8 }}
                 transition={{ delay: 0.1 }}
                 className="flex items-center gap-4 pointer-events-auto"
              >
                <span className="text-white font-bold text-base tracking-wide drop-shadow-md">Scan Label</span>
                <motion.button 
                  onClick={onOpenScanLabel}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white border border-zinc-700 shadow-xl shadow-black/50"
                >
                  <ScanLine size={24} />
                </motion.button>
              </motion.div>

              <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.8 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.8 }}
                 transition={{ delay: 0.15 }}
                 className="flex items-center gap-4 pointer-events-auto"
              >
                <span className="text-white font-bold text-base tracking-wide drop-shadow-md">Mic</span>
                <motion.button 
                  onClick={() => {
                    onOpenVoice?.();
                    setIsFabOpen(false);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white border border-zinc-700 shadow-xl shadow-black/50"
                >
                  <Mic size={24} />
                </motion.button>
              </motion.div>

              <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.8 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.8 }}
                 transition={{ delay: 0.2 }}
                 className="flex items-center gap-4 pointer-events-auto"
              >
                <span className="text-white font-bold text-base tracking-wide drop-shadow-md">Camera</span>
                <motion.button 
                  onClick={() => {
                    onOpenCam?.();
                    setIsFabOpen(false);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white border border-zinc-700 shadow-xl shadow-black/50"
                >
                  <Camera size={24} />
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={toggleFab}
        animate={{ rotate: isFabOpen ? 135 : 0 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className={`fixed bottom-[96px] right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-green-900/20 z-50 transition-colors duration-300 ${
          isFabOpen ? "bg-green-500 text-black" : "bg-green-500 text-black"
        }`}
      >
        <Plus size={32} strokeWidth={2.5} />
      </motion.button>

      {/* Streak Screen */}
      <StreakScreen 
        isOpen={showStreakScreen}
        onClose={() => setShowStreakScreen(false)}
        currentStreak={3}
        longestStreak={14}
        daysThisWeek={5}
        totalDaysLogged={42}
      />

    </div>
  );
}