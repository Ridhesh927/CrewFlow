"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Star, MessageSquare } from "lucide-react";
import { useGetRatings } from "@/hooks/useRatings";

import { Input } from "@/components/ui/input";
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

export default function RatingsPage() {
  const { data, isLoading } = useGetRatings();
  
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const ratings = data?.ratings || [];

  // Extract unique filter options
  const departments = ["ALL", ...new Set(ratings.map(r => r.user?.department).filter(Boolean))];
  const roles = ["ALL", ...new Set(ratings.map(r => r.user?.role).filter(Boolean))];
  const months = ["ALL", ...new Set(ratings.map(r => r.month).filter(Boolean))];

  // Apply filters
  const filteredRatings = ratings.filter(r => {
    const matchesDept = departmentFilter === "ALL" || r.user?.department === departmentFilter;
    const matchesRole = roleFilter === "ALL" || r.user?.role === roleFilter;
    const matchesMonth = monthFilter === "ALL" || r.month === monthFilter;
    const matchesSearch = 
      (r.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.user?.specialId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comments || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesRole && matchesMonth && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Ratings</h1>
          <p className="text-muted-foreground mt-1">View user performance ratings and feedback.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-input rounded-md px-3 bg-transparent h-10 w-full md:w-[220px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="search"
              placeholder="Search user, ID or comments..."
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
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month === "ALL" ? "All Months" : month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[250px]">User Details</TableHead>
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
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading ratings...</span>
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
              filteredRatings.map((rating) => (
                <TableRow key={rating.id} className="group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{rating.user?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground truncate">{rating.user?.email}</span>
                      <span className="text-xs text-muted-foreground">{rating.user?.specialId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className="font-normal text-xs">{rating.user?.department || "N/A"}</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">{rating.user?.role || "N/A"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                      <span className="font-semibold text-lg">{rating.rating}</span>
                      <span className="text-muted-foreground text-sm">/ 5</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm truncate" title={rating.comments}>{rating.comments}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate">{rating.rater?.name || "System"}</span>
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
