"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Calendar, Clock, AlertCircle, Edit2, Download } from "lucide-react";
import { useGetAttendances, useMarkAttendance } from "@/hooks/useAttendances";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendancePage() {
  useDocumentTitle("Attendance");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useGetAttendances(startDate, endDate);
  const { mutate: markAttendance, isPending: isMarking } = useMarkAttendance();
  const currentUser = useAuthStore(state => state.user);
  
  const canEdit = currentUser?.role !== 'INTERN';
  
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const attendances = useMemo(() => data?.attendances || [], [data?.attendances]);

  // Extract unique filter options
  const departments = ["ALL", ...new Set(attendances.map(a => a.user?.department).filter(Boolean))];
  const roles = ["ALL", ...new Set(attendances.map(a => a.user?.role).filter(Boolean))];
  
  const getCellColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'PRESENT': return "bg-[#1E8E3E] text-white"; // Dark green
      case 'ABSENT':
      case 'LEAVE': return "bg-[#fce8e6] text-[#d93025]"; // Light Red bg, dark text
      case 'INFORMED': return "bg-[#e6f4ea] text-[#137333]"; // Light green bg, dark text
      case 'COMPLETED': return "bg-[#00BCD4] text-white"; // Cyan
      case 'DISCONTINUED':
      case 'TERMINATED': return "bg-[#8B0000] text-white"; // Dark Red
      case 'LATE': return "bg-[#F9AB00] text-white"; // Yellow
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const { uniqueDates, userRows } = useMemo(() => {
    if (!attendances.length) return { uniqueDates: [], userRows: [] };

    // Apply basic user filters before pivoting
    const filteredAttendances = attendances.filter(a => {
      const matchesDept = departmentFilter === "ALL" || a.user?.department === departmentFilter;
      const matchesRole = roleFilter === "ALL" || a.user?.role === roleFilter;
      const matchesSearch = 
        (a.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.user?.specialId || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesRole && matchesSearch;
    });

    // Extract unique dates, sorted chronologically
    const dateSet = new Set<string>();
    filteredAttendances.forEach(a => {
      if (a.date) {
        dateSet.add(new Date(a.date).toLocaleDateString('en-CA')); // Use YYYY-MM-DD in local timezone
      }
    });
    
    // Sort oldest to newest (like the screenshot, left to right dates)
    const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Group by user
    const userMap = new Map();
    filteredAttendances.forEach(a => {
      const u = a.user;
      if (!u) return;
      if (!userMap.has(u.id)) {
        userMap.set(u.id, {
          user: u,
          attendanceByDate: {}
        });
      }
      if (a.date) {
        const dateKey = new Date(a.date).toLocaleDateString('en-CA');
        userMap.get(u.id).attendanceByDate[dateKey] = a;
      }
    });

    const rows = Array.from(userMap.values());
    return {
      uniqueDates: sortedDates,
      userRows: Array.from(userMap.values())
    };
  }, [attendances, departmentFilter, roleFilter, searchQuery]);

  const totalPages = Math.ceil(userRows.length / pageSize);
  const paginatedRows = userRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [departmentFilter, roleFilter, searchQuery, startDate, endDate]);

  const formatDateHeader = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleStatusChange = (userId, dateStr, newStatus) => {
    markAttendance({ targetUserId: userId, date: dateStr, status: newStatus });
  };

  const editableStatuses = ["Present", "Absent", "Leave", "Informed", "Late", "Completed", "Terminated", "Discontinued"];

  const renderCell = (row, dateStr) => {
    const record = row.attendanceByDate[dateStr];
    
    let content = (
      <div className="w-full h-8 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/50 rounded transition-colors cursor-pointer">
        -
      </div>
    );

    if (record) {
      content = (
        <div className={`mx-auto w-full max-w-[110px] py-1.5 px-2 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${getCellColor(record.status)}`}>
          {record.status}
        </div>
      );
    }

    if (!canEdit) {
      return (
        <TableCell key={dateStr} className="border-r p-1.5 text-center align-middle">
          {record ? content : null}
        </TableCell>
      );
    }

    return (
      <TableCell key={dateStr} className="border-r p-1.5 text-center align-middle relative group/cell">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none w-full h-full flex items-center justify-center border-0 p-0 m-0 bg-transparent cursor-pointer">
            {content}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-36 z-[9999] p-2 bg-card border-border shadow-2xl">
            {editableStatuses.map(s => (
              <DropdownMenuItem 
                key={s} 
                className="cursor-pointer p-0 mb-1.5 focus:bg-transparent"
                onClick={() => handleStatusChange(row.user.id, dateStr, s)}
              >
                <div className={`w-full text-center rounded-full py-2 px-3 font-semibold text-[11px] uppercase tracking-wider transition-all hover:opacity-80 shadow-sm ${getCellColor(s)}`}>
                  {s}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    );
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/analytics/export/attendance?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_export_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error", error);
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
          <p className="text-muted-foreground mt-1">View and manage daily attendance.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Button variant="outline" onClick={handleExportCSV} className="mr-2 hidden sm:flex">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
          <div className="flex items-center gap-2 mr-4">
            <div className="flex items-center text-sm border rounded-md px-2 py-1 bg-card">
              <span className="text-muted-foreground mr-2">From:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent outline-none" />
            </div>
            <div className="flex items-center text-sm border rounded-md px-2 py-1 bg-card">
              <span className="text-muted-foreground mr-2">To:</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent outline-none" />
            </div>
          </div>
          
          {isMarking && (
            <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full mr-2">
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Saving...
            </div>
          )}
          <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-full md:w-[220px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="search"
              placeholder="Search user or ID..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full h-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val || "ALL")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept === "ALL" ? "All Groups" : dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "ALL")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>{role === "ALL" ? "All Roles" : role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto bg-card shadow-sm pb-4 relative">
        <Table className="w-full border-collapse" style={{ minWidth: `${410 + (uniqueDates.length * 120)}px` }}>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="sticky left-0 bg-muted z-20 border-r w-[60px] text-center font-bold">SRNO.</TableHead>
              <TableHead className="sticky left-[60px] bg-muted z-20 border-r w-[200px] font-bold">NAME</TableHead>
              <TableHead className="sticky left-[260px] bg-muted z-20 border-r w-[150px] font-bold text-center">Contact Info</TableHead>
              {uniqueDates.map(dateStr => (
                <TableHead key={dateStr} className="border-r font-bold text-center w-[120px]">
                  {formatDateHeader(dateStr)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center p-0">
                  <div className="p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : userRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3 + uniqueDates.length} className="h-32 text-center text-muted-foreground">
                  No records found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, index) => (
                <TableRow key={row.user.id} className="hover:bg-muted/50 group border-b">
                  <TableCell className="sticky left-0 bg-card group-hover:bg-muted/50 z-10 border-r text-center font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="sticky left-[60px] bg-card group-hover:bg-muted/50 z-10 border-r font-medium">
                    {row.user.name || "Unknown"}
                  </TableCell>
                  <TableCell className="sticky left-[260px] bg-card group-hover:bg-muted/50 z-10 border-r text-xs text-center text-muted-foreground flex flex-col items-center justify-center h-[57px]">
                    {row.user.phoneNo ? <span>{row.user.phoneNo}</span> : null}
                    {row.user.specialId ? <span className="text-[10px] opacity-70">{row.user.specialId}</span> : null}
                    {!row.user.phoneNo && !row.user.specialId && <span>-</span>}
                  </TableCell>
                  {uniqueDates.map(dateStr => renderCell(row, dateStr))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, userRows.length)} of {userRows.length} entries
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
    </motion.div>
  );
}
