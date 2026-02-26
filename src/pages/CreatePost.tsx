import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Video, Send, X, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAI } from "@/hooks/useAI";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "text">("text");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { generateCaption, improveText, isLoading: aiLoading } = useAI();

  const handleGenerateCaption = async () => {
    const result = await generateCaption(caption || undefined);
    if (result) setCaption(result);
  };

  const handleImproveCaption = async () => {
    if (!caption.trim()) return;
    const result = await improveText(caption);
    if (result) setCaption(result);
  };

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
    setMediaType("text");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erreur lors de l'upload du fichier");
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !mediaFile) {
      toast.error("Veuillez ajouter du contenu à votre post");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté pour publier");
      return;
    }

    setIsLoading(true);
    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption.trim() || null,
        media_type: mediaType,
        media_url: mediaUrl,
      });

      if (error) throw error;

      toast.success("Votre post a été publié !");
      navigate("/");
    } catch (error: any) {
      console.error("Post creation error:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Nouveau Post</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || (!caption.trim() && !mediaFile)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Send className="w-6 h-6" />
        </Button>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden bg-muted">
            {mediaType === "video" ? (
              <video
                src={mediaPreview}
                controls
                className="w-full max-h-[400px] object-contain"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-full max-h-[400px] object-contain"
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
        )}

        {/* Caption input */}
        <div>
          <Textarea
            placeholder="Quoi de neuf ?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[150px] text-lg resize-none border-0 focus-visible:ring-0 bg-transparent"
          />
          {/* AI Buttons */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-violet-500 border-violet-200 hover:bg-violet-50"
              onClick={handleGenerateCaption}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Générer avec IA
            </Button>
            {caption.trim() && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-fuchsia-500 border-fuchsia-200 hover:bg-fuchsia-50"
                onClick={handleImproveCaption}
                disabled={aiLoading}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Améliorer
              </Button>
            )}
          </div>
        </div>

        {/* Media buttons */}
        <div className="flex gap-4 border-t border-border pt-4">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, "image");
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, "video");
            }}
          />
          
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
          >
            <Image className="w-5 h-5" />
            Photo
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => videoInputRef.current?.click()}
            disabled={isLoading}
          >
            <Video className="w-5 h-5" />
            Vidéo
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Publication en cours...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;