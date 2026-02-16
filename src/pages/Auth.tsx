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

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");
const phoneSchema = z.string().min(8, "Numéro de téléphone invalide");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
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
          title: "Vérifiez votre email 📧",
          description: "Un lien de confirmation a été envoyé à votre adresse email. Cliquez dessus pour activer votre compte.",
        });
        // Don't navigate - user must confirm email first
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
        redirectTo: `${window.location.origin}/auth`,
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      {/* Welcome Message */}
      <div className="w-full max-w-md mb-6 text-center space-y-3">
        <h2 className="text-2xl font-bold text-foreground">Bienvenue sur CedLite 🎉</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Rejoignez la communauté où chaque voix compte. Sur CedLite, partagez vos talents, 
          découvrez du contenu authentique et connectez-vous avec des créateurs du monde entier.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 bg-card rounded-lg p-2">
            <span>🎬</span>
            <span>Créez et partagez des vidéos</span>
          </div>
          <div className="flex items-center gap-2 bg-card rounded-lg p-2">
            <span>🔴</span>
            <span>Passez en live</span>
          </div>
          <div className="flex items-center gap-2 bg-card rounded-lg p-2">
            <span>💬</span>
            <span>Messagerie instantanée</span>
          </div>
          <div className="flex items-center gap-2 bg-card rounded-lg p-2">
            <span>🌍</span>
            <span>Communauté mondiale</span>
          </div>
        </div>
        <p className="text-xs text-primary font-medium">
          100% gratuit • Respect de la vie privée • Contenu de qualité
        </p>
      </div>

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
          <Tabs defaultValue="signin" className="w-full">
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
                  <Input
                    id="signin-password"
                    type="password"
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
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstname">Prénom *</Label>
                    <Input
                      id="signup-firstname"
                      type="text"
                      placeholder="Votre prénom"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-lastname">Nom *</Label>
                    <Input
                      id="signup-lastname"
                      type="text"
                      placeholder="Votre nom"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="signup-username">Pseudo</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="@votre_pseudo"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="signup-phone">Numéro de téléphone * (pour les appels)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setErrors({ ...errors, phone: undefined });
                      }}
                      required
                      className={errors?.phone ? "border-destructive" : ""}
                    />
                    {errors?.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-birthdate">Date de naissance</Label>
                    <Input
                      id="signup-birthdate"
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-profession">Profession</Label>
                    <Input
                      id="signup-profession"
                      type="text"
                      placeholder="Chef, Designer..."
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="signup-location">Ville</Label>
                    <Input
                      id="signup-location"
                      type="text"
                      placeholder="Paris, Lyon..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
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
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
                    required
                    minLength={6}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    required
                    minLength={6}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={loading}>
                  {loading ? "Inscription..." : "Créer un compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
