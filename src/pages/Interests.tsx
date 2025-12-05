import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterestsSelector } from "@/components/InterestsSelector";

const Interests = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Centres d'intérêt</h1>
      </header>

      {/* Content */}
      <div className="p-4">
        <InterestsSelector onComplete={() => navigate("/profile")} />
      </div>
    </div>
  );
};

export default Interests;
