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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Building2, Plus, MapPin, Globe, Users, Calendar,
  Briefcase, Search, X, Clock, Send, ChevronRight
} from "lucide-react";

interface CompanyPage {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  industry: string | null;
  website: string | null;
  location: string | null;
  size: string | null;
  founded_year: number | null;
  followers_count: number;
}

interface JobListing {
  id: string;
  company_id: string;
  poster_id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  experience_level: string | null;
  salary_range: string | null;
  skills_required: string[];
  is_active: boolean;
  applications_count: number;
  created_at: string;
  company?: CompanyPage;
}

const jobTypes = [
  { value: "full-time", label: "Temps plein" },
  { value: "part-time", label: "Temps partiel" },
  { value: "internship", label: "Stage" },
  { value: "freelance", label: "Freelance" },
  { value: "alternance", label: "Alternance" },
];

const experienceLevels = [
  { value: "entry", label: "Débutant" },
  { value: "mid", label: "Intermédiaire" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Manager" },
];

const industries = [
  "Technologie", "Finance", "Santé", "Éducation", "Commerce", "Marketing",
  "Design", "Média", "Immobilier", "Transport", "Alimentation", "Autre"
];

const BusinessMode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyPage[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("jobs");

  // Company form
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companySize, setCompanySize] = useState("");

  // Job form
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [jobExperience, setJobExperience] = useState("entry");
  const [jobSalary, setJobSalary] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [myCompanies, setMyCompanies] = useState<CompanyPage[]>([]);

  // Apply dialog
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [companiesRes, jobsRes] = await Promise.all([
      supabase.from("company_pages").select("*").order("created_at", { ascending: false }),
      supabase.from("job_listings").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);

    if (companiesRes.data) {
      setCompanies(companiesRes.data);
      if (user) setMyCompanies(companiesRes.data.filter(c => c.owner_id === user.id));
    }
    if (jobsRes.data && companiesRes.data) {
      const companyMap = new Map(companiesRes.data.map(c => [c.id, c]));
      setJobs(jobsRes.data.map(j => ({
        ...j,
        skills_required: j.skills_required || [],
        company: companyMap.get(j.company_id),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateCompany = async () => {
    if (!user || !companyName.trim()) return;
    const { error } = await supabase.from("company_pages").insert({
      owner_id: user.id,
      name: companyName.trim(),
      description: companyDesc.trim() || null,
      industry: companyIndustry || null,
      website: companyWebsite.trim() || null,
      location: companyLocation.trim() || null,
      size: companySize || null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page entreprise créée !" });
      setCreateCompanyOpen(false);
      setCompanyName(""); setCompanyDesc(""); setCompanyIndustry(""); setCompanyWebsite(""); setCompanyLocation(""); setCompanySize("");
      fetchData();
    }
  };

  const handleCreateJob = async () => {
    if (!user || !jobTitle.trim() || !jobDesc.trim() || !selectedCompanyId) return;
    const { error } = await supabase.from("job_listings").insert({
      company_id: selectedCompanyId,
      poster_id: user.id,
      title: jobTitle.trim(),
      description: jobDesc.trim(),
      location: jobLocation.trim() || null,
      job_type: jobType,
      experience_level: jobExperience,
      salary_range: jobSalary.trim() || null,
      skills_required: jobSkills.split(",").map(s => s.trim()).filter(Boolean),
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Offre publiée !" });
      setCreateJobOpen(false);
      setJobTitle(""); setJobDesc(""); setJobLocation(""); setJobSalary(""); setJobSkills(""); setSelectedCompanyId("");
      fetchData();
    }
  };

  const handleApply = async () => {
    if (!user || !applyJobId) return;
    const { error } = await supabase.from("job_applications").insert({
      job_id: applyJobId,
      applicant_id: user.id,
      cover_letter: coverLetter.trim() || null,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Déjà postulé", description: "Vous avez déjà postulé à cette offre", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Candidature envoyée !" });
    }
    setApplyJobId(null);
    setCoverLetter("");
  };

  const filteredJobs = jobs.filter(j => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) ||
      j.company?.name.toLowerCase().includes(q) || j.skills_required?.some(s => s.toLowerCase().includes(q));
  });

  const filteredCompanies = companies.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q);
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
            <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold truncate">Mode Entreprise</h1>
          </div>
          <div className="flex gap-1">
            <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 text-xs"><Building2 className="w-3 h-3" /> Entreprise</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Créer une page entreprise</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Nom de l'entreprise *" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  <Textarea placeholder="Description..." value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} rows={3} />
                  <Select value={companyIndustry} onValueChange={setCompanyIndustry}>
                    <SelectTrigger><SelectValue placeholder="Secteur d'activité" /></SelectTrigger>
                    <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Site web" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} />
                  <Input placeholder="Localisation" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} />
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger><SelectValue placeholder="Taille de l'entreprise" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employés</SelectItem>
                      <SelectItem value="11-50">11-50 employés</SelectItem>
                      <SelectItem value="51-200">51-200 employés</SelectItem>
                      <SelectItem value="201-500">201-500 employés</SelectItem>
                      <SelectItem value="500+">500+ employés</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateCompany} disabled={!companyName.trim()} className="w-full">Créer</Button>
                </div>
              </DialogContent>
            </Dialog>

            {myCompanies.length > 0 && (
              <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1 text-xs"><Briefcase className="w-3 h-3" /> Offre</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Publier une offre d'emploi</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner une entreprise *" /></SelectTrigger>
                      <SelectContent>{myCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Titre du poste *" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                    <Textarea placeholder="Description du poste *" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4} />
                    <Input placeholder="Localisation" value={jobLocation} onChange={e => setJobLocation(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={jobType} onValueChange={setJobType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{jobTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={jobExperience} onValueChange={setJobExperience}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{experienceLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
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

        {/* Search */}
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
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : filteredJobs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune offre disponible</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map(job => (
                  <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 rounded-lg">
                          <AvatarImage src={job.company?.logo_url || ""} />
                          <AvatarFallback className="rounded-lg text-xs bg-primary/10">{job.company?.name?.[0] || "E"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{job.title}</h3>
                          <p className="text-xs text-muted-foreground">{job.company?.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {job.location && (
                              <Badge variant="outline" className="text-[10px] gap-0.5"><MapPin className="w-2.5 h-2.5" />{job.location}</Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {jobTypes.find(t => t.value === job.job_type)?.label || job.job_type}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {experienceLevels.find(l => l.value === job.experience_level)?.label || job.experience_level}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>

                      {job.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills_required.slice(0, 4).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-primary/5">{s}</Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(job.created_at).toLocaleDateString("fr-FR")}
                          {job.salary_range && <span className="font-medium text-foreground">• {job.salary_range}</span>}
                        </div>
                        <Button size="sm" className="gap-1 text-xs" onClick={() => setApplyJobId(job.id)}>
                          <Send className="w-3 h-3" /> Postuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="companies">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : filteredCompanies.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune entreprise</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCompanies.map(company => (
                  <Card key={company.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 rounded-lg">
                          <AvatarImage src={company.logo_url || ""} />
                          <AvatarFallback className="rounded-lg bg-primary/10 font-bold">{company.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{company.name}</h3>
                          {company.industry && <Badge variant="secondary" className="text-[10px] mt-0.5">{company.industry}</Badge>}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            {company.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{company.location}</span>}
                            {company.size && <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{company.size}</span>}
                            {company.website && (
                              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary">
                                <Globe className="w-2.5 h-2.5" /> Site
                              </a>
                            )}
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

        {/* Apply Dialog */}
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
      <BottomNav />
    </div>
  );
};

export default BusinessMode;
