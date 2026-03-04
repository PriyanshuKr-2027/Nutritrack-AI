import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const loadingMessages = [
  "Calculating calorie needs…",
  "Balancing macros…",
  "Optimizing for sustainability…",
];

interface PlanCalculationScreenProps {
  onComplete: () => void;
}

export function PlanCalculationScreen({ onComplete }: PlanCalculationScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Rotate messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 600);

    // Complete after 1.2 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="h-full w-full bg-black text-white flex flex-col items-center justify-center px-8">
      {/* Loading Animation */}
      <div className="mb-8">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-3 text-center">
        Creating your plan…
      </h1>

      {/* Subtitle */}
      <p className="text-zinc-500 text-center mb-8">
        Calculating your calorie target and macro balance
      </p>

      {/* Rotating Messages */}
      <div className="h-6 relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-zinc-600 absolute inset-0 text-center"
          >
            {loadingMessages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}