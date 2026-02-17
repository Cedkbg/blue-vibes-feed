import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface OTPVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerification = ({ email, onVerified, onBack }: OTPVerificationProps) => {
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer le code à 6 chiffres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) {
        toast({
          title: "Code invalide",
          description: "Le code est incorrect ou a expiré. Veuillez réessayer.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Compte vérifié ✅",
          description: "Votre compte a été activé avec succès !",
        });
        onVerified();
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

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code renvoyé 📧",
          description: "Un nouveau code a été envoyé à votre adresse email.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <img src={cedliteLogo} alt="CedLite" className="w-16 h-16 mx-auto" />
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription className="text-sm">
            Un code de vérification à 6 chiffres a été envoyé à{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="w-full font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Vérifier le code
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas reçu le code ?
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={resending}
              className="text-primary"
            >
              {resending ? "Envoi en cours..." : "Renvoyer le code"}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'inscription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
