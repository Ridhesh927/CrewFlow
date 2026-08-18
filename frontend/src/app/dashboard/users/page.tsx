"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Users as UsersIcon, Eye, EyeOff, MoreHorizontal, Trash2, Power, Search, UserCog } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetAllUsers, useCreateUser, useToggleUserStatus, useDeleteUser, usePromoteUser, useUpdateUser, useBulkUpdateDepartment } from "@/hooks/useUsers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  useDocumentTitle("User Management");
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading } = useGetAllUsers();
  const createUser = useCreateUser();
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();
  const promoteUser = usePromoteUser();
  const updateUser = useUpdateUser();
  const [open, setOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ 
    isOpen: boolean; 
    type: 'delete' | 'status' | 'editRole' | 'editUser' | null; 
    user: any | null; 
    newRole: string;
    editData: any;
  }>({ 
    isOpen: false, 
    type: null, 
    user: null, 
    newRole: "",
    editData: {}
  });
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
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pointsSort, setPointsSort] = useState("DEFAULT");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [bulkDepartment, setBulkDepartment] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const bulkUpdateDepartment = useBulkUpdateDepartment();

  const handleSelectUser = (id: number) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map((u: any) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkUpdate = () => {
    if (selectedUserIds.length === 0 || !bulkDepartment) return;
    bulkUpdateDepartment.mutate(
      { userIds: selectedUserIds, department: bulkDepartment },
      {
        onSuccess: () => {
          setShowBulkDialog(false);
          setSelectedUserIds([]);
          setBulkDepartment("");
        }
      }
    );
  };

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

  const departments = ["ALL", ...new Set(users.map(u => u.department).filter(Boolean))];
  const roles = ["ALL", ...new Set(users.map(u => u.role).filter(Boolean))];
  
  let filteredUsers = users.filter(u => {
    const matchesDept = departmentFilter === "ALL" || u.department === departmentFilter;
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && u.isActive) || 
      (statusFilter === "DISABLED" && !u.isActive);
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesRole && matchesStatus && matchesSearch;
  });

  if (pointsSort === "HIGH_TO_LOW") {
    filteredUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
  } else if (pointsSort === "LOW_TO_HIGH") {
    filteredUsers.sort((a, b) => (a.points || 0) - (b.points || 0));
  }

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [departmentFilter, roleFilter, statusFilter, pointsSort, searchQuery]);

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
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-[180px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="search"
              placeholder="Search users..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full h-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept === "ALL" ? "All Groups" : dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>{role === "ALL" ? "All Roles" : role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DISABLED">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pointsSort} onValueChange={setPointsSort}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort Points" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEFAULT">Default Sort</SelectItem>
              <SelectItem value="HIGH_TO_LOW">Points: High to Low</SelectItem>
              <SelectItem value="LOW_TO_HIGH">Points: Low to High</SelectItem>
            </SelectContent>
          </Select>

          {currentUser?.role === 'ADMIN' && selectedUserIds.length > 0 && (
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger render={<Button variant="secondary" />}>
                <UserCog className="mr-2 h-4 w-4" /> Bulk Group Update ({selectedUserIds.length})
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Update Group</DialogTitle>
                  <DialogDescription>
                    Move {selectedUserIds.length} selected users to a new group (department).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>New Group / Department</Label>
                    <Input 
                      value={bulkDepartment} 
                      onChange={(e) => setBulkDepartment(e.target.value)} 
                      placeholder="e.g. Design Team" 
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                    <Button onClick={handleBulkUpdate} disabled={bulkUpdateDepartment.isPending || !bulkDepartment}>
                      {bulkUpdateDepartment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Groups
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

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
      </div>
      
      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col h-48 items-center justify-center text-muted-foreground">
            <UsersIcon className="h-10 w-10 mb-4 opacity-50" />
            <p>No users found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {currentUser?.role === 'ADMIN' && (
                  <TableHead className="w-[40px]">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                )}
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
              {paginatedUsers.map((u: any) => (
                <TableRow key={u.id} className={!u.isActive ? "opacity-50 grayscale" : ""}>
                  {currentUser?.role === 'ADMIN' && (
                    <TableCell>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => handleSelectUser(u.id)}
                      />
                    </TableCell>
                  )}
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
                    {u.id !== 1 && currentUser?.role === 'ADMIN' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setConfirmDialog({ isOpen: true, type: 'editUser', user: u, newRole: u.role, editData: { name: u.name, department: u.department, specialId: u.specialId || "", phoneNo: u.phoneNo || "", managerId: u.managerId ? String(u.managerId) : "none" } })}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDialog({ isOpen: true, type: 'editRole', user: u, newRole: u.role, editData: {} })}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDialog({ isOpen: true, type: 'status', user: u, newRole: "", editData: {} })}>
                            <Power className="mr-2 h-4 w-4" />
                            {u.isActive ? "Disable Account" : "Enable Account"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDialog({ isOpen: true, type: 'delete', user: u, newRole: "", editData: {} })} className="text-red-600 focus:text-red-600">
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

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog({ isOpen: false, type: null, user: null, newRole: "", editData: {} })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'delete' ? 'Delete Account' 
                : confirmDialog.type === 'editRole' ? 'Edit User Role' 
                : confirmDialog.type === 'editUser' ? 'Edit User Details'
                : (confirmDialog.user?.isActive ? 'Disable Account' : 'Enable Account')}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'delete' 
                ? `Are you sure you want to permanently delete ${confirmDialog.user?.name}'s account? All their data will be erased. This action cannot be undone.` 
                : confirmDialog.type === 'editRole'
                ? `Change the role for ${confirmDialog.user?.name}. Note: Your own role determines which roles you can assign.`
                : confirmDialog.type === 'editUser'
                ? `Update details for ${confirmDialog.user?.name}.`
                : `Are you sure you want to ${confirmDialog.user?.isActive ? 'disable' : 'enable'} ${confirmDialog.user?.name}'s account?`}
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog.type === 'editRole' && (
            <div className="py-4 space-y-2">
              <Label>New Role</Label>
              <Select value={confirmDialog.newRole} onValueChange={(val) => setConfirmDialog({ ...confirmDialog, newRole: val })}>
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
          )}

          {confirmDialog.type === 'editUser' && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={confirmDialog.editData?.name} onChange={(e) => setConfirmDialog({...confirmDialog, editData: {...confirmDialog.editData, name: e.target.value}})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={confirmDialog.editData?.department} onChange={(e) => setConfirmDialog({...confirmDialog, editData: {...confirmDialog.editData, department: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select value={confirmDialog.editData?.managerId} onValueChange={(val) => setConfirmDialog({...confirmDialog, editData: {...confirmDialog.editData, managerId: val}})}>
                    <SelectTrigger><SelectValue placeholder="Select Manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      {users.filter((u: any) => u.id !== confirmDialog.user?.id && ["ADMIN", "SENIOR_TL", "TL", "CAPTAIN"].includes(u.role)).map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Special ID</Label>
                  <Input value={confirmDialog.editData?.specialId} onChange={(e) => setConfirmDialog({...confirmDialog, editData: {...confirmDialog.editData, specialId: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone No</Label>
                  <Input value={confirmDialog.editData?.phoneNo} onChange={(e) => setConfirmDialog({...confirmDialog, editData: {...confirmDialog.editData, phoneNo: e.target.value}})} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, type: null, user: null, newRole: "", editData: {} })}>Cancel</Button>
            <Button 
              variant={confirmDialog.type === 'delete' ? "destructive" : "default"}
              disabled={updateUser.isPending}
              onClick={() => {
                if (confirmDialog.type === 'delete') {
                  deleteUser.mutate(confirmDialog.user.id);
                } else if (confirmDialog.type === 'editRole') {
                  promoteUser.mutate({ id: confirmDialog.user.id, newRole: confirmDialog.newRole });
                } else if (confirmDialog.type === 'editUser') {
                  const payload = {
                    ...confirmDialog.editData,
                    managerId: confirmDialog.editData.managerId === "none" ? null : parseInt(confirmDialog.editData.managerId)
                  };
                  updateUser.mutate({ id: confirmDialog.user.id, data: payload }, {
                    onSuccess: () => setConfirmDialog({ isOpen: false, type: null, user: null, newRole: "", editData: {} })
                  });
                } else {
                  toggleStatus.mutate(confirmDialog.user.id, {
                    onSuccess: () => setConfirmDialog({ isOpen: false, type: null, user: null, newRole: "", editData: {} })
                  });
                }
                setConfirmDialog({ isOpen: false, type: null, user: null, newRole: "", editData: {} });
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
