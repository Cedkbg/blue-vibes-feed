import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, User, Shield, Bell, Wallet, Smartphone, Clock, Users, ShoppingBag, BarChart3, HelpCircle, Info, Lock, Globe, Languages, Moon, Sun, Eye, MessageCircle, AtSign, Copy, Download, Ban, Volume2, Trash2, Key, LogOut, CreditCard, Heart, Gift, History, Accessibility, Filter, Baby, Link2, Smartphone as Phone, Mail, Calendar, Loader2, Check, BadgeCheck } from "lucide-react";
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
  | "change-password" | "certification";

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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [helpSection, setHelpSection] = useState<"main" | "faq">("main");
  const [isVerified, setIsVerified] = useState(false);
  const [totalVerified, setTotalVerified] = useState(0);
  const [certRequest, setCertRequest] = useState<{ status: string } | null>(null);
  const [certReason, setCertReason] = useState("");
  const [submittingCert, setSubmittingCert] = useState(false);

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
      .select("username, bio, avatar_url, display_name, birthdate, profession, location, external_link, is_private, language, phone_number, is_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      setIsVerified(data.is_verified || false);
    }
    setLoadingProfile(false);
  };

  useEffect(() => {
    const fetchVerifiedCount = async () => {
      const { count } = await supabase.from("profiles_public").select("*", { count: "exact", head: true }).eq("is_verified", true);
      setTotalVerified(count || 0);
    };
    fetchVerifiedCount();
  }, []);

  // Fetch existing certification request
  useEffect(() => {
    if (!user) return;
    const fetchCertRequest = async () => {
      const { data } = await (supabase as any)
        .from("certification_requests")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setCertRequest(data);
    };
    fetchCertRequest();
  }, [user]);

  const handleSubmitCertRequest = async () => {
    if (!user || !certReason.trim()) {
      toast.error("Veuillez expliquer pourquoi vous souhaitez être certifié");
      return;
    }
    setSubmittingCert(true);
    const { error } = await (supabase as any)
      .from("certification_requests")
      .insert({ user_id: user.id, reason: certReason.trim() });
    if (error) {
      if (error.code === "23505") toast.error("Vous avez déjà soumis une demande");
      else toast.error("Erreur lors de l'envoi");
    } else {
      toast.success("Demande envoyée avec succès !");
      setCertRequest({ status: "pending" });
      setCertReason("");
    }
    setSubmittingCert(false);
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
          <p className="px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Certification</p>
          <div className="bg-card mx-4 rounded-xl overflow-hidden">
            <MenuItem icon={BadgeCheck} title="Certification" subtitle="Statut et demande de vérification" onClick={() => setCurrentSection("certification")} />
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




  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const saveField = async (field: string) => {
    if (!editValue.trim()) {
      toast.error("Ce champ ne peut pas être vide");
      return;
    }
    if (field === "username" && editValue.trim().length < 3) {
      toast.error("Le pseudo doit contenir au moins 3 caractères");
      return;
    }
    if (field === "username" && !/^[a-zA-Z0-9_]+$/.test(editValue.trim())) {
      toast.error("Seuls les lettres, chiffres et underscores sont autorisés");
      return;
    }
    await updateProfile({ [field]: editValue.trim() });
    setEditingField(null);
    setEditValue("");
  };

  const renderEditableField = (icon: any, label: string, field: string, value: string | null | undefined, placeholder: string) => {
    const Icon = icon;
    const isEditing = editingField === field;
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") saveField(field); if (e.key === "Escape") setEditingField(null); }}
                />
                <Button size="sm" variant="ghost" className="h-8 px-2 text-green-600" onClick={() => saveField(field)} disabled={saving}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="font-medium">{value || "Non défini"}</p>
            )}
          </div>
          {!isEditing && (
            <Button size="sm" variant="ghost" className="text-primary h-8 px-2" onClick={() => startEditing(field, value || "")}>
              Modifier
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderAccountSection = () => (
    <ScrollArea className="flex-1">
      <div className="pb-8">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            {renderEditableField(User, "Nom d'affichage", "display_name", profile?.display_name, "Votre nom")}
            <Separator />
            {renderEditableField(AtSign, "Pseudo", "username", profile?.username, "votre_pseudo")}
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
            {renderEditableField(Phone, "Téléphone", "phone_number", profile?.phone_number, "+33 6 00 00 00 00")}
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
          <h3 className="text-lg font-semibold mb-4">Sons</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <SettingToggle icon={Volume2} title="Son d'appel entrant" subtitle="Jouer une sonnerie lors d'un appel"
              checked={true} onCheckedChange={() => toast.success("Paramètre mis à jour")} />
            <Separator />
            <SettingToggle icon={Volume2} title="Son de message entrant" subtitle="Son à la réception d'un message"
              checked={true} onCheckedChange={() => toast.success("Paramètre mis à jour")} />
            <Separator />
            <SettingToggle icon={Volume2} title="Son de message sortant" subtitle="Son à l'envoi d'un message"
              checked={false} onCheckedChange={() => toast.success("Paramètre mis à jour")} />
            <Separator />
            <SettingToggle icon={Volume2} title="Son de notification" subtitle="Son pour les autres notifications"
              checked={true} onCheckedChange={() => toast.success("Paramètre mis à jour")} />
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




  const faqItems = [
    { q: "Comment créer un compte CedLite ?", a: "Téléchargez l'application ou rendez-vous sur le site, cliquez sur \"S'inscrire\", entrez votre email et créez un mot de passe. Vérifiez votre email pour activer votre compte." },
    { q: "Comment modifier mon profil ?", a: "Allez sur votre profil, appuyez sur \"Modifier le profil\". Vous pouvez changer votre photo, nom d'affichage, pseudo, bio et lien externe." },
    { q: "Comment rendre mon compte privé ?", a: "Allez dans Paramètres > Confidentialité > Visibilité du compte, puis activez le mode privé. Seuls vos abonnés approuvés verront vos contenus." },
    { q: "Comment bloquer un utilisateur ?", a: "Rendez-vous sur le profil de l'utilisateur, appuyez sur les trois points (⋯) puis sélectionnez \"Bloquer\". L'utilisateur ne pourra plus voir vos contenus ni vous contacter." },
    { q: "Comment signaler un contenu inapproprié ?", a: "Appuyez sur les trois points (⋯) sur le contenu concerné, puis sélectionnez \"Signaler\". Choisissez la raison du signalement. Notre équipe examinera le contenu sous 24h." },
    { q: "Comment supprimer mon compte ?", a: "Allez dans Paramètres > Gérer le compte > Zone de danger > Supprimer le compte. Tapez SUPPRIMER pour confirmer. Cette action est irréversible." },
    { q: "Comment changer mon mot de passe ?", a: "Allez dans Paramètres > Gérer le compte > Sécurité du compte > Changer le mot de passe. Entrez votre nouveau mot de passe (minimum 6 caractères) et confirmez." },
    { q: "Mes données sont-elles sécurisées ?", a: "Oui. CedLite utilise le chiffrement de bout en bout pour les messages privés, et vos données personnelles (téléphone, date de naissance) ne sont jamais visibles publiquement." },
  ];

  const renderHelpSection = () => {
    if (helpSection === "faq") {
      return (
        <ScrollArea className="flex-1">
          <div className="pb-8">
            <div className="p-4">
              <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setHelpSection("main")}>
                <ArrowLeft className="w-4 h-4" /> Retour
              </Button>
              <h3 className="text-lg font-semibold mb-4">Questions fréquentes</h3>
              <div className="space-y-3">
                {faqItems.map((item, i) => (
                  <details key={i} className="bg-card rounded-xl overflow-hidden group">
                    <summary className="p-4 font-medium cursor-pointer flex items-center gap-3 hover:bg-muted/50 transition-colors">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="flex-1">{item.q}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-4 pb-4 pl-11 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      );
    }

    return (
      <ScrollArea className="flex-1">
        <div className="pb-8">
          {/* Centre d'aide */}
          <div className="p-4">
            <div className="bg-primary/5 rounded-xl p-6 text-center mb-4">
              <img src={cedliteLogo} alt="CedLite" className="w-14 h-14 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">Centre d'aide CedLite</h3>
              <p className="text-sm text-muted-foreground">Comment pouvons-nous vous aider ?</p>
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="bg-card rounded-xl overflow-hidden">
              <MenuItem icon={HelpCircle} title="FAQ" subtitle="Réponses aux questions fréquentes" onClick={() => setHelpSection("faq")} />
              <Separator />
              <MenuItem icon={MessageCircle} title="Contacter le support" subtitle="support@cedlite.com" onClick={() => { window.location.href = "mailto:support@cedlite.com?subject=Demande%20d'aide%20-%20CedLite"; }} />
              <Separator />
              <MenuItem icon={Shield} title="Signaler un problème" subtitle="Signaler un bug ou un contenu" onClick={() => { window.location.href = "mailto:report@cedlite.com?subject=Signalement%20-%20CedLite"; }} />
            </div>
          </div>

          <div className="p-4 pt-0">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Règles de la communauté</h3>
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Respect mutuel</p>
                    <p className="text-xs text-muted-foreground">Le harcèlement, les discours haineux et l'intimidation sont strictement interdits.</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Sécurité des mineurs</p>
                    <p className="text-xs text-muted-foreground">CedLite est réservé aux utilisateurs de 13 ans et plus. La protection des mineurs est notre priorité.</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Contenu interdit</p>
                    <p className="text-xs text-muted-foreground">Pas de contenu violent, sexuellement explicite, frauduleux ou portant atteinte aux droits d'autrui.</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Vie privée</p>
                    <p className="text-xs text-muted-foreground">Ne partagez jamais les informations personnelles d'autres utilisateurs sans leur consentement.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 pt-0">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Informations légales</h3>
            <div className="bg-card rounded-xl overflow-hidden">
              <MenuItem icon={Info} title="Conditions d'utilisation" subtitle="Dernière mise à jour : Février 2026" onClick={() => toast.info("Les conditions d'utilisation seront disponibles prochainement sur cedlite.com")} />
              <Separator />
              <MenuItem icon={Shield} title="Politique de confidentialité" subtitle="Protection de vos données" onClick={() => toast.info("La politique de confidentialité sera disponible prochainement sur cedlite.com")} />
              <Separator />
              <MenuItem icon={Info} title="Licences open source" subtitle="Bibliothèques utilisées" onClick={() => toast.info("CedLite utilise React, Supabase et d'autres technologies open source.")} />
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="bg-card rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">CedLite v1.0.0</p>
              <p className="text-xs text-muted-foreground mt-1">© 2026 CedLite. Tous droits réservés.</p>
              <p className="text-xs text-muted-foreground mt-1">Fait par Ced KABONGO pour la communauté</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

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

  const renderCertificationSection = () => (
    <ScrollArea className="flex-1">
      <div className="p-4 pb-8 space-y-6">
        {/* Statut actuel */}
        <div className="bg-card rounded-xl p-6 text-center space-y-3">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVerified ? "bg-primary/10" : "bg-muted"}`}>
            <BadgeCheck className={`w-8 h-8 ${isVerified ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <h3 className="text-lg font-bold">{isVerified ? "Compte certifié ✓" : "Compte non certifié"}</h3>
          <p className="text-sm text-muted-foreground">
            {isVerified 
              ? "Votre compte est vérifié. Vous bénéficiez du badge de certification sur votre profil."
              : "Votre compte n'est pas encore certifié. La certification est automatique pour les 1000 premiers inscrits."
            }
          </p>
        </div>

        {/* Promotion info */}
        <div className="bg-card rounded-xl p-4 space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Promotion 1000 premiers comptes
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Comptes certifiés</span>
            <span className="font-bold text-primary">{totalVerified} / 1 000</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min((totalVerified / 1000) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {totalVerified >= 1000 
              ? "La promotion est terminée. Les 1000 places ont été attribuées."
              : `Il reste ${1000 - totalVerified} place(s) disponible(s) pour la certification automatique.`
            }
          </p>
        </div>

        {/* Demande de certification manuelle */}
        {!isVerified && (
          <div className="bg-card rounded-xl p-4 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Demander la certification
            </h4>
            {certRequest ? (
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  certRequest.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                  certRequest.status === "approved" ? "bg-primary/10 text-primary" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {certRequest.status === "pending" && "⏳ En attente de validation"}
                  {certRequest.status === "approved" && "✅ Approuvée"}
                  {certRequest.status === "rejected" && "❌ Refusée"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {certRequest.status === "pending" 
                    ? "Votre demande est en cours d'examen par notre équipe."
                    : certRequest.status === "rejected"
                    ? "Votre demande a été refusée. Vous pouvez réessayer ultérieurement."
                    : "Félicitations ! Votre certification a été approuvée."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Expliquez pourquoi vous souhaitez être certifié (notoriété, créateur de contenu, personnalité publique, etc.)
                </p>
                <textarea
                  value={certReason}
                  onChange={(e) => setCertReason(e.target.value)}
                  placeholder="Je souhaite être certifié parce que..."
                  className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{certReason.length}/500</span>
                  <Button 
                    onClick={handleSubmitCertRequest} 
                    disabled={submittingCert || !certReason.trim()}
                    size="sm"
                  >
                    {submittingCert ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Envoyer la demande
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voir les comptes certifiés */}
        <div className="bg-card rounded-xl overflow-hidden">
          <MenuItem icon={Users} title="Voir les comptes certifiés" subtitle="Parcourir les profils vérifiés" onClick={() => navigate("/certified")} />
        </div>
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
      "change-password": "Changer le mot de passe", certification: "Certification",
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
      case "certification": return renderCertificationSection();
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
            if (currentSection === "help" && helpSection === "faq") { setHelpSection("main"); return; }
            if (currentSection === "main") navigate(-1);
            else if (currentSection === "change-password") setCurrentSection("account");
            else { setCurrentSection("main"); setEditingField(null); setHelpSection("main"); }
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
