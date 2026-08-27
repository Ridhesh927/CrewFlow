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
  const { data: users, isLoading } = useGetAllUsers();
  const updateUserMutation = useUpdateUser();
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (users && Array.isArray(users)) {
      // Build a basic tree layout algorithm
      // Find root (usually ADMIN without manager)
      const roots = users.filter(u => !u.manager);
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      let xOffset = 0;
      let yOffset = 0;

      // Group users by managerId
      const childrenMap = new Map();
      users.forEach(u => {
        if (u.manager && u.manager.id) {
          if (!childrenMap.has(u.manager.id)) {
            childrenMap.set(u.manager.id, []);
          }
          childrenMap.get(u.manager.id).push(u);
        }
      });

      // Simple recursive layout
      const layoutTree = (userId: number, x: number, y: number, levelXOffsets: Map<number, number>) => {
        const user = users.find(u => u.id === userId);
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
        
        children.forEach((child, index) => {
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
      
      roots.forEach((root, idx) => {
        layoutTree(root.id, idx * 300, 50, levelOffsets);
      });

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [users]);

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
      
      // Update DB
      toast.promise(
        updateUserMutation.mutateAsync({
          id: targetUserId,
          data: { managerId: sourceUserId }
        }),
        {
          loading: 'Reassigning user...',
          success: 'User successfully reassigned!',
          error: 'Failed to reassign user'
        }
      );
      
      // We don't manually add the edge because the DB update will invalidate 
      // the useGetAllUsers query and trigger a redraw.
    },
    [updateUserMutation]
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
