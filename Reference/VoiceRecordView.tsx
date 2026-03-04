import React, { useState, useEffect } from "react";
import { X, Mic, Square, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceRecordViewProps {
  onClose: () => void;
  onComplete: (transcript: string) => void;
}

type RecordingState = "idle" | "recording" | "processing" | "complete";

export function VoiceRecordView({ onClose, onComplete }: VoiceRecordViewProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  // Timer for recording duration
  useEffect(() => {
    if (state === "recording") {
      const interval = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleStartRecording = () => {
    setState("recording");
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setState("processing");
    
    // Simulate transcription processing
    setTimeout(() => {
      const mockTranscript = "I had 2 samosas and 1 plate of chowmein for lunch";
      setTranscript(mockTranscript);
      setState("complete");
    }, 1500);
  };

  const handleRetry = () => {
    setState("idle");
    setTranscript("");
    setRecordingTime(0);
  };

  const handleConfirm = () => {
    onComplete(transcript);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[180] bg-black flex flex-col items-center justify-between overflow-hidden">
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
      <div className="flex-1 flex flex-col items-center justify-center w-full px-8">
        
        <AnimatePresence mode="wait">
          {/* Idle State */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Voice Log</h2>
                <p className="text-zinc-400">Tap the mic to describe your meal</p>
              </div>

              <button
                onClick={handleStartRecording}
                className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-black active:scale-95 transition-transform shadow-[0_0_40px_-8px_rgba(34,197,94,0.6)]"
              >
                <Mic size={40} />
              </button>

              <p className="text-xs text-zinc-600 mt-8 max-w-xs">
                Example: "I had 2 samosas and a cup of tea"
              </p>
            </motion.div>
          )}

          {/* Recording State */}
          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {/* Waveform Animation */}
              <div className="mb-8 flex items-center justify-center gap-2 h-32">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-green-500 rounded-full"
                    animate={{
                      height: ["20%", "100%", "40%", "80%", "30%"],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              <div className="mb-8">
                <p className="text-4xl font-bold tabular-nums text-green-400 mb-2">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-zinc-400 animate-pulse">Listening...</p>
              </div>

              <button
                onClick={handleStopRecording}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white active:scale-95 transition-transform shadow-[0_0_30px_-8px_rgba(239,68,68,0.6)]"
              >
                <Square size={28} fill="white" />
              </button>
            </motion.div>
          )}

          {/* Processing State */}
          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-zinc-800 border-t-green-500 rounded-full mx-auto mb-6"
              />
              <p className="text-xl font-semibold text-white mb-2">Processing...</p>
              <p className="text-sm text-zinc-500">Converting speech to text</p>
            </motion.div>
          )}

          {/* Complete State */}
          {state === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="mb-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                  <Mic size={28} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Recording Complete</h2>
                <p className="text-sm text-zinc-500">Review your transcript below</p>
              </div>

              {/* Transcript Display */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
                <p className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-3">Transcript</p>
                <p className="text-base leading-relaxed text-white">
                  "{transcript}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Retry
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-[2] py-4 bg-green-500 text-black font-semibold rounded-2xl active:scale-[0.98] transition-transform"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Safe Area */}
      <div className="pb-safe" />
    </div>
  );
}
