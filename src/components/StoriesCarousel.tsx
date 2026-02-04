import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight, Eye, Clock } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateStoryModal } from "@/components/CreateStoryModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { StoryWatermark } from "@/components/StoryWatermark";
interface StoryViewerProps {
  stories: any[];
  initialIndex: number;
  onClose: () => void;
  onView: (storyId: string) => void;
}

const StoryViewer = ({ stories, initialIndex, onClose, onView }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showIntro, setShowIntro] = useState(true);
  const currentStory = stories[currentIndex];

  // Reset intro on story change
  useEffect(() => {
    setShowIntro(true);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      onView(stories[currentIndex + 1].id);
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentStory) return null;

  const creatorName = currentStory.profile?.display_name || currentStory.profile?.username || "";

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* CedLite Watermark */}
      <StoryWatermark showIntro={showIntro} creatorName={creatorName} />
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index <= currentIndex ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={currentStory.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {currentStory.profile?.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">
              {currentStory.profile?.display_name || "Utilisateur"}
            </p>
            <p className="text-white/70 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(currentStory.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Media */}
      {currentStory.media_type === "video" ? (
        <video
          src={currentStory.media_url}
          className="max-w-full max-h-full object-contain"
          autoPlay
          loop
          playsInline
          controls
        />
      ) : (
        <img
          src={currentStory.media_url}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
      )}

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-4 right-4 text-center">
          <p className="text-white text-lg font-medium drop-shadow-lg">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Views */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/70">
        <Eye className="w-4 h-4" />
        <span className="text-sm">{currentStory.views_count} vues</span>
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
          onClick={handlePrev}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
          onClick={handleNext}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Click areas for navigation */}
      <div
        className="absolute left-0 top-0 w-1/3 h-full cursor-pointer z-5"
        onClick={handlePrev}
      />
      <div
        className="absolute right-0 top-0 w-1/3 h-full cursor-pointer z-5"
        onClick={handleNext}
      />
    </div>
  );
};

export const StoriesCarousel = () => {
  const { user } = useAuth();
  const { groupedStories, loading, viewStory, viewedStoryIds, refetch } = useStories();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleAddStory = () => {
    setShowCreateModal(true);
  };

  const handleStoryCreated = () => {
    refetch();
  };

  const handleOpenStory = (group: any) => {
    setSelectedGroup(group);
    setIsViewerOpen(true);
    // Mark first story as viewed
    if (group.stories.length > 0) {
      viewStory(group.stories[0].id);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedGroup(null);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted" />
            <div className="w-12 h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-hide"
      >
        {/* Add Story Button */}
        {user && (
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button 
              onClick={handleAddStory}
              className="relative w-16 h-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-6 h-6 text-primary" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Ajouter
            </span>
          </div>
        )}

        {/* Stories */}
        {groupedStories.map((group) => {
          const hasUnviewed = group.stories.some(
            (s) => !viewedStoryIds.includes(s.id)
          );
          const isCurrentUser = user?.id === group.user_id;

          return (
            <div
              key={group.user_id}
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => handleOpenStory(group)}
            >
              <div
                className={`relative p-0.5 rounded-full ${
                  hasUnviewed
                    ? "bg-gradient-to-tr from-primary via-accent to-primary"
                    : "bg-muted"
                }`}
              >
                <Avatar className="w-16 h-16 border-2 border-background">
                  <AvatarImage src={group.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {group.profile?.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-foreground font-medium truncate max-w-16">
                {isCurrentUser ? "Vous" : group.profile?.display_name || "User"}
              </span>
            </div>
          );
        })}

        {groupedStories.length === 0 && !user && (
          <p className="text-sm text-muted-foreground py-4">
            Aucune story pour le moment
          </p>
        )}
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-lg h-[90vh] p-0 bg-transparent border-none" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Visualiseur de statut</DialogTitle>
          </VisuallyHidden>
          {selectedGroup && (
            <StoryViewer
              stories={selectedGroup.stories}
              initialIndex={0}
              onClose={handleCloseViewer}
              onView={viewStory}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Story Modal */}
      <CreateStoryModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onStoryCreated={handleStoryCreated}
      />
    </>
  );
};
