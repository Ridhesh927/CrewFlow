"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useGetLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeave,
  useRejectLeave
} from "@/hooks/useLeave";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const statusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":  return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    case "REJECTED":  return "bg-red-500/15 text-red-600 border-red-500/30";
    case "PENDING":   return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    default:          return "bg-muted text-muted-foreground border-border";
  }
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

// ────────────────────────────────────────────────────────────
// Request Leave Dialog (Interns)
// ────────────────────────────────────────────────────────────
function RequestLeaveDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const { mutate: createLeave, isPending } = useCreateLeaveRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.startDate || !form.endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setError("End date cannot be before start date.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Please provide a reason for your leave.");
      return;
    }

    createLeave(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({ startDate: "", endDate: "", reason: "" });
      },
      onError: (err: any) => setError(err.response?.data?.error || err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setError(""); }}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Request Leave
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>Submit a new leave request for manager approval.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                required
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <textarea
              id="reason"
              required
              className="w-full min-h-[90px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Why are you taking leave?"
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
              Submit Request
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
export default function LeavePage() {
  const user = useAuthStore(state => state.user);
  const { data, isLoading } = useGetLeaveRequests();
  const { mutate: approveLeave, isPending: approving } = useApproveLeave();
  const { mutate: rejectLeave, isPending: rejecting } = useRejectLeave();

  if (!user) return null;

  const isManager = ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(user.role);
  const leaveRequests = data?.leaveRequests || [];

  // For interns, just show a flat table of their leaves.
  // For managers, we separate "Pending Action" and "History".
  const pendingLeaves = leaveRequests.filter((l: any) => l.status === "PENDING");
  const historyLeaves = leaveRequests.filter((l: any) => l.status !== "PENDING");

  const processing = approving || rejecting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            {isManager ? "Review and manage team leave requests." : "Track and submit your leave requests."}
          </p>
        </div>
        {!isManager && <RequestLeaveDialog />}
      </div>

      {!isManager ? (
        // INTERN VIEW
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    You haven't made any leave requests.
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDate(leave.startDate)} <span className="text-muted-foreground font-normal mx-1">to</span> {formatDate(leave.endDate)}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(leave.status)} variant="outline">
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(leave.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // MANAGER VIEW
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Actions
              {pendingLeaves.length > 0 && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                  {pendingLeaves.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingLeaves.length === 0 ? (
              <div className="flex flex-col h-48 items-center justify-center text-muted-foreground gap-3 border rounded-xl border-dashed">
                <CheckCircle2 className="h-10 w-10 opacity-40" />
                <p>No pending leave requests. You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map((leave: any) => (
                  <Card key={leave.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{leave.user?.name}</h4>
                          <span className="text-xs text-muted-foreground">· {leave.user?.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatDate(leave.startDate)} <span className="text-muted-foreground font-normal">to</span> {formatDate(leave.endDate)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 border-l-2 pl-3 ml-1">
                          "{leave.reason}"
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={processing}
                          onClick={() => rejectLeave(leave.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={processing}
                          onClick={() => approveLeave(leave.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="border rounded-lg overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>User</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyLeaves.map((leave: any) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="font-medium">{leave.user?.name}</div>
                          <div className="text-xs text-muted-foreground">{leave.user?.role}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                        <TableCell>
                          <Badge className={statusColor(leave.status)} variant="outline">
                            {leave.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
