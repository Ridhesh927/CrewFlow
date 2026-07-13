"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Star, 
  CheckSquare, 
  Settings,
  LogOut,
  Building2,
  Menu
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  // Define links based on role
  const getNavLinks = () => {
    const commonLinks = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    if (user.role === "ADMIN") {
      return [
        ...commonLinks,
        { name: "User Management", href: "/dashboard/users", icon: Users },
        { name: "All Attendance", href: "/dashboard/attendance", icon: CalendarDays },
        { name: "Ratings Overview", href: "/dashboard/ratings", icon: Star },
        { name: "Campaigns", href: "/dashboard/tasks", icon: CheckSquare },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    }
    
    if (user.role === "SENIOR_TL" || user.role === "TL") {
      return [
        ...commonLinks,
        { name: "My Team", href: "/dashboard/team", icon: Users },
        { name: "Attendance", href: "/dashboard/attendance", icon: CalendarDays },
        { name: "Verify Proofs", href: "/dashboard/tasks", icon: CheckSquare },
      ];
    }

    if (user.role === "CAPTAIN") {
      return [
        ...commonLinks,
        { name: "My Interns", href: "/dashboard/team", icon: Users },
        { name: "Mark Attendance", href: "/dashboard/attendance", icon: CalendarDays },
        { name: "Verify Proofs", href: "/dashboard/tasks", icon: CheckSquare },
      ];
    }

    // INTERN
    return [
      ...commonLinks,
      { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      { name: "My Attendance", href: "/dashboard/attendance", icon: CalendarDays },
      { name: "My Ratings", href: "/dashboard/ratings", icon: Star },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <img src="/crewflow fevicon.png" alt="CrewFlow Logo" className="h-10 w-10 mr-3 object-contain drop-shadow-sm" />
          <span className="font-bold text-lg tracking-tight">Intern Management</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
