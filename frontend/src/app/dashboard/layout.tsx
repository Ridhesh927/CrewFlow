"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only check auth after hydration is complete
    if (isHydrated && !user) {
      router.push("/login");
    }
  }, [user, router, isHydrated]);

  if (!isHydrated || !user) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <TopBar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
