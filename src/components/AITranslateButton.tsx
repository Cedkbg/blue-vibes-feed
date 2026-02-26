import { useState } from "react";
import { Languages, ChevronDown } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "français", label: "🇫🇷 Français" },
  { code: "anglais", label: "🇬🇧 English" },
  { code: "lingala", label: "🇨🇩 Lingala" },
  { code: "swahili", label: "🇹🇿 Swahili" },
  { code: "espagnol", label: "🇪🇸 Español" },
  { code: "arabe", label: "🇸🇦 العربية" },
];

interface AITranslateButtonProps {
  text: string;
  onTranslated: (translated: string) => void;
}

export const AITranslateButton = ({ text, onTranslated }: AITranslateButtonProps) => {
  const { translateText, isLoading } = useAI();
  const [translated, setTranslated] = useState(false);

  const handleTranslate = async (language: string) => {
    const result = await translateText(text, language);
    if (result) {
      onTranslated(result);
      setTranslated(true);
    }
  };

  if (translated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isLoading}
          className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Languages className="w-3.5 h-3.5" />
          )}
          <span>Traduire</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => handleTranslate(lang.code)}>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
