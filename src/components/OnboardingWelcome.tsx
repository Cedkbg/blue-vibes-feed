import { motion } from "framer-motion";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { Button } from "@/components/ui/button";

interface OnboardingWelcomeProps {
  onNext: () => void;
}

const OnboardingWelcome = ({ onNext }: OnboardingWelcomeProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-16"
      >
        <Button size="lg" className="px-10 text-lg font-semibold" onClick={onNext}>
          Suivant
        </Button>
      </motion.div>
    </div>
  );
};

export default OnboardingWelcome;
