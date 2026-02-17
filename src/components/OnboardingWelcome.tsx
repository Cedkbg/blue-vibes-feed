import { motion, AnimatePresence } from "framer-motion";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { Button } from "@/components/ui/button";
import OnboardingDots from "./OnboardingDots";

interface OnboardingWelcomeProps {
  onNext: () => void;
}

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

const OnboardingWelcome = ({ onNext }: OnboardingWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key="welcome"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.img
            src={cedliteLogo}
            alt="CedLite"
            className="w-32 h-32 drop-shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-bold text-foreground"
          >
            Bienvenue sur CedLite
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-muted-foreground text-center text-lg max-w-xs"
          >
            L'espace où chaque voix compte.
          </motion.p>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-12 flex flex-col items-center gap-6"
      >
        <Button size="lg" className="px-10 text-lg font-semibold" onClick={onNext}>
          Suivant
        </Button>
        <OnboardingDots total={4} current={0} />
      </motion.div>
    </div>
  );
};

export default OnboardingWelcome;
