import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Video, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CreatePost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!caption.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter une légende à votre post",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour publier",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption.trim(),
        media_type: "text",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre post a été publié !",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
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
          disabled={isLoading || !caption.trim()}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Send className="w-6 h-6" />
        </Button>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Caption input */}
        <div>
          <Textarea
            placeholder="Quoi de neuf ?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[200px] text-lg resize-none border-0 focus-visible:ring-0 bg-transparent"
          />
        </div>

        {/* Media buttons */}
        <div className="flex gap-4 border-t border-border pt-4">
          <Button variant="outline" className="flex-1 gap-2" disabled>
            <Image className="w-5 h-5" />
            Photo
          </Button>
          <Button variant="outline" className="flex-1 gap-2" disabled>
            <Video className="w-5 h-5" />
            Vidéo
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Les photos et vidéos seront bientôt disponibles
        </p>
      </div>
    </div>
  );
};

export default CreatePost;
