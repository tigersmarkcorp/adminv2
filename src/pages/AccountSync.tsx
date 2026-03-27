import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Search, Users, GraduationCap, Link2, Unlink, CheckCircle2, XCircle, Eye, Mail, Phone, MapPin, Calendar, Briefcase, Shield, Building2, UserCircle, LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface FullPersonRecord {
  id: string;
  full_name: string;
  email: string | null;
  auth_user_id: string | null;
  status: string;
  photo_url: string | null;
  phone: string | null;
  gender: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  // employee fields
  employee_id?: string | null;
  position?: string | null;
  department?: string | null;
  date_hired?: string | null;
  schedule_type?: string | null;
  until_date?: string | null;
  // ojt fields
  ojt_id?: string | null;
  school?: string | null;
  course?: string | null;
  date_started?: string | null;
}

export default function AccountSync() {
  const [employees, setEmployees] = useState<FullPersonRecord[]>([]);
  const [ojts, setOjts] = useState<FullPersonRecord[]>([]);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [viewPerson, setViewPerson] = useState<FullPersonRecord | null>(null);
  const [viewType, setViewType] = useState<"employees" | "ojts">("employees");
  const [govIds, setGovIds] = useState<any>(null);
  
  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkPerson, setLinkPerson] = useState<FullPersonRecord | null>(null);
  const [linkType, setLinkType] = useState<"employees" | "ojts">("employees");
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);

  const fetchAll = async () => {
    const [empRes, ojtRes] = await Promise.all([
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("ojts").select("*").order("full_name"),
    ]);
    setEmployees(empRes.data || []);
    setOjts(ojtRes.data || []);
  };

  useEffect(() => {
    fetchAll();
    const ch1 = supabase.channel("sync-emp-rt").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, fetchAll).subscribe();
    const ch2 = supabase.channel("sync-ojt-rt").on("postgres_changes", { event: "*", schema: "public", table: "ojts" }, fetchAll).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const unlinkAccount = async (table: "employees" | "ojts", id: string, authUserId: string) => {
    if (!confirm("Unlink this account? The user will need to re-verify their email to log in again.")) return;
    setSyncing(id);
    await supabase.from(table).update({ auth_user_id: null } as any).eq("id", id);
    const role = table === "employees" ? "employee" : "ojt";
    await (supabase as any).from("user_roles").delete().eq("user_id", authUserId).eq("role", role);
    toast({ title: "Account unlinked" });
    setSyncing(null);
    fetchAll();
  };

  const openLinkDialog = (person: FullPersonRecord, type: "employees" | "ojts") => {
    setLinkPerson(person);
    setLinkType(type);
    setLinkEmail(person.email || "");
    setLinkDialogOpen(true);
  };

  const handleLinkAccount = async () => {
    if (!linkPerson || !linkEmail.trim()) {
      toast({ title: "Please enter an email address", variant: "destructive" });
      return;
    }
    
    setLinking(true);
    try {
      // Call the portal-auth edge function to link the account
      const { data, error } = await supabase.functions.invoke("portal-auth", {
        body: {
          action: "link",
          email: linkEmail.trim().toLowerCase(),
          personId: linkPerson.id,
          personType: linkType,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Account linked successfully!", description: `${linkPerson.full_name} is now linked to ${linkEmail}` });
      setLinkDialogOpen(false);
      setLinkEmail("");
      setLinkPerson(null);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed to link account", description: err.message, variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const openDetails = async (person: FullPersonRecord, type: "employees" | "ojts") => {
    setViewPerson(person);
    setViewType(type);
    setGovIds(null);
    if (type === "employees") {
      const { data } = await supabase.from("employee_government_ids").select("*").eq("employee_id", person.id).maybeSingle();
      setGovIds(data);
    }
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, yyyy") : "—";

  const renderTable = (data: FullPersonRecord[], type: "employees" | "ojts") => {
    const filtered = data.filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || (p.email?.toLowerCase().includes(q));
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border/60 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
          </div>
          <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{data.filter(p => p.auth_user_id).length}</p>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Linked</p>
          </div>
          <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{data.filter(p => !p.auth_user_id).length}</p>
            <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Not Linked</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 border-b border-border/40">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((person, i) => (
              <motion.tr key={person.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                      {person.photo_url ? <img src={person.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{person.full_name.charAt(0)}</div>}
                    </div>
                    <span className="font-medium text-sm">{person.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{person.email || <span className="italic text-xs">No email</span>}</TableCell>
                <TableCell>
                  {person.auth_user_id ? (
                    <Badge className="text-[10px] font-bold rounded-full px-2.5 gap-1 bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Linked
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] font-bold rounded-full px-2.5 gap-1 bg-amber-500/15 text-amber-600 border border-amber-500/20">
                      <XCircle className="w-3 h-3" /> Not Linked
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={person.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold rounded-full px-2.5 ${person.status === "Active" ? "bg-success/15 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>
                    {person.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs gap-1.5 hover:bg-primary/10 text-primary" onClick={() => openDetails(person, type)}>
                      <Eye className="w-3.5 h-3.5" /> View All
                    </Button>
                    {person.auth_user_id ? (
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs gap-1.5 hover:bg-destructive/10 text-destructive" onClick={() => unlinkAccount(type, person.id, person.auth_user_id!)} disabled={syncing === person.id}>
                        {syncing === person.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                        Unlink
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs gap-1.5 hover:bg-success/10 text-success" onClick={() => openLinkDialog(person, type)}>
                        <LinkIcon className="w-3.5 h-3.5" /> Link
                      </Button>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/20 last:border-0">
      <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-card-2 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          Account Sync
        </h2>
        <p className="text-xs text-muted-foreground mt-1">View and manage linked portal accounts — click "View All" to see synced data in real-time</p>
      </motion.div>

      <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/40 bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-11 border-0 bg-card rounded-xl h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="w-full rounded-none border-b border-border/40 bg-transparent h-12 px-4">
            <TabsTrigger value="employees" className="rounded-xl gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Users className="w-4 h-4" /> Employees
            </TabsTrigger>
            <TabsTrigger value="ojts" className="rounded-xl gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4" /> OJTs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="employees" className="p-4">
            {renderTable(employees, "employees")}
          </TabsContent>
          <TabsContent value="ojts" className="p-4">
            {renderTable(ojts, "ojts")}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Full Data View Dialog */}
      <Dialog open={!!viewPerson} onOpenChange={() => setViewPerson(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              Full Synced Data
            </DialogTitle>
          </DialogHeader>
          {viewPerson && (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/40">
                <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex-shrink-0 border-2 border-primary/20">
                  {viewPerson.photo_url ? <img src={viewPerson.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-primary flex items-center justify-center text-white text-xl font-bold">{viewPerson.full_name.charAt(0)}</div>}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{viewPerson.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] font-bold rounded-full px-2.5 ${viewPerson.auth_user_id ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/15 text-amber-600 border border-amber-500/20"}`}>
                      {viewPerson.auth_user_id ? "✓ Linked" : "✗ Not Linked"}
                    </Badge>
                    <Badge variant={viewPerson.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold rounded-full px-2.5 ${viewPerson.status === "Active" ? "bg-success/15 text-success border border-success/20" : ""}`}>
                      {viewPerson.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> Personal Information</h4>
                <div className="bg-card rounded-xl border border-border/40 px-4">
                  <DetailRow icon={Mail} label="Email" value={viewPerson.email} />
                  <DetailRow icon={Phone} label="Phone" value={viewPerson.phone} />
                  <DetailRow icon={Shield} label="Gender" value={viewPerson.gender} />
                  <DetailRow icon={Calendar} label="Date of Birth" value={fmtDate(viewPerson.date_of_birth)} />
                  <DetailRow icon={MapPin} label="Address" value={viewPerson.address} />
                </div>
              </div>

              {/* Role Info */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {viewType === "employees" ? "Employment" : "OJT"} Details</h4>
                <div className="bg-card rounded-xl border border-border/40 px-4">
                  {viewType === "employees" ? (
                    <>
                      <DetailRow icon={Shield} label="Employee ID" value={viewPerson.employee_id} />
                      <DetailRow icon={Briefcase} label="Position" value={viewPerson.position} />
                      <DetailRow icon={Building2} label="Department" value={viewPerson.department} />
                      <DetailRow icon={Calendar} label="Date Hired" value={fmtDate(viewPerson.date_hired)} />
                      <DetailRow icon={Calendar} label="Until Date" value={fmtDate(viewPerson.until_date)} />
                      <DetailRow icon={Shield} label="Schedule Type" value={viewPerson.schedule_type} />
                    </>
                  ) : (
                    <>
                      <DetailRow icon={Shield} label="OJT ID" value={viewPerson.ojt_id} />
                      <DetailRow icon={Building2} label="School" value={viewPerson.school} />
                      <DetailRow icon={Briefcase} label="Course" value={viewPerson.course} />
                      <DetailRow icon={Calendar} label="Date Started" value={fmtDate(viewPerson.date_started)} />
                      <DetailRow icon={Calendar} label="Until Date" value={fmtDate(viewPerson.until_date)} />
                    </>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Emergency Contact</h4>
                <div className="bg-card rounded-xl border border-border/40 px-4">
                  <DetailRow icon={UserCircle} label="Contact Name" value={viewPerson.emergency_contact_name} />
                  <DetailRow icon={Phone} label="Contact Phone" value={viewPerson.emergency_contact_phone} />
                </div>
              </div>

              {/* Government IDs (employees only) */}
              {viewType === "employees" && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Government IDs</h4>
                  <div className="bg-card rounded-xl border border-border/40 px-4">
                    {govIds ? (
                      <>
                        <DetailRow icon={Shield} label="NBI Number" value={govIds.nbi_number} />
                        <DetailRow icon={Shield} label="PhilHealth Number" value={govIds.philhealth_number} />
                        <DetailRow icon={Shield} label="SSS Number" value={govIds.sss_number} />
                        <DetailRow icon={Shield} label="Pag-IBIG Number" value={govIds.pagibig_number} />
                        <DetailRow icon={Shield} label="TIN Number" value={govIds.tin_number} />
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground py-3 text-center italic">No government IDs on record</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Account Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-success" />
              Link Account
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Link <span className="font-semibold text-foreground">{linkPerson?.full_name}</span> to an existing auth account. The user must have signed up first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="link-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auth Account Email</Label>
              <Input
                id="link-email"
                type="email"
                placeholder="Enter the email of the auth account..."
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground">This will link the {linkType === "employees" ? "employee" : "OJT"} record to the auth account with this email and grant portal access.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleLinkAccount} disabled={linking || !linkEmail.trim()} className="rounded-xl gap-2 bg-success hover:bg-success/90 text-success-foreground">
              {linking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
