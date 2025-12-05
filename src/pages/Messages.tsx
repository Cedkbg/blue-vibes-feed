import { Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";

const conversations = [
  {
    id: 1,
    name: "Emma Wilson",
    initials: "EW",
    lastMessage: "Sure, sounds like a plan!",
    time: "2m",
    unread: 2,
  },
  {
    id: 2,
    name: "Michael Chen",
    initials: "MC",
    lastMessage: "Thanks for sharing!",
    time: "1h",
    unread: 0,
  },
  {
    id: 3,
    name: "Sophie Martin",
    initials: "SM",
    lastMessage: "See you tomorrow 👋",
    time: "3h",
    unread: 0,
  },
  {
    id: 4,
    name: "David Kim",
    initials: "DK",
    lastMessage: "That's amazing!",
    time: "1d",
    unread: 1,
  },
];

const Messages = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
          <Input 
            placeholder="Rechercher..."
            className="pl-10 bg-primary-foreground/10 border-0 text-primary-foreground placeholder:text-primary-foreground/60"
          />
        </div>
      </header>

      {/* Conversations List */}
      <div className="divide-y divide-border">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
          >
            <div className="relative">
              <Avatar className="w-14 h-14 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {conversation.initials}
                </AvatarFallback>
              </Avatar>
              {conversation.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-bold">
                    {conversation.unread}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{conversation.name}</h3>
                <span className="text-xs text-muted-foreground">{conversation.time}</span>
              </div>
              <p className={`text-sm ${conversation.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {conversation.lastMessage}
              </p>
            </div>

            <Button size="icon" variant="ghost">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
