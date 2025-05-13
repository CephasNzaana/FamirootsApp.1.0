// src/components/FamilyTreeDisplay.tsx

import React, { useState, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types"; // Ensure FamilyMember includes spouseId?: string;
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2, ShieldCheck } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

// Layout Constants
const NODE_AVATAR_DIAMETER = 56;
const NODE_TEXT_AREA_HEIGHT = 30; 
const NODE_VERTICAL_PADDING = 5; 
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT + (NODE_VERTICAL_PADDING * 2); 
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 40; 
const HORIZONTAL_SPACING_SIBLINGS = 25; 
const HORIZONTAL_SPACING_COUPLE = 15;  
const VERTICAL_SPACING_GENERATIONS = 65;
const COUPLE_LINE_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; 
const CHILD_LINE_JUNCTION_OFFSET = 20; // How far down from couple line children lines branch off

interface TreeNode extends FamilyMember {
  x: number; // Center X of the avatar
  y: number; // Top Y of the entire node module (including top padding)
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse-link';
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel: number; 
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel: parentZoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  
  const { nodes: layoutNodes, edges: layoutEdges, width: layoutWidth, height: layoutHeight } = useMemo(() => {
    console.log("FamilyTreeDisplay: Recalculating layout. Members:", tree?.members?.length);
    if (!tree || !tree.members || !Array.isArray(tree.members) || tree.members.length === 0) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if (m && m.id) membersById[String(m.id)] = m; });

    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => {
        if (!member || !member.id) return 0;
        if (visited.has(member.id)) { console.warn("Cycle detected for ID:", member.id); return member.generation ?? 0; } // Return existing gen if cycle
        visited.add(member.id);
        if (typeof member.generation === 'number' && !isNaN(member.generation)) return member.generation;
        const parentId = member.parentId ? String(member.parentId) : undefined;
        if (parentId && membersById[parentId]) return getNumericGenerationSafe(membersById[parentId], new Set(visited)) + 1;
        return 0;
    };
    
    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({
        ...member, name: member.name || "Unnamed", id: String(member.id),
        parentId: member.parentId ? String(member.parentId) : undefined, 
        spouseId: member.spouseId ? String(member.spouseId) : undefined,
        generation: getNumericGenerationSafe(member, new Set()),
    }));

    const membersByGeneration: Record<number, TreeNode[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0;
      if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
      membersByGeneration[gen].push({ ...member, x: 0, y: 0, childrenIds: membersWithProcessedGen.filter(c => String(c.parentId) === String(member.id)).map(c => String(c.id)) });
    });

    const positionedNodes: TreeNode[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number; unitWidth: number }>(); 
    let overallMaxX = HORIZONTAL_SPACING_SIBLINGS;
    let overallMaxY = VERTICAL_SPACING_GENERATIONS;
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    if (generationLevels.length === 0 && membersWithProcessedGen.length > 0) {
        membersByGeneration[0] = membersWithProcessedGen.map(m => ({...m, x:0, y:0, childrenIds:[]}));
        generationLevels.push(0);
    }

    generationLevels.forEach((gen, levelIndex) => {
      const yPos = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING_GENERATIONS) + VERTICAL_SPACING_GENERATIONS;
      overallMaxY = Math.max(overallMaxY, yPos + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH / 2;
      
      const levelNodesUnplaced = [...(membersByGeneration[gen] || [])];
      levelNodesUnplaced.sort((a,b) => (String(a.parentId || "z")).localeCompare(String(b.parentId || "z")) || (String(a.birthYear||"9999")).localeCompare(String(b.birthYear||"9999")));
      
      const levelProcessedThisPass: Record<string, boolean> = {};

      for (let i = 0; i < levelNodesUnplaced.length; i++) {
        const memberData = levelNodesUnplaced[i];
        if (levelProcessedThisPass[memberData.id]) continue;

        let nodeX = currentXInLevel;
        let currentUnitWidth = NODE_EFFECTIVE_WIDTH;
        
        const parentNodeData = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;
        if(parentNodeData) {
            const parentLayoutInfo = nodePositions.get(parentNodeData.id);
            if (parentLayoutInfo) {
                const siblings = membersWithProcessedGen.filter(s => s.parentId === parentNodeData.id);
                const siblingIndex = siblings.findIndex(s => s.id === memberData.id);
                const numSiblings = siblings.length > 0 ? siblings.length : 1; // Avoid division by zero for block width

                let parentUnitCenterX = parentLayoutInfo.x; 
                if (parentNodeData.spouseId && nodePositions.has(parentNodeData.spouseId)) {
                    const spouseLayoutInfo = nodePositions.get(parentNodeData.spouseId)!;
                    parentUnitCenterX = (parentLayoutInfo.x + spouseLayoutInfo.x) / 2;
                }
                
                const childrenBlockWidth = numSiblings * NODE_EFFECTIVE_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING_SIBLINGS;
                const firstChildXTarget = parentUnitCenterX - childrenBlockWidth / 2 + NODE_EFFECTIVE_WIDTH / 2; 
                nodeX = firstChildXTarget + siblingIndex * (NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
        nodeX = Math.max(nodeX, currentXInLevel);

        const node: TreeNode = { ...memberData, x: nodeX, y: yPos };
        
        positionedNodes.push(node);
        nodePositions.set(node.id, { x: nodeX, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
        levelProcessedThisPass[node.id] = true;
        currentXInLevel = nodeX + NODE_EFFECTIVE_WIDTH / 2 + HORIZONTAL_SPACING_SIBLINGS;

        if (node.spouseId && !nodePositions.has(node.spouseId)) {
            const spouseData = membersById[node.spouseId];
            if (spouseData && spouseData.generation === node.generation) {
                const spouseIndexInLevel = levelNodesUnplaced.findIndex(n => n.id === spouseData.id);
                if (spouseIndexInLevel !== -1) levelNodesUnplaced.splice(spouseIndexInLevel, 1);
                
                const spouseX = nodeX + NODE_AVATAR_DIAMETER/2 + HORIZONTAL_SPACING_COUPLE + NODE_AVATAR_DIAMETER/2;
                const spouseNode: TreeNode = {
                    ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse",
                    x: spouseX, y: yPos, spouseId: node.id,
                    childrenIds: membersWithProcessedGen.filter(m => m.parentId === spouseData.id).map(c => c.id)
                };
                positionedNodes.push(spouseNode);
                nodePositions.set(spouseNode.id, { x: spouseNode.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
                levelProcessedThisPass[spouseNode.id] = true;
                
                const coupleUnitStartX = Math.min(node.x, spouseNode.x) - NODE_AVATAR_DIAMETER/2; // Use avatar diameter for actual visual width
                const coupleUnitEndX = Math.max(node.x, spouseNode.x) + NODE_AVATAR_DIAMETER/2;
                const coupleUnitTotalWidth = coupleUnitEndX - coupleUnitStartX;
                const coupleUnitCenter = (node.x + spouseNode.x) / 2;
                
                // Update the first spouse's layout info to represent the couple unit for child centering
                nodePositions.set(node.id, { x: coupleUnitCenter, y:yPos, unitWidth: coupleUnitTotalWidth });
                currentXInLevel = spouseNode.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
            } else { node.spouseId = undefined; }
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel - HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH/2);
      }
    });
    
    // Overlap reduction logic (can be complex, keeping it simple for now)
    for (const gen of generationLevels) {
        const nodesInGen = positionedNodes.filter(n => n.generation === gen).sort((a,b) => a.x - b.x);
        for (let i = 0; i < nodesInGen.length - 1; i++) {
            const n1 = nodesInGen[i];
            const n2 = nodesInGen[i+1];
            const n1RightEdge = n1.x + NODE_AVATAR_DIAMETER / 2;
            const n2LeftEdge = n2.x - NODE_AVATAR_DIAMETER / 2;
            const desiredSpacing = (n1.spouseId === n2.id || n2.spouseId === n1.id) ? HORIZONTAL_SPACING_COUPLE : HORIZONTAL_SPACING_SIBLINGS;

            if (n2LeftEdge < n1RightEdge + desiredSpacing) {
                 const shiftNeeded = (n1RightEdge + desiredSpacing) - n2LeftEdge;
                 for(let k=i+1; k < nodesInGen.length; k++){ // Shift this node and all subsequent nodes on the same level
                    const nodeToShift = nodesInGen[k];
                    nodeToShift.x += shiftNeeded;
                    nodePositions.set(nodeToShift.id, {...nodePositions.get(nodeToShift.id)!, x: nodeToShift.x });
                 }
                 overallMaxX = Math.max(overallMaxX, nodesInGen[nodesInGen.length-1].x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
    }
    if (positionedNodes.length > 0) {
        const lastNodeByX = positionedNodes.reduce((prev, current) => (prev.x + (nodePositions.get(prev.id)?.unitWidth || NODE_EFFECTIVE_WIDTH)/2 > current.x + (nodePositions.get(current.id)?.unitWidth || NODE_EFFECTIVE_WIDTH)/2) ? prev : current);
        overallMaxX = Math.max(overallMaxX, lastNodeByX.x + (nodePositions.get(lastNodeByX.id)?.unitWidth || NODE_EFFECTIVE_WIDTH)/2 + HORIZONTAL_SPACING_SIBLINGS);
    }

    // Create Edges
    positionedNodes.forEach(node => {
      const nodeCenterAvatarX = node.x;
      const nodeAvatarTopY = node.y; // Top of avatar circle
      const nodeTextBottomY = node.y + NODE_TOTAL_HEIGHT - NODE_VERTICAL_PADDING; // Bottom of text area

      // Parent-child edges
      if (node.parentId && nodePositions.has(node.parentId)) {
        const parentNode = positionedNodes.find(p => p.id === node.parentId)!; // Should exist
        let parentUnitCenterX = parentNode.x; 
        // Y position for line start: slightly below the parent avatar, from center of text area
        let parentLineStartY = parentNode.y + NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT / 2; 

        if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
          const spouseNode = positionedNodes.find(s=>s.id === parentNode.spouseId)!;
          parentUnitCenterX = (parentNode.x + spouseNode.x) / 2; // Midpoint between two avatar centers
          // For children of a couple, start the line from below the couple's horizontal connecting line
          parentLineStartY = parentNode.y + COUPLE_LINE_Y_OFFSET + CHILD_LINE_JUNCTION_OFFSET;
        }
        
        const childTopY = nodeAvatarTopY;
        const childCenterX = nodeCenterAvatarX;
        
        const midYLineStart = parentLineStartY + (VERTICAL_SPACING_GENERATIONS - CHILD_LINE_JUNCTION_OFFSET) / 2;
        const midYLineEnd = childTopY - (VERTICAL_SPACING_GENERATIONS - CHILD_LINE_JUNCTION_OFFSET) / 2;
        
        edges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${parentUnitCenterX},${parentLineStartY} L${parentUnitCenterX},${midYLineStart} L${childCenterX},${midYLineStart} L${childCenterX},${childTopY}`,
          type: 'parent-child',
        });
      }

      // Spouse link
      if (node.spouseId && nodePositions.has(node.spouseId)) {
        const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
        if (String(node.id) < String(node.spouseId)) { 
            const yMarriageLine = node.y + COUPLE_LINE_Y_OFFSET;
            const x1 = node.x + NODE_AVATAR_DIAMETER / 2; 
            const x2 = spouseNode.x - NODE_AVATAR_DIAMETER / 2; 
            if (x2 > x1 + 2) { // Only draw if there's a bit of space between avatar edges
                 edges.push({
                    id: `spouse-${node.id}-${node.spouseId}`,
                    path: `M${x1 + 2},${yMarriageLine} H${x2 - 2}`,
                    type: 'spouse-link',
                });
            }
        }
      }
    });
    
    setLayout({ nodes: positionedNodes, edges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });
  }, [tree]); 

  const handleNodeClick = (memberId: string) => {/* ... */};
  const handleAddMemberClick = (targetMemberId: string | null, relationshipType: string) => { /* ... */ };
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => { /* ... */ };
  const getOrdinal = (gen?: number): string => { /* ... */ };

  const getNodeStyling = (node: TreeNode): { avatarBg: string, avatarBorder: string, avatarIcon: string, textColor: string } => {
    const isSelected = selectedMemberId === String(node.id);
    let colors = { /* ... (Same as your last getNodeStyling, ensure uganda-red etc. are CSS vars or Tailwind classes) ... */ 
        avatarBg: 'bg-slate-100 dark:bg-slate-700', avatarBorder: 'border-slate-400 dark:border-slate-500',
        avatarIcon: 'text-slate-500 dark:text-slate-400', textColor: 'text-slate-700 dark:text-slate-200',
    };
    if (node.isElder) { colors.avatarBg = 'bg-yellow-400/80'; colors.avatarBorder = 'border-amber-500'; colors.avatarIcon = 'text-yellow-900'; colors.textColor = 'text-amber-700';}
    else if (node.relationship === "Self") { colors.avatarBg = 'bg-uganda-red/80'; colors.avatarBorder = 'border-red-700'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-uganda-red'; }
    else if (node.relationship === "Father" || node.relationship === "Mother" || node.relationship === "Spouse") { colors.avatarBg = 'bg-blue-500/20'; colors.avatarBorder = 'border-blue-500'; colors.avatarIcon = node.gender === 'female' ? 'text-pink-600' : 'text-blue-600'; colors.textColor = 'text-blue-700';}
    else if (node.relationship?.includes("Grand")) { colors.avatarBg = 'bg-green-500/20'; colors.avatarBorder = 'border-green-500'; colors.avatarIcon = node.gender === 'female' ? 'text-pink-500' : 'text-green-600'; colors.textColor = 'text-green-700';}
    // Add more roles
    if (isSelected) { colors.avatarBorder = 'border-uganda-red ring-2 ring-uganda-red'; }
    return colors;
  };

  // Conditional rendering for loading/empty states...
  if (!initialTree || !initialTree.members) return <div className="p-10 text-center">Tree data unavailable.</div>;
  if (initialTree.members.length === 0) return <div className="p-10 text-center">No members in this tree.</div>;
  if (layoutNodes.length === 0) return <div className="p-10 text-center">Calculating layout...</div>;

  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
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
                className={`${edge.type === 'spouse-link' ? 'stroke-[var(--uganda-red)] dark:stroke-[var(--uganda-red)]' : 'stroke-muted-foreground/60'}`}
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
            <div // This is the layout bounding box, centered on node.x (avatar center)
              key={node.id}
              id={`member-node-${node.id}`}
              className="absolute group cursor-pointer flex flex-col items-center transition-transform duration-150 ease-in-out hover:z-20"
              style={{ 
                  left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, 
                  top: `${node.y}px`,
                  width: `${NODE_EFFECTIVE_WIDTH}px`, 
                  paddingTop: `${NODE_VERTICAL_PADDING}px`,
                  paddingBottom: `${NODE_VERTICAL_PADDING}px`,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
              onClick={() => handleNodeClick(String(node.id))}
            >
                <HoverCard openDelay={150} closeDelay={50}>
                    <HoverCardTrigger asChild>
                        {/* Avatar and Text content */}
                        <div className="flex flex-col items-center w-full">
                            <div className={`relative rounded-full flex items-center justify-center overflow-hidden
                                          border-2 shadow-md ${styling.avatarBorder} ${styling.avatarBg}
                                          ${isSelected ? 'ring-2 ring-offset-1 ring-[var(--uganda-red)]' : 'group-hover:shadow-lg'}`}
                                  style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER }}>
                              {node.photoUrl ? (
                                <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                              ) : (
                                <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.6} className={styling.avatarIcon} />
                              )}
                              {node.isElder && <ShieldCheck className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 fill-background p-0.5" title="Clan Elder"/>}
                            </div>
                            <div className="mt-1 text-center w-full px-0.5" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                              <p className={`font-semibold text-[10px] ${styling.textColor} truncate leading-tight`} title={node.name || "Unnamed"}>
                                {node.name || "Unnamed"}
                              </p>
                              {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                                <p className="text-[9px] text-muted-foreground leading-tight">
                                  {node.birthYear ? `b.${node.birthYear.substring(0,4)}` : ""}{node.birthYear && node.deathYear ? " - " : ""}{node.deathYear ? `d.${node.deathYear.substring(0,4)}` : (node.status === 'deceased' && !node.deathYear ? " (dec)" : "")}
                                </p>
                              )}
                            </div>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl">
                        {/* ... Your HoverCardContent JSX - make sure it uses node.name || "Unnamed" etc. ... */}
                        <h4 className="font-bold text-sm mb-1.5">{node.name || "Unnamed"}</h4>
                        {node.relationship && <p><strong className="font-medium">Rel:</strong> {node.relationship}</p>}
                        {node.birthYear && <p><strong className="font-medium">Born:</strong> {node.birthYear}</p>}
                        {node.deathYear && <p><strong className="font-medium">Died:</strong> {node.deathYear}</p>}
                        {node.gender && <p><strong className="font-medium">Gender:</strong> {node.gender}</p>}
                        {node.notes && <p className="mt-1 pt-1 border-t border-dashed text-[10px] italic">Notes: {node.notes}</p>}
                    </HoverCardContent>
                </HoverCard>
             </div>
          );
        })}
      </div>
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        {/* ... Dialog content for adding members ... */}
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
