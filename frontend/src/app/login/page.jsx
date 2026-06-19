"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

  // For the prototype, we use quick login buttons
  const handleQuickLogin = (role) => {
    setIsLoading(true);
    setTimeout(() => {
      login(role);
      router.push("/dashboard");
    }, 600);
  };

  const handleStandardLogin = (e) => {
    e.preventDefault();
    handleQuickLogin("intern"); // Default to intern for standard login demo
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/30 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Building2 className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">UpToSkills</h1>
          <p className="text-muted-foreground">Intern Management System</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/90">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required defaultValue="intern@uptoskills.com" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input id="password" type="password" required defaultValue="password123" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or quick login as (Prototype)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => handleQuickLogin("admin")} disabled={isLoading}>
                Admin
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickLogin("seniortl")} disabled={isLoading}>
                Senior TL
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickLogin("tl")} disabled={isLoading}>
                Team Lead
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickLogin("captain")} disabled={isLoading}>
                Captain
              </Button>
              <Button variant="outline" size="sm" className="col-span-2" onClick={() => handleQuickLogin("intern")} disabled={isLoading}>
                Intern
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
