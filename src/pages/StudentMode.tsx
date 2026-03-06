import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, GraduationCap, Plus, MapPin, BookOpen, Calendar,
  ExternalLink, Github, Linkedin, FileText, Search, X, Briefcase, Star
} from "lucide-react";

interface StudentProfile {
  id: string;
  user_id: string;
  university: string | null;
  field_of_study: string | null;
  graduation_year: number | null;
  bio: string | null;
  skills: string[];
  cv_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  gpa: string | null;
  looking_for: string | null;
  userProfile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
}

const lookingForOptions = [
  { value: "stage", label: "Stage" },
  { value: "alternance", label: "Alternance" },
  { value: "cdi", label: "CDI" },
  { value: "freelance", label: "Freelance" },
  { value: "projet", label: "Projet collaboratif" },
];

const StudentMode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [gpa, setGpa] = useState("");
  const [lookingFor, setLookingFor] = useState("stage");

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: userProfiles } = await supabase
        .from("profiles_public")
        .select("id, display_name, username, avatar_url, is_verified")
        .in("id", userIds);

      const profileMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
      const enriched = data.map(s => ({ ...s, skills: s.skills || [], userProfile: profileMap.get(s.user_id) }));
      setProfiles(enriched);
      if (user) {
        setMyProfile(enriched.find(s => s.user_id === user.id) || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [user]);

  const handleCreate = async () => {
    if (!user || !university.trim()) return;
    const { error } = await supabase.from("student_profiles").insert({
      user_id: user.id,
      university: university.trim(),
      field_of_study: fieldOfStudy.trim() || null,
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
      bio: bio.trim() || null,
      skills: skills.split(",").map(s => s.trim()).filter(Boolean),
      portfolio_url: portfolioUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      gpa: gpa.trim() || null,
      looking_for: lookingFor,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil étudiant créé !" });
      setCreateOpen(false);
      fetchProfiles();
    }
  };

  const filtered = profiles.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.university?.toLowerCase().includes(q) ||
      p.field_of_study?.toLowerCase().includes(q) ||
      p.skills?.some(s => s.toLowerCase().includes(q)) ||
      p.userProfile?.display_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <TopBar />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigate("/discover")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <GraduationCap className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold truncate">Mode Étudiant</h1>
          </div>
          {!myProfile && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Mon profil</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer mon profil étudiant</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Université / École *" value={university} onChange={e => setUniversity(e.target.value)} />
                  <Input placeholder="Domaine d'études" value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)} />
                  <Input placeholder="Année de diplôme (ex: 2026)" type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} />
                  <Textarea placeholder="Bio courte..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
                  <Input placeholder="Compétences (séparées par des virgules)" value={skills} onChange={e => setSkills(e.target.value)} />
                  <Input placeholder="GPA / Moyenne" value={gpa} onChange={e => setGpa(e.target.value)} />
                  <Select value={lookingFor} onValueChange={setLookingFor}>
                    <SelectTrigger><SelectValue placeholder="Je cherche..." /></SelectTrigger>
                    <SelectContent>
                      {lookingForOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="URL Portfolio" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                  <Input placeholder="URL LinkedIn" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                  <Input placeholder="URL GitHub" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
                  <Button onClick={handleCreate} disabled={!university.trim()} className="w-full">Créer mon profil</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par université, compétence..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-8" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>

        {/* My profile card */}
        {myProfile && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Mon profil étudiant</span>
              </div>
              <StudentCard profile={myProfile} navigate={navigate} />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun profil étudiant trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.filter(p => p.user_id !== user?.id).map(profile => (
              <StudentCard key={profile.id} profile={profile} navigate={navigate} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

const StudentCard = ({ profile, navigate }: { profile: StudentProfile; navigate: (path: string) => void }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 cursor-pointer" onClick={() => navigate(`/profile/${profile.user_id}`)}>
          <AvatarImage src={profile.userProfile?.avatar_url || ""} />
          <AvatarFallback>{profile.userProfile?.display_name?.[0] || "E"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{profile.userProfile?.display_name || "Étudiant"}</p>
            {profile.userProfile?.is_verified && <Badge variant="secondary" className="text-[10px] px-1">✓</Badge>}
          </div>
          {profile.university && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3" /> {profile.university}
            </p>
          )}
          {profile.field_of_study && (
            <p className="text-xs text-muted-foreground mt-0.5">{profile.field_of_study}</p>
          )}
        </div>
        {profile.looking_for && (
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            <Briefcase className="w-3 h-3 mr-1" />
            {lookingForOptions.find(o => o.value === profile.looking_for)?.label || profile.looking_for}
          </Badge>
        )}
      </div>

      {profile.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}

      {profile.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.skills.slice(0, 5).map((skill, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{skill}</Badge>
          ))}
          {profile.skills.length > 5 && <Badge variant="secondary" className="text-[10px]">+{profile.skills.length - 5}</Badge>}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        {profile.graduation_year && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Calendar className="w-3 h-3" /> {profile.graduation_year}
          </span>
        )}
        {profile.gpa && (
          <span className="text-[10px] text-muted-foreground">GPA: {profile.gpa}</span>
        )}
        <div className="flex-1" />
        {profile.linkedin_url && (
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.linkedin_url!, "_blank", "noopener")}>
            <Linkedin className="w-3.5 h-3.5" />
          </Button>
        )}
        {profile.github_url && (
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.github_url!, "_blank", "noopener")}>
            <Github className="w-3.5 h-3.5" />
          </Button>
        )}
        {profile.portfolio_url && (
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.portfolio_url!, "_blank", "noopener")}>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
        {profile.cv_url && (
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.cv_url!, "_blank", "noopener")}>
            <FileText className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const lookingForOptionsExport = lookingForOptions;

export default StudentMode;
