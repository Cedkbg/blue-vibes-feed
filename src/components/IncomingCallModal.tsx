import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion } from "framer-motion";

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar: string | null;
  callType: "video" | "audio";
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal = ({
  isOpen,
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
}: IncomingCallModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden [&>button]:hidden">
        <div className="bg-gradient-to-br from-primary via-primary to-accent p-8 text-center">
          {/* Pulsing rings animation */}
          <div className="relative flex items-center justify-center mb-6">
            <motion.div
              className="absolute w-32 h-32 rounded-full border-2 border-primary-foreground/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-28 h-28 rounded-full border-2 border-primary-foreground/40"
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="absolute w-24 h-24 rounded-full border-2 border-primary-foreground/50"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
            <Avatar className="w-20 h-20 border-4 border-primary-foreground shadow-xl">
              <AvatarImage src={callerAvatar || ""} />
              <AvatarFallback className="text-2xl bg-primary-foreground text-primary">
                {callerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <h2 className="text-xl font-bold text-primary-foreground mb-2">
            {callerName}
          </h2>
          <p className="text-primary-foreground/80 mb-8 flex items-center justify-center gap-2">
            {callType === "video" ? (
              <>
                <Video className="w-4 h-4" />
                Appel vidéo entrant...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Appel audio entrant...
              </>
            )}
          </p>

          <div className="flex justify-center gap-8">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onDecline}
                size="lg"
                className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onAccept}
                size="lg"
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
              >
                {callType === "video" ? (
                  <Video className="w-7 h-7" />
                ) : (
                  <Phone className="w-7 h-7" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
