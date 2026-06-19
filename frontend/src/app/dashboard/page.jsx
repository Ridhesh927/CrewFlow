"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { InternDashboard } from "@/components/dashboards/InternDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { motion } from "framer-motion";

export default function DashboardPage() {
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
        <p className="text-muted-foreground mt-1">Here is what's happening with your team today.</p>
      </div>

      {user.role === "ADMIN" && <AdminDashboard />}
      {(user.role === "SENIOR_TL" || user.role === "TL" || user.role === "CAPTAIN") && (
        <ManagerDashboard role={user.role} />
      )}
      {user.role === "INTERN" && <InternDashboard />}
    </motion.div>
  );
}
