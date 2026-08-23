"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Megaphone, Trash2, Calendar, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useGetAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement
} from "@/hooks/useAnnouncements";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { 
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  });
};

// ────────────────────────────────────────────────────────────
// Create Announcement Dialog (Admins / Managers)
// ────────────────────────────────────────────────────────────
function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    targetRole: "",
    targetDepartment: "",
  });
  const [error, setError] = useState("");
  
  const user = useAuthStore(state => state.user);
  const { mutate: createAnnouncement, isPending } = useCreateAnnouncement();

  const isGlobalAllowed = user?.role === "ADMIN" || user?.role === "SENIOR_TL";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }

    createAnnouncement(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({ title: "", content: "", targetRole: "", targetDepartment: "" });
      },
      onError: (err: any) => setError(err.response?.data?.error || err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setError(""); }}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Create Announcement
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
          <DialogDescription>Broadcast a message to your team or the entire organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              placeholder="e.g. Townhall Meeting Tomorrow"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message Content *</Label>
            <textarea
              id="content"
              required
              className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Write your announcement here..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Group</Label>
              <Select 
                value={form.targetDepartment} 
                onValueChange={v => setForm(f => ({ ...f, targetDepartment: v && v !== "ALL" ? v : "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Groups</SelectItem>
                  {isGlobalAllowed && <SelectItem value="MERN Stack">MERN Stack</SelectItem>}
                  {isGlobalAllowed && <SelectItem value="Marketing">Marketing</SelectItem>}
                  {isGlobalAllowed && <SelectItem value="Design">Design</SelectItem>}
                  {!isGlobalAllowed && user?.department && <SelectItem value={user.department}>{user.department}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select 
                value={form.targetRole} 
                onValueChange={v => setForm(f => ({ ...f, targetRole: v && v !== "ALL" ? v : "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="INTERN">Interns</SelectItem>
                  {isGlobalAllowed && <SelectItem value="TL">Team Leaders</SelectItem>}
                  {isGlobalAllowed && <SelectItem value="CAPTAIN">Captains</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            Leaving targets as &quot;All&quot; will make this a global announcement (requires Admin/Senior TL privileges).
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
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
export default function AnnouncementsPage() {
  const user = useAuthStore(state => state.user);
  
  const isAdmin = user?.role === "ADMIN";
  const { data, isLoading } = useGetAnnouncements(isAdmin);
  const { mutate: deleteAnnouncement, isPending: deleting } = useDeleteAnnouncement();

  if (!user) return null;

  const canCreate = ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(user.role);
  
  const announcements = data?.announcements || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with the latest news and broadcasts.
          </p>
        </div>
        {canCreate && <CreateAnnouncementDialog />}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col h-48 items-center justify-center text-muted-foreground gap-3 border rounded-xl border-dashed">
            <Megaphone className="h-10 w-10 opacity-40" />
            <p>No announcements available right now.</p>
          </div>
        ) : (
          announcements.map((announcement: any) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary shrink-0" />
                      {announcement.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{announcement.author?.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(announcement.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tags & Delete Action */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex gap-1.5">
                      {announcement.targetDepartment ? (
                        <Badge variant="outline" className="text-[10px] uppercase">{announcement.targetDepartment}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] uppercase">Global</Badge>
                      )}
                      {announcement.targetRole && (
                        <Badge variant="outline" className="text-[10px] uppercase">{announcement.targetRole}</Badge>
                      )}
                    </div>
                    
                    {(isAdmin || announcement.authorId === user.id) && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        disabled={deleting}
                        onClick={() => deleteAnnouncement(announcement.id)}
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {announcement.content}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
