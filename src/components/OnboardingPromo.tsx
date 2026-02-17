import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Gift, Users, Sparkles } from "lucide-react";
import OnboardingDots from "./OnboardingDots";

interface OnboardingPromoProps {
  onNext: () => void;
  onBack: () => void;
}

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

const OnboardingPromo = ({ onNext, onBack }: OnboardingPromoProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background p-6 py-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key="promo"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col flex-1 items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <BadgeCheck className="w-14 h-14 text-primary" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground text-center mb-3"
          >
            🎉 Offre de lancement exclusive !
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-center text-base max-w-sm mb-8"
          >
            Les <span className="font-bold text-primary">1 000 premiers</span> inscrits reçoivent automatiquement le badge de certification
            <BadgeCheck className="w-4 h-4 text-primary inline ml-1" /> !
          </motion.p>

          <div className="grid grid-cols-1 gap-4 max-w-sm w-full">
            {[
              { icon: Gift, title: "Certification gratuite", desc: "Badge vérifié offert automatiquement" },
              { icon: Users, title: "Visibilité accrue", desc: "Votre profil affiché dans la page Certifiés" },
              { icon: Sparkles, title: "Offre limitée", desc: "Seulement pour les 1 000 premiers comptes" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col items-center gap-4 mt-8 max-w-md mx-auto w-full">
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Retour
          </Button>
          <Button className="flex-1 font-semibold" onClick={onNext}>
            Je m'inscris !
          </Button>
        </div>
        <OnboardingDots total={4} current={2} />
      </div>
    </div>
  );
};

export default OnboardingPromo;
