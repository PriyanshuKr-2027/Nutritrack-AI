import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, ArrowLeft, Check, Send } from "lucide-react";

interface ForgotPasswordViewProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function ForgotPasswordView({ onBack, onSubmit }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onSubmit();
      }, 2000);
    }, 500);
  };

  if (isSubmitted) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="triangles" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <polygon points="5,0 10,10 0,10" fill="#22c55e" opacity="0.3" />
              </pattern>
              <rect width="100" height="100" fill="url(#triangles)" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="triangles2" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <polygon points="5,0 10,10 0,10" fill="#22c55e" opacity="0.3" />
              </pattern>
              <rect width="100" height="100" fill="url(#triangles2)" />
            </svg>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 relative z-10"
        >
          <Check size={40} className="text-black" strokeWidth={3} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center bg-zinc-900 rounded-3xl shadow-2xl p-8 max-w-sm relative z-10 border border-zinc-800"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-zinc-400 text-sm mb-1">Reset link sent to</p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <button
            onClick={onBack}
            className="text-green-500 hover:text-green-400 text-sm font-semibold"
          >
            Back to Log in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="triangles" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <polygon points="5,0 10,10 0,10" fill="#22c55e" opacity="0.3" />
            </pattern>
            <rect width="100" height="100" fill="url(#triangles)" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="triangles2" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <polygon points="5,0 10,10 0,10" fill="#22c55e" opacity="0.3" />
            </pattern>
            <rect width="100" height="100" fill="url(#triangles2)" />
          </svg>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Card */}
          <div className="bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-800">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <ArrowLeft size={20} className="text-zinc-400" />
              </button>
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            </div>

            <p className="text-sm text-zinc-400 mb-6">Enter your email to receive a reset link</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email<span className="text-green-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joe.doe@email.com"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                  {email && (
                    <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={18} />
                    Send Reset Link
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
