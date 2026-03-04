import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Utensils, Sparkles, Target, TrendingUp } from "lucide-react";

interface LandingScreenProps {
  onComplete: () => void;
}

export function LandingScreen({ onComplete }: LandingScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => clearTimeout(contentTimer);
  }, []);

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-between overflow-hidden relative">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1.2 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-green-500/40 to-emerald-600/40 blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1.1 }}
          transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30 blur-[100px]"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 z-10 w-full">
        {/* Logo Icon with Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="mb-8"
        >
          <div className="relative">
            {/* Pulsing Ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
            />
            
            {/* Icon Container */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/50">
              <Utensils size={48} className="text-black" strokeWidth={2.5} />
            </div>
          </div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            NutriTrack
          </h1>
          <p className="text-zinc-400 text-lg">Your Personal Nutrition Companion</p>
        </motion.div>

        {/* Feature Pills */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 max-w-sm mb-12"
          >
            <FeaturePill icon={Sparkles} label="AI-Powered" delay={1.1} />
            <FeaturePill icon={Target} label="Goal Tracking" delay={1.2} />
            <FeaturePill icon={TrendingUp} label="Progress Insights" delay={1.3} />
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="w-full px-8 pb-12 z-10"
      >
        <button
          onClick={onComplete}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg py-5 rounded-full shadow-2xl shadow-green-500/30 active:scale-95 transition-transform"
        >
          Get Started
        </button>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center text-zinc-500 text-sm mt-4"
        >
          Track your nutrition journey with ease
        </motion.p>
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100
            }}
            animate={{
              opacity: [0, 0.6, 0],
              y: -100,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: 1.5 + Math.random() * 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
              ease: "linear"
            }}
            className="absolute w-2 h-2 bg-green-500/40 rounded-full blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FeaturePill({ 
  icon: Icon, 
  label, 
  delay 
}: { 
  icon: any; 
  label: string; 
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-full px-4 py-2"
    >
      <Icon size={16} className="text-green-500" />
      <span className="text-sm font-medium text-zinc-300">{label}</span>
    </motion.div>
  );
}
