"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Users as UsersIcon, Eye, EyeOff, MoreHorizontal, Trash2, Power } from "lucide-react";
import { useGetAllUsers, useCreateUser, useToggleUserStatus, useDeleteUser } from "@/hooks/useUsers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersPage() {
  const { data, isLoading } = useGetAllUsers();
  const createUser = useCreateUser();
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();
  const [open, setOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, user: null });
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "INTERN",
    department: "",
    specialId: "",
    phoneNo: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createUser.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ name: "", email: "", password: "", role: "INTERN", department: "", specialId: "", phoneNo: "" });
      },
    });
  };

  const users = data?.users || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system users, roles, and groups.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with specific roles and group access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" autoComplete="new-password" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SENIOR_TL">Senior TL</SelectItem>
                      <SelectItem value="TL">Team Leader</SelectItem>
                      <SelectItem value="CAPTAIN">Captain</SelectItem>
                      <SelectItem value="INTERN">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Group (Project)</Label>
                  <Input id="department" required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} placeholder="e.g. Marketing" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialId">Special ID</Label>
                  <Input id="specialId" value={formData.specialId} onChange={(e) => setFormData({...formData, specialId: e.target.value})} placeholder="EMP-1234" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNo">Phone Number</Label>
                  <Input id="phoneNo" value={formData.phoneNo} onChange={(e) => setFormData({...formData, phoneNo: e.target.value})} placeholder="+1 234 567 890" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col h-48 items-center justify-center text-muted-foreground">
            <UsersIcon className="h-10 w-10 mb-4 opacity-50" />
            <p>No users found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Special ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={!u.isActive ? "opacity-50 grayscale" : ""}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {u.name}
                      {!u.isActive && <Badge variant="destructive" className="h-5 px-1 text-[10px]">Disabled</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'default' : u.role === 'INTERN' ? 'secondary' : 'outline'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.department || "-"}</TableCell>
                  <TableCell>{u.specialId || "-"}</TableCell>
                  <TableCell>{u.phoneNo || "-"}</TableCell>
                  <TableCell>{u.points}</TableCell>
                  <TableCell>
                    {u.id !== 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setConfirmDialog({ isOpen: true, type: 'status', user: u })}>
                            <Power className="mr-2 h-4 w-4" />
                            {u.isActive ? "Disable Account" : "Enable Account"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDialog({ isOpen: true, type: 'delete', user: u })} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog({ isOpen: false, type: null, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'delete' ? 'Delete Account' : (confirmDialog.user?.isActive ? 'Disable Account' : 'Enable Account')}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'delete' 
                ? `Are you sure you want to permanently delete ${confirmDialog.user?.name}'s account? All their data will be erased. This action cannot be undone.` 
                : `Are you sure you want to ${confirmDialog.user?.isActive ? 'disable' : 'enable'} ${confirmDialog.user?.name}'s account?`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: null, user: null })}>Cancel</Button>
            <Button 
              variant={confirmDialog.type === 'delete' ? "destructive" : "default"}
              onClick={() => {
                if (confirmDialog.type === 'delete') {
                  deleteUser.mutate(confirmDialog.user.id);
                } else {
                  toggleStatus.mutate(confirmDialog.user.id);
                }
                setConfirmDialog({ isOpen: false, type: null, user: null });
              }}
            >
              {confirmDialog.type === 'delete' ? 'Delete' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
