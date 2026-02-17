import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Video, MessageCircle, Radio, Users, Heart, Globe } from "lucide-react";
import OnboardingDots from "./OnboardingDots";

interface OnboardingFeaturesProps {
  onNext: () => void;
  onBack: () => void;
}

const features = [
  { icon: Video, title: "Vidéos & Stories", desc: "Créez et partagez vos meilleurs moments" },
  { icon: Radio, title: "Lives en direct", desc: "Diffusez en temps réel avec votre communauté" },
  { icon: MessageCircle, title: "Messagerie riche", desc: "Texte, vocal, photos, vidéos et GIFs" },
  { icon: Users, title: "Groupes & Communautés", desc: "Rejoignez des espaces qui vous inspirent" },
  { icon: Heart, title: "Contenu authentique", desc: "Découvrez des créateurs du monde entier" },
  { icon: Globe, title: "100% gratuit", desc: "Accessible à tous, sans abonnement" },
];

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

const OnboardingFeatures = ({ onNext, onBack }: OnboardingFeaturesProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background p-6 py-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key="features"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col flex-1"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Découvrez CedLite</h2>
            <p className="text-muted-foreground mt-2 text-sm">Tout ce dont vous avez besoin, en un seul endroit.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 max-w-md mx-auto w-full">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
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
            C'est parti !
          </Button>
        </div>
        <OnboardingDots total={4} current={1} />
      </div>
    </div>
  );
};

export default OnboardingFeatures;
