import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  ChevronRight, 
  ChevronDown,
  Scale, 
  Ruler, 
  Target, 
  Activity, 
  Bell, 
  Moon, 
  Globe, 
  HelpCircle, 
  Shield, 
  LogOut, 
  Crown,
  Settings,
  Edit2,
  X,
  Camera,
  Check,
  Clock,
  Calendar
} from "lucide-react";
import { haptics } from "../utils/haptics";

interface ProfileViewProps {
  onLogout?: () => void;
}

export function ProfileView({ onLogout }: ProfileViewProps) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editName, setEditName] = useState("Priyanshu Kumar");
  const [editEmail, setEditEmail] = useState("Priyanshu@nutritrack.com");

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminders: true,
    mealAlerts: true,
    goalUpdates: false,
    breakfastTime: "08:00",
    lunchTime: "13:00",
    dinnerTime: "19:00",
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "07:00",
  });

  // Units & Language state
  const [unitsSettings, setUnitsSettings] = useState({
    weightUnit: "Kilograms (kg)",
    heightUnit: "Centimeters (cm)",
    energyUnit: "Kilocalories (kcal)",
    language: "English",
  });

  // Privacy & Security state
  const [privacySettings, setPrivacySettings] = useState({
    privateProfile: false,
    showInLeaderboard: true,
    dataSharing: false,
    biometricLock: false,
  });

  // Mock user data (in real app, this would come from state/API)
  const userData = {
    name: "Priyanshu Kumar",
    email: "Priyanshu@nutritrack.com",
    avatar: null, // Could be an image URL
    isPremium: true,
    stats: {
      height: "175 cm",
      weight: "72 kg",
      age: "28 years",
      gender: "Male"
    },
    goal: {
      type: "Weight Loss",
      target: "68 kg",
      weekly: "-0.5 kg/week"
    },
    activityLevel: "Moderately Active"
  };

  const handleSaveProfile = () => {
    // Save logic here
    setShowEditProfile(false);
  };

  const toggleSection = (section: string) => {
    haptics.tap();
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col relative overflow-y-auto scrollbar-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-white text-center">Profile</h1>
      </div>

      {/* Profile Header Card */}
      <div className="px-6 pt-2 pb-6 space-y-6">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
          {/* Profile Info */}
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-black">
                {userData.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-black active:scale-95 transition-transform">
                <Camera size={14} className="text-black" />
              </button>
            </div>

            {/* Name & Email */}
            <div className="flex-1 pt-2">
              <h2 className="text-xl font-bold text-white mb-1">{userData.name}</h2>
              <p className="text-sm text-zinc-400">{userData.email}</p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button 
            onClick={() => setShowEditProfile(true)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white font-medium py-3 rounded-xl active:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        </div>

        {/* Body Stats Section */}
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Body Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Ruler size={18} className="text-green-500" />
                </div>
                <span className="text-xs text-zinc-500 font-medium">Height</span>
              </div>
              <p className="text-lg font-bold text-white">{userData.stats.height}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Scale size={18} className="text-green-500" />
                </div>
                <span className="text-xs text-zinc-500 font-medium">Weight</span>
              </div>
              <p className="text-lg font-bold text-white">{userData.stats.weight}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <User size={18} className="text-green-500" />
                </div>
                <span className="text-xs text-zinc-500 font-medium">Age</span>
              </div>
              <p className="text-lg font-bold text-white">{userData.stats.age}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Activity size={18} className="text-green-500" />
                </div>
                <span className="text-xs text-zinc-500 font-medium">Gender</span>
              </div>
              <p className="text-lg font-bold text-white">{userData.stats.gender}</p>
            </div>
          </div>
        </div>

        {/* Goal Section */}
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Your Goal</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Target size={20} className="text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-base">{userData.goal.type}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{userData.activityLevel}</p>
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Target Weight</p>
                <p className="text-sm font-bold text-white">{userData.goal.target}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-1">Weekly Goal</p>
                <p className="text-sm font-bold text-green-500">{userData.goal.weekly}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">Settings</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
            <MenuItem icon={Bell} label="Notifications" onClick={() => toggleSection("notifications")} />
            <MenuItem icon={Globe} label="Units & Language" badge="Metric" onClick={() => toggleSection("unitsLanguage")} />
            <MenuItem icon={Shield} label="Privacy & Security" onClick={() => toggleSection("privacySecurity")} />
            <MenuItem icon={HelpCircle} label="Help & Support" />
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className="w-full bg-red-500/10 border border-red-500/30 text-red-500 font-bold py-4 rounded-2xl active:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Edit Profile Bottom Sheet */}
      <AnimatePresence>
        {showEditProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfile(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 p-6 pb-safe border-t border-zinc-800 shadow-2xl"
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <button 
                  onClick={() => setShowEditProfile(false)} 
                  className="p-2 bg-zinc-800 rounded-full active:bg-zinc-700 transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-2 block uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-2 block uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                className="w-full bg-green-500 text-black font-bold py-4 rounded-full active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Save Changes
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Bottom Sheet */}
      <AnimatePresence>
        {expandedSection && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedSection(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 p-6 pb-safe border-t border-zinc-800 shadow-2xl max-h-[80vh] overflow-y-auto scrollbar-hide"
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Settings</h3>
                <button 
                  onClick={() => setExpandedSection(null)} 
                  className="p-2 bg-zinc-800 rounded-full"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Notifications */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Notifications</h4>
                  <div className="space-y-2">
                    <SettingToggle label="Daily Reminders" enabled={notificationSettings.dailyReminders} />
                    <SettingToggle label="Meal Logging Alerts" enabled={notificationSettings.mealAlerts} />
                    <SettingToggle label="Goal Progress Updates" enabled={notificationSettings.goalUpdates} />
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden divide-y divide-zinc-700">
                      <SettingOption label="Breakfast Time" value={notificationSettings.breakfastTime} />
                      <SettingOption label="Lunch Time" value={notificationSettings.lunchTime} />
                      <SettingOption label="Dinner Time" value={notificationSettings.dinnerTime} />
                      <SettingToggle label="Quiet Hours" enabled={notificationSettings.quietHours} />
                      <div className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                        <span className="text-sm font-medium text-white">Quiet Hours</span>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-zinc-400" />
                          <input
                            type="time"
                            value={notificationSettings.quietStart}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, quietStart: e.target.value })}
                            className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                          />
                          <span className="text-sm text-zinc-500">to</span>
                          <input
                            type="time"
                            value={notificationSettings.quietEnd}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, quietEnd: e.target.value })}
                            className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Units */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Units</h4>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden divide-y divide-zinc-700">
                    <SettingOption label="Weight Unit" value={unitsSettings.weightUnit} />
                    <SettingOption label="Height Unit" value={unitsSettings.heightUnit} />
                    <SettingOption label="Energy Unit" value={unitsSettings.energyUnit} />
                    <SettingOption label="Language" value={unitsSettings.language} />
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Privacy & Security</h4>
                  <div className="space-y-2">
                    <SettingToggle label="Private Profile" enabled={privacySettings.privateProfile} />
                    <SettingToggle label="Show in Leaderboard" enabled={privacySettings.showInLeaderboard} />
                    <SettingToggle label="Data Sharing" enabled={privacySettings.dataSharing} />
                    <SettingToggle label="Biometric Lock" enabled={privacySettings.biometricLock} />
                  </div>
                </div>

                {/* App Info */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">About</h4>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-1">Version</p>
                    <p className="text-white font-medium">NutriTrack v1.0.0</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setExpandedSection(null)}
                className="w-full mt-6 bg-green-500 text-black font-bold py-4 rounded-full active:scale-[0.98] transition-transform"
              >
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Menu Item Component
function MenuItem({ icon: Icon, label, badge, onClick }: { icon: any; label: string; badge?: string; onClick?: () => void }) {
  return (
    <button className="w-full flex items-center justify-between p-4 active:bg-zinc-800 transition-colors" onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
          <Icon size={18} className="text-zinc-400" />
        </div>
        <span className="font-medium text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="text-xs text-zinc-500 font-medium">{badge}</span>}
        <ChevronRight size={18} className="text-zinc-600" />
      </div>
    </button>
  );
}

// Setting Toggle Component
function SettingToggle({ label, enabled }: { label: string; enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
      <span className="text-sm font-medium text-white">{label}</span>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          isEnabled ? "bg-green-500" : "bg-zinc-700"
        }`}
      >
        <motion.div
          animate={{ x: isEnabled ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  );
}

// Setting Option Component
function SettingOption({ label, value }: { label: string; value: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 active:bg-zinc-700 transition-colors">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{value}</span>
        <ChevronRight size={16} className="text-zinc-600" />
      </div>
    </button>
  );
}