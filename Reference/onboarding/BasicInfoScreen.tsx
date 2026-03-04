import React, { useState } from "react";

interface BasicInfoScreenProps {
  onContinue: (data: { name: string; age: string; gender: "male" | "female" | "other" }) => void;
  currentStep: number;
  totalSteps: number;
}

export function BasicInfoScreen({ onContinue, currentStep, totalSteps }: BasicInfoScreenProps) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = dob ? calculateAge(dob) : 0;
  const isValid = name.trim() && dob.trim() && age > 0 && age < 120;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col px-6">
      {/* Progress Indicator */}
      <div className="pt-8 pb-6">
        <p className="text-xs text-zinc-500 text-center font-medium uppercase tracking-wider">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        <h1 className="text-3xl font-bold mb-8">Tell us about you</h1>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Date of Birth Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          {dob && age > 0 && (
            <p className="text-xs text-zinc-500 mt-2">Age: {age} years</p>
          )}
        </div>

        {/* Gender Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-3">Gender</label>
          <div className="flex gap-3">
            <button
              onClick={() => setGender("male")}
              className={`flex-1 py-4 rounded-2xl font-medium transition-all ${
                gender === "male"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800"
              }`}
            >
              Male
            </button>
            <button
              onClick={() => setGender("female")}
              className={`flex-1 py-4 rounded-2xl font-medium transition-all ${
                gender === "female"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800"
              }`}
            >
              Female
            </button>
            <button
              onClick={() => setGender("other")}
              className={`flex-1 py-4 rounded-2xl font-medium transition-all ${
                gender === "other"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800"
              }`}
            >
              Other
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pb-8 pt-4">
        <button
          onClick={() => onContinue({ name, age: age.toString(), gender })}
          disabled={!isValid}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-zinc-800 active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}