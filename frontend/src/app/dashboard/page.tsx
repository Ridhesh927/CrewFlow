"use client";

import { useAuthStore } from "@/store/useAuthStore";
import dynamic from "next/dynamic";

const AdminDashboard = dynamic(
  () => import("@/components/dashboards/AdminDashboard").then((mod) => mod.AdminDashboard),
  { loading: () => <div className="h-96 w-full animate-pulse bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground mt-4">Loading dashboard...</div> }
);

const InternDashboard = dynamic(
  () => import("@/components/dashboards/InternDashboard").then((mod) => mod.InternDashboard),
  { loading: () => <div className="h-96 w-full animate-pulse bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground mt-4">Loading dashboard...</div> }
);

const ManagerDashboard = dynamic(
  () => import("@/components/dashboards/ManagerDashboard").then((mod) => mod.ManagerDashboard),
  { loading: () => <div className="h-96 w-full animate-pulse bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground mt-4">Loading dashboard...</div> }
);
import { TopBar } from "@/components/layout/TopBar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion } from "framer-motion";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground mt-1">Here is what&apos;s happening with your team today.</p>
      </div>

      {user.role === "ADMIN" && <AdminDashboard userId={user.id} />}
      {(user.role === "SENIOR_TL" || user.role === "TL" || user.role === "CAPTAIN") && (
        <ManagerDashboard role={user.role} userId={user.id} />
      )}
      {user.role === "INTERN" && <InternDashboard userId={user.id} />}
    </motion.div>
  );
}
