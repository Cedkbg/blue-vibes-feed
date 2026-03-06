import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { SuggestedAccounts } from "@/components/SuggestedAccounts";
import { HashtagText } from "@/components/HashtagText";
import {
  Clapperboard, Trophy, Swords, Gamepad2, Coffee, Laugh, Shirt, Newspaper,
  ArrowLeft, Heart, MessageCircle, Play, TrendingUp, Search, X, Megaphone, BadgeCheck,
  GraduationCap, Building2
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
  { id: "entertainment", label: "Divertissement", icon: Clapperboard, keywords: ["film", "série", "cinéma", "musique", "concert", "spectacle", "artiste", "chanson", "clip", "entertainment", "show", "danse", "dance"], description: "Films, séries, musique et spectacles", color: "from-purple-500 to-pink-500" },
  { id: "sports", label: "Sports", icon: Trophy, keywords: ["sport", "football", "basket", "tennis", "match", "équipe", "champion", "goal", "fitness", "gym", "musculation", "course", "marathon", "natation"], description: "Actualités sportives et performances", color: "from-green-500 to-emerald-500" },
  { id: "anime", label: "Anime & Comic", icon: Swords, keywords: ["anime", "manga", "comic", "naruto", "one piece", "dragon ball", "otaku", "cosplay", "webtoon", "shonen", "seinen"], description: "Anime, manga et bandes dessinées", color: "from-orange-500 to-red-500" },
  { id: "gaming", label: "Jeux vidéo", icon: Gamepad2, keywords: ["jeu", "game", "gaming", "gamer", "playstation", "xbox", "nintendo", "pc", "esport", "fortnite", "minecraft", "streaming", "twitch"], description: "Gaming, esport et nouvelles sorties", color: "from-blue-500 to-indigo-500" },
  { id: "daily", label: "Vie quotidienne", icon: Coffee, keywords: ["vie", "quotidien", "routine", "cuisine", "recette", "maison", "famille", "voyage", "travel", "food", "lifestyle", "santé", "bien-être"], description: "Partages du quotidien et lifestyle", color: "from-amber-500 to-yellow-500" },
  { id: "comedy", label: "Comédie", icon: Laugh, keywords: ["humour", "blague", "drôle", "funny", "rire", "comedy", "sketch", "prank", "meme", "lol", "mdr", "😂", "🤣"], description: "Humour, sketches et moments drôles", color: "from-yellow-500 to-orange-500" },
  { id: "fashion", label: "Mode", icon: Shirt, keywords: ["mode", "fashion", "style", "vêtement", "outfit", "tendance", "beauté", "maquillage", "makeup", "skincare", "accessoire", "luxe", "marque"], description: "Tendances mode et beauté", color: "from-pink-500 to-rose-500" },
  { id: "news", label: "Actualités & Perspectives", icon: Newspaper, keywords: ["actualité", "news", "info", "politique", "économie", "tech", "technologie", "science", "éducation", "société", "monde", "breaking"], description: "Informations et analyses du monde", color: "from-slate-500 to-gray-600" },
];

interface DiscoverSidebarProps {
  onNavigate: () => void;
}

export const DiscoverSidebar = ({ onNavigate }: DiscoverSidebarProps) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, caption, media_url, media_type, likes_count, comments_count, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setPosts(data.map(p => ({ ...p, profile: profileMap.get(p.user_id) || undefined })));
      }
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel("discover-sidebar-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return [];
    return posts.filter(post => {
      if (!post.caption) return false;
      const caption = post.caption.toLowerCase();
      const matchesCategory = selectedCategory.keywords.some(kw => caption.includes(kw.toLowerCase()));
      const matchesSearch = !searchQuery || caption.includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, posts, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(cat =>
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const handlePostClick = (postId: string) => {
    onNavigate();
    navigate(`/video?id=${postId}`);
  };

  if (selectedCategory) {
    return (
      <div className="flex flex-col h-full">
      <div className="p-4">
          <Button variant="ghost" size="sm" className="mb-3 gap-2" onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}>
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div className={`rounded-xl bg-gradient-to-r ${selectedCategory.color} p-4 text-white`}>
            <div className="flex items-center gap-2 mb-1">
              <selectedCategory.icon className="w-6 h-6" />
              <h2 className="text-lg font-bold">{selectedCategory.label}</h2>
            </div>
            <p className="text-white/80 text-xs">{selectedCategory.description}</p>
            <Badge className="mt-2 bg-white/20 text-white border-none text-xs">
              {filteredPosts.length} publication{filteredPosts.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans cette catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <selectedCategory.icon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Aucun contenu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.map(post => (
                <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handlePostClick(post.id)}>
                  <CardContent className="p-0">
                    <div className="flex gap-2 p-2">
                      {post.media_url && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {post.media_type === "video" ? (
                            <>
                              <video src={post.media_url} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={post.profile?.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">{post.profile?.display_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {post.profile?.display_name || post.profile?.username || "Utilisateur"}
                          </span>
                        </div>
                        <HashtagText text={post.caption || ""} className="text-xs line-clamp-2" />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> {post.likes_count}</span>
                          <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" /> {post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Découvrir</h2>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une catégorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Tendances Banner */}
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] mb-3"
        onClick={() => { onNavigate(); navigate("/trending"); }}
      >
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">🔥 Tendances</h3>
              <p className="text-white/80 text-[10px]">Contenus populaires du moment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pubb Banner */}
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] mb-3"
        onClick={() => { onNavigate(); navigate("/pubb"); }}
      >
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">Pubb</h3>
              <p className="text-white/80 text-[10px]">Publicités & Promotions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certified Banner */}
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] mb-4 border-2 border-primary/20"
        onClick={() => { onNavigate(); navigate("/certified"); }}
      >
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2.5">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">✅ Certifiés</h3>
              <p className="text-white/80 text-[10px]">Comptes vérifiés CedLite</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Mode Banner */}
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] mb-3"
        onClick={() => { onNavigate(); navigate("/student"); }}
      >
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">🎓 Mode Étudiant</h3>
              <p className="text-white/80 text-[10px]">Portfolio, CV & réseau campus</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Mode Banner */}
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] mb-4"
        onClick={() => { onNavigate(); navigate("/business"); }}
      >
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-slate-700 via-zinc-700 to-neutral-800 p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">💼 Mode Entreprise</h3>
              <p className="text-white/80 text-[10px]">Emploi, recrutement & pages pro</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Catégories</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {filteredCategories.map(cat => (
          <Card
            key={cat.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={() => setSelectedCategory(cat)}
          >
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${cat.color} p-3`}>
                <cat.icon className="w-6 h-6 text-white mb-2" />
                <h3 className="font-bold text-white text-xs">{cat.label}</h3>
                <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1">{cat.description}</p>
                <Badge className="mt-2 bg-white/20 text-white border-none text-[10px]">
                  {posts.filter(p => p.caption && cat.keywords.some(kw => p.caption!.toLowerCase().includes(kw.toLowerCase()))).length} posts
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SuggestedAccounts onNavigate={onNavigate} />
    </div>
  );
};
