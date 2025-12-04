import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  username: z.string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
    .regex(/^[a-zA-Z0-9_]+$/, "Seuls les lettres, chiffres et underscores sont autorisés"),
  bio: z.string().max(150, "La bio ne peut pas dépasser 150 caractères").optional(),
  external_link: z.string().url("Veuillez entrer une URL valide").optional().or(z.literal("")),
});

interface Profile {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  external_link: string | null;
  is_private: boolean;
  language: string | null;
}

interface EditProfileSheetProps {
  profile: Profile | null;
  userId: string;
  onUpdate: () => void;
  onClose: () => void;
}

export const EditProfileSheet = ({ profile, userId, onUpdate, onClose }: EditProfileSheetProps) => {
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [externalLink, setExternalLink] = useState(profile?.external_link || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);

    try {
      // Create a data URL for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Note: In a real implementation, you would upload to Supabase Storage
      // For now, we'll store the data URL directly (not recommended for production)
      toast.success("Photo mise à jour");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors du téléchargement de la photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setErrors({});

    // Validate
    const result = profileSchema.safeParse({
      username: username.trim(),
      bio: bio.trim() || undefined,
      external_link: externalLink.trim() || undefined,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
        external_link: externalLink.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      if (error.code === "23505") {
        setErrors({ username: "Ce nom d'utilisateur est déjà pris" });
      } else {
        toast.error("Erreur lors de la mise à jour du profil");
      }
    } else {
      toast.success("Profil mis à jour avec succès");
      onUpdate();
      onClose();
    }

    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-xl font-bold">Modifier le profil</h2>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="sm"
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Enregistrer
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground">
            Appuyez pour changer la photo
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="votre_nom"
            maxLength={30}
            className={errors.username ? "border-destructive" : ""}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {username.length}/30 caractères
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Parlez de vous..."
            maxLength={150}
            rows={3}
            className={errors.bio ? "border-destructive" : ""}
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {bio.length}/150 caractères
          </p>
        </div>

        {/* External Link */}
        <div className="space-y-2">
          <Label htmlFor="external_link">Lien externe</Label>
          <Input
            id="external_link"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="https://votre-site.com"
            className={errors.external_link ? "border-destructive" : ""}
          />
          {errors.external_link && (
            <p className="text-sm text-destructive">{errors.external_link}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Instagram, YouTube, site web personnel...
          </p>
        </div>
      </div>
    </div>
  );
};
