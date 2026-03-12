import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Link2, Plus, Users, Copy, ChevronRight, Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const WORKSPACE_COLORS = [
  "from-primary to-accent",
  "from-accent to-primary",
  "from-primary/80 to-accent/60",
  "from-accent/80 to-primary/60",
];

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
    const code = inviteLink.trim().split("/").pop()?.trim() || inviteLink.trim();
    const { data, error } = await supabase.rpc("lookup_workspace_by_code", { code });

    if (error || !data || (data as any[]).length === 0) {
      toast.error("Lien d'invitation invalide ou expiré");
      setIsJoining(false);
      return;
    }
    const workspace = (data as any[])[0];
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-6 mb-6 text-primary-foreground">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Créneau</h1>
                <p className="text-sm opacity-80">Vos espaces de travail</p>
              </div>
            </div>
            <p className="text-sm opacity-70 mt-3 max-w-md">
              Collaborez avec vos équipes dans des espaces privés et organisés.
            </p>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Créer</p>
                  <p className="text-xs text-muted-foreground">Nouveau créneau</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau créneau</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom</label>
                  <Input
                    placeholder="Ex: Marketing Team"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    placeholder="Décrivez votre espace..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button className="w-full" onClick={createWorkspace} disabled={isCreating || !newName.trim()}>
                  {isCreating ? "Création..." : "Créer le créneau"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <button
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left w-full"
              onClick={() => {
                const el = document.getElementById("join-input");
                el?.focus();
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Rejoindre</p>
                <p className="text-xs text-muted-foreground">Avec un code</p>
              </div>
            </button>
          </div>
        </div>

        {/* Join input */}
        <div className="flex gap-2 mb-8">
          <Input
            id="join-input"
            placeholder="Collez un code d'invitation..."
            value={inviteLink}
            onChange={(e) => setInviteLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinByLink()}
            className="flex-1"
          />
          <Button onClick={joinByLink} disabled={isJoining || !inviteLink.trim()} size="sm">
            {isJoining ? "..." : "Rejoindre"}
          </Button>
        </div>

        {/* Workspaces list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-lg">Aucun créneau encore</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Créez votre premier espace de travail ou rejoignez-en un avec un code d'invitation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
              Vos créneaux · {workspaces.length}
            </p>
            {workspaces.map((ws, i) => (
              <div
                key={ws.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${WORKSPACE_COLORS[i % WORKSPACE_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                  {ws.avatar_url ? (
                    <Avatar className="w-11 h-11 rounded-xl">
                      <AvatarImage src={ws.avatar_url} />
                      <AvatarFallback className="rounded-xl bg-transparent text-primary-foreground font-bold">
                        {ws.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="text-primary-foreground font-bold text-lg">{ws.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate text-foreground">{ws.name}</h3>
                  {ws.description && (
                    <p className="text-xs text-muted-foreground truncate">{ws.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {ws.members_count} membre{ws.members_count > 1 ? "s" : ""}
                    </span>
                    {ws.creator_id === user?.id && (
                      <button
                        className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                        onClick={(e) => { e.stopPropagation(); copyInviteCode(ws.invite_code); }}
                      >
                        <Copy className="w-3 h-3" /> Copier code
                      </button>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
};

export default Creneau;
