import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { haptics } from "../../utils/haptics";

interface UnitsLanguageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnitsLanguageSettings({ isOpen, onClose }: UnitsLanguageSettingsProps) {
  const [settings, setSettings] = useState({
    weightUnit: "kg",
    heightUnit: "cm",
    energyUnit: "kcal",
    language: "en",
    dateFormat: "dd/mm/yyyy",
  });

  const [activeSelector, setActiveSelector] = useState<string | null>(null);

  const weightUnits = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lb", label: "Pounds (lb)" },
  ];

  const heightUnits = [
    { value: "cm", label: "Centimeters (cm)" },
    { value: "ft", label: "Feet & Inches (ft/in)" },
    { value: "m", label: "Meters (m)" },
  ];

  const energyUnits = [
    { value: "kcal", label: "Kilocalories (kcal)" },
    { value: "kj", label: "Kilojoules (kJ)" },
  ];

  const languages = [
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { value: "zh", label: "中文", flag: "🇨🇳" },
  ];

  const dateFormats = [
    { value: "dd/mm/yyyy", label: "DD/MM/YYYY", example: "31/12/2026" },
    { value: "mm/dd/yyyy", label: "MM/DD/YYYY", example: "12/31/2026" },
    { value: "yyyy-mm-dd", label: "YYYY-MM-DD", example: "2026-12-31" },
  ];

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
            <h1 className="text-xl font-semibold text-white">Units & Language</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto scrollbar-hide">
          {/* Units */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Units</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <SelectItem
                label="Weight Unit"
                value={weightUnits.find(u => u.value === settings.weightUnit)?.label || ""}
                onClick={() => setActiveSelector('weight')}
              />
              <SelectItem
                label="Height Unit"
                value={heightUnits.find(u => u.value === settings.heightUnit)?.label || ""}
                onClick={() => setActiveSelector('height')}
              />
              <SelectItem
                label="Energy Unit"
                value={energyUnits.find(u => u.value === settings.energyUnit)?.label || ""}
                onClick={() => setActiveSelector('energy')}
              />
            </div>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Language</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <SelectItem
                label="App Language"
                value={languages.find(l => l.value === settings.language)?.label || ""}
                onClick={() => setActiveSelector('language')}
                badge={languages.find(l => l.value === settings.language)?.flag}
              />
            </div>
          </div>

          {/* Date Format */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Date Format</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <SelectItem
                label="Date Format"
                value={dateFormats.find(d => d.value === settings.dateFormat)?.example || ""}
                onClick={() => setActiveSelector('date')}
              />
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

        {/* Selection Modals */}
        <AnimatePresence>
          {activeSelector === 'weight' && (
            <SelectorSheet
              title="Weight Unit"
              options={weightUnits}
              selected={settings.weightUnit}
              onSelect={(value) => {
                haptics.tap();
                setSettings(prev => ({ ...prev, weightUnit: value }));
                setActiveSelector(null);
              }}
              onClose={() => setActiveSelector(null)}
            />
          )}

          {activeSelector === 'height' && (
            <SelectorSheet
              title="Height Unit"
              options={heightUnits}
              selected={settings.heightUnit}
              onSelect={(value) => {
                haptics.tap();
                setSettings(prev => ({ ...prev, heightUnit: value }));
                setActiveSelector(null);
              }}
              onClose={() => setActiveSelector(null)}
            />
          )}

          {activeSelector === 'energy' && (
            <SelectorSheet
              title="Energy Unit"
              options={energyUnits}
              selected={settings.energyUnit}
              onSelect={(value) => {
                haptics.tap();
                setSettings(prev => ({ ...prev, energyUnit: value }));
                setActiveSelector(null);
              }}
              onClose={() => setActiveSelector(null)}
            />
          )}

          {activeSelector === 'language' && (
            <SelectorSheet
              title="Language"
              options={languages.map(l => ({ value: l.value, label: `${l.flag} ${l.label}` }))}
              selected={settings.language}
              onSelect={(value) => {
                haptics.tap();
                setSettings(prev => ({ ...prev, language: value }));
                setActiveSelector(null);
              }}
              onClose={() => setActiveSelector(null)}
            />
          )}

          {activeSelector === 'date' && (
            <SelectorSheet
              title="Date Format"
              options={dateFormats.map(d => ({ value: d.value, label: `${d.label} (${d.example})` }))}
              selected={settings.dateFormat}
              onSelect={(value) => {
                haptics.tap();
                setSettings(prev => ({ ...prev, dateFormat: value }));
                setActiveSelector(null);
              }}
              onClose={() => setActiveSelector(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function SelectItem({ 
  label, 
  value, 
  onClick,
  badge 
}: { 
  label: string; 
  value: string; 
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={() => {
        haptics.tap();
        onClick();
      }}
      className="w-full flex items-center justify-between p-4 active:bg-zinc-800 transition-colors"
    >
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        {badge && <span className="text-base">{badge}</span>}
        <span className="text-sm font-medium text-white">{value}</span>
        <ChevronRight size={16} className="text-zinc-600" />
      </div>
    </button>
  );
}

function SelectorSheet({ 
  title, 
  options, 
  selected, 
  onSelect, 
  onClose 
}: { 
  title: string; 
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-60"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-60 p-6 pb-safe border-t border-zinc-800 shadow-2xl max-h-[70vh] overflow-y-auto"
      >
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                selected === option.value 
                  ? "bg-green-500/10 border-2 border-green-500/50" 
                  : "bg-zinc-800 border-2 border-transparent active:bg-zinc-700"
              }`}
            >
              <span className={`font-medium ${selected === option.value ? "text-green-500" : "text-white"}`}>
                {option.label}
              </span>
              {selected === option.value && (
                <Check size={20} className="text-green-500" />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}