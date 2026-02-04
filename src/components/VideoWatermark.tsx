import { useEffect, useRef, useState } from "react";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface VideoWatermarkProps {
  showOutro: boolean;
  showIntro?: boolean;
  creatorName?: string;
}

// Create a more distinctive CedLite outro sound (melodic chime)
const outroSound = new Audio();
// A more distinctive melodic sound - 3 ascending notes
outroSound.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onreyxs3U2t7g4+Tl5OLf2dHGubCkloV5cGlmZmlxfYyftb3Gy9Dc4ubn5+bk4NvTycC1qZqNg3lycGlqcHuLnrO9x9DY3uPl5uXj39rRyL+0qJmMgXdwam1xfImcrb7I0Njf5Ofn5+Xh3NbNxLmupJWJfnNsam1yfoycq7rE0Njf5Obn5+Xi3tfPxby0qJuNgndvbGxxe4mbqbfDztXd4+Xm5uTh3dfOxLmtp5mLf3Vua25ze4qarLfCzdbf5Obn5+Ti3tjQxr21qZyPg3hwbGxxe4ibqbfDztbf5Ofn5+Ti3tjQxr62qp2QhHlxbXBzeouZprO/y9Td4+Xm5uTh3NbNw7ito5aIfnVubG50eoiXo6+8yNHZ3+Pl5uXi3tjPxbuxppiKfnRtam1ye4mYpa+7xtDY3uLk5eXj393Uy7+zpJeKfnNsam1zeYeWo66Pxc7V3OHk5eXj393Uy7+0ppqLf3Vua29ze4iXpK+7xc7V2t/i5OTj39vSybyvpZiKfnVua25ze4iXpK+7xc7V2t/i5OTj39vSybyvpZiLf3Zva29zeoiXo629yM/W3OHk5OPh3NfPxbqupJaIfHNsam1zeYeVoa26xc7V2+Dj5OPh3djPxbuxpp2Qg3hwbWxueIaUn6u2ws3U2t/i4+Ph39vUzMS6sKSYjIF3cGxscnqIlZ+qtr/J0Njd4ePj4d/b1MzEu7GlmY2BeHBsbXJ6iJWfqrS+x9DW29/h4uHf29TLw7qwpJiMgHdwbGxye4mXoau1v8jQ1trf4eHg3trSysG4rqKVin52cGxscnuJl6KrtL7Hz9bZ3d/g393Z0ci/tqugk4h9dW9sbHJ7iZeitLzGz9bZ3d/f3tzY0Mi/tquglYp/dnBsbHJ7iZeitLzGz9XY3N7f3tzY0Mi/t6uhloqAd3BsbHN7iZehs7zFztXY3N7f3tzY0Me/t6uhloqAd3FtbHN8iZahs7vEzNPX29ze3tzY0Me+tqugloqAd3FtbHN8iZWhsrvDzNPX29ze3tvX0Ma+tqqfloqAd3Ftb3N8iZWhsbrCy9LW2tzd3drW0MW9tamelYl/d3Ftb3N8iJWgsLnBy9LW2tzd3drV0MS9tamelYl/d3FucHR8iJWfrrnAytHV2dvc3drV0MO8tKidlIh+dnFucHR9iZWfrri/ytHV2dvc3NrVz8K8s6edlIh+dnFucHR9iZWfrrjAytHV2dvc3NnUz8K7s6eclIh+d3FucHV9iZWfrbfAytHU2Nvb29nUz8G7sqabk4h9dnFucHV9iZSerbfAydDU2NrZ2djUz8G6sqaak4h9dnFucHV9iZSerbfAyNDU19nZ2NjTzsC6sqaak4h9d3Ftb3V9iZSerrfAyNDU19jY19fSzsC6sqWZkoh9d3FucHZ9iZSerbe/x9DT19jY19fSzcC5saSZkod8d3FucHZ+iZOdrbW/x8/T19jX19bSzb+5saSZkod8d3FucHZ+iZOdrbW/x8/T1tfW1tXRzL+4sKOYkYZ8d3Buc3Z+iZOcrLS+xs7S1tbV1dXQy764sKOXkYZ7d3BudHZ+iJObq7O9xs7R1dXU1NTQyr24r6KXkYZ7dnBudHZ+iJObq7O9xc3Q1NTU09POyr23r6KXkIZ7dnBudHd+iJOaq7K8xMzQ09PTztLOyby2rqGWkIV6dnBudHd+h5KZqrK7w8vP0tLR0dHNyLu1raGVj4R6dXBudHd+h5KZqbG6w8rO0dHQ0NDMx7q1raGVjoN5dXBtdXh+h5GYqLG5wsrN0NDPzs7Mxrq0rKCUjYN5dXFtdXh/hpCYp7C5wcnM0M/Ozc3Lxbm0rJ+TjIJ5dXFtdXl/hpCXprC4wMjLzs7NzMzKxLmzq5+TjIJ4dHFtdXl/hpCXprC3wMfKzc3LysvJxLiyq56Si4F4dHFtdnh/hY+Wpa+3v8bJzMvKycjIw7exqp2RioB4dHFueHl/hY+Vpa62vsbIy8rJyMfHwraxqZyRiYB4c3Fud3l/hI6Upa62vcXHycnIx8bGwbWwqZuQiH94c3Ftd3l/hI6TpKy1vMTGyMfGxcXFwLSwqJuPh394c3FteHp/hI2TpKy0u8PFx8bFxMTDv7SvqJqOhn53c3FteHp/g4ySpKu0u8LExsXExMPDvrOuqJmNhn12c3Ftd3p/g4ySo6uzu8HExMTDw8LCvrOuqJmNhX12c3Fud3p/g4uRo6qyu8DDw8PCwsHBvLOtp5mMhH11cnFueHp/goqQoqmxusDBwsLBwcDAu7KtppeMhH11cnBueHt/goqPoemxusC/wMC/v7+/u7GsppeLg3x0cXBueHt/gYmPn6iwub6+v7++vr2+urGrpZaKgnx0cXBueXt/gYiOnqevuL2+vr69vby9urCrpJWJgXt0cXBueXt/gIiOnqauuLy9vby8u7u8uK+qpJWJgHt0cXBueXt/gIeNnaWtt7u8vLu6urq6t6+po5SIf3pzcHBweXuAgIeNnaSstr25u7q5ubm5ta6oo5OHf3lzcHBweXyAgIaNnKOrtbu4ubi4uLi4ta2oo5OGfnlycHBweXyAgIWMnKOrsby3t7e2tre3tKyno5KGfXhxcHBweXyAf4WMm6KqsLq2trW1tbW1tKymo5KFfXhxcHFweXyAf4SLmqGpr7m1tbS0tLS0s6ulo5GEfXdwcHFweny";
outroSound.volume = 0.4;

// Floating animation for TikTok-like effect
const floatingAnimation = {
  y: [0, -3, 0, 3, 0],
  x: [0, 2, 0, -2, 0],
  rotate: [0, 1, 0, -1, 0],
};

export const VideoWatermark = ({ showOutro, showIntro = false, creatorName = "" }: VideoWatermarkProps) => {
  const hasPlayedSound = useRef(false);
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
