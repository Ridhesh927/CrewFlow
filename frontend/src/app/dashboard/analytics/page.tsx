"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useTeamAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/analytics/Charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const toFiniteNumber = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

// Typed response schema to validate API response boundary
const TeamAnalyticsItemSchema = z.object({
  userId: z.union([z.number(), z.string()]).optional(),
  user: z.object({
    name: z.string().default("Unknown User"),
  }).partial().default({}),
  averageRating: z.union([z.number(), z.string(), z.null(), z.undefined()])
    .transform(val => {
      const n = Number(val);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }),
  taskCompletions: z.union([z.number(), z.string(), z.null(), z.undefined()])
    .transform(val => {
      const n = Number(val);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }),
  attendanceStats: z.record(z.string(), z.unknown()).optional().default({})
    .transform(stats => ({
      present: toFiniteNumber(stats.Present, 0),
      absent: toFiniteNumber(stats.Absent, 0),
      late: toFiniteNumber(stats.Late, 0),
    })),
});

const TeamAnalyticsResponseSchema = z.object({
  analytics: z.array(TeamAnalyticsItemSchema).default([]),
});

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

  // Parse and normalize raw analytics data through schema
  const parsed = TeamAnalyticsResponseSchema.safeParse(data);
  const normalizedData = parsed.success ? parsed.data.analytics : [];

  // Calculate aggregates safely with finite numeric guards
  const totalUsers = normalizedData.length;
  const sumRatings = normalizedData.reduce((acc, curr) => acc + curr.averageRating, 0);
  const averageRating = totalUsers > 0 ? sumRatings / totalUsers : 0;
  const totalTasks = normalizedData.reduce((acc, curr) => acc + curr.taskCompletions, 0);

  const totalPresent = normalizedData.reduce((acc, curr) => acc + curr.attendanceStats.present, 0);
  const totalAbsent = normalizedData.reduce((acc, curr) => acc + curr.attendanceStats.absent, 0);
  const totalLate = normalizedData.reduce((acc, curr) => acc + curr.attendanceStats.late, 0);
  const totalRecordedAttendance = totalPresent + totalAbsent + totalLate;
  const attendanceRate = totalRecordedAttendance > 0 ? (totalPresent / totalRecordedAttendance) * 100 : 0;

  // Transform data for charts
  const performanceData = normalizedData
    .map((a) => ({
      name: a.user?.name || "Unknown User",
      rating: Number(a.averageRating.toFixed(1)),
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10); // Top 10

  const taskData = normalizedData
    .map((a) => ({
      name: a.user?.name || "Unknown User",
      tasks: a.taskCompletions,
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 10);

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
