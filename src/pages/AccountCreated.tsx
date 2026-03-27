import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, Users, GraduationCap, Shield, Link2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface LinkedAccount {
  id: string;
  full_name: string;
  email: string | null;
  auth_user_id: string;
  status: string;
  photo_url: string | null;
  position?: string | null;
  department?: string | null;
  school?: string | null;
  course?: string | null;
  type: "employee" | "ojt";
}

export default function AccountCreated() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    const [empRes, ojtRes] = await Promise.all([
      supabase.from("employees").select("id, full_name, email, auth_user_id, status, photo_url, position, department").not("auth_user_id", "is", null).order("full_name"),
      supabase.from("ojts").select("id, full_name, email, auth_user_id, status, photo_url, school, course").not("auth_user_id", "is", null).order("full_name"),
    ]);
    const emps: LinkedAccount[] = (empRes.data || []).map(e => ({ ...e, auth_user_id: e.auth_user_id!, type: "employee" as const }));
    const ojts: LinkedAccount[] = (ojtRes.data || []).map(o => ({ ...o, auth_user_id: o.auth_user_id!, type: "ojt" as const }));
    setAccounts([...emps, ...ojts]);
  };

  useEffect(() => {
    fetchAccounts();
    const ch1 = supabase.channel("acc-created-emp").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, fetchAccounts).subscribe();
    const ch2 = supabase.channel("acc-created-ojt").on("postgres_changes", { event: "*", schema: "public", table: "ojts" }, fetchAccounts).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const employeeAccounts = accounts.filter(a => a.type === "employee");
  const ojtAccounts = accounts.filter(a => a.type === "ojt");

  const filterAccounts = (list: LinkedAccount[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(a => a.full_name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q));
  };

  const renderAccountTable = (data: LinkedAccount[]) => {
    const filtered = filterAccounts(data);
    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 border-b border-border/40">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Details</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Portal</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((acc, i) => (
            <motion.tr key={acc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition-colors border-b border-border/30">
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-primary/20">
                    {acc.photo_url ? <img src={acc.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{acc.full_name.charAt(0)}</div>}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-foreground">{acc.full_name}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{acc.email || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                {acc.type === "employee" ? (
                  <span>{acc.position || acc.department || "—"}</span>
                ) : (
                  <span>{acc.school || acc.course || "—"}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={`text-[10px] font-bold rounded-full px-2.5 gap-1 ${acc.type === "employee" ? "bg-primary/15 text-primary border border-primary/20" : "bg-info/15 text-info border border-info/20"}`}>
                  {acc.type === "employee" ? <Users className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                  {acc.type === "employee" ? "Employee" : "OJT"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={acc.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold rounded-full px-2.5 ${acc.status === "Active" ? "bg-success/15 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>
                  {acc.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs gap-1.5 hover:bg-primary/10 text-primary" onClick={() => navigate("/admin/sync")}>
                  <Eye className="w-3.5 h-3.5" /> View in Sync
                </Button>
              </TableCell>
            </motion.tr>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No accounts found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-card-3 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            Account Created
          </h2>
          <p className="text-xs text-muted-foreground mt-1">All accounts that have portal access (Employee & OJT portals)</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs" onClick={() => navigate("/admin/sync")}>
          <Link2 className="w-4 h-4" /> Go to Account Sync
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border/60 p-4 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Accounts</p>
        </Card>
        <Card className="border border-primary/20 bg-primary/5 p-4 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-2xl font-bold text-primary">{employeeAccounts.length}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Employee Portal</p>
        </Card>
        <Card className="border border-info/20 bg-info/5 p-4 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-info" />
            <p className="text-2xl font-bold text-info">{ojtAccounts.length}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-info font-semibold">OJT Portal</p>
        </Card>
      </div>

      <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/40 bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search accounts by name or email..." className="pl-11 border-0 bg-card rounded-xl h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full rounded-none border-b border-border/40 bg-transparent h-12 px-4">
            <TabsTrigger value="all" className="rounded-xl gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Shield className="w-4 h-4" /> All ({accounts.length})
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-xl gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Users className="w-4 h-4" /> Employees ({employeeAccounts.length})
            </TabsTrigger>
            <TabsTrigger value="ojts" className="rounded-xl gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4" /> OJTs ({ojtAccounts.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="p-4">
            {renderAccountTable(accounts)}
          </TabsContent>
          <TabsContent value="employees" className="p-4">
            {renderAccountTable(employeeAccounts)}
          </TabsContent>
          <TabsContent value="ojts" className="p-4">
            {renderAccountTable(ojtAccounts)}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
