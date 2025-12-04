import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lock, Globe, Bell, Moon, Shield, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  external_link: string | null;
  is_private: boolean;
  language: string | null;
}

interface SettingsSheetProps {
  profile: Profile | null;
  onUpdate: () => void;
  onClose: () => void;
}

export const SettingsSheet = ({ profile, onUpdate, onClose }: SettingsSheetProps) => {
  const [isPrivate, setIsPrivate] = useState(profile?.is_private || false);
  const [language, setLanguage] = useState(profile?.language || "fr");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePrivacyChange = async (checked: boolean) => {
    setIsPrivate(checked);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ is_private: checked })
      .eq("id", (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      console.error("Error updating privacy:", error);
      toast.error("Erreur lors de la mise à jour");
      setIsPrivate(!checked);
    } else {
      toast.success(checked ? "Compte passé en privé" : "Compte passé en public");
      onUpdate();
    }
    setSaving(false);
  };

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ language: value })
      .eq("id", (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      console.error("Error updating language:", error);
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Langue mise à jour");
      onUpdate();
    }
    setSaving(false);
  };

  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
  ];

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-4">
        <SheetTitle className="text-xl font-bold">Paramètres</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Privacy Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Confidentialité</span>
          </div>
          
          <div className="bg-card rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Compte privé</p>
                  <p className="text-sm text-muted-foreground">
                    Seuls vos abonnés verront vos contenus
                  </p>
                </div>
              </div>
              <Switch 
                checked={isPrivate} 
                onCheckedChange={handlePrivacyChange}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Language Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Langue</span>
          </div>
          
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Langue de l'application</p>
                  <p className="text-sm text-muted-foreground">
                    Choisissez votre langue préférée
                  </p>
                </div>
              </div>
              <Select value={language} onValueChange={handleLanguageChange} disabled={saving}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Notifications</span>
          </div>
          
          <div className="bg-card rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Notifications push</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications
                  </p>
                </div>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Appearance Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Moon className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Apparence</span>
          </div>
          
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Mode sombre</p>
                  <p className="text-sm text-muted-foreground">
                    Interface sombre
                  </p>
                </div>
              </div>
              <Switch 
                checked={darkMode} 
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-sm text-muted-foreground">CedLite v1.0.0</p>
        </div>
      </div>
    </div>
  );
};
