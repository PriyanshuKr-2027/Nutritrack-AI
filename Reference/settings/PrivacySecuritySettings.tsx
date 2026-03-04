import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Lock, Shield, Download, Trash2 } from "lucide-react";
import { haptics } from "../../utils/haptics";

interface PrivacySecuritySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacySecuritySettings({ isOpen, onClose }: PrivacySecuritySettingsProps) {
  const [settings, setSettings] = useState({
    biometric: true,
    autoLock: true,
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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
            <h1 className="text-xl font-semibold text-white">Privacy & Security</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto scrollbar-hide">
          {/* Security */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Security</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <ToggleItem
                icon={Lock}
                label="Biometric Lock"
                description="Use fingerprint or face ID"
                enabled={settings.biometric}
                onToggle={() => toggleSetting('biometric')}
              />
              <ToggleItem
                icon={Shield}
                label="Auto-Lock"
                description="Lock app when inactive"
                enabled={settings.autoLock}
                onToggle={() => toggleSetting('autoLock')}
              />
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Data Management</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <ActionItem
                icon={Download}
                label="Export My Data"
                description="Download all your nutrition data"
                onClick={() => {
                  haptics.tap();
                  alert('Your data export will be emailed to you shortly');
                }}
              />
              <ActionItem
                icon={Trash2}
                label="Delete All Data"
                description="Permanently remove all your data"
                onClick={() => {
                  haptics.button();
                  setShowConfirmDelete(true);
                }}
                danger
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <div className="flex gap-3">
              <Shield size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-500 mb-1">Your Data is Secure</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All your nutrition data is encrypted and stored securely. We never share your personal information with third parties.
                </p>
              </div>
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

        {/* Confirm Delete Modal */}
        <AnimatePresence>
          {showConfirmDelete && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmDelete(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-3rem)] max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 z-60 shadow-2xl"
              >
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Trash2 size={32} className="text-red-500" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">Delete All Data?</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    This action cannot be undone. All your meals, nutrition history, and settings will be permanently deleted.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      haptics.error();
                      alert('All data has been deleted');
                      setShowConfirmDelete(false);
                    }}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-full active:scale-95 transition-transform"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    onClick={() => {
                      haptics.tap();
                      setShowConfirmDelete(false);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white font-medium py-4 rounded-full active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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

function ActionItem({ 
  icon: Icon, 
  label, 
  description, 
  onClick,
  danger = false
}: { 
  icon: any; 
  label: string; 
  description: string; 
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-center gap-4 active:bg-zinc-800 transition-colors"
    >
      <div className={`w-10 h-10 ${danger ? 'bg-red-500/10' : 'bg-zinc-800'} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={danger ? 'text-red-500' : 'text-zinc-400'} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className={`font-medium text-sm ${danger ? 'text-red-500' : 'text-white'}`}>{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}