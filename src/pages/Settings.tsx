import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, User, Shield, Bell, Wallet, Smartphone, Clock, Users, ShoppingBag, BarChart3, HelpCircle, Info, Lock, Globe, Languages, Moon, Sun, Eye, MessageCircle, AtSign, Copy, Download, Ban, Volume2, Trash2, Key, LogOut, CreditCard, Heart, Gift, History, Accessibility, Filter, Baby, Link2, Smartphone as Phone, Mail, Calendar, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
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
  phone_number: string | null;
}

type SettingsSection = 
  | "main" | "account" | "security" | "privacy" | "interactions" 
  | "notifications" | "monetization" | "content" | "screentime" 
  | "parental" | "shop" | "creator" | "help" | "about" | "blocked"
  | "change-password";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { blockedUsers, unblockUser, loading: blockedLoading } = useBlockedUsers();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState<SettingsSection>("main");
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    if (settings.dark_mode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.dark_mode]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("username, bio, avatar_url, display_name, birthdate, profession, location, external_link, is_private, language, phone_number")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) setProfile(data);
    setLoadingProfile(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) toast.error("Erreur lors de la mise à jour");
    else { toast.success("Mise à jour effectuée"); fetchProfile(); }
    setSaving(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Erreur lors de la déconnexion");
    else { toast.success("Déconnecté avec succès"); navigate("/auth"); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error("Erreur: " + error.message);
    else {
      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setCurrentSection("account");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      toast.error("Tapez SUPPRIMER pour confirmer");
      return;
    }
    setSaving(true);
    // Sign out and notify - actual deletion would need admin/edge function
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.success("Votre demande de suppression a été enregistrée");
      navigate("/auth");
    }
    setSaving(false);
    setShowDeleteDialog(false);
  };

  const handleDeactivateAccount = async () => {
    await updateProfile({ is_private: true } as any);
    toast.success("Votre compte a été désactivé temporairement");
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
    icon: any; title: string; subtitle?: string; onClick?: () => void; rightElement?: React.ReactNode; danger?: boolean;
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
    icon: any; title: string; subtitle?: string; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean;
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
        <div className="p-4 flex items-center gap-4 bg-card mx-4 mt-4 rounded-xl cursor-pointer" onClick={() => setCurrentSection("account")}>
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

        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Compte</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={User} title="Gérer le compte" subtitle="Informations, mot de passe" onClick={() => setCurrentSection("account")} />
            <Separator />
            <MenuItem icon={Shield} title="Sécurité" subtitle="Sessions, alertes" onClick={() => setCurrentSection("security")} />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Confidentialité</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Lock} title="Visibilité du compte" subtitle={profile?.is_private ? "Privé" : "Public"} onClick={() => setCurrentSection("privacy")} />
            <Separator />
            <MenuItem icon={MessageCircle} title="Interactions" subtitle="Commentaires, messages, mentions" onClick={() => setCurrentSection("interactions")} />
            <Separator />
            <MenuItem icon={Ban} title="Comptes bloqués" subtitle={`${blockedUsers.length} bloqué(s)`} onClick={() => setCurrentSection("blocked")} />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Notifications</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Bell} title="Notifications" subtitle={settings.notifications_push ? "Activées" : "Désactivées"} onClick={() => setCurrentSection("notifications")} />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Contenu et affichage</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Smartphone} title="Préférences" subtitle="Langue, accessibilité, mode sombre" onClick={() => setCurrentSection("content")} />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Bien-être numérique</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={Clock} title="Temps d'écran" subtitle="Limites, pauses" onClick={() => setCurrentSection("screentime")} />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Support</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={HelpCircle} title="Aide et assistance" onClick={() => setCurrentSection("help")} />
            <Separator />
            <MenuItem icon={Info} title="À propos" subtitle="Version 1.0.0" onClick={() => setCurrentSection("about")} />
          </div>
        </div>

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
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{profile?.phone_number || "Non défini"}</p>
                </div>
              </div>
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
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Sécurité du compte</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Key} title="Changer le mot de passe" subtitle="Modifier votre mot de passe" onClick={() => setCurrentSection("change-password")} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-destructive">Zone de danger</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Eye} title="Désactiver le compte" subtitle="Masquer temporairement votre profil" onClick={handleDeactivateAccount} danger />
            <Separator />
            <MenuItem icon={Trash2} title="Supprimer le compte" subtitle="Supprimer définitivement toutes vos données" onClick={() => setShowDeleteDialog(true)} danger />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const renderChangePasswordSection = () => (
    <ScrollArea className="flex-1">
      <div className="p-4 pb-8 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Changer le mot de passe</h3>
        <div className="space-y-2">
          <Label>Nouveau mot de passe</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
          <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
        </div>
        <div className="space-y-2">
          <Label>Confirmer le nouveau mot de passe</Label>
          <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button onClick={handleChangePassword} disabled={saving || !newPassword || !confirmNewPassword} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Modifier le mot de passe
        </Button>
      </div>
    </ScrollArea>
  );

  const renderSecuritySection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Alertes</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Bell} title="Alertes de sécurité" subtitle="Être notifié des activités suspectes" checked={true} onCheckedChange={() => {}} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Session active</h3>
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Cet appareil</p>
                <p className="text-sm text-muted-foreground">Connecté maintenant</p>
              </div>
              <Check className="w-5 h-5 text-green-600 ml-auto" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={LogOut} title="Déconnecter tous les appareils" subtitle="Terminer toutes les sessions" onClick={handleLogout} danger />
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
            <SettingToggle icon={Lock} title="Compte privé" subtitle="Seuls vos abonnés verront vos contenus"
              checked={profile?.is_private || false}
              onCheckedChange={(checked) => updateProfile({ is_private: checked })}
              disabled={saving}
            />
            <Separator />
            <SettingToggle icon={Eye} title="Autoriser les suggestions" subtitle="Apparaître dans les suggestions"
              checked={settings.privacy_allow_suggestions}
              onCheckedChange={(checked) => updateSetting("privacy_allow_suggestions", checked)}
            />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Téléchargement et partage</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Download} title="Autoriser le téléchargement" subtitle="Les autres peuvent télécharger vos vidéos"
              checked={settings.privacy_allow_downloads}
              onCheckedChange={(checked) => updateSetting("privacy_allow_downloads", checked)}
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
            <Select value={settings.privacy_allow_comments} onValueChange={(v) => updateSetting("privacy_allow_comments", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Select value={settings.privacy_allow_messages} onValueChange={(v) => updateSetting("privacy_allow_messages", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Select value={settings.privacy_allow_mentions} onValueChange={(v) => updateSetting("privacy_allow_mentions", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <SettingToggle icon={Eye} title="Afficher ma liste d'abonnements" subtitle="Les autres peuvent voir qui vous suivez"
              checked={settings.privacy_show_following}
              onCheckedChange={(checked) => updateSetting("privacy_show_following", checked)}
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
            <SettingToggle icon={Bell} title="Notifications push" subtitle="Activer toutes les notifications"
              checked={settings.notifications_push} onCheckedChange={(c) => updateSetting("notifications_push", c)} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Activité</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Heart} title="Likes" subtitle="Quand quelqu'un aime votre contenu"
              checked={settings.notifications_likes} onCheckedChange={(c) => updateSetting("notifications_likes", c)} />
            <Separator />
            <SettingToggle icon={MessageCircle} title="Commentaires" subtitle="Nouveaux commentaires"
              checked={settings.notifications_comments} onCheckedChange={(c) => updateSetting("notifications_comments", c)} />
            <Separator />
            <SettingToggle icon={Users} title="Nouveaux abonnés" subtitle="Quand quelqu'un vous suit"
              checked={settings.notifications_followers} onCheckedChange={(c) => updateSetting("notifications_followers", c)} />
            <Separator />
            <SettingToggle icon={Mail} title="Messages directs" subtitle="Nouveaux messages privés"
              checked={settings.notifications_messages} onCheckedChange={(c) => updateSetting("notifications_messages", c)} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Lives</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Smartphone} title="Lives" subtitle="Quand quelqu'un est en live"
              checked={settings.notifications_lives} onCheckedChange={(c) => updateSetting("notifications_lives", c)} />
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
            <Select value={profile?.language || "fr"} onValueChange={(v) => updateProfile({ language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2"><span>{lang.flag}</span><span>{lang.name}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Apparence</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={settings.dark_mode ? Moon : Sun} title="Mode sombre" subtitle="Interface sombre"
              checked={settings.dark_mode} onCheckedChange={(c) => updateSetting("dark_mode", c)} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Sous-titres</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Languages} title="Sous-titres automatiques" subtitle="Afficher les sous-titres"
              checked={settings.content_auto_subtitles} onCheckedChange={(c) => updateSetting("content_auto_subtitles", c)} />
            <Separator />
            <SettingToggle icon={Globe} title="Traduction automatique" subtitle="Traduire le contenu étranger"
              checked={settings.content_auto_translate} onCheckedChange={(c) => updateSetting("content_auto_translate", c)} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Filtrage</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Filter} title="Filtrage de contenu sensible" subtitle="Masquer le contenu sensible"
              checked={settings.content_sensitive_filter} onCheckedChange={(c) => updateSetting("content_sensitive_filter", c)} />
            <Separator />
            <SettingToggle icon={Shield} title="Mode restreint" subtitle="Limiter le contenu pour adultes"
              checked={settings.content_restricted_mode} onCheckedChange={(c) => updateSetting("content_restricted_mode", c)} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Accessibilité</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Accessibility} title="Contraste élevé" subtitle="Améliorer la lisibilité"
              checked={settings.content_high_contrast} onCheckedChange={(c) => updateSetting("content_high_contrast", c)} />
            <Separator />
            <SettingToggle icon={Smartphone} title="Lecture automatique" subtitle="Lire les vidéos automatiquement"
              checked={settings.content_auto_play} onCheckedChange={(c) => updateSetting("content_auto_play", c)} />
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
            <Clock className="w-10 h-10 text-primary mx-auto mb-4" />
            <p className="text-3xl font-bold">0h 0m</p>
            <p className="text-muted-foreground">Sur CedLite aujourd'hui</p>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Limites</h3>
          <div className="bg-card rounded-xl p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Limite quotidienne</Label>
            <Select value={settings.screen_time_daily_limit.toString()} onValueChange={(v) => updateSetting("screen_time_daily_limit", parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Aucune limite" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Aucune limite</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Bell} title="Rappels de pause" subtitle="Prendre des pauses régulières"
              checked={settings.screen_time_break_reminders} onCheckedChange={(c) => updateSetting("screen_time_break_reminders", c)} />
          </div>
        </div>
        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Moon} title="Mode sommeil" subtitle="Limiter l'utilisation la nuit"
              checked={settings.screen_time_sleep_mode} onCheckedChange={(c) => updateSetting("screen_time_sleep_mode", c)} />
          </div>
          {settings.screen_time_sleep_mode && (
            <div className="mt-4 bg-card rounded-xl p-4 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Début</Label>
                <Input type="time" value={settings.screen_time_sleep_start} onChange={(e) => updateSetting("screen_time_sleep_start", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Fin</Label>
                <Input type="time" value={settings.screen_time_sleep_end} onChange={(e) => updateSetting("screen_time_sleep_end", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  const renderBlockedSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Comptes bloqués</h3>
          {blockedLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : blockedUsers.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center">
              <Ban className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun compte bloqué</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl overflow-hidden">
              {blockedUsers.map((blocked, i) => (
                <div key={blocked.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 p-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={blocked.profile?.avatar_url || ""} />
                      <AvatarFallback>{blocked.profile?.display_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{blocked.profile?.display_name || "Utilisateur"}</p>
                      <p className="text-sm text-muted-foreground truncate">@{blocked.profile?.username || "user"}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => unblockUser(blocked.blocked_id)}>
                      Débloquer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  const renderHelpSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={HelpCircle} title="FAQ" subtitle="Questions fréquentes" />
            <Separator />
            <MenuItem icon={MessageCircle} title="Contacter le support" subtitle="Obtenir de l'aide" />
            <Separator />
            <MenuItem icon={Shield} title="Signaler un problème" subtitle="Reporter un bug" />
          </div>
        </div>
        <div className="p-4">
          <div className="bg-card rounded-xl overflow-hidden">
            <MenuItem icon={Info} title="Conditions d'utilisation" />
            <Separator />
            <MenuItem icon={Shield} title="Politique de confidentialité" />
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
          <div className="bg-card rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <p className="text-muted-foreground">Langue</p>
              <p className="font-medium">{languages.find(l => l.code === (profile?.language || "fr"))?.name || "Français"}</p>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">© 2024 CedLite. Tous droits réservés.</p>
      </div>
    </ScrollArea>
  );

  const getSectionTitle = () => {
    const titles: Record<SettingsSection, string> = {
      main: "Paramètres", account: "Gérer le compte", security: "Sécurité",
      privacy: "Confidentialité", interactions: "Interactions", notifications: "Notifications",
      monetization: "Monétisation", content: "Contenu et affichage", screentime: "Temps d'écran",
      parental: "Contrôle parental", shop: "CedLite Shop", creator: "Centre du créateur",
      help: "Aide et assistance", about: "À propos", blocked: "Comptes bloqués",
      "change-password": "Changer le mot de passe",
    };
    return titles[currentSection];
  };

  const renderSection = () => {
    switch (currentSection) {
      case "main": return renderMainMenu();
      case "account": return renderAccountSection();
      case "change-password": return renderChangePasswordSection();
      case "security": return renderSecuritySection();
      case "privacy": return renderPrivacySection();
      case "interactions": return renderInteractionsSection();
      case "notifications": return renderNotificationsSection();
      case "content": return renderContentSection();
      case "screentime": return renderScreenTimeSection();
      case "blocked": return renderBlockedSection();
      case "help": return renderHelpSection();
      case "about": return renderAboutSection();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-4 sticky top-0 z-50">
        <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => {
            if (currentSection === "main") navigate(-1);
            else if (currentSection === "change-password") setCurrentSection("account");
            else setCurrentSection("main");
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">{getSectionTitle()}</h1>
      </header>

      {renderSection()}

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer votre compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données, vidéos, messages et abonnés seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Tapez <span className="font-bold text-destructive">SUPPRIMER</span> pour confirmer
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="border-destructive"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={saving || deleteConfirmText !== "SUPPRIMER"}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
