import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, GraduationCap, Calendar, MapPin, Phone, Mail, Clock, Camera, BookOpen, School, Sparkles, Target, Award, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface OjtData {
  id: string;
  full_name: string;
  school: string | null;
  course: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  ojt_id: string | null;
  date_started: string | null;
  until_date: string | null;
  status: string;
  address: string | null;
}

export default function OjtDashboard() {
  const { user } = useAuth();
  const [ojt, setOjt] = useState<OjtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchOjt();
  }, [user]);

  const fetchOjt = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ojts")
      .select("id, full_name, school, course, email, phone, photo_url, ojt_id, date_started, until_date, status, address")
      .eq("auth_user_id", user!.id)
      .maybeSingle();
    if (data) setOjt(data);
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ojt) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("ojt-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("ojt-photos").getPublicUrl(path);
      const { error: updateError } = await supabase.from("ojts").update({ photo_url: urlData.publicUrl } as any).eq("id", ojt.id);
      if (updateError) throw updateError;
      toast({ title: "Photo updated!" });
      fetchOjt();
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

  const fmtDate = (d: string | null) => d ? format(new Date(d), "MMM d, yyyy") : "—";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  // OJT progress
  let progressPercent = 0;
  let daysLeft = 0;
  let totalDays = 0;
  let daysCompleted = 0;
  if (ojt?.date_started && ojt?.until_date) {
    const start = new Date(ojt.date_started);
    const end = new Date(ojt.until_date);
    totalDays = differenceInDays(end, start);
    daysCompleted = differenceInDays(now, start);
    progressPercent = Math.min(100, Math.max(0, Math.round((daysCompleted / totalDays) * 100)));
    daysLeft = Math.max(0, differenceInDays(end, now));
  }

  // Milestones
  const milestones = [
    { label: "25%", reached: progressPercent >= 25 },
    { label: "50%", reached: progressPercent >= 50 },
    { label: "75%", reached: progressPercent >= 75 },
    { label: "100%", reached: progressPercent >= 100 },
  ];

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
        <div className="absolute top-10 right-24 w-16 h-16 bg-white/5 rounded-full animate-float" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-xl ring-4 ring-white/10">
              {ojt?.photo_url ? (
                <img src={ojt.photo_url} alt="" className="w-full h-full object-cover" />
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
            <h1 className="text-3xl md:text-4xl font-bold">Welcome, {ojt?.full_name?.split(" ")[0] || "Trainee"}!</h1>
            <div className="flex flex-wrap items-center gap-3 mt-4 justify-center md:justify-start">
              {ojt?.course && (
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                  <BookOpen className="w-3.5 h-3.5" />{ojt.course}
                </span>
              )}
              {ojt?.school && (
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                  <School className="w-3.5 h-3.5" />{ojt.school}
                </span>
              )}
              {ojt?.ojt_id && (
                <span className="bg-white/25 px-3 py-1.5 rounded-full text-xs font-bold">ID: {ojt.ojt_id}</span>
              )}
            </div>
          </div>
          {/* Days Left Badge */}
          {ojt?.date_started && ojt?.until_date && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hidden lg:block"
            >
              <Target className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
              <p className="text-3xl font-bold">{daysLeft}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Days Left</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* OJT Progress Card */}
      {ojt?.date_started && ojt?.until_date && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border/60 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              OJT Progress Tracker
            </h3>
            <span className="text-lg font-bold text-primary">{progressPercent}%</span>
          </div>

          <Progress value={progressPercent} className="h-4 rounded-full mb-4" />

          <div className="flex justify-between text-xs text-muted-foreground mb-4">
            <span>{fmtDate(ojt.date_started)}</span>
            <span className="font-semibold text-primary">{daysCompleted} / {totalDays} days</span>
            <span>{fmtDate(ojt.until_date)}</span>
          </div>

          {/* Milestones */}
          <div className="flex justify-between items-center mt-2">
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  m.reached
                    ? "bg-primary border-primary text-white shadow-md"
                    : "bg-muted border-border text-muted-foreground"
                }`}>
                  {m.reached ? <Zap className="w-4 h-4" /> : <span className="text-xs font-bold">{m.label}</span>}
                </div>
                <span className={`text-[10px] font-semibold ${m.reached ? "text-primary" : "text-muted-foreground"}`}>{m.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { icon: School, label: "School", value: ojt?.school, color: "text-primary", bg: "bg-primary/10" },
          { icon: GraduationCap, label: "Course", value: ojt?.course, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Mail, label: "Email", value: ojt?.email, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: Phone, label: "Phone", value: ojt?.phone, color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: Calendar, label: "Started", value: fmtDate(ojt?.date_started || null), color: "text-purple-500", bg: "bg-purple-500/10" },
          { icon: Calendar, label: "Until", value: fmtDate(ojt?.until_date || null), color: "text-red-500", bg: "bg-red-500/10" },
          { icon: MapPin, label: "Address", value: ojt?.address, color: "text-pink-500", bg: "bg-pink-500/10" },
          { icon: Clock, label: "Status", value: ojt?.status, color: ojt?.status === "Active" ? "text-emerald-600" : "text-red-500", bg: ojt?.status === "Active" ? "bg-emerald-500/10" : "bg-red-500/10" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
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

      {/* Motivational Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-6 text-center"
      >
        <Award className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-bold text-foreground">Keep up the great work!</p>
        <p className="text-xs text-muted-foreground mt-1">
          {progressPercent >= 100 ? "🎉 Congratulations! You've completed your OJT!" :
           progressPercent >= 75 ? "Almost there! You're in the final stretch." :
           progressPercent >= 50 ? "You're halfway through your OJT journey!" :
           "Every day brings you closer to your goals."}
        </p>
      </motion.div>
    </div>
  );
}
