// src/components/FamilyTreeDisplay.tsx

import React, { useState, useRef, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2 } from "lucide-react"; // Ensure all icons are imported
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

// Constants for layout
const NODE_CONTENT_WIDTH = 160; 
const NODE_AVATAR_DIAMETER = 56;
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + 44; 
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 60;
const SPOUSE_OFFSET_X = NODE_CONTENT_WIDTH + 10;

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

  const [layout, setLayout] = useState<{ nodes: TreeNode[], edges: Edge[], width: number, height: number }>({ nodes: [], edges: [], width: 0, height: 0 });

  useEffect(() => {
    console.log("FamilyTreeDisplay: initialTree prop received/updated", JSON.parse(JSON.stringify(initialTree))); // Deep copy for logging
    setTree(initialTree);
  }, [initialTree]);

  useEffect(() => {
    console.log("FamilyTreeDisplay: Layout calculation triggered. Current tree members:", tree?.members?.length);
    if (!tree || !tree.members || !Array.isArray(tree.members) || tree.members.length === 0) {
      console.log("FamilyTreeDisplay: No members to layout or tree/members array invalid.");
      setLayout({ nodes: [], edges: [], width: 0, height: 0 });
      return;
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if(m && m.id) membersById[m.id] = m; }); 
    
    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => {
        if (!member || !member.id) return 0; // Handle undefined member or member.id
        if (visited.has(member.id)) {
            console.warn("getNumericGenerationSafe: Cycle detected for member ID:", member.id);
            return 0; 
        }
        visited.add(member.id);
        const gen = member.generation;
        if (typeof gen === 'number' && !isNaN(gen)) return gen;
        
        const parentId = member.parentId ? String(member.parentId) : undefined; // Ensure parentId is string for lookup
        if (parentId && membersById[parentId]) {
            return getNumericGenerationSafe(membersById[parentId], new Set(visited)) + 1;
        }
        return 0; 
    };

    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({
        ...member,
        name: member.name || "Unnamed",
        // Ensure parentId is string or undefined before using it for generation calculation
        parentId: member.parentId ? String(member.parentId) : undefined, 
        generation: getNumericGenerationSafe(member, new Set()),
    }));
    console.log("FamilyTreeDisplay: Members with processed generation:", membersWithProcessedGen.length);

    const membersByGeneration: Record<number, FamilyMember[]> = {};
    membersWithProcessedGen.forEach((member) => {
      const gen = member.generation ?? 0;
      if (!membersByGeneration[gen]) membersByGeneration[gen] = [];
      membersByGeneration[gen].push(member);
    });

    const newNodes: TreeNode[] = [];
    const newEdges: Edge[] = [];
    let overallMaxX = HORIZONTAL_SPACING; 
    let overallMaxY = VERTICAL_SPACING; 
    const processedNodesMap: { [id: string]: TreeNode } = {};
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    if (generationLevels.length === 0 && membersWithProcessedGen.length > 0) {
        console.warn("FamilyTreeDisplay: No generation levels but members exist. Placing all in generation 0.");
        membersByGeneration[0] = [...membersWithProcessedGen];
        generationLevels.push(0);
    }

    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING) + VERTICAL_SPACING; 
      overallMaxY = Math.max(overallMaxY, y + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING;

      const levelMembers = membersByGeneration[gen] || [];
      
      // *** THIS IS THE FIX for the localeCompare error ***
      levelMembers.sort((a, b) => {
        const parentA = String(a.parentId || "z_fallback"); // Ensure string for localeCompare
        const parentB = String(b.parentId || "z_fallback"); // Ensure string for localeCompare
        const birthYearA = String(a.birthYear || "9999");   // Ensure string for localeCompare
        const birthYearB = String(b.birthYear || "9999");   // Ensure string for localeCompare

        const parentCompare = parentA.localeCompare(parentB);
        if (parentCompare !== 0) {
          return parentCompare;
        }
        return birthYearA.localeCompare(birthYearB);
      });

      levelMembers.forEach((member) => {
        if (processedNodesMap[member.id]) return;

        let x = currentXInLevel;
        // Ensure parentId is string for processedNodesMap lookup
        const parentNode = member.parentId ? processedNodesMap[String(member.parentId)] : null;

        if (parentNode) {
            const childrenOfParent = membersWithProcessedGen.filter(m => String(m.parentId) === String(member.parentId));
            const siblingIndex = childrenOfParent.findIndex(c => c.id === member.id);
            const numSiblings = childrenOfParent.length;
            let parentCenterX = parentNode.x + NODE_CONTENT_WIDTH / 2;

            if (parentNode.spouseId && processedNodesMap[String(parentNode.spouseId)]) {
                const spouseOfParent = processedNodesMap[String(parentNode.spouseId)];
                const p1x = Math.min(parentNode.x, spouseOfParent.x);
                const p2x = Math.max(parentNode.x, spouseOfParent.x);
                parentCenterX = (p1x + p2x + NODE_CONTENT_WIDTH) / 2;
            }
            
            const childrenBlockWidth = numSiblings * NODE_CONTENT_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING;
            const firstChildX = parentCenterX - childrenBlockWidth / 2;
            x = firstChildX + siblingIndex * (NODE_CONTENT_WIDTH + HORIZONTAL_SPACING);
        }
        x = Math.max(x, currentXInLevel);
        
        const childrenIds = membersWithProcessedGen.filter(m => String(m.parentId) === String(member.id)).map(c => String(c.id));
        const node: TreeNode = { ...(member as FamilyMember), name: member.name || "Unnamed", x, y, childrenIds, spouseId: undefined };
        processedNodesMap[String(member.id)] = node;
        newNodes.push(node);
        currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;

        const potentialSpouse = membersWithProcessedGen.find(p =>
            p.id !== member.id && !processedNodesMap[p.id] &&
            (p.generation === member.generation) &&
            ( (p.relationship?.toLowerCase().includes('spouse') && member.relationship?.toLowerCase().includes('spouse')) ||
              (childrenIds.length > 0 && membersWithProcessedGen.some(child => String(child.parentId) === String(p.id) && childrenIds.includes(String(child.id)))) )
        );

        if (potentialSpouse) {
            const spouseX = x + SPOUSE_OFFSET_X;
            const spouseMember: TreeNode = { ...(potentialSpouse as FamilyMember), name: potentialSpouse.name || "Unnamed", x: spouseX, y, childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(potentialSpouse.id)).map(c => String(c.id)) };
            processedNodesMap[String(potentialSpouse.id)] = spouseMember;
            newNodes.push(spouseMember);
            node.spouseId = String(spouseMember.id);
            newEdges.push({
                id: `spouse-${member.id}-${potentialSpouse.id}`,
                path: `M${x + NODE_CONTENT_WIDTH - (NODE_CONTENT_WIDTH - NODE_AVATAR_DIAMETER)/2},${y + NODE_AVATAR_DIAMETER / 2} H${spouseX + (NODE_CONTENT_WIDTH - NODE_AVATAR_DIAMETER)/2}`,
                type: 'spouse',
            });
            currentXInLevel = spouseX + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      });
    });
    
    const minX = Math.min(0, ...newNodes.map(n => n.x));
    if (minX < HORIZONTAL_SPACING && newNodes.length > 0) { 
        const shift = HORIZONTAL_SPACING - minX;
        newNodes.forEach(n => n.x += shift); 
        overallMaxX += shift;
    }

    newNodes.forEach(node => {
      const parentIdStr = String(node.parentId); // Ensure string for map lookup
      if (node.parentId && processedNodesMap[parentIdStr]) {
        const parentNode = processedNodesMap[parentIdStr];
        let startX = parentNode.x + NODE_CONTENT_WIDTH / 2;
        const startY = parentNode.y + NODE_TOTAL_HEIGHT; 

        const spouseIdStr = String(parentNode.spouseId); // Ensure string for map lookup
        if (parentNode.spouseId && processedNodesMap[spouseIdStr]) {
          const spouseNode = processedNodesMap[spouseIdStr];
          startX = (Math.min(parentNode.x, spouseNode.x) + Math.max(parentNode.x, spouseNode.x) + NODE_CONTENT_WIDTH) / 2;
        }
        const endX = node.x + NODE_CONTENT_WIDTH / 2;
        const endY = node.y; 
        newEdges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) + 5} C${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) + 5 + VERTICAL_SPACING / 2} ${endX},${endY - VERTICAL_SPACING / 2} ${endX},${endY}`,
          type: 'parent-child',
        });
      }
    });

    console.log(`FamilyTreeDisplay: Layout calculated. Nodes: ${newNodes.length}, Edges: ${newEdges.length}, Width: ${overallMaxX}, Height: ${overallMaxY}`);
    if (newNodes.length === 0 && tree.members.length > 0) {
        console.error("FamilyTreeDisplay: Layout resulted in 0 nodes, but tree has members. Check layout algorithm, data processing (generations, parentIds), and potential errors in member data (e.g., duplicate IDs, non-string IDs).");
    }
    setLayout({ nodes: newNodes, edges: newEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });
  }, [tree]); // This effect depends only on the 'tree' state (which updates if initialTree prop changes)

  const handleNodeClick = (memberId: string) => setSelectedMemberId(prevId => prevId === memberId ? null : String(memberId));
  
  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => {
    setAddingRelationshipInfo({ targetMemberId: targetMemberId ? String(targetMemberId) : null, relationshipType });
    setAddMemberDialogOpen(true);
  };

  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDataObj = new FormData(e.currentTarget);
    const name = formDataObj.get('name') as string;
    const gender = formDataObj.get('gender') as string;
    const birthYear = formDataObj.get('birthYear') as string;
    let relationshipInput = formDataObj.get('relationship') as string;
    const notes = formDataObj.get('notes') as string;


    if (!name) { toast.error("Name is required."); return; }

    let newMemberParentId: string | undefined = undefined;
    let newMemberGeneration: number = 0;
    const targetMember = addingRelationshipInfo?.targetMemberId ? tree.members.find(m => String(m.id) === String(addingRelationshipInfo.targetMemberId)) : null;

    if (targetMember) {
      const targetGen = targetMember.generation ?? 0;
      switch (addingRelationshipInfo?.relationshipType) {
        case 'child':
          newMemberParentId = String(targetMember.id); newMemberGeneration = targetGen + 1;
          relationshipInput = gender === 'male' ? 'Son' : gender === 'female' ? 'Daughter' : 'Child';
          break;
        case 'spouse':
          newMemberGeneration = targetGen; relationshipInput = 'Spouse';
          break;
        // Add 'parent' case if needed, it's more complex for linking.
      }
    } else { // Generic add, if no target
        newMemberGeneration = 0; // Or some other default
        if (!relationshipInput) relationshipInput = "Relative";
    }

    const newMember: FamilyMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      name,
      relationship: relationshipInput,
      birthYear: birthYear || undefined, gender: gender as any,
      generation: newMemberGeneration, isElder: false, status: 'living',
      parentId: newMemberParentId,
      notes: notes || undefined,
    };
    
    const updatedMembers = [...tree.members, newMember];
    const updatedTree = { ...tree, members: updatedMembers };
    
    if (onTreeUpdate) {
        onTreeUpdate(updatedTree); // Propagate to parent, parent will update prop, triggering re-layout
    } else {
        setTree(updatedTree); // Fallback for standalone use, directly re-layouts
    }

    toast.success(`Added ${name}.`);
    setAddMemberDialogOpen(false);
    setAddingRelationshipInfo(null);
  };
  
  const getOrdinal = (gen?: number): string => {
    if (gen === undefined) return "";
    if (gen === 0) return " (Proband/Self)";
    const s = ["th", "st", "nd", "rd"];
    const v = Math.abs(gen) % 100;
    const prefix = gen < 0 ? "Ancestor Gen" : "Descendant Gen";
    return ` (${prefix} ${Math.abs(gen)}${s[(v - 20) % 10] || s[v] || s[0]})`;
  };

  // Updated loading/empty states
  if (!initialTree || !initialTree.members) {
    return <div className="w-full h-full flex items-center justify-center p-10 text-center text-muted-foreground">Tree data is not available or missing members array.</div>;
  }
  if (initialTree.members.length === 0) {
     return (
      <div className="w-full h-full flex items-center justify-center p-10 text-center text-muted-foreground">
        No members in this tree yet. Add members to begin.
      </div>
    );
  }
  // Check if layout calculation is done but resulted in no nodes, while initial data had members.
  if (layout.nodes.length === 0 && initialTree.members.length > 0 && tree.members.length > 0) {
    return <div className="w-full h-full flex items-center justify-center p-10 text-center text-muted-foreground">Calculating tree layout or an issue occurred (e.g., all members filtered out, inconsistent data). Check console for errors.</div>;
  }
   // If layout is empty for any other reason (e.g. initial state before first calculation with data)
  if (layout.nodes.length === 0) {
    return <div className="w-full h-full flex items-center justify-center p-10 text-center text-muted-foreground">Preparing tree display...</div>;
  }


  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layout.width}px`, // This div is scaled by parent's zoom controls
          height: `${layout.height}px`,
          transform: `scale(${zoomLevel})`, // Applying zoomLevel prop here now
          transformOrigin: 'top left',       // Common for tree layouts
          transition: 'transform 0.3s ease', // Smooth zoom transition
        }}
      >
        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <g>
            {layout.edges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                stroke={edge.type === 'spouse' ? 'var(--uganda-yellow, hsl(48,96%,59%))' : 'hsl(var(--border))'} // Fallback for CSS var
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
                            transition-all duration-200 ease-in-out bg-card text-card-foreground hover:shadow-xl`}
                style={{ 
                    left: `${node.x}px`, top: `${node.y}px`,
                    width: `${NODE_CONTENT_WIDTH}px`, height: `${NODE_TOTAL_HEIGHT}px`,
                    borderColor: selectedMemberId === String(node.id) ? 'var(--uganda-red, hsl(0,72%,51%))' : 'hsl(var(--border))', 
                    boxShadow: selectedMemberId === String(node.id) ? '0 0 0 3px var(--uganda-red, hsl(0,72%,51%))' : undefined,
                }}
                onClick={() => handleNodeClick(String(node.id))}
              >
                <div className={`rounded-full flex items-center justify-center mb-1 overflow-hidden
                                border-2 ${selectedMemberId === String(node.id) ? 'border-uganda-red' : 'border-muted-foreground/20'}`}
                      style={{ width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER, backgroundColor: 'hsl(var(--muted))' }}>
                  {node.photoUrl ? (
                    <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                  ) : (
                    <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.65} className="text-muted-foreground/70" />
                  )}
                </div>
                <div className="text-center w-full px-1">
                  <p className="font-semibold text-xs truncate" title={node.name || "Unnamed"}>
                    {node.name || "Unnamed"} {node.isElder && "👑"}
                  </p>
                  {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                    <p className="text-[10px] text-muted-foreground">
                      {node.birthYear || "..."}{node.deathYear ? ` - ${node.deathYear}` : (node.status === 'deceased' ? " ✝" : "")}
                    </p>
                  )}
                </div>
                 <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Child" onClick={e => { e.stopPropagation(); handleAddMemberClick(String(node.id), 'child');}}><UserPlus size={10}/></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Spouse" onClick={e => { e.stopPropagation(); handleAddMemberClick(String(node.id), 'spouse');}}><Link2 size={10}/></Button>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl border-popover-border bg-popover text-popover-foreground">
              <h4 className="font-bold text-sm mb-1.5">{node.name || "Unnamed"}</h4>
              {node.relationship && <p><strong className="font-medium">Relationship:</strong> {node.relationship}</p>}
              {node.birthYear && <p><strong className="font-medium">Born:</strong> {node.birthYear}</p>}
              {node.deathYear && <p><strong className="font-medium">Died:</strong> {node.deathYear}</p>}
              <p><strong className="font-medium">Status:</strong> {node.status || "Unknown"}</p>
              {node.gender && <p><strong className="font-medium">Gender:</strong> {node.gender}</p>}
              <p><strong className="font-medium">Generation:</strong> {node.generation}{getOrdinal(node.generation)}</p>
              {node.side && <p><strong className="font-medium">Side:</strong> {node.side}</p>}
              {node.notes && <p className="mt-1 pt-1 border-t border-dashed text-[10px] italic">Notes: {node.notes}</p>}
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
      <Dialog open={addMemberDialogOpen} onOpenChange={(open) => { if(!open) setAddingRelationshipInfo(null); setAddMemberDialogOpen(open);}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Add Family Member
              {addingRelationshipInfo?.targetMemberId && tree.members.find(m=> String(m.id) === String(addingRelationshipInfo.targetMemberId)) &&
                <span className="text-sm font-normal"> (as {addingRelationshipInfo.relationshipType} to {tree.members.find(m=> String(m.id) === String(addingRelationshipInfo.targetMemberId))?.name})</span>
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitNewMember}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input id="name" name="name" placeholder="Full name" required />
              </div>
              {!addingRelationshipInfo?.relationshipType && ( // Only show if not contextual (e.g. generic add button)
                 <div className="grid gap-2">
                    <label htmlFor="relationship" className="text-sm font-medium">Relationship</label>
                    <Input id="relationship" name="relationship" placeholder="e.g., Cousin, Aunt" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="gender" className="text-sm font-medium">Gender</label>
                  <select id="gender" name="gender" defaultValue="male" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="male">Male</option> <option value="female">Female</option> <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="birthYear" className="text-sm font-medium">Birth Year</label>
                  <Input id="birthYear" name="birthYear" type="number" placeholder="e.g., 1980" />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
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
