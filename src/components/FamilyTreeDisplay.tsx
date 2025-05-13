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
const CHILD_LINE_JUNCTION_OFFSET = 20; 

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
        if (visited.has(member.id)) { console.warn("Cycle detected for ID:", member.id); return member.generation ?? 0; }
        visited.add(member.id);
        const gen = member.generation; // Use the generation from the data if present and valid
        if (typeof gen === 'number' && !isNaN(gen)) return gen;
        
        const parentId = member.parentId ? String(member.parentId) : undefined;
        if (parentId && membersById[parentId]) {
            const parentGen = getNumericGenerationSafe(membersById[parentId], new Set(visited));
            return parentGen + 1;
        }
        // If no parent or parent not found, and generation is not set, default to 0 or handle as root
        return 0; // Default for roots or if generation cannot be derived
    };
    
    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({
        ...member, name: member.name || "Unnamed", id: String(member.id),
        parentId: member.parentId ? String(member.parentId) : undefined, 
        spouseId: member.spouseId ? String(member.spouseId) : undefined,
        generation: getNumericGenerationSafe(member, new Set()), // Ensure generation is calculated
    }));

    const membersByGeneration: Record<number, TreeNode[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0; // All members should have a generation now
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
        console.warn("FamilyTreeDisplay: No distinct generation levels found after processing, placing all in generation 0 for layout.");
        membersByGeneration[0] = membersWithProcessedGen.map(m => ({...m, x:0, y:0, childrenIds:[]})); // Add childrenIds here too
        if(!generationLevels.includes(0)) generationLevels.push(0);
        generationLevels.sort((a, b) => a - b);
    }
    
    // --- First Pass: Position Nodes Generation by Generation ---
    generationLevels.forEach((gen, levelIndex) => {
      const yPos = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING_GENERATIONS) + VERTICAL_SPACING_GENERATIONS;
      overallMaxY = Math.max(overallMaxY, yPos + NODE_TOTAL_HEIGHT + NODE_VERTICAL_PADDING);
      let currentXInLevel = HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH / 2; 
      
      const levelNodesUnplaced = [...(membersByGeneration[gen] || [])];
      levelNodesUnplaced.sort((a,b) => (String(a.parentId || "z")).localeCompare(String(b.parentId || "z")) || (String(a.birthYear||"9999")).localeCompare(String(b.birthYear||"9999")));
      
      const levelProcessedThisPass: Record<string, boolean> = {};

      for (let i = 0; i < levelNodesUnplaced.length; i++) {
        const memberData = levelNodesUnplaced[i];
        if (levelProcessedThisPass[memberData.id]) continue;

        let nodeX = currentXInLevel;
        let currentUnitEffectiveWidth = NODE_EFFECTIVE_WIDTH; // Width of a single person node for layout
        
        const parentNodeFromPositioned = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;
        if(parentNodeFromPositioned) {
            const parentLayoutInfo = nodePositions.get(parentNodeFromPositioned.id);
            if (parentLayoutInfo) {
                const siblings = membersWithProcessedGen.filter(s => s.parentId === parentNodeFromPositioned.id);
                const siblingIndex = siblings.findIndex(s => s.id === memberData.id);
                const numSiblings = siblings.length > 0 ? siblings.length : 1;

                let parentUnitCenterX = parentLayoutInfo.x; // This x is already the center of the parent unit
                
                const childrenBlockWidth = numSiblings * NODE_EFFECTIVE_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING_SIBLINGS;
                const firstChildXTarget = parentUnitCenterX - childrenBlockWidth / 2 + NODE_EFFECTIVE_WIDTH / 2; 
                nodeX = firstChildXTarget + siblingIndex * (NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
        nodeX = Math.max(nodeX, currentXInLevel);

        const node: TreeNode = { ...memberData, x: nodeX, y: yPos }; // x is avatar center
        
        // Handle spouse placement if this node has a spouse
        let unitCenterX = nodeX;
        let unitWidth = NODE_EFFECTIVE_WIDTH;

        if (node.spouseId && !levelProcessedThisPass[node.spouseId] && membersById[node.spouseId] && membersById[node.spouseId].generation === node.generation) {
            const spouseData = membersById[node.spouseId];
            const spouseIndexInLevel = levelNodesUnplaced.findIndex(n => n.id === spouseData.id);
            if (spouseIndexInLevel !== -1) levelNodesUnplaced.splice(spouseIndexInLevel, 1);
            
            // Position spouse to the right of the current node
            const spouseX = nodeX + NODE_AVATAR_DIAMETER / 2 + HORIZONTAL_SPACING_COUPLE + NODE_AVATAR_DIAMETER / 2;
            const spouseNode: TreeNode = {
                ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse",
                x: spouseX, y: yPos, spouseId: node.id,
                childrenIds: membersWithProcessedGen.filter(m => m.parentId === spouseData.id).map(c => c.id)
            };
            
            positionedNodes.push(spouseNode); // Add spouse after current node
            nodePositions.set(spouseNode.id, { x: spouseNode.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
            levelProcessedThisPass[spouseNode.id] = true;

            unitCenterX = (node.x + spouseNode.x) / 2;
            unitWidth = (spouseNode.x - node.x) + NODE_AVATAR_DIAMETER; // Width from left edge of first to right of second
            currentXInLevel = spouseNode.x + NODE_EFFECTIVE_WIDTH / 2 + HORIZONTAL_SPACING_SIBLINGS;
        } else {
            currentXInLevel = node.x + NODE_EFFECTIVE_WIDTH / 2 + HORIZONTAL_SPACING_SIBLINGS;
        }
        
        positionedNodes.push(node); // Add current node (or the first spouse of a pair)
        nodePositions.set(node.id, { x: unitCenterX, y: yPos, unitWidth: unitWidth });
        levelProcessedThisPass[node.id] = true;
        overallMaxX = Math.max(overallMaxX, currentXInLevel - HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH/2);
      }
    });
    
    // X-Overlap reduction pass (can be complex, keeping it fairly simple)
    // This pass needs to respect couple units and avoid separating them.
    for (const gen of generationLevels) {
        const nodesInGen = positionedNodes.filter(n => n.generation === gen).sort((a,b) => a.x - b.x);
        for (let i = 0; i < nodesInGen.length - 1; i++) {
            const n1 = nodesInGen[i];
            const n2 = nodesInGen[i+1];
            
            const n1RightEdge = n1.x + (nodePositions.get(n1.id)?.unitWidth || NODE_EFFECTIVE_WIDTH) / 2;
            const n2LeftEdge = n2.x - (nodePositions.get(n2.id)?.unitWidth || NODE_EFFECTIVE_WIDTH) / 2;
            
            if (n2LeftEdge < n1RightEdge + HORIZONTAL_SPACING_SIBLINGS) {
                 const shiftNeeded = (n1RightEdge + HORIZONTAL_SPACING_SIBLINGS) - n2LeftEdge;
                 for(let k=i+1; k < nodesInGen.length; k++){
                    const nodeToShift = nodesInGen[k];
                    nodeToShift.x += shiftNeeded;
                    nodePositions.set(nodeToShift.id, {...nodePositions.get(nodeToShift.id)!, x: nodeToShift.x });
                 }
                 overallMaxX = Math.max(overallMaxX, nodesInGen[nodesInGen.length-1].x + (nodePositions.get(nodesInGen[nodesInGen.length-1].id)?.unitWidth || NODE_EFFECTIVE_WIDTH)/2 + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
    }
    
    // Shift entire tree if minX is too small
    if (positionedNodes.length > 0) {
        const allXLeftEdges = positionedNodes.map(n => n.x - (nodePositions.get(n.id)?.unitWidth || NODE_EFFECTIVE_WIDTH)/2);
        const minTreeX = Math.min(...allXLeftEdges);
        if (minTreeX < HORIZONTAL_SPACING_SIBLINGS) {
            const shiftAmount = HORIZONTAL_SPACING_SIBLINGS - minTreeX;
            positionedNodes.forEach(n => {
                n.x += shiftAmount;
                nodePositions.set(n.id, {...nodePositions.get(n.id)!, x: n.x });
            });
            overallMaxX += shiftAmount;
        }
        const lastNodeByX = positionedNodes.reduce((prev, current) => ((prev.x + (nodePositions.get(prev.id)?.unitWidth || 0)/2) > (current.x + (nodePositions.get(current.id)?.unitWidth || 0)/2)) ? prev : current);
        overallMaxX = Math.max(overallMaxX, lastNodeByX.x + (nodePositions.get(lastNodeByX.id)?.unitWidth || NODE_EFFECTIVE_WIDTH)/2 + HORIZONTAL_SPACING_SIBLINGS);
    }


    // Create Edges
    positionedNodes.forEach(node => {
      const nodeCenterAvatarX = node.x; // Node's X is already its avatar center
      const nodeAvatarTopY = node.y + NODE_VERTICAL_PADDING;
      const nodeTextBottomY = node.y + NODE_VERTICAL_PADDING + NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT;

      // Parent-child edges
      if (node.parentId && nodePositions.has(node.parentId)) {
        const parentNode = positionedNodes.find(p => p.id === node.parentId)!; 
        const parentLayoutInfo = nodePositions.get(parentNode.id)!; // This gives the center of the parent unit (single or couple)
        
        const parentUnitCenterX = parentLayoutInfo.x; 
        // ** CORRECTED DEFINITION FOR parentUnitBottomY for edge drawing **
        const parentUnitBottomY = parentNode.y + NODE_VERTICAL_PADDING + NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT; // Bottom of parent's text area
        
        const childTopY = nodeAvatarTopY; 
        const childCenterX = nodeCenterAvatarX;
        
        // Calculate midpoint for the horizontal line segment, slightly below parent text, above child avatar
        const verticalDropPointY = parentUnitBottomY + CHILD_LINE_JUNCTION_OFFSET;
        const verticalRisePointY = childTopY - CHILD_LINE_JUNCTION_OFFSET;
        
        edges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${parentUnitCenterX},${parentUnitBottomY} L${parentUnitCenterX},${verticalDropPointY} L${childCenterX},${verticalDropPointY} L${childCenterX},${childTopY}`,
          type: 'parent-child',
        });
      }

      // Spouse link
      if (node.spouseId && nodePositions.has(node.spouseId)) {
        const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
        // Draw line only once per couple (e.g., if current node is to the left or has smaller ID)
        if (node.x < spouseNode.x) { 
            const yMarriageLine = node.y + NODE_VERTICAL_PADDING + COUPLE_LINE_Y_OFFSET; // Vertically centered on avatars
            const x1 = node.x + NODE_AVATAR_DIAMETER / 2; // Right edge of first avatar's circle
            const x2 = spouseNode.x - NODE_AVATAR_DIAMETER / 2; // Left edge of second avatar's circle
            if (x2 > x1 + 5) { // Only draw if there's a bit of space between avatar edges
                 edges.push({
                    id: `spouse-${node.id}-${node.spouseId}`,
                    path: `M${x1 + 2},${yMarriageLine} H${x2 - 2}`,
                    type: 'spouse-link',
                });
            }
        }
      }
    });
    
    console.log(`FamilyTreeDisplay: Layout done. Nodes: ${positionedNodes.length}, Edges: ${edges.length}, Width: ${overallMaxX}, Height: ${overallMaxY}`);
    return { nodes: positionedNodes, edges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) };

  }, [tree]); 

  const handleNodeClick = (memberId: string) => { /* ... same as before ... */ };
  const handleAddMemberClick = (targetMemberId: string | null, relationshipType: string) => { /* ... same as before ... */ };
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => { /* ... same as before ... */ };
  const getOrdinal = (gen?: number): string => { /* ... same as before ... */ };
  const getNodeStyling = (node: TreeNode): { avatarBg: string, avatarBorder: string, avatarIcon: string, textColor: string } => { /* ... same as before ... */ 
      const isSelected = selectedMemberId === String(node.id);
      let colors = { /* ... defaults ... */ };
      // Your coloring logic
      return colors;
  };

  if (!initialTree || !initialTree.members) return <div className="p-10 text-center text-muted-foreground">Tree data unavailable.</div>;
  if (initialTree.members.length === 0) return <div className="p-10 text-center text-muted-foreground">No members in this tree.</div>;
  if (layoutNodes.length === 0 && initialTree.members.length > 0) return <div className="p-10 text-center text-muted-foreground">Calculating layout... Check console for data errors if this persists.</div>;
  if (layoutNodes.length === 0) return <div className="p-10 text-center text-muted-foreground">No nodes to display.</div>;


  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
          // zoomLevel prop from parent scales the container OF this component
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
            <div 
              key={node.id}
              id={`member-node-${node.id}`}
              className={`absolute group cursor-pointer flex flex-col items-center transition-all duration-150 ease-in-out hover:z-20
                          ${isSelected ? 'z-30' : 'z-10'}`}
              style={{ 
                  // Position the entire node module (avatar + text) using its top-left corner
                  // Node.x is the CENTER of the avatar, node.y is the TOP of the avatar area (including padding)
                  left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, 
                  top: `${node.y}px`, // node.y is already the top of the module
                  width: `${NODE_EFFECTIVE_WIDTH}px`, 
                  // Height is NODE_TOTAL_HEIGHT implicitly by content
              }}
              onClick={() => handleNodeClick(String(node.id))}
            >
                <HoverCard openDelay={150} closeDelay={50}>
                    <HoverCardTrigger asChild>
                        {/* Avatar and Text content */}
                        <div className="flex flex-col items-center w-full">
                            <div className={`rounded-full flex items-center justify-center overflow-hidden
                                          border-2 shadow-md ${styling.avatarBorder} ${styling.avatarBg}
                                          ${isSelected ? 'ring-2 ring-offset-1 ring-[var(--uganda-red)]' : 'group-hover:shadow-lg'}`}
                                  style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER, marginTop: NODE_VERTICAL_PADDING }}>
                              {node.photoUrl ? (
                                <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                              ) : (
                                <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.6} className={styling.avatarIcon} />
                              )}
                              {node.isElder && <ShieldCheck className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 fill-background p-0.5" title="Clan Elder"/>}
                            </div>
                            <div className="mt-1 text-center w-full px-0.5" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                              <p className={`font-semibold text-[11px] ${styling.textColor} truncate leading-tight`} title={node.name || "Unnamed"}>
                                {node.name || "Unnamed"}
                              </p>
                              {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                                <p className="text-[9px] text-muted-foreground leading-tight">
                                  {node.birthYear ? `b.${node.birthYear.substring(0,4)}` : ""}{node.birthYear && (node.deathYear || node.status === 'deceased') ? " - " : ""}{node.deathYear ? `d.${node.deathYear.substring(0,4)}` : (node.status === 'deceased' && !node.deathYear ? " (d)" : "")}
                                </p>
                              )}
                            </div>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl">
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
        {/* ... Your Dialog content ... (same as before) */}
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
