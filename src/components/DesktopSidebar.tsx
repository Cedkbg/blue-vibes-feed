import { Home, Video, Users, Phone, MessageCircle, User, Search, PlusCircle, Radio, Settings, Compass, Briefcase } from "lucide-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Accueil", path: "/" },
  { icon: Video, label: "Vidéos", path: "/video" },
  { icon: Compass, label: "Découvrir", path: "/discover" },
  { icon: Briefcase, label: "Créneau", path: "/creneau" },
  { icon: Users, label: "Amis", path: "/friends" },
  { icon: Phone, label: "Appels", path: "/calls" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Search, label: "Recherche", path: "/search" },
  { icon: User, label: "Profil", path: "/profile" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

export const DesktopSidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null; username: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-card border-r border-border flex flex-col z-50 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <img src={cedliteLogo} alt="CedLite" className="w-8 h-8" />
        <span className="text-xl font-bold text-foreground">CedLite</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </RouterNavLink>
        ))}
      </nav>

      {/* Action buttons */}
      <div className="px-3 pb-3 space-y-2">
        <button
          onClick={() => navigate("/create-post")}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Créer un post</span>
        </button>
      </div>

      {/* Profile */}
      {profile && (
        <div
          className="flex items-center gap-3 px-4 py-3 border-t border-border cursor-pointer hover:bg-muted transition-colors"
          onClick={() => navigate("/profile")}
        >
          <Avatar className="w-9 h-9">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="text-xs">{profile.display_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{profile.display_name || profile.username || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground truncate">@{profile.username || "user"}</p>
          </div>
        </div>
      )}
    </aside>
  );
};
