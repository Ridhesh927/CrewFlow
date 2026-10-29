"use client";

import { useQuery } from "@tanstack/react-query";
import { executeApiRequest } from "@/services/api";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fetchLeaderboard = () => executeApiRequest("/users/leaderboard");

export default function LeaderboardPage() {
  useDocumentTitle("Leaderboard");
  
  const { data: result, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  const users = result?.leaderboard || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top performers ranked by points.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl border-dashed bg-card/50">
          <div className="p-3 bg-destructive/10 rounded-full mb-3 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Failed to Load Leaderboard</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            {(error as any)?.message || "We encountered an issue fetching the rankings. Please try again."}
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Try Again
          </Button>
        </div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {users.map((user: any, index: number) => {
            const isTop3 = index < 3;
            return (
              <motion.div
                key={user.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className={`relative flex items-center p-4 rounded-xl border ${
                  index === 0 ? "bg-amber-500/10 border-amber-500/20" : 
                  index === 1 ? "bg-slate-300/10 border-slate-300/20" : 
                  index === 2 ? "bg-amber-700/10 border-amber-700/20" : 
                  "bg-card"
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 shrink-0">
                  {index === 0 ? <Medal className="h-8 w-8 text-amber-500" /> :
                   index === 1 ? <Medal className="h-8 w-8 text-slate-400" /> :
                   index === 2 ? <Medal className="h-8 w-8 text-amber-700" /> :
                   <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>}
                </div>
                
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {user.name}
                    {user.role === 'ADMIN' && <Shield className="h-4 w-4 text-primary" />}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline">{user.role}</Badge>
                    <span>•</span>
                    <span>{user.department || "No Department"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border">
                  <Star className={`h-5 w-5 ${isTop3 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                  <span className="font-bold text-lg">{user.points}</span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </motion.div>
            );
          })}
          
          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No rankings available yet.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
