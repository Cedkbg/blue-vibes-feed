import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Clapperboard, Trophy, Swords, Gamepad2, Coffee, Laugh, Shirt, Newspaper,
  ArrowLeft, Heart, MessageCircle, Play, TrendingUp, Megaphone
} from "lucide-react";

interface Post {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  keywords: string[];
  description: string;
  color: string;
}

const categories: Category[] = [
  {
    id: "entertainment",
    label: "Divertissement",
    icon: Clapperboard,
    keywords: ["film", "série", "cinéma", "musique", "concert", "spectacle", "artiste", "chanson", "clip", "entertainment", "show", "danse", "dance"],
    description: "Films, séries, musique et spectacles",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "sports",
    label: "Sports",
    icon: Trophy,
    keywords: ["sport", "football", "basket", "tennis", "match", "équipe", "champion", "goal", "fitness", "gym", "musculation", "course", "marathon", "natation"],
    description: "Actualités sportives et performances",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "anime",
    label: "Anime & Comic",
    icon: Swords,
    keywords: ["anime", "manga", "comic", "naruto", "one piece", "dragon ball", "otaku", "cosplay", "webtoon", "shonen", "seinen"],
    description: "Anime, manga et bandes dessinées",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "gaming",
    label: "Jeux vidéo",
    icon: Gamepad2,
    keywords: ["jeu", "game", "gaming", "gamer", "playstation", "xbox", "nintendo", "pc", "esport", "fortnite", "minecraft", "streaming", "twitch"],
    description: "Gaming, esport et nouvelles sorties",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "daily",
    label: "Vie quotidienne",
    icon: Coffee,
    keywords: ["vie", "quotidien", "routine", "cuisine", "recette", "maison", "famille", "voyage", "travel", "food", "lifestyle", "santé", "bien-être"],
    description: "Partages du quotidien et lifestyle",
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "comedy",
    label: "Comédie",
    icon: Laugh,
    keywords: ["humour", "blague", "drôle", "funny", "rire", "comedy", "sketch", "prank", "meme", "lol", "mdr", "😂", "🤣"],
    description: "Humour, sketches et moments drôles",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "fashion",
    label: "Mode",
    icon: Shirt,
    keywords: ["mode", "fashion", "style", "vêtement", "outfit", "tendance", "beauté", "maquillage", "makeup", "skincare", "accessoire", "luxe", "marque"],
    description: "Tendances mode et beauté",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "news",
    label: "Actualités & Perspectives",
    icon: Newspaper,
    keywords: ["actualité", "news", "info", "politique", "économie", "tech", "technologie", "science", "éducation", "société", "monde", "breaking"],
    description: "Informations et analyses du monde",
    color: "from-slate-500 to-gray-600",
  },
];

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, caption, media_url, media_type, likes_count, comments_count, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      // Fetch profiles for posts
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setPosts(data.map(p => ({ ...p, profile: profileMap.get(p.user_id) || undefined })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("discover-posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return [];
    return posts.filter(post => {
      if (!post.caption) return false;
      const caption = post.caption.toLowerCase();
      return selectedCategory.keywords.some(kw => caption.includes(kw.toLowerCase()));
    });
  }, [selectedCategory, posts]);

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16">
        <TopBar />
        <main className="max-w-2xl mx-auto px-4 py-4">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => setSelectedCategory(null)}>
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          <div className={`rounded-2xl bg-gradient-to-r ${selectedCategory.color} p-6 mb-6 text-white`}>
            <div className="flex items-center gap-3 mb-2">
              <selectedCategory.icon className="w-8 h-8" />
              <h1 className="text-2xl font-bold">{selectedCategory.label}</h1>
            </div>
            <p className="text-white/80 text-sm">{selectedCategory.description}</p>
            <Badge className="mt-3 bg-white/20 text-white border-none">
              {filteredPosts.length} publication{filteredPosts.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <selectedCategory.icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Aucun contenu dans cette catégorie</p>
                  <p className="text-sm text-muted-foreground">
                    Publiez avec des mots-clés liés à « {selectedCategory.label} »
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/video?id=${post.id}`)}>
                    <CardContent className="p-0">
                      <div className="flex gap-3 p-3">
                        {post.media_url && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {post.media_type === "video" ? (
                              <>
                                <video src={post.media_url} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-6 h-6 text-white" />
                                </div>
                              </>
                            ) : (
                              <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={post.profile?.avatar_url || ""} />
                              <AvatarFallback className="text-xs">{post.profile?.display_name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">
                              {post.profile?.display_name || post.profile?.username || "Utilisateur"}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2 mb-2">{post.caption}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />
      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Découvrir</h1>
        </div>

        {/* Pubb Banner */}
        <Card
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] mb-4"
          onClick={() => navigate("/pubb")}
        >
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary to-accent p-5 flex items-center gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">Pubb</h3>
                <p className="text-white/80 text-sm">Publicités & Promotions</p>
              </div>
              <Badge className="bg-white/20 text-white border-none">Nouveau</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <Card
              key={cat.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
              onClick={() => setSelectedCategory(cat)}
            >
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${cat.color} p-5`}>
                  <cat.icon className="w-8 h-8 text-white mb-3" />
                  <h3 className="font-bold text-white text-sm">{cat.label}</h3>
                  <p className="text-white/70 text-xs mt-1 line-clamp-2">{cat.description}</p>
                  <Badge className="mt-3 bg-white/20 text-white border-none text-xs">
                    {posts.filter(p => p.caption && cat.keywords.some(kw => p.caption!.toLowerCase().includes(kw.toLowerCase()))).length} posts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Discover;
