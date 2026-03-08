import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Pencil, Trash2, Save, BookOpen, Users, Search, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourses, useCounselorProfiles } from '@/hooks/useCourses';
import { TemplateSettingsTab } from '@/components/admin/TemplateSettingsTab';

interface AdminPageProps {
  onBack: () => void;
}

interface CourseForm {
  code: string;
  name: string;
  hp: string;
  level: string;
  year: string;
  periods: string[];
  is_obligatory: boolean;
  program: string;
  is_multi_period: boolean;
  default_study_pace: string;
}

const emptyCourseForm: CourseForm = {
  code: '', name: '', hp: '7.5', level: 'G1', year: '1',
  periods: [], is_obligatory: true, program: 'D', is_multi_period: false, default_study_pace: '',
};

interface ProfileForm {
  counselor_key: string;
  name: string;
  email: string;
  display_name: string;
  is_admin: boolean;
}

const emptyProfileForm: ProfileForm = {
  counselor_key: '', name: '', email: '', display_name: '', is_admin: false,
};

export const AdminPage = ({ onBack }: AdminPageProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');
  
  // Course state
  const [programFilter, setProgramFilter] = useState<string>('D');
  const [searchQuery, setSearchQuery] = useState('');
  const { courses, loading: coursesLoading, refetch: refetchCourses } = useCourses();
  const [courseDialog, setCourseDialog] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
  
  // Profile state
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useCounselorProfiles();
  const [profileDialog, setProfileDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);

  const filteredCourses = courses.filter(c => {
    const matchesProgram = c.program === programFilter;
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProgram && matchesSearch;
  });

  // Course CRUD
  const openNewCourse = () => {
    setCourseForm({ ...emptyCourseForm, program: programFilter });
    setEditingCourseId(null);
    setCourseDialog(true);
  };

  const openEditCourse = (course: any) => {
    setCourseForm({
      code: course.code,
      name: course.name,
      hp: String(course.hp),
      level: course.level,
      year: String(course.year),
      periods: course.periods || [],
      is_obligatory: course.isObligatory,
      program: course.program,
      is_multi_period: course.isMultiPeriod || false,
      default_study_pace: course.defaultStudyPace ? String(course.defaultStudyPace) : '',
    });
    setEditingCourseId(course.id);
    setCourseDialog(true);
  };

  const saveCourse = async () => {
    const data = {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      hp: parseFloat(courseForm.hp),
      level: courseForm.level,
      year: parseInt(courseForm.year),
      periods: courseForm.periods,
      is_obligatory: courseForm.is_obligatory,
      program: courseForm.program,
      is_multi_period: courseForm.is_multi_period,
      default_study_pace: courseForm.default_study_pace ? parseInt(courseForm.default_study_pace) : null,
    };

    if (!data.code || !data.name || isNaN(data.hp)) {
      toast({ title: 'Fyll i alla obligatoriska fält', variant: 'destructive' });
      return;
    }

    let error;
    if (editingCourseId) {
      ({ error } = await supabase.from('courses').update(data).eq('id', editingCourseId));
    } else {
      ({ error } = await supabase.from('courses').insert(data));
    }

    if (error) {
      toast({ title: 'Fel vid sparning', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingCourseId ? 'Kurs uppdaterad' : 'Kurs tillagd' });
      setCourseDialog(false);
      refetchCourses();
    }
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Kurs borttagen' });
      refetchCourses();
    }
  };

  const togglePeriod = (period: string) => {
    setCourseForm(prev => ({
      ...prev,
      periods: prev.periods.includes(period)
        ? prev.periods.filter(p => p !== period)
        : [...prev.periods, period].sort(),
    }));
  };

  // Profile CRUD
  const openNewProfile = () => {
    setProfileForm(emptyProfileForm);
    setEditingProfileId(null);
    setProfileDialog(true);
  };

  const openEditProfile = (profile: any) => {
    setProfileForm({
      counselor_key: profile.counselor_key,
      name: profile.name,
      email: profile.email,
      display_name: profile.display_name,
      is_admin: profile.is_admin,
    });
    setEditingProfileId(profile.id);
    setProfileDialog(true);
  };

  const saveProfile = async () => {
    const data = {
      counselor_key: profileForm.counselor_key.trim().toLowerCase().replace(/\s+/g, '_'),
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      display_name: profileForm.display_name.trim() || `STVL ${profileForm.name.trim()}`,
      is_admin: profileForm.is_admin,
    };

    if (!data.name || !data.email || !data.counselor_key) {
      toast({ title: 'Fyll i alla fält', variant: 'destructive' });
      return;
    }

    let error;
    if (editingProfileId) {
      ({ error } = await supabase.from('counselor_profiles').update(data).eq('id', editingProfileId));
    } else {
      ({ error } = await supabase.from('counselor_profiles').insert(data));
    }

    if (error) {
      toast({ title: 'Fel vid sparning', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingProfileId ? 'Profil uppdaterad' : 'Profil tillagd' });
      setProfileDialog(false);
      refetchProfiles();
    }
  };

  const deleteProfile = async (id: string) => {
    const { error } = await supabase.from('counselor_profiles').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Profil borttagen' });
      refetchProfiles();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Administration</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Kurser
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            STVL-profiler
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Word-mall
          </TabsTrigger>
        </TabsList>

        {/* COURSES TAB */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Hantera programkurser</CardTitle>
                <Button onClick={openNewCourse} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ny kurs
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-40 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="D">Datateknik (D)</SelectItem>
                    <SelectItem value="C">Infocom (C)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök kurs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <p className="text-muted-foreground text-center py-8">Laddar kurser...</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kod</TableHead>
                        <TableHead>Namn</TableHead>
                        <TableHead>HP</TableHead>
                        <TableHead>Åk</TableHead>
                        <TableHead>LP</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead className="w-24">Åtgärd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-mono text-xs">{course.code}</TableCell>
                          <TableCell className="text-sm">
                            {course.isMultiPeriod && <span className="font-bold text-warning">* </span>}
                            {course.name}
                          </TableCell>
                          <TableCell>{course.hp}</TableCell>
                          <TableCell>{course.year}</TableCell>
                          <TableCell>
                            {course.periods?.map(p => `LP${p}`).join(', ')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.isObligatory ? 'secondary' : 'outline'} className="text-xs">
                              {course.isObligatory ? 'Obl.' : 'Alt.obl'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditCourse(course)} className="h-7 w-7 p-0">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteCourse(course.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFILES TAB */}
        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">STVL-profiler</CardTitle>
                <Button onClick={openNewProfile} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ny profil
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <p className="text-muted-foreground text-center py-8">Laddar profiler...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nyckel</TableHead>
                      <TableHead>Namn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Visningsnamn</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead className="w-24">Åtgärd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-mono text-xs">{profile.counselor_key}</TableCell>
                        <TableCell>{profile.name}</TableCell>
                        <TableCell className="text-sm">{profile.email}</TableCell>
                        <TableCell>{profile.display_name}</TableCell>
                        <TableCell>
                          {profile.is_admin && <Badge variant="default" className="text-xs">Admin</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditProfile(profile)} className="h-7 w-7 p-0">
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteProfile(profile.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCourseId ? 'Redigera kurs' : 'Ny kurs'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Kurskod *</Label>
                <Input value={courseForm.code} onChange={(e) => setCourseForm(f => ({ ...f, code: e.target.value }))} placeholder="EDAA01" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Program *</Label>
                <Select value={courseForm.program} onValueChange={(v) => setCourseForm(f => ({ ...f, program: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="D">Datateknik (D)</SelectItem>
                    <SelectItem value="C">Infocom (C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Kursnamn *</Label>
              <Input value={courseForm.name} onChange={(e) => setCourseForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">HP *</Label>
                <Input type="number" step="0.5" value={courseForm.hp} onChange={(e) => setCourseForm(f => ({ ...f, hp: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Nivå</Label>
                <Select value={courseForm.level} onValueChange={(v) => setCourseForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="G1">G1</SelectItem>
                    <SelectItem value="G2">G2</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Årskurs</Label>
                <Select value={courseForm.year} onValueChange={(v) => setCourseForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Läsperioder</Label>
              <div className="flex gap-2">
                {['1', '2', '3', '4'].map(p => (
                  <Badge
                    key={p}
                    variant={courseForm.periods.includes(p) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => togglePeriod(p)}
                  >
                    LP{p}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="obligatory"
                  checked={courseForm.is_obligatory}
                  onCheckedChange={(v) => setCourseForm(f => ({ ...f, is_obligatory: !!v }))}
                />
                <Label htmlFor="obligatory" className="text-sm">Obligatorisk</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="multi"
                  checked={courseForm.is_multi_period}
                  onCheckedChange={(v) => setCourseForm(f => ({ ...f, is_multi_period: !!v }))}
                />
                <Label htmlFor="multi" className="text-sm">Flerperiodskurs</Label>
              </div>
            </div>
            {courseForm.is_multi_period && (
              <div className="space-y-1">
                <Label className="text-sm">Standardstudietakt (%)</Label>
                <Input type="number" value={courseForm.default_study_pace} onChange={(e) => setCourseForm(f => ({ ...f, default_study_pace: e.target.value }))} placeholder="50" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog(false)}>Avbryt</Button>
            <Button onClick={saveCourse}>
              <Save className="w-4 h-4 mr-1" />
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProfileId ? 'Redigera profil' : 'Ny STVL-profil'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">Nyckel (unik identifierare) *</Label>
              <Input value={profileForm.counselor_key} onChange={(e) => setProfileForm(f => ({ ...f, counselor_key: e.target.value }))} placeholder="fornamn" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Namn *</Label>
              <Input value={profileForm.name} onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Förnamn Efternamn" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">E-post *</Label>
              <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))} placeholder="namn@lth.lu.se" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Visningsnamn</Label>
              <Input value={profileForm.display_name} onChange={(e) => setProfileForm(f => ({ ...f, display_name: e.target.value }))} placeholder="STVL Förnamn Efternamn" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isAdmin"
                checked={profileForm.is_admin}
                onCheckedChange={(v) => setProfileForm(f => ({ ...f, is_admin: !!v }))}
              />
              <Label htmlFor="isAdmin" className="text-sm">Admin-behörighet</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialog(false)}>Avbryt</Button>
            <Button onClick={saveProfile}>
              <Save className="w-4 h-4 mr-1" />
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
