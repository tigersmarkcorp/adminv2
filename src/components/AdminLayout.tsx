import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Loader2, Flame, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center glow-primary animate-pulse-slow">
          <Flame className="w-7 h-7 text-primary-foreground" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-30 h-16 flex items-center justify-between border-b border-border/60 px-4 md:px-6 bg-card/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2" />
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10 w-64 h-9 bg-muted/50 border-0 rounded-xl text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
              </button>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                A
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
