import { useEffect, useRef, useState } from "react";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface VideoWatermarkProps {
  showOutro: boolean;
  showIntro?: boolean;
  creatorName?: string;
  currentTime?: number;
  duration?: number;
}

// Create a more captivating CedLite outro sound - rich melodic chime with harmonics
const createOutroSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 1.5;
    const numSamples = sampleRate * duration;
    const buffer = audioContext.createBuffer(2, numSamples, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Musical frequencies for a rich chord (C major with overtones)
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    const delays = [0, 0.05, 0.1, 0.15, 0.2]; // Staggered entry for arpeggio effect
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let leftSample = 0;
      let rightSample = 0;
      
      frequencies.forEach((freq, idx) => {
        const delayedT = t - delays[idx];
        if (delayedT >= 0) {
          // Exponential decay with slight stereo pan
          const envelope = Math.exp(-delayedT * (2.5 + idx * 0.3));
          const vibrato = 1 + Math.sin(2 * Math.PI * 5 * delayedT) * 0.002;
          const wave = Math.sin(2 * Math.PI * freq * vibrato * delayedT);
          
          // Add harmonics for richness
          const harmonic = Math.sin(2 * Math.PI * freq * 2 * delayedT) * 0.3;
          const sample = (wave + harmonic) * envelope * (0.25 - idx * 0.03);
          
          // Slight stereo spread
          leftSample += sample * (1 - idx * 0.1);
          rightSample += sample * (0.8 + idx * 0.05);
        }
      });
      
      // Add a subtle shimmer effect
      const shimmer = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 8) * 0.05;
      leftChannel[i] = Math.max(-1, Math.min(1, leftSample + shimmer));
      rightChannel[i] = Math.max(-1, Math.min(1, rightSample + shimmer));
    }
    
    return { audioContext, buffer };
  } catch (e) {
    return null;
  }
};

// Floating animation for TikTok-like effect
const floatingAnimation = {
  y: [0, -3, 0, 3, 0],
  x: [0, 2, 0, -2, 0],
  rotate: [0, 1, 0, -1, 0],
};

export const VideoWatermark = ({ 
  showOutro, 
  showIntro = false, 
  creatorName = "",
  currentTime = 0,
  duration = 0
}: VideoWatermarkProps) => {
  const hasPlayedSound = useRef(false);
  const [introPhase, setIntroPhase] = useState<"left" | "right">("left");
  const audioContextRef = useRef<AudioContext | null>(null);

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

  // Play rich sound when outro appears
  useEffect(() => {
    if (showOutro && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      
      const audioData = createOutroSound();
      if (audioData) {
        const { audioContext, buffer } = audioData;
        audioContextRef.current = audioContext;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.5;
        gainNode.connect(audioContext.destination);
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);
        source.start();
      }
    }
    if (!showOutro) {
      hasPlayedSound.current = false;
    }
  }, [showOutro]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>

      {/* Intro animation - Logo at bottom-left, then moves to right with floating effect */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute bottom-32 z-30 pointer-events-none"
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
                className="w-7 h-7 object-contain"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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

      {/* Corner watermark - always visible with subtle floating */}
      <motion.div 
        className="absolute top-16 left-3 z-20 pointer-events-none"
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
          className="w-14 h-14 object-contain opacity-60"
        />
      </motion.div>

      {/* Outro overlay - Logo moves to center with animation + distinctive sound */}
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
              initial={{ x: "-100vw", scale: 0.5, rotate: -180 }}
              animate={{ 
                x: 0, 
                scale: [0.5, 1.3, 1],
                rotate: [180, 10, 0],
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                scale: { duration: 0.8, times: [0, 0.6, 1] },
                rotate: { duration: 0.8, times: [0, 0.6, 1] }
              }}
            />
            <motion.p 
              className="text-white text-xl font-bold tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              CedLite
            </motion.p>
            <motion.p 
              className="text-white/60 text-sm mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              Partagez vos moments
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};