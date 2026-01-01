import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveChatMessage as ChatMessage } from "@/hooks/useLiveChat";

interface LiveChatMessageProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const LiveChatMessage = ({ message, isOwn }: LiveChatMessageProps) => {
  if (message.is_reaction) {
    return null; // Reactions are handled by floating animations
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2"
    >
      <Avatar className="w-6 h-6 flex-shrink-0">
        <AvatarImage src={message.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {message.profile?.display_name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold ${isOwn ? 'text-primary' : 'text-foreground'}`}>
          {isOwn ? "Vous" : message.profile?.display_name || "Anonyme"}
        </span>
        <p className="text-sm text-foreground break-words">{message.message}</p>
      </div>
    </motion.div>
  );
};
