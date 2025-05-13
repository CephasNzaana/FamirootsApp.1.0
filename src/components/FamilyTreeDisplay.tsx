// src/components/FamilyTreeDisplay.tsx
import React, { useState, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types";
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
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 50; // Width for X spacing, allowing text below avatar
const HORIZONTAL_SPACING_SIBLINGS = 20; 
const HORIZONTAL_SPACING_COUPLE_SYMBOL = 24; // Width of the couple symbol area
const VERTICAL_SPACING_GENERATIONS = 70;
const COUPLE_SYMBOL_Y_OFFSET = NODE_AVATAR_DIAMETER / 2 + NODE_VERTICAL_PADDING; 
const CHILD_LINE_JUNCTION_Y_OFFSET = 15; // How far below couple symbol the child line branches

interface TreeNode extends FamilyMember {
  x: number; // Center X of the avatar
  y: number; // Top Y of the node module
}
interface Edge { id: string; path: string; type: 'parent-child' | 'spouse-symbol'; } // spouse-symbol for the icon

interface FamilyTreeDisplayProps { /* ... same ... */ }

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel: parentPassedZoom, onTreeUpdate }: FamilyTreeDisplayProps) => {
  // ... (useState for tree, selectedMemberId, dialogs remain same) ...
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);


  const { nodes: layoutNodes, edges: layoutEdges, width: layoutWidth, height: layoutHeight } = useMemo(() => {
    // ... (Data processing: membersById, getNumericGenerationSafe, membersWithProcessedGen, membersByGeneration - REMAINS THE SAME as last correct version) ...
    // ... (Layout first pass: positioning nodes and COUPLE UNITS - THIS NEEDS REFINEMENT) ...

    // --- REFINED LAYOUT LOGIC FOR COUPLES ---
    const positionedNodes: TreeNode[] = [];
    const nodePositions = new Map<string, { x: number; y: number; unitWidth: number; isCoupleUnit?: boolean; spouseX?: number }>(); // x is center of node/unit
    // ... (overallMaxX, overallMaxY, generationLevels setup) ...

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
            let currentUnitWidth = NODE_EFFECTIVE_WIDTH; // Width of a single person for layout spacing
            let isCouple = false;
            let spouseXPos: number | undefined = undefined;

            // Parent-based X positioning (same logic as before)
            const parentNodeFromPositioned = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;
            if(parentNodeFromPositioned) { /* ... (same parent-based X centering) ... */ }
            nodeX = Math.max(nodeX, currentXInLevel);

            const node: TreeNode = { ...memberData, x: nodeX, y: yPos, childrenIds: [] /* will be populated by parent */ };
             node.childrenIds = membersWithProcessedGen.filter(m => String(m.parentId) === String(node.id)).map(c => String(c.id));


            // Check for spouse for this node
            if (node.spouseId && !levelProcessedThisPass[node.spouseId]) {
                const spouseData = membersById[node.spouseId];
                if (spouseData && spouseData.generation === node.generation) {
                    isCouple = true;
                    const spouseIndexInLevel = levelNodesUnplaced.findIndex(n => n.id === spouseData.id);
                    if (spouseIndexInLevel !== -1) levelNodesUnplaced.splice(spouseIndexInLevel, 1);

                    // Position node1 (current memberData) and node2 (spouse)
                    // nodeX is center of first avatar. spouseX is center of second avatar.
                    spouseXPos = nodeX + NODE_AVATAR_DIAMETER + HORIZONTAL_SPACING_COUPLE; 
                    const spouseNode: TreeNode = {
                        ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse",
                        x: spouseXPos, y: yPos, spouseId: node.id, childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(spouseData.id)).map(c => String(c.id))
                    };
                    
                    positionedNodes.push(node); // Add first spouse
                    positionedNodes.push(spouseNode); // Add second spouse
                    
                    const coupleUnitCenter = (node.x + spouseNode.x) / 2;
                    currentUnitWidth = (spouseNode.x - node.x) + NODE_AVATAR_DIAMETER; // From left edge of first to right edge of second

                    nodePositions.set(node.id, { x: node.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH, isCoupleUnit: true, spouseX: spouseNode.x });
                    nodePositions.set(spouseNode.id, { x: spouseNode.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH, isCoupleUnit: true, spouseX: node.x });
                    
                    levelProcessedThisPass[node.id] = true;
                    levelProcessedThisPass[spouseNode.id] = true;
                    currentXInLevel = spouseNode.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
                } else { node.spouseId = undefined; } // Spouse not found or different gen
            }
            
            if (!isCouple) { // Single node
                positionedNodes.push(node);
                nodePositions.set(node.id, { x: node.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
                levelProcessedThisPass[node.id] = true;
                currentXInLevel = node.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
            }
            overallMaxX = Math.max(overallMaxX, currentXInLevel - HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH/2);
        }
    }
    // ... (X-Overlap reduction and overallMaxX/Y adjustments - REMAINS THE SAME as last provided FamilyTreeDisplay) ...

    // Create Edges
    positionedNodes.forEach(node => {
        const nodeCenterAvatarX = node.x;
        const nodeAvatarTopY = node.y + NODE_VERTICAL_PADDING;
        const nodeAvatarBottomY = node.y + NODE_VERTICAL_PADDING + NODE_AVATAR_DIAMETER;
        const nodeTextBottomY = nodeAvatarBottomY + NODE_TEXT_AREA_HEIGHT;

        // Parent-child edges
        if (node.parentId && nodePositions.has(node.parentId)) {
            const parentNode = positionedNodes.find(p => p.id === node.parentId)!;
            const parentLayoutInfo = nodePositions.get(parentNode.id)!;
            
            let coupleUnitCenterX = parentLayoutInfo.x; 
            let parentLineStartY = parentNode.y + NODE_AVATAR_DIAMETER/2 ; // Default to avatar center if no text below considered

             // If parent is part of a couple unit, get the center of that unit for child line origin
            if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
                const spouseLayoutInfo = nodePositions.get(parentNode.spouseId)!;
                coupleUnitCenterX = (parentLayoutInfo.x + spouseLayoutInfo.x) / 2; // Midpoint between two avatar centers
                // Start line from below the couple symbol/line
                parentLineStartY = parentNode.y + COUPLE_SYMBOL_Y_OFFSET + CHILD_LINE_JUNCTION_Y_OFFSET; 
            } else { // Single parent, start line from bottom center of avatar/text area
                parentLineStartY = parentNode.y + NODE_TOTAL_HEIGHT - NODE_VERTICAL_PADDING;
            }
            
            const childTopY = nodeAvatarTopY; // Target top of child's avatar
            const childCenterX = nodeCenterAvatarX;
            
            const midYDrop = parentLineStartY + VERTICAL_SPACING_GENERATIONS / 3;
            const midYRise = childTopY - VERTICAL_SPACING_GENERATIONS / 3;
            
            edges.push({
                id: `pc-${parentNode.id}-${node.id}`,
                path: `M${coupleUnitCenterX},${parentLineStartY} L${coupleUnitCenterX},${midYDrop} L${childCenterX},${midYRise} L${childCenterX},${childTopY}`,
                type: 'parent-child',
            });
        }

        // Spouse symbol/link
        if (node.spouseId && nodePositions.has(node.spouseId)) {
            const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
            if (String(node.id) < String(node.spouseId)) { // Draw once
                const yCoupleSymbol = node.y + NODE_VERTICAL_PADDING + COUPLE_SYMBOL_Y_OFFSET;
                const xCoupleSymbol = (node.x + spouseNode.x) / 2;
                // Instead of a line, we'll place a symbol; the edge path is just for ID.
                // Or, we draw a small, thick horizontal bar.
                const x1 = Math.min(node.x, spouseNode.x) + NODE_AVATAR_DIAMETER / 2 + 2;
                const x2 = Math.max(node.x, spouseNode.x) - NODE_AVATAR_DIAMETER / 2 - 2;
                 if (x2 > x1) { // Ensure there's space
                    edges.push({
                        id: `spouse-${node.id}-${node.spouseId}`,
                        path: `M${x1},${yCoupleSymbol} H${x2}`, // Short thick line
                        type: 'spouse-link',
                    });
                 }
            }
        }
    });
    return { nodes: positionedNodes, edges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) };
  }, [tree]); 

  // ... (handleNodeClick, handleAddMemberClick, onSubmitNewMember, getOrdinal functions - same as last complete version) ...
  // ... (getNodeStyling function - same as last complete version with Tailwind classes or CSS vars) ...
  const getNodeStyling = (node: TreeNode): { avatarBgClass: string, avatarBorderClass: string, avatarIconClass: string, textColorClass: string } => {
    const isSelected = selectedMemberId === String(node.id);
    // Default Tailwind classes (make sure these colors are defined in your tailwind.config.js or global CSS if using custom names like 'uganda-red')
    let styles = {
        avatarBgClass: 'bg-slate-200 dark:bg-slate-700',
        avatarBorderClass: isSelected ? 'border-uganda-red ring-2 ring-uganda-red' : 'border-slate-400 dark:border-slate-500',
        avatarIconClass: 'text-slate-500 dark:text-slate-400',
        textColorClass: 'text-slate-700 dark:text-slate-200',
    };

    if (node.isElder) {
        styles.avatarBgClass = 'bg-yellow-300 dark:bg-yellow-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-yellow-500'; styles.avatarIconClass = 'text-yellow-700 dark:text-yellow-200'; styles.textColorClass = 'text-yellow-700 dark:text-yellow-300';
    } else if (node.relationship === "Self" || node.relationship === "Proband") {
        styles.avatarBgClass = 'bg-red-300 dark:bg-red-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-uganda-red'; styles.avatarIconClass = 'text-red-700 dark:text-red-200'; styles.textColorClass = 'text-uganda-red dark:text-red-400';
    } else if (node.relationship === "Father" || node.relationship === "Mother" || node.relationship === "Spouse") {
        styles.avatarBgClass = 'bg-blue-300 dark:bg-blue-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-blue-500'; styles.avatarIconClass = node.gender === 'female' ? 'text-pink-600' : 'text-blue-600'; styles.textColorClass = 'text-blue-700 dark:text-blue-300';
    } else if (node.relationship?.includes("Grand")) {
        styles.avatarBgClass = 'bg-green-300 dark:bg-green-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-green-500'; styles.avatarIconClass = node.gender === 'female' ? 'text-pink-500' : 'text-green-600'; styles.textColorClass = 'text-green-700 dark:text-green-300';
    } else if (node.relationship === "Brother" || node.relationship === "Sister" || node.relationship === "Sibling") {
        styles.avatarBgClass = 'bg-teal-300 dark:bg-teal-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-teal-500'; styles.avatarIconClass = 'text-teal-600 dark:text-teal-200';
    } else if (node.relationship === "Son" || node.relationship === "Daughter" || node.relationship === "Child") {
        styles.avatarBgClass = 'bg-orange-300 dark:bg-orange-700'; styles.avatarBorderClass = isSelected ? styles.avatarBorderClass : 'border-orange-500'; styles.avatarIconClass = 'text-orange-600 dark:text-orange-200';
    }
    return styles;
  };

  // ... (Conditional rendering for loading/empty states - same as last complete version) ...

  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 0.5px, transparent 0.5px)', // Softer grid
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
                className={`${edge.type === 'spouse-link' ? 'stroke-uganda-red dark:stroke-red-500' : 'stroke-slate-400 dark:stroke-slate-600'}`}
                strokeWidth={edge.type === 'spouse-link' ? "2.5" : "1.5"}
                fill="none"
                markerEnd={edge.type === 'parent-child' ? "url(#arrowhead-child)" : "none"}
                strokeLinecap={edge.type === 'spouse-link' ? "round" : "butt"}
              />
            ))}
          </g>
        </svg>

        {/* Render Nodes */}
        {layoutNodes.map((node) => {
          const styling = getNodeStyling(node);
          const isSelected = selectedMemberId === String(node.id);

          // Couple Symbol Position (if applicable)
          let coupleSymbolJsx = null;
          if (node.spouseId && nodePositions.has(node.spouseId)) {
            const spouseNode = positionedNodes.find(s => s.id === node.spouseId);
            if (spouseNode && node.x < spouseNode.x) { // Draw symbol once from the left member of couple
              const symbolX = (node.x + spouseNode.x) / 2;
              const symbolY = node.y + NODE_VERTICAL_PADDING + COUPLE_SYMBOL_Y_OFFSET;
              coupleSymbolJsx = (
                <Link2 
                  x={symbolX - 8} // Adjust for icon size
                  y={symbolY - 8}
                  size={16} 
                  className="text-uganda-red dark:text-red-500 absolute" 
                  strokeWidth={2.5}
                />
              );
            }
          }

          return (
            <React.Fragment key={node.id}>
              <div 
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
                          <div className="flex flex-col items-center w-full pt-1"> {/* Added pt-1 for padding */}
                              <div className={`relative rounded-full flex items-center justify-center overflow-hidden
                                            border-2 shadow-md ${styling.avatarBorder} ${styling.avatarBg}
                                            ${isSelected ? 'ring-2 ring-offset-1 ring-uganda-red' : 'group-hover:shadow-lg group-hover:ring-1 group-hover:ring-primary/50'}`}
                                    style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER }}>
                                {node.photoUrl ? (
                                  <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                                ) : (
                                  <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.65} className={styling.avatarIcon} />
                                )}
                                {node.isElder && <ShieldCheck className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 fill-background p-0.5" title="Clan Elder"/>}
                              </div>
                              <div className="mt-0.5 text-center w-full px-0.5" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                                <p className={`font-semibold text-[10px] ${styling.textColor} truncate leading-tight`} title={node.name || "Unnamed"}>
                                  {node.name || "Unnamed"}
                                </p>
                                {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                                  <p className="text-[9px] text-muted-foreground leading-tight">
                                    {node.birthYear ? `b.${node.birthYear.substring(0,4)}` : ""}{(node.birthYear && (node.deathYear || node.status==='deceased')) ? " - " : ""}{node.deathYear ? `d.${node.deathYear.substring(0,4)}` : (node.status === 'deceased' && !node.deathYear ? " (d)" : "")}
                                  </p>
                                )}
                              </div>
                          </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl">
                          {/* ... Your HoverCardContent JSX ... */}
                      </HoverCardContent>
                  </HoverCard>
               </div>
               {/* Render couple symbol as a separate div if needed, or integrate into SVG if more complex */}
               {coupleSymbolJsx}
            </React.Fragment>
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
