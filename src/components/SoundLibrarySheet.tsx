import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Search, Play, Pause, Check, X, Flame, Mic, TreePine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Sound {
  id: string;
  title: string;
  artist: string | null;
  category: string;
  genre: string | null;
  duration_seconds: number | null;
  audio_url: string;
  cover_url: string | null;
  uses_count: number;
  is_featured: boolean;
}

interface SoundLibrarySheetProps {
  onSelect: (sound: Sound) => void;
  selectedSound?: Sound | null;
  children: React.ReactNode;
}

const categoryFilters = [
  { id: "all", label: "Tout", icon: Music },
  { id: "music", label: "Musique", icon: Music },
  { id: "motivation", label: "Motivation", icon: Flame },
  { id: "ambiance", label: "Ambiance", icon: TreePine },
];

export const SoundLibrarySheet = ({ onSelect, selectedSound, children }: SoundLibrarySheetProps) => {
  const [open, setOpen] = useState(false);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchSounds();
    return () => { audioRef.current?.pause(); };
  }, [open]);

  const fetchSounds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sound_library")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("uses_count", { ascending: false });
    if (data) setSounds(data as Sound[]);
    setLoading(false);
  };

  const filtered = sounds.filter((s) => {
    const matchCat = category === "all" || s.category === category;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.artist?.toLowerCase().includes(search.toLowerCase()) || s.genre?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const togglePlay = (sound: Sound) => {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      audioRef.current?.pause();
      const audio = new Audio(sound.audio_url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingId(null);
      setPlayingId(sound.id);
    }
  };

  const handleSelect = (sound: Sound) => {
    audioRef.current?.pause();
    setPlayingId(null);
    onSelect(sound);
    setOpen(false);
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === "motivation") return <Mic className="w-3 h-3" />;
    if (cat === "ambiance") return <TreePine className="w-3 h-3" />;
    return <Music className="w-3 h-3" />;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Bibliothèque de sons
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un son..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryFilters.map((c) => (
              <Badge
                key={c.id}
                variant={category === c.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap gap-1"
                onClick={() => setCategory(c.id)}
              >
                <c.icon className="w-3 h-3" />
                {c.label}
              </Badge>
            ))}
          </div>

          {/* Sound list */}
          <ScrollArea className="h-[calc(80vh-200px)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun son trouvé</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((sound) => (
                  <div
                    key={sound.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                      selectedSound?.id === sound.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                    }`}
                  >
                    {/* Play button */}
                    <button
                      onClick={() => togglePlay(sound)}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                    >
                      {playingId === sound.id ? (
                        <Pause className="w-4 h-4 text-primary" />
                      ) : (
                        <Play className="w-4 h-4 text-primary ml-0.5" />
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0" onClick={() => handleSelect(sound)}>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{sound.title}</p>
                        {sound.is_featured && (
                          <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{sound.artist || "Inconnu"}</span>
                        {sound.genre && (
                          <>
                            <span>•</span>
                            <span>{sound.genre}</span>
                          </>
                        )}
                        {sound.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>{sound.duration_seconds}s</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Category badge */}
                    <Badge variant="secondary" className="text-[10px] gap-1 flex-shrink-0">
                      {getCategoryIcon(sound.category)}
                      {sound.category}
                    </Badge>

                    {/* Select */}
                    {selectedSound?.id === sound.id ? (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs flex-shrink-0"
                        onClick={() => handleSelect(sound)}
                      >
                        Utiliser
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
