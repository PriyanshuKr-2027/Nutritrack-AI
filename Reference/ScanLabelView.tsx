import React, { useState } from "react";
import { X, Zap, Image, ZapOff } from "lucide-react";
import img from "figma:asset/e7c218fb0d0da395c35e6cb38e70d46770428589.png";

interface ScanLabelViewProps {
  onClose: () => void;
  onCapture: () => void;
  onGallery: () => void;
  onComplete?: () => void; // Directly go to results after scanning
}

export function ScanLabelView({ onClose, onCapture, onGallery, onComplete }: ScanLabelViewProps) {
  const [flashOn, setFlashOn] = useState(false);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Camera Feed - Full Screen */}
      <div className="absolute inset-0 z-0">
        <img 
          src={img} 
          alt="Camera Preview" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col h-full pt-safe pb-safe">
        
        {/* Top Controls */}
        <div className="flex justify-between items-center p-4 pt-6">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm active:bg-black/60 transition-colors"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={() => setFlashOn(!flashOn)}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm active:bg-black/60 transition-colors"
          >
            {flashOn ? <Zap size={24} className="fill-white" /> : <ZapOff size={24} />}
          </button>
        </div>

        {/* Primary Instruction */}
        <div className="text-center mt-2 px-6">
           <h2 className="text-white/90 text-lg font-medium drop-shadow-md">
             Scan nutrition label
           </h2>
        </div>

        {/* Scanning Frame Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative px-8 py-4">
            {/* The Frame */}
            <div className="w-full max-w-xs aspect-[3/4] rounded-3xl border-2 border-green-500 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] relative">
                {/* Optional corner markers if needed, but prompt said "Thin green outline", "Rounded corners". */}
            </div>
            
            {/* Secondary Instruction */}
            <p className="mt-6 text-white/80 text-sm font-medium drop-shadow-md text-center max-w-[240px]">
              Align the label clearly inside the frame
            </p>
        </div>

        {/* Bottom Controls */}
        <div className="p-8 pb-12 flex justify-center items-center relative mt-auto">
             {/* Gallery Button - Left */}
             <button 
               onClick={onGallery}
               className="absolute left-8 w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-white backdrop-blur-sm active:scale-95 transition-transform"
             >
               <Image size={24} />
             </button>
             
             {/* Capture Button - Center */}
             <button 
               onClick={onCapture}
               className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center active:scale-95 transition-transform"
             >
                <div className="w-16 h-16 rounded-full bg-white shadow-lg" />
             </button>
        </div>
      </div>
    </div>
  );
}