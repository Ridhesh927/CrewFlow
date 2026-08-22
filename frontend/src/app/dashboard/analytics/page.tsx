"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useTeamAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart } from "@/components/analytics/Charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";

export default function AnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const { data, isLoading, error } = useTeamAnalytics(departmentFilter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-destructive/10 text-destructive rounded-xl">
        Failed to load analytics data.
      </div>
    );
  }

  const analyticsData = data.analytics || [];

  // Calculate aggregates
  const totalUsers = analyticsData.length;
  const averageRating = analyticsData.reduce((acc, curr) => acc + curr.averageRating, 0) / (totalUsers || 1);
  const totalTasks = analyticsData.reduce((acc, curr) => acc + curr.taskCompletions, 0);
  
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  
  analyticsData.forEach(userStat => {
    totalPresent += userStat.attendanceStats?.Present || 0;
    totalAbsent += userStat.attendanceStats?.Absent || 0;
    totalLate += userStat.attendanceStats?.Late || 0;
  });

  const attendanceRate = totalPresent / ((totalPresent + totalAbsent + totalLate) || 1) * 100;

  // Transform data for charts
  const performanceData = analyticsData.map(a => ({
    name: a.user.name,
    rating: a.averageRating
  })).sort((a, b) => b.rating - a.rating).slice(0, 10); // Top 10

  const taskData = analyticsData.map(a => ({
    name: a.user.name,
    tasks: a.taskCompletions
  })).sort((a, b) => b.tasks - a.tasks).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Reporting</h1>
          <p className="text-muted-foreground">Detailed metrics for team performance and attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracked Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)} / 5.0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers (Rating)</CardTitle>
            <CardDescription>Average rating score per user</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={performanceData} xKey="name" yKey="rating" color="#8b5cf6" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Task Completers</CardTitle>
            <CardDescription>Verified task submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={taskData} xKey="name" yKey="tasks" color="#10b981" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
