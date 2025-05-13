// src/components/FamilyTreeDisplay.tsx
import React, { useState, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types"; // Ensure FamilyMember includes spouseId?: string;
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2, ShieldCheck } from "lucide-react"; // Link2 for couple
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

// New Layout Constants for Avatar-centric view
const NODE_AVATAR_DIAMETER = 56;
const NODE_TEXT_AREA_HEIGHT = 30; 
const NODE_VERTICAL_PADDING = 5; // Padding above avatar and below text
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT + (NODE_VERTICAL_PADDING * 2); 
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 40; // Width for X spacing calculations, allows for some text overflow
const HORIZONTAL_SPACING_SIBLINGS = 20; 
const HORIZONTAL_SPACING_COUPLE = 10;  // Reduced space between spouse avatars
const VERTICAL_SPACING_GENERATIONS = 65; // Space between generations
const COUPLE_LINE_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; 
const CHILD_LINE_JUNCTION_OFFSET = 15; // How far down from couple line children lines branch off


interface TreeNode extends FamilyMember {
  x: number; // Center X of the avatar
  y: number; // Top Y of the entire node module (including padding)
  // childrenIds and spouseId are on FamilyMember type
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse-link';
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel: number; // From parent, used to scale the parent container of this component
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel: parentZoom, onTreeUpdate }: FamilyTreeDisplayProps) => {
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
        if (visited.has(member.id)) return 0; 
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
      membersByGeneration[gen].push({ ...member, x: 0, y: 0, childrenIds: [] });
    });

    const positionedNodes: TreeNode[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number; unitWidth: number }>(); // x is center of node/unit
    let overallMaxX = HORIZONTAL_SPACING_SIBLINGS;
    let overallMaxY = VERTICAL_SPACING_GENERATIONS;
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    generationLevels.forEach((gen, levelIndex) => {
      const yPos = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING_GENERATIONS) + VERTICAL_SPACING_GENERATIONS;
      overallMaxY = Math.max(overallMaxY, yPos + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH / 2; // Start X for center of first node/unit
      
      const levelNodesUnplaced = [...(membersByGeneration[gen] || [])];
      levelNodesUnplaced.sort((a,b) => (String(a.parentId || "z")).localeCompare(String(b.parentId || "z")) || (String(a.birthYear||"9999")).localeCompare(String(b.birthYear||"9999")));
      
      const levelProcessedThisPass: Record<string, boolean> = {};

      for (let i = 0; i < levelNodesUnplaced.length; i++) {
        const memberData = levelNodesUnplaced[i];
        if (levelProcessedThisPass[memberData.id]) continue;

        let nodeX = currentXInLevel;
        let currentUnitWidth = NODE_EFFECTIVE_WIDTH;
        
        const parentNode = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;
        if(parentNode) {
            const parentLayoutInfo = nodePositions.get(parentNode.id);
            if (parentLayoutInfo) {
                const siblings = membersWithProcessedGen.filter(s => s.parentId === parentNode.id);
                const siblingIndex = siblings.findIndex(s => s.id === memberData.id);
                const numSiblings = siblings.length;
                const childrenBlockWidth = numSiblings * NODE_EFFECTIVE_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING_SIBLINGS;
                const firstChildXTarget = parentLayoutInfo.x - childrenBlockWidth / 2 + NODE_EFFECTIVE_WIDTH / 2;
                nodeX = firstChildXTarget + siblingIndex * (NODE_EFFECTIVE_WIDTH + HORIZONTAL_SPACING_SIBLINGS);
            }
        }
        nodeX = Math.max(nodeX, currentXInLevel);

        const node: TreeNode = { ...memberData, x: nodeX, y: yPos, childrenIds: membersWithProcessedGen.filter(m => m.parentId === memberData.id).map(c => c.id) };
        
        positionedNodes.push(node);
        nodePositions.set(node.id, { x: nodeX, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
        levelProcessedThisPass[node.id] = true;
        currentXInLevel = nodeX + NODE_EFFECTIVE_WIDTH / 2 + HORIZONTAL_SPACING_SIBLINGS; // For next independent node/unit

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
                
                // Update the primary node's unitWidth to represent the couple for parent centering
                const coupleLeftX = Math.min(node.x, spouseNode.x);
                const coupleRightX = Math.max(node.x, spouseNode.x);
                const coupleUnitActualWidth = (coupleRightX - coupleLeftX) + NODE_AVATAR_DIAMETER; // Width from left edge of first to right edge of second
                const coupleUnitCenter = (node.x + spouseNode.x) / 2;
                nodePositions.set(node.id, { x: coupleUnitCenter, y:yPos, unitWidth: coupleUnitActualWidth});
                // The spouse's original x is fine for its own avatar, but for parenting, the unit center is used.
                currentXInLevel = spouseNode.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
            } else { node.spouseId = undefined; }
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel - HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH/2);
      }
    });
    
    // X-Overlap reduction (very basic)
    for (const gen of generationLevels) { /* ... (same overlap reduction as before, using NODE_EFFECTIVE_WIDTH) ... */ }
    if (positionedNodes.length > 0) { /* ... (overallMaxX adjustment as before) ... */ }

    // Create Edges
    positionedNodes.forEach(node => {
      const nodeCenterAvatarX = node.x;
      const nodeAvatarTopY = node.y;
      const nodeAvatarBottomY = node.y + NODE_AVATAR_DIAMETER;
      const nodeTextBottomY = node.y + NODE_TOTAL_HEIGHT;

      // Parent-child edges
      if (node.parentId && nodePositions.has(node.parentId)) {
        const parentNode = positionedNodes.find(p=>p.id === node.parentId)!;
        let parentUnitCenterX = parentNode.x; 
        const parentUnitBottomForChildLine = parentNode.y + NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT / 2 + CHILD_LINE_JUNCTION_OFFSET; // Below text, above vertical line

        if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
          const spouseNode = positionedNodes.find(s=>s.id === parentNode.spouseId)!;
          parentUnitCenterX = (parentNode.x + spouseNode.x) / 2; // Midpoint of couple avatars
        }
        
        const childTopY = nodeAvatarTopY;
        const midY = parentUnitBottomForChildLine - VERTICAL_SPACING_GENERATIONS / 2.5; // Control point Y for curve
        
        edges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${parentUnitCenterX},${parentUnitBottomY} L${parentUnitCenterX},${midY} L${nodeCenterAvatarX},${midY} L${nodeCenterAvatarX},${childTopY}`,
          type: 'parent-child',
        });
      }

      // Spouse link
      if (node.spouseId && nodePositions.has(node.spouseId)) {
        const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
        if (String(node.id) < String(node.spouseId)) { // Draw line once per couple
            const lineY = node.y + COUPLE_LINE_Y_OFFSET;
            const x1 = node.x + NODE_AVATAR_DIAMETER / 2; // Right edge of first avatar's circle
            const x2 = spouseNode.x - NODE_AVATAR_DIAMETER / 2; // Left edge of second avatar's circle
            if (x2 > x1 + 5) { // Only draw if there's a bit of space
                 edges.push({
                    id: `spouse-${node.id}-${node.spouseId}`,
                    path: `M${x1 + 2},${lineY} H${x2 - 2}`, // Slightly shorter line
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
    let colors = { // Defaults using CSS variables for better theme compatibility
        avatarBg: 'hsl(var(--muted))',
        avatarBorder: 'hsl(var(--border))',
        avatarIcon: 'hsl(var(--muted-foreground))',
        textColor: 'hsl(var(--foreground))',
    };

    if (node.isElder) {
        colors.avatarBg = 'bg-yellow-400/80 dark:bg-yellow-500/80'; colors.avatarBorder = 'border-amber-500 dark:border-amber-400'; colors.avatarIcon = 'text-yellow-900 dark:text-yellow-100'; colors.textColor = 'text-amber-700 dark:text-amber-300';
    } else if (node.relationship === "Self" || node.relationship === "Proband") {
        colors.avatarBg = 'bg-uganda-red/80'; colors.avatarBorder = 'border-red-700 dark:border-red-500'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-uganda-red dark:text-red-400';
    } else if (node.relationship === "Father" || node.relationship === "Paternal Grandfather" || node.relationship === "Maternal Grandfather") {
        colors.avatarBg = 'bg-blue-500/80 dark:bg-blue-600/80'; colors.avatarBorder = 'border-blue-700 dark:border-blue-500'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-blue-700 dark:text-blue-300';
    } else if (node.relationship === "Mother" || node.relationship === "Paternal Grandmother" || node.relationship === "Maternal Grandmother") {
        colors.avatarBg = 'bg-pink-500/80 dark:bg-pink-600/80'; colors.avatarBorder = 'border-pink-700 dark:border-pink-500'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-pink-700 dark:text-pink-300';
    } else if (node.relationship === "Spouse") {
        colors.avatarBg = 'bg-purple-500/80 dark:bg-purple-600/80'; colors.avatarBorder = 'border-purple-700 dark:border-purple-500'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-purple-700 dark:text-purple-300';
    } else if (node.relationship === "Brother" || node.relationship === "Son") {
        colors.avatarBg = 'bg-sky-500/80 dark:bg-sky-600/80'; colors.avatarBorder = 'border-sky-700 dark:border-sky-500'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-sky-700 dark:text-sky-300';
    } else if (node.relationship === "Sister" || node.relationship === "Daughter") {
        colors.avatarBg = 'bg-rose-500/80 dark:bg-rose-600/80'; colors.avatarBorder = 'border-rose-700 dark:border-rose-500'; colors.avatarIcon = 'text-white'; colors.textColor = 'text-rose-700 dark:text-rose-300';
    } // Add more role-based colors for Sibling, Child, etc.
    
    if (isSelected) {
        colors.avatarBorder = 'border-uganda-red ring-2 ring-uganda-red ring-offset-background'; // More prominent selection
    }
    return colors;
  };

  if (!initialTree || !initialTree.members) return <div className="p-10 text-center text-muted-foreground">Tree data unavailable.</div>;
  if (initialTree.members.length === 0) return <div className="p-10 text-center text-muted-foreground">No members.</div>;
  if (layoutNodes.length === 0) return <div className="p-10 text-center text-muted-foreground">Calculating layout...</div>;

  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layoutWidth}px`, height: `${layoutHeight}px`,
          // Scaling is handled by the parent component
          backgroundImage: 'radial-gradient(hsl(var(--border)/0.05) 0.5px, transparent 0.5px)',
          backgroundSize: '15px 15px',
        }}
      >
        <svg width={layoutWidth} height={layoutHeight} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          {/* ... defs for markerEnd ... */}
          <g>
            {layoutEdges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                className={`${edge.type === 'spouse-link' ? 'stroke-[var(--uganda-red)] dark:stroke-[var(--uganda-red)]' : 'stroke-muted-foreground/60'}`}
                strokeWidth={edge.type === 'spouse-link' ? "2" : "1.5"}
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
            <div // This is the invisible bounding box for layout and click, node is centered within this
              key={node.id} // Key on the outermost mapped element
              id={`member-container-${node.id}`}
              className={`absolute group cursor-pointer transition-all duration-150 ease-in-out hover:z-20
                          ${isSelected ? 'z-30' : 'z-10'}`}
              style={{ 
                  left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, 
                  top: `${node.y}px`,
                  width: `${NODE_EFFECTIVE_WIDTH}px`, 
                  height: `${NODE_TOTAL_HEIGHT}px`,
              }}
              onClick={() => handleNodeClick(String(node.id))}
            >
                <HoverCard openDelay={150} closeDelay={50}>
                    <HoverCardTrigger asChild>
                        {/* Avatar and Text - Centered within the bounding box */}
                        <div className="flex flex-col items-center justify-start w-full h-full">
                            <div className={`rounded-full flex items-center justify-center overflow-hidden
                                          border-2 shadow-md ${styling.avatarBorder} ${styling.avatarBg}
                                          ${isSelected ? 'ring-2 ring-offset-1 ring-[var(--uganda-red)]' : 'group-hover:shadow-lg group-hover:border-primary/50'}`}
                                  style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER, marginTop: NODE_VERTICAL_PADDING }}>
                              {node.photoUrl ? (
                                <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                              ) : (
                                <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.6} className={styling.avatarIcon} />
                              )}
                              {node.isElder && <ShieldCheck className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 fill-background p-0.5" title="Clan Elder"/>}
                            </div>
                            <div className="mt-1 text-center w-full px-0.5" style={{height: `${NODE_TEXT_AREA_HEIGHT}px`}}>
                              <p className={`font-semibold text-[11px] ${styling.textColor} truncate leading-tight`} title={node.name || "Unnamed"}>
                                {node.name || "Unnamed"}
                              </p>
                              {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                                <p className="text-[9px] text-muted-foreground leading-tight">
                                  {node.birthYear ? `b.${node.birthYear.substring(0,4)}` : "..."}{node.deathYear ? ` d.${node.deathYear.substring(0,4)}` : (node.status === 'deceased' ? " (d)" : "")}
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
          );
        })}
      </div>
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        {/* ... Your Dialog content ... */}
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
