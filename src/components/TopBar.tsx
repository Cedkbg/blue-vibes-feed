import { Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TopBarProps {
  title?: string;
}

export const TopBar = ({ title = "Ced Lite" }: TopBarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Déconnexion réussie" });
      navigate("/auth");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground z-50 shadow-md">
      <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
