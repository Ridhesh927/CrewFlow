"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Your personal information and details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
          <p className="text-lg font-semibold">{user.name}</p>
        </div>
        
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
          <p className="text-lg font-semibold">{user.email}</p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Intern ID</h3>
          <p className="text-lg font-semibold">{user.specialId || "N/A"}</p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Domain</h3>
          <p className="text-lg font-semibold">{user.department || "N/A"}</p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Role</h3>
          <p className="text-lg font-semibold">{user.role}</p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm col-span-full md:col-span-1 lg:col-span-1 flex flex-col justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Offer Letter</h3>
            <p className="text-sm text-muted-foreground mb-4">View or download your offer letter.</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => alert("Offer letter download not implemented yet")}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
