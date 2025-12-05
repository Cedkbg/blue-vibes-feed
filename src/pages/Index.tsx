import { FeedCard } from "@/components/FeedCard";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

const feedData = [
  {
    id: "1",
    user: {
      name: "Emma",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      age: 26,
      profession: "Chef",
      location: "Paris",
      isFollowing: false,
    },
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=900&fit=crop",
    caption: "Préparation d'un nouveau plat signature 🍳",
    likes: 15000,
    comments: 98,
    isLiked: false,
  },
  {
    id: "2",
    user: {
      name: "Lucas",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      age: 28,
      profession: "Photographe",
      location: "Lyon",
      isFollowing: true,
    },
    image: "https://images.unsplash.com/photo-1682687981674-0927add86f2b?w=600&h=900&fit=crop",
    caption: "Session photo au lever du soleil ☀️",
    likes: 8500,
    comments: 324,
    isLiked: true,
  },
  {
    id: "3",
    user: {
      name: "Sophie",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      age: 24,
      profession: "Designer",
      location: "Bordeaux",
      isFollowing: false,
    },
    image: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=600&h=900&fit=crop",
    caption: "Création en cours ✨ #Design #Creative",
    likes: 5892,
    comments: 156,
    isLiked: false,
  },
  {
    id: "4",
    user: {
      name: "Thomas",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      age: 31,
      profession: "Musicien",
      location: "Marseille",
      isFollowing: false,
    },
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=900&fit=crop",
    caption: "Concert ce soir 🎸 #LiveMusic",
    likes: 12300,
    comments: 801,
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
