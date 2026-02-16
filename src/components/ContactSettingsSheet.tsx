import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, BellOff, Ban, Trash2, Archive, Pin, 
  Volume2, VolumeX, Shield, Flag, UserX, Search
} from "lucide-react";
import { toast } from "sonner";

interface ContactSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  onBlockUser?: () => void;
  onDeleteConversation?: () => void;
}

export const ContactSettingsSheet = ({
  open,
  onOpenChange,
  contact,
  onBlockUser,
  onDeleteConversation,
}: ContactSettingsSheetProps) => {
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [muteSound, setMuteSound] = useState(false);
  const [pinConversation, setPinConversation] = useState(false);

  if (!contact) return null;

  const SettingItem = ({ icon: Icon, title, subtitle, onClick, danger, rightElement }: {
    icon: any; title: string; subtitle?: string; onClick?: () => void; danger?: boolean; rightElement?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg ${danger ? "text-destructive" : ""}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${danger ? "bg-destructive/10" : "bg-primary/10"}`}>
        <Icon className={`w-4 h-4 ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {rightElement}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Paramètres du contact</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          {/* Contact info */}
          <div className="p-6 flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={contact.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {contact.display_name?.[0] || contact.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg">{contact.display_name || contact.username || "Utilisateur"}</h3>
            {contact.username && (
              <p className="text-sm text-muted-foreground">@{contact.username}</p>
            )}
          </div>

          <Separator />

          {/* Notification settings */}
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Notifications</p>
            <SettingItem
              icon={muteNotifications ? BellOff : Bell}
              title="Notifications silencieuses"
              subtitle="Désactiver les notifications pour ce contact"
              rightElement={
                <Switch
                  checked={muteNotifications}
                  onCheckedChange={(c) => {
                    setMuteNotifications(c);
                    toast.success(c ? "Notifications désactivées" : "Notifications activées");
                  }}
                />
              }
            />
            <SettingItem
              icon={muteSound ? VolumeX : Volume2}
              title="Son des messages"
              subtitle="Couper le son pour ce contact"
              rightElement={
                <Switch
                  checked={muteSound}
                  onCheckedChange={(c) => {
                    setMuteSound(c);
                    toast.success(c ? "Son désactivé" : "Son activé");
                  }}
                />
              }
            />
          </div>

          <Separator />

          {/* Conversation actions */}
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Conversation</p>
            <SettingItem
              icon={Pin}
              title="Épingler la conversation"
              subtitle="La garder en haut de la liste"
              rightElement={
                <Switch
                  checked={pinConversation}
                  onCheckedChange={(c) => {
                    setPinConversation(c);
                    toast.success(c ? "Conversation épinglée" : "Conversation désépinglée");
                  }}
                />
              }
            />
            <SettingItem
              icon={Search}
              title="Rechercher dans la conversation"
              subtitle="Trouver un message spécifique"
              onClick={() => toast.info("Fonctionnalité à venir")}
            />
            <SettingItem
              icon={Archive}
              title="Archiver la conversation"
              subtitle="Masquer de la liste principale"
              onClick={() => toast.success("Conversation archivée")}
            />
          </div>

          <Separator />

          {/* Danger zone */}
          <div className="p-4">
            <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-2 px-1">Zone de danger</p>
            <SettingItem
              icon={UserX}
              title="Bloquer ce contact"
              subtitle="Ne plus recevoir de messages"
              danger
              onClick={() => {
                onBlockUser?.();
                onOpenChange(false);
              }}
            />
            <SettingItem
              icon={Flag}
              title="Signaler"
              subtitle="Signaler un comportement inapproprié"
              danger
              onClick={() => toast.info("Signalement envoyé")}
            />
            <SettingItem
              icon={Trash2}
              title="Supprimer la conversation"
              subtitle="Supprimer tous les messages"
              danger
              onClick={() => {
                onDeleteConversation?.();
                onOpenChange(false);
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
