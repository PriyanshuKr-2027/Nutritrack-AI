import React from "react";
import { motion } from "motion/react";

// Skeleton for Dashboard Stats Cards
export function DashboardStatSkeleton() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4 animate-pulse">
      <div className="h-4 w-24 bg-zinc-800 rounded-lg" />
      <div className="h-8 w-32 bg-zinc-800 rounded-lg" />
      <div className="h-2 w-full bg-zinc-800 rounded-full" />
    </div>
  );
}

// Skeleton for Meal Card
export function MealCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-zinc-800 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-zinc-800 rounded-lg" />
          <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-4 w-4 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

// Skeleton for History Day Card
export function HistoryDaySkeleton() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-4 w-20 bg-zinc-800 rounded-lg mb-2" />
          <div className="h-3 w-32 bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-8 w-8 bg-zinc-800 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-zinc-800 rounded-lg mb-2" />
              <div className="h-3 w-16 bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for Profile Stats Grid
export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-zinc-800 rounded-full" />
            <div className="h-3 w-12 bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-5 w-20 bg-zinc-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Search Results
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-zinc-800 rounded-lg" />
              <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for Trends Chart
export function TrendsChartSkeleton() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 animate-pulse">
      <div className="h-5 w-32 bg-zinc-800 rounded-lg mb-6" />
      <div className="h-64 w-full bg-zinc-800 rounded-2xl" />
      <div className="flex justify-around mt-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-3 w-8 bg-zinc-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Shimmer effect wrapper
export function ShimmerWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Generic content skeleton
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-zinc-800 rounded-lg"
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
}
