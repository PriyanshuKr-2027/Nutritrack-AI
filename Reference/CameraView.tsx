import React from "react";
import { X, Image as ImageIcon, Zap } from "lucide-react";
import cameraPreview from "figma:asset/7a8d0ac9ac8d9305ce2247e6ab00433e9f3baee1.png";

interface CameraViewProps {
  onClose: () => void;
  onCapture: () => void;
}

export function CameraView({ onClose, onCapture }: CameraViewProps) {
  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      {/* Camera Preview (Simulated) */}
      <img 
        src={cameraPreview} 
        alt="Camera Preview" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-safe z-10">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-safe z-10 flex items-center justify-between">
        {/* Gallery Button */}
        <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors">
          <ImageIcon size={24} />
        </button>

        {/* Capture Button */}
        <button 
          onClick={onCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-white" />
        </button>

        {/* Flash Toggle */}
        <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors">
          <Zap size={24} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
