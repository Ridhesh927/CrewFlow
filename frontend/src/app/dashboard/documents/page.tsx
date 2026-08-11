"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, FileText, Trash2, Calendar, AlertCircle, Download, FileImage, File, UploadCloud } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useGetDocuments,
  useUploadDocument,
  useDeleteDocument
} from "@/hooks/useDocuments";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { 
    month: "short", day: "numeric", year: "numeric"
  });
};

const getFileIcon = (fileType: string) => {
  if (fileType?.includes("image")) return <FileImage className="h-10 w-10 text-blue-500" />;
  if (fileType?.includes("pdf")) return <FileText className="h-10 w-10 text-red-500" />;
  return <File className="h-10 w-10 text-muted-foreground" />;
};

// ────────────────────────────────────────────────────────────
// Upload Document Dialog (Admins / Managers)
// ────────────────────────────────────────────────────────────
function UploadDocumentDialog() {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  
  const { mutate: uploadDocument, isPending } = useUploadDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB.");
        setFileName("");
      } else {
        setError("");
        setFileName(file.name);
      }
    } else {
      setFileName("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title || file.name);
    fd.append("description", form.description);
    fd.append("file", file);

    uploadDocument(fd, {
      onSuccess: () => {
        setOpen(false);
        setForm({ title: "", description: "" });
        setFileName("");
      },
      onError: (err: any) => setError(err.response?.data?.error || err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setError(""); setFileName(""); } }}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Upload Document
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload resources, guides, or forms for the team.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-2">
            <Label>File *</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UploadCloud className="h-8 w-8" />
                {fileName ? (
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Click to select a file</p>
                    <p className="text-xs">PDF, Images, etc. (Max 10MB)</p>
                  </>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              placeholder="e.g. Intern Onboarding Guide (Optional)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full min-h-[70px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Briefly describe what this document contains..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !fileName}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
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
export default function DocumentsPage() {
  const user = useAuthStore(state => state.user);
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const canUpload = ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(user.role);
  
  const { data, isLoading } = useGetDocuments();
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument();

  const documents = data?.documents || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Center</h1>
          <p className="text-muted-foreground mt-1">
            Access important documents, guides, and forms.
          </p>
        </div>
        {canUpload && <UploadDocumentDialog />}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-muted-foreground gap-3 border rounded-xl border-dashed">
          <FileText className="h-10 w-10 opacity-40" />
          <p>No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
              <CardHeader className="bg-muted/30 pb-4 items-center justify-center border-b border-border/50 p-6 relative">
                {getFileIcon(doc.fileType)}
                
                {/* Delete overlay button for owner/admin */}
                {(isAdmin || doc.uploadedBy === user.id) && (
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={deleting}
                    onClick={() => deleteDocument(doc.id)}
                    title="Delete Document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="pt-4 flex-1">
                <CardTitle className="text-base line-clamp-1" title={doc.title}>{doc.title}</CardTitle>
                {doc.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2" title={doc.description}>
                    {doc.description}
                  </p>
                )}
                
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">{doc.uploader?.name}</span>
                    {doc.uploader?.department && <span>· {doc.uploader.department}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.createdAt)}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 pb-4">
                <Button variant="outline" className="w-full" asChild>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download / View
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
