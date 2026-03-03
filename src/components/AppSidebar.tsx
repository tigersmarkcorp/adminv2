import { LayoutDashboard, Users, HardHat, FolderOpen, LogOut, GraduationCap, Clock, CalendarClock, ChevronRight, Flame, History, Link2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { PhilippineTime } from "@/components/PhilippineTime";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Employees", url: "/admin/employees", icon: Users },
  { title: "Workers", url: "/admin/workers", icon: HardHat },
  { title: "OJT", url: "/admin/ojt", icon: GraduationCap },
];

const scheduleNav = [
  { title: "Fixed Schedule", url: "/admin/fixed", icon: Clock },
  { title: "Flexible Schedule", url: "/admin/flexible", icon: CalendarClock },
];

const otherNav = [
  { title: "Forms / Files", url: "/admin/files", icon: FolderOpen },
  { title: "Account Sync", url: "/admin/sync", icon: Link2 },
  { title: "View History", url: "/admin/history", icon: History },
];

const NavSection = ({ label, items }: { label: string; items: typeof mainNav }) => (
  <SidebarGroup>
    <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 px-4 mb-1 font-semibold">{label}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                end={item.url === "/admin"}
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
                activeClassName="bg-primary text-white font-semibold shadow-md"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/15 transition-colors group-[.bg-primary]:bg-white/20">
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1">{item.title}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

export function AppSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-sm-primary">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-[15px] text-foreground tracking-tight">Admin Portal</h2>
            <p className="text-[10px] text-primary font-medium">Enterprise System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-1">
        <NavSection label="Main Menu" items={mainNav} />
        <NavSection label="Schedule" items={scheduleNav} />
        <NavSection label="Resources" items={otherNav} />

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-2 py-2">
              <PhilippineTime />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <button
          onClick={signOut}
          className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
          </div>
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
