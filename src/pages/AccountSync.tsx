import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Search, Users, GraduationCap, Link2, Unlink, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PersonRecord {
  id: string;
  full_name: string;
  email: string | null;
  auth_user_id: string | null;
  status: string;
  photo_url: string | null;
}

export default function AccountSync() {
  const [employees, setEmployees] = useState<PersonRecord[]>([]);
  const [ojts, setOjts] = useState<PersonRecord[]>([]);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchAll = async () => {
    const [empRes, ojtRes] = await Promise.all([
      supabase.from("employees").select("id, full_name, email, auth_user_id, status, photo_url").order("full_name"),
      supabase.from("ojts").select("id, full_name, email, auth_user_id, status, photo_url").order("full_name"),
    ]);
    setEmployees(empRes.data || []);
    setOjts(ojtRes.data || []);
  };

  useEffect(() => {
    fetchAll();
    const ch1 = supabase.channel("sync-emp").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, fetchAll).subscribe();
    const ch2 = supabase.channel("sync-ojt").on("postgres_changes", { event: "*", schema: "public", table: "ojts" }, fetchAll).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const unlinkAccount = async (table: "employees" | "ojts", id: string, authUserId: string) => {
    if (!confirm("Unlink this account? The user will need to re-verify their email to log in again.")) return;
    setSyncing(id);
    
    // Remove auth_user_id
    await supabase.from(table).update({ auth_user_id: null } as any).eq("id", id);
    
    // Remove role
    const role = table === "employees" ? "employee" : "ojt";
    await (supabase as any).from("user_roles").delete().eq("user_id", authUserId).eq("role", role);
    
    toast({ title: "Account unlinked" });
    setSyncing(null);
    fetchAll();
  };

  const renderTable = (data: PersonRecord[], type: "employees" | "ojts") => {
    const filtered = data.filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || (p.email?.toLowerCase().includes(q));
    });

    const linked = filtered.filter(p => p.auth_user_id);
    const unlinked = filtered.filter(p => !p.auth_user_id);

    return (
      <div className="space-y-4">
        {/* Stats */}
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
                  {person.auth_user_id ? (
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs gap-1.5 hover:bg-destructive/10 text-destructive" onClick={() => unlinkAccount(type, person.id, person.auth_user_id!)} disabled={syncing === person.id}>
                      {syncing === person.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                      Unlink
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Awaiting user login</span>
                  )}
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

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-card-2 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          Account Sync
        </h2>
        <p className="text-xs text-muted-foreground mt-1">View and manage linked portal accounts for employees and OJTs</p>
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
    </div>
  );
}
