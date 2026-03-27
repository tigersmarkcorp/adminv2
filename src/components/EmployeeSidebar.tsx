import { LayoutDashboard, FolderOpen, LogOut, User, Flame } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/employee", icon: LayoutDashboard },
  { title: "Forms / Files", url: "/employee/files", icon: FolderOpen },
  { title: "Profile", url: "/employee/profile", icon: User },
];

export function EmployeeSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar
      className="border-r-0"
      style={{
        "--sidebar-background": "220 55% 18%",
        "--sidebar-foreground": "0 0% 100%",
        "--sidebar-accent": "14 100% 50%",
        "--sidebar-accent-foreground": "0 0% 100%",
        "--sidebar-border": "220 55% 25%",
        "--sidebar-primary": "14 100% 50%",
        "--sidebar-primary-foreground": "0 0% 100%",
      } as React.CSSProperties}
    >
      <SidebarHeader className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[15px] text-white tracking-tight">Employee Portal</h2>
            <p className="text-[10px] font-medium text-primary">TigersMark Corp</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/employee"}
                      className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-white/60 hover:text-white hover:bg-white/10"
                      activeClassName="!bg-primary !text-white font-semibold shadow-lg"
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                      <span className="flex-1">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0 border-t-0 relative overflow-hidden">
        {/* Orange wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none">
          <svg viewBox="0 0 260 112" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 60C40 40 80 80 130 65C180 50 220 75 260 55V112H0V60Z" fill="hsl(14, 100%, 50%)" fillOpacity="0.25" />
            <path d="M0 80C50 60 100 95 150 80C200 65 240 85 260 75V112H0V80Z" fill="hsl(14, 100%, 50%)" fillOpacity="0.5" />
            <path d="M0 95C30 85 70 105 130 92C190 79 230 98 260 90V112H0V95Z" fill="hsl(14, 100%, 50%)" fillOpacity="0.9" />
          </svg>
          <div className="absolute bottom-5 left-6 w-2 h-2 rounded-full bg-primary/80" />
          <div className="absolute bottom-8 left-12 w-3 h-3 rounded-full bg-primary/60" />
          <div className="absolute bottom-3 left-16 w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>

        <div className="relative z-10 p-3 pb-6">
          <button
            onClick={signOut}
            className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
