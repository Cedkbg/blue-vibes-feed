import { useState, useEffect } from "react";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface VideoWatermarkProps {
  showOutro: boolean;
  showIntro?: boolean;
}

export const VideoWatermark = ({ showOutro, showIntro = false }: VideoWatermarkProps) => {
  return (
    <>
      {/* Intro animation - Logo slides from left to right */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={cedliteLogo}
              alt="CedLite"
              className="w-24 h-24 object-contain"
              initial={{ x: "-100vw", opacity: 0 }}
              animate={{ x: "100vw", opacity: [0, 1, 1, 0] }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut",
                opacity: { duration: 1.5, times: [0, 0.2, 0.8, 1] }
              }}
            />
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

      {/* Outro overlay - Logo moves to center with animation */}
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
