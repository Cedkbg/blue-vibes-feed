import { useState, useEffect } from "react";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface VideoWatermarkProps {
  showOutro: boolean;
}

export const VideoWatermark = ({ showOutro }: VideoWatermarkProps) => {
  return (
    <>
      {/* Corner watermark - always visible */}
      <div className="absolute top-16 left-3 z-20 pointer-events-none">
        <img
          src={cedliteLogo}
          alt="CedLite"
          className="w-16 h-16 object-contain opacity-70"
        />
      </div>

      {/* Outro overlay - shown at end of video */}
      {showOutro && (
        <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
          <img
            src={cedliteLogo}
            alt="CedLite"
            className="w-32 h-32 object-contain mb-4"
          />
          <p className="text-white text-lg font-semibold">CedLite</p>
        </div>
      )}
    </>
  );
};
