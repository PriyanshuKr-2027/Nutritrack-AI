import React from "react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="h-full w-full bg-black text-white flex flex-col items-center justify-center px-8">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Track smarter.<br />Eat better.
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Personalized nutrition built around your goals.
        </p>
      </div>
      
      <div className="w-full max-w-md pb-12">
        <button
          onClick={onStart}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl active:scale-[0.98] transition-transform"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
