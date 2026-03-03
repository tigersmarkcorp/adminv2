import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Clock, Eye, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function FixedSchedule() {
  const [employees, setEmployees] = useState<Tables<"employees">[]>([]);
  const [search, setSearch] = useState("");
  const [viewData, setViewData] = useState<Tables<"employees"> | null>(null);

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees").select("*").order("full_name", { ascending: true });
    if (data) setEmployees(data.filter((e: any) => e.schedule_type === "Fixed"));
  };

  useEffect(() => {
    fetchEmployees();
    const channel = supabase.channel("fixed-realtime").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, fetchEmployees).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return e.full_name.toLowerCase().includes(q) || (e.position?.toLowerCase().includes(q)) || (e.department?.toLowerCase().includes(q));
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, yyyy") : "—";

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-info flex items-center justify-center"><Clock className="w-4 h-4 text-white" /></div>
          Fixed Schedule
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{employees.length} employees • Sorted A-Z</p>
      </motion.div>

      <Card className="border border-border/60 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 bg-muted/30 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, position, department..." className="pl-11 border-0 bg-card rounded-xl h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-border/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-primary" /></TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Position</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Department</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="font-mono text-xs text-primary font-semibold">{emp.employee_id || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                        {emp.photo_url ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{emp.full_name.charAt(0)}</div>}
                      </div>
                      <span className="font-medium text-sm">{emp.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{emp.position || "—"}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{emp.department || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={emp.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold rounded-full px-3 ${emp.status === "Active" ? "bg-success/15 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>{emp.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setViewData(emp)}><Eye className="w-4 h-4" /></Button>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No fixed schedule employees found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Employee Details</DialogTitle></DialogHeader>
          {viewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                  {viewData.photo_url ? <img src={viewData.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">{viewData.full_name.charAt(0)}</div>}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewData.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{viewData.position || "—"} • {viewData.department || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-xl p-4">
                {[["Employee ID", viewData.employee_id], ["Phone", viewData.phone], ["Email", viewData.email],
                  ["Date Hired", fmtDate(viewData.date_hired)], ["Until Date", fmtDate(viewData.until_date)],
                  ["Schedule", viewData.schedule_type], ["Status", viewData.status],
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
