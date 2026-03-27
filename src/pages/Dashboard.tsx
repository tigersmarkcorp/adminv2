import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Users, HardHat, FolderOpen, GraduationCap, Droplets, Wind, ArrowUpRight, Activity, TrendingUp, Shield, UserCircle, Lock, Eye, EyeOff, Settings, BarChart3, PieChartIcon } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface RecentPerson {
  id: string;
  full_name: string;
  status: string;
  photo_url: string | null;
  created_at: string;
  role?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ employees: 0, workers: 0, files: 0, ojts: 0 });
  const [statusData, setStatusData] = useState<{ name: string; active: number; inactive: number }[]>([]);
  const [distributionData, setDistributionData] = useState<{ name: string; value: number }[]>([]);
  const [scheduleData, setScheduleData] = useState<{ name: string; value: number }[]>([]);
  const [genderData, setGenderData] = useState<{ name: string; male: number; female: number; other: number }[]>([]);
  const [weather, setWeather] = useState<{ temp: number; desc: string; humidity: number; wind: number; icon: string } | null>(null);
  const [recentEmployees, setRecentEmployees] = useState<RecentPerson[]>([]);
  const [recentWorkers, setRecentWorkers] = useState<RecentPerson[]>([]);
  const [recentOjts, setRecentOjts] = useState<RecentPerson[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const fetchCounts = async () => {
    const [emp, wrk, fil, ojt] = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("workers").select("*"),
      supabase.from("files_metadata").select("id", { count: "exact", head: true }),
      supabase.from("ojts").select("*"),
    ]);

    const employees = emp.data || [];
    const workers = wrk.data || [];
    const ojts = ojt.data || [];

    setCounts({ employees: employees.length, workers: workers.length, files: fil.count ?? 0, ojts: ojts.length });

    const empActive = employees.filter(e => e.status === "Active").length;
    const wrkActive = workers.filter(w => w.status === "Active").length;
    const ojtActive = ojts.filter(o => o.status === "Active").length;
    setStatusData([
      { name: "Employees", active: empActive, inactive: employees.length - empActive },
      { name: "Workers", active: wrkActive, inactive: workers.length - wrkActive },
      { name: "OJTs", active: ojtActive, inactive: ojts.length - ojtActive },
    ]);

    setDistributionData([
      { name: "Employees", value: employees.length },
      { name: "Workers", value: workers.length },
      { name: "OJT", value: ojts.length },
    ]);

    const fixed = employees.filter(e => e.schedule_type === "Fixed").length;
    const flexible = employees.filter(e => e.schedule_type === "Flexible").length;
    setScheduleData([
      { name: "Fixed", value: fixed },
      { name: "Flexible", value: flexible },
    ]);

    // Gender analytics
    const genderCount = (arr: any[]) => {
      const m = arr.filter(p => p.gender?.toLowerCase() === "male").length;
      const f = arr.filter(p => p.gender?.toLowerCase() === "female").length;
      return { male: m, female: f, other: arr.length - m - f };
    };
    const empG = genderCount(employees);
    const wrkG = genderCount(workers);
    const ojtG = genderCount(ojts);
    setGenderData([
      { name: "Employees", ...empG },
      { name: "Workers", ...wrkG },
      { name: "OJTs", ...ojtG },
    ]);

    // Recent 10
    setRecentEmployees(employees.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map(e => ({
      id: e.id, full_name: e.full_name, status: e.status, photo_url: e.photo_url, created_at: e.created_at, role: e.position || "—"
    })));
    setRecentWorkers(workers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map(w => ({
      id: w.id, full_name: w.full_name, status: w.status, photo_url: w.photo_url, created_at: w.created_at, role: w.job_role || "—"
    })));
    setRecentOjts(ojts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map(o => ({
      id: o.id, full_name: o.full_name, status: o.status, photo_url: o.photo_url, created_at: o.created_at, role: o.school || "—"
    })));
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
      const data = await res.json();
      const c = data.current;
      const wmoDescriptions: Record<number, string> = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Slight showers",
        81: "Moderate showers", 82: "Violent showers", 95: "Thunderstorm",
      };
      setWeather({
        temp: Math.round(c.temperature_2m), desc: wmoDescriptions[c.weather_code] || "Unknown",
        humidity: c.relative_humidity_2m, wind: Math.round(c.wind_speed_10m),
        icon: c.weather_code <= 3 ? "☀️" : c.weather_code <= 48 ? "🌫️" : c.weather_code <= 65 ? "🌧️" : "🌨️",
      });
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchCounts();
    fetchWeather();
    const channel = supabase.channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "workers" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "files_metadata" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "ojts" }, fetchCounts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password changed successfully!" }); setPasswordOpen(false); setNewPassword(""); setConfirmPassword(""); }
    setChangingPass(false);
  };

  const summaryCards = [
    { title: "Total Employees", count: counts.employees, icon: Users, gradient: "gradient-card-1", desc: "Active personnel" },
    { title: "Total Workers", count: counts.workers, icon: HardHat, gradient: "gradient-card-2", desc: "Field workers" },
    { title: "OJT / Interns", count: counts.ojts, icon: GraduationCap, gradient: "gradient-card-3", desc: "Training program" },
    { title: "Files Stored", count: counts.files, icon: FolderOpen, gradient: "gradient-primary", desc: "Documents & forms" },
  ];

  const DIST_COLORS = ["hsl(14, 100%, 50%)", "hsl(330, 70%, 55%)", "hsl(170, 70%, 45%)"];
  const total = counts.employees + counts.workers + counts.ojts;
  const fmtDate = (d: string) => format(new Date(d), "MMM d, yyyy");

  const RecentTable = ({ title, data, icon: Icon, color }: { title: string; data: RecentPerson[]; icon: any; color: string }) => (
    <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3 bg-muted/20">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">Latest 10 records</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10">
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Role</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(p => (
              <TableRow key={p.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border/40">
                      {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{p.full_name.charAt(0)}</div>}
                    </div>
                    <span className="text-xs font-medium">{p.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{p.role}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "Active" ? "default" : "secondary"} className={`text-[9px] font-bold rounded-full px-2 ${p.status === "Active" ? "bg-success/15 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{fmtDate(p.created_at)}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">No records yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Enterprise analytics & overview</p>
        </motion.div>
        <div className="flex items-center gap-2">
          {/* Profile & Password Buttons */}
          <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs" onClick={() => setProfileOpen(true)}>
            <UserCircle className="w-4 h-4" /> Profile
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs" onClick={() => setPasswordOpen(true)}>
            <Lock className="w-4 h-4" /> Change Password
          </Button>
          {/* Weather */}
          {weather && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm border border-border/60">
              <span className="text-2xl">{weather.icon}</span>
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">{weather.temp}°C</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Manila</p>
              </div>
              <div className="hidden sm:flex flex-col gap-0.5 ml-2 pl-3 border-l border-border/50">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Droplets className="w-3 h-3 text-primary" />{weather.humidity}%</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Wind className="w-3 h-3 text-primary" />{weather.wind}km/h</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`relative overflow-hidden border-0 shadow-lg card-hover p-5 ${card.gradient} text-white rounded-2xl`}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <card.icon className="w-8 h-8 text-white/80" />
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{card.count.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-white/70 font-medium">{card.title}</p>
                </div>
                <p className="text-[10px] text-white/50 mt-1">{card.desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row: Personnel Statistics + Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="border border-border/60 shadow-sm p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Personnel Statistics</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Monthly overview across categories</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(14, 100%, 50%)" }} /> Employees</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(330, 70%, 55%)" }} /> Workers</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(170, 70%, 45%)" }} /> OJT</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} barGap={6} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: 12, fontSize: 11, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="active" name="Active" fill="hsl(14, 100%, 50%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inactive" name="Inactive" fill="hsl(330, 70%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border border-border/60 shadow-sm p-5 rounded-2xl h-full">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" /> Distribution</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">Personnel breakdown</p>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {distributionData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: 12, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {distributionData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: DIST_COLORS[i] }} /><span className="text-foreground font-medium">{item.name}</span></div>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Schedule Overview + Gender Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border border-border/60 shadow-sm p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-foreground mb-4">Schedule Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              {scheduleData.map((s, i) => (
                <div key={s.name} className="rounded-xl bg-muted/30 border border-border/40 p-4 text-center">
                  <p className={`text-3xl font-bold ${i === 0 ? "text-primary" : "text-info"}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{s.name} Schedule</p>
                  <Progress value={total > 0 ? (s.value / total) * 100 : 0} className="h-1.5 mt-3" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border border-border/60 shadow-sm p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" /> Gender Analytics</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Distribution across all categories</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Male</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(330, 70%, 55%)" }} /> Female</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(220, 9%, 70%)" }} /> Other</span>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData} barGap={4} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: 12, fontSize: 11, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="male" name="Male" fill="hsl(14, 100%, 50%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="female" name="Female" fill="hsl(330, 70%, 55%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="other" name="Other" fill="hsl(220, 9%, 70%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border border-border/60 shadow-sm p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-foreground mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: "Active Employees", value: statusData[0]?.active ?? 0, max: counts.employees, color: "bg-primary" },
              { label: "Total Workers", value: counts.workers, max: total || 1, color: "bg-[hsl(330,70%,55%)]" },
              { label: "OJT Trainees", value: counts.ojts, max: total || 1, color: "bg-[hsl(170,70%,45%)]" },
              { label: "Files Stored", value: counts.files, max: Math.max(counts.files, 10), color: "bg-info" },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">{s.label}</span>
                  <span className="font-bold text-foreground">{s.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.value / s.max) * 100, 100)}%` }} transition={{ delay: 0.6, duration: 0.8 }} className={`h-full rounded-full ${s.color}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Total Personnel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border border-border/60 shadow-sm p-6 rounded-2xl gradient-primary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Total Personnel</p>
              <p className="text-5xl font-bold mt-1">{total}</p>
              <p className="text-xs text-white/60 mt-1">Across all departments & categories</p>
            </div>
            <div className="flex gap-8">
              {statusData.map(s => (
                <div key={s.name} className="text-center">
                  <p className="text-3xl font-bold text-white">{s.active}</p>
                  <p className="text-[10px] text-white/70 font-medium">{s.name}</p>
                  <p className="text-[9px] text-white/50">Active</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent 10 Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentTable title="Recent Employees" data={recentEmployees} icon={Users} color="gradient-card-1" />
        <RecentTable title="Recent Workers" data={recentWorkers} icon={HardHat} color="gradient-card-2" />
        <RecentTable title="Recent OJTs" data={recentOjts} icon={GraduationCap} color="gradient-card-3" />
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">My Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{user?.email}</h3>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm bg-muted/30 rounded-xl p-4">
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Email</p><p className="font-semibold mt-0.5">{user?.email}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Role</p><p className="font-semibold mt-0.5 flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Admin</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Last Sign In</p><p className="font-semibold mt-0.5">{user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), "MMM d, yyyy 'at' h:mm a") : "—"}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Account Created</p><p className="font-semibold mt-0.5">{user?.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"}</p></div>
            </div>
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => { setProfileOpen(false); setPasswordOpen(true); }}>
              <Lock className="w-4 h-4" /> Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Change Password</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</Label>
              <div className="relative">
                <Input type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="pr-10 rounded-xl h-11" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
              <Input type={showPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="rounded-xl h-11" />
            </div>
            <Button className="w-full gradient-primary text-white rounded-xl h-11 font-bold" onClick={handleChangePassword} disabled={changingPass}>
              {changingPass ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
