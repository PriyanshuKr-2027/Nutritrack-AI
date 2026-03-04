import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";

interface LoginViewProps {
  onLogin: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => void;
}

export function LoginView({ onLogin, onSignUp, onForgotPassword, onGoogleSignIn }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 500);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onGoogleSignIn();
    }, 500);
  };

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
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <ArrowLeft size={20} className="text-zinc-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Log in</h1>
            </div>

            {/* Social Buttons */}
            <div className="mb-6">
              <p className="text-sm text-zinc-400 mb-3">Or continue with</p>
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium text-white"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Password<span className="text-green-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-green-500 focus:ring-green-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-zinc-400">Remember info</span>
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-green-500 hover:text-green-400 font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-green-500/20 mt-6"
              >
                {isLoading ? "Logging in..." : "Log in"}
              </motion.button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-zinc-400 pt-2">
                First time here?{" "}
                <button
                  type="button"
                  onClick={onSignUp}
                  className="text-green-500 hover:text-green-400 font-semibold"
                >
                  Sign up for free
                </button>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}