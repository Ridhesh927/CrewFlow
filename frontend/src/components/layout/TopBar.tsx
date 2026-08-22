"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user);
  const { setTheme, theme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").substring(0, 2);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2 text-muted-foreground"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold tracking-tight">
            {user.role === 'ADMIN' ? 'Admin Workspace' : 
             user.role === 'INTERN' ? 'My Dashboard' : 
             'Team Management'}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative text-muted-foreground h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground outline-none ring-ring focus-visible:ring-2">
            <Bell className="h-5 w-5 pointer-events-none" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground pointer-events-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup className="flex justify-between items-center p-2">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs h-7 text-primary">
                  Mark all read
                </Button>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex flex-col p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-semibold ${
                        notif.type === 'SUCCESS' ? 'text-green-500' :
                        notif.type === 'WARNING' ? 'text-orange-500' : 'text-blue-500'
                      }`}>
                        {notif.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm ${!notif.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="outline" 
                className="w-full text-xs" 
                onClick={() => router.push('/dashboard/notifications')}
              >
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none ring-ring focus-visible:ring-2 flex items-center justify-center cursor-pointer">
            <Avatar className="h-8 w-8 border border-border hover:opacity-80 transition-opacity pointer-events-none">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="mt-1 flex items-center pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer w-full" onClick={() => router.push("/dashboard/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer w-full" onClick={() => router.push("/dashboard/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
              onClick={() => {
                // Mock logout behavior
                window.location.href = "/login";
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
