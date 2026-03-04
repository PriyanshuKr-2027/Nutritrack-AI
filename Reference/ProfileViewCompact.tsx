import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft,
  Scale, 
  Target, 
  Activity, 
  Bell, 
  Globe, 
  LogOut, 
  Camera,
  Shield,
  Ruler,
  User,
  Moon,
  Mail,
  HelpCircle,
  Lock
} from "lucide-react";

interface ProfileViewCompactProps {
  onLogout?: () => void;
}

type Screen = "main" | "body" | "activity" | "notifications" | "preferences" | "account";

export function ProfileViewCompact({ onLogout }: ProfileViewCompactProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");

  // Mock user data
  const userData = {
    name: "Priyanshu Kumar",
    email: "priyanshu@nutritrack.com",
    stats: {
      height: "175 cm",
      weight: "72 kg",
      age: "28 years",
      gender: "Male"
    },
    goal: {
      type: "Weight Loss",
      target: "68 kg",
    },
    activityLevel: "Moderately Active"
  };

  // All state hooks at the top (before any conditional returns)
  const [notifications, setNotifications] = useState({
    meals: true,
    water: true,
    achievements: true,
    weekly: false,
    updates: false
  });

  const [activity, setActivity] = useState(userData.activityLevel);

  // Main Profile Screen
  if (currentScreen === "main") {
    return (
      <div className="h-full w-full bg-black text-white flex flex-col overflow-y-auto scrollbar-hide pb-24">
        {/* Simple Header */}
        <div className="px-6 pt-10 pb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="px-6 pb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-black shadow-lg shadow-green-500/20">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center border-2 border-zinc-900 shadow-lg active:scale-95 transition-transform">
                  <Camera size={14} className="text-black" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{userData.name}</h2>
                <p className="text-sm text-zinc-500 truncate">{userData.email}</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Weight" value={userData.stats.weight} />
              <StatPill label="Height" value={userData.stats.height} />
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="px-6 space-y-2">
          <SettingButton 
            icon={Target} 
            label="Body & Goals" 
            onClick={() => setCurrentScreen("body")}
          />
          <SettingButton 
            icon={Activity} 
            label="Activity Level" 
            value={userData.activityLevel}
            onClick={() => setCurrentScreen("activity")}
          />
          <SettingButton 
            icon={Bell} 
            label="Notifications" 
            onClick={() => setCurrentScreen("notifications")}
          />
          <SettingButton 
            icon={Globe} 
            label="Preferences" 
            onClick={() => setCurrentScreen("preferences")}
          />
          <SettingButton 
            icon={Shield} 
            label="Account & Privacy" 
            onClick={() => setCurrentScreen("account")}
          />
        </div>

        {/* Logout */}
        <div className="px-6 mt-8">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl active:bg-red-500/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-red-500" />
              <span className="font-semibold text-red-500">Log Out</span>
            </div>
            <ChevronRight size={20} className="text-red-500/50" />
          </button>
        </div>
      </div>
    );
  }

  // Body & Goals Screen
  if (currentScreen === "body") {
    return (
      <ScreenContainer title="Body & Goals" onBack={() => setCurrentScreen("main")}>
        <div className="space-y-3">
          <EditableRow icon={Scale} label="Current Weight" value={userData.stats.weight} />
          <EditableRow icon={Ruler} label="Height" value={userData.stats.height} />
          <EditableRow icon={User} label="Age" value={userData.stats.age} />
          <EditableRow icon={User} label="Gender" value={userData.stats.gender} />
          <EditableRow icon={Target} label="Goal" value={userData.goal.type} />
          <EditableRow icon={Target} label="Target Weight" value={userData.goal.target} />
        </div>
      </ScreenContainer>
    );
  }

  // Activity Level Screen
  if (currentScreen === "activity") {
    return (
      <ScreenContainer title="Activity Level" onBack={() => setCurrentScreen("main")}>
        <div className="space-y-3">
          <ActivityOption
            title="Sedentary"
            description="Little to no exercise"
            selected={activity === "Sedentary"}
            onClick={() => setActivity("Sedentary")}
          />
          <ActivityOption
            title="Lightly Active"
            description="Exercise 1-3 days/week"
            selected={activity === "Lightly Active"}
            onClick={() => setActivity("Lightly Active")}
          />
          <ActivityOption
            title="Moderately Active"
            description="Exercise 3-5 days/week"
            selected={activity === "Moderately Active"}
            onClick={() => setActivity("Moderately Active")}
          />
          <ActivityOption
            title="Very Active"
            description="Exercise 6-7 days/week"
            selected={activity === "Very Active"}
            onClick={() => setActivity("Very Active")}
          />
        </div>
      </ScreenContainer>
    );
  }

  // Notifications Screen
  if (currentScreen === "notifications") {
    return (
      <ScreenContainer title="Notifications" onBack={() => setCurrentScreen("main")}>
        <div className="space-y-3">
          <ToggleRow 
            label="Meal Reminders" 
            value={notifications.meals}
            onChange={(val) => setNotifications({...notifications, meals: val})}
          />
          <ToggleRow 
            label="Water Reminders" 
            value={notifications.water}
            onChange={(val) => setNotifications({...notifications, water: val})}
          />
          <ToggleRow 
            label="Goal Achievements" 
            value={notifications.achievements}
            onChange={(val) => setNotifications({...notifications, achievements: val})}
          />
          <ToggleRow 
            label="Weekly Reports" 
            value={notifications.weekly}
            onChange={(val) => setNotifications({...notifications, weekly: val})}
          />
          <ToggleRow 
            label="App Updates" 
            value={notifications.updates}
            onChange={(val) => setNotifications({...notifications, updates: val})}
          />
        </div>
      </ScreenContainer>
    );
  }

  // Preferences Screen
  if (currentScreen === "preferences") {
    return (
      <ScreenContainer title="Preferences" onBack={() => setCurrentScreen("main")}>
        <div className="space-y-3">
          <EditableRow icon={Globe} label="Units" value="Metric (kg, cm)" />
          <EditableRow icon={Moon} label="Theme" value="Dark" />
          <EditableRow icon={Globe} label="Language" value="English" />
        </div>
      </ScreenContainer>
    );
  }

  // Account & Privacy Screen
  if (currentScreen === "account") {
    return (
      <ScreenContainer title="Account & Privacy" onBack={() => setCurrentScreen("main")}>
        <div className="space-y-3">
          <EditableRow icon={Mail} label="Email" value={userData.email} />
          <EditableRow icon={Lock} label="Change Password" value="" />
          <EditableRow icon={Shield} label="Privacy Policy" value="" />
          <EditableRow icon={HelpCircle} label="Help & Support" value="" />
        </div>
      </ScreenContainer>
    );
  }

  return null;
}

// Reusable Screen Container
function ScreenContainer({ 
  title, 
  onBack, 
  children 
}: { 
  title: string; 
  onBack: () => void; 
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full bg-black text-white flex flex-col overflow-y-auto scrollbar-hide pb-24"
    >
      {/* Header with Back Button */}
      <div className="px-6 pt-10 pb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 mb-4 active:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>

      {/* Content */}
      <div className="px-6">
        {children}
      </div>
    </motion.div>
  );
}

// Simplified Components
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 rounded-xl px-4 py-3 border border-zinc-800">
      <div className="text-zinc-500 text-xs mb-1">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

function SettingButton({ 
  icon: Icon, 
  label,
  value,
  onClick
}: { 
  icon: any; 
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl active:bg-zinc-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-zinc-500" />
        <span className="text-white font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-zinc-500 text-sm">{value}</span>}
        <ChevronRight size={18} className="text-zinc-600" />
      </div>
    </button>
  );
}

function EditableRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: any; 
  label: string; 
  value: string;
}) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl active:bg-zinc-800 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-zinc-500" />
        <span className="text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-zinc-400 text-sm">{value}</span>}
        <ChevronRight size={16} className="text-zinc-600" />
      </div>
    </button>
  );
}

function ActivityOption({
  title,
  description,
  selected,
  onClick
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all border ${
        selected
          ? "bg-green-500/10 border-green-500"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white text-sm mb-1">{title}</div>
          <div className="text-xs text-zinc-500">{description}</div>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 bg-black rounded-full" />
          </div>
        )}
      </div>
    </button>
  );
}

function ToggleRow({ 
  label, 
  value,
  onChange
}: { 
  label: string; 
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <span className="text-white">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          value ? "bg-green-500" : "bg-zinc-700"
        }`}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
        />
      </button>
    </div>
  );
}