"use client";

import { motion } from "framer-motion";

export default function UsersPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage system users, roles, and departments.</p>
      </div>
      
      <div className="p-12 text-center border rounded-xl border-dashed">
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Prototype Placeholder</h3>
        <p className="text-sm text-muted-foreground">The data table for managing users will go here.</p>
      </div>
    </motion.div>
  );
}
