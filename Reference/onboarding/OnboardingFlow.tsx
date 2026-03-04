import React, { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { BasicInfoScreen } from "./BasicInfoScreen";
import { BodyStatsScreen } from "./BodyStatsScreen";
import { ActivityLevelScreen } from "./ActivityLevelScreen";
import { GoalSelectionScreen } from "./GoalSelectionScreen";
import { GoalInputScreen } from "./GoalInputScreen";
import { PlanCalculationScreen } from "./PlanCalculationScreen";
import { PlanRevealScreen } from "./PlanRevealScreen";
import { motion, AnimatePresence } from "motion/react";

type OnboardingStep =
  | "welcome"
  | "basicInfo"
  | "bodyStats"
  | "activity"
  | "goal"
  | "goalInput"
  | "calculation"
  | "planReveal";

type Goal = "lose" | "maintain" | "gain";
type ActivityLevel = "sedentary" | "light" | "moderate" | "very";

interface OnboardingData {
  name?: string;
  age?: string;
  gender?: "male" | "female" | "other";
  height?: string;
  weight?: string;
  unit?: "kg" | "lb";
  activityLevel?: ActivityLevel;
  goal?: Goal;
  targetWeight?: number;
  duration?: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [data, setData] = useState<OnboardingData>({});
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const totalSteps = data.goal === "maintain" ? 7 : 8;

  const getStepNumber = (): number => {
    const stepMap: Record<OnboardingStep, number> = {
      welcome: 0,
      basicInfo: 1,
      bodyStats: 2,
      activity: 3,
      goal: 4,
      goalInput: 5,
      calculation: 6,
      planReveal: 7,
    };
    return stepMap[currentStep];
  };

  const goToStep = (step: OnboardingStep, forward = true) => {
    setDirection(forward ? 1 : -1);
    setCurrentStep(step);
  };

  // Calculate personalized plan based on data
  const calculatePlan = () => {
    const weight = Number(data.weight) || 70;
    const height = Number(data.height) || 170;
    const age = Number(data.age) || 30;
    
    // Basic BMR calculation (Mifflin-St Jeor)
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (data.gender === "male") bmr += 5;
    else if (data.gender === "female") bmr -= 161;
    else bmr -= 78; // Average

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
    };
    const multiplier = activityMultipliers[data.activityLevel || "moderate"];
    let calories = Math.round(bmr * multiplier);

    // Adjust based on goal
    if (data.goal === "lose") {
      calories -= 500; // 500 cal deficit
    } else if (data.goal === "gain") {
      calories += 300; // 300 cal surplus
    }

    // Macro split (40/30/30 for balanced approach)
    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.4) / 4);
    const fat = Math.round((calories * 0.3) / 9);

    return {
      calories,
      protein,
      carbs,
      fat,
      goal: data.goal || "maintain",
      targetWeight: data.targetWeight,
      duration: data.duration,
    };
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="h-full w-full bg-black overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        {currentStep === "welcome" && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <WelcomeScreen onStart={() => goToStep("basicInfo")} />
          </motion.div>
        )}

        {currentStep === "basicInfo" && (
          <motion.div
            key="basicInfo"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <BasicInfoScreen
              onContinue={(basicData) => {
                setData({ ...data, ...basicData });
                goToStep("bodyStats");
              }}
              currentStep={getStepNumber()}
              totalSteps={totalSteps}
            />
          </motion.div>
        )}

        {currentStep === "bodyStats" && (
          <motion.div
            key="bodyStats"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <BodyStatsScreen
              onContinue={(bodyData) => {
                setData({ ...data, ...bodyData });
                goToStep("activity");
              }}
              currentStep={getStepNumber()}
              totalSteps={totalSteps}
            />
          </motion.div>
        )}

        {currentStep === "activity" && (
          <motion.div
            key="activity"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <ActivityLevelScreen
              onContinue={(level) => {
                setData({ ...data, activityLevel: level });
                goToStep("goal");
              }}
              currentStep={getStepNumber()}
              totalSteps={totalSteps}
            />
          </motion.div>
        )}

        {currentStep === "goal" && (
          <motion.div
            key="goal"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <GoalSelectionScreen
              onContinue={(goal) => {
                setData({ ...data, goal });
                goToStep("goalInput");
              }}
              currentStep={getStepNumber()}
              totalSteps={totalSteps}
            />
          </motion.div>
        )}

        {currentStep === "goalInput" && (
          <motion.div
            key="goalInput"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <GoalInputScreen
              goal={data.goal || "maintain"}
              currentWeight={Number(data.weight) || 70}
              onContinue={(goalData) => {
                setData({ ...data, ...goalData });
                goToStep("calculation");
              }}
              currentStep={getStepNumber()}
              totalSteps={totalSteps}
            />
          </motion.div>
        )}

        {currentStep === "calculation" && (
          <motion.div
            key="calculation"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <PlanCalculationScreen onComplete={() => goToStep("planReveal")} />
          </motion.div>
        )}

        {currentStep === "planReveal" && (
          <motion.div
            key="planReveal"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <PlanRevealScreen
              plan={calculatePlan()}
              onStart={onComplete}
              onAdjust={() => goToStep("goal", false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}