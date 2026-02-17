import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
}

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const { data } = await supabase
      .from("profiles_public")
      .select("id, username, display_name, avatar_url, bio")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);

    setUsers(data || []);
  };

  const searchPosts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPosts([]);
      return;
    }

    const { data } = await supabase
      .from("posts")
      .select("id, caption, media_url, media_type")
      .ilike("caption", `%${searchQuery}%`)
      .limit(20);

    setPosts(data || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        setIsLoading(true);
        Promise.all([searchUsers(query), searchPosts(query)]).finally(() => {
          setIsLoading(false);
        });
      } else {
        setUsers([]);
        setPosts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setUsers([]);
    setPosts([]);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
            <Input
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="pl-10 pr-10 bg-primary-foreground/10 border-0 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary-foreground/60 hover:text-primary-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {!query ? (
          <div className="text-center py-20 text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Recherchez des utilisateurs ou du contenu</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="users">
                Utilisateurs ({users.length})
              </TabsTrigger>
              <TabsTrigger value="posts">
                Posts ({posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-0">
              {users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => navigate(`/chat/${user.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.display_name || user.username || "?")?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">
                          {user.display_name || user.username || "Utilisateur"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username || "user"}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground truncate">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="mt-0">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucun post trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      className="aspect-square bg-muted rounded-lg overflow-hidden"
                    >
                      {post.media_url ? (
                        post.media_type === "video" ? (
                          <video
                            src={post.media_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={post.media_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                            {post.caption}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Search;
