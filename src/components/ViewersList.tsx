import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Users, Eye } from "lucide-react";
import { Viewer } from "@/hooks/useViewers";

interface ViewersListProps {
  viewers: Viewer[];
  viewerCount: number;
}

export const ViewersList = ({ viewers, viewerCount }: ViewersListProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10"
        >
          <motion.div
            className="flex items-center gap-1"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Eye className="w-4 h-4" />
            <span className="font-semibold">{viewerCount}</span>
          </motion.div>
          <span className="text-xs">spectateur{viewerCount > 1 ? "s" : ""}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Spectateurs ({viewerCount})
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {viewers.map((viewer) => (
                <motion.div
                  key={viewer.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={viewer.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {viewer.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {viewer.display_name || "Utilisateur"}
                    </p>
                    {viewer.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{viewer.username}
                      </p>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {viewers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun spectateur pour le moment</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
