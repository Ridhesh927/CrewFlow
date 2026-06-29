"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ManagerDashboard({ role }) {
  const roleName = role === "SENIOR_TL" ? "Department" : role === "TL" ? "Team" : "Interns";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {roleName}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{role === "CAPTAIN" ? "12" : "24"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Proofs</CardTitle>
            <FileCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Needs verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Attendance</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Action required today</p>
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
              {[
                { id: 1, title: "LinkedIn Post", intern: "Alex Intern", subTasks: ["Like the post", "Share with a comment"] },
                { id: 2, title: "Weekly Update", intern: "Sam Trainee", subTasks: ["Draft update"] }
              ].map((proof) => (
                <div key={proof.id} className="flex flex-col p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{proof.title}</h4>
                        <p className="text-xs text-muted-foreground">Submitted by: {proof.intern}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20">Reject</Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  </div>
                  {proof.subTasks && proof.subTasks.length > 0 && (
                    <div className="mt-2 pl-14">
                      <p className="text-xs text-muted-foreground mb-1">Completed Sub-tasks:</p>
                      <ul className="text-xs list-disc pl-4 text-primary">
                        {proof.subTasks.map((st, idx) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
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
    </div>
  );
}
