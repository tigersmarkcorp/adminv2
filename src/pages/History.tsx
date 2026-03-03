import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History as HistoryIcon, Search, Filter, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_by: string | null;
  changed_fields: string[] | null;
  record_name: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterTable, setFilterTable] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [detailEntry, setDetailEntry] = useState<AuditEntry | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    let query = (supabase as any)
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterTable !== "all") query = query.eq("table_name", filterTable);
    if (filterAction !== "all") query = query.eq("action", filterAction);

    const { data, count } = await query;
    setLogs(data || []);
    setTotal(count || 0);
  };

  useEffect(() => {
    fetchLogs();
    const channel = supabase.channel("audit-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, fetchLogs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [page, filterTable, filterAction]);

  const actionIcon = (action: string) => {
    if (action === "INSERT") return <Plus className="w-3.5 h-3.5" />;
    if (action === "UPDATE") return <Pencil className="w-3.5 h-3.5" />;
    if (action === "DELETE") return <Trash2 className="w-3.5 h-3.5" />;
    return null;
  };

  const actionColor = (action: string) => {
    if (action === "INSERT") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/20";
    if (action === "UPDATE") return "bg-blue-500/15 text-blue-600 border-blue-500/20";
    if (action === "DELETE") return "bg-red-500/15 text-red-600 border-red-500/20";
    return "";
  };

  const tableLabel = (t: string) => {
    if (t === "employees") return "Employee";
    if (t === "workers") return "Worker";
    if (t === "ojts") return "OJT";
    return t;
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.record_name?.toLowerCase().includes(q)) ||
      l.table_name.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.changed_fields?.some(f => f.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <HistoryIcon className="w-4 h-4 text-white" />
          </div>
          View History
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Track all changes — adds, updates, and deletes across personnel records</p>
      </motion.div>

      <Card className="border border-border/60 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 bg-muted/30 border-b border-border/40">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, table, action, field..." className="pl-11 border-0 bg-card rounded-xl h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={filterTable} onValueChange={(v) => { setFilterTable(v); setPage(0); }}>
                <SelectTrigger className="w-36 rounded-xl h-10 bg-card border-0">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="workers">Workers</SelectItem>
                  <SelectItem value="ojts">OJTs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0); }}>
                <SelectTrigger className="w-32 rounded-xl h-10 bg-card border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="INSERT">Added</SelectItem>
                  <SelectItem value="UPDATE">Updated</SelectItem>
                  <SelectItem value="DELETE">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-border/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date & Time</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Changed Fields</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry, i) => (
                <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.created_at), "MMM d, yyyy")}
                    <br />
                    <span className="text-[10px]">{format(new Date(entry.created_at), "hh:mm a")}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-bold rounded-full px-2.5 gap-1 border ${actionColor(entry.action)}`}>
                      {actionIcon(entry.action)}
                      {entry.action === "INSERT" ? "Added" : entry.action === "UPDATE" ? "Updated" : "Deleted"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold rounded-full px-2.5">
                      {tableLabel(entry.table_name)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{entry.record_name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {entry.changed_fields && entry.changed_fields.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.changed_fields.slice(0, 3).map(f => (
                          <span key={f} className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                        {entry.changed_fields.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{entry.changed_fields.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary" onClick={() => setDetailEntry(entry)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <HistoryIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium">No history records yet</p>
                    <p className="text-xs mt-1">Changes to personnel records will appear here automatically</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total records • Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailEntry} onOpenChange={() => setDetailEntry(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Change Details
              {detailEntry && (
                <Badge className={`text-[10px] font-bold rounded-full px-2.5 gap-1 border ${actionColor(detailEntry.action)}`}>
                  {detailEntry.action === "INSERT" ? "Added" : detailEntry.action === "UPDATE" ? "Updated" : "Deleted"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Name</p>
                  <p className="font-semibold mt-0.5">{detailEntry.record_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Category</p>
                  <p className="font-semibold mt-0.5">{tableLabel(detailEntry.table_name)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Date</p>
                  <p className="font-semibold mt-0.5">{format(new Date(detailEntry.created_at), "MMM d, yyyy hh:mm a")}</p>
                </div>
                {detailEntry.changed_fields && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Fields Changed</p>
                    <p className="font-semibold mt-0.5 text-xs">{detailEntry.changed_fields.map(f => f.replace(/_/g, " ")).join(", ")}</p>
                  </div>
                )}
              </div>

              {detailEntry.action === "UPDATE" && detailEntry.changed_fields && (
                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Changes</h4>
                  <div className="space-y-2">
                    {detailEntry.changed_fields.map(field => (
                      <div key={field} className="bg-muted/20 rounded-xl p-3 text-sm">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{field.replace(/_/g, " ")}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 line-through text-xs">{detailEntry.old_data?.[field] || "empty"}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-emerald-600 font-medium text-xs">{detailEntry.new_data?.[field] || "empty"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailEntry.action === "INSERT" && detailEntry.new_data && (
                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">New Record Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-emerald-500/5 rounded-xl p-4">
                    {Object.entries(detailEntry.new_data).filter(([k]) => !["id", "created_at", "updated_at"].includes(k) && detailEntry.new_data![k]).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{k.replace(/_/g, " ")}</p>
                        <p className="font-semibold mt-0.5 text-xs truncate">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailEntry.action === "DELETE" && detailEntry.old_data && (
                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Deleted Record Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-red-500/5 rounded-xl p-4">
                    {Object.entries(detailEntry.old_data).filter(([k]) => !["id", "created_at", "updated_at"].includes(k) && detailEntry.old_data![k]).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{k.replace(/_/g, " ")}</p>
                        <p className="font-semibold mt-0.5 text-xs truncate">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
