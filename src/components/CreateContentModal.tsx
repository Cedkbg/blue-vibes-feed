import { useState, useRef, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreateContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "channel" | "group" | "community";
  targetId: string;
  targetName: string;
  onContentCreated?: () => void;
}

export const CreateContentModal = ({ 
  open, 
  onOpenChange, 
  type, 
  targetId, 
  targetName,
  onContentCreated 
}: CreateContentModalProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, fileType: "image" | "video") => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 50 MB)");
      return;
    }

    setMediaFile(file);
    setMediaType(fileType);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user || (!caption.trim() && !mediaFile)) {
      toast.error("Veuillez ajouter du contenu");
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${type}/${targetId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
        mediaUrl = urlData.publicUrl;
      }

      // Create a post with reference to the channel/group/community
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType || "text",
        });

      if (postError) throw postError;

      // Also send as a message to the group/community chat
      if (type === "group" || type === "community") {
        await supabase
          .from("group_messages")
          .insert({
            user_id: user.id,
            [type === "group" ? "group_id" : "community_id"]: targetId,
            content: caption.trim() || "Nouveau contenu partagé",
            media_url: mediaUrl,
            media_type: mediaType,
          });
      }

      toast.success("Contenu publié !");
      onContentCreated?.();
      handleClose();
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Erreur lors de la publication");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    clearMedia();
    onOpenChange(false);
  };

  const getTitle = () => {
    switch (type) {
      case "channel":
        return `Publier sur ${targetName}`;
      case "group":
        return `Partager dans ${targetName}`;
      case "community":
        return `Publier dans ${targetName}`;
      default:
        return "Nouveau contenu";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Preview */}
          {mediaPreview ? (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              {mediaType === "video" ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 rounded-full"
                onClick={clearMedia}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, "image");
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, "video");
                }}
              />
              
              <Button
                variant="outline"
                className="flex-1 h-24 flex-col gap-2"
                onClick={() => imageInputRef.current?.click()}
              >
                <Image className="w-6 h-6" />
                <span className="text-sm">Photo</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-24 flex-col gap-2"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="w-6 h-6" />
                <span className="text-sm">Vidéo</span>
              </Button>
            </div>
          )}

          {/* Caption */}
          <Textarea
            placeholder="Écrire quelque chose..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none min-h-[100px]"
            maxLength={2000}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={(!caption.trim() && !mediaFile) || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};