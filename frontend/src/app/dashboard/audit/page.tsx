"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { executeApiRequest } from "@/services/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuthStore } from "@/store/useAuthStore";
import { AccessDenied } from "@/components/AccessDenied";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

export default function AuditLogsPage() {
  useDocumentTitle("Audit Logs");
  const user = useAuthStore(state => state.user);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["auditLogs", page, limit],
    queryFn: async () => {
      return await executeApiRequest(`/audit?page=${page}&limit=${limit}`);
    },
    enabled: user?.role === "ADMIN",
  });

  if (user && user.role !== "ADMIN") {
    return <AccessDenied />;
  }

  const logs = data?.logs || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const getActionColor = (action: string) => {
    if (action.includes("CREATED") || action.includes("APPROVED") || action.includes("RESTORED")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (action.includes("DELETED") || action.includes("REJECTED") || action.includes("FAILED")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (action.includes("MODIFIED") || action.includes("UPDATED") || action.includes("PROMOTED")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">System-wide activity and security logs.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>A complete log of sensitive actions across the platform.</CardDescription>
            </div>
            {pagination.total > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading audit logs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                        <p className="text-sm font-medium">Failed to load audit logs.</p>
                        <p className="text-xs text-muted-foreground">{(error as any)?.message || "An unexpected error occurred."}</p>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), "PP HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.name}</p>
                            <p className="text-xs text-muted-foreground">{log.user.role}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System / Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.resource || '-'}</span>
                        {log.resourceId && <span className="text-muted-foreground ml-1">#{log.resourceId}</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-mono text-muted-foreground" title={log.details ? JSON.stringify(log.details) : undefined}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={pagination.page <= 1 || isLoading || isFetching}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages || isLoading || isFetching}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
