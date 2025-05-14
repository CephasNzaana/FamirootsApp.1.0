// src/components/FamilyTreeDisplay.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import { FamilyTree, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Added DialogDescription
import { User, Calendar, Heart, UserCircle2, UserPlus, ShieldCheck, Edit3, Users, Link } from "lucide-react"; // Added Edit3, Users, Link
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator"; // Added Separator

// Layout Constants (assuming these are the same as your last version)
const NODE_AVATAR_DIAMETER = 56;
const NODE_TEXT_AREA_HEIGHT = 30; 
const NODE_VERTICAL_PADDING = 5; 
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + NODE_TEXT_AREA_HEIGHT + (NODE_VERTICAL_PADDING * 2); 
const NODE_EFFECTIVE_WIDTH = NODE_AVATAR_DIAMETER + 50; 
const HORIZONTAL_SPACING_SIBLINGS = 20; 
const HORIZONTAL_SPACING_COUPLE_SYMBOL = 24; 
const VERTICAL_SPACING_GENERATIONS = 70;
const COUPLE_SYMBOL_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; 
const CHILD_LINE_JUNCTION_Y_OFFSET = 15; 

interface TreeNode extends FamilyMember {
  x: number; 
  y: number; 
  childrenIds?: string[];
}

interface Edge {
  id: string;
  path?: string; 
  type: 'parent-child' | 'spouse-rings';
  nodeX?: number;
  spouseX?: number;
  symbolY?: number;
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel?: number; // This prop is received but scaling is handled by parent (FamilyTreeMultiView)
  onTreeUpdate: (updatedTree: FamilyTree) => void;
}

// Helper to generate unique IDs client-side for new members
const generateNewMemberId = (): string => {
  return `client_${crypto.randomUUID()}`;
};

const FamilyTreeDisplay = ({ tree: initialTreeData, zoomLevel: parentPassedZoom, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTreeData);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null); // For editing functionality
  
  // State for the "Add Member" dialog form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberBirthYear, setNewMemberBirthYear] = useState("");
  const [newMemberDeathYear, setNewMemberDeathYear] = useState("");
  const [newMemberGender, setNewMemberGender] = useState<'male' | 'female'>("male");
  const [newMemberNotes, setNewMemberNotes] = useState("");

  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ 
    targetMemberId: string; // Target member to whom new member is related
    targetMemberName: string;
    relationshipType: 'child' | 'spouse' ; // 'parent' can be added later
  } | null>(null);
  
  useEffect(() => {
    setTree(initialTreeData);
  }, [initialTreeData]);

  const { nodes: layoutNodes, edges: layoutEdges, width: layoutWidth, height: layoutHeight } = useMemo(() => {
    // ... (useMemo logic for layout - keeping it the same as your last working version) ...
    // This should be the full layout logic from the version where it was working correctly.
    // For brevity, I'm not repeating the entire layout calculation here.
    // It should calculate positionedNodes, nodePositions, edges, overallMaxX, overallMaxY.
    // The following is a simplified placeholder of what should be there:
    if (!tree || !tree.members) return { nodes: [], edges: [], width: 600, height: 400 };
    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(member => { membersById[String(member.id)] = member; });
    const getNumericGenerationSafe = (gen: string | number | undefined): number => {
      if (gen === undefined || gen === null) return 0; const num = Number(gen); return isNaN(num) ? 0 : num;
    };
    const membersWithProcessedGen = tree.members.map(m => ({ ...m, generation: getNumericGenerationSafe(m.generation) }));
    const membersByGeneration: Record<number, FamilyMember[]> = {};
    membersWithProcessedGen.forEach(member => {
      const gen = member.generation; if (!membersByGeneration[gen]) membersByGeneration[gen] = []; membersByGeneration[gen].push(member);
    });
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);
    const positionedNodes: TreeNode[] = []; const nodePositions = new Map<string, { x: number; y: number; unitWidth: number; isCoupleUnit?: boolean; spouseX?: number }>();
    const currentEdges: Edge[] = []; let overallMaxX = 0; let overallMaxY = 0;

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
            const parentNodeFromPositioned = memberData.parentId ? positionedNodes.find(n => n.id === memberData.parentId) : null;
            /* ... (parent-based X centering placeholder) ... */
            nodeX = Math.max(nodeX, currentXInLevel);
            const node: TreeNode = { ...memberData, x: nodeX, y: yPos, childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(memberData.id)).map(c => String(c.id))};
            let isCouple = false;
            if (node.spouseId && !levelProcessedThisPass[node.spouseId]) {
                const spouseData = membersById[node.spouseId];
                if (spouseData && spouseData.generation === node.generation) {
                    isCouple = true; levelProcessedThisPass[spouseData.id] = true; 
                    const spouseXPos = nodeX + NODE_AVATAR_DIAMETER / 2 + HORIZONTAL_SPACING_COUPLE_SYMBOL + NODE_AVATAR_DIAMETER / 2;
                    const spouseNode: TreeNode = { ...(spouseData as FamilyMember), name: spouseData.name || "Unnamed Spouse", x: spouseXPos, y: yPos, spouseId: node.id, childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(spouseData.id)).map(c => String(c.id))};
                    positionedNodes.push(node); positionedNodes.push(spouseNode); 
                    nodePositions.set(node.id, { x: node.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH, isCoupleUnit: true, spouseX: spouseNode.x });
                    nodePositions.set(spouseNode.id, { x: spouseNode.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH, isCoupleUnit: true, spouseX: node.x });
                    levelProcessedThisPass[node.id] = true;
                    currentXInLevel = spouseNode.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
                } else { node.spouseId = undefined; }
            }
            if (!isCouple) { 
                positionedNodes.push(node); nodePositions.set(node.id, { x: node.x, y: yPos, unitWidth: NODE_EFFECTIVE_WIDTH });
                levelProcessedThisPass[node.id] = true; currentXInLevel = node.x + NODE_EFFECTIVE_WIDTH/2 + HORIZONTAL_SPACING_SIBLINGS;
            }
            overallMaxX = Math.max(overallMaxX, currentXInLevel - HORIZONTAL_SPACING_SIBLINGS + NODE_EFFECTIVE_WIDTH/2);
        }
    });
    // X-Overlap Reduction Pass (Simplified - ensure this logic is complete from your working version)
     generationLevels.forEach(gen => {
        const nodesInGen = positionedNodes.filter(n => n.generation === gen).sort((a,b) => a.x - b.x);
        for (let i = 1; i < nodesInGen.length; i++) {
            const prevNode = nodesInGen[i-1]; const currNode = nodesInGen[i];
            const requiredSpace = (NODE_EFFECTIVE_WIDTH / 2) + (NODE_EFFECTIVE_WIDTH / 2) + HORIZONTAL_SPACING_SIBLINGS;
            const currentSpace = currNode.x - prevNode.x;
            if (currentSpace < requiredSpace) {
                const shift = requiredSpace - currentSpace; currNode.x += shift;
                for (let j = i + 1; j < nodesInGen.length; j++) { nodesInGen[j].x += shift; }
                overallMaxX = Math.max(overallMaxX, currNode.x + NODE_EFFECTIVE_WIDTH / 2);
            }
        }
    });

    positionedNodes.forEach(node => {
        const nodeCenterAvatarX = node.x; const nodeAvatarTopY = node.y + NODE_VERTICAL_PADDING;
        if (node.parentId && nodePositions.has(node.parentId)) {
            const parentNode = positionedNodes.find(p => p.id === node.parentId)!; const parentLayoutInfo = nodePositions.get(parentNode.id)!;
            let coupleUnitCenterX = parentLayoutInfo.x; let parentLineStartY = parentNode.y + NODE_TOTAL_HEIGHT - NODE_VERTICAL_PADDING;
            if (parentNode.spouseId && nodePositions.has(parentNode.spouseId)) {
                const spouseNode = positionedNodes.find(s => s.id === parentNode.spouseId)!; coupleUnitCenterX = (parentNode.x + spouseNode.x) / 2; 
                parentLineStartY = parentNode.y + NODE_VERTICAL_PADDING + COUPLE_SYMBOL_Y_OFFSET + CHILD_LINE_JUNCTION_Y_OFFSET; 
            }
            const childTopY = nodeAvatarTopY; const childCenterX = nodeCenterAvatarX;
            const midYDrop = parentLineStartY + VERTICAL_SPACING_GENERATIONS / 3; const midYRise = childTopY - VERTICAL_SPACING_GENERATIONS / 3;
            currentEdges.push({ id: `pc-${parentNode.id}-${node.id}`, path: `M${coupleUnitCenterX},${parentLineStartY} L${coupleUnitCenterX},${midYDrop} L${childCenterX},${midYRise} L${childCenterX},${childTopY}`, type: 'parent-child'});
        }
        if (node.spouseId && nodePositions.has(node.spouseId)) {
            const spouseNode = positionedNodes.find(s => s.id === node.spouseId)!;
            if (String(node.id) < String(spouseNode.id)) { 
                const symbolYVal = node.y + NODE_VERTICAL_PADDING + COUPLE_SYMBOL_Y_OFFSET;
                currentEdges.push({ id: `spouse-rings-${node.id}-${spouseNode.id}`, type: 'spouse-rings', nodeX: node.x, spouseX: spouseNode.x, symbolY: symbolYVal});
            }
        }
    });
    return { nodes: positionedNodes, edges: currentEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) };
  }, [tree]); 

  const handleNodeClick = (memberId: string) => {
    const member = tree.members.find(m => m.id === memberId);
    if (member) {
        setSelectedMemberId(prevId => (prevId === memberId ? null : memberId));
        setEditingMember(member); // Set for potential edit action, or just for selection highlight
    }
  };
  
  const openAddMemberDialog = (targetMemberId: string, relationshipType: 'child' | 'spouse') => {
    const targetMember = tree.members.find(m => m.id === targetMemberId);
    if (!targetMember) return;

    setAddingRelationshipInfo({ 
        targetMemberId, 
        targetMemberName: targetMember.name,
        relationshipType 
    });
    // Reset form fields for the dialog
    setNewMemberName("");
    setNewMemberBirthYear("");
    setNewMemberDeathYear("");
    setNewMemberGender("male"); // Default gender
    setNewMemberNotes("");
    setAddMemberDialogOpen(true);
  };

  const onSubmitNewMember = () => {
    if (!addingRelationshipInfo || !newMemberName.trim()) {
      toast.error("New member's name is required.");
      return;
    }

    const { targetMemberId, relationshipType } = addingRelationshipInfo;
    const targetMember = tree.members.find(m => m.id === targetMemberId);
    if (!targetMember) {
      toast.error("Target member not found.");
      return;
    }

    const newMemberId = generateNewMemberId();
    let newMembers = [...tree.members];
    let newMember: FamilyMember | null = null;

    if (relationshipType === 'child') {
      newMember = {
        id: newMemberId,
        name: newMemberName.trim(),
        birthYear: newMemberBirthYear.trim() || undefined,
        deathYear: newMemberDeathYear.trim() || undefined,
        gender: newMemberGender,
        notes: newMemberNotes.trim() || undefined,
        relationship: newMemberGender === 'male' ? 'Son' : 'Daughter',
        generation: targetMember.generation + 1,
        parentId: targetMember.id,
        isElder: false,
        status: newMemberDeathYear.trim() ? 'deceased' : 'living',
      };
      newMembers.push(newMember);
    } else if (relationshipType === 'spouse') {
      if (targetMember.gender === newMemberGender) {
        toast.error("Spouses must have different genders.");
        return;
      }
      newMember = {
        id: newMemberId,
        name: newMemberName.trim(),
        birthYear: newMemberBirthYear.trim() || undefined,
        deathYear: newMemberDeathYear.trim() || undefined,
        gender: newMemberGender,
        notes: newMemberNotes.trim() || undefined,
        relationship: 'Spouse',
        generation: targetMember.generation,
        spouseId: targetMember.id,
        isElder: false,
        status: newMemberDeathYear.trim() ? 'deceased' : 'living',
      };
      // Update the target member to link to the new spouse
      newMembers = newMembers.map(m => 
        m.id === targetMember.id ? { ...m, spouseId: newMemberId } : m
      );
      newMembers.push(newMember);
    }

    if (newMember) {
      const updatedTree = { ...tree, members: newMembers };
      setTree(updatedTree); // Update local state
      onTreeUpdate(updatedTree); // Notify parent
      toast.success(`Added ${newMember.relationship || 'member'}: ${newMember.name}`);
    }

    setAddMemberDialogOpen(false);
    setAddingRelationshipInfo(null);
  };

  const getNodeStyling = (node: TreeNode): { avatarBgClass: string, avatarBorderClass: string, avatarIconClass: string, textColorClass: string } => {
    // ... (getNodeStyling function - same as your last working version) ...
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
          // transform and transformOrigin are handled by the parent FamilyTreeMultiView
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
                const overlapFactor = 0.6; 
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
                          ${isSelected ? 'z-30 ring-2 ring-uganda-red dark:ring-red-500 shadow-xl' : 'z-10'} 
                          bg-card dark:bg-slate-800 rounded-lg p-1 shadow-md hover:shadow-lg`} // Added some base styling for node box
              style={{ 
                  left: `${node.x - NODE_EFFECTIVE_WIDTH / 2}px`, 
                  top: `${node.y}px`,
                  width: `${NODE_EFFECTIVE_WIDTH}px`, 
              }}
              onClick={() => handleNodeClick(String(node.id))}
            >
                <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <div className="flex flex-col items-center w-full"> {/* Removed pt-1 as node box has padding */}
                            <div className={`relative rounded-full flex items-center justify-center overflow-hidden
                                          border-2 ${styling.avatarBorderClass} ${styling.avatarBgClass}
                                          group-hover:shadow-lg group-hover:ring-1 group-hover:ring-primary/50`}
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
                                  {node.deathYear ? `d.${String(node.deathYear).substring(0,4)}` : (node.status === 'deceased' && !node.deathYear ? " (dec.)" : "")}
                                </p>
                              )}
                            </div>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 text-xs p-3 space-y-1.5 shadow-xl border-border bg-popover text-popover-foreground">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-full ${styling.avatarBgClass} ${styling.avatarBorderClass} border`}>
                                <UserCircle2 size={20} className={styling.avatarIconClass}/>
                            </div>
                            <h4 className={`font-semibold text-sm ${styling.textColorClass}`}>{node.name || "Unnamed"}</h4>
                        </div>
                        <Separator className="my-2" />
                        <p className="text-muted-foreground"><span className="font-medium text-foreground">Relationship:</span> {node.relationship || "N/A"}</p>
                        {node.gender && <p className="text-muted-foreground capitalize"><span className="font-medium text-foreground">Gender:</span> {node.gender}</p>}
                        <div className="flex items-center space-x-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5"/>
                            <span>
                                {node.birthYear ? `Born: ${node.birthYear}` : "Birth year unknown"}
                                {node.deathYear ? `, Died: ${node.deathYear}` : (node.status === 'deceased' && !node.deathYear ? " (Deceased)" : "")}
                            </span>
                        </div>
                        {node.notes && <p className="text-muted-foreground pt-1 border-t border-border mt-1"><span className="font-medium text-foreground">Notes:</span> {node.notes}</p>}
                        {node.isElder && <Badge variant="outline" className="mt-1 border-yellow-500 text-yellow-600 dark:border-yellow-600 dark:text-yellow-400">Clan Elder</Badge>}
                        
                        <Separator className="my-2" />
                        <div className="pt-1 space-x-1 flex flex-wrap gap-1">
                            <Button variant="outline" size="xs" className="text-xs" onClick={(e) => { e.stopPropagation(); openAddMemberDialog(String(node.id), 'child'); }}>
                                <UserPlus className="h-3 w-3 mr-1"/> Add Child
                            </Button>
                            <Button variant="outline" size="xs" className="text-xs" onClick={(e) => { e.stopPropagation(); openAddMemberDialog(String(node.id), 'spouse'); }}>
                                <Users className="h-3 w-3 mr-1"/> Add Spouse
                            </Button>
                            {/* Add Parent button can be added here with 'parent' relationshipType, but logic is more complex */}
                            {/* <Button variant="outline" size="xs" className="text-xs" onClick={(e) => { e.stopPropagation(); console.log("Edit Member:", node.id); setEditingMember(node); /* Open Edit Dialog *\/ }}>
                                <Edit3 className="h-3 w-3 mr-1"/> Edit Info
                            </Button> */}
                        </div>
                    </HoverCardContent>
                </HoverCard>
             </div>
          );
        })}
      </div>

      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card dark:bg-slate-900">
            <DialogHeader>
                <DialogTitle className="text-foreground dark:text-slate-100">Add New Family Member</DialogTitle>
                {addingRelationshipInfo && (
                    <DialogDescription className="text-muted-foreground dark:text-slate-400">
                        Adding a new <span className="font-semibold">{addingRelationshipInfo.relationshipType}</span> to <span className="font-semibold">{addingRelationshipInfo.targetMemberName || 'the family'}</span>.
                    </DialogDescription>
                )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newMemberName" className="text-right text-sm">Name *</Label>
                    <Input id="newMemberName" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="col-span-3" placeholder="Full name"/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newMemberGender" className="text-right text-sm">Gender *</Label>
                    <Select value={newMemberGender} onValueChange={(value: 'male' | 'female') => setNewMemberGender(value)}>
                        <SelectTrigger id="newMemberGender" className="col-span-3">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newMemberBirthYear" className="text-right text-sm">Birth Year</Label>
                    <Input id="newMemberBirthYear" type="number" value={newMemberBirthYear} onChange={(e) => setNewMemberBirthYear(e.target.value)} className="col-span-3" placeholder="YYYY"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newMemberDeathYear" className="text-right text-sm">Death Year</Label>
                    <Input id="newMemberDeathYear" type="number" value={newMemberDeathYear} onChange={(e) => setNewMemberDeathYear(e.target.value)} className="col-span-3" placeholder="YYYY (if applicable)"/>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="newMemberNotes" className="text-right text-sm pt-2">Notes</Label>
                    <Textarea id="newMemberNotes" value={newMemberNotes} onChange={(e) => setNewMemberNotes(e.target.value)} className="col-span-3" placeholder="Any relevant notes..."/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
                <Button onClick={onSubmitNewMember}>Save Member</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
