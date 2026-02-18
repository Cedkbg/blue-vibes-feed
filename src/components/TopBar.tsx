import { Search, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface TopBarProps {
  title?: string;
}

export const TopBar = ({ title = "CedLite" }: TopBarProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground z-50 shadow-md">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={cedliteLogo} alt="CedLite" className="w-8 h-8" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <div className="flex gap-2">
          <NotificationsSheet />
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/trending")}
            aria-label="Tendances"
          >
            <Flame className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/search")}
            aria-label="Rechercher"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
