import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock, KeyRound, Shield, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "Your password has been changed." });
      setPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-employee flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-employee-soft p-5 shadow-employee-panel">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-employee-navy" />
          Account Information
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</p>
            <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-employee-soft p-5 shadow-employee-panel">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 bg-muted/40 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 bg-muted/40 rounded-xl text-sm"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-11 gradient-employee text-white rounded-xl font-bold glow-sm-employee" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Update Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
