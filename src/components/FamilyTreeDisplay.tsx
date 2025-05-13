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
const NODE_TEXT_AREA_HEIGHT = 35; 
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT + 10; 
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 30; // Avatar + some horizontal padding for layout
const HORIZONTAL_SPACING_SIBLINGS = 25; 
const HORIZONTAL_SPACING_COUPLE = 15;  // Closer spacing for spouses
const VERTICAL_SPACING_GENERATIONS = 70;
const COUPLE_LINE_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; 
const CHILD_LINE_DROP_FROM_COUPLE_LINE = 20; 

interface TreeNode extends FamilyMember {
  x: number; // Center X of the avatar
  y: number; // Top Y of the avatar module (slightly above avatar for text placement)
  // childrenIds and spouseId are on FamilyMember type
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse-link';
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel: number; // This prop is for the PARENT container to scale this component
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel: parentZoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  
  const { nodes: layoutNodes, edges: layoutEdges, width: layoutWidth, height: layoutHeight } = useMemo(() => {
    console.log("FamilyTreeDisplay: Recalculating layout. Tree members:", tree?.members?.length);
    if (!tree || !tree.members || !Array.isArray(tree.members) || tree.members.length === 0) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if (m && m.id) membersById[String(m.id)] = m; });

    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => {
        if (!member || !member.id) return 0;
        if (visited.has(member.id)) { return 0; } 
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
        spouseId: member.spouseId ? String(member.spouseId) : undefined, // Ensure spouseId is string
        generation: getNumericGenerationSafe(member, new Set()),
    }));

    const membersByGeneration: Record<number, TreeNode[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0;
      if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
      membersByGeneration[gen].push({ ...member, x: 0, y: 0, childrenIds: [] });
    });

    const positionedNodes: TreeNode[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number; nodeWidth: number }>(); // Store center X, top Y, and effective width for a node/couple unit
    let overallMaxX = HORIZONTAL_SPACING_SIBLINGS;
    let overallMaxY = VERTICAL_SPACING_GENERATIONS;

    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    generationLevels.forEach((gen, levelIndex) => {
      const yPos = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING_GENERATIONS) + VERTICAL_SPACING_GENERATIONS;
      overallMaxY = Math.max(overallMaxY, yPos + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING_SIBLINGS;
      
      const levelNodesUnplaced = [...(membersByGeneration[gen] || [])];
      levelNodesUnplaced.sort((a,b) => (String(a.parentId || "z")).localeCompare(String(b.parentId || "z")) || (String(a.birthYear||"9999")).localeCompare(String(b.birthYear||"9999")));
      
      const levelProcessedThisPass: Record<string, boolean> = {};

      for (let i = 0; i < levelNodesUnplaced.length; i++) {
        const memberData = levelNodesUnplaced[i];
        if (levelProcessedThisPass[memberData.id]) continue;

        let nodeX = Math.max(currentXInLevel, HORIZONTAL_SPACING_SIBLINGS); // Default X if no parent
        let currentUnitWidth = NODE_EFFECTIVE_WIDTH;

        // Attempt to position under parent unit center
        if (memberData.parentId && nodePositions.has(memberData.parentId)) {
            const parentLayoutInfo = nodePositions.get(memberData.parentId)!;
            const parentNode = positionedNodes.find(n => n.id === memberData.parentId)!; // Parent must exist if in nodePositions

            const siblings = membersWithProcessedGen.filter(s => s.parentId === memberData.parentId);
            const siblingIndex = siblings.findIndex(s => s.id === memberData.id);
            const numSiblings = siblings.length;

            let parentUnitCenterX = parentLayoutInfo.x; // Center of single parent
             if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
                const spouseLayoutInfo = nodePositions.get(parentNode.spouseId)!;
                parentUnitCenterX = (parentLayoutInfo.x + spouseLayoutInfo.x) / 2; // Midpoint of couple
            }

            const childrenBlockWidth = numSiblings * NODE_EFFECTIVE_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING_SIBLINGS;
            const firstChildXTarget = parentUnitCenterX - childrenBlockWidth / 2 + NODE_EFFECTIVE_WIDTH / 2; // Target center of first child
            nodeX = firstChildXTarget + siblingIndex * (NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS);
        }
        nodeX = Math.max(nodeX, currentXInLevel); // Ensure no overlap

        const node: TreeNode = { ...memberData, x: nodeX, y: yPos, childrenIds: membersWithProcessedGen.filter(m => m.parentId === memberData.id).map(c => c.id) };
        
        positionedNodes.push(node);
        nodePositions.set(node.id, { x: nodeX, y: yPos, nodeWidth: NODE_EFFECTIVE_WIDTH });
        levelProcessedThisPass[node.id] = true;
        currentXInLevel = nodeX + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS; // Next available X starts after this node

        // If this node has a spouse, position them now
        if (node.spouseId && !nodePositions.has(node.spouseId)) {
            const spouseData = membersById[node.spouseId];
            if (spouseData && spouseData.generation === node.generation) { // Ensure spouse is on same generation
                const spouseIndexInLevel = levelNodesUnplaced.findIndex(n => n.id === spouseData.id);
                if (spouseIndexInLevel !== -1) levelNodesUnplaced.splice(spouseIndexInLevel, 1); // Remove spouse from unplaced list
                
                const spouseX = nodeX + NODE_AVATAR_DIAMETER/2 + HORIZONTAL_SPACING_COUPLE + NODE_AVATAR_DIAMETER/2; // Place spouse very close, centered
                const spouseNode: TreeNode = {
                    ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse",
                    x: spouseX, y: yPos, spouseId: node.id,
                    childrenIds: membersWithProcessedGen.filter(m => m.parentId === spouseData.id).map(c => c.id)
                };
                positionedNodes.push(spouseNode);
                nodePositions.set(spouseNode.id, { x: spouseNode.x, y: yPos, nodeWidth: NODE_EFFECTIVE_WIDTH });
                levelProcessedThisPass[spouseNode.id] = true;
                
                // Adjust overall unit width for the couple for centering children under them later
                const coupleUnitStartX = Math.min(node.x, spouseNode.x) - NODE_EFFECTIVE_WIDTH/2;
                const coupleUnitEndX = Math.max(node.x, spouseNode.x) + NODE_EFFECTIVE_WIDTH/2;
                const coupleUnitTotalWidth = coupleUnitEndX - coupleUnitStartX;
                // Update the "main" node's width to reflect the couple unit for child centering calculations by other nodes
                nodePositions.set(node.id, { x: (node.x + spouseNode.x)/2 , y:yPos, nodeWidth: coupleUnitTotalWidth});


                currentXInLevel = spouseX + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
            } else {
                node.spouseId = undefined; // SpouseData not found or different generation
            }
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      }
    });
    
    // X-Overlap reduction pass
    for (const gen of generationLevels) {
        const nodesInGen = positionedNodes.filter(n => n.generation === gen).sort((a,b) => a.x - b.x);
        for (let i = 0; i < nodesInGen.length - 1; i++) {
            const n1 = nodesInGen[i];
            const n1Pos = nodePositions.get(n1.id)!;
            const n2 = nodesInGen[i+1];
            const n2Pos = nodePositions.get(n2.id)!;
            
            const requiredGap = (n1.spouseId === n2.id || n2.spouseId === n1.id) ? 
                                (NODE_AVATAR_DIAMETER + HORIZONTAL_SPACING_COUPLE) : 
                                (NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS);
            
            const n1RightEdge = n1Pos.x + NODE_AVATAR_DIAMETER/2; // n1Pos.x is center
            const n2LeftEdge = n2Pos.x - NODE_AVATAR_DIAMETER/2;  // n2Pos.x is center

            if (n2LeftEdge < n1RightEdge + HORIZONTAL_SPACING_SIBLINGS -10 ) { // Allow a bit less than full sibling spacing if not spouses
                 const shiftNeeded = (n1RightEdge + HORIZONTAL_SPACING_SIBLINGS) - n2LeftEdge;
                 for(let k=i+1; k < nodesInGen.length; k++){
                    const nodeToShift = nodesInGen[k];
                    nodeToShift.x += shiftNeeded;
                    nodePositions.set(nodeToShift.id, {...nodePositions.get(nodeToShift.id)!, x: nodeToShift.x });
                 }
                 overallMaxX = Math.max(overallMaxX, nodesInGen[nodesInGen.length-1].x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
    }
    if (positionedNodes.length > 0) { // Final adjustment for overallMaxX
        const lastNodeByX = positionedNodes.reduce((prev, current) => (prev.x > current.x) ? prev : current);
        overallMaxX = Math.max(overallMaxX, lastNodeByX.x + NODE_EFFECTIVE_WIDTH / 2 + HORIZONTAL_SPACING_SIBLINGS);
    }


    // Create Edges based on final positions
    positionedNodes.forEach(node => {
      const nodeCenterAvatarX = node.x;
      const nodeBottomTextY = node.y + NODE_TOTAL_HEIGHT; // Bottom of the entire node module
      const nodeAvatarCenterY = node.y + NODE_AVATAR_DIAMETER / 2;

      // Parent-child edges
      if (node.parentId && nodePositions.has(node.parentId)) {
        const parentNode = positionedNodes.find(p => p.id === node.parentId)!;
        const parentLayoutInfo = nodePositions.get(parentNode.id)!;
        
        let coupleUnitCenterX = parentLayoutInfo.x; // Parent's avatar center X
        const parentUnitBottomY = parentNode.y + NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT; // Point below text

        if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
          const spouseLayoutInfo = nodePositions.get(parentNode.spouseId)!;
          coupleUnitCenterX = (parentLayoutInfo.x + spouseLayoutInfo.x) / 2; // Midpoint between two avatar centers
        }
        
        const childTopY = node.y; // Top of child's avatar
        const childCenterX = node.x;

        const controlPointOffsetY = VERTICAL_SPACING_GENERATIONS / 2.5;
        edges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${coupleUnitCenterX},${parentUnitBottomY} C ${coupleUnitCenterX},${parentUnitBottomY + controlPointOffsetY} ${childCenterX},${childTopY - controlPointOffsetY} ${childCenterX},${childTopY}`,
          type: 'parent-child',
        });
      }

      // Spouse link
      if (node.spouseId && nodePositions.has(node.spouseId)) {
        const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
        if (node.id < node.spouseId) { // Draw line once per couple
            const yMarriageLine = node.y + COUPLE_LINE_Y_OFFSET; // Vertically centered on avatars
            // Start from right edge of left avatar, end at left edge of right avatar
            const x1 = Math.min(node.x, spouseNode.x) + NODE_AVATAR_DIAMETER / 2;
            const x2 = Math.max(node.x, spouseNode.x) - NODE_AVATAR_DIAMETER / 2;
            if (x2 > x1) { // Only draw if there's space (i.e., they are not overlapping too much)
                 edges.push({
                    id: `spouse-${node.id}-${node.spouseId}`,
                    path: `M${x1 + 2},${yMarriageLine} H${x2 - 2}`, // Shorten slightly to not touch avatars
                    type: 'spouse-link',
                });
            }
        }
      }
    });
    
    console.log(`FamilyTreeDisplay: Layout done. Nodes: ${positionedNodes.length}, Edges: ${edges.length}, W: ${overallMaxX}, H: ${overallMaxY}`);
    return { nodes: positionedNodes, edges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) };

  }, [tree]); 

  const handleNodeClick = (memberId: string) => setSelectedMemberId(prevId => prevId === memberId ? null : String(memberId));
  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => { /* ... as before ... */ };
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => { /* ... as before, calling onTreeUpdate if provided ... */ };
  const getOrdinal = (gen?: number): string => { /* ... as before ... */ };

  const getNodeStyling = (node: TreeNode): { avatarBg: string, avatarBorder: string, avatarIcon: string, textColor: string, nodeBorderColor: string } => {
    const isSelected = selectedMemberId === String(node.id);
    let colors = {
        avatarBg: 'bg-slate-100 dark:bg-slate-700',
        avatarBorder: 'border-slate-300 dark:border-slate-600',
        avatarIcon: 'text-slate-500 dark:text-slate-400',
        textColor: 'text-slate-700 dark:text-slate-200',
        nodeBorderColor: isSelected ? 'border-uganda-red' : 'border-transparent' // For selection indication on overall node module
    };

    if (node.isElder) {
        colors.avatarBg = 'bg-yellow-400/30 dark:bg-yellow-600/30'; colors.avatarBorder = 'border-uganda-yellow'; colors.avatarIcon = 'text-yellow-700 dark:text-uganda-yellow'; colors.textColor = 'text-yellow-700 dark:text-yellow-300';
        if (isSelected) colors.nodeBorderColor = 'border-uganda-yellow ring-2 ring-uganda-yellow'; else colors.nodeBorderColor = 'border-uganda-yellow';
    } else if (node.relationship === "Self" || node.relationship === "Proband") {
        colors.avatarBg = 'bg-uganda-red/20 dark:bg-uganda-red/30'; colors.avatarBorder = 'border-uganda-red'; colors.avatarIcon = 'text-uganda-red dark:text-red-400'; colors.textColor = 'text-uganda-red dark:text-red-400';
        if (isSelected) colors.nodeBorderColor = 'border-uganda-red ring-2 ring-uganda-red'; else colors.nodeBorderColor = 'border-uganda-red/70';
    } else if (node.relationship === "Father" || node.relationship === "Mother" || node.relationship === "Spouse") {
        colors.avatarBg = 'bg-blue-500/10 dark:bg-blue-700/20'; colors.avatarBorder = 'border-blue-500/50'; colors.avatarIcon = node.gender === 'female' ? 'text-pink-500' : 'text-blue-500'; colors.textColor = 'text-blue-600 dark:text-blue-400';
    } else if (node.relationship?.includes("Grand")) {
        colors.avatarBg = 'bg-green-500/10 dark:bg-green-700/20'; colors.avatarBorder = 'border-green-500/50'; colors.avatarIcon = node.gender === 'female' ? 'text-pink-400' : 'text-green-500'; colors.textColor = 'text-green-600 dark:text-green-400';
    } else if (node.relationship === "Brother" || node.relationship === "Sister" || node.relationship === "Sibling") {
        colors.avatarBg = 'bg-teal-500/10 dark:bg-teal-700/20'; colors.avatarBorder = 'border-teal-500/50'; colors.avatarIcon = 'text-teal-500 dark:text-teal-400';
    } else if (node.relationship === "Son" || node.relationship === "Daughter" || node.relationship === "Child") {
        colors.avatarBg = 'bg-orange-500/10 dark:bg-orange-700/20'; colors.avatarBorder = 'border-orange-500/50'; colors.avatarIcon = 'text-orange-500 dark:text-orange-400';
    }
    
    // Override for selection, making it more prominent than role-based border if any
    if (isSelected) {
        colors.nodeBorderColor = 'border-uganda-red ring-2 ring-uganda-red';
    }
    return colors;
  };

  if (!initialTree || !initialTree.members) return <div className="p-10 text-center text-muted-foreground">Tree data unavailable.</div>;
  if (initialTree.members.length === 0) return <div className="p-10 text-center text-muted-foreground">No members to display.</div>;
  if (layoutNodes.length === 0) return <div className="p-10 text-center text-muted-foreground">Calculating layout...</div>;

  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
          // This component is NOT scaled by its own zoomLevel prop. Parent component scales this div's container.
          // zoomLevel prop passed to FamilyTreeDisplay is for potential internal rendering adjustments, not overall scaling here.
          backgroundImage: 'radial-gradient(hsl(var(--border)/0.05) 0.5px, transparent 0.5px)',
          backgroundSize: '15px 15px',
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
          const isSelected = selectedMemberId === String(node.id);

          return (
            <HoverCard key={node.id} openDelay={150} closeDelay={50}>
              <HoverCardTrigger asChild>
                <div // This is the main clickable node area (bounding box for layout)
                  id={`member-${node.id}`}
                  className={`absolute group cursor-pointer flex flex-col items-center transition-all duration-150 ease-in-out hover:z-20
                              ${isSelected ? 'z-30' : 'z-10'}`} // Higher z-index for selected/hovered
                  style={{ 
                      left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, // Position from center of node's effective width
                      top: `${node.y}px`,
                      width: `${NODE_EFFECTIVE_WIDTH}px`, 
                      // Height is determined by avatar + text area
                  }}
                  onClick={() => handleNodeClick(String(node.id))}
                >
                  {/* Avatar */}
                  <div className={`rounded-full flex items-center justify-center overflow-hidden
                                  border-2 shadow-md ${styling.avatarBorder} ${styling.avatarBg}
                                  ${isSelected ? 'ring-2 ring-offset-1 ring-uganda-red' : 'group-hover:shadow-lg group-hover:border-primary/50'}`}
                        style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER }}>
                    {node.photoUrl ? (
                      <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                    ) : (
                      <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.65} className={styling.avatarIcon} />
                    )}
                    {node.isElder && <ShieldCheck className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 fill-slate-800" title="Clan Elder"/>}
                  </div>
                  {/* Info Text Below Avatar */}
                  <div className="mt-1 text-center w-full" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                    <p className={`font-semibold text-[11px] ${styling.textColor} truncate leading-tight`} title={node.name || "Unnamed"}>
                      {node.name || "Unnamed"}
                    </p>
                    {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                      <p className="text-[9px] text-muted-foreground leading-tight">
                        {node.birthYear ? `b.${node.birthYear.substring(0,4)}` : "..."}{node.deathYear ? ` d.${node.deathYear.substring(0,4)}` : (node.status === 'deceased' ? " (dec)" : "")}
                      </p>
                    )}
                  </div>
                   {/* Contextual Add Buttons (optional, uncomment if needed)
                   <div className="absolute -bottom-2 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted text-muted-foreground hover:text-primary p-0" title="Add Child" onClick={e => { e.stopPropagation(); handleAddMemberClick(String(node.id), 'child');}}><UserPlus size={10}/></Button>
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted text-muted-foreground hover:text-primary p-0" title="Add Spouse" onClick={e => { e.stopPropagation(); handleAddMemberClick(String(node.id), 'spouse');}}><Link2 size={10}/></Button>
                  </div> */}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl">
                {/* ... Your HoverCardContent JSX ... */}
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
