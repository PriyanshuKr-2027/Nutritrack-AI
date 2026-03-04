import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Bell, BellOff, Clock, Moon, Calendar } from "lucide-react";
import { haptics } from "../../utils/haptics";

interface NotificationsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsSettings({ isOpen, onClose }: NotificationsSettingsProps) {
  const [settings, setSettings] = useState({
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

  const toggleSetting = (key: keyof typeof settings) => {
    haptics.toggle();
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                haptics.tap();
                onClose();
              }}
              className="p-2 -ml-2 active:bg-zinc-800 rounded-full transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-semibold text-white">Notifications</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto scrollbar-hide">
          {/* General Notifications */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">General</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <ToggleItem
                icon={Bell}
                label="Daily Reminders"
                description="Get notified to log your meals"
                enabled={settings.dailyReminders}
                onToggle={() => toggleSetting('dailyReminders')}
              />
              <ToggleItem
                icon={Clock}
                label="Meal Logging Alerts"
                description="Reminders at meal times"
                enabled={settings.mealAlerts}
                onToggle={() => toggleSetting('mealAlerts')}
              />
              <ToggleItem
                icon={Calendar}
                label="Goal Progress Updates"
                description="Weekly nutrition insights"
                enabled={settings.goalUpdates}
                onToggle={() => toggleSetting('goalUpdates')}
              />
            </div>
          </div>

          {/* Meal Times */}
          {settings.mealAlerts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Meal Times</h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                <TimePickerItem
                  label="Breakfast"
                  time={settings.breakfastTime}
                  onChange={(time) => setSettings(prev => ({ ...prev, breakfastTime: time }))}
                />
                <TimePickerItem
                  label="Lunch"
                  time={settings.lunchTime}
                  onChange={(time) => setSettings(prev => ({ ...prev, lunchTime: time }))}
                />
                <TimePickerItem
                  label="Dinner"
                  time={settings.dinnerTime}
                  onChange={(time) => setSettings(prev => ({ ...prev, dinnerTime: time }))}
                />
              </div>
            </motion.div>
          )}

          {/* Quiet Hours */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Quiet Hours</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <ToggleItem
                icon={Moon}
                label="Enable Quiet Hours"
                description="Pause notifications during sleep"
                enabled={settings.quietHours}
                onToggle={() => toggleSetting('quietHours')}
              />
              {settings.quietHours && (
                <>
                  <TimePickerItem
                    label="Start Time"
                    time={settings.quietStart}
                    onChange={(time) => setSettings(prev => ({ ...prev, quietStart: time }))}
                  />
                  <TimePickerItem
                    label="End Time"
                    time={settings.quietEnd}
                    onChange={(time) => setSettings(prev => ({ ...prev, quietEnd: time }))}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 border-t border-zinc-900">
          <button
            onClick={() => {
              haptics.success();
              onClose();
            }}
            className="w-full bg-green-500 text-black font-bold py-4 rounded-full active:scale-95 transition-transform"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ToggleItem({ 
  icon: Icon, 
  label, 
  description, 
  enabled, 
  onToggle 
}: { 
  icon: any; 
  label: string; 
  description: string; 
  enabled: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-green-500" : "bg-zinc-700"
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  );
}

function TimePickerItem({ 
  label, 
  time, 
  onChange 
}: { 
  label: string; 
  time: string; 
  onChange: (time: string) => void;
}) {
  return (
    <div className="p-4 flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        type="time"
        value={time}
        onChange={(e) => {
          haptics.tap();
          onChange(e.target.value);
        }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
      />
    </div>
  );
}