import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { z } from "zod";
import OnboardingWelcome from "@/components/OnboardingWelcome";
import OnboardingFeatures from "@/components/OnboardingFeatures";
import OnboardingPromo from "@/components/OnboardingPromo";
import OnboardingSignupSplash from "@/components/OnboardingSignupSplash";
import SignupStepScreen from "@/components/SignupStepScreen";
import PasswordInput from "@/components/PasswordInput";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  // null = login page, 0-2 = onboarding, 3 = splash, 4-5 = signup steps (2 steps)
  // Visitors start at onboarding step 0 by default
  const [onboardingStep, setOnboardingStep] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const validateSignupForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    if (password !== confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLoginForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;
    setLoading(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      const redirectUrl = `${window.location.origin}/interests`;
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: displayName, first_name: firstName, last_name: lastName }
        }
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          toast({ title: "Compte existant", description: "Cet email est déjà enregistré. Connectez-vous.", variant: "destructive" });
        } else {
          toast({ title: "Erreur d'inscription", description: error.message, variant: "destructive" });
        }
      } else if (data.user) {
        await supabase.from("profiles").update({
          first_name: firstName || null,
          last_name: lastName || null,
          display_name: displayName || null,
          birthdate: birthdate || null,
        }).eq("id", data.user.id);
        toast({ title: "Inscription réussie 📧", description: "Un email de confirmation a été envoyé." });
        setOnboardingStep(null); // back to login
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Connexion réussie !", description: "Bienvenue sur CedLite." });
        navigate("/");
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ title: "Email requis", description: "Veuillez entrer un email valide.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
      else toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe." });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={cedliteLogo} alt="CedLite" className="w-20 h-20" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Onboarding flow (steps 0-3)
  if (onboardingStep === 0) return <OnboardingWelcome onNext={() => setOnboardingStep(1)} />;
  if (onboardingStep === 1) return <OnboardingFeatures onBack={() => setOnboardingStep(0)} onNext={() => setOnboardingStep(2)} />;
  if (onboardingStep === 2) return <OnboardingPromo onBack={() => setOnboardingStep(1)} onNext={() => setOnboardingStep(3)} />;
  if (onboardingStep === 3) return <OnboardingSignupSplash onBack={() => setOnboardingStep(2)} onNext={() => setOnboardingStep(4)} onLogin={() => setOnboardingStep(null)} />;

  // Signup steps (4-5 map to step 0-1, 2 steps total)
  if (onboardingStep !== null && onboardingStep >= 4 && onboardingStep <= 5) {
    const signupStep = onboardingStep - 4;
    const sharedProps = {
      firstName, setFirstName,
      lastName, setLastName,
      email, setEmail,
      birthdate, setBirthdate,
      location: "", setLocation: () => {},
      password, setPassword,
      confirmPassword, setConfirmPassword,
      errors, setErrors,
      loading,
      totalDots: 6,
      currentDot: onboardingStep,
    };
    return (
      <SignupStepScreen
        step={signupStep}
        onBack={() => setOnboardingStep(onboardingStep - 1)}
        onNext={() => setOnboardingStep(onboardingStep + 1)}
        onSubmit={handleSignUp}
        {...sharedProps}
      />
    );
  }

  // Login page (onboardingStep === null)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto">
            <img src={cedliteLogo} alt="CedLite" className="w-20 h-20 mx-auto" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-foreground">CedLite</CardTitle>
            <CardDescription className="mt-2">Créez et partagez vos contenus</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email" type="email" placeholder="vous@exemple.com"
                value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                required className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Mot de passe</Label>
              <PasswordInput
                id="signin-password" placeholder="••••••••"
                value={password} onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                required className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
            <Button type="button" variant="link" className="w-full text-muted-foreground" onClick={handleResetPassword} disabled={loading}>
              Mot de passe oublié ?
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full font-semibold gap-2"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: "Erreur", description: error.message, variant: "destructive" });
                setLoading(false);
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </Button>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">Pas encore de compte ?</p>
            <Button
              variant="outline"
              className="w-full font-semibold"
              onClick={() => setOnboardingStep(0)}
            >
              Créer un compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
