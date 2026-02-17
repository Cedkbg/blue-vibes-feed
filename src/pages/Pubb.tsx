import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Megaphone, Eye, MousePointerClick, ExternalLink,
  Image, Video, ShoppingBag, Briefcase, Sparkles, Tag, TrendingUp
} from "lucide-react";

interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: string | null;
  link_url: string | null;
  category: string | null;
  views_count: number;
  clicks_count: number;
  status: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const adCategories = [
  { id: "product", label: "Produit", icon: ShoppingBag, color: "from-blue-500 to-cyan-500" },
  { id: "service", label: "Service", icon: Briefcase, color: "from-purple-500 to-violet-500" },
  { id: "event", label: "Événement", icon: Sparkles, color: "from-pink-500 to-rose-500" },
  { id: "promotion", label: "Promotion", icon: Tag, color: "from-orange-500 to-amber-500" },
  { id: "other", label: "Autre", icon: Megaphone, color: "from-green-500 to-emerald-500" },
];

const Pubb = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [category, setCategory] = useState("product");
  const [uploading, setUploading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setAds(data.map(a => ({ ...a, profile: profileMap.get(a.user_id) || undefined })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();
    const channel = supabase
      .channel("pubb-ads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ads" }, () => fetchAds())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `ads/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'uploader le fichier", variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setMediaUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleCreateAd = async () => {
    if (!user || !title.trim()) return;
    if (title.trim().length > 100) {
      toast({ title: "Erreur", description: "Le titre ne doit pas dépasser 100 caractères", variant: "destructive" });
      return;
    }
    if (description.trim().length > 500) {
      toast({ title: "Erreur", description: "La description ne doit pas dépasser 500 caractères", variant: "destructive" });
      return;
    }
    const trimmedLink = linkUrl.trim();
    if (trimmedLink) {
      try {
        const parsed = new URL(trimmedLink);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          toast({ title: "Erreur", description: "Le lien doit commencer par http:// ou https://", variant: "destructive" });
          return;
        }
      } catch {
        toast({ title: "Erreur", description: "Lien invalide", variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("ads").insert({
      user_id: user.id,
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 500) || null,
      media_url: mediaUrl || null,
      media_type: mediaUrl ? (mediaUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "image") : null,
      link_url: trimmedLink || null,
      category,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer la publicité", variant: "destructive" });
    } else {
      toast({ title: "Publicité créée !" });
      setCreateOpen(false);
      setTitle(""); setDescription(""); setLinkUrl(""); setMediaUrl(""); setCategory("product");
      fetchAds();
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleAdClick = async (ad: Ad) => {
    // Safely increment clicks via RPC (no race condition)
    await supabase.rpc("increment_ad_clicks", { ad_id: ad.id });
    if (ad.link_url && isValidUrl(ad.link_url)) {
      window.open(ad.link_url, "_blank", "noopener,noreferrer");
    }
  };

  const filteredAds = filterCategory === "all" ? ads : ads.filter(a => a.category === filterCategory);

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />
      <main className="max-w-2xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigate("/discover")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold truncate">Pubb</h1>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> Créer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nouvelle publicité</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Titre de la publicité *" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {adCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Lien externe (optionnel)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Image / Vidéo</label>
                  <Input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={uploading} />
                  {mediaUrl && (
                    <img src={mediaUrl} alt="preview" className="mt-2 rounded-lg max-h-32 object-cover" />
                  )}
                </div>
                <Button onClick={handleCreateAd} disabled={!title.trim() || uploading} className="w-full">
                  Publier la publicité
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Plateforme de publicités et promotions
        </p>

        {/* Category filters */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            <Badge
              variant={filterCategory === "all" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap text-xs"
              onClick={() => setFilterCategory("all")}
            >
              Tout
            </Badge>
            {adCategories.map(c => (
              <Badge
                key={c.id}
                variant={filterCategory === c.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap gap-1 text-xs"
                onClick={() => setFilterCategory(c.id)}
              >
                <c.icon className="w-3 h-3" />
                {c.label}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredAds.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Aucune publicité pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Soyez le premier à promouvoir votre contenu !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAds.map(ad => {
              const cat = adCategories.find(c => c.id === ad.category);
              return (
                <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {ad.media_url && (
                      <div className="relative w-full aspect-video bg-muted">
                        {ad.media_type === "video" ? (
                          <video src={ad.media_url} className="w-full h-full object-contain bg-black" controls />
                        ) : (
                          <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                        )}
                        {cat && (
                          <Badge className={`absolute top-2 left-2 bg-gradient-to-r ${cat.color} text-white border-none gap-1`}>
                            <cat.icon className="w-3 h-3" />
                            {cat.label}
                          </Badge>
                        )}
                        <Badge className="absolute top-2 right-2 bg-black/60 text-white border-none text-xs">
                          Sponsorisé
                        </Badge>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={ad.profile?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">{ad.profile?.display_name?.[0] || "P"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {ad.profile?.display_name || ad.profile?.username || "Annonceur"}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{ad.title}</h3>
                      {ad.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">{ad.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.views_count}</span>
                          <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks_count}</span>
                        </div>
                        {ad.link_url && (
                          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleAdClick(ad)}>
                            <ExternalLink className="w-3 h-3" /> Voir plus
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Pubb;
