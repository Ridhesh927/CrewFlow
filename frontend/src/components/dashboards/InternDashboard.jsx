"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Upload, Star } from "lucide-react";

export function InternDashboard() {
  const tasks = [
    { id: 1, title: "LinkedIn Repost Campaign", deadline: "Today, 5:00 PM", status: "Pending" },
    { id: 2, title: "Write Weekly Update", deadline: "Friday, 4:00 PM", status: "Completed" },
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
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground mt-1">Present: 19 | Absent: 1</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">Excellent - May 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Due soon</p>
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
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground">Due: {task.deadline}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={task.status === "Completed" ? "default" : "outline"} className={task.status === "Pending" ? "text-amber-500 border-amber-500/50" : ""}>
                      {task.status}
                    </Badge>
                    {task.status === "Pending" && (
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        <Upload className="mr-1 h-3 w-3" /> Submit Proof
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border/50 pt-4">
             <div className="text-sm text-muted-foreground text-center py-8">
               No recent activity to display.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
