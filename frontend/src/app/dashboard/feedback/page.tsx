"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetFeedback, useSubmitFeedback, useUpdateFeedbackStatus } from "@/hooks/useFeedback";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion } from "framer-motion";
import { MessageSquarePlus, MessageSquareWarning, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function FeedbackPage() {
  useDocumentTitle("Feedback & Grievances");
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useGetFeedback();
  const submitFeedback = useSubmitFeedback();
  const updateStatus = useUpdateFeedbackStatus();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "Suggestion",
    subject: "",
    description: ""
  });

  const [adminDialog, setAdminDialog] = useState<{ isOpen: boolean; feedback: any }>({ isOpen: false, feedback: null });
  const [adminNotes, setAdminNotes] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ type: "Suggestion", subject: "", description: "" });
      }
    });
  };

  const handleAdminSubmit = () => {
    if (!adminDialog.feedback) return;
    updateStatus.mutate(
      { id: adminDialog.feedback.id, data: { status: adminStatus, adminNotes } },
      {
        onSuccess: () => {
          setAdminDialog({ isOpen: false, feedback: null });
        }
      }
    );
  };

  const feedbacks = data?.feedback || [];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback & Grievances</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "ADMIN" ? "Review and manage employee feedback." : "Submit suggestions or report grievances anonymously."}
          </p>
        </div>

        {user?.role !== "ADMIN" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <MessageSquarePlus className="mr-2 h-4 w-4" /> Submit Feedback
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Feedback</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val || "" })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Suggestion">Suggestion</SelectItem>
                      <SelectItem value="Grievance">Grievance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea required className="min-h-[100px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={submitFeedback.isPending}>Submit</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feedbacks.map((item: any) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div className="flex justify-between items-start mb-3">
              <Badge variant={item.type === "Grievance" ? "destructive" : "secondary"}>
                {item.type}
              </Badge>
              <Badge variant={item.status === "OPEN" ? "outline" : item.status === "RESOLVED" ? "default" : "secondary"}>
                {item.status.replace("_", " ")}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-lg mb-2">{item.subject}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {item.description}
            </p>

            {user?.role === "ADMIN" && (
              <div className="text-xs text-muted-foreground mb-4 pt-2 border-t">
                Submitted by: {item.user?.name} ({item.user?.department || "N/A"})
              </div>
            )}

            {item.adminNotes && (
              <div className="bg-muted p-3 rounded-md text-sm mb-4">
                <strong>Admin Notes:</strong> {item.adminNotes}
              </div>
            )}

            {user?.role === "ADMIN" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-auto"
                onClick={() => {
                  setAdminStatus(item.status);
                  setAdminNotes(item.adminNotes || "");
                  setAdminDialog({ isOpen: true, feedback: item });
                }}
              >
                <ShieldCheck className="h-4 w-4 mr-2" /> Manage
              </Button>
            )}
          </motion.div>
        ))}

        {feedbacks.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <MessageSquareWarning className="h-12 w-12 mx-auto opacity-20 mb-4" />
            <p>No feedback entries found.</p>
          </div>
        )}
      </div>

      {user?.role === "ADMIN" && (
        <Dialog open={adminDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setAdminDialog({ isOpen: false, feedback: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={adminStatus} onValueChange={(val) => setAdminStatus(val || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea 
                  placeholder="Internal notes or reply to the user..."
                  value={adminNotes} 
                  onChange={(e) => setAdminNotes(e.target.value)} 
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleAdminSubmit} disabled={updateStatus.isPending}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
