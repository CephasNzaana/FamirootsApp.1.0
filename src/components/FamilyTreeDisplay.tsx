// src/components/FamilyTreeDisplay.tsx

import React, { useState, useRef, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2, GitMerge } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

// Constants for layout
const NODE_CONTENT_WIDTH = 160; 
const NODE_AVATAR_DIAMETER = 56;
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + 44; // Avatar + text area + padding
const HORIZONTAL_SPACING = 40; 
const VERTICAL_SPACING = 70;   
const SPOUSE_HORIZONTAL_OFFSET = NODE_CONTENT_WIDTH + 30; // Increased space for spouse
const COUPLE_LINE_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; 

interface TreeNode extends FamilyMember {
  x: number;
  y: number;
  childrenIds: string[];
  spouseId?: string; 
  // spouseNodeX?: number; // Not strictly needed if we find spouse node by ID
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse';
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel: number; // This prop is now for potential internal adjustments, not for overall scaling
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  const [layout, setLayout] = useState<{ nodes: TreeNode[], edges: Edge[], width: number, height: number }>({ nodes: [], edges: [], width: 0, height: 0 });

  useEffect(() => {
    console.log("FamilyTreeDisplay: initialTree prop received/updated", JSON.parse(JSON.stringify(initialTree)));
    setTree(initialTree);
  }, [initialTree]);

  useEffect(() => {
    console.log("FamilyTreeDisplay: Layout calculation. Members:", tree?.members?.length, "Zoom:", zoomLevel); // Log zoomLevel
    if (!tree || !tree.members || !Array.isArray(tree.members) || tree.members.length === 0) {
      setLayout({ nodes: [], edges: [], width: 0, height: 0 }); return;
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if(m && m.id) membersById[String(m.id)] = m; }); 
    
    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => { /* ... same ... */ return 0;};
    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({ /* ... same ... */
        ...member, name: member.name || "Unnamed",
        parentId: member.parentId ? String(member.parentId) : undefined, 
        generation: getNumericGenerationSafe(member, new Set()),
    }));

    const membersByGeneration: Record<number, FamilyMember[]> = {};
    membersWithProcessedGen.forEach((member) => { /* ... same ... */ });

    const newNodes: TreeNode[] = [];
    const newEdges: Edge[] = [];
    let overallMaxX = HORIZONTAL_SPACING; let overallMaxY = VERTICAL_SPACING; 
    const processedNodesMap: { [id: string]: TreeNode } = {};
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    if (generationLevels.length === 0 && membersWithProcessedGen.length > 0) { /* ... same ... */ }

    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING) + VERTICAL_SPACING; 
      overallMaxY = Math.max(overallMaxY, y + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING;
      const levelMembers = membersByGeneration[gen] || [];
      levelMembers.sort((a, b) => { /* ... same sort ... */ });

      const membersInThisLevelProcessed: TreeNode[] = [];
      levelMembers.forEach((memberData) => {
        if (processedNodesMap[String(memberData.id)]) return; 
        let x = currentXInLevel;
        const parentNode = memberData.parentId ? processedNodesMap[String(memberData.parentId)] : null;
        if (parentNode) { /* ... (centering logic for children - same as before) ... */ }
        x = Math.max(x, currentXInLevel);
        
        const typedMember = memberData as FamilyMember;
        const childrenIds = membersWithProcessedGen.filter(m => String(m.parentId) === String(typedMember.id)).map(c => String(c.id));
        
        // Check if this member has a spouse explicitly set from data
        const spouseDataFromTree = typedMember.spouseId ? membersById[String(typedMember.spouseId)] : undefined;

        const node: TreeNode = { 
            ...typedMember, name: typedMember.name || "Unnamed", 
            x, y, childrenIds, 
            spouseId: spouseDataFromTree ? String(spouseDataFromTree.id) : undefined,
        };
        
        processedNodesMap[String(typedMember.id)] = node;
        membersInThisLevelProcessed.push(node);
        currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;

        // If spouse exists and not yet processed, position them
        if (node.spouseId && spouseDataFromTree && !processedNodesMap[node.spouseId]) {
            const spouseX = x + SPOUSE_HORIZONTAL_OFFSET;
            const spouseNode: TreeNode = {
                ...(spouseDataFromTree as FamilyMember),
                name: spouseDataFromTree.name || "Unnamed Spouse",
                x: spouseX, y,
                childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(spouseDataFromTree.id)).map(c => String(c.id)),
                spouseId: node.id // Link back
            };
            processedNodesMap[String(spouseDataFromTree.id)] = spouseNode;
            membersInThisLevelProcessed.push(spouseNode);
            // node.spouseNodeX = spouseX; // Not strictly needed if we find spouseNode by ID
            currentXInLevel = spouseX + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      });
      newNodes.push(...membersInThisLevelProcessed.sort((a,b) => a.x - b.x)); // Add sorted by x to newNodes
    });
    
    const minX = Math.min(HORIZONTAL_SPACING, ...newNodes.map(n => n.x));
    if (minX < HORIZONTAL_SPACING && newNodes.length > 0) { 
        const shift = HORIZONTAL_SPACING - minX;
        newNodes.forEach(n => n.x += shift); 
        overallMaxX += shift;
    }

    // Create Edges (Parent-Child and Spouse lines)
    newNodes.forEach(node => {
      // Parent-child edges
      const parentIdStr = String(node.parentId);
      if (node.parentId && processedNodesMap[parentIdStr]) {
        const parentNode = processedNodesMap[parentIdStr];
        let startX = parentNode.x + NODE_CONTENT_WIDTH / 2;
        const startY = parentNode.y + NODE_TOTAL_HEIGHT; 

        if (parentNode.spouseId && processedNodesMap[String(parentNode.spouseId)]) {
          const spouseNode = processedNodesMap[String(parentNode.spouseId)];
          startX = (Math.min(parentNode.x, spouseNode.x) + Math.max(parentNode.x, spouseNode.x) + NODE_CONTENT_WIDTH) / 2;
        }
        const endX = node.x + NODE_CONTENT_WIDTH / 2;
        const endY = node.y; 
        newEdges.push({ /* ... parent-child edge ... */ });
      }
      // Spouse edges (Horizontal line between couple)
      if (node.spouseId && processedNodesMap[String(node.spouseId)]) {
        const spouseNode = processedNodesMap[String(node.spouseId)];
        // Draw only once per couple (e.g., if current node's ID is less than spouse's ID to avoid duplicates)
        if (String(node.id) < String(node.spouseId)) {
            const lineY = node.y + COUPLE_LINE_Y_OFFSET; // Mid-height of avatar
            const x1 = node.x + NODE_CONTENT_WIDTH;     // Right edge of first spouse (assuming node is left)
            const x2 = spouseNode.x;                      // Left edge of second spouse
            newEdges.push({
                id: `spouse-<span class="math-inline">\{node\.id\}\-</span>{node.spouseId}`,
                path: `M${x1 - (NODE_CONTENT_WIDTH - NODE_AVATAR_DIAMETER)/2},<span class="math-inline">\{lineY\} H</span>{x2 + (NODE_CONTENT_WIDTH - NODE_AVATAR_DIAMETER)/2}`,
                type: 'spouse',
            });
        }
      }
    });
    setLayout({ nodes: newNodes, edges: newEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });
  }, [tree]); // Removed zoomLevel from dependency array as it's for parent scaling

  const handleNodeClick = (memberId: string) => {/* ... */};
  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => {/* ... */};
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => {/* ... */};
  const getOrdinal = (gen?: number): string => { /* ... */ };

  if (!initialTree || !initialTree.members) { /* ... */ }
  if (initialTree.members.length === 0) { /* ... */ }
  if (layout.nodes.length === 0 && initialTree.members.length > 0 && tree.members.length > 0) { /* ... */ }
  if (layout.nodes.length === 0) { /* ... */ }

  return (
    <>
      <div
        className="relative" 
        style={{ // THIS DIV IS NO LONGER SCALED INTERNALLY BY ITS OWN zoomLevel PROP
          width: `${layout.width}px`, height: `${layout.height}px`,
          backgroundImage: 'radial-gradient(hsl(var(--border)/0.1) 0.5px, transparent 0.5px)', // Subtle dot grid
          backgroundSize: '10px 10px',
        }}
      >
        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowhead-child" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" className="fill-muted-foreground" />
            </marker>
          </defs>
          <g>
            {layout.edges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                stroke={edge.type === 'spouse' ? 'var(--uganda-red, #DC2626)' : 'hsl(var(--muted-foreground))'}
                strokeWidth={edge.type === 'spouse' ? "2" : "1.5"}
                fill="none"
                markerEnd={edge.type === 'parent-child' ? "url(#arrowhead-child)" : "none"}
                strokeLinecap={edge.type === 'spouse' ? "round" : "butt"}
              />
            ))}
          </g>
        </svg
