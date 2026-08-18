"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, Search, Edit2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetAllUsers, useUpdateUser } from "@/hooks/useUsers";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ────────────────────────────────────────────────────────────
// Reassign Manager Dialog
// ────────────────────────────────────────────────────────────
function ReassignManagerDialog({ user, open, onOpenChange, allUsers }: { user: any; open: boolean; onOpenChange: (open: boolean) => void; allUsers: any[] }) {
  const [managerId, setManagerId] = useState<string>(user?.managerId ? String(user.managerId) : "none");
  const { mutate: updateUser, isPending } = useUpdateUser();

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(
      { id: user.id, data: { managerId: managerId === "none" ? null : parseInt(managerId) } },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  // Filter potential managers (Admins, Senior TLs, TLs, Captains) who are not the user themselves
  const potentialManagers = allUsers.filter(u => 
    u.id !== user.id && ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(u.role)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign Manager</DialogTitle>
          <DialogDescription>
            Change the reporting manager for <strong>{user?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleReassign} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Select New Manager</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {potentialManagers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name} ({m.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
export default function TeamPage() {
  const currentUser = useAuthStore(state => state.user);
  const { data, isLoading } = useGetAllUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [reassignUser, setReassignUser] = useState<any | null>(null);

  if (!currentUser) return null;

  const isAdminOrSenior = ["ADMIN", "SENIOR_TL"].includes(currentUser.role);
  const allUsers = data?.users || [];

  // If Admin/Senior TL, they can see everyone (or we could just show their direct reports).
  // The task asks for "list of direct subordinates". Let's show direct subordinates by default.
  // If ADMIN, maybe show a toggle or just show direct subordinates. Let's just do direct subordinates.
  const directSubordinates = allUsers.filter((u: any) => u.managerId === currentUser.id);

  const filteredTeam = directSubordinates.filter((u: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.specialId || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
          <p className="text-muted-foreground mt-1">
            People who report directly to you.
          </p>
        </div>
        <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-full sm:w-[250px] focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
          <input
            type="search"
            placeholder="Search team..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : directSubordinates.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-muted-foreground gap-3 border rounded-xl border-dashed">
          <Users className="h-10 w-10 opacity-40" />
          <p>You have no direct subordinates assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((member: any) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{member.email}</CardDescription>
                      {member.specialId && <Badge variant="secondary" className="mt-1.5 text-[10px]">{member.specialId}</Badge>}
                    </div>
                  </div>
                  {isAdminOrSenior && (
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setReassignUser(member)}
                      title="Reassign Manager"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">{member.role}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{member.department || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Points</span>
                  <span className="font-medium text-amber-500">{member.points} ⭐</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {member.isActive ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active</>
                    ) : (
                      <><ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Inactive</>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reassign Manager Dialog */}
      {reassignUser && (
        <ReassignManagerDialog
          user={reassignUser}
          open={!!reassignUser}
          onOpenChange={(open) => !open && setReassignUser(null)}
          allUsers={allUsers}
        />
      )}
    </motion.div>
  );
}
