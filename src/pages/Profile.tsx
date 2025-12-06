import { useState, useEffect } from "react";
import { Settings, Grid, Video, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface Profile {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  external_link: string | null;
  is_private: boolean;
  language: string | null;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username, bio, avatar_url, external_link, is_private, language")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } else {
      setProfile(data);
    }
    setLoadingProfile(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnecté avec succès");
      navigate("/auth");
    }
  };

  const userPosts = [
    { id: 1, image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=600&fit=crop", likes: "2.1k" },
    { id: 2, image: "https://images.unsplash.com/photo-1682687221038-404cb8830901?w=400&h=600&fit=crop", likes: "1.8k" },
    { id: 3, image: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&h=600&fit=crop", likes: "3.4k" },
    { id: 4, image: "https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=400&h=600&fit=crop", likes: "1.2k" },
    { id: 5, image: "https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=400&h=600&fit=crop", likes: "2.5k" },
    { id: 6, image: "https://images.unsplash.com/photo-1682687220208-22d7a2543e88?w=400&h=600&fit=crop", likes: "1.9k" },
  ];

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={cedliteLogo} alt="CedLite" className="w-16 h-16" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={cedliteLogo} alt="CedLite" className="w-8 h-8" />
          <h1 className="text-xl font-bold">Profil</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
          <Avatar className="w-24 h-24 ring-4 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold mb-1">
              {profile?.username || "Utilisateur"}
            </h2>
            <p className="text-muted-foreground">@{profile?.username || "user"}</p>
            {profile?.is_private && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                🔒 Compte privé
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-card rounded-xl">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="text-center p-3 bg-card rounded-xl">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Abonnés</div>
          </div>
          <div className="text-center p-3 bg-card rounded-xl">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Abonnements</div>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-foreground mb-4 whitespace-pre-line">{profile.bio}</p>
        )}
        
        {/* External Link */}
        {profile?.external_link && (
          <a 
            href={profile.external_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm block mb-4"
          >
            🔗 {profile.external_link}
          </a>
        )}

        {/* Edit Profile Button */}
        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetTrigger asChild>
            <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-semibold">
              Modifier le profil
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
            <EditProfileSheet 
              profile={profile} 
              userId={user?.id || ""} 
              onUpdate={fetchProfile}
              onClose={() => setIsEditOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="px-4 sm:px-6">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Vidéos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <div className="text-center py-12 text-muted-foreground">
            <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun post pour le moment</p>
            <p className="text-sm mt-2">Partagez votre premier contenu !</p>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune vidéo pour le moment</p>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
};

export default Profile;
