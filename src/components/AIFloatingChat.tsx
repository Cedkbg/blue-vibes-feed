import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export const AIFloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "chat",
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erreur IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${e.message || "Erreur"}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-24 left-4 z-[60]"
          >
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-[60] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              <Bot className="w-6 h-6" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">CedIA</h3>
                <p className="text-xs opacity-80">Assistant intelligent CedLite</p>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-violet-400" />
                  <p className="font-medium">Salut ! Je suis CedIA 🤖</p>
                  <p className="text-xs mt-1">Demande-moi de t'aider à créer du contenu viral, traduire, ou tout autre chose !</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-3 py-2 rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Demande à CedIA..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
              />
              <Button
                size="icon"
                className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white h-9 w-9"
                onClick={send}
                disabled={isLoading || !input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
