import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";

interface VerifiedProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profession: string | null;
}

const Certified = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<VerifiedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerified = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, profession")
        .eq("is_verified", true)
        .order("created_at", { ascending: true });

      if (data) setProfiles(data);
      setLoading(false);
    };
    fetchVerified();
  }, []);

  return (
    <DesktopLayout title="Certifiés">
      <main className="px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <BadgeCheck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Comptes certifiés</h1>
          <span className="text-sm text-muted-foreground">({profiles.length})</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BadgeCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun compte certifié pour le moment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-card rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/profile/${p.id}`)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {p.display_name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">
                      {p.display_name || p.username || "Utilisateur"}
                    </span>
                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    @{p.username || "user"}{p.profession ? ` · ${p.profession}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DesktopLayout>
  );
};

export default Certified;
