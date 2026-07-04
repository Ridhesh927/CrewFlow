"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Upload, Star, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardMetrics, useUserAnalytics } from "@/hooks/useAnalytics";

export function InternDashboard({ userId }) {
  const { data: dashboardData, isLoading: loadingDash } = useDashboardMetrics(userId);
  const { data: userData, isLoading: loadingUser } = useUserAnalytics(userId);

  if (loadingDash || loadingUser) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const { activeTasks = [], proofs = [] } = dashboardData || {};
  const { analytics } = userData || {};
  
  const present = analytics?.attendanceStats?.Present || 0;
  const absent = analytics?.attendanceStats?.Absent || 0;
  const late = analytics?.attendanceStats?.Late || 0;
  const leave = analytics?.attendanceStats?.Leave || 0;
  const totalAtt = present + absent + late + leave;
  const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0;
  
  const rating = analytics?.averageRating?.toFixed(1) || "0.0";
  const tasksCompleted = analytics?.taskCompletions || 0;

  // Personal analytics chart (could be built from historical ratings if API supported it)
  // For MVP, we will use a simplified single point or mock trend to not break the chart structure completely,
  // or we can just render the UI. Let's keep a placeholder chart until historical data is tracked.
  const personalAnalytics = [
    { name: 'Current', rating: parseFloat(rating), tasks: tasksCompleted }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Present: {present} | Absent: {absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rating}/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">Average rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Your assigned campaigns and tasks</CardDescription>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4">
            <div className="space-y-4">
              {activeTasks.length > 0 ? activeTasks.map((task) => (
                <div key={task.id} className="flex flex-col p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">Due: {new Date(task.deadline).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                        {task.status}
                      </Badge>
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        <Upload className="mr-1 h-3 w-3" /> Submit Proof
                      </Button>
                    </div>
                  </div>
                  {task.subTasks && task.subTasks.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Checklist</p>
                      <div className="space-y-1">
                        {task.subTasks.map(st => (
                          <div key={st.id} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`subtask-${st.id}`} 
                              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`subtask-${st.id}`} className="text-xs text-foreground">
                              {st.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                 <p className="text-sm text-muted-foreground">No active tasks</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4">
             <div className="text-sm text-muted-foreground text-center py-8">
               {proofs.length > 0 ? (
                 <ul className="text-left space-y-2">
                    {proofs.map(p => (
                       <li key={p.id}>Submitted proof for task #{p.taskId} - {p.status}</li>
                    ))}
                 </ul>
               ) : "No recent activity to display."}
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Performance Trends</CardTitle>
          <CardDescription>Monthly ratings and task completions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={personalAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line yAxisId="left" type="monotone" dataKey="rating" name="Rating (out of 5)" stroke="hsl(var(--amber-500, 38 92% 50%))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="tasks" name="Tasks Completed" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
