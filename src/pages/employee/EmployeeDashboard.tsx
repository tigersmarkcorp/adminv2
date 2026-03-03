import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Edit3, User, CreditCard, Shield, Building2, FileText, Hash, Camera, Briefcase, Calendar, Phone, Mail, MapPin, Clock, Sparkles, TrendingUp, Award, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface EmployeeData {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  employee_id: string | null;
  date_hired: string | null;
  until_date: string | null;
  status: string;
  address: string | null;
}

interface GovIds {
  id: string;
  nbi_number: string | null;
  philhealth_number: string | null;
  sss_number: string | null;
  pagibig_number: string | null;
  tin_number: string | null;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [govIds, setGovIds] = useState<GovIds | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nbi_number: "",
    philhealth_number: "",
    sss_number: "",
    pagibig_number: "",
    tin_number: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
    const channel = supabase
      .channel("gov-ids-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_government_ids" }, () => fetchGovIds())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchEmployee(), fetchGovIds()]);
    setLoading(false);
  };

  const fetchEmployee = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, position, department, email, phone, photo_url, employee_id, date_hired, until_date, status, address")
      .eq("auth_user_id", user!.id)
      .maybeSingle();
    if (data) setEmployee(data);
  };

  const fetchGovIds = async () => {
    const { data } = await (supabase as any)
      .from("employee_government_ids")
      .select("id, nbi_number, philhealth_number, sss_number, pagibig_number, tin_number")
      .eq("auth_user_id", user!.id)
      .maybeSingle();
    if (data) {
      setGovIds(data);
      setForm({
        nbi_number: data.nbi_number || "",
        philhealth_number: data.philhealth_number || "",
        sss_number: data.sss_number || "",
        pagibig_number: data.pagibig_number || "",
        tin_number: data.tin_number || "",
      });
    }
  };

  const handleSave = async () => {
    if (!govIds) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("employee_government_ids")
      .update({
        nbi_number: form.nbi_number || null,
        philhealth_number: form.philhealth_number || null,
        sss_number: form.sss_number || null,
        pagibig_number: form.pagibig_number || null,
        tin_number: form.tin_number || null,
      })
      .eq("id", govIds.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Government IDs updated." });
      setEditing(false);
      fetchGovIds();
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("employee-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("employee-photos").getPublicUrl(path);
      const { error: updateError } = await supabase.from("employees").update({ photo_url: urlData.publicUrl }).eq("id", employee.id);
      if (updateError) throw updateError;
      toast({ title: "Photo updated!" });
      fetchEmployee();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const govIdFields = [
    { key: "nbi_number" as const, label: "NBI Clearance No.", icon: Shield, gradient: "from-red-500 to-orange-500" },
    { key: "philhealth_number" as const, label: "PhilHealth No.", icon: CreditCard, gradient: "from-emerald-500 to-teal-500" },
    { key: "sss_number" as const, label: "SSS No.", icon: Building2, gradient: "from-blue-500 to-indigo-500" },
    { key: "pagibig_number" as const, label: "Pag-IBIG MID No.", icon: FileText, gradient: "from-amber-500 to-yellow-500" },
    { key: "tin_number" as const, label: "TIN No.", icon: Hash, gradient: "from-purple-500 to-pink-500" },
  ];

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, yyyy") : "—";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  // Calculate tenure
  let tenureDays = 0;
  if (employee?.date_hired) {
    tenureDays = differenceInDays(now, new Date(employee.date_hired));
  }
  const tenureYears = Math.floor(tenureDays / 365);
  const tenureMonths = Math.floor((tenureDays % 365) / 30);

  const completedIds = govIdFields.filter(f => form[f.key]).length;
  const idCompletionPercent = Math.round((completedIds / govIdFields.length) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white shadow-xl glow-primary"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-10 right-20 w-20 h-20 bg-white/5 rounded-full animate-float" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-xl ring-4 ring-white/10">
              {employee?.photo_url ? (
                <img src={employee.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white/80" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <p className="text-white/70 text-sm font-medium">{greeting},</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome, {employee?.full_name?.split(" ")[0] || "Employee"}!</h1>
            <div className="flex flex-wrap items-center gap-3 mt-4 justify-center md:justify-start">
              {employee?.position && (
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                  <Briefcase className="w-3.5 h-3.5" />{employee.position}
                </span>
              )}
              {employee?.department && (
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                  <Building2 className="w-3.5 h-3.5" />{employee.department}
                </span>
              )}
              {employee?.employee_id && (
                <span className="bg-white/25 px-3 py-1.5 rounded-full text-xs font-bold">ID: {employee.employee_id}</span>
              )}
            </div>
          </div>
          {/* Tenure Badge */}
          {employee?.date_hired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hidden lg:block"
            >
              <Award className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
              <p className="text-2xl font-bold">{tenureYears > 0 ? `${tenureYears}y ${tenureMonths}m` : `${tenureMonths}m`}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Tenure</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Mail, label: "Email", value: employee?.email, color: "text-primary", bg: "bg-primary/10" },
          { icon: Phone, label: "Phone", value: employee?.phone, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Calendar, label: "Date Hired", value: fmtDate(employee?.date_hired || null), color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: Clock, label: "Status", value: employee?.status, color: employee?.status === "Active" ? "text-emerald-600" : "text-red-500", bg: employee?.status === "Active" ? "bg-emerald-500/10" : "bg-red-500/10" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-card rounded-2xl border border-border/60 p-4 card-hover group"
          >
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{item.label}</p>
            <p className="text-sm font-bold text-foreground truncate mt-0.5">{item.value || "—"}</p>
          </motion.div>
        ))}
      </div>

      {/* ID Completion Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border/60 p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">ID Completion</h3>
          </div>
          <span className="text-sm font-bold text-primary">{completedIds}/{govIdFields.length}</span>
        </div>
        <Progress value={idCompletionPercent} className="h-2.5 rounded-full" />
        <p className="text-xs text-muted-foreground mt-2">{idCompletionPercent}% of your government IDs are filled in</p>
      </motion.div>

      {/* Government IDs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              Government IDs
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Manage your government identification numbers</p>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); fetchGovIds(); }} className="rounded-xl">Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 rounded-xl gradient-primary text-white">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {govIdFields.map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border/30 hover:border-primary/20 transition-all hover:shadow-md group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${field.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                <field.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{field.label}</Label>
                {editing ? (
                  <Input
                    value={form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={`Enter ${field.label}`}
                    className="mt-1.5 h-9 text-sm bg-background rounded-xl"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-sm font-semibold text-foreground">{form[field.key] || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                    {form[field.key] && <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Address */}
      {employee?.address && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border/60 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Address</p>
          </div>
          <p className="text-sm font-medium text-foreground">{employee.address}</p>
        </motion.div>
      )}
    </div>
  );
}
