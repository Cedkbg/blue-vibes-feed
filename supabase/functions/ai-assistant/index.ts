import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, language, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userContent = text || "";

    switch (action) {
      case "generate_caption":
        systemPrompt = `Tu es un assistant créatif pour le réseau social CedLite. Génère une caption engageante et virale pour un post sur les réseaux sociaux. 
Règles:
- Maximum 280 caractères
- Inclus 2-3 hashtags pertinents
- Utilise des emojis
- Sois créatif et accrocheur
- Réponds UNIQUEMENT avec la caption, rien d'autre`;
        userContent = text ? `Génère une caption basée sur ce thème: "${text}"` : "Génère une caption créative et engageante pour un post sur les réseaux sociaux";
        break;

      case "translate":
        systemPrompt = `Tu es un traducteur professionnel. Traduis le texte suivant en ${language || "français"}. 
Règles:
- Traduis UNIQUEMENT le texte, ne rajoute rien
- Garde les emojis et hashtags tels quels
- Sois naturel dans la traduction`;
        userContent = `Traduis ce texte: "${text}"`;
        break;

      case "improve_text":
        systemPrompt = `Tu es un rédacteur expert pour les réseaux sociaux. Améliore le texte suivant pour le rendre plus engageant et viral.
Règles:
- Garde le même sens
- Ajoute des emojis pertinents
- Maximum 280 caractères
- Réponds UNIQUEMENT avec le texte amélioré`;
        userContent = `Améliore ce texte: "${text}"`;
        break;

      case "chat":
        systemPrompt = `Tu es CedIA, l'assistant intelligent de CedLite, le réseau social nouvelle génération. Tu es amical, créatif et utile.
Tu peux:
- Aider à créer du contenu viral
- Donner des conseils sur les réseaux sociaux
- Traduire du contenu
- Suggérer des idées de posts
- Répondre aux questions des utilisateurs
Sois concis et utilise des emojis. Réponds en français par défaut sauf si l'utilisateur parle une autre langue.`;
        break;

      default:
        throw new Error("Action non reconnue");
    }

    const apiMessages = action === "chat" && messages
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: apiMessages,
        stream: action === "chat",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erreur du service IA");
    }

    if (action === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
