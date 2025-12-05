import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Interest {
  id: string;
  name: string;
  icon: string | null;
}

interface InterestsSelectorProps {
  onComplete?: () => void;
}

export const InterestsSelector = ({ onComplete }: InterestsSelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInterests();
    if (user) {
      fetchUserInterests();
    }
  }, [user]);

  const fetchInterests = async () => {
    const { data, error } = await supabase
      .from("interests")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setInterests(data);
    }
    setIsLoading(false);
  };

  const fetchUserInterests = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_interests")
      .select("interest_id")
      .eq("user_id", user.id);
    
    if (data) {
      setSelectedIds(data.map((ui) => ui.interest_id));
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const saveInterests = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Delete existing interests
      await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", user.id);

      // Insert new interests
      if (selectedIds.length > 0) {
        const { error } = await supabase.from("user_interests").insert(
          selectedIds.map((interest_id) => ({
            user_id: user.id,
            interest_id,
          }))
        );
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Vos centres d'intérêt ont été enregistrés",
      });
      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Centres d'intérêt</h2>
        <p className="text-muted-foreground text-sm">
          Sélectionnez vos centres d'intérêt pour personnaliser votre expérience
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <Button
            key={interest.id}
            variant={selectedIds.includes(interest.id) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleInterest(interest.id)}
            className="rounded-full"
          >
            {interest.icon} {interest.name}
          </Button>
        ))}
      </div>

      <Button
        onClick={saveInterests}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
};
