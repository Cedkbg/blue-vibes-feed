import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import cedliteLogo from "@/assets/cedlite-logo.png";
import { z } from "zod";
import OnboardingWelcome from "@/components/OnboardingWelcome";
import OnboardingFeatures from "@/components/OnboardingFeatures";
import OnboardingPromo from "@/components/OnboardingPromo";
import PasswordInput from "@/components/PasswordInput";
import SignupWizard from "@/components/SignupWizard";


const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");
const phoneSchema = z.string().min(8, "Numéro de téléphone invalide");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string; confirmPassword?: string }>({});
  

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const validateForm = (isSignup = false) => {
    const newErrors: { email?: string; password?: string; phone?: string; confirmPassword?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (isSignup) {
      const phoneResult = phoneSchema.safeParse(phoneNumber);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Numéro requis",
        description: "Le numéro de téléphone est obligatoire pour les appels.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const displayName = `${firstName} ${lastName}`.trim();
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            first_name: firstName,
            last_name: lastName,
            profession,
            location,
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Compte existant",
            description: "Cet email est déjà enregistré. Connectez-vous.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur d'inscription",
            description: error.message,
            variant: "destructive",
          });
        }
      } else if (data.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            display_name: displayName || null,
            username: username || null,
            phone_number: phoneNumber || null,
            birthdate: birthdate || null,
            profession: profession || null,
            location: location || null,
          })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        toast({
          title: "Inscription réussie 📧",
          description: "Un email de confirmation a été envoyé. Cliquez sur le lien pour activer votre compte.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue sur CedLite.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer un email valide.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
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

  if (onboardingStep === 0) {
    return <OnboardingWelcome onNext={() => setOnboardingStep(1)} />;
  }

  if (onboardingStep === 1) {
    return <OnboardingFeatures onBack={() => setOnboardingStep(0)} onNext={() => setOnboardingStep(2)} />;
  }

  if (onboardingStep === 2) {
    return <OnboardingPromo onBack={() => setOnboardingStep(1)} onNext={() => { sessionStorage.setItem("cedlite_onboarded", "true"); setOnboardingStep(null); }} />;
  }


  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 py-8 overflow-y-auto">

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
          <Tabs defaultValue="signin" className="w-full" onValueChange={(val) => {
            if (val === "signup" && onboardingStep === null && !sessionStorage.getItem("cedlite_onboarded")) {
              setOnboardingStep(0);
            }
          }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    required
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <PasswordInput
                    id="signin-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
                    required
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-muted-foreground"
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  Mot de passe oublié ?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <SignupWizard
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName} setLastName={setLastName}
                username={username} setUsername={setUsername}
                email={email} setEmail={setEmail}
                phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                birthdate={birthdate} setBirthdate={setBirthdate}
                profession={profession} setProfession={setProfession}
                location={location} setLocation={setLocation}
                password={password} setPassword={setPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                errors={errors} setErrors={setErrors}
                loading={loading}
                onSubmit={handleSignUp}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
