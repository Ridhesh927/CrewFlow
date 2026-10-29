"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges,
  Node,
  Edge,
  Handle,
  Position,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGetAllUsers, useUpdateUser } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Custom Node for displaying User details
const UserNode = ({ data }: any) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-primary/20 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-16 !bg-primary" />
      <div className="flex flex-col">
        <div className="font-bold text-sm text-foreground">{data.name}</div>
        <div className="text-xs text-muted-foreground">{data.role}</div>
        {data.department && (
          <div className="text-[10px] bg-secondary px-1 py-0.5 rounded mt-1 w-fit">
            {data.department}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-primary" />
    </div>
  );
};

const nodeTypes = {
  userNode: UserNode,
};

export default function OrgChartPage() {
  const { data: usersData, isLoading } = useGetAllUsers();
  const updateUserMutation = useUpdateUser();
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const userList: any[] = useMemo(() => {
    if (Array.isArray(usersData)) return usersData;
    if (usersData && Array.isArray((usersData as any).users)) return (usersData as any).users;
    return [];
  }, [usersData]);

  useEffect(() => {
    if (userList.length > 0) {
      // Build a basic tree layout algorithm
      // Find root (usually ADMIN without manager)
      const roots = userList.filter((u: any) => !u.manager);
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Group users by managerId
      const childrenMap = new Map();
      userList.forEach((u: any) => {
        if (u.manager && u.manager.id) {
          if (!childrenMap.has(u.manager.id)) {
            childrenMap.set(u.manager.id, []);
          }
          childrenMap.get(u.manager.id).push(u);
        }
      });

      // Simple recursive layout with cycle detection
      const visitedNodes = new Set<number>();
      const layoutTree = (userId: number, x: number, y: number, levelXOffsets: Map<number, number>) => {
        if (visitedNodes.has(userId)) return;
        visitedNodes.add(userId);

        const user = userList.find((u: any) => u.id === userId);
        if (!user) return;

        // Get the current max X offset for this level, or default to x
        let currentX = levelXOffsets.get(y) || x;

        newNodes.push({
          id: user.id.toString(),
          type: 'userNode',
          position: { x: currentX, y },
          data: { label: user.name, name: user.name, role: user.role, department: user.department },
        });

        // Update the next available X position for this level
        levelXOffsets.set(y, currentX + 250);

        const children = childrenMap.get(userId) || [];
        
        children.forEach((child: any, index: number) => {
          newEdges.push({
            id: `e${userId}-${child.id}`,
            source: userId.toString(),
            target: child.id.toString(),
            type: 'smoothstep',
            animated: true,
          });
          
          layoutTree(child.id, currentX + (index * 250), y + 150, levelXOffsets);
        });
      };

      const levelOffsets = new Map<number, number>();
      
      roots.forEach((root: any, idx: number) => {
        layoutTree(root.id, idx * 300, 50, levelOffsets);
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes(newNodes);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEdges(newEdges);
    }
  }, [userList]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => {
      // Connect params: source, target
      // This means target user now reports to source user
      const targetUserId = parseInt(params.target);
      const sourceUserId = parseInt(params.source);
      
      // Reject self-assignment
      if (sourceUserId === targetUserId) {
        toast.error("A user cannot report to themselves");
        return;
      }

      // Cycle detection: proposed manager (sourceUserId) cannot be a descendant of targetUserId
      const isDescendant = (ancestorId: number, childId: number): boolean => {
        const queue = [ancestorId];
        const visited = new Set<number>([ancestorId]);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          const directSubs = userList.filter((u: any) => u.manager?.id === curr);
          for (const sub of directSubs) {
            if (sub.id === childId) return true;
            if (!visited.has(sub.id)) {
              visited.add(sub.id);
              queue.push(sub.id);
            }
          }
        }
        return false;
      };

      if (isDescendant(targetUserId, sourceUserId)) {
        toast.error("Cannot assign a subordinate as manager (circular hierarchy)");
        return;
      }

      // Update DB
      toast.promise(
        updateUserMutation.mutateAsync({
          id: targetUserId,
          data: { managerId: sourceUserId }
        }),
        {
          loading: 'Reassigning user...',
          success: 'User successfully reassigned!',
          error: (err: any) => err?.message || 'Failed to reassign user'
        }
      );
    },
    [updateUserMutation, userList]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Organization Chart</h2>
        <p className="text-muted-foreground">
          View the reporting structure and drag connections to reassign team members.
        </p>
      </div>

      <Card className="flex-1 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-muted/10"
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </Card>
    </div>
  );
}
