import { useState, useRef, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryCreated: () => void;
}

export const CreateStoryModal = ({ open, onOpenChange, onStoryCreated }: CreateStoryModalProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, type: "image" | "video") => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 50 MB)");
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    
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
    if (!user || !mediaFile || !mediaType) {
      toast.error("Veuillez sélectionner une image ou vidéo");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = mediaFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, mediaFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);

      const { error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          caption: caption.trim() || null,
        });

      if (storyError) throw storyError;

      toast.success("Statut publié !");
      onStoryCreated();
      handleClose();
    } catch (error) {
      console.error("Error creating story:", error);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau statut</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Preview */}
          {mediaPreview ? (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-square">
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
                className="flex-1 h-32 flex-col gap-2"
                onClick={() => imageInputRef.current?.click()}
              >
                <Image className="w-8 h-8" />
                <span>Photo</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-32 flex-col gap-2"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="w-8 h-8" />
                <span>Vidéo</span>
              </Button>
            </div>
          )}

          {/* Caption */}
          <Textarea
            placeholder="Ajouter une légende..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none"
            maxLength={500}
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
              disabled={!mediaFile || isUploading}
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