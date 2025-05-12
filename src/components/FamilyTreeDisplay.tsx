// In FamilyTreeDisplay.tsx

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
    console.log("FamilyTreeDisplay: initialTree prop updated", initialTree);
    setTree(initialTree);
  }, [initialTree]);

  useEffect(() => {
    console.log("FamilyTreeDisplay: Layout calculation triggered. Current tree:", tree);
    if (!tree || !tree.members || !Array.isArray(tree.members) || tree.members.length === 0) {
      console.log("FamilyTreeDisplay: No members to layout or tree invalid.");
      setLayout({ nodes: [], edges: [], width: 0, height: 0 });
      return;
    }

    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => { if(m && m.id) membersById[m.id] = m; }); 
    
    const getNumericGenerationSafe = (member?: FamilyMember, visited: Set<string> = new Set()): number => {
        if (!member || !member.id || visited.has(member.id)) {
            // console.warn("getNumericGenerationSafe: Cycle detected or invalid member for generation calculation", member?.id);
            return 0; 
        }
        visited.add(member.id);
        const gen = member.generation;
        if (typeof gen === 'number' && !isNaN(gen)) return gen;
        if (member.parentId && membersById[member.parentId]) {
            return getNumericGenerationSafe(membersById[member.parentId], new Set(visited)) + 1;
        }
        return 0; 
    };

    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({
        ...member,
        name: member.name || "Unnamed",
        generation: getNumericGenerationSafe(member, new Set()), // Ensure fresh visited set for each top-level call
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
    let overallMaxX = HORIZONTAL_SPACING; // Start with some padding
    let overallMaxY = VERTICAL_SPACING; // Start with some padding
    const processedNodesMap: { [id: string]: TreeNode } = {};
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    if (generationLevels.length === 0 && membersWithProcessedGen.length > 0) {
        console.warn("FamilyTreeDisplay: No generation levels but members exist. Check generation processing.");
        // Fallback: put all on one level if generation processing failed
        membersByGeneration[0] = [...membersWithProcessedGen];
        generationLevels.push(0);
    }


    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING) + VERTICAL_SPACING; // Add initial Y padding
      overallMaxY = Math.max(overallMaxY, y + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING;

      const levelMembers = membersByGeneration[gen] || [];
      // Sort to try and keep siblings together, and then by birth year as a secondary factor.
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
                const p1x = Math.min(parentNode.x, spouseOfParent.x);
                const p2x = Math.max(parentNode.x, spouseOfParent.x);
                parentCenterX = (p1x + p2x + NODE_CONTENT_WIDTH) / 2;
            }
            
            const childrenBlockWidth = numSiblings * NODE_CONTENT_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING;
            const firstChildX = parentCenterX - childrenBlockWidth / 2;
            x = firstChildX + siblingIndex * (NODE_CONTENT_WIDTH + HORIZONTAL_SPACING);
        }
        x = Math.max(x, currentXInLevel);
        
        const childrenIds = membersWithProcessedGen.filter(m => m.parentId === member.id).map(c => c.id);
        const node: TreeNode = { ...(member as FamilyMember), name: member.name || "Unnamed", x, y, childrenIds, spouseId: undefined };
        processedNodesMap[member.id] = node;
        newNodes.push(node);
        currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;

        const potentialSpouse = membersWithProcessedGen.find(p =>
            p.id !== member.id && !processedNodesMap[p.id] &&
            (p.generation === member.generation) &&
            ( (p.relationship?.toLowerCase().includes('spouse') && member.relationship?.toLowerCase().includes('spouse')) ||
              (childrenIds.length > 0 && membersWithProcessedGen.some(child => child.parentId === p.id && childrenIds.includes(child.id))) )
        );

        if (potentialSpouse) {
            const spouseX = x + SPOUSE_OFFSET_X;
            const spouseMember: TreeNode = { ...(potentialSpouse as FamilyMember), name: potentialSpouse.name || "Unnamed", x: spouseX, y, childrenIds: membersWithProcessedGen.filter(m => m.parentId === potentialSpouse.id).map(c => c.id) };
            processedNodesMap[potentialSpouse.id] = spouseMember;
            newNodes.push(spouseMember);
            node.spouseId = spouseMember.id;
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
    if (minX < HORIZONTAL_SPACING) { // Ensure there's at least HORIZONTAL_SPACING padding on the left
        const shift = HORIZONTAL_SPACING - minX;
        newNodes.forEach(n => n.x += shift); 
        overallMaxX += shift;
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
          path: `M${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) + 5} C${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) + 5 + VERTICAL_SPACING / 2} ${endX},${endY - VERTICAL_SPACING / 2} ${endX},${endY}`,
          type: 'parent-child',
        });
      }
    });

    console.log(`FamilyTreeDisplay: Layout calculated. Nodes: ${newNodes.length}, Edges: ${newEdges.length}, Width: ${overallMaxX}, Height: ${overallMaxY}`);
    if (newNodes.length === 0 && tree.members.length > 0) {
        console.error("FamilyTreeDisplay: Layout resulted in 0 nodes, but tree has members. Check layout algorithm and data processing.");
    }
    setLayout({ nodes: newNodes, edges: newEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });
  }, [tree]); // This effect depends only on the 'tree' state

  const handleNodeClick = (memberId: string) => setSelectedMemberId(prevId => prevId === memberId ? null : memberId);
  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => { /* ... as before ... */ };
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => { /* ... as before, ensuring onTreeUpdate is called ... */ };
  const getOrdinal = (gen?: number): string => { /* ... as before ... */ };

  // Updated loading/empty states
  if (!initialTree || !initialTree.members) {
    return <div className="p-10 text-center text-muted-foreground">Tree data is not available.</div>;
  }
  if (initialTree.members.length === 0) {
     return (
      <div className="p-10 text-center text-muted-foreground">
        No members in this tree yet. Add members to begin.
      </div>
    );
  }
  if (layout.nodes.length === 0 && initialTree.members.length > 0) {
    return <div className="p-10 text-center text-muted-foreground">Calculating tree layout or issue with data... Check console.</div>;
  }
  if (layout.nodes.length === 0) { // General fallback if layout is empty for any other reason
    return <div className="p-10 text-center text-muted-foreground">No tree to display.</div>;
  }

  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          // Zoom is applied by FamilyTreeMultiView's wrapper div for this component
        }}
      >
        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          {/* ... edges rendering ... */}
        </svg>
        {layout.nodes.map((node) => (
          <HoverCard key={node.id} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div
                id={`member-${node.id}`}
                className={`absolute flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer shadow group
                            transition-all duration-200 ease-in-out bg-card text-card-foreground`}
                style={{ /* ... styles as before using NODE_CONTENT_WIDTH, NODE_TOTAL_HEIGHT, NODE_AVATAR_DIAMETER ... */ 
                    left: `${node.x}px`, top: `${node.y}px`,
                    width: `${NODE_CONTENT_WIDTH}px`, height: `${NODE_TOTAL_HEIGHT}px`,
                    borderColor: selectedMemberId === node.id ? 'var(--uganda-red)' : 'hsl(var(--border))', // Use CSS var for uganda-red if defined
                    boxShadow: selectedMemberId === node.id ? '0 0 0 3px var(--uganda-red)' : 'var(--shadow-md)', // Or a Shadcn shadow class
                }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={`rounded-full flex items-center justify-center mb-1 overflow-hidden
                                border-2 ${selectedMemberId === node.id ? 'border-uganda-red' : 'border-muted-foreground/20'}`} // Use CSS var
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
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Child" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'child');}}><UserPlus size={10}/></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground" title="Add Spouse" onClick={e => { e.stopPropagation(); handleAddMemberClick(node.id, 'spouse');}}><Link2 size={10}/></Button>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-60 text-xs p-3 space-y-1 shadow-xl border-popover-border bg-popover text-popover-foreground">
              {/* ... HoverCard content as before, ensure all fields from 'node' are used and 'Unnamed' or 'N/A' for missing data ... */}
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
        {/* ... Dialog content as before ... */}
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
