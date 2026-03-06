import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DesktopLayout } from "@/components/DesktopLayout";
import { GraduationCap, Building2 } from "lucide-react";
import StudentMode from "./StudentMode";
import BusinessMode from "./BusinessMode";

const Emploi = () => {
  const [activeTab, setActiveTab] = useState("student");

  return (
    <DesktopLayout showRightSidebar={false} showTopBar={false}>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold mb-3">Emploi</h1>
        <div className="flex">
          <button
            className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === "student" ? "border-primary-foreground text-primary-foreground" : "border-transparent text-primary-foreground/60"}`}
            onClick={() => setActiveTab("student")}
          >
            <GraduationCap className="w-4 h-4" /> Étudiant
          </button>
          <button
            className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === "business" ? "border-primary-foreground text-primary-foreground" : "border-transparent text-primary-foreground/60"}`}
            onClick={() => setActiveTab("business")}
          >
            <Building2 className="w-4 h-4" /> Entreprise
          </button>
        </div>
      </div>

      {activeTab === "student" && <StudentModeContent />}
      {activeTab === "business" && <BusinessModeContent />}
    </DesktopLayout>
  );
};

// Inline wrappers that render the content without their own layout wrappers
// We import them as full pages but we need their content only
// For now, let's embed them directly
import { useNavigate } from "react-router-dom";
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
import { useEffect } from "react";
import {
  Plus, MapPin, BookOpen, Calendar, ExternalLink, Github, Linkedin, FileText, 
  Search, X, Briefcase, Star, Globe, Users, Clock, Send, ChevronRight
} from "lucide-react";

// ========== STUDENT MODE CONTENT ==========
interface StudentProfile {
  id: string; user_id: string; university: string | null; field_of_study: string | null;
  graduation_year: number | null; bio: string | null; skills: string[]; cv_url: string | null;
  portfolio_url: string | null; linkedin_url: string | null; github_url: string | null;
  gpa: string | null; looking_for: string | null;
  userProfile?: { display_name: string | null; username: string | null; avatar_url: string | null; is_verified: boolean | null; };
}

const lookingForOptions = [
  { value: "stage", label: "Stage" }, { value: "alternance", label: "Alternance" },
  { value: "cdi", label: "CDI" }, { value: "freelance", label: "Freelance" }, { value: "projet", label: "Projet collaboratif" },
];

const StudentModeContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    const { data, error } = await supabase.from("student_profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: userProfiles } = await supabase.from("profiles_public").select("id, display_name, username, avatar_url, is_verified").in("id", userIds);
      const profileMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
      const enriched = data.map(s => ({ ...s, skills: s.skills || [], userProfile: profileMap.get(s.user_id) }));
      setProfiles(enriched);
      if (user) setMyProfile(enriched.find(s => s.user_id === user.id) || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [user]);

  const handleCreate = async () => {
    if (!user || !university.trim()) return;
    const { error } = await supabase.from("student_profiles").insert({
      user_id: user.id, university: university.trim(), field_of_study: fieldOfStudy.trim() || null,
      graduation_year: graduationYear ? parseInt(graduationYear) : null, bio: bio.trim() || null,
      skills: skills.split(",").map(s => s.trim()).filter(Boolean), portfolio_url: portfolioUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null, github_url: githubUrl.trim() || null,
      gpa: gpa.trim() || null, looking_for: lookingFor,
    });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Profil étudiant créé !" }); setCreateOpen(false); fetchProfiles(); }
  };

  const filtered = profiles.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.university?.toLowerCase().includes(q) || p.field_of_study?.toLowerCase().includes(q) || p.skills?.some(s => s.toLowerCase().includes(q)) || p.userProfile?.display_name?.toLowerCase().includes(q);
  });

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Profils étudiants</h2></div>
        {!myProfile && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Mon profil</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Créer mon profil étudiant</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Université / École *" value={university} onChange={e => setUniversity(e.target.value)} />
                <Input placeholder="Domaine d'études" value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)} />
                <Input placeholder="Année de diplôme (ex: 2026)" type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} />
                <Textarea placeholder="Bio courte..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
                <Input placeholder="Compétences (séparées par des virgules)" value={skills} onChange={e => setSkills(e.target.value)} />
                <Input placeholder="GPA / Moyenne" value={gpa} onChange={e => setGpa(e.target.value)} />
                <Select value={lookingFor} onValueChange={setLookingFor}><SelectTrigger><SelectValue placeholder="Je cherche..." /></SelectTrigger><SelectContent>{lookingForOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                <Input placeholder="URL Portfolio" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                <Input placeholder="URL LinkedIn" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                <Input placeholder="URL GitHub" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
                <Button onClick={handleCreate} disabled={!university.trim()} className="w-full">Créer mon profil</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par université, compétence..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-8" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
      </div>
      {myProfile && (
        <Card className="mb-4 border-primary/30 bg-primary/5"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-primary">Mon profil étudiant</span></div><StudentCard profile={myProfile} navigate={navigate} /></CardContent></Card>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center"><GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Aucun profil étudiant trouvé</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{filtered.filter(p => p.user_id !== user?.id).map(profile => <StudentCard key={profile.id} profile={profile} navigate={navigate} />)}</div>
      )}
    </main>
  );
};

const StudentCard = ({ profile, navigate }: { profile: StudentProfile; navigate: (path: string) => void }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 cursor-pointer" onClick={() => navigate(`/profile/${profile.user_id}`)}><AvatarImage src={profile.userProfile?.avatar_url || ""} /><AvatarFallback>{profile.userProfile?.display_name?.[0] || "E"}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5"><p className="font-semibold text-sm truncate">{profile.userProfile?.display_name || "Étudiant"}</p>{profile.userProfile?.is_verified && <Badge variant="secondary" className="text-[10px] px-1">✓</Badge>}</div>
          {profile.university && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3" /> {profile.university}</p>}
          {profile.field_of_study && <p className="text-xs text-muted-foreground mt-0.5">{profile.field_of_study}</p>}
        </div>
        {profile.looking_for && <Badge variant="outline" className="text-[10px] flex-shrink-0"><Briefcase className="w-3 h-3 mr-1" />{lookingForOptions.find(o => o.value === profile.looking_for)?.label || profile.looking_for}</Badge>}
      </div>
      {profile.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}
      {profile.skills && profile.skills.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{profile.skills.slice(0, 5).map((skill, i) => <Badge key={i} variant="secondary" className="text-[10px]">{skill}</Badge>)}{profile.skills.length > 5 && <Badge variant="secondary" className="text-[10px]">+{profile.skills.length - 5}</Badge>}</div>}
      <div className="flex items-center gap-2 mt-3">
        {profile.graduation_year && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {profile.graduation_year}</span>}
        {profile.gpa && <span className="text-[10px] text-muted-foreground">GPA: {profile.gpa}</span>}
        <div className="flex-1" />
        {profile.linkedin_url && <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.linkedin_url!, "_blank", "noopener")}><Linkedin className="w-3.5 h-3.5" /></Button>}
        {profile.github_url && <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.github_url!, "_blank", "noopener")}><Github className="w-3.5 h-3.5" /></Button>}
        {profile.portfolio_url && <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.portfolio_url!, "_blank", "noopener")}><ExternalLink className="w-3.5 h-3.5" /></Button>}
        {profile.cv_url && <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => window.open(profile.cv_url!, "_blank", "noopener")}><FileText className="w-3.5 h-3.5" /></Button>}
      </div>
    </CardContent>
  </Card>
);

// ========== BUSINESS MODE CONTENT ==========
interface CompanyPage { id: string; owner_id: string; name: string; logo_url: string | null; cover_url: string | null; description: string | null; industry: string | null; website: string | null; location: string | null; size: string | null; founded_year: number | null; followers_count: number; }
interface JobListing { id: string; company_id: string; poster_id: string; title: string; description: string; location: string | null; job_type: string; experience_level: string | null; salary_range: string | null; skills_required: string[]; is_active: boolean; applications_count: number; created_at: string; company?: CompanyPage; }

const jobTypes = [{ value: "full-time", label: "Temps plein" }, { value: "part-time", label: "Temps partiel" }, { value: "internship", label: "Stage" }, { value: "freelance", label: "Freelance" }, { value: "alternance", label: "Alternance" }];
const experienceLevels = [{ value: "entry", label: "Débutant" }, { value: "mid", label: "Intermédiaire" }, { value: "senior", label: "Senior" }, { value: "lead", label: "Lead / Manager" }];
const industries = ["Technologie", "Finance", "Santé", "Éducation", "Commerce", "Marketing", "Design", "Média", "Immobilier", "Transport", "Alimentation", "Autre"];

const BusinessModeContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyPage[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("jobs");
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState(""); const [companyDesc, setCompanyDesc] = useState(""); const [companyIndustry, setCompanyIndustry] = useState(""); const [companyWebsite, setCompanyWebsite] = useState(""); const [companyLocation, setCompanyLocation] = useState(""); const [companySize, setCompanySize] = useState("");
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState(""); const [jobDesc, setJobDesc] = useState(""); const [jobLocation, setJobLocation] = useState(""); const [jobType, setJobType] = useState("full-time"); const [jobExperience, setJobExperience] = useState("entry"); const [jobSalary, setJobSalary] = useState(""); const [jobSkills, setJobSkills] = useState(""); const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [myCompanies, setMyCompanies] = useState<CompanyPage[]>([]);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [companiesRes, jobsRes] = await Promise.all([
      supabase.from("company_pages").select("*").order("created_at", { ascending: false }),
      supabase.from("job_listings").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    if (companiesRes.data) { setCompanies(companiesRes.data); if (user) setMyCompanies(companiesRes.data.filter(c => c.owner_id === user.id)); }
    if (jobsRes.data && companiesRes.data) {
      const companyMap = new Map(companiesRes.data.map(c => [c.id, c]));
      setJobs(jobsRes.data.map(j => ({ ...j, skills_required: j.skills_required || [], company: companyMap.get(j.company_id) })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateCompany = async () => {
    if (!user || !companyName.trim()) return;
    const { error } = await supabase.from("company_pages").insert({ owner_id: user.id, name: companyName.trim(), description: companyDesc.trim() || null, industry: companyIndustry || null, website: companyWebsite.trim() || null, location: companyLocation.trim() || null, size: companySize || null });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Page entreprise créée !" }); setCreateCompanyOpen(false); setCompanyName(""); setCompanyDesc(""); setCompanyIndustry(""); setCompanyWebsite(""); setCompanyLocation(""); setCompanySize(""); fetchData(); }
  };

  const handleCreateJob = async () => {
    if (!user || !jobTitle.trim() || !jobDesc.trim() || !selectedCompanyId) return;
    const { error } = await supabase.from("job_listings").insert({ company_id: selectedCompanyId, poster_id: user.id, title: jobTitle.trim(), description: jobDesc.trim(), location: jobLocation.trim() || null, job_type: jobType, experience_level: jobExperience, salary_range: jobSalary.trim() || null, skills_required: jobSkills.split(",").map(s => s.trim()).filter(Boolean) });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Offre publiée !" }); setCreateJobOpen(false); setJobTitle(""); setJobDesc(""); setJobLocation(""); setJobSalary(""); setJobSkills(""); setSelectedCompanyId(""); fetchData(); }
  };

  const handleApply = async () => {
    if (!user || !applyJobId) return;
    const { error } = await supabase.from("job_applications").insert({ job_id: applyJobId, applicant_id: user.id, cover_letter: coverLetter.trim() || null });
    if (error) { if (error.code === "23505") toast({ title: "Déjà postulé", description: "Vous avez déjà postulé à cette offre", variant: "destructive" }); else toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else toast({ title: "Candidature envoyée !" });
    setApplyJobId(null); setCoverLetter("");
  };

  const filteredJobs = jobs.filter(j => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || j.company?.name.toLowerCase().includes(q) || j.skills_required?.some(s => s.toLowerCase().includes(q)); });
  const filteredCompanies = companies.filter(c => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q); });

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">Entreprises & Emploi</h2></div>
        <div className="flex gap-1">
          <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 text-xs"><Building2 className="w-3 h-3" /> Entreprise</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Créer une page entreprise</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nom de l'entreprise *" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                <Textarea placeholder="Description..." value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} rows={3} />
                <Select value={companyIndustry} onValueChange={setCompanyIndustry}><SelectTrigger><SelectValue placeholder="Secteur d'activité" /></SelectTrigger><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
                <Input placeholder="Site web" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} />
                <Input placeholder="Localisation" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} />
                <Select value={companySize} onValueChange={setCompanySize}><SelectTrigger><SelectValue placeholder="Taille de l'entreprise" /></SelectTrigger><SelectContent><SelectItem value="1-10">1-10 employés</SelectItem><SelectItem value="11-50">11-50 employés</SelectItem><SelectItem value="51-200">51-200 employés</SelectItem><SelectItem value="201-500">201-500 employés</SelectItem><SelectItem value="500+">500+ employés</SelectItem></SelectContent></Select>
                <Button onClick={handleCreateCompany} disabled={!companyName.trim()} className="w-full">Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
          {myCompanies.length > 0 && (
            <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-1 text-xs"><Briefcase className="w-3 h-3" /> Offre</Button></DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Publier une offre d'emploi</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}><SelectTrigger><SelectValue placeholder="Sélectionner une entreprise *" /></SelectTrigger><SelectContent>{myCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                  <Input placeholder="Titre du poste *" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                  <Textarea placeholder="Description du poste *" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4} />
                  <Input placeholder="Localisation" value={jobLocation} onChange={e => setJobLocation(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={jobType} onValueChange={setJobType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{jobTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
                    <Select value={jobExperience} onValueChange={setJobExperience}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{experienceLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Input placeholder="Fourchette salariale (optionnel)" value={jobSalary} onChange={e => setJobSalary(e.target.value)} />
                  <Input placeholder="Compétences requises (virgules)" value={jobSkills} onChange={e => setJobSkills(e.target.value)} />
                  <Button onClick={handleCreateJob} disabled={!jobTitle.trim() || !jobDesc.trim() || !selectedCompanyId} className="w-full">Publier l'offre</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher offres, entreprises..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-8" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="jobs" className="flex-1 gap-1"><Briefcase className="w-3.5 h-3.5" /> Offres ({filteredJobs.length})</TabsTrigger>
          <TabsTrigger value="companies" className="flex-1 gap-1"><Building2 className="w-3.5 h-3.5" /> Entreprises ({filteredCompanies.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filteredJobs.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center"><Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Aucune offre disponible</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 rounded-lg"><AvatarImage src={job.company?.logo_url || ""} /><AvatarFallback className="rounded-lg text-xs bg-primary/10">{job.company?.name?.[0] || "E"}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{job.title}</h3>
                        <p className="text-xs text-muted-foreground">{job.company?.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {job.location && <Badge variant="outline" className="text-[10px] gap-0.5"><MapPin className="w-2.5 h-2.5" />{job.location}</Badge>}
                          <Badge variant="secondary" className="text-[10px]">{jobTypes.find(t => t.value === job.job_type)?.label || job.job_type}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{experienceLevels.find(l => l.value === job.experience_level)?.label || job.experience_level}</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                    {job.skills_required.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{job.skills_required.slice(0, 4).map((s, i) => <Badge key={i} variant="outline" className="text-[10px] bg-primary/5">{s}</Badge>)}</div>}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />{new Date(job.created_at).toLocaleDateString("fr-FR")}{job.salary_range && <span className="font-medium text-foreground">• {job.salary_range}</span>}</div>
                      <Button size="sm" className="gap-1 text-xs" onClick={() => setApplyJobId(job.id)}><Send className="w-3 h-3" /> Postuler</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="companies">
          {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filteredCompanies.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center"><Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Aucune entreprise</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredCompanies.map(company => (
                <Card key={company.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 rounded-lg"><AvatarImage src={company.logo_url || ""} /><AvatarFallback className="rounded-lg bg-primary/10 font-bold">{company.name[0]}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{company.name}</h3>
                        {company.industry && <Badge variant="secondary" className="text-[10px] mt-0.5">{company.industry}</Badge>}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          {company.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{company.location}</span>}
                          {company.size && <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{company.size}</span>}
                          {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary"><Globe className="w-2.5 h-2.5" /> Site</a>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {company.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{company.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!applyJobId} onOpenChange={(open) => { if (!open) setApplyJobId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Postuler à cette offre</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea placeholder="Lettre de motivation (optionnel)" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={5} />
            <Button onClick={handleApply} className="w-full gap-1"><Send className="w-4 h-4" /> Envoyer ma candidature</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Emploi;
