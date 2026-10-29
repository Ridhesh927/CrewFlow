"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied({ 
  title = "Access Denied",
  message = "You do not have permission to access this page. This area is restricted to administrators." 
}: { 
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      <Link href="/dashboard">
        <Button variant="outline">Return to Dashboard</Button>
      </Link>
    </div>
  );
}

export default AccessDenied;
