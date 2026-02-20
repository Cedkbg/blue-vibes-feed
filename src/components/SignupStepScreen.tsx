import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import OnboardingDots from "./OnboardingDots";
import { ArrowLeft, ArrowRight, CheckCircle2, User, Mail, Shield } from "lucide-react";
import { validateEmailDomain, type EmailValidation } from "@/utils/emailDomainValidator";

interface SignupStepScreenProps {
  step: number; // 0-2
  totalDots: number;
  currentDot: number;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  birthdate: string;
  setBirthdate: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  errors: Record<string, string | undefined>;
  setErrors: (v: Record<string, string | undefined>) => void;
  loading: boolean;
  onNext: () => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const stepMeta = [
  { title: "Identité", subtitle: "Présentez-vous", icon: User },
  { title: "Contact", subtitle: "Votre adresse email", icon: Mail },
  { title: "Sécurité", subtitle: "Protégez votre compte", icon: Shield },
];

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

const SignupStepScreen = (props: SignupStepScreenProps) => {
  const { step } = props;
  const meta = stepMeta[step];
  const Icon = meta.icon;
  const isLast = step === 2;

  const canGoNext = () => {
    if (step === 0) return props.firstName.trim() && props.lastName.trim();
    if (step === 1) return props.email.trim();
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={`signup-step-${step}`}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col flex-1 max-w-md mx-auto w-full"
        >
          {/* Step header */}
          <div className="flex flex-col items-center gap-3 pt-8 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground"
            >
              {meta.title}
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm"
            >
              {meta.subtitle}
            </motion.p>
          </div>

          {/* Step content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex-1"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isLast) {
                  props.onSubmit(e);
                } else {
                  props.onNext();
                }
              }}
              className="space-y-5"
            >
              {step === 0 && <StepIdentity {...props} />}
              {step === 1 && <StepContact {...props} />}
              {step === 2 && <StepSecurity {...props} />}
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4 mt-6 max-w-md mx-auto w-full">
        <div className="flex gap-3 w-full">
          <Button type="button" variant="outline" className="flex-1 gap-2" onClick={props.onBack}>
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          {isLast ? (
            <Button
              type="button"
              className="flex-1 font-semibold gap-2"
              disabled={props.loading}
              onClick={(e) => props.onSubmit(e as any)}
            >
              {props.loading ? "Inscription..." : (
                <>Créer mon compte <CheckCircle2 className="w-4 h-4" /></>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 font-semibold gap-2"
              disabled={!canGoNext()}
              onClick={props.onNext}
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        <OnboardingDots total={props.totalDots} current={props.currentDot} />
      </div>
    </div>
  );
};

/* --- Step sub-components --- */

const StepIdentity = (p: SignupStepScreenProps) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="fs-firstname">Prénom *</Label>
      <Input id="fs-firstname" placeholder="Votre prénom" value={p.firstName} onChange={e => p.setFirstName(e.target.value)} required className="h-12 text-base" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="fs-lastname">Nom *</Label>
      <Input id="fs-lastname" placeholder="Votre nom" value={p.lastName} onChange={e => p.setLastName(e.target.value)} required className="h-12 text-base" />
    </div>
  </div>
);

const StepContact = (p: SignupStepScreenProps) => {
  const [emailHint, setEmailHint] = useState<EmailValidation | null>(null);

  const handleEmailChange = (value: string) => {
    p.setEmail(value);
    p.setErrors({});
    if (value.includes("@") && value.split("@")[1]?.length >= 3) {
      const result = validateEmailDomain(value);
      setEmailHint(result.isValid ? null : result);
    } else {
      setEmailHint(null);
    }
  };

  const applySuggestion = () => {
    if (emailHint?.suggestion) {
      const local = p.email.split("@")[0];
      p.setEmail(`${local}@${emailHint.suggestion}`);
      setEmailHint(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fs-email">Email *</Label>
        <Input
          id="fs-email"
          type="email"
          placeholder="vous@exemple.com"
          value={p.email}
          onChange={e => handleEmailChange(e.target.value)}
          required
          className={`h-12 text-base ${p.errors.email || emailHint ? "border-destructive" : ""}`}
        />
        {p.errors.email && <p className="text-sm text-destructive">{p.errors.email}</p>}
        {emailHint && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2.5 space-y-1">
            <p className="text-sm text-destructive font-medium">{emailHint.message}</p>
            {emailHint.suggestion && (
              <button type="button" onClick={applySuggestion} className="text-sm font-semibold text-primary hover:underline">
                Utiliser {emailHint.suggestion} →
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fs-birth">Date de naissance <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Input id="fs-birth" type="date" value={p.birthdate} onChange={e => p.setBirthdate(e.target.value)} className="h-12 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fs-loc">Pays / Ville <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Input id="fs-loc" placeholder="Paris, France" value={p.location} onChange={e => p.setLocation(e.target.value)} className="h-12 text-base" />
      </div>
    </div>
  );
};

const StepSecurity = (p: SignupStepScreenProps) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="fs-pass">Mot de passe *</Label>
      <PasswordInput
        id="fs-pass"
        placeholder="••••••••"
        value={p.password}
        onChange={e => { p.setPassword(e.target.value); p.setErrors({}); }}
        required
        minLength={6}
        className={`h-12 text-base ${p.errors.password ? "border-destructive" : ""}`}
      />
      {p.errors.password && <p className="text-sm text-destructive">{p.errors.password}</p>}
      <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="fs-confirm">Confirmer le mot de passe *</Label>
      <PasswordInput
        id="fs-confirm"
        placeholder="••••••••"
        value={p.confirmPassword}
        onChange={e => { p.setConfirmPassword(e.target.value); p.setErrors({ ...p.errors, confirmPassword: undefined }); }}
        required
        minLength={6}
        className={`h-12 text-base ${p.errors.confirmPassword ? "border-destructive" : ""}`}
      />
      {p.errors.confirmPassword && <p className="text-sm text-destructive">{p.errors.confirmPassword}</p>}
    </div>
  </div>
);

export default SignupStepScreen;
