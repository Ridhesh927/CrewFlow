"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, User, Mail, Phone, Hash, Shield, Building, Edit2, Save, Star, CheckSquare, CalendarClock } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetUserById, useUpdateProfile } from "@/hooks/useUsers";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const currentUser = useAuthStore(state => state.user);
  const { data, isLoading } = useGetUserById(currentUser?.id as number);
  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phoneNo: "",
  });

  const user = data?.user;

  // Initialize form when editing starts
  const handleEdit = () => {
    setForm({
      name: user?.name || "",
      phoneNo: user?.phoneNo || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile(
      { id: user.id, data: form },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    setPwdLoading(true);
    try {
      const { executeApiRequest } = await import("@/services/api");
      const data = await executeApiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (data.success) {
        setPwdMessage(data.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-muted-foreground gap-3">
        <User className="h-10 w-10 opacity-40" />
        <p>Profile not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and view your performance stats.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Details Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your contact details and role information.</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-6 mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0 border border-primary/20 shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                {isEditing ? (
                  <Input 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="max-w-[300px]"
                  />
                ) : (
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">{user.role}</Badge>
                  {user.department && <Badge variant="outline" className="text-[10px] uppercase">{user.department}</Badge>}
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </Label>
                <p className="font-medium text-sm px-1">{user.email}</p>
                <p className="text-[10px] text-muted-foreground px-1 italic">Cannot be changed</p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </Label>
                {isEditing ? (
                  <Input 
                    value={form.phoneNo} 
                    onChange={e => setForm(f => ({ ...f, phoneNo: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="font-medium text-sm px-1">{user.phoneNo || "Not provided"}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <Hash className="h-3.5 w-3.5" /> Special ID
                </Label>
                <p className="font-medium text-sm px-1">{user.specialId || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <User className="h-3.5 w-3.5" /> Reporting Manager
                </Label>
                <p className="font-medium text-sm px-1">
                  {user.manager ? `${user.manager.name} (${user.manager.role})` : "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Performance Stats</CardTitle>
            <CardDescription>Your overall metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 border-t border-border/50 flex-1 flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><Star className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reward Points</p>
                  <p className="text-2xl font-bold text-primary">{user.points}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-md text-amber-500"><Star className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Rating</p>
                  <p className="text-xl font-bold text-amber-600">
                    {user.stats?.avgRating > 0 ? `${user.stats.avgRating} / 5.0` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500"><CheckSquare className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tasks Done</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {user.stats?.taskCompletions} <span className="text-sm font-normal text-muted-foreground">/ {user.stats?.totalTasks}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-md text-blue-500"><CalendarClock className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Attendance</p>
                  <p className="text-xl font-bold text-blue-600">
                    {user.stats?.attendanceRate}%
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password securely.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 border-t border-border/50 max-w-md">
            {pwdMessage && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-md mb-4 text-sm">
                {pwdMessage}
              </div>
            )}
            {pwdError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-4 text-sm">
                {pwdError}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={pwdLoading}>
                {pwdLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
