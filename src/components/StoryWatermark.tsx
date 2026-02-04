import { useEffect, useRef, useState } from "react";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface StoryWatermarkProps {
  showIntro: boolean;
  creatorName?: string;
}

// Floating animation for TikTok-like effect
const floatingAnimation = {
  y: [0, -3, 0, 3, 0],
  x: [0, 2, 0, -2, 0],
  rotate: [0, 1, 0, -1, 0],
};

export const StoryWatermark = ({ showIntro, creatorName = "" }: StoryWatermarkProps) => {
  const [introPhase, setIntroPhase] = useState<"left" | "right">("left");

  // Switch from left to right after 5 seconds
  useEffect(() => {
    if (showIntro) {
      setIntroPhase("left");
      const timer = setTimeout(() => {
        setIntroPhase("right");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  return (
    <>
      {/* Intro animation - Logo at bottom-left, then moves to right with floating effect */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute bottom-24 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              left: introPhase === "left" ? 12 : "auto",
              right: introPhase === "right" ? 12 : "auto",
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex items-center gap-2 bg-black/50 rounded-full py-2 px-3 backdrop-blur-sm border border-white/10"
              animate={floatingAnimation}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.img
                src={cedliteLogo}
                alt="CedLite"
                className="w-6 h-6 object-contain"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {creatorName && (
                <span className="text-white text-xs font-medium truncate max-w-[80px]">
                  {creatorName}
                </span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner watermark - always visible with subtle floating */}
      <motion.div 
        className="absolute top-20 left-3 z-10 pointer-events-none"
        animate={floatingAnimation}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src={cedliteLogo}
          alt="CedLite"
          className="w-10 h-10 object-contain opacity-50"
        />
      </motion.div>
    </>
  );
};
