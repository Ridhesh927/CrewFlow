"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, FileWarning, Loader2 } from "lucide-react";
import { useDashboardMetrics, useTeamAnalytics } from "@/hooks/useAnalytics";

export function AdminDashboard({ userId }) {
  const { data: dashboardData, isLoading: loadingDash } = useDashboardMetrics(userId);
  const { data: teamData, isLoading: loadingTeam } = useTeamAnalytics();

  if (loadingDash || loadingTeam) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const { activeTasks = [], pendingProofs = [] } = dashboardData || {};
  const { analytics = [] } = teamData || {};

  const totalUsers = analytics.length;
  const activeInterns = analytics.filter(a => a.user.role === 'INTERN').length;
  
  // Calculate average attendance roughly
  let totalPresent = 0;
  let totalRecords = 0;
  analytics.forEach(a => {
    const stats = a.attendanceStats;
    const present = stats.Present || 0;
    const total = present + (stats.Absent || 0) + (stats.Late || 0) + (stats.Leave || 0);
    totalPresent += present;
    totalRecords += total;
  });
  
  const avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) + "%" : "N/A";

  const stats = [
    { title: "Total Users", value: totalUsers.toString(), icon: Users, description: "Registered users" },
    { title: "Active Interns", value: activeInterns.toString(), icon: UserCheck, description: "Working interns" },
    { title: "Avg. Attendance", value: avgAttendance, icon: Clock, description: "Based on records" },
    { title: "Pending Approvals", value: pendingProofs.length.toString(), icon: FileWarning, description: "Requires action" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Daily attendance across all departments</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50">
            <p className="text-muted-foreground">Chart placeholder (Recharts/Chart.js)</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
            <CardDescription>Currently running tasks</CardDescription>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4">
            <div className="space-y-4">
              {activeTasks.length > 0 ? activeTasks.map((task, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.targetAudience}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No active tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
