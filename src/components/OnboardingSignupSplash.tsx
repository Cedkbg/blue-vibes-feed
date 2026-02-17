import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import cedliteLogo from "@/assets/cedlite-logo.png";
import OnboardingDots from "./OnboardingDots";

interface OnboardingSignupSplashProps {
  onNext: () => void;
  onBack: () => void;
}

const OnboardingSignupSplash = ({ onNext, onBack }: OnboardingSignupSplashProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-6 overflow-hidden">
      <div className="flex flex-col items-center gap-8 flex-1 justify-center">
        <motion.img
          src={cedliteLogo}
          alt="CedLite"
          className="w-36 h-36 drop-shadow-2xl"
          animate={{
            y: [0, -12, 0],
            rotate: [0, 3, -3, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />

        <motion.h1
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          className="text-5xl font-extrabold text-foreground tracking-tight"
        >
          Inscription
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-muted-foreground text-center text-lg max-w-xs">
            Créez votre compte en quelques étapes simples
          </p>
          <motion.div
            className="w-16 h-1 rounded-full bg-primary mt-2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex flex-col items-center gap-4 mt-8 w-full max-w-md"
      >
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Retour
          </Button>
          <Button className="flex-1 font-semibold text-lg" size="lg" onClick={onNext}>
            Commencer
          </Button>
        </div>
        <OnboardingDots total={8} current={3} />
      </motion.div>
    </div>
  );
};

export default OnboardingSignupSplash;
