import React from "react";
import { motion } from "motion/react";
import { AlertCircle, Camera, Wifi, XCircle, RefreshCw } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'camera' | 'network' | 'scanning' | 'generic';
  onRetry?: () => void;
  onManualEntry?: () => void;
}

export function ErrorModal({ isOpen, onClose, type, onRetry, onManualEntry }: ErrorModalProps) {
  if (!isOpen) return null;

  const errorConfig = {
    camera: {
      icon: Camera,
      title: "Camera Access Needed",
      description: "NutriTrack needs camera permission to scan your meals. Please enable camera access in your device settings.",
      primaryAction: "Open Settings",
      secondaryAction: "Enter Manually"
    },
    network: {
      icon: Wifi,
      title: "Connection Error",
      description: "We're having trouble connecting to the internet. Please check your connection and try again.",
      primaryAction: "Retry",
      secondaryAction: "Dismiss"
    },
    scanning: {
      icon: AlertCircle,
      title: "Scanning Failed",
      description: "We couldn't identify the food in your photo. You can try taking another photo or enter the details manually.",
      primaryAction: "Try Again",
      secondaryAction: "Enter Manually"
    },
    generic: {
      icon: XCircle,
      title: "Something Went Wrong",
      description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      primaryAction: "Try Again",
      secondaryAction: "Dismiss"
    }
  };

  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-3rem)] max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 z-50 shadow-2xl"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <Icon size={32} className="text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-3">{config.title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Primary Action */}
          <button
            onClick={() => {
              if (type === 'camera') {
                // Open settings - this would typically be handled by native app
                window.alert('Please enable camera permission in your device settings');
              } else if (onRetry) {
                onRetry();
              }
              onClose();
            }}
            className="w-full bg-green-500 text-black font-bold py-4 rounded-full active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {type === 'network' || type === 'scanning' || type === 'generic' ? (
              <RefreshCw size={18} />
            ) : null}
            {config.primaryAction}
          </button>

          {/* Secondary Action */}
          <button
            onClick={() => {
              if (type === 'camera' || type === 'scanning') {
                onManualEntry?.();
              }
              onClose();
            }}
            className="w-full bg-zinc-800 border border-zinc-700 text-white font-medium py-4 rounded-full active:scale-95 transition-transform"
          >
            {config.secondaryAction}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// Inline error component for smaller errors
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3"
    >
      <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-red-500 font-medium mt-2 underline"
          >
            Try Again
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Toast notification for quick feedback
export function ErrorToast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-4 right-4 z-50"
    >
      <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
        <XCircle size={20} />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="p-1">
          <XCircle size={18} />
        </button>
      </div>
    </motion.div>
  );
}
