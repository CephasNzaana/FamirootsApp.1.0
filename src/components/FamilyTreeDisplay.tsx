// src/components/FamilyTreeDisplay.tsx
import React, { useState, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button"; // Keep for potential future use in dialogs
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Keep for AddMemberDialog
import { User, Calendar, Heart, UserCircle2, UserPlus, ShieldCheck } from "lucide-react"; // Link2 removed
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge"; // Keep for potential future use in dialogs
import { Input } from "@/components/ui/input"; // Keep for AddMemberDialog
import { Textarea } from "@/components/ui/textarea"; // Keep for AddMemberDialog
import { toast } from "@/components/ui/sonner"; // Keep for AddMemberDialog

// Layout Constants
const NODE_AVATAR_DIAMETER = 56;
const NODE_TEXT_AREA_HEIGHT = 30; 
const NODE_VERTICAL_PADDING = 5; 
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT + (NODE_VERTICAL_PADDING * 2); 
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 50; 
const HORIZONTAL_SPACING_SIBLINGS = 20; 
const HORIZONTAL_SPACING_COUPLE_SYMBOL = 24; // Used as gap between spouse avatars for symbol
const VERTICAL_SPACING_GENERATIONS = 70;
const COUPLE_SYMBOL_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; // Vertically center symbol with avatars
const CHILD_LINE_JUNCTION_Y_OFFSET = 15; 

interface TreeNode extends FamilyMember {
  x: number; 
  y: number; 
  childrenIds?: string[]; // Added for clarity, populated if node is a parent
}

interface Edge {
  id: string;
  path?: string; // Optional for non-path elements like rings
  type: 'parent-child' | 'spouse-rings';
  // For spouse-rings, include coordinates needed for drawing
  nodeX?: number;
  spouseX?: number;
  symbolY?: number;
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel?: number; 
  onTreeUpdate: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel: parentPassedZoom, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  
  // Ensure initialTree updates are reflected
  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  const { nodes: layoutNodes, edges: layoutEdges, width: layoutWidth, height: layoutHeight } = useMemo(() => {
    if (!tree || !tree.members) return { nodes: [], edges: [], width: 600, height: 400 };

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(member => { membersById[String(member.id)] = member; });

    const getNumericGenerationSafe = (gen: string | number | undefined): number => {
      if (gen === undefined || gen === null) return 0; // Default generation if undefined
      const num = Number(gen);
      return isNaN(num) ? 0 : num;
    };
    
    const membersWithProcessedGen = tree.members.map(m => ({
      ...m,
      generation: getNumericGenerationSafe(m.generation)
    }));

    const membersByGeneration: Record<number, FamilyMember[]> = {};
    membersWithProcessedGen.forEach(member => {
      const gen = member.generation;
      if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
      membersByGeneration[gen].push(member);
    });

    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);
    
    const positionedNodes: TreeNode[] = [];
    const nodePositions = new Map<string, { x: number; y: number; unitWidth: number; isCoupleUnit?: boolean; spouseX?: number }>();
    const edges: Edge[] = [];
    let overallMaxX = 0;
    let overallMaxY = 0;

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
            // Parent-based X positioning (same logic as before - this is a placeholder in your provided code)
            const parentNodeFromPositioned = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;
            if(parentNodeFromPositioned) { /* ... (same parent-based X centering) ... */ }
            nodeX = Math.max(nodeX, currentXInLevel);


            const node: TreeNode = { 
                ...memberData, 
                x: nodeX, 
                y: yPos, 
                childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(memberData.id)).map(c => String(c.id))
            };

            let isCouple = false;
            // Check for spouse for this node
            if (node.spouseId && !levelProcessedThisPass[node.spouseId]) {
                const spouseData = membersById[node.spouseId];
                if (spouseData && spouseData.generation === node.generation) {
                    isCouple = true;
                    const spouseIndexInLevel = levelNodesUnplaced.findIndex(n => n.id === spouseData.id);
                    if (spouseIndexInLevel !== -1) {
                         // Mark as processed to avoid adding spouse as a separate individual later in this loop
                        levelProcessedThisPass[spouseData.id] = true; 
                        // Remove from unplaced if it exists there, to avoid double processing.
                        // Note: Splicing here might affect loop indices if not careful. 
                        // Better to rely on `levelProcessedThisPass` check.
                    }
                    
                    const spouseXPos = nodeX + NODE_AVATAR_DIAMETER / 2 + HORIZONTAL_SPACING_COUPLE_SYMBOL + NODE_AVATAR_DIAMETER / 2;
                    const spouseNode: TreeNode = {
                        ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse",
                        x: spouseXPos, y: yPos, spouseId: node.id, 
                        childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(spouseData.id)).map(c => String(c.id))
                    };
                    
                    positionedNodes.push(node); 
                    positionedNodes.push(spouseNode); 
                    
                    nodePositions.set(node.id, { x: node.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH, isCoupleUnit: true, spouseX: spouseNode.x });
                    nodePositions.set(spouseNode.id, { x: spouseNode.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH, isCoupleUnit: true, spouseX: node.x });
                    
                    levelProcessedThisPass[node.id] = true;
                    // spouseData.id already marked above
                    currentXInLevel = spouseNode.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
                } else { 
                    node.spouseId = undefined; // Spouse not found or different gen, treat as single for layout
                }
            }
            
            if (!isCouple) { 
                positionedNodes.push(node);
                nodePositions.set(node.id, { x: node.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
                levelProcessedThisPass[node.id] = true;
                currentXInLevel = node.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
            }
            overallMaxX = Math.max(overallMaxX, currentXInLevel - HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH/2);
        }
    });
    
    // --- X-Overlap Reduction Pass (Simplified) ---
    // Basic overlap check: If a node overlaps significantly with its left neighbor in the same generation, push it right.
    // This is a very basic implementation and might need refinement for complex trees.
    generationLevels.forEach(gen => {
        const nodesInGen = positionedNodes.filter(n => n.generation === gen).sort((a,b) => a.x - b.x);
        for (let i = 1; i < nodesInGen.length; i++) {
            const prevNode = nodesInGen[i-1];
            const currNode = nodesInGen[i];
            const requiredSpace = (NODE_EFFECTIVE_WIDTH / 2) + (NODE_EFFECTIVE_WIDTH / 2) + HORIZONTAL_SPACING_SIBLINGS;
            const currentSpace = currNode.x - prevNode.x;
            if (currentSpace < requiredSpace) {
                const shift = requiredSpace - currentSpace;
                currNode.x += shift;
                // Propagate shift to subsequent nodes in the same generation
                for (let j = i + 1; j < nodesInGen.length; j++) {
                    nodesInGen[j].x += shift;
                }
                overallMaxX = Math.max(overallMaxX, currNode.x + NODE_EFFECTIVE_WIDTH / 2);
            }
        }
    });


    // Create Edges
    positionedNodes.forEach(node => {
        const nodeCenterAvatarX = node.x;
        const nodeAvatarTopY = node.y + NODE_VERTICAL_PADDING;
        const nodeAvatarBottomY = node.y + NODE_VERTICAL_PADDING + NODE_AVATAR_DIAMETER;
        
        // Parent-child edges
        if (node.parentId && nodePositions.has(node.parentId)) {
            const parentNode = positionedNodes.find(p => p.id === node.parentId)!; // Safe due to .has check
            const parentLayoutInfo = nodePositions.get(parentNode.id)!;
            
            let coupleUnitCenterX = parentLayoutInfo.x; 
            let parentLineStartY = parentNode.y + NODE_TOTAL_HEIGHT - NODE_VERTICAL_PADDING; // Default start from bottom of parent text area

            if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
                const spouseNode = positionedNodes.find(s => s.id === parentNode.spouseId)!;
                coupleUnitCenterX = (parentNode.x + spouseNode.x) / 2; 
                parentLineStartY = parentNode.y + NODE_VERTICAL_PADDING + COUPLE_SYMBOL_Y_OFFSET + CHILD_LINE_JUNCTION_Y_OFFSET; 
            }
            
            const childTopY = nodeAvatarTopY; 
            const childCenterX = nodeCenterAvatarX;
            
            const midYDrop = parentLineStartY + VERTICAL_SPACING_GENERATIONS / 3;
            const midYRise = childTopY - VERTICAL_SPACING_GENERATIONS / 3;
            
            edges.push({
                id: `pc-${parentNode.id}-${node.id}`,
                path: `M${coupleUnitCenterX},${parentLineStartY} L${coupleUnitCenterX},${midYDrop} L${childCenterX},${midYRise} L${childCenterX},${childTopY}`,
                type: 'parent-child',
            });
        }

        // Spouse rings (replaces simple line or external icon)
        if (node.spouseId && nodePositions.has(node.spouseId)) {
            const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
            // Draw once per couple (e.g., from the node with the smaller ID or X position)
            if (String(node.id) < String(spouseNode.id)) { 
                const symbolY = node.y + NODE_VERTICAL_PADDING + COUPLE_SYMBOL_Y_OFFSET;
                edges.push({
                    id: `spouse-rings-${node.id}-${spouseNode.id}`,
                    type: 'spouse-rings',
                    nodeX: node.x,
                    spouseX: spouseNode.x,
                    symbolY: symbolY,
                    // path is not used for rings, actual drawing handled by type
                });
            }
        }
    });
    return { nodes: positionedNodes, edges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) };
  }, [tree, membersById, membersByGeneration, generationLevels, nodePositions, positionedNodes, overallMaxX, overallMaxY]); // Dependencies refined

  const handleNodeClick = (memberId: string) => {
    setSelectedMemberId(prevId => (prevId === memberId ? null : memberId));
    // Potentially open a detail view or edit form here
    console.log("Clicked member:", memberId);
  };
  
  const handleAddMemberClick = (targetMemberId: string | null, relationshipType: string) => {
    setAddingRelationshipInfo({ targetMemberId, relationshipType });
    setAddMemberDialogOpen(true);
  };

  const onSubmitNewMember = (newMemberData: Partial<FamilyMember>) => {
    // This is a simplified version. You'll need to:
    // 1. Generate a new ID for the member.
    // 2. Determine parentId, spouseId based on addingRelationshipInfo.
    // 3. Update the tree state.
    // 4. Call onTreeUpdate to notify parent.
    toast.success(`Member "${newMemberData.name}" addition logic pending.`);
    console.log("New member data:", newMemberData, "Relationship context:", addingRelationshipInfo);
    setAddMemberDialogOpen(false);
  };

  const getOrdinal = (n?: number): string => {
    if (n === undefined || n === null) return "";
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getNodeStyling = (node: TreeNode): { avatarBgClass: string, avatarBorderClass: string, avatarIconClass: string, textColorClass: string } => {
    const isSelected = selectedMemberId === String(node.id);
    let styles = {
        avatarBgClass: 'bg-slate-200 dark:bg-slate-700',
        avatarBorderClass: isSelected ? 'border-uganda-red ring-2 ring-uganda-red' : 'border-slate-400 dark:border-slate-500',
        avatarIconClass: 'text-slate-500 dark:text-slate-400',
        textColorClass: 'text-slate-700 dark:text-slate-200',
    };

    if (node.isElder) {
        styles.avatarBgClass = 'bg-yellow-300 dark:bg-yellow-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-yellow-500 dark:border-yellow-600'; styles.avatarIconClass = 'text-yellow-700 dark:text-yellow-200'; styles.textColorClass = 'text-yellow-700 dark:text-yellow-300 font-medium';
    } else if (node.relationship === "Self" || node.relationship === "Proband") {
        styles.avatarBgClass = 'bg-red-300 dark:bg-red-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-uganda-red dark:border-red-500'; styles.avatarIconClass = 'text-red-700 dark:text-red-200'; styles.textColorClass = 'text-uganda-red dark:text-red-400 font-bold';
    } else if (node.relationship === "Father" || node.relationship === "Mother" || node.relationship === "Spouse") {
        styles.avatarBgClass = 'bg-blue-300 dark:bg-blue-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-blue-500 dark:border-blue-600'; 
        styles.avatarIconClass = node.gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-300'; styles.textColorClass = 'text-blue-700 dark:text-blue-300';
    } else if (node.relationship?.includes("Grand")) {
        styles.avatarBgClass = 'bg-green-300 dark:bg-green-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-green-500 dark:border-green-600'; 
        styles.avatarIconClass = node.gender === 'female' ? 'text-pink-500 dark:text-pink-400' : 'text-green-600 dark:text-green-300'; styles.textColorClass = 'text-green-700 dark:text-green-300';
    } else if (node.relationship === "Brother" || node.relationship === "Sister" || node.relationship === "Sibling") {
        styles.avatarBgClass = 'bg-teal-300 dark:bg-teal-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-teal-500 dark:border-teal-600'; styles.avatarIconClass = 'text-teal-600 dark:text-teal-200'; styles.textColorClass = 'text-teal-700 dark:text-teal-300';
    } else if (node.relationship === "Son" || node.relationship === "Daughter" || node.relationship === "Child") {
        styles.avatarBgClass = 'bg-orange-300 dark:bg-orange-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-orange-500 dark:border-orange-600'; styles.avatarIconClass = 'text-orange-600 dark:text-orange-200'; styles.textColorClass = 'text-orange-700 dark:text-orange-300';
    }
    return styles;
  };

  if (!tree || !tree.members || tree.members.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No family members to display.</div>;
  }
  
  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 0.5px, transparent 0.5px)', 
          backgroundSize: '15px 15px',
          transform: parentPassedZoom ? `scale(${parentPassedZoom})` : 'none', // Example zoom application
          transformOrigin: 'top left', // Example zoom origin
        }}
      >
        <svg width={layoutWidth} height={layoutHeight} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowhead-child" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto" className="fill-muted-foreground dark:fill-slate-500">
              <polygon points="0 0, 6 2, 0 4" />
            </marker>
          </defs>
          <g>
            {layoutEdges.map(edge => {
              if (edge.type === 'parent-child' && edge.path) {
                return (
                  <path
                    key={edge.id} d={edge.path}
                    className={'stroke-slate-400 dark:stroke-slate-600'}
                    strokeWidth={"1.5"}
                    fill="none"
                    markerEnd={"url(#arrowhead-child)"}
                  />
                );
              } else if (edge.type === 'spouse-rings' && typeof edge.nodeX === 'number' && typeof edge.spouseX === 'number' && typeof edge.symbolY === 'number') {
                const ringRadius = 7; 
                const ringStrokeWidth = 1.5;
                const overlapFactor = 0.6; // How much the rings overlap (0.6 means 60% of radius offset)

                const midPointX = (edge.nodeX + edge.spouseX) / 2;
                
                const ring1CenterX = midPointX - ringRadius * overlapFactor;
                const ring2CenterX = midPointX + ringRadius * overlapFactor;

                return (
                  <g key={edge.id} className="fill-none stroke-uganda-red dark:stroke-red-500" strokeWidth={ringStrokeWidth}>
                    <circle cx={ring1CenterX} cy={edge.symbolY} r={ringRadius} />
                    <circle cx={ring2CenterX} cy={edge.symbolY} r={ringRadius} />
                  </g>
                );
              }
              return null;
            })}
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
                  left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, 
                  top: `${node.y}px`,
                  width: `${NODE_EFFECTIVE_WIDTH}px`, 
              }}
              onClick={() => handleNodeClick(String(node.id))}
            >
                <HoverCard openDelay={150} closeDelay={50}>
                    <HoverCardTrigger asChild>
                        <div className="flex flex-col items-center w-full pt-1">
                            <div className={`relative rounded-full flex items-center justify-center overflow-hidden
                                          border-2 shadow-md ${styling.avatarBorderClass} ${styling.avatarBgClass}
                                          ${isSelected ? '' : 'group-hover:shadow-lg group-hover:ring-1 group-hover:ring-primary/50'}`}
                                  style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER }}>
                              {node.photoUrl ? (
                                <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                              ) : (
                                <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.65} className={styling.avatarIconClass} />
                              )}
                              {node.isElder && <ShieldCheck className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 fill-background p-0.5" title="Clan Elder"/>}
                            </div>
                            <div className="mt-0.5 text-center w-full px-0.5" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                              <p className={`font-semibold text-[10px] ${styling.textColorClass} truncate leading-tight`} title={node.name || "Unnamed"}>
                                {node.name || "Unnamed"}
                              </p>
                              {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                                <p className="text-[9px] text-muted-foreground dark:text-slate-400 leading-tight">
                                  {node.birthYear ? `b.${String(node.birthYear).substring(0,4)}` : ""}
                                  {(node.birthYear && (node.deathYear || node.status==='deceased')) ? " - " : ""}
                                  {node.deathYear ? `d.${String(node.deathYear).substring(0,4)}` : (node.status === 'deceased' && !node.deathYear ? " (d)" : "")}
                                </p>
                              )}
                            </div>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 text-xs p-3 space-y-1.5 shadow-xl border-border bg-card text-card-foreground">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-full ${styling.avatarBgClass} ${styling.avatarBorderClass} border`}>
                                <UserCircle2 size={20} className={styling.avatarIconClass}/>
                            </div>
                            <h4 className={`font-semibold text-sm ${styling.textColorClass}`}>{node.name || "Unnamed"}</h4>
                        </div>
                        <p className="text-muted-foreground"><span className="font-medium text-foreground">Relationship:</span> {node.relationship || "N/A"}</p>
                        {node.gender && <p className="text-muted-foreground capitalize"><span className="font-medium text-foreground">Gender:</span> {node.gender}</p>}
                        <div className="flex items-center space-x-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5"/>
                            <span>
                                {node.birthYear ? `Born: ${node.birthYear}` : "Birth year unknown"}
                                {node.deathYear ? `, Died: ${node.deathYear}` : (node.status === 'deceased' ? " (Deceased)" : "")}
                            </span>
                        </div>
                        {node.notes && <p className="text-muted-foreground pt-1 border-t border-border mt-1"><span className="font-medium text-foreground">Notes:</span> {node.notes}</p>}
                        {node.isElder && <Badge variant="outline" className="mt-1 border-yellow-500 text-yellow-600 dark:border-yellow-600 dark:text-yellow-400">Clan Elder</Badge>}
                        
                        {/* Action buttons in HoverCard - placeholder actions */}
                        <div className="pt-2 mt-2 border-t border-border space-x-2">
                            <Button variant="outline" size="xs" onClick={() => console.log("Edit", node.id)}>Edit</Button>
                            <Button variant="outline" size="xs" onClick={() => handleAddMemberClick(String(node.id), 'child')}>
                                <UserPlus className="h-3 w-3 mr-1"/> Add Child
                            </Button>
                        </div>
                    </HoverCardContent>
                </HoverCard>
             </div>
          );
        })}
      </div>

      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card">
            <DialogHeader>
                <DialogTitle className="text-foreground">Add New Family Member</DialogTitle>
            </DialogHeader>
            {/* Simplified form for adding a member. Needs state and handlers. */}
            <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Adding a new member related to {addingRelationshipInfo?.targetMemberId ? `member ${tree.members.find(m=>m.id === addingRelationshipInfo.targetMemberId)?.name}` : 'the family'} as a {addingRelationshipInfo?.relationshipType}.
                </p>
                <Input placeholder="Name" className="text-foreground border-border placeholder:text-muted-foreground"/>
                <Input type="number" placeholder="Birth Year (YYYY)" className="text-foreground border-border placeholder:text-muted-foreground"/>
                {/* Add more fields as needed: gender, death year, notes, etc. */}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => onSubmitNewMember({ name: "Dummy" /* Get from form state */})}>Save Member</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;

