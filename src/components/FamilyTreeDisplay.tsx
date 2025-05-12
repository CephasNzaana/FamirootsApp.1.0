import React, { useState, useRef, useEffect, useMemo } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, Users, Plus, ZoomIn, ZoomOut, UserCircle2, UserPlus, Link2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Constants for layout
const NODE_CONTENT_WIDTH = 150;
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
  zoomLevel: number;
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  // containerRef removed as zoom is handled by parent's scaled div for the whole content area

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
        if (visited.has(member.id)) return 0; 
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
        generation: getNumericGenerationSafe(member, new Set()), // new Set for each root call
    }));

    const membersByGeneration: Record<number, FamilyMember[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0;
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
      let currentXInLevel = 0; // Tracks X for nodes at the current level

      membersByGeneration[gen].sort((a,b) => (a.parentId || "").localeCompare(b.parentId || "")).forEach((member) => { // Try to group siblings visually
        if (processedNodesMap[member.id]) return;

        let x = currentXInLevel;
        const parentNode = member.parentId ? processedNodesMap[member.parentId] : null;

        if (parentNode) {
            const childrenOfParent = membersWithProcessedGen.filter(m => m.parentId === member.parentId);
            const siblingIndex = childrenOfParent.findIndex(c => c.id === member.id);
            const numSiblings = childrenOfParent.length;
            let parentCenterX = parentNode.x + NODE_CONTENT_WIDTH / 2;
            if (parentNode.spouseId && processedNodesMap[parentNode.spouseId]) {
                parentCenterX = (parentNode.x + processedNodesMap[parentNode.spouseId].x + NODE_CONTENT_WIDTH) / 2;
            }
            const childrenBlockWidth = numSiblings * NODE_CONTENT_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING;
            const firstChildX = parentCenterX - childrenBlockWidth / 2;
            x = firstChildX + siblingIndex * (NODE_CONTENT_WIDTH + HORIZONTAL_SPACING);
        }
        // Ensure current node doesn't overlap with the previous one laid out at this level
        x = Math.max(x, currentXInLevel);
        
        const childrenIds = membersWithProcessedGen.filter(m => m.parentId === member.id).map(c => c.id);
        const node: TreeNode = { ...(member as FamilyMember), x, y, childrenIds, spouseId: undefined };
        processedNodesMap[member.id] = node;
        newNodes.push(node);
        currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING; // Update X for next node at this level

        const potentialSpouse = membersWithProcessedGen.find(p =>
            p.id !== member.id && !processedNodesMap[p.id] &&
            (p.generation === member.generation) &&
            ( (p.relationship?.toLowerCase() === 'spouse' && member.relationship?.toLowerCase() === 'spouse') ||
              (childrenIds.length > 0 && membersWithProcessedGen.some(child => child.parentId === p.id && childrenIds.includes(child.id))) )
        );

        if (potentialSpouse) {
            const spouseX = x + SPOUSE_OFFSET_X; // Position spouse next to current node
            const spouseMember: TreeNode = { ...(potentialSpouse as FamilyMember), x: spouseX, y, childrenIds: membersWithProcessedGen.filter(m => m.parentId === potentialSpouse.id).map(c => c.id) };
            processedNodesMap[potentialSpouse.id] = spouseMember;
            newNodes.push(spouseMember);
            node.spouseId = spouseMember.id;
            newEdges.push({
                id: `spouse-${member.id}-${potentialSpouse.id}`,
                path: `M${x + NODE_CONTENT_WIDTH},${y + NODE_AVATAR_DIAMETER / 2} H${spouseX}`, // Straight line between avatar centers
                type: 'spouse',
            });
            currentXInLevel = spouseX + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING; // Update X after placing spouse
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      });
    });
    
    // Post-layout adjustments (very basic, can be significantly improved)
    // This pass attempts to ensure siblings don't unnecessarily overlap if initial placement was too compact
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const n1 = newNodes[i];
        const n2 = newNodes[j];
        if (n1.id !== n2.id && n1.y === n2.y) { // Same level
          const requiredGap = NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
          const currentGap = Math.abs(n1.x - n2.x);
          if (currentGap < requiredGap) {
            // Shift the node that is to the right
            if (n1.x < n2.x) n2.x = n1.x + requiredGap;
            else n1.x = n2.x + requiredGap;
          }
        }
      }
    }
    newNodes.forEach(node => overallMaxX = Math.max(overallMaxX, node.x + NODE_CONTENT_WIDTH));

    newNodes.forEach(node => {
      if (node.parentId && processedNodesMap[node.parentId]) {
        const parentNode = processedNodesMap[node.parentId];
        let startX = parentNode.x + NODE_CONTENT_WIDTH / 2;
        const startY = parentNode.y + NODE_TOTAL_HEIGHT; // Bottom of parent box
        if (parentNode.spouseId && processedNodesMap[parentNode.spouseId]) {
          const spouseNode = processedNodesMap[parentNode.spouseId];
          startX = (parentNode.x + spouseNode.x + NODE_CONTENT_WIDTH) / 2; // Midpoint of parent unit
        }
        const endX = node.x + NODE_CONTENT_WIDTH / 2;
        const endY = node.y; // Top of child box
        newEdges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${startX},${startY} C${startX},${startY + VERTICAL_SPACING / 2} ${endX},${endY - VERTICAL_SPACING / 2} ${endX},${endY}`,
          type: 'parent-child',
        });
      }
    });
    setLayout({ nodes: newNodes, edges: newEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });
  }, [tree]);

  const handleNodeClick = (memberId: string) => setSelectedMemberId(prevId => prevId === memberId ? null : memberId);
  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => {
    setAddingRelationshipInfo({ targetMemberId, relationshipType });
    setAddMemberDialogOpen(true);
  };

  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDataObj = new FormData(e.currentTarget);
    const name = formDataObj.get('name') as string;
    const gender = formDataObj.get('gender') as string;
    const birthYear = formDataObj.get('birthYear') as string;
    let relationshipInput = formDataObj.get('relationship') as string;

    if (!name) { toast.error("Name is required."); return; }

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
          break;
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
    setTree(updatedTree);
    if (onTreeUpdate) onTreeUpdate(updatedTree);

    toast.success(`Added ${name}.`);
    setAddMemberDialogOpen(false);
    setAddingRelationshipInfo(null);
  };
  
  const getOrdinal = (gen?: number): string => { /* ... same as before ... */ };

  if (!layout.nodes.length) {
    return <div className="p-10 text-center text-muted-foreground">Loading tree or no members to display...</div>;
  }

  return (
    <>
      <div
        className="relative" // This div is scaled by the parent's zoomLevel applied to its container
        style={{
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          // transform: `scale(${zoomLevel})`, // Zoom is applied by FamilyTreeMultiView to its content area
          // transformOrigin: 'top left',
        }}
      >
        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <g>
            {layout.edges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                stroke={edge.type === 'spouse' ? "hsl(var(--primary))" : "hsl(var(--border))"}
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
                className={`absolute flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer shadow-md group
                            transition-all duration-200 ease-in-out bg-card text-card-foreground`}
                style={{
                  left: `${node.x}px`, top: `${node.y}px`,
                  width: `${NODE_CONTENT_WIDTH}px`, height: `${NODE_TOTAL_HEIGHT}px`,
                  borderColor: selectedMemberId === node.id ? 'var(--uganda-red)' : 'hsl(var(--border))',
                  boxShadow: selectedMemberId === node.id ? '0 0 0 2px var(--uganda-red)' : undefined,
                }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={`rounded-full flex items-center justify-center mb-1 overflow-hidden
                                border-2 ${selectedMemberId === node.id ? 'border-uganda-red' : 'border-muted-foreground/30'}`}
                      style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER, backgroundColor: 'hsl(var(--muted))' }}>
                  {node.photoUrl ? (
                    <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                  ) : (
                    <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.7} className="text-muted-foreground" />
                  )}
                </div>
                <div className="text-center w-full">
                  <p className="font-semibold text-xs truncate" title={node.name || "Unnamed"}>
                    {node.name || "Unnamed"} {node.isElder && "👑"}
                  </p>
                  {(node.birthYear || node.deathYear) && (
                    <p className="text-[10px] text-muted-foreground">
                      {node.birthYear || "?"} - {node.deathYear || (node.status === 'deceased' ? "✝" : "")}
                    </p>
                  )}
                </div>
                 <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm bg-card/80 hover:bg-muted" title="Add Child" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'child');}}><UserPlus size={12}/></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm bg-card/80 hover:bg-muted" title="Add Spouse" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'spouse');}}><Link2 size={12}/></Button>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl border-popover-border bg-popover text-popover-foreground">
              <h4 className="font-bold text-sm mb-1.5">{node.name || "Unnamed"}</h4>
              {node.relationship && <p><strong className="font-medium">Rel:</strong> {node.relationship}</p>}
              {node.birthYear && <p><strong className="font-medium">Born:</strong> {node.birthYear}</p>}
              {node.deathYear && <p><strong className="font-medium">Died:</strong> {node.deathYear}</p>}
              {node.status && <p><strong className="font-medium">Status:</strong> {node.status}</p>}
              {node.gender && <p><strong className="font-medium">Gender:</strong> {node.gender}</p>}
              <p><strong className="font-medium">Gen:</strong> {node.generation}{getOrdinal(node.generation)}</p>
              {node.notes && <p className="mt-1 pt-1 border-t border-dashed text-[11px] italic">Notes: {node.notes}</p>}
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
      <Dialog open={addMemberDialogOpen} onOpenChange={(open) => { if(!open) setAddingRelationshipInfo(null); setAddMemberDialogOpen(open);}}>
        {/* ... Dialog content unchanged ... */}
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
              {!addingRelationshipInfo?.relationshipType && (
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
    </>
  );
};
export default FamilyTreeDisplay;
