"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Star, MessageSquare, Plus, AlertCircle } from "lucide-react";
import { useGetRatings, useCreateRating } from "@/hooks/useRatings";
import { useGetAllUsers } from "@/hooks/useUsers";
import { useAuthStore } from "@/store/useAuthStore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ── Interactive Star Rating Input ────────────────────────────
function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold self-center text-amber-500">{value}/5</span>
      )}
    </div>
  );
}

// ── Helper: current month string ────────────────────────────
const currentMonth = () => {
  const d = new Date();
  return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
};

// ── Assign Rating Dialog ─────────────────────────────────────
function AssignRatingDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    rating: 0,
    comments: "",
    month: currentMonth(),
  });
  const [error, setError] = useState("");

  const { data: usersData } = useGetAllUsers();
  const currentUser = useAuthStore(state => state.user);
  const { mutate: createRating, isPending } = useCreateRating();

  // Exclude self from selector
  const rateableUsers = useMemo(() => {
    const all = usersData?.users || [];
    return all.filter((u: any) => u.id !== currentUser?.id);
  }, [usersData, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.userId) { setError("Please select a user to rate."); return; }
    if (form.rating === 0) { setError("Please select a star rating."); return; }
    if (!form.comments.trim()) { setError("Feedback comment is required."); return; }

    createRating(
      { userId: parseInt(form.userId), rating: form.rating, comments: form.comments.trim(), month: form.month },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ userId: "", rating: 0, comments: "", month: currentMonth() });
          setError("");
        },
        onError: (err: Error) => setError(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setError(""); }}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Assign Rating
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Assign Performance Rating</DialogTitle>
          <DialogDescription>Rate a team member for the selected month. One rating per person per month.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">

          {/* User selector */}
          <div className="space-y-2">
            <Label>Select User *</Label>
            <Select value={form.userId} onValueChange={v => setForm(f => ({ ...f, userId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member..." />
              </SelectTrigger>
              <SelectContent>
                {rateableUsers.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} — {u.role} · {u.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month */}
          <div className="space-y-2">
            <Label htmlFor="rating-month">Month / Period</Label>
            <Input
              id="rating-month"
              value={form.month}
              onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
              placeholder="e.g. July 2026"
            />
          </div>

          {/* Star rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <StarRatingInput value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            <div className="grid grid-cols-5 text-center text-[10px] text-muted-foreground px-0.5">
              <span>Poor</span><span>Below Avg</span><span>Average</span><span>Good</span><span>Excellent</span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="rating-comments">Feedback / Comments *</Label>
            <textarea
              id="rating-comments"
              className="w-full min-h-[90px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={form.comments}
              onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
              placeholder="Describe performance, areas of improvement..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Rating
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function RatingsPage() {
  const { data, isLoading } = useGetRatings();
  const currentUser = useAuthStore(state => state.user);
  const canRate = currentUser && ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(currentUser.role);

  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const ratings = data?.ratings || [];

  const departments = ["ALL", ...Array.from(new Set(ratings.map((r: any) => r.user?.department).filter(Boolean)))] as string[];
  const roles = ["ALL", ...Array.from(new Set(ratings.map((r: any) => r.user?.role).filter(Boolean)))] as string[];
  const months = ["ALL", ...Array.from(new Set(ratings.map((r: any) => r.month).filter(Boolean)))] as string[];

  const filteredRatings = ratings.filter((r: any) => {
    const matchesDept = departmentFilter === "ALL" || r.user?.department === departmentFilter;
    const matchesRole = roleFilter === "ALL" || r.user?.role === roleFilter;
    const matchesMonth = monthFilter === "ALL" || r.month === monthFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (r.user?.name || "").toLowerCase().includes(q) ||
      (r.user?.specialId || "").toLowerCase().includes(q) ||
      (r.comments || "").toLowerCase().includes(q);
    return matchesDept && matchesRole && matchesMonth && matchesSearch;
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/30"}`} />
      ))}
      <span className="ml-1.5 font-semibold text-sm">{rating}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Ratings</h1>
          <p className="text-muted-foreground mt-1">View and assign monthly performance ratings.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-full md:w-[220px] focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="search"
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Group" /></SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept === "ALL" ? "All Groups" : dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>{role === "ALL" ? "All Roles" : role}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month === "ALL" ? "All Months" : month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canRate && <AssignRatingDialog />}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[220px]">User</TableHead>
              <TableHead>Group & Role</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Rated By</TableHead>
              <TableHead>Month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading ratings...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRatings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No ratings found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredRatings.map((rating: any) => (
                <TableRow key={rating.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{rating.user?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground truncate">{rating.user?.email}</span>
                      <span className="text-xs text-muted-foreground">{rating.user?.specialId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className="text-xs">{rating.user?.department || "N/A"}</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">{rating.user?.role || "N/A"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(rating.rating)}</TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm truncate" title={rating.comments}>{rating.comments}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{rating.rater?.name || "System"}</span>
                      <span className="text-xs text-muted-foreground">{rating.rater?.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rating.month}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
