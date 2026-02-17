import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContactGroups } from "@/hooks/useContactGroups";
import { toast } from "sonner";

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface GroupMember {
  id: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    phone_number?: string | null;
  };
}

interface EditContactGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  onGroupUpdated?: () => void;
}

export const EditContactGroupModal = ({
  open,
  onOpenChange,
  groupId,
  groupName,
  onGroupUpdated,
}: EditContactGroupModalProps) => {
  const { user } = useAuth();
  const { getGroupMembers, addMember, removeMember, refetch } = useContactGroups();
  const [name, setName] = useState(groupName);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(groupName);
      fetchData();
    }
  }, [open, groupId, groupName]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch group members
    const membersData = await getGroupMembers(groupId);
    setMembers(membersData);

    // Fetch all contacts
    const { data: contactsData } = await supabase
      .from("profiles_public")
      .select("id, display_name, username, avatar_url")
      .neq("id", user.id)
      .order("display_name");

    if (contactsData) setContacts(contactsData);
    setLoading(false);
  };

  const memberIds = members.map((m) => m.user_id);

  const filteredContacts = contacts.filter((c) => {
    const contactName = c.display_name || c.username || "";
    return contactName.toLowerCase().includes(search.toLowerCase());
  });

  const handleUpdateName = async () => {
    if (!name.trim() || name === groupName) return;

    setSaving(true);
    const { error } = await supabase
      .from("contact_groups")
      .update({ name: name.trim() })
      .eq("id", groupId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du nom");
    } else {
      toast.success("Nom du groupe mis à jour");
      refetch();
    }
    setSaving(false);
  };

  const handleToggleMember = async (contactId: string) => {
    const existingMember = members.find((m) => m.user_id === contactId);
    
    if (existingMember) {
      // Remove member
      await removeMember(groupId, existingMember.id);
      setMembers((prev) => prev.filter((m) => m.user_id !== contactId));
    } else {
      // Add member
      await addMember(groupId, contactId);
      const contact = contacts.find((c) => c.id === contactId);
      setMembers((prev) => [...prev, { 
        id: crypto.randomUUID(), 
        user_id: contactId,
        profile: contact,
      }]);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onGroupUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Modifier le groupe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Nom du groupe</Label>
            <div className="flex gap-2">
              <Input
                id="groupName"
                placeholder="Nom du groupe..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />
              <Button
                onClick={handleUpdateName}
                disabled={saving || !name.trim() || name === groupName}
                className="rounded-xl px-4"
              >
                Sauver
              </Button>
            </div>
          </div>

          {/* Current Members */}
          <div className="space-y-2">
            <Label>Membres actuels ({members.length})</Label>
            <ScrollArea className="h-32 rounded-xl border p-2">
              {members.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Aucun membre
                </div>
              ) : (
                <div className="space-y-1">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(member.profile?.display_name || member.profile?.username || "?")?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium truncate">
                        {member.profile?.display_name || member.profile?.username || "Utilisateur"}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleToggleMember(member.user_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Add Members */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Ajouter des membres
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <ScrollArea className="h-40 rounded-xl border p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun contact trouvé
              </div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => {
                  const isMember = memberIds.includes(contact.id);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleToggleMember(contact.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isMember 
                          ? "bg-primary/10 hover:bg-primary/20" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox checked={isMember} />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={contact.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {(contact.display_name || contact.username || "?")?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">
                          {contact.display_name || contact.username || "Utilisateur"}
                        </p>
                        {contact.username && (
                          <p className="text-xs text-muted-foreground">
                            @{contact.username}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <Button onClick={handleClose} className="w-full rounded-xl">
          Terminé
        </Button>
      </DialogContent>
    </Dialog>
  );
};
