import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Video, Send, X, Sparkles, Wand2, Plus, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAI } from "@/hooks/useAI";
import { compressVideo, compressImage, formatFileSize } from "@/utils/videoCompressor";
import { getMoodFromText } from "@/hooks/useMoodAura";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<"image" | "video" | "text">("text");
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
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

  const handleImagesSelect = (files: FileList) => {
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    const maxFiles = 10;
    const currentCount = mediaFiles.length;

    Array.from(files).slice(0, maxFiles - currentCount).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 50 MB)`);
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (newFiles.length > 0) {
      setMediaFiles((prev) => [...prev, ...newFiles]);
      setMediaPreviews((prev) => [...prev, ...newPreviews]);
      setMediaType("image");
    }
  };

  const handleVideoSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 50 MB)");
      return;
    }
    setMediaFiles([file]);
    setMediaPreviews([URL.createObjectURL(file)]);
    setMediaType("video");
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    if (mediaFiles.length <= 1) setMediaType("text");
  };

  const clearAllMedia = () => {
    mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
    setMediaFiles([]);
    setMediaPreviews([]);
    setMediaType("text");
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw new Error("Erreur lors de l'upload");

    const { data } = supabase.storage.from("media").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!caption.trim() && mediaFiles.length === 0) {
      toast.error("Veuillez ajouter du contenu à votre post");
      return;
    }
    if (!user) {
      toast.error("Vous devez être connecté pour publier");
      return;
    }

    setIsLoading(true);
    try {
      let processedFiles = [...mediaFiles];

      // Compress files
      if (mediaType === "video" && processedFiles.length === 1) {
        setCompressionProgress(0);
        const original = processedFiles[0];
        processedFiles[0] = await compressVideo(original, setCompressionProgress);
        if (processedFiles[0] !== original) {
          toast.success(`Vidéo compressée : ${formatFileSize(original.size)} → ${formatFileSize(processedFiles[0].size)}`);
        }
        setCompressionProgress(null);
      } else if (mediaType === "image") {
        processedFiles = await Promise.all(processedFiles.map((f) => compressImage(f)));
      }

      // Upload files
      const urls = await Promise.all(processedFiles.map(uploadFile));

      // Upload audio if present
      let audioUrl: string | null = null;
      if (audioFile) {
        audioUrl = await uploadFile(audioFile);
      }

      const detectedMood = getMoodFromText(caption.trim());
      const postData: any = {
        user_id: user.id,
        caption: caption.trim() || null,
        media_type: mediaType,
        media_url: urls[0] || null,
        mood_aura: detectedMood !== "neutral" ? detectedMood : null,
        audio_url: audioUrl,
      };

      // Add carousel urls if multiple images
      if (urls.length > 1) {
        postData.media_urls = urls;
        postData.media_type = "carousel";
      }

      const { error } = await supabase.from("posts").insert(postData);
      if (error) throw error;

      toast.success("Votre post a été publié !");
      navigate("/");
    } catch (error: any) {
      console.error("Post creation error:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
      setCompressionProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Nouveau Post</h1>
        <Button variant="ghost" size="icon" onClick={handleSubmit} disabled={isLoading || (!caption.trim() && mediaFiles.length === 0)} className="text-primary-foreground hover:bg-primary-foreground/10">
          <Send className="w-6 h-6" />
        </Button>
      </header>

      <div className="p-4 space-y-6">
        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="space-y-2">
            {mediaType === "video" ? (
              <div className="relative rounded-xl overflow-hidden bg-muted">
                <video src={mediaPreviews[0]} controls className="w-full max-h-[400px] object-contain" />
                <Button variant="secondary" size="icon" className="absolute top-2 right-2 rounded-full" onClick={clearAllMedia}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaPreviews.map((preview, i) => (
                  <div key={i} className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-muted">
                    <img src={preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <Button variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => removeMedia(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {mediaFiles.length < 10 && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs mt-1">{mediaFiles.length}/10</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compression progress */}
        {compressionProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Compression vidéo...</span>
              <span>{Math.round(compressionProgress)}%</span>
            </div>
            <Progress value={compressionProgress} className="h-2" />
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
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-violet-500 border-violet-200 hover:bg-violet-50" onClick={handleGenerateCaption} disabled={aiLoading}>
              {aiLoading ? <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Générer avec IA
            </Button>
            {caption.trim() && (
              <Button variant="outline" size="sm" className="gap-1.5 text-fuchsia-500 border-fuchsia-200 hover:bg-fuchsia-50" onClick={handleImproveCaption} disabled={aiLoading}>
                <Wand2 className="w-3.5 h-3.5" />
                Améliorer
              </Button>
            )}
          </div>
        </div>

        {/* Audio preview */}
        {audioFile && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            <Music className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{audioFile.name}</p>
              {audioPreview && <audio src={audioPreview} controls className="w-full mt-1 h-8" />}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAudioFile(null); if (audioPreview) URL.revokeObjectURL(audioPreview); setAudioPreview(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Media buttons */}
        <div className="flex gap-3 border-t border-border pt-4 flex-wrap">
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleImagesSelect(e.target.files)} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoSelect(f); }} />
          <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > 20 * 1024 * 1024) { toast.error("Audio trop volumineux (max 20 MB)"); return; }
              setAudioFile(f);
              setAudioPreview(URL.createObjectURL(f));
            }
          }} />
          <Button variant="outline" className="flex-1 gap-2" onClick={() => imageInputRef.current?.click()} disabled={isLoading || mediaType === "video"}>
            <Image className="w-5 h-5" />
            Photo{mediaFiles.length > 0 ? ` (${mediaFiles.length})` : ""}
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => videoInputRef.current?.click()} disabled={isLoading || (mediaType === "image" && mediaFiles.length > 0)}>
            <Video className="w-5 h-5" />
            Vidéo
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => audioInputRef.current?.click()} disabled={isLoading || !!audioFile}>
            <Music className="w-5 h-5" />
            Son
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Publication en cours...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
