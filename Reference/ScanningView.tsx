import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Sparkles, Check, Loader2 } from "lucide-react";
import exampleImage from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";

interface ScanningViewProps {
  onClose: () => void;
  onComplete: () => void;
  onTimeout?: () => void;
  capturedImage?: string;
}

export function ScanningView({ onClose, onComplete, onTimeout, capturedImage }: ScanningViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  
  const steps = [
    { label: "Photo validated", key: "validate" },
    { label: "Identifying foods...", key: "identify" },
    { label: "Looking up nutrition...", key: "nutrition" }
  ];

  // Step progression
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);
    
    return () => clearInterval(stepInterval);
  }, []);

  // Timeout after 10 seconds
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
      if (onTimeout) {
        setTimeout(() => onTimeout(), 2000); // Show message for 2s before fallback
      }
    }, 10000);
    
    return () => clearTimeout(timeoutTimer);
  }, [onTimeout]);

  // Auto-transition after all steps complete (if no timeout)
  useEffect(() => {
    if (currentStep === steps.length - 1 && !timedOut) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, timedOut, onComplete]);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-between overflow-hidden">
      {/* Top Bar */}
      <div className="w-full p-6 pt-safe flex justify-start z-20">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-white active:bg-zinc-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-20 w-full px-8">
        
        {/* Scanning Container */}
        <div className="relative mb-12">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-green-500/20 blur-[60px] rounded-full scale-125 pointer-events-none" />
          
          {/* Pulsing Image Container */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900 z-10"
          >
            <img 
              src={capturedImage || exampleImage} 
              alt="Food Scanning" 
              className="w-full h-full object-cover"
            />
            
            {/* Scanning Light Sweep */}
            <motion.div
              animate={{ top: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent w-full pointer-events-none"
            />
          </motion.div>
          
          {/* Rotating Ring */}
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute -inset-4 rounded-full border border-green-500/30 border-dashed pointer-events-none z-0"
           />
        </div>

        {/* Status Message / Step Indicators */}
        <div className="w-full max-w-sm space-y-6 z-20">
          {/* Timeout Message */}
          {timedOut && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center"
            >
              <div className="text-zinc-400 mb-3">Taking longer than expected...</div>
              <div className="text-white font-bold">Switching to manual entry</div>
            </motion.div>
          )}

          {/* Step Indicators */}
          {!timedOut && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              {steps.map((step, index) => {
                const isComplete = index < currentStep;
                const isActive = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isComplete 
                        ? 'bg-green-500 text-black' 
                        : isActive 
                        ? 'bg-zinc-800 text-green-500 border-2 border-green-500' 
                        : 'bg-zinc-800 text-zinc-600 border-2 border-zinc-700'
                    }`}>
                      {isComplete ? (
                        <Check size={14} strokeWidth={3} />
                      ) : isActive ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`text-sm font-medium transition-colors ${
                      isComplete 
                        ? 'text-white' 
                        : isActive 
                        ? 'text-green-400' 
                        : 'text-zinc-500'
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      <div className="w-full px-6 pb-safe pb-8 z-20">
        <button
          onClick={onClose}
          className="w-full py-4 text-center text-zinc-400 font-medium active:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}