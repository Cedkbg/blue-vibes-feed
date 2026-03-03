import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Link2, Plus, Users, ArrowLeft, LogOut, Copy, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  invite_code: string;
  creator_id: string;
  members_count: number;
  created_at: string;
}

const Creneau = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const fetchWorkspaces = async () => {
    if (!user) return;
    setIsLoading(true);

    // Get workspaces where user is a member
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const wsIds = memberships.map((m: any) => m.workspace_id);
      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .in("id", wsIds)
        .order("created_at", { ascending: false });
      setWorkspaces((data as any) || []);
    } else {
      setWorkspaces([]);
    }
    setIsLoading(false);
  };

  const joinByLink = async () => {
    if (!inviteLink.trim() || !user) return;
    setIsJoining(true);

    // Extract code from link or use raw code
    const code = inviteLink.trim().split("/").pop()?.trim() || inviteLink.trim();

    const { data, error } = await supabase.rpc("lookup_workspace_by_code", { code });

    if (error || !data || (data as any[]).length === 0) {
      toast.error("Lien d'invitation invalide ou expiré");
      setIsJoining(false);
      return;
    }

    const workspace = (data as any[])[0];

    // Check if already a member
    const { data: existing } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      toast.info("Vous êtes déjà membre de ce créneau");
      setIsJoining(false);
      setInviteLink("");
      return;
    }

    const { error: joinError } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id });

    if (joinError) {
      toast.error("Impossible de rejoindre ce créneau");
    } else {
      toast.success(`Vous avez rejoint "${workspace.name}" !`);
      setInviteLink("");
      fetchWorkspaces();
    }
    setIsJoining(false);
  };

  const createWorkspace = async () => {
    if (!newName.trim() || !user) return;
    setIsCreating(true);

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        creator_id: user.id,
        members_count: 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création");
      setIsCreating(false);
      return;
    }

    // Auto-join as admin
    await supabase
      .from("workspace_members")
      .insert({ workspace_id: (data as any).id, user_id: user.id, role: "admin" });

    toast.success("Créneau créé !");
    setCreateOpen(false);
    setNewName("");
    setNewDesc("");
    setIsCreating(false);
    fetchWorkspaces();
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code d'invitation copié !");
  };

  return (
    <DesktopLayout showStories={false} title="Créneau">
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Créneau</h1>
            <p className="text-sm text-muted-foreground">Espaces de travail professionnels</p>
          </div>
        </div>

        {/* Join by link */}
        <Card className="mb-6 border-dashed border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Rejoindre avec un lien</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Collez le code d'invitation fourni par l'hôte du créneau
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Code d'invitation..."
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinByLink()}
                className="flex-1"
              />
              <Button onClick={joinByLink} disabled={isJoining || !inviteLink.trim()}>
                {isJoining ? "..." : "Rejoindre"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create workspace button */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mb-6 gap-2">
              <Plus className="w-4 h-4" />
              Créer un créneau
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau créneau</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom du créneau</label>
                <Input
                  placeholder="Ex: Marketing Team"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  placeholder="Décrivez votre espace de travail..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <Button className="w-full" onClick={createWorkspace} disabled={isCreating || !newName.trim()}>
                {isCreating ? "Création..." : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Workspaces list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Aucun créneau</p>
            <p className="text-sm mt-2">
              Rejoignez un espace de travail avec un lien d'invitation<br />
              ou créez le vôtre.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Vos créneaux ({workspaces.length})
            </h3>
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="w-12 h-12 rounded-xl">
                    <AvatarImage src={ws.avatar_url || ""} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                      {ws.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{ws.name}</h3>
                    {ws.description && (
                      <p className="text-sm text-muted-foreground truncate">{ws.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ws.members_count} membre{ws.members_count > 1 ? "s" : ""}
                      </span>
                      {ws.creator_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1"
                          onClick={(e) => { e.stopPropagation(); copyInviteCode(ws.invite_code); }}
                        >
                          <Copy className="w-3 h-3" /> Code
                        </Button>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
};

export default Creneau;
