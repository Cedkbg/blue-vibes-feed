import { Settings, Grid, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const userPosts = [
    { id: 1, image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=600&fit=crop", likes: "2.1k" },
    { id: 2, image: "https://images.unsplash.com/photo-1682687221038-404cb8830901?w=400&h=600&fit=crop", likes: "1.8k" },
    { id: 3, image: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&h=600&fit=crop", likes: "3.4k" },
    { id: 4, image: "https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=400&h=600&fit=crop", likes: "1.2k" },
    { id: 5, image: "https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=400&h=600&fit=crop", likes: "2.5k" },
    { id: 6, image: "https://images.unsplash.com/photo-1682687220208-22d7a2543e88?w=400&h=600&fit=crop", likes: "1.9k" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Profile</h1>
        <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      {/* Profile Info */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-6 mb-6">
          <Avatar className="w-24 h-24 ring-4 ring-primary/20">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Jessica Davis</h2>
            <p className="text-muted-foreground">@jessicad</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">127</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">12.5k</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">892</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-foreground mb-4">
          ✨ Content creator | Travel lover 🌍<br />
          📍 New York | Paris | Tokyo<br />
          💼 Collaboration: jessica@email.com
        </p>

        {/* Edit Profile Button */}
        <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-semibold">
          Edit Profile
        </Button>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="px-6">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <div className="grid grid-cols-3 gap-1">
            {userPosts.map((post) => (
              <div key={post.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer">
                <img 
                  src={post.image} 
                  alt={`Post ${post.id}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-semibold">{post.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No videos yet</p>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
};

export default Profile;
