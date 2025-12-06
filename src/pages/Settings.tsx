import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, User, Shield, Bell, Wallet, Smartphone, Clock, Users, ShoppingBag, BarChart3, HelpCircle, Info, Lock, Globe, Languages, Moon, Sun, Eye, MessageCircle, AtSign, Copy, Download, Ban, Volume2, Trash2, Key, LogOut, CreditCard, Heart, Gift, History, Accessibility, Filter, Baby, Link2, Smartphone as Phone, Mail, Calendar, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import cedliteLogo from "@/assets/cedlite-logo.png";

interface Profile {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  display_name: string | null;
  birthdate: string | null;
  profession: string | null;
  location: string | null;
  external_link: string | null;
  is_private: boolean;
  language: string | null;
}

type SettingsSection = 
  | "main" 
  | "account" 
  | "security" 
  | "privacy" 
  | "interactions" 
  | "notifications" 
  | "monetization" 
  | "content" 
  | "screentime" 
  | "parental" 
  | "shop" 
  | "creator" 
  | "help" 
  | "about"
  | "blocked";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState<SettingsSection>("main");

  // Settings states
  const [isPrivate, setIsPrivate] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    likes: true,
    comments: true,
    followers: true,
    messages: true,
    lives: true,
    recommendations: false,
    promotions: false,
  });
  const [privacy, setPrivacy] = useState({
    allowSuggestions: true,
    syncContacts: false,
    allowComments: "everyone",
    allowMessages: "followers",
    allowMentions: "everyone",
    allowDuets: "followers",
    showFollowing: true,
    allowDownloads: true,
    autoShare: false,
  });
  const [content, setContent] = useState({
    autoSubtitles: true,
    autoTranslate: false,
    sensitiveFilter: true,
    restrictedMode: false,
    textSize: "medium",
    highContrast: false,
    autoPlay: true,
  });
  const [screenTime, setScreenTime] = useState({
    dailyLimit: 0,
    breakReminders: false,
    sleepMode: false,
    sleepStart: "22:00",
    sleepEnd: "07:00",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setIsPrivate(data.is_private);
      setLanguage(data.language || "fr");
    }
    setLoadingProfile(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Mise à jour effectuée");
      fetchProfile();
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnecté avec succès");
      navigate("/auth");
    }
  };

  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
  ];

  const MenuItem = ({ icon: Icon, title, subtitle, onClick, rightElement, danger }: {
    icon: any;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${danger ? "text-destructive" : ""}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? "bg-destructive/10" : "bg-primary/10"}`}>
        <Icon className={`w-5 h-5 ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {rightElement || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  );

  const SettingToggle = ({ icon: Icon, title, subtitle, checked, onCheckedChange, disabled }: {
    icon: any;
    title: string;
    subtitle?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center gap-4 p-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src={cedliteLogo} alt="CedLite" className="w-16 h-16" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const renderMainMenu = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        {/* Profile Preview */}
        <div className="p-4 flex items-center gap-4 bg-card mx-4 mt-4 rounded-xl">
          <Avatar className="w-14 h-14">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {profile?.display_name?.[0] || profile?.username?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-bold text-lg">{profile?.display_name || profile?.username || "Utilisateur"}</p>
            <p className="text-sm text-muted-foreground">@{profile?.username || "user"}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Section: Compte */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Compte</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={User} title="Gérer le compte" subtitle="Informations, mot de passe, supprimer" onClick={() => setCurrentSection("account")} />
            <Separator />
            <MenuItem icon={Shield} title="Sécurité" subtitle="2FA, appareils, sessions" onClick={() => setCurrentSection("security")} />
          </div>
        </div>

        {/* Section: Confidentialité */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Confidentialité</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Lock} title="Visibilité du compte" subtitle={isPrivate ? "Privé" : "Public"} onClick={() => setCurrentSection("privacy")} />
            <Separator />
            <MenuItem icon={MessageCircle} title="Interactions" subtitle="Commentaires, messages, mentions" onClick={() => setCurrentSection("interactions")} />
            <Separator />
            <MenuItem icon={Ban} title="Comptes bloqués" subtitle="Gérer les restrictions" onClick={() => setCurrentSection("blocked")} />
          </div>
        </div>

        {/* Section: Notifications */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Notifications</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Bell} title="Notifications" subtitle={notifications.push ? "Activées" : "Désactivées"} onClick={() => setCurrentSection("notifications")} />
          </div>
        </div>

        {/* Section: Monétisation */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Monétisation</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Wallet} title="Portefeuille" subtitle="Coins, cadeaux, revenus" onClick={() => setCurrentSection("monetization")} />
          </div>
        </div>

        {/* Section: Contenu */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Contenu et affichage</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Smartphone} title="Préférences" subtitle="Langue, sous-titres, accessibilité" onClick={() => setCurrentSection("content")} />
          </div>
        </div>

        {/* Section: Bien-être */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Bien-être numérique</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Clock} title="Temps d'écran" subtitle="Limites, pauses, sommeil" onClick={() => setCurrentSection("screentime")} />
            <Separator />
            <MenuItem icon={Users} title="Contrôle parental" subtitle="Family Pairing" onClick={() => setCurrentSection("parental")} />
          </div>
        </div>

        {/* Section: Shopping */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">CedLite Shop</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={ShoppingBag} title="Mes commandes" subtitle="Historique, livraison" onClick={() => setCurrentSection("shop")} />
          </div>
        </div>

        {/* Section: Créateur */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Créateur</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={BarChart3} title="Centre du créateur" subtitle="Statistiques, performances" onClick={() => setCurrentSection("creator")} />
          </div>
        </div>

        {/* Section: Aide */}
        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Support</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={HelpCircle} title="Aide et assistance" subtitle="FAQ, signalements" onClick={() => setCurrentSection("help")} />
            <Separator />
            <MenuItem icon={Info} title="À propos" subtitle="Version, mentions légales" onClick={() => setCurrentSection("about")} />
          </div>
        </div>

        {/* Déconnexion */}
        <div className="mt-6 mx-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={LogOut} title="Se déconnecter" onClick={handleLogout} danger />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">CedLite v1.0.0</p>
      </div>
    </ScrollArea>
  );

  const renderAccountSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{profile?.display_name || "Non défini"}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date de naissance</p>
                  <p className="font-medium">{profile?.birthdate || "Non défini"}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">Non défini</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Sécurité du compte</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Key} title="Changer le mot de passe" subtitle="Modifier votre mot de passe actuel" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Type de compte</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={User} title="Passer en compte créateur" subtitle="Accéder aux outils créateurs" />
            <Separator />
            <MenuItem icon={ShoppingBag} title="Passer en compte professionnel" subtitle="Outils pour les entreprises" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-destructive">Zone de danger</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Trash2} title="Désactiver le compte" subtitle="Masquer temporairement votre profil" danger />
            <Separator />
            <MenuItem icon={Trash2} title="Supprimer le compte" subtitle="Supprimer définitivement toutes vos données" danger />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderSecuritySection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Authentification</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Shield}
              title="Authentification à deux facteurs"
              subtitle="Sécurisez votre compte avec un code"
              checked={false}
              onCheckedChange={() => toast.info("Fonctionnalité à venir")}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Appareils et sessions</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Phone} title="Appareils connectés" subtitle="Gérer vos appareils actifs" />
            <Separator />
            <MenuItem icon={History} title="Historique des connexions" subtitle="Voir les connexions récentes" />
            <Separator />
            <MenuItem icon={LogOut} title="Déconnecter tous les appareils" subtitle="Terminer toutes les sessions actives" danger />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Alertes</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Bell}
              title="Alertes de sécurité"
              subtitle="Être notifié des activités suspectes"
              checked={true}
              onCheckedChange={() => {}}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Comptes liés</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Link2} title="Centre de compte CedLite" subtitle="Gérer les apps connectées" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderPrivacySection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Visibilité</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Lock}
              title="Compte privé"
              subtitle="Seuls vos abonnés verront vos contenus"
              checked={isPrivate}
              onCheckedChange={(checked) => {
                setIsPrivate(checked);
                updateProfile({ is_private: checked });
              }}
              disabled={saving}
            />
            <Separator />
            <SettingToggle
              icon={Eye}
              title="Autoriser les suggestions"
              subtitle="Apparaître dans les suggestions de comptes"
              checked={privacy.allowSuggestions}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, allowSuggestions: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Users}
              title="Synchroniser les contacts"
              subtitle="Retrouver vos amis sur CedLite"
              checked={privacy.syncContacts}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, syncContacts: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Téléchargement et partage</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Download}
              title="Autoriser le téléchargement"
              subtitle="Les autres peuvent télécharger vos vidéos"
              checked={privacy.allowDownloads}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, allowDownloads: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Globe}
              title="Partage automatique"
              subtitle="Partager sur d'autres réseaux"
              checked={privacy.autoShare}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, autoShare: checked })}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderInteractionsSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Commentaires</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Qui peut commenter vos vidéos</Label>
            <Select value={privacy.allowComments} onValueChange={(value) => setPrivacy({ ...privacy, allowComments: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Tout le monde</SelectItem>
                <SelectItem value="followers">Abonnés uniquement</SelectItem>
                <SelectItem value="nobody">Personne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Messages</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Qui peut vous envoyer des messages</Label>
            <Select value={privacy.allowMessages} onValueChange={(value) => setPrivacy({ ...privacy, allowMessages: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Tout le monde</SelectItem>
                <SelectItem value="followers">Abonnés uniquement</SelectItem>
                <SelectItem value="nobody">Personne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Mentions</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Qui peut vous mentionner</Label>
            <Select value={privacy.allowMentions} onValueChange={(value) => setPrivacy({ ...privacy, allowMentions: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Tout le monde</SelectItem>
                <SelectItem value="followers">Abonnés uniquement</SelectItem>
                <SelectItem value="nobody">Personne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Duo / Collage</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Qui peut faire un duo avec vos vidéos</Label>
            <Select value={privacy.allowDuets} onValueChange={(value) => setPrivacy({ ...privacy, allowDuets: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Tout le monde</SelectItem>
                <SelectItem value="followers">Abonnés uniquement</SelectItem>
                <SelectItem value="nobody">Personne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Eye}
              title="Afficher ma liste d'abonnements"
              subtitle="Les autres peuvent voir qui vous suivez"
              checked={privacy.showFollowing}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, showFollowing: checked })}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderNotificationsSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Bell}
              title="Notifications push"
              subtitle="Activer toutes les notifications"
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Activité</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Heart}
              title="Likes"
              subtitle="Quand quelqu'un aime votre contenu"
              checked={notifications.likes}
              onCheckedChange={(checked) => setNotifications({ ...notifications, likes: checked })}
            />
            <Separator />
            <SettingToggle
              icon={MessageCircle}
              title="Commentaires"
              subtitle="Nouveaux commentaires sur vos posts"
              checked={notifications.comments}
              onCheckedChange={(checked) => setNotifications({ ...notifications, comments: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Users}
              title="Nouveaux abonnés"
              subtitle="Quand quelqu'un vous suit"
              checked={notifications.followers}
              onCheckedChange={(checked) => setNotifications({ ...notifications, followers: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Mail}
              title="Messages directs"
              subtitle="Nouveaux messages privés"
              checked={notifications.messages}
              onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Lives et événements</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Smartphone}
              title="Lives"
              subtitle="Quand quelqu'un que vous suivez est en live"
              checked={notifications.lives}
              onCheckedChange={(checked) => setNotifications({ ...notifications, lives: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Contenu suggéré</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={BarChart3}
              title="Recommandations"
              subtitle="Vidéos recommandées pour vous"
              checked={notifications.recommendations}
              onCheckedChange={(checked) => setNotifications({ ...notifications, recommendations: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Gift}
              title="Promotions"
              subtitle="Offres et publicités"
              checked={notifications.promotions}
              onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderMonetizationSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Monnaie CedLite</h3>
          <div className="bg-card rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-muted-foreground">CedCoins</p>
            <Button className="mt-4 w-full">Recharger</Button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Programmes</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={BarChart3} title="CedLite Creator Fund" subtitle="Gagnez de l'argent avec vos vidéos" />
            <Separator />
            <MenuItem icon={Gift} title="Cadeaux LIVE" subtitle="Revenus des lives" />
            <Separator />
            <MenuItem icon={ShoppingBag} title="CedLite Shop Seller" subtitle="Devenir vendeur" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Historique</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={History} title="Transactions" subtitle="Historique des paiements" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderContentSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Langue</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Langue de l'application</Label>
            <Select 
              value={language} 
              onValueChange={(value) => {
                setLanguage(value);
                updateProfile({ language: value });
              }}
            >
              <SelectTrigger>
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

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Sous-titres</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Languages}
              title="Sous-titres automatiques"
              subtitle="Afficher les sous-titres générés"
              checked={content.autoSubtitles}
              onCheckedChange={(checked) => setContent({ ...content, autoSubtitles: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Globe}
              title="Traduction automatique"
              subtitle="Traduire le contenu étranger"
              checked={content.autoTranslate}
              onCheckedChange={(checked) => setContent({ ...content, autoTranslate: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Filtrage</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Filter}
              title="Filtrage de contenu sensible"
              subtitle="Masquer le contenu potentiellement sensible"
              checked={content.sensitiveFilter}
              onCheckedChange={(checked) => setContent({ ...content, sensitiveFilter: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Shield}
              title="Mode restreint"
              subtitle="Limiter le contenu pour adultes"
              checked={content.restrictedMode}
              onCheckedChange={(checked) => setContent({ ...content, restrictedMode: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Apparence</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={darkMode ? Moon : Sun}
              title="Mode sombre"
              subtitle="Interface sombre"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Accessibilité</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Accessibility}
              title="Contraste élevé"
              subtitle="Améliorer la lisibilité"
              checked={content.highContrast}
              onCheckedChange={(checked) => setContent({ ...content, highContrast: checked })}
            />
            <Separator />
            <SettingToggle
              icon={Smartphone}
              title="Lecture automatique"
              subtitle="Lire les vidéos automatiquement"
              checked={content.autoPlay}
              onCheckedChange={(checked) => setContent({ ...content, autoPlay: checked })}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderScreenTimeSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Temps passé aujourd'hui</h3>
          <div className="bg-card rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <p className="text-3xl font-bold">0h 0m</p>
            <p className="text-muted-foreground">Sur CedLite aujourd'hui</p>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Limites</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Limite quotidienne</Label>
            <Select 
              value={screenTime.dailyLimit.toString()} 
              onValueChange={(value) => setScreenTime({ ...screenTime, dailyLimit: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucune limite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Aucune limite</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="90">1h 30</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
                <SelectItem value="180">3 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Rappels</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Bell}
              title="Rappels de pause"
              subtitle="Prendre des pauses régulières"
              checked={screenTime.breakReminders}
              onCheckedChange={(checked) => setScreenTime({ ...screenTime, breakReminders: checked })}
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Mode sommeil</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle
              icon={Moon}
              title="Mode sommeil"
              subtitle="Limiter l'utilisation la nuit"
              checked={screenTime.sleepMode}
              onCheckedChange={(checked) => setScreenTime({ ...screenTime, sleepMode: checked })}
            />
          </div>
          {screenTime.sleepMode && (
            <div className="mt-4 bg-card rounded-xl p-4 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Début</Label>
                <Input 
                  type="time" 
                  value={screenTime.sleepStart}
                  onChange={(e) => setScreenTime({ ...screenTime, sleepStart: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Fin</Label>
                <Input 
                  type="time" 
                  value={screenTime.sleepEnd}
                  onChange={(e) => setScreenTime({ ...screenTime, sleepEnd: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  const renderParentalSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <div className="bg-card rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Family Pairing</h3>
            <p className="text-muted-foreground mb-4">
              Associez le compte de votre enfant au vôtre pour gérer son utilisation de CedLite
            </p>
            <Button className="w-full">Associer un compte</Button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Contrôles disponibles</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Clock} title="Limite de temps d'écran" subtitle="Définir une durée maximale quotidienne" />
            <Separator />
            <MenuItem icon={Filter} title="Filtrage de contenu" subtitle="Bloquer le contenu inapproprié" />
            <Separator />
            <MenuItem icon={MessageCircle} title="Messages privés" subtitle="Gérer qui peut contacter votre enfant" />
            <Separator />
            <MenuItem icon={Shield} title="Mode restreint" subtitle="Activer les restrictions de contenu" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderShopSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Mes commandes</h3>
          <div className="bg-card rounded-xl p-8 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune commande</p>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Paramètres</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={CreditCard} title="Moyens de paiement" subtitle="Gérer vos cartes" />
            <Separator />
            <MenuItem icon={Globe} title="Adresses de livraison" subtitle="Gérer vos adresses" />
            <Separator />
            <MenuItem icon={Gift} title="Coupons" subtitle="Mes bons de réduction" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderCreatorSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Performances</h3>
          <div className="bg-card rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Vues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Commentaires</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Partages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Ressources</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={BarChart3} title="Tableau de bord" subtitle="Statistiques détaillées" />
            <Separator />
            <MenuItem icon={HelpCircle} title="Centre d'aide créateur" subtitle="Guides et conseils" />
            <Separator />
            <MenuItem icon={Volume2} title="Bibliothèque musicale" subtitle="Sons et tendances" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderHelpSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Aide</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={HelpCircle} title="FAQ" subtitle="Questions fréquentes" />
            <Separator />
            <MenuItem icon={MessageCircle} title="Contacter le support" subtitle="Obtenir de l'aide" />
            <Separator />
            <MenuItem icon={Shield} title="Signaler un problème" subtitle="Reporter un bug" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Historique</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={History} title="Mes signalements" subtitle="Historique des signalements" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Documents</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Info} title="Conditions d'utilisation" subtitle="Nos règles" />
            <Separator />
            <MenuItem icon={Shield} title="Politique de confidentialité" subtitle="Vos données" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderAboutSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <div className="bg-card rounded-xl p-8 text-center">
            <img src={cedliteLogo} alt="CedLite" className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">CedLite</h2>
            <p className="text-muted-foreground">Version 1.0.0</p>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Informations</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <p className="text-muted-foreground">Région</p>
              <p className="font-medium">France 🇫🇷</p>
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <p className="text-muted-foreground">Langue</p>
              <p className="font-medium">Français</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Légal</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Info} title="Mentions légales" />
            <Separator />
            <MenuItem icon={Shield} title="Politique de données" />
            <Separator />
            <MenuItem icon={Info} title="Licences open source" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          © 2024 CedLite. Tous droits réservés.
        </p>
      </div>
    </ScrollArea>
  );

  const renderBlockedSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Comptes bloqués</h3>
          <div className="bg-card rounded-xl p-8 text-center">
            <Ban className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun compte bloqué</p>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Comptes restreints</h3>
          <div className="bg-card rounded-xl p-8 text-center">
            <Volume2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun compte restreint</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const getSectionTitle = () => {
    const titles: Record<SettingsSection, string> = {
      main: "Paramètres",
      account: "Gérer le compte",
      security: "Sécurité",
      privacy: "Confidentialité",
      interactions: "Interactions",
      notifications: "Notifications",
      monetization: "Monétisation",
      content: "Contenu et affichage",
      screentime: "Temps d'écran",
      parental: "Contrôle parental",
      shop: "CedLite Shop",
      creator: "Centre du créateur",
      help: "Aide et assistance",
      about: "À propos",
      blocked: "Comptes bloqués",
    };
    return titles[currentSection];
  };

  const renderSection = () => {
    switch (currentSection) {
      case "main": return renderMainMenu();
      case "account": return renderAccountSection();
      case "security": return renderSecuritySection();
      case "privacy": return renderPrivacySection();
      case "interactions": return renderInteractionsSection();
      case "notifications": return renderNotificationsSection();
      case "monetization": return renderMonetizationSection();
      case "content": return renderContentSection();
      case "screentime": return renderScreenTimeSection();
      case "parental": return renderParentalSection();
      case "shop": return renderShopSection();
      case "creator": return renderCreatorSection();
      case "help": return renderHelpSection();
      case "about": return renderAboutSection();
      case "blocked": return renderBlockedSection();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-4 sticky top-0 z-50">
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => {
            if (currentSection === "main") {
              navigate(-1);
            } else {
              setCurrentSection("main");
            }
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">{getSectionTitle()}</h1>
      </header>

      {renderSection()}
    </div>
  );
};

export default Settings;
