import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: 'food' | 'search' | 'history' | 'default';
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustration = 'default'
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-8 py-12 text-center"
    >
      {/* Animated Icon Container */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className="relative mb-6"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl scale-150" />
        
        {/* Icon Circle */}
        <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center border-2 border-zinc-700/50">
          <Icon size={40} className="text-green-500" strokeWidth={1.5} />
        </div>

        {/* Decorative Dots */}
        <motion.div
          animate={{ 
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-green-500/30 rounded-full -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500/20 rounded-full" />
          <div className="absolute top-1/2 left-0 w-1 h-1 bg-green-500/40 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-8"
      >
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          {description}
        </p>
      </motion.div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onAction}
          className="bg-green-500 text-black font-bold px-8 py-3.5 rounded-full active:scale-95 transition-transform"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

// Preset Empty States
export function NoMealsEmptyState({ onAddMeal }: { onAddMeal: () => void }) {
  const Icon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <EmptyState
      icon={Icon as LucideIcon}
      title="No Meals Logged Yet"
      description="Start tracking your nutrition by logging your first meal. Tap the camera button to get started!"
      actionLabel="Log Your First Meal"
      onAction={onAddMeal}
    />
  );
}

export function NoResultsEmptyState({ onClear }: { onClear?: () => void }) {
  const Icon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 8v6M8 11h6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <EmptyState
      icon={Icon as LucideIcon}
      title="No Results Found"
      description="We couldn't find any meals matching your search. Try adjusting your filters or search terms."
      actionLabel={onClear ? "Clear Filters" : undefined}
      onAction={onClear}
    />
  );
}

export function NoDayDataEmptyState({ date, onAddMeal }: { date: string; onAddMeal: () => void }) {
  const Icon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <EmptyState
      icon={Icon as LucideIcon}
      title="No Meals This Day"
      description={`You haven't logged any meals for ${date}. Add your meals to track your nutrition.`}
      actionLabel="Add Meal"
      onAction={onAddMeal}
    />
  );
}
