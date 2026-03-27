import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PersonForm } from "@/components/PersonForm";
import { IDCardDialog } from "@/components/IDCardDialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, HardHat, Eye, CreditCard, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

const fields = [
  { name: "worker_id", label: "Worker ID" },
  { name: "full_name", label: "Full Name", required: true },
  { name: "phone", label: "Contact Number" },
  { name: "email", label: "Email Address", type: "email" },
  { name: "date_of_birth", label: "Date of Birth", type: "date" },
  { name: "gender", label: "Gender" },
  { name: "address", label: "Address" },
  { name: "job_role", label: "Position / Job Role" },
  { name: "skill_type", label: "Skill Type" },
  { name: "assignment_area", label: "Assignment Area" },
  { name: "date_started", label: "Date Hired", type: "date" },
  { name: "until_date", label: "Until When", type: "date" },
  { name: "status", label: "Status" },
  { name: "nbi_number", label: "NBI Clearance No." },
  { name: "philhealth_number", label: "PhilHealth No." },
  { name: "sss_number", label: "SSS No." },
  { name: "pagibig_number", label: "Pag-IBIG MID No." },
  { name: "tin_number", label: "TIN No." },
  { name: "emergency_contact_name", label: "In Case of Emergency - Contact Name" },
  { name: "emergency_contact_phone", label: "In Case of Emergency - Contact Number" },
];

export default function Workers() {
  const [workers, setWorkers] = useState<Tables<"workers">[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Tables<"workers"> | null>(null);
  const [viewData, setViewData] = useState<Tables<"workers"> | null>(null);
  const [idCardData, setIdCardData] = useState<Tables<"workers"> | null>(null);

  const fetchWorkers = async () => {
    const { data } = await supabase.from("workers").select("*").order("full_name", { ascending: true });
    if (data) setWorkers(data);
  };

  useEffect(() => {
    fetchWorkers();
    const channel = supabase.channel("workers-realtime").on("postgres_changes", { event: "*", schema: "public", table: "workers" }, fetchWorkers).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Worker deleted" });
  };

  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    return w.full_name.toLowerCase().includes(q) ||
      (w.job_role?.toLowerCase().includes(q)) ||
      (w.assignment_area?.toLowerCase().includes(q)) ||
      (w.worker_id?.toLowerCase().includes(q)) ||
      (w.email?.toLowerCase().includes(q)) ||
      (w.phone?.toLowerCase().includes(q));
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, yyyy") : "—";
  const activeCount = filtered.filter(w => w.status === "Active").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-card-2 flex items-center justify-center"><HardHat className="w-4 h-4 text-white" /></div>
            Workers
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{workers.length} total • {activeCount} active • Sorted A-Z</p>
        </motion.div>
        <Button className="gradient-primary text-white hover:opacity-90 rounded-xl h-10 shadow-md glow-sm-primary" onClick={() => { setEditData(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Worker
        </Button>
      </div>

      <Card className="border border-border/60 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 bg-muted/30 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, ID, job role, email, phone..." className="pl-11 border-0 bg-card rounded-xl h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-border/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Worker ID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-primary" /></TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Contact</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Job Role</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date Hired</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Until Date</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((wrk, i) => (
                <motion.tr key={wrk.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="font-mono text-xs text-primary font-semibold">{wrk.worker_id || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                        {wrk.photo_url ? <img src={wrk.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{wrk.full_name.charAt(0)}</div>}
                      </div>
                      <span className="font-medium text-sm">{wrk.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{wrk.phone || "—"}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">{wrk.job_role || "—"}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">{fmtDate(wrk.date_started)}</TableCell>
                  <TableCell className="text-sm hidden xl:table-cell text-muted-foreground">{fmtDate(wrk.until_date)}</TableCell>
                  <TableCell>
                    <Badge variant={wrk.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold rounded-full px-3 ${wrk.status === "Active" ? "bg-success/15 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>{wrk.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setViewData(wrk)}><Eye className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary" onClick={() => setIdCardData(wrk)}><CreditCard className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => { setEditData(wrk); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(wrk.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No workers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">{editData ? "Edit Worker" : "Add New Worker"}</DialogTitle></DialogHeader>
          <PersonForm fields={fields} tableName="workers" photoBucket="worker-photos" editData={editData} onSuccess={() => { setDialogOpen(false); fetchWorkers(); }} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Worker Details</DialogTitle></DialogHeader>
          {viewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                  {viewData.photo_url ? <img src={viewData.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">{viewData.full_name.charAt(0)}</div>}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewData.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{viewData.job_role || "No role"} • {viewData.assignment_area || "Unassigned"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-xl p-4">
                {[["Worker ID", viewData.worker_id], ["Email", viewData.email], ["Phone", viewData.phone], ["Gender", viewData.gender],
                  ["Date of Birth", fmtDate(viewData.date_of_birth)], ["Date Hired", fmtDate(viewData.date_started)], ["Until Date", fmtDate(viewData.until_date)],
                  ["Skill Type", viewData.skill_type], ["Status", viewData.status], ["Address", viewData.address],
                  ["Emergency Contact", viewData.emergency_contact_name], ["Emergency Phone", viewData.emergency_contact_phone],
                ].map(([label, val]) => (
                  <div key={label as string}><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p><p className="font-semibold mt-0.5">{(val as string) || "—"}</p></div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <IDCardDialog open={!!idCardData} onOpenChange={() => setIdCardData(null)} person={idCardData} type="worker" />
    </div>
  );
}
