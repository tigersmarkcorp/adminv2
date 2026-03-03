import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PersonForm } from "@/components/PersonForm";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, GraduationCap, Eye, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface OJTRecord {
  id: string; ojt_id: string | null; full_name: string; email: string | null; phone: string | null;
  date_of_birth: string | null; gender: string | null; address: string | null; school: string | null;
  course: string | null; date_started: string | null; until_date: string | null; status: string;
  emergency_contact_name: string | null; emergency_contact_phone: string | null; photo_url: string | null;
  created_at: string; updated_at: string;
}

const fields = [
  { name: "ojt_id", label: "OJT ID" },
  { name: "full_name", label: "Full Name", required: true },
  { name: "phone", label: "Contact Number" },
  { name: "email", label: "Email Address", type: "email" },
  { name: "date_of_birth", label: "Date of Birth", type: "date" },
  { name: "gender", label: "Gender" },
  { name: "address", label: "Address" },
  { name: "school", label: "School" },
  { name: "course", label: "Course" },
  { name: "date_started", label: "Date Started", type: "date" },
  { name: "until_date", label: "Until When", type: "date" },
  { name: "status", label: "Status" },
  { name: "emergency_contact_name", label: "In Case of Emergency - Contact Name" },
  { name: "emergency_contact_phone", label: "In Case of Emergency - Contact Number" },
];

export default function OJT() {
  const [ojts, setOjts] = useState<OJTRecord[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<OJTRecord | null>(null);
  const [viewData, setViewData] = useState<OJTRecord | null>(null);

  const fetchOjts = async () => {
    const { data } = await supabase.from("ojts" as any).select("*").order("full_name", { ascending: true });
    if (data) setOjts(data as any);
  };

  useEffect(() => {
    fetchOjts();
    const channel = supabase.channel("ojts-realtime").on("postgres_changes", { event: "*", schema: "public", table: "ojts" }, fetchOjts).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OJT?")) return;
    const { error } = await supabase.from("ojts" as any).delete().eq("id", id);
    if (error) toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    else toast({ title: "OJT deleted" });
  };

  const filtered = ojts.filter((o) => {
    const q = search.toLowerCase();
    return o.full_name.toLowerCase().includes(q) ||
      (o.school?.toLowerCase().includes(q)) ||
      (o.course?.toLowerCase().includes(q)) ||
      (o.ojt_id?.toLowerCase().includes(q)) ||
      (o.email?.toLowerCase().includes(q)) ||
      (o.phone?.toLowerCase().includes(q));
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, yyyy") : "—";
  const activeCount = filtered.filter(o => o.status === "Active").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-card-3 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-white" /></div>
            OJT / Interns
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{ojts.length} total • {activeCount} active • Sorted A-Z</p>
        </motion.div>
        <Button className="gradient-primary text-white hover:opacity-90 rounded-xl h-10 shadow-md glow-sm-primary" onClick={() => { setEditData(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add OJT
        </Button>
      </div>

      <Card className="border border-border/60 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 bg-muted/30 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, ID, school, course, email, phone..." className="pl-11 border-0 bg-card rounded-xl h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-border/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">OJT ID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-primary" /></TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Contact</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">School</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date Started</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Until Date</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ojt, i) => (
                <motion.tr key={ojt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="font-mono text-xs text-primary font-semibold">{ojt.ojt_id || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                        {ojt.photo_url ? <img src={ojt.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{ojt.full_name.charAt(0)}</div>}
                      </div>
                      <span className="font-medium text-sm">{ojt.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{ojt.phone || "—"}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">{ojt.school || "—"}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">{fmtDate(ojt.date_started)}</TableCell>
                  <TableCell className="text-sm hidden xl:table-cell text-muted-foreground">{fmtDate(ojt.until_date)}</TableCell>
                  <TableCell>
                    <Badge variant={ojt.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold rounded-full px-3 ${ojt.status === "Active" ? "bg-success/15 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>{ojt.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setViewData(ojt)}><Eye className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => { setEditData(ojt); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(ojt.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No OJT records found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">{editData ? "Edit OJT" : "Add New OJT"}</DialogTitle></DialogHeader>
          <PersonForm fields={fields} tableName="ojts" photoBucket="ojt-photos" editData={editData} onSuccess={() => setDialogOpen(false)} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">OJT Details</DialogTitle></DialogHeader>
          {viewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                  {viewData.photo_url ? <img src={viewData.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">{viewData.full_name.charAt(0)}</div>}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewData.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{viewData.school || "No school"} • {viewData.course || "No course"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-xl p-4">
                {[["OJT ID", viewData.ojt_id], ["Email", viewData.email], ["Phone", viewData.phone], ["Gender", viewData.gender],
                  ["Date of Birth", fmtDate(viewData.date_of_birth)], ["Date Started", fmtDate(viewData.date_started)], ["Until Date", fmtDate(viewData.until_date)],
                  ["Status", viewData.status], ["Address", viewData.address],
                  ["Emergency Contact", viewData.emergency_contact_name], ["Emergency Phone", viewData.emergency_contact_phone],
                ].map(([label, val]) => (
                  <div key={label as string}><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p><p className="font-semibold mt-0.5">{(val as string) || "—"}</p></div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
