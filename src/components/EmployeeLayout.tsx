import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Loader2, Flame } from "lucide-react";

export default function EmployeeLayout() {
  const { user, isEmployee, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-14 h-14 rounded-2xl bg-employee-navy flex items-center justify-center animate-pulse-slow shadow-lg">
          <Flame className="w-7 h-7 text-primary" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isEmployee) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <EmployeeSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 h-14 flex items-center border-b border-employee-soft px-4 md:px-6 bg-card/90 backdrop-blur-xl">
            <SidebarTrigger className="mr-3" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md gradient-employee-navy flex items-center justify-center shadow-sm">
                <Flame className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-employee-navy">Employee Portal</h2>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
