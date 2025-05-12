import React, { useState, useRef, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types"; // Assuming your types are correctly defined
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, Users, Plus, ZoomIn, ZoomOut, UserCircle2, UserPlus, Link2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
// FamilyTreeStats might be too tied to the overall tree, ensure it works with potentially partial tree state if onTreeUpdate is used
// import FamilyTreeStats from "@/components/FamilyTreeStats"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Constants for layout - Adjust as needed for avatar style
const NODE_CONTENT_WIDTH = 150; // Width for text content etc.
const NODE_AVATAR_DIAMETER = 60;
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + 50; // Avatar + text below + padding
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 70;
const SPOUSE_OFFSET_X = NODE_CONTENT_WIDTH + 20;

interface TreeNode extends FamilyMember {
  x: number;
  y: number;
  childrenIds: string[];
  spouseId?: string;
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse';
}

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
  zoomLevel: number; // Controlled by parent (FamilyTreeMultiView)
  onTreeUpdate?: (updatedTree: FamilyTree) => void; // To propagate changes up
  // onSelectMember?: (memberId: string | null) => void; // If selection needs to be managed by parent
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  // Internal state for the tree to allow local modifications if needed for layout/interaction
  // This will be updated if initialTree prop changes
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layout, setLayout] = useState<{ nodes: TreeNode[], edges: Edge[], width: number, height: number }>({ nodes: [], edges: [], width: 0, height: 0 });

  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  useEffect(() => {
    if (!tree || tree.members.length === 0) {
      setLayout({ nodes: [], edges: [], width: 0, height: 0 });
      return;
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => membersById[m.id] = m);
    
    const getNumericGenerationSafe = (member: FamilyMember, visited: Set<string> = new Set()): number => {
        if (visited.has(member.id)) return 0; // Cycle detected or too deep
        visited.add(member.id);

        const gen = member.generation;
        if (typeof gen === 'number' && !isNaN(gen)) return gen;
        if (member.parentId && membersById[member.parentId]) {
            return getNumericGenerationSafe(membersById[member.parentId], visited) + 1;
        }
        return 0; 
    };

    const membersWithProcessedGen = tree.members.map(member => ({
        ...member,
        generation: getNumericGenerationSafe(member),
    }));


    const membersByGeneration: Record<number, FamilyMember[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0; // Should be number now
      if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
      membersByGeneration[gen].push(member);
    });

    const newNodes: TreeNode[] = [];
    const newEdges: Edge[] = [];
    let overallMaxX = 0;
    let overallMaxY = 0;
    const processedNodesMap: { [id: string]: TreeNode } = {};

    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING);
      overallMaxY = Math.max(overallMaxY, y + NODE_TOTAL_HEIGHT);
      let currentXInLevel = 0;

      membersByGeneration[gen].forEach((member) => {
        if (processedNodesMap[member.id]) return;

        let x = currentXInLevel;
        const parentNode = member.parentId ? processedNodesMap[member.parentId] : null;

        if (parentNode) {
            const childrenOfParent = membersWithProcessedGen.filter(m => m.parentId === member.parentId);
            const siblingIndex = childrenOfParent.findIndex(c => c.id === member.id);
            const numSiblings = childrenOfParent.length;

            // Attempt to center children block under parent(s)
            let parentCenterX = parentNode.x + NODE_CONTENT_WIDTH / 2;
            if (parentNode.spouseId && processedNodesMap[parentNode.spouseId]) {
                parentCenterX = (parentNode.x + processedNodesMap[parentNode.spouseId].x + NODE_CONTENT_WIDTH) / 2;
            }
            
            const childrenBlockWidth = numSiblings * NODE_CONTENT_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING;
            const firstChildX = parentCenterX - childrenBlockWidth / 2;
            x = firstChildX + siblingIndex * (NODE_CONTENT_WIDTH + HORIZONTAL_SPACING);
            x = Math.max(x, currentXInLevel); // Avoid overlap with previous node on this level
        }
        
        const childrenIds = membersWithProcessedGen.filter(m => m.parentId === member.id).map(c => c.id);
        
        const node: TreeNode = {
          ...(member as FamilyMember), // Ensure all FamilyMember props are spread
          x,
          y,
          childrenIds,
          spouseId: undefined,
        };
        processedNodesMap[member.id] = node;
        newNodes.push(node);
        currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;

        // Basic spouse detection (highly dependent on data structure)
        const potentialSpouse = membersWithProcessedGen.find(p =>
            p.id !== member.id &&
            !processedNodesMap[p.id] &&
            (p.generation === member.generation) &&
            ( (p.relationship?.toLowerCase() === 'spouse' && member.relationship?.toLowerCase() === 'spouse') || // Explicit
              (childrenIds.length > 0 && membersWithProcessedGen.some(child => child.parentId === p.id && childrenIds.includes(child.id))) // Shared children
            )
        );

        if (potentialSpouse) {
            const spouseX = x + SPOUSE_OFFSET_X;
            const spouseMember: TreeNode = {
                ...(potentialSpouse as FamilyMember),
                x: spouseX,
                y,
                childrenIds: membersWithProcessedGen.filter(m => m.parentId === potentialSpouse.id).map(c => c.id),
            };
            processedNodesMap[potentialSpouse.id] = spouseMember;
            newNodes.push(spouseMember);
            node.spouseId = spouseMember.id; // Link them

            newEdges.push({
                id: `spouse-${member.id}-${potentialSpouse.id}`,
                path: `M${x + NODE_CONTENT_WIDTH},${y + NODE_AVATAR_DIAMETER / 2} H${spouseX}`,
                type: 'spouse',
            });
            currentXInLevel = spouseX + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      });
    });
    
    // Naive overlap reduction pass (can be improved significantly)
    for (let i = 0; i < generationLevels.length; i++) {
        const gen = generationLevels[i];
        const nodesInGen = newNodes.filter(n => n.generation === gen).sort((a,b) => a.x - b.x);
        for (let j = 0; j < nodesInGen.length - 1; j++) {
            const n1 = nodesInGen[j];
            const n2 = nodesInGen[j+1];
            const requiredSpace = NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
            if (n1.spouseId && processedNodesMap[n1.spouseId] === n2) { // If n2 is n1's spouse
                 if (n2.x < n1.x + SPOUSE_OFFSET_X) n2.x = n1.x + SPOUSE_OFFSET_X;
            } else if (n2.x < n1.x + requiredSpace) {
                n2.x = n1.x + requiredSpace;
            }
        }
    }
    newNodes.forEach(node => overallMaxX = Math.max(overallMaxX, node.x + NODE_CONTENT_WIDTH));


    newNodes.forEach(node => {
      if (node.parentId && processedNodesMap[node.parentId]) {
        const parentNode = processedNodesMap[node.parentId];
        let parentX = parentNode.x + NODE_CONTENT_WIDTH / 2;
        const parentY = parentNode.y + NODE_TOTAL_HEIGHT - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) / 2; // Bottom-center of avatar box

        if (parentNode.spouseId && processedNodesMap[parentNode.spouseId]) {
          const spouseNode = processedNodesMap[parentNode.spouseId];
          parentX = (parentNode.x + spouseNode.x + NODE_CONTENT_WIDTH) / 2; // Midpoint of parent unit
        }

        const childX = node.x + NODE_CONTENT_WIDTH / 2;
        const childY = node.y; // Top-center of child's avatar box
        newEdges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${parentX},${parentY} C${parentX},${parentY + VERTICAL_SPACING / 2} ${childX},${childY - VERTICAL_SPACING / 2} ${childX},${childY}`,
          type: 'parent-child',
        });
      }
    });

    setLayout({ nodes: newNodes, edges: newEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });

  }, [tree]);


  const handleNodeClick = (memberId: string) => {
    setSelectedMemberId(prevId => prevId === memberId ? null : memberId);
    // if (onSelectMember) onSelectMember(memberId);
  };

  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => {
    setAddingRelationshipInfo({ targetMemberId, relationshipType });
    setAddMemberDialogOpen(true);
  };

  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const gender = formData.get('gender') as string;
    const birthYear = formData.get('birthYear') as string;
    let relationshipInput = formData.get('relationship') as string;

    if (!name) {
      toast.error("Name is required."); return;
    }

    let newMemberParentId: string | undefined = undefined;
    let newMemberGeneration: number = 0;
    const targetMember = addingRelationshipInfo?.targetMemberId ? tree.members.find(m => m.id === addingRelationshipInfo.targetMemberId) : null;

    if (targetMember) {
      const targetGen = targetMember.generation ?? 0;
      switch (addingRelationshipInfo?.relationshipType) {
        case 'child':
          newMemberParentId = targetMember.id; newMemberGeneration = targetGen + 1;
          relationshipInput = gender === 'male' ? 'Son' : gender === 'female' ? 'Daughter' : 'Child';
          break;
        case 'spouse':
          newMemberGeneration = targetGen; relationshipInput = 'Spouse';
          // Advanced: update targetMember's spouseId or relationships array
          break;
        // TODO: Add 'parent' case - more complex as it might involve re-parenting targetMember
      }
    }

    const newMember: FamilyMember = {
      id: `member-${Date.now()}`, name,
      relationship: relationshipInput || "Relative",
      birthYear: birthYear || undefined, gender: gender as any,
      generation: newMemberGeneration, isElder: false, status: 'living',
      parentId: newMemberParentId,
    };
    
    const updatedMembers = [...tree.members, newMember];
    const updatedTree = { ...tree, members: updatedMembers };
    setTree(updatedTree); // Update internal state
    if (onTreeUpdate) onTreeUpdate(updatedTree); // Propagate update

    toast.success(`Added ${name}.`);
    setAddMemberDialogOpen(false);
    setAddingRelationshipInfo(null);
  };
  
  const getOrdinal = (gen: number | undefined): string => {
    if (gen === undefined) return "";
    if (gen === 0) return " (Self/Proband)";
    const s = ["th", "st", "nd", "rd"];
    const v = gen % 100;
    const prefix = gen < 0 ? "Parental Gen" : "Descendant Gen";
    return ` (${prefix} ${Math.abs(gen)}${s[(v - 20) % 10] || s[v] || s[0]})`;
  }


  if (!tree || tree.members.length === 0) { /* ... empty state ... */ }

  return (
    <div className="w-full h-full" ref={containerRef}> {/* Ensure this div can be measured for scroll extent if needed */}
      <div
        className="relative"
        style={{
          width: `${layout.width}px`, // Natural width based on content
          height: `${layout.height}px`, // Natural height
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.3s ease',
        }}
      >
        <svg className="absolute top-0 left-0 w-full h-full" style={{ width: layout.width, height: layout.height, pointerEvents: 'none' }}>
          <g>
            {layout.edges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                stroke={edge.type === 'spouse' ? "hsl(var(--primary))" : "hsl(var(--border))"} // Use theme colors
                strokeWidth="1.5" fill="none"
              />
            ))}
          </g>
        </svg>

        {layout.nodes.map((node) => (
          <HoverCard key={node.id} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div
                id={`member-${node.id}`}
                className={`absolute flex flex-col items-center p-2 rounded-lg border cursor-pointer shadow-md
                            transition-all duration-200 ease-in-out
                            ${selectedMemberId === node.id ? 'border-uganda-red ring-2 ring-uganda-red shadow-xl' : 'border-gray-300 hover:shadow-lg hover:border-uganda-yellow'}`}
                style={{
                  left: `${node.x}px`, top: `${node.y}px`,
                  width: `${NODE_CONTENT_WIDTH}px`, height: `${NODE_TOTAL_HEIGHT}px`,
                  backgroundColor: 'hsl(var(--card))', // Theme card background
                  borderColor: selectedMemberId === node.id ? 'var(--uganda-red)' : 'hsl(var(--border))'
                }}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Avatar */}
                <div className={`rounded-full flex items-center justify-center mb-1 overflow-hidden
                                border-2 ${selectedMemberId === node.id ? 'border-uganda-red' : 'border-gray-200'}`}
                      style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER, backgroundColor: 'hsl(var(--muted))' }}>
                  {node.photoUrl ? (
                    <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                  ) : (
                    <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.6} className="text-gray-400" />
                  )}
                </div>
                {/* Info */}
                <div className="text-center">
                  <p className="font-semibold text-xs truncate" style={{color: 'hsl(var(--foreground))'}} title={node.name || "Unnamed"}>
                    {node.name || "Unnamed"} {node.isElder && "👑"}
                  </p>
                  {(node.birthYear || node.deathYear) && (
                    <p className="text-[10px]" style={{color: 'hsl(var(--muted-foreground))'}}>
                      {node.birthYear || "?"} - {node.deathYear || (node.status === 'deceased' ? "✝" : "")}
                    </p>
                  )}
                </div>
                 <div className="absolute top-1 right-1 flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Add Child" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'child');}}><UserPlus size={12}/></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Add Spouse" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'spouse');}}><Link2 size={12}/></Button>
                    {/* <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit Person"><Edit3 size={12}/></Button> */}
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl" style={{borderColor: 'hsl(var(--popover-border))'}}>
              <h4 className="font-bold text-sm mb-1.5" style={{color: 'hsl(var(--popover-foreground))'}}>{node.name || "Unnamed"}</h4>
              {node.relationship && <p><strong className="font-medium">Rel:</strong> {node.relationship}</p>}
              {node.birthYear && <p><strong className="font-medium">Born:</strong> {node.birthYear}</p>}
              {node.deathYear && <p><strong className="font-medium">Died:</strong> {node.deathYear}</p>}
              {node.status && <p><strong className="font-medium">Status:</strong> {node.status}</p>}
              {node.gender && <p><strong className="font-medium">Gender:</strong> {node.gender}</p>}
              <p><strong className="font-medium">Gen:</strong> {node.generation} {getOrdinal(node.generation)}</p>
              {node.notes && <p className="mt-1 pt-1 border-t border-dashed text-[11px] italic">Notes: {node.notes}</p>}
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
      {/* Add Member Dialog (same as before, ensure it's styled by your global styles) */}
      <Dialog open={addMemberDialogOpen} onOpenChange={(open) => { if(!open) setAddingRelationshipInfo(null); setAddMemberDialogOpen(open);}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Add Family Member
              {addingRelationshipInfo?.targetMemberId && tree.members.find(m=>m.id === addingRelationshipInfo.targetMemberId) &&
                <span className="text-sm font-normal"> (as {addingRelationshipInfo.relationshipType} to {tree.members.find(m=>m.id === addingRelationshipInfo.targetMemberId)?.name})</span>
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitNewMember}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input id="name" name="name" placeholder="Full name" required />
              </div>
              {!addingRelationshipInfo?.relationshipType && ( // Only show if not contextual
                 <div className="grid gap-2">
                    <label htmlFor="relationship" className="text-sm font-medium">Relationship</label>
                    <Input id="relationship" name="relationship" placeholder="e.g., Cousin, Aunt" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="gender" className="text-sm font-medium">Gender</label>
                  <select id="gender" name="gender" defaultValue="male" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="male">Male</option> <option value="female">Female</option> <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="birthYear" className="text-sm font-medium">Birth Year</label>
                  <Input id="birthYear" name="birthYear" type="number" placeholder="e.g., 1980" />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <Textarea id="notes" name="notes" placeholder="Any additional information..." rows={3}/>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {setAddMemberDialogOpen(false); setAddingRelationshipInfo(null);}}>Cancel</Button>
              <Button type="submit" className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">Add Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyTreeDisplay;
