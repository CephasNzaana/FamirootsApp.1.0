import React, { useState, useRef, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
// ... other imports (Button, Dialog, Icons, HoverCard, Badge, Input, Textarea, toast)
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2 } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";


// Constants for layout
const NODE_CONTENT_WIDTH = 160; // Width for the node content area
const NODE_AVATAR_DIAMETER = 56;
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + 44; // Avatar + text area + padding
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 60;
const SPOUSE_OFFSET_X = NODE_CONTENT_WIDTH + 10; // Spouse positioned slightly to the side

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
  zoomLevel: number; // Controlled by parent
  onTreeUpdate?: (updatedTree: FamilyTree) => void;
}

const FamilyTreeDisplay = ({ tree: initialTree, zoomLevel, onTreeUpdate }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);

  const [layout, setLayout] = useState<{ nodes: TreeNode[], edges: Edge[], width: number, height: number }>({ nodes: [], edges: [], width: 0, height: 0 });

  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  useEffect(() => {
    // Ensure tree and tree.members are valid before proceeding
    if (!tree || !tree.members || tree.members.length === 0) {
      setLayout({ nodes: [], edges: [], width: 0, height: 0 });
      return;
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if(m && m.id) membersById[m.id] = m; }); // Ensure m and m.id exist
    
    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => {
        if (!member || !member.id || visited.has(member.id)) return 0; 
        visited.add(member.id);
        const gen = member.generation;
        if (typeof gen === 'number' && !isNaN(gen)) return gen;
        if (member.parentId && membersById[member.parentId]) {
            return getNumericGenerationSafe(membersById[member.parentId], new Set(visited)) + 1; // Pass copy of visited set
        }
        return 0; 
    };

    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({ // Filter out invalid members
        ...member,
        name: member.name || "Unnamed", // Ensure name exists
        generation: getNumericGenerationSafe(member),
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

    // Simplified layout logic (remains complex to perfect)
    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING);
      overallMaxY = Math.max(overallMaxY, y + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING; // Start with some padding

      const levelMembers = membersByGeneration[gen] || [];
      levelMembers.sort((a,b) => (a.parentId || "z").localeCompare(b.parentId || "z") || (a.birthYear || "9999").localeCompare(b.birthYear || "9999") );


      levelMembers.forEach((member) => {
        if (processedNodesMap[member.id]) return;

        let x = currentXInLevel;
        const parentNode = member.parentId ? processedNodesMap[member.parentId] : null;

        if (parentNode) {
            const childrenOfParent = membersWithProcessedGen.filter(m => m.parentId === member.parentId);
            const siblingIndex = childrenOfParent.findIndex(c => c.id === member.id);
            const numSiblings = childrenOfParent.length;
            let parentCenterX = parentNode.x + NODE_CONTENT_WIDTH / 2;

            if (parentNode.spouseId && processedNodesMap[parentNode.spouseId]) {
                const spouseOfParent = processedNodesMap[parentNode.spouseId];
                // Ensure spouse is to the right of parent for consistent centering
                const p1x = Math.min(parentNode.x, spouseOfParent.x);
                const p2x = Math.max(parentNode.x, spouseOfParent.x);
                parentCenterX = (p1x + p2x + NODE_CONTENT_WIDTH) / 2;
            }
            
            const childrenBlockWidth = numSiblings * NODE_CONTENT_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING;
            const firstChildX = parentCenterX - childrenBlockWidth / 2;
            x = firstChildX + siblingIndex * (NODE_CONTENT_WIDTH + HORIZONTAL_SPACING);
        }
        x = Math.max(x, currentXInLevel); // Avoid overlap with previously placed node on the same level
        
        const childrenIds = membersWithProcessedGen.filter(m => m.parentId === member.id).map(c => c.id);
        const node: TreeNode = { ...(member as FamilyMember), x, y, childrenIds, spouseId: undefined };
        processedNodesMap[member.id] = node;
        newNodes.push(node);
        currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;

        const potentialSpouse = membersWithProcessedGen.find(p =>
            p.id !== member.id && !processedNodesMap[p.id] &&
            (p.generation === member.generation) &&
            ( (p.relationship?.toLowerCase().includes('spouse') && member.relationship?.toLowerCase().includes('spouse')) || // Explicit
              (childrenIds.length > 0 && membersWithProcessedGen.some(child => child.parentId === p.id && childrenIds.includes(child.id))) || // Shared children
              (member.relationship?.toLowerCase().includes('spouse') && p.parentId === member.parentId && p.gender !== member.gender) // Simple heuristic for spouses if one is marked as spouse
            )
        );

        if (potentialSpouse) {
            const spouseX = x + SPOUSE_OFFSET_X;
            const spouseMember: TreeNode = { ...(potentialSpouse as FamilyMember), x: spouseX, y, childrenIds: membersWithProcessedGen.filter(m => m.parentId === potentialSpouse.id).map(c => c.id) };
            processedNodesMap[potentialSpouse.id] = spouseMember;
            newNodes.push(spouseMember); // Add spouse to nodes list
            node.spouseId = spouseMember.id; // Link them in the node data

            newEdges.push({
                id: `spouse-${member.id}-${potentialSpouse.id}`,
                // Line between centers of avatars
                path: `M${x + NODE_CONTENT_WIDTH/2},${y + NODE_AVATAR_DIAMETER / 2} H${spouseX + NODE_CONTENT_WIDTH/2 - (NODE_CONTENT_WIDTH/2 - NODE_AVATAR_DIAMETER/2) }`,
                type: 'spouse',
            });
            currentXInLevel = spouseX + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
        }
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      });
    });
    
    // Shift entire tree to ensure no negative X coordinates if any
    const minX = Math.min(0, ...newNodes.map(n => n.x));
    if (minX < 0) {
        newNodes.forEach(n => n.x -= minX - HORIZONTAL_SPACING); // Add some padding too
        overallMaxX -= minX - HORIZONTAL_SPACING;
    }


    newNodes.forEach(node => {
      if (node.parentId && processedNodesMap[node.parentId]) {
        const parentNode = processedNodesMap[node.parentId];
        let startX = parentNode.x + NODE_CONTENT_WIDTH / 2;
        const startY = parentNode.y + NODE_TOTAL_HEIGHT; 

        if (parentNode.spouseId && processedNodesMap[parentNode.spouseId]) {
          const spouseNode = processedNodesMap[parentNode.spouseId];
          startX = (Math.min(parentNode.x, spouseNode.x) + Math.max(parentNode.x, spouseNode.x) + NODE_CONTENT_WIDTH) / 2;
        }
        const endX = node.x + NODE_CONTENT_WIDTH / 2;
        const endY = node.y; 
        newEdges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER - (NODE_AVATAR_DIAMETER/3)) } C${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER - (NODE_AVATAR_DIAMETER/3)) + VERTICAL_SPACING / 2} ${endX},${endY - VERTICAL_SPACING / 2} ${endX},${endY}`,
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
    // setTree(updatedTree); // This will be handled by prop update from parent if onTreeUpdate is used correctly
    if (onTreeUpdate) {
        onTreeUpdate(updatedTree);
    } else {
        setTree(updatedTree); // Fallback if no callback, for standalone use
    }

    toast.success(`Added ${name}.`);
    setAddMemberDialogOpen(false);
    setAddingRelationshipInfo(null);
  };
  
  const getOrdinal = (gen?: number): string => {
    if (gen === undefined) return "";
    if (gen === 0) return " (Proband)";
    const s = ["th", "st", "nd", "rd"];
    const v = Math.abs(gen) % 100;
    const prefix = gen < 0 ? "Ancestor Gen" : "Descendant Gen";
    return ` (${prefix} ${Math.abs(gen)}${s[(v - 20) % 10] || s[v] || s[0]})`;
  };


  if (!layout.nodes.length && initialTree.members.length > 0) {
    return <div className="p-10 text-center text-muted-foreground">Calculating tree layout...</div>;
  }
  if (initialTree.members.length === 0) {
     return (
      <div className="p-10 text-center text-muted-foreground">
        No members in this tree yet. Add members to begin.
      </div>
    );
  }


  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          // Zoom is applied by the parent (FamilyTreeMultiView) to the scrollable container
        }}
      >
        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <g>
            {layout.edges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                stroke={edge.type === 'spouse' ? 'var(--uganda-yellow)' : 'hsl(var(--border))'}
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
                className={`absolute flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer shadow group
                            transition-all duration-200 ease-in-out bg-card text-card-foreground`}
                style={{
                  left: `${node.x}px`, top: `${node.y}px`,
                  width: `${NODE_CONTENT_WIDTH}px`, height: `${NODE_TOTAL_HEIGHT}px`,
                  borderColor: selectedMemberId === node.id ? 'var(--uganda-red)' : 'hsl(var(--border))',
                  boxShadow: selectedMemberId === node.id ? '0 0 0 3px var(--uganda-red)' : 'var(--shadow-md)',
                }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={`rounded-full flex items-center justify-center mb-1 overflow-hidden
                                border-2 ${selectedMemberId === node.id ? 'border-uganda-red' : 'border-muted-foreground/20'}`}
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
                      {node.birthYear || "..."} - {node.deathYear || (node.status === 'deceased' ? "✝" : "")}
                    </p>
                  )}
                </div>
                 <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted" title="Add Child" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'child');}}><UserPlus size={10}/></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted" title="Add Spouse" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'spouse');}}><Link2 size={10}/></Button>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl border-popover-border bg-popover text-popover-foreground">
              <h4 className="font-bold text-sm mb-1.5">{node.name || "Unnamed"}</h4>
              {node.relationship && <p><strong className="font-medium">Rel:</strong> {node.relationship}</p>}
              {node.birthYear && <p><strong className="font-medium">Born:</strong> {node.birthYear}</p>}
              {node.deathYear && <p><strong className="font-medium">Died:</strong> {node.deathYear}</p>}
              <p><strong className="font-medium">Status:</strong> {node.status || "Unknown"}</p>
              {node.gender && <p><strong className="font-medium">Gender:</strong> {node.gender}</p>}
              <p><strong className="font-medium">Gen:</strong> {node.generation}{getOrdinal(node.generation)}</p>
              {/* Add other fields like notes, side if available in node object */}
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
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
