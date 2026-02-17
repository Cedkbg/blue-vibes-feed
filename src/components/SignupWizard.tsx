import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import PasswordInput from "@/components/PasswordInput";
import { User, Mail, Phone, Info, Shield, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { validateEmailDomain, type EmailValidation } from "@/utils/emailDomainValidator";

interface SignupWizardProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  birthdate: string;
  setBirthdate: (v: string) => void;
  profession: string;
  setProfession: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  errors: Record<string, string | undefined>;
  setErrors: (v: Record<string, string | undefined>) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const steps = [
  { id: 0, title: "Identité", subtitle: "Qui êtes-vous ?", icon: User },
  { id: 1, title: "Contact", subtitle: "Comment vous joindre ?", icon: Mail },
  { id: 2, title: "Infos", subtitle: "Parlez-nous de vous", icon: Info },
  { id: 3, title: "Sécurité", subtitle: "Protégez votre compte", icon: Shield },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const SignupWizard = (props: SignupWizardProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const canGoNext = () => {
    if (step === 0) return props.firstName.trim() && props.lastName.trim();
    if (step === 1) return props.email.trim() && props.phoneNumber.trim();
    if (step === 2) return true;
    return false;
  };

  const goNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const progress = ((step + 1) / 4) * 100;
  const CurrentIcon = steps[step].icon;

  return (
    <form onSubmit={props.onSubmit} className="space-y-5">
      {/* Step indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { if (i < step) { setDirection(-1); setStep(i); } }}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive
                    ? "scale-110"
                    : isDone
                    ? "opacity-80 cursor-pointer"
                    : "opacity-30 cursor-default"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step header */}
      <motion.div
        key={`header-${step}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-1"
      >
        <h3 className="text-lg font-bold text-foreground">{steps[step].title}</h3>
        <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
      </motion.div>

      {/* Step content */}
      <div className="min-h-[200px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            {step === 0 && <StepIdentity {...props} />}
            {step === 1 && <StepContact {...props} />}
            {step === 2 && <StepInfo {...props} />}
            {step === 3 && <StepSecurity {...props} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goBack} className="flex-1 gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
        )}
        {step < 3 ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex-1 gap-2 font-semibold"
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={props.loading} className="flex-1 font-semibold gap-2">
            {props.loading ? "Inscription..." : (
              <>Créer mon compte <CheckCircle2 className="w-4 h-4" /></>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

/* --- Step sub-components --- */

const StepIdentity = (p: SignupWizardProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="w-firstname">Prénom *</Label>
        <Input id="w-firstname" placeholder="Votre prénom" value={p.firstName} onChange={e => p.setFirstName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-lastname">Nom *</Label>
        <Input id="w-lastname" placeholder="Votre nom" value={p.lastName} onChange={e => p.setLastName(e.target.value)} required />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="w-username">Pseudo</Label>
      <Input id="w-username" placeholder="@votre_pseudo" value={p.username} onChange={e => p.setUsername(e.target.value)} />
      <p className="text-xs text-muted-foreground">Optionnel — visible par les autres utilisateurs</p>
    </div>
  </div>
);

const StepContact = (p: SignupWizardProps) => {
  const [emailHint, setEmailHint] = React.useState<EmailValidation | null>(null);

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
        <Label htmlFor="w-email">Email *</Label>
        <Input
          id="w-email"
          type="email"
          placeholder="vous@exemple.com"
          value={p.email}
          onChange={e => handleEmailChange(e.target.value)}
          required
          className={p.errors.email || emailHint ? "border-destructive" : ""}
        />
        {p.errors.email && <p className="text-sm text-destructive">{p.errors.email}</p>}
        {emailHint && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2.5 space-y-1">
            <p className="text-sm text-destructive font-medium">{emailHint.message}</p>
            {emailHint.suggestion && (
              <button
                type="button"
                onClick={applySuggestion}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Utiliser {emailHint.suggestion} →
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-phone">Téléphone *</Label>
        <Input
          id="w-phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={p.phoneNumber}
          onChange={e => { p.setPhoneNumber(e.target.value); p.setErrors({ ...p.errors, phone: undefined }); }}
          required
          className={p.errors.phone ? "border-destructive" : ""}
        />
        {p.errors.phone && <p className="text-sm text-destructive">{p.errors.phone}</p>}
        <p className="text-xs text-muted-foreground">Utilisé pour les appels audio/vidéo</p>
      </div>
    </div>
  );
};

const StepInfo = (p: SignupWizardProps) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="w-birth">Date de naissance</Label>
      <Input id="w-birth" type="date" value={p.birthdate} onChange={e => p.setBirthdate(e.target.value)} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="w-prof">Profession</Label>
      <Input id="w-prof" placeholder="Designer, Développeur..." value={p.profession} onChange={e => p.setProfession(e.target.value)} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="w-loc">Pays / Ville</Label>
      <Input id="w-loc" placeholder="Paris, France" value={p.location} onChange={e => p.setLocation(e.target.value)} />
    </div>
    <p className="text-xs text-muted-foreground text-center">Ces informations sont facultatives et peuvent être modifiées plus tard.</p>
  </div>
);

const StepSecurity = (p: SignupWizardProps) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="w-pass">Mot de passe *</Label>
      <PasswordInput
        id="w-pass"
        placeholder="••••••••"
        value={p.password}
        onChange={e => { p.setPassword(e.target.value); p.setErrors({}); }}
        required
        minLength={6}
        className={p.errors.password ? "border-destructive" : ""}
      />
      {p.errors.password && <p className="text-sm text-destructive">{p.errors.password}</p>}
      <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="w-confirm">Confirmer le mot de passe *</Label>
      <PasswordInput
        id="w-confirm"
        placeholder="••••••••"
        value={p.confirmPassword}
        onChange={e => { p.setConfirmPassword(e.target.value); p.setErrors({ ...p.errors, confirmPassword: undefined }); }}
        required
        minLength={6}
        className={p.errors.confirmPassword ? "border-destructive" : ""}
      />
      {p.errors.confirmPassword && <p className="text-sm text-destructive">{p.errors.confirmPassword}</p>}
    </div>
  </div>
);

export default SignupWizard;
