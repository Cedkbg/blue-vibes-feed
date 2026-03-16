import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    if (ios) {
      // Show iOS guide after 3 seconds
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-fade-in sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Installer CedLite</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Appuyez sur le bouton Partager puis « Sur l'écran d'accueil »"
                : "Ajoutez l'application à votre écran d'accueil pour un accès rapide"}
            </p>

            {isIOS ? (
              <button
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="text-xs text-primary font-medium mt-2 hover:underline"
              >
                {showIOSGuide ? "Masquer les étapes" : "Voir les étapes"}
              </button>
            ) : (
              <Button size="sm" className="mt-2 rounded-full gap-1.5 text-xs h-8" onClick={handleInstall}>
                <Download className="w-3.5 h-3.5" />
                Installer
              </Button>
            )}

            {showIOSGuide && (
              <ol className="mt-2 space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                <li>Appuyez sur <span className="inline-block">⬆️</span> (Partager) en bas du navigateur</li>
                <li>Faites défiler et appuyez sur <strong className="text-foreground">« Sur l'écran d'accueil »</strong></li>
                <li>Appuyez sur <strong className="text-foreground">« Ajouter »</strong></li>
              </ol>
            )}
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
