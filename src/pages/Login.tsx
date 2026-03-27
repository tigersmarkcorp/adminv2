import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Lock, Mail, Shield, Users, GraduationCap,
  ArrowLeft, CheckCircle2, BarChart3, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import loginBg from "@/assets/login-bg.jpg";

type PortalTab = "admin" | "employee" | "ojt";
type PortalStep = "choose" | "email" | "otp" | "set-password" | "signin";

export default function Login() {
  const [tab, setTab] = useState<PortalTab>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<PortalStep>("signin");
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const { signIn, user, isAdmin, isEmployee, isOjt, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) navigate("/admin");
      else if (isEmployee) navigate("/employee");
      else if (isOjt) navigate("/ojt");
    }
  }, [authLoading, user, isAdmin, isEmployee, isOjt, navigate]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setOtp("");
    setConfirmPassword("");
    setStep(tab === "admin" ? "signin" : "choose");
    setEmployeeName("");
  }, [tab]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("portal-auth", {
        body: { action: "check-email", email: email.trim(), type: tab },
      });
      if (error) throw error;
      if (!data.exists) {
        toast({ title: "Email not found", description: "This email is not registered in our system.", variant: "destructive" });
      } else if (data.hasAccount) {
        setEmployeeName(data.fullName);
        toast({ title: "Account exists", description: "You already have an account. Please sign in with your password." });
        setStep("signin");
      } else {
        setEmployeeName(data.fullName);
        const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
        if (otpError) throw otpError;
        toast({ title: "Code sent!", description: `A verification code has been sent to ${email}` });
        setStep("otp");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "email",
      });
      if (error) throw error;
      const { data, error: linkError } = await supabase.functions.invoke("portal-auth", {
        body: { action: "link-account", type: tab },
      });
      if (linkError) throw linkError;
      toast({ title: "Verified!", description: "Now set your password for future logins." });
      setStep("set-password");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSetPassword = async () => {
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password set!", description: "You can now sign in with your password." });
      if (tab === "employee") navigate("/employee");
      else navigate("/ojt");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handlePortalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const tabs: { id: PortalTab; label: string; icon: any; accent: string; dot: string }[] = [
    { id: "admin",    label: "Admin",    icon: Shield,       accent: "#f97316", dot: "bdot-o" },
    { id: "employee", label: "Employee", icon: Users,        accent: "#3b82f6", dot: "bdot-b" },
    { id: "ojt",      label: "OJT",      icon: GraduationCap, accent: "#22c55e", dot: "bdot-g" },
  ];

  const currentTab = tabs.find((t) => t.id === tab)!;

  const features = [
    { icon: ShieldCheck, title: "Secure Access",   desc: "Enterprise-grade authentication protecting your data at every layer." },
    { icon: BarChart3,   title: "Live Analytics",  desc: "Real-time dashboards and reporting at your fingertips." },
    { icon: Users,       title: "Team Management", desc: "Manage roles, permissions, and users with ease." },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes blob-1       { 0%,100%{transform:scale(1) translate(0,0)}    50%{transform:scale(1.1) translate(10px,-14px)} }
        @keyframes blob-2       { 0%,100%{transform:scale(1) translate(0,0)}    50%{transform:scale(1.07) translate(-12px,10px)} }
        @keyframes blob-3       { 0%,100%{transform:scale(1) translate(0,0)}    50%{transform:scale(1.13) translate(7px,12px)} }
        @keyframes wave-scroll  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes bob-a        { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-9px)} }
        @keyframes bob-b        { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-7px)} }
        @keyframes bob-c        { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-11px)} }
        @keyframes dot-pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes curve-draw   {
          0%   { stroke-dashoffset: 700; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes petal-fall {
          0%   { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
          10%  { opacity: 0.65; }
          90%  { opacity: 0.45; }
          100% { transform: translateY(110vh) rotate(720deg) translateX(50px); opacity: 0; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-shape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(120deg); }
          66% { transform: translateY(30px) rotate(240deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scale-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes input-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
          50% { box-shadow: 0 0 20px 5px rgba(249,115,22,0.15); }
        }
        @keyframes button-shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(400%) rotate(45deg); }
        }
        @keyframes border-flow {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes card-lift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }

        .layout {
          display: flex;
          width: 100%;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        /* ══ LEFT ══ */
        .left {
          flex: 1;
          min-width: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 260px 60px 72px;
        }
        .video-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          background-image: url('/bgadmin.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          animation: subtle-zoom 20s ease-in-out infinite;
        }
        @keyframes subtle-zoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .video-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(160deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.55) 50%,rgba(0,0,0,0.60) 100%);
        }
        .animated-gradient {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(-45deg, rgba(249,115,22,0.15), rgba(234,88,12,0.1), rgba(251,146,60,0.12), rgba(249,115,22,0.08));
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
          pointer-events: none;
        }
        .logo-container {
          position: absolute;
          top: 32px;
          left: 72px;
          z-index: 20;
          display: flex;
          align-items: center;
          animation: slide-up-fade 0.8s ease-out;
        }
        .logo-img {
          height: 56px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
          transition: transform 0.3s ease;
        }
        .logo-container:hover .logo-img {
          transform: scale(1.05);
        }
        .left::before {
          content: '';
          position: absolute; top: 0; left: 0;
          width: 4px; height: 100%;
          background: linear-gradient(to bottom, transparent 8%, #f97316 38%, #ea580c 62%, transparent 92%);
          opacity: .55;
          z-index: 10;
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform;
          z-index: 2;
        }
        .blob-a {
          width: 480px; height: 480px;
          top: -140px; right: -100px;
          background: radial-gradient(circle at 38% 38%, rgba(251,146,60,.18) 0%, rgba(249,115,22,.06) 52%, transparent 70%);
          animation: blob-1 11s ease-in-out infinite;
        }
        .blob-b {
          width: 340px; height: 340px;
          bottom: -100px; left: -60px;
          background: radial-gradient(circle at 55% 55%, rgba(254,215,170,.28) 0%, rgba(249,115,22,.04) 58%, transparent 74%);
          animation: blob-2 15s ease-in-out infinite;
        }
        .blob-c {
          width: 180px; height: 180px;
          top: 44%; right: 18%;
          background: radial-gradient(circle, rgba(249,115,22,.09) 0%, transparent 65%);
          animation: blob-3 9s ease-in-out infinite;
        }
        .floating-shape {
          position: absolute;
          z-index: 3;
          pointer-events: none;
          opacity: 0.15;
        }
        .shape-1 {
          top: 15%;
          left: 12%;
          width: 80px;
          height: 80px;
          border: 3px solid #fb923c;
          border-radius: 50%;
          animation: float-shape 12s ease-in-out infinite;
        }
        .shape-2 {
          top: 65%;
          left: 8%;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #fb923c, #f97316);
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          animation: float-shape 14s ease-in-out infinite reverse;
        }
        .shape-3 {
          bottom: 20%;
          right: 12%;
          width: 100px;
          height: 100px;
          border: 3px solid #ea580c;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          animation: float-shape 16s ease-in-out infinite;
          animation-delay: 2s;
        }
        .curves-svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          pointer-events: none; overflow: visible;
          z-index: 2;
        }
        .c-static  { fill: none; }
        .c-anim    { fill: none; stroke-dasharray: 700; stroke-dashoffset: 700; animation: curve-draw 7s ease-in-out infinite; }
        .c-anim-2  { animation-delay: 2.3s; }
        .c-anim-3  { animation-delay: 4.6s; }
        .wave-strip {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 64px; overflow: hidden; pointer-events: none; z-index: 2;
        }
        .wave-track {
          display: flex; height: 100%;
          animation: wave-scroll 22s linear infinite;
          width: max-content;
        }
        .wave-track svg { height: 100%; flex-shrink: 0; }
        .badge {
          position: absolute;
          display: flex; align-items: center; gap: 9px;
          padding: 9px 16px; border-radius: 50px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(249,115,22,.18);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,.04);
          white-space: nowrap; pointer-events: none; z-index: 15;
          backdrop-filter: blur(10px);
        }
        .badge-1 { top: 9%;    right: 32px;  animation: bob-a 5.5s ease-in-out infinite; }
        .badge-2 { top: 46%;   right: 20px;  animation: bob-b 7s   ease-in-out infinite; animation-delay: .9s; }
        .badge-3 { bottom:13%; right: 44px;  animation: bob-c 5.2s ease-in-out infinite; animation-delay: 1.7s; }
        .bdot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          animation: dot-pulse 2.4s ease-in-out infinite;
        }
        .bdot-o { background:#f97316; box-shadow:0 0 7px rgba(249,115,22,.55); }
        .bdot-g { background:#22c55e; box-shadow:0 0 7px rgba(34,197,94,.55);  animation-delay:.6s; }
        .bdot-b { background:#3b82f6; box-shadow:0 0 7px rgba(59,130,246,.55); animation-delay:1.1s; }
        .blabel { font-size:11.5px; font-weight:600; color:#1c1917; line-height:1.25; }
        .bsub   { font-size:10px; color:#57534e; }
        .petal {
          position: absolute;
          z-index: 4;
          pointer-events: none;
          opacity: 0;
          border-radius: 50% 0 50% 0;
          animation: petal-fall linear infinite;
        }
        .particles {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          overflow: hidden;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(251,146,60,0.6);
          border-radius: 50%;
          animation: float-particle 20s infinite;
          box-shadow: 0 0 10px rgba(251,146,60,0.4);
        }
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .content { position: relative; z-index: 5; }
        .tagline {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: #fb923c; margin-bottom: 18px;
          animation: slide-up-fade 0.6s ease-out;
        }
        .tagline-bar { 
          width: 26px; height: 2px; border-radius: 2px; background: #fb923c;
          animation: shimmer 3s linear infinite;
          background: linear-gradient(90deg, transparent, #fb923c, transparent);
          background-size: 200% 100%;
        }
        .headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 2.8vw, 44px);
          font-weight: 800; color: #ffffff;
          line-height: 1.12; letter-spacing: -.022em;
          margin-bottom: 18px;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
          animation: slide-up-fade 0.7s ease-out 0.1s both;
        }
        .headline em {
          font-style: normal;
          background: linear-gradient(125deg, #fb923c 20%, #f97316 80%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          background-size: 200% auto;
          animation: shimmer 5s linear infinite;
        }
        .sub {
          font-size: 14px; color: #e7e5e4; line-height: 1.78;
          max-width: 380px; margin-bottom: 44px; font-weight: 300;
          text-shadow: 0 1px 6px rgba(0,0,0,0.4);
          animation: slide-up-fade 0.8s ease-out 0.2s both;
        }
        .fi { 
          display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px;
          animation: slide-up-fade 0.6s ease-out both;
        }
        .fi:nth-child(1) { animation-delay: 0.3s; }
        .fi:nth-child(2) { animation-delay: 0.4s; }
        .fi:nth-child(3) { animation-delay: 0.5s; }
        .fi-icon {
          width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(251,146,60,.35);
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          display: flex; align-items: center; justify-content: center; color: #fb923c;
          transition: all .3s ease;
          backdrop-filter: blur(8px);
          position: relative;
          overflow: hidden;
        }
        .fi-icon::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(251,146,60,0.2), transparent);
          transition: left 0.5s;
        }
        .fi:hover .fi-icon::before {
          left: 100%;
        }
        .fi:hover .fi-icon {
          background: rgba(255,255,255,0.25);
          border-color: rgba(251,146,60,.55);
          box-shadow: 0 5px 18px rgba(0,0,0,0.3), 0 0 20px rgba(251,146,60,0.3);
          transform: translateY(-2px) scale(1.04);
        }
        .fi-title { font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 3px; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }
        .fi-desc  { font-size: 12.5px; color: #d6d3d1; font-weight: 300; line-height: 1.6; }
        .lf {
          margin-top: 48px;
          font-size: 10.5px; color: #a8a29e;
          letter-spacing: .08em; text-transform: uppercase;
          animation: slide-up-fade 0.6s ease-out 0.6s both;
        }

        /* ══ RIGHT ══ */
        .right {
          width: 480px;
          min-width: 480px;
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 44px;
          background: #fafaf9;
          border-left: 1px solid #ede9e3;
          position: relative;
          flex-shrink: 0;
          overflow: hidden;
        }
        .right::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, var(--tab-accent, #f97316) 50%, transparent);
          opacity: .6;
          transition: background 0.4s;
        }
        .right-bg-animation {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .right-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          animation: float-orb 20s ease-in-out infinite;
        }
        .right-orb-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(249,115,22,0.2), transparent);
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }
        .right-orb-2 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(234,88,12,0.15), transparent);
          bottom: -80px;
          left: -80px;
          animation-delay: -5s;
        }
        .right-orb-3 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(251,146,60,0.18), transparent);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -10s;
        }
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 30px) scale(1.05); }
        }
        .right-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 0;
          pointer-events: none;
        }
        .gc { 
          width: 100%; 
          max-width: 360px; 
          position: relative;
          z-index: 1;
        }

        /* Tab selector */
        .tab-row {
          display: flex;
          background: rgba(0,0,0,0.04);
          border-radius: 14px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .tab-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: tab-shimmer 8s infinite;
        }
        @keyframes tab-shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .tab-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 6px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 11.5px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: .04em;
          transition: all .22s ease;
          color: #a8a29e;
          background: transparent;
          position: relative;
          overflow: hidden;
        }
        .tab-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
          opacity: 0;
          transition: opacity 0.3s;
        }
        .tab-btn:hover::before {
          opacity: 1;
        }
        .tab-btn.active {
          background: #fff;
          color: #1c1917;
          box-shadow: 0 2px 10px rgba(0,0,0,.09), 0 1px 3px rgba(0,0,0,.05);
          transform: translateY(-1px);
        }
        .tab-btn.active .tab-dot { opacity: 1; animation: dot-bounce 2s infinite; }
        @keyframes dot-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        .tab-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          opacity: 0;
          transition: opacity .2s;
        }

        .r-tag   { 
          font-size: 10px; font-weight: 700; letter-spacing: .13em; color: #ea580c; text-transform: uppercase; margin-bottom: 10px;
          animation: slide-up-fade 0.5s ease-out;
        }
        .r-title { 
          font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1c1917; letter-spacing: -.02em; line-height: 1.2; margin-bottom: 7px;
          animation: slide-up-fade 0.6s ease-out 0.1s both;
        }
        .r-sub   { 
          font-size: 13px; color: #78716c; font-weight: 300; margin-bottom: 28px;
          animation: slide-up-fade 0.7s ease-out 0.2s both;
        }

        .lbl { 
          display: block; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #78716c; margin-bottom: 7px;
          transition: color 0.3s;
        }
        .field-wrap { 
          margin-bottom: 18px; 
          position: relative;
        }
        .fi-rel { position: relative; }
        .ficon  { 
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #c8c4c0; pointer-events: none;
          transition: all 0.3s;
        }
        .gi {
          width: 100%; height: 50px; padding: 0 14px 0 42px;
          background: #ffffff; border: 1.5px solid #e7e5e4; border-radius: 11px;
          color: #1c1917; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all .3s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
          position: relative;
        }
        .gi::placeholder { color: #c8c4c0; transition: opacity 0.3s; }
        .gi:focus {
          border-color: var(--tab-accent, #f97316);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--tab-accent, #f97316) 10%, transparent), 0 4px 12px rgba(249,115,22,0.1);
          background: #fff;
          transform: translateY(-2px);
        }
        .gi:focus + .ficon,
        .fi-rel:focus-within .ficon {
          color: var(--tab-accent, #f97316);
          transform: translateY(-50%) scale(1.1);
        }
        .field-wrap:focus-within .lbl {
          color: var(--tab-accent, #f97316);
        }

        .sib {
          width: 100%; height: 52px; border-radius: 11px; border: none; cursor: pointer;
          background: var(--tab-gradient, linear-gradient(135deg, #f97316, #ea580c));
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; letter-spacing: .05em;
          box-shadow: 0 4px 22px color-mix(in srgb, var(--tab-accent, #f97316) 40%, transparent), 0 1px 4px rgba(0,0,0,.06);
          transition: all .3s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
          margin-top: 8px;
        }
        .sib::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s;
        }
        .sib:hover:not(:disabled)::before {
          left: 100%;
        }
        .sib::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.18), transparent);
          opacity: 0; transition: opacity .2s;
        }
        .sib:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--tab-accent, #f97316) 50%, transparent), 0 0 40px rgba(249,115,22,0.2);
        }
        .sib:hover:not(:disabled)::after { opacity: 1; }
        .sib:active:not(:disabled) { transform: translateY(-1px); }
        .sib:disabled { opacity: .55; cursor: not-allowed; }
        .sib:not(:disabled) {
          animation: button-pulse 3s infinite;
        }
        @keyframes button-pulse {
          0%, 100% { box-shadow: 0 4px 22px color-mix(in srgb, var(--tab-accent, #f97316) 40%, transparent); }
          50% { box-shadow: 0 4px 30px color-mix(in srgb, var(--tab-accent, #f97316) 55%, transparent), 0 0 50px rgba(249,115,22,0.25); }
        }

        .back-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: #a8a29e; font-family: 'DM Sans', sans-serif;
          background: none; border: none; cursor: pointer;
          padding: 0; margin-bottom: 16px;
          transition: all .18s;
          font-weight: 500;
        }
        .back-btn:hover { 
          color: #57534e;
          transform: translateX(-3px);
        }
        .back-btn svg {
          transition: transform 0.3s;
        }
        .back-btn:hover svg {
          transform: translateX(-3px);
        }

        .choose-btn {
          width: 100%; padding: 16px;
          border-radius: 13px;
          border: 1.5px solid #e7e5e4;
          background: #fff;
          cursor: pointer;
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 12px;
          transition: all .3s ease;
          font-family: 'DM Sans', sans-serif;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        .choose-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 100%;
          background: var(--tab-accent, #f97316);
          transform: scaleY(0);
          transition: transform 0.3s;
        }
        .choose-btn:hover::before {
          transform: scaleY(1);
        }
        .choose-btn:hover {
          border-color: var(--tab-accent, #f97316);
          box-shadow: 0 4px 18px color-mix(in srgb, var(--tab-accent, #f97316) 12%, transparent), 0 0 30px rgba(249,115,22,0.1);
          transform: translateY(-2px) translateX(4px);
        }
        .choose-icon {
          width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--tab-accent, #f97316) 10%, white);
          color: var(--tab-accent, #f97316);
          transition: all 0.3s;
        }
        .choose-btn:hover .choose-icon {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 4px 12px color-mix(in srgb, var(--tab-accent, #f97316) 25%, transparent);
        }
        .choose-title { font-size: 13.5px; font-weight: 700; color: #1c1917; margin-bottom: 2px; }
        .choose-sub   { font-size: 11px; color: #a8a29e; }

        .name-card {
          background: color-mix(in srgb, var(--tab-accent, #f97316) 7%, white);
          border: 1px solid color-mix(in srgb, var(--tab-accent, #f97316) 20%, transparent);
          border-radius: 11px; padding: 12px 14px;
          text-align: center; margin-bottom: 16px;
          animation: card-lift 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .name-card::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: rotate(45deg);
          animation: name-card-shine 3s infinite;
        }
        @keyframes name-card-shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        .name-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: #a8a29e; margin-bottom: 3px; position: relative; z-index: 1; }
        .name-card-name  { font-size: 14px; font-weight: 700; color: #1c1917; position: relative; z-index: 1; }

        .otp-note { font-size: 12px; text-align: center; color: #78716c; margin-bottom: 16px; line-height: 1.6; }
        .otp-wrap { display: flex; justify-content: center; margin-bottom: 6px; }

        .verified-banner {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          color: #16a34a; margin-bottom: 8px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          animation: verified-bounce 0.6s ease-out;
        }
        @keyframes verified-bounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .verified-banner svg {
          animation: checkmark-draw 0.5s ease-out 0.3s both;
        }
        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }

        .divl { 
          height: 1px; 
          background: linear-gradient(to right, transparent, rgba(0,0,0,0.07), transparent); 
          margin: 24px 0;
          position: relative;
          overflow: hidden;
        }
        .divl::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, var(--tab-accent, #f97316), transparent);
          animation: divider-shine 4s infinite;
        }
        @keyframes divider-shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .r-foot { 
          font-size: 10px; letter-spacing: .12em; color: #c8c4c0; text-transform: uppercase; text-align: center;
          animation: fade-in 1s ease-out 0.5s both;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Ripple effect */
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.6);
          transform: scale(0);
          animation: ripple-effect 0.6s ease-out;
          pointer-events: none;
        }
        @keyframes ripple-effect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .left  { display: none; }
          .right { width: 100%; min-width: 100%; border-left: none; }
          .logo-container { left: 24px; }
          .logo-img { height: 44px; }
        }
      `}</style>

      {/* CSS variable injection per tab */}
      <style>{`
        .layout {
          --tab-accent: ${currentTab.accent};
          --tab-gradient: ${
            tab === "admin"    ? "linear-gradient(135deg, #f97316, #ea580c)" :
            tab === "employee" ? "linear-gradient(135deg, #3b82f6, #2563eb)" :
                                 "linear-gradient(135deg, #22c55e, #16a34a)"
          };
        }
      `}</style>

      <div className="layout">

        {/* ══ LEFT PANEL ══ */}
        <div className="left">
          <div className="video-bg" />
          <div className="video-overlay" />
          <div className="animated-gradient" />

          {/* Logo at top left */}
          <div className="logo-container">
            <img src="/TMClog0s.png" alt="TMC Logo" className="logo-img" />
          </div>

          {/* Floating particles */}
          <div className="particles">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 20}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                  opacity: 0.3 + Math.random() * 0.5,
                }}
              />
            ))}
          </div>

          {/* Sakura petals */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="petal"
              style={{
                left: `${6 + i * 11}%`,
                top: 0,
                width: `${9 + (i % 3) * 4}px`,
                height: `${9 + (i % 3) * 4}px`,
                background: `rgba(${250 - i * 4}, ${160 + i * 6}, ${175 + i * 4}, 0.72)`,
                animationDuration: `${6.5 + i * 1.3}s`,
                animationDelay: `${i * 0.85}s`,
              }}
            />
          ))}

          {/* Floating shapes */}
          <div className="floating-shape shape-1" />
          <div className="floating-shape shape-2" />
          <div className="floating-shape shape-3" />

          {/* Blobs */}
          <div className="blob blob-a" />
          <div className="blob blob-b" />
          <div className="blob blob-c" />

          {/* SVG curves */}
          <svg className="curves-svg" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <path className="c-static" d="M480,-30 Q810,110 830,430 Q850,750 590,940" stroke="rgba(249,115,22,0.07)" strokeWidth="90" strokeLinecap="round" />
            <path className="c-static" d="M540,-30 Q870,130 885,445 Q900,760 645,950" stroke="rgba(249,115,22,0.04)" strokeWidth="55" strokeLinecap="round" />
            <path className="c-anim"   d="M-10,295 Q200,218 420,308 Q635,395 820,285" stroke="rgba(249,115,22,0.26)" strokeWidth="1.5" strokeLinecap="round" />
            <path className="c-anim c-anim-2" d="M-10,335 Q215,255 435,345 Q650,432 820,328" stroke="rgba(249,115,22,0.15)" strokeWidth="1" strokeLinecap="round" />
            <path className="c-anim c-anim-3" d="M-10,525 Q185,455 405,538 Q602,615 820,498" stroke="rgba(249,115,22,0.22)" strokeWidth="1.5" strokeLinecap="round" />
            <path className="c-static" d="M0,0 Q0,200 200,200" stroke="rgba(249,115,22,0.07)" strokeWidth="1.5" fill="none" />
          </svg>

          {/* Wave strip */}
          <div className="wave-strip">
            <div className="wave-track">
              {[0, 1].map((k) => (
                <svg key={k} viewBox="0 0 800 64" width="800" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,32 C100,8 200,56 300,32 C400,8 500,56 600,32 C700,8 800,56 800,32" stroke="rgba(249,115,22,0.11)" strokeWidth="1.5" fill="none" />
                  <path d="M0,44 C100,20 200,68 300,44 C400,20 500,68 600,44 C700,20 800,68 800,44" stroke="rgba(249,115,22,0.06)" strokeWidth="1" fill="none" />
                </svg>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <motion.div className="badge badge-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.6 }}>
            <div className="bdot bdot-o" /><div><div className="blabel">System Active</div><div className="bsub">All services online</div></div>
          </motion.div>
          <motion.div className="badge badge-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.6 }}>
            <div className="bdot bdot-g" /><div><div className="blabel">99.9% Uptime</div><div className="bsub">24 / 7 monitoring</div></div>
          </motion.div>
          <motion.div className="badge badge-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.6 }}>
            <div className="bdot bdot-b" /><div><div className="blabel">TLS 1.3 Encrypted</div><div className="bsub">Secure connection</div></div>
          </motion.div>

          {/* Text content */}
          <div className="content">
            <motion.div className="tagline" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.55 }}>
              <span className="tagline-bar" /> TMC Administration
            </motion.div>
            <motion.h1 className="headline" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.65 }}>
              TMC Enterprise Portal<br />Built for <em>Professionals.</em>
            </motion.h1>
            <motion.p className="sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.6 }}>
              A centralized command center to manage your operations, monitor performance, and keep your team aligned — all in one place.
            </motion.p>
            {features.map((f, i) => (
              <motion.div key={f.title} className="fi"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.52 + i * 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="fi-icon"><f.icon style={{ width: 17, height: 17 }} /></div>
                <div>
                  <div className="fi-title">{f.title}</div>
                  <div className="fi-desc">{f.desc}</div>
                </div>
              </motion.div>
            ))}
            <div className="lf">© 2026 TigersMark Enterprise · All rights reserved</div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <motion.div
          className="right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Right panel background animations */}
          <div className="right-bg-animation">
            <div className="right-orb right-orb-1" />
            <div className="right-orb right-orb-2" />
            <div className="right-orb right-orb-3" />
          </div>
          <div className="right-grid" />

          <div className="gc">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}>
              <p className="r-tag">TigersMark Enterprise System</p>
              <h2 className="r-title">
                {tab === "admin" ? "Admin Portal" : tab === "employee" ? "Employee Portal" : "OJT Portal"}
              </h2>
              <p className="r-sub">Select your portal and sign in to continue.</p>
            </motion.div>

            {/* Tab selector */}
            <motion.div
              className="tab-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.45 }}
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`tab-btn ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <span
                    className="tab-dot"
                    style={{ background: t.accent, boxShadow: `0 0 6px ${t.accent}99` }}
                  />
                  <t.icon style={{ width: 13, height: 13 }} />
                  {t.label}
                </button>
              ))}
            </motion.div>

            {/* Form area */}
            <AnimatePresence mode="wait">

              {/* ── ADMIN TAB ── */}
              {tab === "admin" && (
                <motion.form
                  key="admin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleAdminSignIn}
                >
                  <div className="field-wrap">
                    <label className="lbl">Email Address</label>
                    <div className="fi-rel">
                      <Mail className="ficon" />
                      <input type="email" placeholder="admin@company.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} required className="gi" />
                    </div>
                  </div>
                  <div className="field-wrap">
                    <label className="lbl">Password</label>
                    <div className="fi-rel">
                      <Lock className="ficon" />
                      <input type="password" placeholder="••••••••" value={password}
                        onChange={(e) => setPassword(e.target.value)} required className="gi" />
                    </div>
                  </div>
                  <button type="submit" className="sib" disabled={loading}>
                    {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                    Sign In
                  </button>
                </motion.form>
              )}

              {/* ── EMPLOYEE / OJT TAB ── */}
              {(tab === "employee" || tab === "ojt") && (
                <motion.div
                  key={`${tab}-${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >

                  {/* CHOOSE */}
                  {step === "choose" && (
                    <>
                      <button className="choose-btn" onClick={() => setStep("email")}>
                        <div className="choose-icon"><Mail style={{ width: 20, height: 20 }} /></div>
                        <div>
                          <div className="choose-title">First Time Login</div>
                          <div className="choose-sub">Verify with company email</div>
                        </div>
                      </button>
                      <button className="choose-btn" onClick={() => setStep("signin")}>
                        <div className="choose-icon"><Lock style={{ width: 20, height: 20 }} /></div>
                        <div>
                          <div className="choose-title">Sign In</div>
                          <div className="choose-sub">Use your password</div>
                        </div>
                      </button>
                    </>
                  )}

                  {/* EMAIL */}
                  {step === "email" && (
                    <>
                      <button className="back-btn" onClick={() => setStep("choose")}>
                        <ArrowLeft style={{ width: 13, height: 13 }} /> Back
                      </button>
                      <div className="field-wrap">
                        <label className="lbl">Company Email</label>
                        <div className="fi-rel">
                          <Mail className="ficon" />
                          <input type="email" placeholder="you@tigersmarkcorp.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} className="gi" />
                        </div>
                      </div>
                      <button className="sib" onClick={handleCheckEmail} disabled={loading}>
                        {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                        Send Verification Code
                      </button>
                    </>
                  )}

                  {/* OTP */}
                  {step === "otp" && (
                    <>
                      <button className="back-btn" onClick={() => setStep("email")}>
                        <ArrowLeft style={{ width: 13, height: 13 }} /> Back
                      </button>
                      {employeeName && (
                        <div className="name-card">
                          <div className="name-card-label">Welcome</div>
                          <div className="name-card-name">{employeeName}</div>
                        </div>
                      )}
                      <p className="otp-note">
                        Enter the 6-digit code sent to <strong>{email}</strong>
                      </p>
                      <div className="otp-wrap">
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} className="w-11 h-12 text-lg font-bold rounded-lg border-border/60" />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <button className="sib" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
                        {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                        Verify Code
                      </button>
                    </>
                  )}

                  {/* SET PASSWORD */}
                  {step === "set-password" && (
                    <>
                      <div className="verified-banner">
                        <CheckCircle2 style={{ width: 18, height: 18 }} />
                        Email Verified!
                      </div>
                      <p className="otp-note" style={{ marginBottom: 18 }}>Set a password for future logins</p>
                      <div className="field-wrap">
                        <label className="lbl">New Password</label>
                        <div className="fi-rel">
                          <Lock className="ficon" />
                          <input type="password" placeholder="Min. 6 characters" value={password}
                            onChange={(e) => setPassword(e.target.value)} className="gi" />
                        </div>
                      </div>
                      <div className="field-wrap">
                        <label className="lbl">Confirm Password</label>
                        <div className="fi-rel">
                          <Lock className="ficon" />
                          <input type="password" placeholder="Confirm password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} className="gi" />
                        </div>
                      </div>
                      <button className="sib" onClick={handleSetPassword} disabled={loading}>
                        {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                        Set Password & Continue
                      </button>
                    </>
                  )}

                  {/* SIGN IN */}
                  {step === "signin" && (
                    <form onSubmit={handlePortalSignIn}>
                      <button type="button" className="back-btn" onClick={() => setStep("choose")}>
                        <ArrowLeft style={{ width: 13, height: 13 }} /> Back
                      </button>
                      <div className="field-wrap">
                        <label className="lbl">Email</label>
                        <div className="fi-rel">
                          <Mail className="ficon" />
                          <input type="email" placeholder="you@tigersmarkcorp.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} required className="gi" />
                        </div>
                      </div>
                      <div className="field-wrap">
                        <label className="lbl">Password</label>
                        <div className="fi-rel">
                          <Lock className="ficon" />
                          <input type="password" placeholder="••••••••" value={password}
                            onChange={(e) => setPassword(e.target.value)} required className="gi" />
                        </div>
                      </div>
                      <button type="submit" className="sib" disabled={loading}>
                        {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                        Sign In
                      </button>
                    </form>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            <div className="divl" />
            <p className="r-foot">Authorized Personnel Only · Contact IT for credentials</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}