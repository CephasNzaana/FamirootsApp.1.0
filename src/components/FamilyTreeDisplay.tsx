// src/components/FamilyTreeDisplay.tsx
import React, { useState, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2, GitMerge, ShieldCheck } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

// New Layout Constants for Avatar-centric view
const NODE_AVATAR_DIAMETER = 60;
const NODE_TEXT_AREA_HEIGHT = 35; // Space for name and birth/death years
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT + 10; // Avatar + text + padding
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 40; // Wider than avatar for text, used for X spacing
const HORIZONTAL_SPACING_SIBLINGS = 20; 
const HORIZONTAL_SPACING_COUPLE = 10;  // Spacing between two spouse avatars
const VERTICAL_SPACING_GENERATIONS = 80;
const COUPLE_LINE_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; // Y position for the couple connector line from avatar center
const CHILD_LINE_DROP_FROM_COUPLE_LINE = 20; // How far down from couple line children line starts

interface TreeNode extends FamilyMember {
  x: number; // Center X of the avatar
  y: number; // Top Y of the avatar
  // childrenIds and spouseId are already on FamilyMember type
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse-link';
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel: number; // This prop is now for parent scaling of this component's container
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  
  const [layout, setLayout] = useState<{ nodes: TreeNode[], edges: Edge[], width: number, height: number }>({ nodes: [], edges: [], width: 0, height: 0 });

  useEffect(() => {
    console.log("FamilyTreeDisplay: initialTree received. Members:", initialTree?.members?.length);
    setTree(initialTree);
  }, [initialTree]);

  const { nodes: layoutNodes, edges: layoutEdges, width: layoutWidth, height: layoutHeight } = useMemo(() => {
    console.log("FamilyTreeDisplay: Recalculating layout. Tree members:", tree?.members?.length);
    if (!tree || !tree.members || !Array.isArray(tree.members) || tree.members.length === 0) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if (m && m.id) membersById[String(m.id)] = m; });

    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => {
        if (!member || !member.id) return 0;
        if (visited.has(member.id)) { return 0; } // Cycle
        visited.add(member.id);
        if (typeof member.generation === 'number' && !isNaN(member.generation)) return member.generation;
        const parentId = member.parentId ? String(member.parentId) : undefined;
        if (parentId && membersById[parentId]) return getNumericGenerationSafe(membersById[parentId], new Set(visited)) + 1;
        return 0;
    };
    
    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({
        ...member,
        name: member.name || "Unnamed",
        id: String(member.id),
        parentId: member.parentId ? String(member.parentId) : undefined,
        spouseId: member.spouseId ? String(member.spouseId) : undefined,
        generation: getNumericGenerationSafe(member, new Set()),
    }));

    const membersByGeneration: Record<number, TreeNode[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0;
      if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
      membersByGeneration[gen].push({ ...member, x: 0, y: 0, childrenIds: [] }); // Temp x,y
    });

    const positionedNodes: TreeNode[] = [];
    const edges: Edge[] = [];
    const nodePositions: Map<string, { x: number; y: number; width: number }> = new Map();
    let overallMaxX = HORIZONTAL_SPACING_SIBLINGS;
    let overallMaxY = VERTICAL_SPACING_GENERATIONS;

    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    generationLevels.forEach((gen, levelIndex) => {
      const yPos = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING_GENERATIONS) + VERTICAL_SPACING_GENERATIONS;
      overallMaxY = Math.max(overallMaxY, yPos + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING_SIBLINGS;
      const levelNodesUnplaced = [...(membersByGeneration[gen] || [])];
      
      const placedInLevel: TreeNode[] = [];

      while(levelNodesUnplaced.length > 0) {
        const memberData = levelNodesUnplaced.shift();
        if (!memberData || nodePositions.has(memberData.id)) continue;

        let x = currentXInLevel;
        let nodeWidth = NODE_EFFECTIVE_WIDTH;
        
        const parentNodeData = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;

        if(parentNodeData) {
            const parentPos = nodePositions.get(parentNodeData.id);
            if (parentPos) {
                const siblings = membersWithProcessedGen.filter(s => s.parentId === parentNodeData.id);
                const siblingIndex = siblings.findIndex(s => s.id === memberData.id);
                const numSiblings = siblings.length;

                let parentUnitCenterX = parentPos.x + parentPos.width / 2;
                let parentUnitWidth = parentPos.width;

                if (parentNodeData.spouseId) {
                    const spousePos = nodePositions.get(parentNodeData.spouseId);
                    if (spousePos) {
                        parentUnitCenterX = (parentPos.x + parentPos.width/2 + spousePos.x + spousePos.width/2) / 2;
                        parentUnitWidth = Math.abs(spousePos.x - parentPos.x) + spousePos.width; // Approx
                    }
                }
                
                const childrenBlockWidth = numSiblings * NODE_EFFECTIVE_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING_SIBLINGS;
                const firstChildStartCorrectedX = parentUnitCenterX - childrenBlockWidth / 2;
                x = firstChildStartCorrectedX + siblingIndex * (NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
        x = Math.max(x, currentXInLevel); // Prevent overlap with node to the left

        const node: TreeNode = { ...memberData, x, y: yPos, childrenIds: membersWithProcessedGen.filter(m => m.parentId === memberData.id).map(c => c.id) };
        
        // Handle spouse placement
        if (node.spouseId && !nodePositions.has(node.spouseId)) {
            const spouseData = membersById[node.spouseId];
            if (spouseData && spouseData.generation === node.generation) { // Ensure spouse is on same generation
                const spouseIndexInLevel = levelNodesUnplaced.findIndex(n => n.id === spouseData.id);
                if (spouseIndexInLevel !== -1) levelNodesUnplaced.splice(spouseIndexInLevel, 1); // Remove spouse from unplaced

                const spouseX = x + NODE_AVATAR_DIAMETER + HORIZONTAL_SPACING_COUPLE; // Place spouse very close
                const spouseNode: TreeNode = {
                    ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse",
                    x: spouseX, y: yPos, spouseId: node.id, // Link back
                    childrenIds: membersWithProcessedGen.filter(m => m.parentId === spouseData.id).map(c => c.id)
                };
                nodePositions.set(node.id, { x, y: yPos, width: NODE_EFFECTIVE_WIDTH });
                placedInLevel.push(node);
                nodePositions.set(spouseNode.id, {x: spouseX, y: yPos, width: NODE_EFFECTIVE_WIDTH});
                placedInLevel.push(spouseNode);
                nodeWidth = (spouseX + NODE_EFFECTIVE_WIDTH) - x; // Width of couple unit
                currentXInLevel = spouseX + NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS;
            } else { // Spouse not found or on different generation, treat node as single
                node.spouseId = undefined;
                nodePositions.set(node.id, { x, y: yPos, width: NODE_EFFECTIVE_WIDTH });
                placedInLevel.push(node);
                currentXInLevel = x + NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS;
            }
        } else { // Single node or spouse already placed
            nodePositions.set(node.id, { x, y: yPos, width: NODE_EFFECTIVE_WIDTH });
            placedInLevel.push(node);
            currentXInLevel = x + NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS;
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      }
      // Add all placed nodes for this level to the main list
      placedInLevel.sort((a,b) => a.x - b.x).forEach(n => positionedNodes.push(n));
    });
    
    // Shift entire tree if minX is too small (e.g. negative)
    const allXCoords = positionedNodes.map(n => n.x - NODE_AVATAR_DIAMETER/2);
    const minTreeX = Math.min(...allXCoords, HORIZONTAL_SPACING_SIBLINGS);
    if (minTreeX < HORIZONTAL_SPACING_SIBLINGS) {
        const shiftAmount = HORIZONTAL_SPACING_SIBLINGS - minTreeX;
        positionedNodes.forEach(n => n.x += shiftAmount);
        overallMaxX += shiftAmount;
    }
    if (positionedNodes.length > 0) {
        const lastNode = positionedNodes.reduce((prev, current) => (prev.x > current.x) ? prev : current);
        overallMaxX = Math.max(overallMaxX, lastNode.x + NODE_AVATAR_DIAMETER/2 + HORIZONTAL_SPACING_SIBLINGS);
    }


    // Create Edges based on final positions
    positionedNodes.forEach(node => {
      const nodeCenterAvatarX = node.x; // x is already center of avatar
      const nodeBottomAvatarY = node.y + NODE_AVATAR_DIAMETER;
      const nodeTopAvatarY = node.y;

      // Parent-child edges
      if (node.parentId && nodePositions.has(node.parentId)) {
        const parentLayoutInfo = nodePositions.get(node.parentId)!;
        const parentNode = positionedNodes.find(p=>p.id === node.parentId)!;
        
        let coupleUnitCenterX = parentLayoutInfo.x; // Center of parent avatar
        const parentUnitBottomY = parentNode.y + NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT; // Bottom of parent text area

        if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
          const spouseLayoutInfo = nodePositions.get(parentNode.spouseId)!;
          coupleUnitCenterX = (parentLayoutInfo.x + spouseLayoutInfo.x) / 2; // Midpoint between two avatar centers
        }
        
        const childTopY = nodeTopAvatarY;
        const midY = parentUnitBottomY + VERTICAL_SPACING_GENERATIONS / 2 - CHILD_LINE_DROP_FROM_COUPLE_LINE / 2;
        
        edges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${coupleUnitCenterX},${parentUnitBottomY - NODE_TEXT_AREA_HEIGHT/2} L${coupleUnitCenterX},${midY} L${nodeCenterAvatarX},${midY} L${nodeCenterAvatarX},${childTopY}`,
          type: 'parent-child',
        });
      }

      // Spouse link
      if (node.spouseId && nodePositions.has(node.spouseId)) {
        const spouseLayoutInfo = nodePositions.get(node.spouseId)!;
        if (node.id < node.spouseId) { // Draw line once
          const yMarriageLine = node.y + COUPLE_LINE_Y_OFFSET;
          const x1 = node.x + NODE_AVATAR_DIAMETER / 2; // Right edge of first avatar
          const x2 = spouseLayoutInfo.x - NODE_AVATAR_DIAMETER / 2; // Left edge of second avatar
          edges.push({
            id: `spouse-${node.id}-${node.spouseId}`,
            path: `M${x1},${yMarriageLine} H${x2}`,
            type: 'spouse-link',
          });
        }
      }
    });
    
    console.log(`FamilyTreeDisplay: Layout done. Nodes: ${positionedNodes.length}, Edges: ${edges.length}, W: ${overallMaxX}, H: ${overallMaxY}`);
    return { nodes: positionedNodes, edges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) };

  }, [tree]); // Dependency on tree (which is set from initialTree)

  // ... (handleNodeClick, handleAddMemberClick, onSubmitNewMember, getOrdinal functions remain same) ...
  const handleNodeClick = (memberId: string) => {/* ... */};
  const handleAddMemberClick = (targetMemberId: string | null, relationshipType: string) => { /* ... */ };
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => { /* ... */ };
  const getOrdinal = (gen?: number): string => { /* ... */ };

  const getNodeStyling = (node: TreeNode): { avatarBg: string, avatarBorder: string, avatarIcon: string, textColor: string } => {
    const isSelected = selectedMemberId === String(node.id);
    let colors = {
        avatarBg: 'bg-slate-200 dark:bg-slate-700',
        avatarBorder: 'border-slate-400 dark:border-slate-500',
        avatarIcon: 'text-slate-500 dark:text-slate-400',
        textColor: 'text-slate-700 dark:text-slate-200',
    };

    if (node.isElder) { // Most prominent
        colors.avatarBg = 'bg-uganda-yellow'; colors.avatarBorder = 'border-yellow-600'; colors.avatarIcon = 'text-uganda-black'; colors.textColor = 'text-yellow-700 dark:text-uganda-yellow';
    } else if (node.relationship === "Self" || node.relationship === "Proband") {
        colors.avatarBg = 'bg-uganda-red'; colors.avatarBorder = 'border-red-700'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-uganda-red dark:text-red-400';
    } else if (node.relationship === "Father" || node.relationship === "Mother") {
        colors.avatarBg = 'bg-blue-500/80'; colors.avatarBorder = 'border-blue-600'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-blue-600 dark:text-blue-400';
    } else if (node.relationship?.includes("Grand")) {
        colors.avatarBg = 'bg-green-500/80'; colors.avatarBorder = 'border-green-600'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-green-600 dark:text-green-400';
    } else if (node.relationship === "Spouse") {
        colors.avatarBg = 'bg-purple-500/80'; colors.avatarBorder = 'border-purple-600'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-purple-600 dark:text-purple-400';
    } else if (node.relationship === "Brother" || node.relationship === "Sister" || node.relationship === "Sibling") {
        colors.avatarBg = 'bg-teal-500/80'; colors.avatarBorder = 'border-teal-600'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-teal-600 dark:text-teal-400';
    } else if (node.relationship === "Son" || node.relationship === "Daughter" || node.relationship === "Child") {
        colors.avatarBg = 'bg-orange-500/80'; colors.avatarBorder = 'border-orange-600'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-orange-600 dark:text-orange-400';
    }
    
    if (isSelected) {
        colors.avatarBorder = 'border-uganda-red ring-2 ring-uganda-red';
    }
    return colors;
  };

  if (!layoutNodes || layoutNodes.length === 0) {
      if (!initialTree || !initialTree.members || initialTree.members.length === 0) {
        return <div className="p-10 text-center text-muted-foreground">No members in this tree to display.</div>;
      }
      return <div className="p-10 text-center text-muted-foreground">Calculating tree layout...</div>;
  }


  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
          // This component is NOT scaled by its own zoomLevel prop anymore. Parent scales the container.
          backgroundImage: 'radial-gradient(hsl(var(--border)/0.05) 0.5px, transparent 0.5px)',
          backgroundSize: '12px 12px',
        }}
      >
        <svg width={layoutWidth} height={layoutHeight} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowhead-child" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto" className="fill-muted-foreground">
              <polygon points="0 0, 6 2, 0 4" />
            </marker>
          </defs>
          <g>
            {layoutEdges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                className={`${edge.type === 'spouse-link' ? 'stroke-uganda-red' : 'stroke-muted-foreground/60'}`}
                strokeWidth={edge.type === 'spouse-link' ? "2.5" : "1.5"}
                fill="none"
                markerEnd={edge.type === 'parent-child' ? "url(#arrowhead-child)" : "none"}
                strokeLinecap={edge.type === 'spouse-link' ? "round" : "butt"}
              />
            ))}
          </g>
        </svg>

        {layoutNodes.map((node) => {
          const styling = getNodeStyling(node);
          return (
            <HoverCard key={node.id} openDelay={150} closeDelay={50}>
              <HoverCardTrigger asChild>
                <div // Bounding box for click and layout, text is outside avatar
                  id={`member-${node.id}`}
                  className={`absolute group cursor-pointer flex flex-col items-center transition-all duration-150 ease-in-out hover:z-10
                              ${selectedMemberId === String(node.id) ? 'z-20' : 'z-10'}`}
                  style={{ 
                      left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, 
                      top: `${node.y}px`,
                      width: `${NODE_EFFECTIVE_WIDTH}px`, 
                      // height: `${NODE_TOTAL_HEIGHT}px`, // Height will be determined by content
                  }}
                  onClick={() => handleNodeClick(String(node.id))}
                >
                  {/* Avatar */}
                  <div className={`rounded-full flex items-center justify-center overflow-hidden
                                  border-2 shadow-md ${styling.avatarBorder} ${styling.avatarBg}
                                  ${selectedMemberId === String(node.id) ? 'ring-2 ring-offset-1 ring-uganda-red' : 'group-hover:shadow-lg'}`}
                        style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER }}>
                    {node.photoUrl ? (
                      <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                    ) : (
                      <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.6} className={styling.avatarIcon} />
                    )}
                    {node.isElder && <ShieldCheck className="absolute top-0 right-0 h-4 w-4 text-amber-400 bg-slate-800 rounded-full p-0.5" title="Clan Elder"/>}
                  </div>
                  {/* Info Text Below Avatar */}
                  <div className="mt-1 text-center w-full" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                    <p className={`font-semibold text-[11px] ${styling.textColor} truncate leading-tight`} title={node.name || "Unnamed"}>
                      {node.name || "Unnamed"}
                    </p>
                    {(node.birthYear || node.deathYear) && (
                      <p className="text-[9px] text-muted-foreground leading-tight">
                        {node.birthYear ? `b.${node.birthYear}` : "..."}{node.deathYear ? ` d.${node.deathYear}` : (node.status === 'deceased' ? " (dec)" : "")}
                      </p>
                    )}
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl">
                 {/* ... (Your HoverCardContent JSX - make sure it uses node.name || "Unnamed") ... */}
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
      <Dialog open={addMemberDialogOpen} onOpenChange={(open) => { /* ... */ }}>
        {/* ... Dialog content for adding members ... */}
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
