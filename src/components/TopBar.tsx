import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title?: string;
}

export const TopBar = ({ title = "Ced Lite" }: TopBarProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground z-50 shadow-md">
      <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
