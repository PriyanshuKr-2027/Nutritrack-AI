import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flame, TrendingUp, Calendar, Award, Target, Zap } from "lucide-react";
import { haptics } from "../utils/haptics";

interface StreakScreenProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  daysThisWeek: number;
  totalDaysLogged: number;
}

export function StreakScreen({ 
  isOpen, 
  onClose, 
  currentStreak, 
  longestStreak, 
  daysThisWeek,
  totalDaysLogged 
}: StreakScreenProps) {
  if (!isOpen) return null;

  // Calculate achievements
  const achievements = [
    { id: 1, name: "First Steps", description: "Log your first meal", unlocked: totalDaysLogged >= 1, icon: Target },
    { id: 2, name: "3-Day Warrior", description: "Maintain a 3-day streak", unlocked: longestStreak >= 3, icon: Zap },
    { id: 3, name: "Week Champion", description: "Log meals for 7 days straight", unlocked: longestStreak >= 7, icon: Award },
    { id: 4, name: "Consistency King", description: "Reach a 14-day streak", unlocked: longestStreak >= 14, icon: TrendingUp },
    { id: 5, name: "Month Master", description: "Complete a 30-day streak", unlocked: longestStreak >= 30, icon: Crown },
    { id: 6, name: "Dedicated Logger", description: "Log 100 total days", unlocked: totalDaysLogged >= 100, icon: Calendar },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-6 relative">
          <button
            onClick={() => {
              haptics.tap();
              onClose();
            }}
            className="absolute left-4 top-8 p-2 -ml-2 active:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
          <h1 className="text-xl font-semibold text-center text-white tracking-tight">Your Streak</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Main Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 rounded-3xl p-8 relative overflow-hidden"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-10">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Flame Icon */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex mb-4"
              >
                <Flame size={48} className="text-orange-500" fill="currentColor" />
              </motion.div>

              {/* Streak Number */}
              <motion.div
                key={currentStreak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="text-7xl font-black text-white leading-none mb-2">{currentStreak}</div>
                <p className="text-xl text-orange-400 font-bold uppercase tracking-wider">
                  Day{currentStreak !== 1 ? 's' : ''} Streak
                </p>
              </motion.div>

              {/* Motivational Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-orange-500/30"
              >
                <p className="text-sm text-zinc-300">
                  {currentStreak === 0 && "Start your streak today! 🚀"}
                  {currentStreak > 0 && currentStreak < 3 && "Great start! Keep the momentum going 💪"}
                  {currentStreak >= 3 && currentStreak < 7 && "You're building a habit! Stay consistent 🎯"}
                  {currentStreak >= 7 && currentStreak < 14 && "One week strong! You're unstoppable 🚀"}
                  {currentStreak >= 14 && currentStreak < 30 && "Two weeks! You're a tracking champion 🏆"}
                  {currentStreak >= 30 && "Incredible! A full month of dedication 🌟"}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
                <TrendingUp size={24} className="text-orange-500" />
              </div>
              <p className="text-sm text-zinc-400 mb-1">Longest Streak</p>
              <p className="text-3xl font-black text-white">{longestStreak}</p>
              <p className="text-xs text-zinc-500 mt-1">days</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                <Calendar size={24} className="text-green-500" />
              </div>
              <p className="text-sm text-zinc-400 mb-1">This Week</p>
              <p className="text-3xl font-black text-white">{daysThisWeek}<span className="text-lg text-zinc-600">/7</span></p>
              <p className="text-xs text-zinc-500 mt-1">days logged</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 col-span-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Total Days Logged</p>
                  <p className="text-3xl font-black text-white">{totalDaysLogged}</p>
                </div>
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Calendar size={28} className="text-blue-500" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Weekly Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-sm font-bold text-white mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                const isLogged = index < daysThisWeek;
                const isToday = index === daysThisWeek - 1;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (index * 0.05) }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center ${
                      isLogged 
                        ? 'bg-green-500/20 border-2 border-green-500/50' 
                        : 'bg-zinc-900 border-2 border-zinc-800'
                    } ${isToday ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : ''}`}
                  >
                    <p className="text-xs font-medium text-zinc-400 mb-1">{day}</p>
                    {isLogged && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Flame size={14} className="text-green-500" fill="currentColor" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Achievements</h3>
              <span className="text-xs text-zinc-500 font-medium">{unlockedCount}/{achievements.length} unlocked</span>
            </div>
            <div className="space-y-3">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + (index * 0.05) }}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
                      achievement.unlocked
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-zinc-900/50 border-zinc-800 opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      achievement.unlocked ? 'bg-green-500/20' : 'bg-zinc-800'
                    }`}>
                      <Icon size={20} className={achievement.unlocked ? 'text-green-500' : 'text-zinc-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${achievement.unlocked ? 'text-white' : 'text-zinc-500'}`}>
                        {achievement.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{achievement.description}</p>
                    </div>
                    {achievement.unlocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                      >
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Crown({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2.5 16L4 7L8.5 10.5L12 4L15.5 10.5L20 7L21.5 16H2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}