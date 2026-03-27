import { LayoutDashboard, LogOut, User, Flame } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/ojt", icon: LayoutDashboard },
  { title: "Profile", url: "/ojt/profile", icon: User },
];

export function OjtSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg glow-sm-primary">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[15px] text-foreground tracking-tight">OJT Portal</h2>
            <p className="text-[10px] text-primary font-medium">TigersMark Corp</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/ojt"}
                      className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-sidebar-foreground/70 hover:text-primary hover:bg-accent"
                      activeClassName="gradient-primary text-white font-semibold shadow-md glow-sm-primary"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors group-[.gradient-primary]:bg-white/20">
                        <item.icon className="w-[18px] h-[18px]" />
                      </div>
                      <span className="flex-1">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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
