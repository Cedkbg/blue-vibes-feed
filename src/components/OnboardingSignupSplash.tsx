import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import cedliteLogo from "@/assets/cedlite-logo.png";
import OnboardingDots from "./OnboardingDots";

interface OnboardingSignupSplashProps {
  onNext: () => void;
  onBack: () => void;
  onLogin?: () => void;
}

const OnboardingSignupSplash = ({ onNext, onBack, onLogin }: OnboardingSignupSplashProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignup = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

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
        {/* Google signup button */}
        <Button
          variant="outline"
          className="w-full font-semibold gap-2 h-12 text-base"
          disabled={loading}
          onClick={handleGoogleSignup}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          S'inscrire avec Google
        </Button>

        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-primary/20 via-background to-primary/10 px-3 text-muted-foreground">ou</span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Retour
          </Button>
          <Button className="flex-1 font-semibold text-lg" size="lg" onClick={onNext}>
            Créer avec email
          </Button>
        </div>
        {onLogin && (
          <Button variant="link" className="text-muted-foreground" onClick={onLogin}>
            J'ai déjà un compte
          </Button>
        )}
        <OnboardingDots total={8} current={3} />
      </motion.div>
    </div>
  );
};

export default OnboardingSignupSplash;
