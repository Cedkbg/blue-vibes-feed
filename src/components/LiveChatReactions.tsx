import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Flame, Star, ThumbsUp, Sparkles, PartyPopper } from "lucide-react";

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface LiveChatReactionsProps {
  onSendReaction: (reaction: string) => void;
  incomingReaction?: string | null;
}

const REACTIONS = [
  { emoji: "❤️", icon: Heart, color: "text-red-500" },
  { emoji: "🔥", icon: Flame, color: "text-orange-500" },
  { emoji: "⭐", icon: Star, color: "text-yellow-500" },
  { emoji: "👍", icon: ThumbsUp, color: "text-blue-500" },
  { emoji: "✨", icon: Sparkles, color: "text-purple-500" },
  { emoji: "🎉", icon: PartyPopper, color: "text-pink-500" },
];

export const LiveChatReactions = ({ onSendReaction, incomingReaction }: LiveChatReactionsProps) => {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // Add floating reaction when incoming
  useEffect(() => {
    if (incomingReaction) {
      const id = Date.now().toString() + Math.random();
      const x = Math.random() * 80 + 10; // Random position 10-90%
      
      setFloatingReactions(prev => [...prev, { id, emoji: incomingReaction, x }]);

      // Remove after animation
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    }
  }, [incomingReaction]);

  const handleReactionClick = (emoji: string) => {
    onSendReaction(emoji);
    setShowPicker(false);
    
    // Add local floating reaction
    const id = Date.now().toString();
    const x = Math.random() * 80 + 10;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  return (
    <div className="relative">
      {/* Floating reactions overlay */}
      <div className="fixed bottom-32 right-4 w-20 h-64 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ 
                opacity: 0, 
                y: -200, 
                scale: 1.5,
                x: [0, 10, -10, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2.5,
                ease: "easeOut",
                x: { duration: 1, repeat: 2 }
              }}
              className="absolute text-3xl"
              style={{ left: `${reaction.x}%` }}
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full right-0 mb-2 bg-popover border border-border rounded-2xl p-2 shadow-lg"
          >
            <div className="flex gap-1">
              {REACTIONS.map((reaction) => (
                <motion.button
                  key={reaction.emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReactionClick(reaction.emoji)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <span className="text-xl">{reaction.emoji}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <Button
        size="icon"
        variant="outline"
        className="rounded-xl relative"
        onClick={() => setShowPicker(!showPicker)}
      >
        <motion.div
          animate={showPicker ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heart className="w-4 h-4" />
        </motion.div>
      </Button>
    </div>
  );
};
