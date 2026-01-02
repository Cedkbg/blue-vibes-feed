import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useWorldNews } from "@/hooks/useWorldNews";
import { 
  Globe, Search, Clock, ExternalLink, RefreshCw, 
  Trophy, Landmark, Briefcase, Cpu, Film, Microscope, Heart,
  Newspaper, Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const categoryIcons: Record<string, React.ReactNode> = {
  general: <Newspaper className="w-4 h-4" />,
  world: <Globe className="w-4 h-4" />,
  nation: <Landmark className="w-4 h-4" />,
  business: <Briefcase className="w-4 h-4" />,
  technology: <Cpu className="w-4 h-4" />,
  entertainment: <Film className="w-4 h-4" />,
  sports: <Trophy className="w-4 h-4" />,
  science: <Microscope className="w-4 h-4" />,
  health: <Heart className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  general: "Général",
  world: "Monde",
  nation: "National",
  business: "Business",
  technology: "Tech",
  entertainment: "Divertissement",
  sports: "Sports",
  science: "Science",
  health: "Santé",
};

const News = () => {
  const {
    articles,
    loading,
    error,
    searchQuery,
    activeCategory,
    categories,
    handleSearch,
    handleCategoryChange,
    refetch,
  } = useWorldNews();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(localSearch);
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="pt-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 mb-6 shadow-glow">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                <Globe className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">
                  Actualités Mondiales
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  Toutes les tendances en temps réel
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
              <Input
                type="text"
                placeholder="Rechercher des actualités..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 rounded-xl focus:bg-primary-foreground/30"
              />
            </form>
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full mb-6">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className={`shrink-0 gap-2 rounded-xl ${
                  activeCategory === category
                    ? "gradient-primary text-primary-foreground"
                    : ""
                }`}
              >
                {categoryIcons[category]}
                {categoryLabels[category]}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {articles.length} articles trouvés
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-4 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Articles */}
        <div className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : articles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucun article trouvé pour cette recherche
                </p>
              </CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Card
                key={article.id}
                className="group hover:shadow-medium transition-smooth overflow-hidden cursor-pointer"
                onClick={() => window.open(article.url, "_blank")}
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {article.image && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                        <img
                          src={article.image}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0"
                        >
                          {article.source.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(article.publishedAt)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>

                      {article.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </div>

                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default News;
