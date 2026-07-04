"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardMetrics, useTeamAnalytics } from "@/hooks/useAnalytics";

export function ManagerDashboard({ role, userId }) {
  const roleName = role === "SENIOR_TL" ? "Department" : role === "TL" ? "Team" : "Interns";

  const { data: dashboardData, isLoading: loadingDash } = useDashboardMetrics(userId);
  const { data: teamData, isLoading: loadingTeam } = useTeamAnalytics();

  if (loadingDash || loadingTeam) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const { activeTasks = [], pendingProofs = [] } = dashboardData || {};
  const { analytics = [] } = teamData || {};

  const totalUsers = analytics.length;
  
  let missingAttendanceCount = 0;
  analytics.forEach(a => {
    if (a.attendanceStats.Absent > 0) missingAttendanceCount += a.attendanceStats.Absent;
  });

  const chartData = analytics.map(a => {
    const present = a.attendanceStats.Present || 0;
    const total = present + (a.attendanceStats.Absent || 0) + (a.attendanceStats.Late || 0) + (a.attendanceStats.Leave || 0);
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      name: a.user.name,
      completions: a.taskCompletions || 0,
      attendance: attendanceRate
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {roleName}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Proofs</CardTitle>
            <FileCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProofs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Attendance</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missingAttendanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Absent records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Proofs Awaiting Verification</CardTitle>
            <CardDescription>Review submitted tasks and sub-tasks</CardDescription>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4">
            <div className="space-y-4">
              {pendingProofs.length > 0 ? pendingProofs.map((proof) => (
                <div key={proof.id} className="flex flex-col p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                         {proof.imageUrl ? <img src={proof.imageUrl} alt="proof" className="w-full h-full object-cover"/> : <span className="text-xs text-muted-foreground">IMG</span>}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{proof.task.title}</h4>
                        <p className="text-xs text-muted-foreground">Submitted by: {proof.intern.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20">Reject</Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  </div>
                  {proof.task.subTasks && proof.task.subTasks.length > 0 && (
                    <div className="mt-2 pl-14">
                      <p className="text-xs text-muted-foreground mb-1">Sub-tasks (Task scope):</p>
                      <ul className="text-xs list-disc pl-4 text-primary">
                        {proof.task.subTasks.map((st) => (
                          <li key={st.id}>{st.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No pending proofs</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4 space-y-2">
            <Button className="w-full justify-start" variant="outline">Mark Attendance</Button>
            <Button className="w-full justify-start" variant="outline">Assign Ratings</Button>
            {role !== "CAPTAIN" && (
              <Button className="w-full justify-start" variant="outline">View Reports</Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Analytics & Performance</CardTitle>
          <CardDescription>Task completions and attendance average (%) by user</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-[350px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="completions" name="Task Completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance Rate (%)" fill="hsl(var(--chart-2, 190 90% 40%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No analytics data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
