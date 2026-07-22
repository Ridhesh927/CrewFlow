"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Calendar, Clock, AlertCircle } from "lucide-react";
import { useGetAttendances } from "@/hooks/useAttendances";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AttendancePage() {
  const { data, isLoading } = useGetAttendances();
  
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const attendances = data?.attendances || [];

  // Extract unique filter options
  const departments = ["ALL", ...new Set(attendances.map(a => a.user?.department).filter(Boolean))];
  const roles = ["ALL", ...new Set(attendances.map(a => a.user?.role).filter(Boolean))];
  const statuses = ["ALL", ...new Set(attendances.map(a => a.status).filter(Boolean))];
  
  const formatDate = (isoDate) => new Date(isoDate).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Apply filters
  const filteredAttendances = attendances.filter(a => {
    const matchesDept = departmentFilter === "ALL" || a.user?.department === departmentFilter;
    const matchesRole = roleFilter === "ALL" || a.user?.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    
    // Convert attendance date to YYYY-MM-DD for native date picker comparison
    let aDateStr = null;
    if (a.date) {
      const dObj = new Date(a.date);
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const d = String(dObj.getDate()).padStart(2, '0');
      aDateStr = `${y}-${m}-${d}`;
    }
    const matchesDate = dateFilter === "ALL" || aDateStr === dateFilter;
    
    const matchesSearch = 
      (a.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.user?.specialId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.remarks || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesRole && matchesStatus && matchesDate && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'PRESENT': return <Badge variant="default" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20">Present</Badge>;
      case 'ABSENT': return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20">Absent</Badge>;
      case 'LATE': return <Badge variant="warning" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-500/20">Late</Badge>;
      case 'LEAVE': return <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/20">On Leave</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-1">View user daily attendance and status history.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-full md:w-[220px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="search"
              placeholder="Search user, ID or remarks..."
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
              {statuses.map(status => (
                <SelectItem key={status} value={status}>{status === "ALL" ? "All Statuses" : status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-[160px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <input
              type="date"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full h-full"
              value={dateFilter === "ALL" ? "" : dateFilter}
              onChange={(e) => setDateFilter(e.target.value || "ALL")}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[250px]">User Details</TableHead>
              <TableHead>Group & Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading attendance records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAttendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No attendance records found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendances.map((attendance) => (
                <TableRow key={attendance.id} className="group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{attendance.user?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground truncate">{attendance.user?.email}</span>
                      <span className="text-xs text-muted-foreground">{attendance.user?.specialId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className="font-normal text-xs">{attendance.user?.department || "N/A"}</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">{attendance.user?.role || "N/A"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(attendance.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {attendance.date ? formatDate(attendance.date) : "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    {attendance.remarks ? (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm truncate text-muted-foreground" title={attendance.remarks}>{attendance.remarks}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
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
