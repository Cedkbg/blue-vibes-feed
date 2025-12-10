import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Radio, Video, Sparkles } from "lucide-react";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { toast } from "sonner";

interface StartLiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStreamStarted?: (streamId: string) => void;
}

export const StartLiveModal = ({ open, onOpenChange, onStreamStarted }: StartLiveModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { startStream } = useLiveStreams();

  const handleStartStream = async () => {
    if (!title.trim()) {
      toast.error("Veuillez entrer un titre pour votre live");
      return;
    }

    setLoading(true);
    const stream = await startStream(title, description);
    setLoading(false);

    if (stream) {
      toast.success("Votre live a commencé !");
      onOpenChange(false);
      onStreamStarted?.(stream.id);
      setTitle("");
      setDescription("");
    } else {
      toast.error("Erreur lors du démarrage du live");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            Démarrer un Live
          </DialogTitle>
          <DialogDescription>
            Partagez un moment en direct avec vos abonnés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du live *</Label>
            <Input
              id="title"
              placeholder="De quoi allez-vous parler ?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre live..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Conseils</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Choisissez un endroit bien éclairé</li>
              <li>• Parlez clairement et regardez la caméra</li>
              <li>• Interagissez avec votre audience</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
          >
            Annuler
          </Button>
          <Button
            onClick={handleStartStream}
            disabled={loading || !title.trim()}
            className="flex-1 gap-2 rounded-xl gradient-primary"
          >
            <Video className="w-4 h-4" />
            {loading ? "Démarrage..." : "Go Live"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
