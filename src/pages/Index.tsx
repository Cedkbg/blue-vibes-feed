import { FeedCard } from "@/components/FeedCard";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

const feedData = [
  {
    id: "1",
    user: {
      name: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      isFollowing: false,
    },
    image: "https://images.unsplash.com/photo-1682687982360-3fbab65f9d50?w=600&h=900&fit=crop",
    caption: "Beautiful sunset at the beach! 🌅 Can't get enough of these views!",
    likes: 3421,
    comments: 482,
    isLiked: false,
  },
  {
    id: "2",
    user: {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      isFollowing: true,
    },
    image: "https://images.unsplash.com/photo-1682687981674-0927add86f2b?w=600&h=900&fit=crop",
    caption: "Morning coffee and good vibes ☕✨ #MondayMotivation",
    likes: 2156,
    comments: 324,
    isLiked: true,
  },
  {
    id: "3",
    user: {
      name: "Sophie Martin",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      isFollowing: false,
    },
    image: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=600&h=900&fit=crop",
    caption: "Living my best life in the mountains! 🏔️ Adventure awaits!",
    likes: 5892,
    comments: 756,
    isLiked: false,
  },
  {
    id: "4",
    user: {
      name: "David Kim",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      isFollowing: false,
    },
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=900&fit=crop",
    caption: "City lights and late nights 🌃 Exploring the urban jungle!",
    likes: 4231,
    comments: 612,
    isLiked: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />
      
      <main className="max-w-lg mx-auto px-4 py-4">
        {feedData.map((post) => (
          <FeedCard key={post.id} {...post} />
        ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
