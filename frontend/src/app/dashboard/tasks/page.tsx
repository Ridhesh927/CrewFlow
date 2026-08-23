"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Plus, Upload, CheckCircle2, Clock, XCircle,
  Calendar, ImageIcon as ImageIconLucide, CheckSquare, Trash2, AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  useGetTasks, useGetPendingProofs, useCreateTask,
  useSubmitProof, useApproveProof, useRejectProof
} from "@/hooks/useTasks";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":    return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    case "pending":   return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    case "completed": return "bg-blue-500/15 text-blue-600 border-blue-500/30";
    case "archived":  return "bg-muted text-muted-foreground border-border";
    case "approved":  return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    case "rejected":  return "bg-red-500/15 text-red-600 border-red-500/30";
    default:          return "bg-muted text-muted-foreground border-border";
  }
};

const formatDeadline = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

// ────────────────────────────────────────────────────────────
// Create Task Dialog (managers)
// ────────────────────────────────────────────────────────────
function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const [subTaskInput, setSubTaskInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAudience: "All",
    deadline: "",
    subTasks: [] as { title: string }[],
  });
  const { mutate: createTask, isPending } = useCreateTask();

  const addSubTask = () => {
    const t = subTaskInput.trim();
    if (!t) return;
    setForm(f => ({ ...f, subTasks: [...f.subTasks, { title: t }] }));
    setSubTaskInput("");
  };

  const removeSubTask = (i: number) =>
    setForm(f => ({ ...f, subTasks: f.subTasks.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({ title: "", description: "", targetAudience: "All", deadline: "", subTasks: [] });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Create Campaign
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New Campaign Task</DialogTitle>
          <DialogDescription>Create a social media task and assign it to your team.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ct-title">Task Title</Label>
            <Input id="ct-title" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. LinkedIn Repost Campaign" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-desc">Description</Label>
            <textarea
              id="ct-desc" required
              className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what interns need to do..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={form.targetAudience} onValueChange={v => setForm(f => ({ ...f, targetAudience: v || "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Groups</SelectItem>
                  <SelectItem value="MERN Stack">MERN Stack</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-deadline">Deadline</Label>
              <Input id="ct-deadline" type="datetime-local" required value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          {/* Sub-tasks */}
          <div className="space-y-2">
            <Label>Sub-Tasks / Checklist (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Like the post"
                value={subTaskInput}
                onChange={e => setSubTaskInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubTask(); } }}
              />
              <Button type="button" variant="outline" onClick={addSubTask}>Add</Button>
            </div>
            {form.subTasks.length > 0 && (
              <ul className="space-y-1 pt-1">
                {form.subTasks.map((st, i) => (
                  <li key={i} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-md bg-muted/50">
                    <span>{st.title}</span>
                    <button type="button" onClick={() => removeSubTask(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────
// Submit Proof Dialog (interns)
// ────────────────────────────────────────────────────────────
function SubmitProofDialog({ task, onClose }: { task: any; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [checkedSubTasks, setCheckedSubTasks] = useState<number[]>([]);
  const [error, setError] = useState("");
  const { mutate: submitProof, isPending } = useSubmitProof();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5MB."); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSubTask = (id: number) =>
    setCheckedSubTasks(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a screenshot image."); return; }

    const fd = new FormData();
    fd.append("taskId", String(task.id));
    fd.append("completedSubTasks", JSON.stringify(checkedSubTasks));
    fd.append("image", file);

    submitProof(fd, {
      onSuccess: () => onClose(),
      onError: (err: Error) => setError(err.message),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="rounded-lg border bg-muted/30 p-3">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Due: {formatDeadline(task.deadline)}</p>
      </div>

      {task.subTasks?.length > 0 && (
        <div className="space-y-2">
          <Label>Mark completed sub-tasks</Label>
          <div className="space-y-1">
            {task.subTasks.map((st: any) => (
              <label key={st.id} className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={checkedSubTasks.includes(st.id)}
                  onChange={() => toggleSubTask(st.id)}
                />
                {st.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Screenshot Proof *</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-md object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIconLucide className="h-8 w-8" />
              <p className="text-sm font-medium">Click to upload screenshot</p>
              <p className="text-xs">JPEG, PNG — max 5MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Submit Proof
        </Button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Manager View
// ────────────────────────────────────────────────────────────
function ManagerTasksView({ userRole }: { userRole: string }) {
  const { data: tasksData, isLoading: loadingTasks } = useGetTasks();
  const { data: proofsData, isLoading: loadingProofs } = useGetPendingProofs();
  const { mutate: approveProof, isPending: approving } = useApproveProof();
  const { mutate: rejectProof, isPending: rejecting } = useRejectProof();
  const [proofImg, setProofImg] = useState<string | null>(null);

  const tasks = tasksData?.tasks || [];
  const pendingProofs = proofsData?.proofs || [];
  const canCreateTask = ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns & Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage social media campaigns and verify intern proofs.</p>
        </div>
        {canCreateTask && <CreateTaskDialog />}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
          <TabsTrigger value="proofs">
            Pending Proofs
            {pendingProofs.length > 0 && (
              <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                {pendingProofs.length > 9 ? "9+" : pendingProofs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── All Campaigns ── */}
        <TabsContent value="campaigns" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[280px]">Campaign Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-center">Total Proofs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTasks ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Loading campaigns...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No campaigns found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task: any) => (
                    <TableRow key={task.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">{task.description}</p>
                          {task.subTasks?.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.subTasks.length} sub-tasks</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.targetAudience}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDeadline(task.deadline)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {task._count?.proofs ?? 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Pending Proofs ── */}
        <TabsContent value="proofs" className="mt-4">
          {loadingProofs ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingProofs.length === 0 ? (
            <div className="flex flex-col h-48 items-center justify-center text-muted-foreground gap-3">
              <CheckCircle2 className="h-10 w-10 opacity-40" />
              <p>No pending proofs — you&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProofs.map((proof: any) => (
                <Card key={proof.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => proof.imageUrl && setProofImg(proof.imageUrl)}
                        >
                          {proof.imageUrl ? (
                            <img src={proof.imageUrl} alt="proof" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIconLucide className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{proof.task?.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            By <span className="font-medium text-foreground">{proof.intern?.name}</span>
                            {proof.intern?.specialId && ` · ${proof.intern.specialId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{proof.intern?.department}</p>
                          {proof.task?.subTasks?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {proof.task.subTasks.map((st: any) => (
                                <span
                                  key={st.id}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                    proof.completedSubTasks?.includes(st.id)
                                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {proof.completedSubTasks?.includes(st.id) ? "✓ " : ""}{st.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={rejecting || approving}
                          onClick={() => rejectProof(proof.id)}
                        >
                          {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={approving || rejecting}
                          onClick={() => approveProof(proof.id)}
                        >
                          {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {proofImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setProofImg(null)}
        >
          <img src={proofImg} alt="proof full" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Intern View
// ────────────────────────────────────────────────────────────
function InternTasksView() {
  const { data: tasksData, isLoading } = useGetTasks();
  const [activeProofTask, setActiveProofTask] = useState<any | null>(null);

  const tasks = tasksData?.tasks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground mt-1">View your assigned campaigns and submit proof of completion.</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-muted-foreground gap-3 border rounded-xl border-dashed">
          <CheckSquare className="h-10 w-10 opacity-40" />
          <p>No active tasks assigned to you right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task: any) => {
            const myProof = task.proofs?.[0];
            const hasSubmitted = !!myProof;
            const proofStatus = myProof?.status;

            return (
              <Card key={task.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-base leading-snug">{task.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{task.description}</CardDescription>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3.5 w-3.5" />
                    Due: {formatDeadline(task.deadline)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4 border-t pt-4">
                  {task.subTasks?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">CHECKLIST</p>
                      {task.subTasks.map((st: any) => (
                        <div key={st.id} className="flex items-center gap-2 text-sm">
                          <div className="h-4 w-4 rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                            {proofStatus === "Approved" ? "✓" : ""}
                          </div>
                          <span>{st.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    {hasSubmitted ? (
                      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${statusColor(proofStatus)}`}>
                        {proofStatus === "Pending" && <Clock className="h-4 w-4 shrink-0" />}
                        {proofStatus === "Approved" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        {proofStatus === "Rejected" && <XCircle className="h-4 w-4 shrink-0" />}
                        <span className="font-medium">Proof {proofStatus}</span>
                        {proofStatus === "Rejected" && (
                          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs"
                            onClick={() => setActiveProofTask(task)}>
                            <Upload className="h-3 w-3 mr-1" /> Resubmit
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button className="w-full" onClick={() => setActiveProofTask(task)}>
                        <Upload className="mr-2 h-4 w-4" /> Submit Proof
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Proof Dialog — Base UI pattern (no asChild) */}
      <Dialog open={!!activeProofTask} onOpenChange={open => { if (!open) setActiveProofTask(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Proof</DialogTitle>
            <DialogDescription>Upload a screenshot showing you completed this task.</DialogDescription>
          </DialogHeader>
          {activeProofTask && (
            <SubmitProofDialog
              task={activeProofTask}
              onClose={() => setActiveProofTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
export default function TasksPage() {
  useDocumentTitle("Tasks");
  const user = useAuthStore(state => state.user);
  if (!user) return null;

  const isManager = ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(user.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {isManager ? <ManagerTasksView userRole={user.role} /> : <InternTasksView />}
    </motion.div>
  );
}
