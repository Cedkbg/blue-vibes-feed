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

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
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
            display_name: displayName || null,
            birthdate: birthdate || null,
            profession: profession || null,
            location: location || null,
          })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        toast({
          title: "Inscription réussie !",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
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
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Votre nom"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
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
