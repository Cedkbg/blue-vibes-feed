import { useEffect, useRef } from "react";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface VideoWatermarkProps {
  showOutro: boolean;
  showIntro?: boolean;
  creatorName?: string;
}

// Create audio element for outro sound
const outroSound = new Audio();
outroSound.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNAAAAAAAAAAAAAAAAAAAA";
outroSound.volume = 0.3;

export const VideoWatermark = ({ showOutro, showIntro = false, creatorName = "" }: VideoWatermarkProps) => {
  const hasPlayedSound = useRef(false);

  // Play sound when outro appears
  useEffect(() => {
    if (showOutro && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      outroSound.currentTime = 0;
      outroSound.play().catch(() => {});
    }
    if (!showOutro) {
      hasPlayedSound.current = false;
    }
  }, [showOutro]);

  return (
    <>
      {/* Intro animation - Logo at top-left, slides to right with creator name */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute top-16 left-0 right-0 z-30 flex items-center pointer-events-none px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex items-center gap-2 bg-black/40 rounded-full py-1.5 px-3 backdrop-blur-sm"
              initial={{ x: 0, opacity: 0 }}
              animate={{ 
                x: ["0%", "0%", "calc(100vw - 180px)"],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: 2.5, 
                ease: "easeInOut",
                times: [0, 0.1, 0.7, 1],
                opacity: { duration: 2.5, times: [0, 0.1, 0.9, 1] }
              }}
            >
              <img
                src={cedliteLogo}
                alt="CedLite"
                className="w-8 h-8 object-contain"
              />
              {creatorName && (
                <span className="text-white text-sm font-medium truncate max-w-[100px]">
                  {creatorName}
                </span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner watermark - always visible */}
      <div className="absolute top-16 left-3 z-20 pointer-events-none">
        <img
          src={cedliteLogo}
          alt="CedLite"
          className="w-16 h-16 object-contain opacity-70"
        />
      </div>

      {/* Outro overlay - Logo moves to center with animation + sound */}
      <AnimatePresence>
        {showOutro && (
          <motion.div 
            className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={cedliteLogo}
              alt="CedLite"
              className="w-32 h-32 object-contain mb-4"
              initial={{ x: "-100vw", scale: 0.5 }}
              animate={{ 
                x: 0, 
                scale: [0.5, 1.2, 1],
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                scale: { duration: 0.8, times: [0, 0.6, 1] }
              }}
            />
            <motion.p 
              className="text-white text-lg font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              CedLite
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
