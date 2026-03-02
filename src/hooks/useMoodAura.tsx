import { useMemo } from "react";

/**
 * Mood Aura - Analyse le sentiment d'un texte et retourne une aura visuelle
 * Fonctionnalité unique : chaque post a une "aura émotionnelle" colorée
 */

export type MoodType = "joy" | "love" | "energy" | "calm" | "sadness" | "anger" | "mystery" | "neutral";

interface MoodAura {
  mood: MoodType;
  label: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  textClass: string;
}

const MOOD_MAP: Record<MoodType, Omit<MoodAura, "mood">> = {
  joy: {
    label: "Joie",
    emoji: "✨",
    gradient: "from-amber-400/20 via-yellow-300/10 to-orange-400/20",
    glowColor: "shadow-amber-400/30",
    textClass: "text-amber-500",
  },
  love: {
    label: "Amour",
    emoji: "💖",
    gradient: "from-rose-400/20 via-pink-300/10 to-red-400/20",
    glowColor: "shadow-rose-400/30",
    textClass: "text-rose-500",
  },
  energy: {
    label: "Énergie",
    emoji: "⚡",
    gradient: "from-orange-400/20 via-red-300/10 to-yellow-400/20",
    glowColor: "shadow-orange-400/30",
    textClass: "text-orange-500",
  },
  calm: {
    label: "Sérénité",
    emoji: "🌊",
    gradient: "from-cyan-400/20 via-blue-300/10 to-teal-400/20",
    glowColor: "shadow-cyan-400/30",
    textClass: "text-cyan-500",
  },
  sadness: {
    label: "Mélancolie",
    emoji: "🌧️",
    gradient: "from-blue-400/20 via-indigo-300/10 to-slate-400/20",
    glowColor: "shadow-blue-400/30",
    textClass: "text-blue-500",
  },
  anger: {
    label: "Passion",
    emoji: "🔥",
    gradient: "from-red-500/20 via-rose-400/10 to-orange-500/20",
    glowColor: "shadow-red-400/30",
    textClass: "text-red-500",
  },
  mystery: {
    label: "Mystère",
    emoji: "🌙",
    gradient: "from-violet-400/20 via-purple-300/10 to-indigo-400/20",
    glowColor: "shadow-violet-400/30",
    textClass: "text-violet-500",
  },
  neutral: {
    label: "",
    emoji: "",
    gradient: "",
    glowColor: "",
    textClass: "",
  },
};

// Keyword-based sentiment analysis (fast, no API needed)
const MOOD_KEYWORDS: Record<MoodType, string[]> = {
  joy: ["heureux", "content", "joie", "rire", "sourire", "bonheur", "fête", "célébr", "bravo", "super", "génial", "magnifique", "incroyable", "merveilleux", "happy", "joy", "amazing", "wonderful", "great", "awesome", "beautiful", "love it", "🎉", "😂", "😄", "🥳", "😊", "🤩", "❤️", "lol", "mdr", "ptdr"],
  love: ["amour", "aime", "coeur", "kiss", "câlin", "tendresse", "chéri", "bébé", "love", "heart", "darling", "forever", "ensemble", "💕", "💖", "💗", "😍", "🥰", "💋", "❤️", "💓"],
  energy: ["motivation", "force", "énergie", "power", "go", "let's", "allons", "victoire", "gagn", "champion", "boss", "strong", "push", "grind", "hustle", "🔥", "💪", "🏆", "⚡", "🚀"],
  calm: ["paix", "calme", "zen", "nature", "silence", "tranquil", "méditat", "seren", "repos", "peaceful", "relax", "chill", "quiet", "breath", "🌿", "🧘", "☮️", "🌊", "🍃"],
  sadness: ["triste", "pleur", "larme", "manque", "seul", "douleur", "peine", "perdu", "sad", "miss", "lonely", "pain", "cry", "tears", "gone", "😢", "😭", "💔", "🥺", "😞"],
  anger: ["colère", "énervé", "rage", "furieux", "déteste", "insupport", "angry", "hate", "mad", "furious", "fed up", "marre", "ras le bol", "😡", "🤬", "💢"],
  mystery: ["secret", "mystère", "ombre", "nuit", "rêve", "dream", "imagine", "univers", "cosmos", "destiny", "destin", "étoile", "lune", "magic", "🌙", "✨", "🔮", "🌌", "💫"],
  neutral: [],
};

function detectMood(text: string): MoodType {
  if (!text || text.trim().length < 3) return "neutral";
  
  const lower = text.toLowerCase();
  const scores: Record<MoodType, number> = {
    joy: 0, love: 0, energy: 0, calm: 0, sadness: 0, anger: 0, mystery: 0, neutral: 0,
  };

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS) as [MoodType, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[mood] += 1;
    }
  }

  let bestMood: MoodType = "neutral";
  let bestScore = 0;
  for (const [mood, score] of Object.entries(scores) as [MoodType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestMood = mood;
    }
  }

  return bestScore > 0 ? bestMood : "neutral";
}

export function useMoodAura(caption: string | null | undefined, savedMood?: string | null): MoodAura {
  return useMemo(() => {
    const mood = (savedMood as MoodType) || detectMood(caption || "");
    return { mood, ...MOOD_MAP[mood] };
  }, [caption, savedMood]);
}

export function getMoodFromText(text: string): MoodType {
  return detectMood(text);
}
