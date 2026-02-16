import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀","😂","🤣","😊","😍","🥰","😘","😜","🤪","😎","🤩","🥳","😢","😭","😡","🤬","🥺","😱","🤯","🤗","🤔","🤫","🤭","😴","🤤","😇","🙃","😏","😬","🫠","🫡","🫣","🫢","🤠","🥴","😵","🤑","😈","👿","👻","💀","☠️","👽","🤖","🎃","😺","😸","😻"]
  },
  {
    name: "Gestes",
    emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","🤟","🤘","👌","🤌","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","💪","🙏","✍️","🤳","💅","🦾","🦿","👀","👁️","👅","👄","💋","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝"]
  },
  {
    name: "Animaux",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🐢","🐍","🦎","🐙","🦑","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈"]
  },
  {
    name: "Nourriture",
    emojis: ["🍎","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🍆","🌶️","🫑","🥒","🥬","🥦","🧄","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🧇","🥞","🧈","🍕","🍔","🍟","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲","🫕"]
  },
  {
    name: "Objets",
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏹","🎯","⛳","🪁","🏋️","🤸","⛷️","🏂","🪂","🏊","🤿","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","✈️","🚀","🛸","🎮","🎬","🎵"]
  },
];

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredCategories = search
    ? EMOJI_CATEGORIES.map(cat => ({
        ...cat,
        emojis: cat.emojis.filter(e => e.includes(search))
      })).filter(cat => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg w-72 overflow-hidden">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      {!search && (
        <div className="flex border-b border-border px-1">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}
      <ScrollArea className="h-48">
        <div className="p-2">
          {(search ? filteredCategories : [EMOJI_CATEGORIES[activeCategory]]).map(cat => (
            <div key={cat.name}>
              {search && <p className="text-xs text-muted-foreground mb-1 px-1">{cat.name}</p>}
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
