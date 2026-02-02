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
import { Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContactGroups } from "@/hooks/useContactGroups";

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone_number: string | null;
}

interface CreateContactGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

export const CreateContactGroupModal = ({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateContactGroupModalProps) => {
  const { user } = useAuth();
  const { createGroup } = useContactGroups();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user || !open) return;
      setLoading(true);

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, phone_number")
        .neq("id", user.id)
        .not("phone_number", "is", null)
        .order("display_name");

      if (data) setContacts(data);
      setLoading(false);
    };

    fetchContacts();
  }, [user, open]);

  const filteredContacts = contacts.filter((c) => {
    const name = c.display_name || c.username || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    const result = await createGroup(name, selectedIds);
    setCreating(false);

    if (result) {
      setName("");
      setSelectedIds([]);
      onOpenChange(false);
      onGroupCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Créer un groupe d'appel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nom du groupe *</Label>
            <Input
              id="groupName"
              placeholder="Ex: Famille, Travail, Amis..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Sélectionner les contacts ({selectedIds.length})</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <ScrollArea className="h-64 rounded-xl border p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {contacts.length === 0
                  ? "Aucun contact avec numéro de téléphone"
                  : "Aucun résultat"}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(contact.display_name || contact.username || "?")?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">
                        {contact.display_name || contact.username || "Utilisateur"}
                      </p>
                      {contact.phone_number && (
                        <p className="text-xs text-muted-foreground">
                          {contact.phone_number}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
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
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 rounded-xl gradient-primary"
          >
            {creating ? "Création..." : "Créer le groupe"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
