/**
 * Route publique : /u/:username
 * Redirige vers /profile/:userId après résolution du username → userId
 */
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cedliteLogo from "@/assets/cedlite-logo.png";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const resolve = async () => {
      if (!username) {
        navigate("/", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("profiles_public")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (data?.id) {
        navigate(`/profile/${data.id}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    resolve();
  }, [username, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 animate-pulse">
      <img src={cedliteLogo} alt="CedLite" className="w-16 h-16" />
      <p className="text-muted-foreground">Chargement du profil...</p>
    </div>
  );
};

export default UserProfile;
