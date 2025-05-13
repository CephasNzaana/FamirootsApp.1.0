// src/components/FamilyTreeDisplay.tsx

import React, { useState, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, UserCircle2, UserPlus, Link2, GitMerge } from "lucide-react"; // Added GitMerge for couple line
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

// Constants for layout
const NODE_CONTENT_WIDTH = 160; 
const NODE_AVATAR_DIAMETER = 56;
const NODE_TOTAL_HEIGHT = NODE_AVATAR_DIAMETER + 44; 
const HORIZONTAL_SPACING = 40; // Space between sibling nodes or unrelated nodes on same level
const VERTICAL_SPACING = 70;   // Space between generations
const SPOUSE_HORIZONTAL_OFFSET = NODE_CONTENT_WIDTH + 20; // How far spouse is to the side
const COUPLE_LINE_Y_OFFSET = NODE_AVATAR_DIAMETER / 2; // Y position for the couple connector line

interface TreeNode extends FamilyMember {
  x: number;
  y: number;
  childrenIds: string[];
  spouseId?: string; // ID of the spouse node
  // For drawing:
  spouseNodeX?: number; // X-coordinate of the spouse if present and drawn
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse';
  isMarriageLine?: boolean; // Specific for couple connector
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
    console.log("FamilyTreeDisplay: initialTree prop received/updated", JSON.parse(JSON.stringify(initialTree)));
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
        if (!member || !member.id) return 0;
        if (visited.has(member.id)) { console.warn("getNumericGenerationSafe: Cycle for ID:", member.id); return 0; }
        visited.add(member.id);
        const gen = member.generation;
        if (typeof gen === 'number' && !isNaN(gen)) return gen;
        const parentId = member.parentId ? String(member.parentId) : undefined;
        if (parentId && membersById[parentId]) return getNumericGenerationSafe(membersById[parentId], new Set(visited)) + 1;
        return 0; 
    };

    const membersWithProcessedGen = tree.members.filter(m => m && m.id).map(member => ({
        ...member,
        name: member.name || "Unnamed",
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
    const processedNodesMap: { [id: string]: TreeNode } = {}; // Map string ID to TreeNode
    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    if (generationLevels.length === 0 && membersWithProcessedGen.length > 0) {
        console.warn("FamilyTreeDisplay: No generation levels found. Placing all in gen 0.");
        membersByGeneration[0] = [...membersWithProcessedGen];
        generationLevels.push(0);
    }

    // First pass: Position nodes and identify spouses to adjust layout
    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_TOTAL_HEIGHT + VERTICAL_SPACING) + VERTICAL_SPACING; 
      overallMaxY = Math.max(overallMaxY, y + NODE_TOTAL_HEIGHT);
      let currentXInLevel = HORIZONTAL_SPACING;

      const levelMembers = membersByGeneration[gen] || [];
      levelMembers.sort((a, b) => { /* ... (existing sort logic by parentId then birthYear) ... */ 
        const parentA = String(a.parentId || "z_fallback"); 
        const parentB = String(b.parentId || "z_fallback"); 
        const birthYearA = String(a.birthYear || "9999");   
        const birthYearB = String(b.birthYear || "9999");  
        const parentCompare = parentA.localeCompare(parentB);
        if (parentCompare !== 0) return parentCompare;
        return birthYearA.localeCompare(birthYearB);
      });

      const membersInThisLevelProcessed: TreeNode[] = [];

      levelMembers.forEach((memberData) => {
        if (processedNodesMap[String(memberData.id)]) return; // Already processed as a spouse

        let x = currentXInLevel;
        const parentNode = memberData.parentId ? processedNodesMap[String(memberData.parentId)] : null;

        if (parentNode) {
            const childrenOfParent = membersWithProcessedGen.filter(m => String(m.parentId) === String(memberData.parentId));
            const siblingIndex = childrenOfParent.findIndex(c => c.id === memberData.id);
            const numSiblings = childrenOfParent.length;
            let parentCenterX = parentNode.x + NODE_CONTENT_WIDTH / 2;

            if (parentNode.spouseId && processedNodesMap[String(parentNode.spouseId)]) {
                const spouseOfParent = processedNodesMap[String(parentNode.spouseId)];
                parentCenterX = (parentNode.x + spouseOfParent.x + NODE_CONTENT_WIDTH) / 2; // Midpoint of parent couple unit
            }
            
            const childrenBlockWidth = numSiblings * NODE_CONTENT_WIDTH + Math.max(0, numSiblings - 1) * HORIZONTAL_SPACING;
            const firstChildX = parentCenterX - childrenBlockWidth / 2;
            x = firstChildX + siblingIndex * (NODE_CONTENT_WIDTH + HORIZONTAL_SPACING);
        }
        x = Math.max(x, currentXInLevel); // Ensure no overlap with previous node on this level
        
        const typedMember = memberData as FamilyMember; // Cast to use all fields
        const childrenIds = membersWithProcessedGen.filter(m => String(m.parentId) === String(typedMember.id)).map(c => String(c.id));
        
        const node: TreeNode = { 
            ...typedMember, 
            name: typedMember.name || "Unnamed", 
            x, y, childrenIds, 
            spouseId: undefined // To be filled
        };
        
        // Simplistic spouse detection for layout (assuming spouseId might be set from client-side transform or here)
        // Your client-side transform in Home.tsx does not explicitly set spouseId on members yet.
        // This logic is a placeholder; true spouse linking needs data.
        let spouseNodeForLayout: TreeNode | undefined = undefined;
        if (!node.spouseId) { // Try to find a spouse if not already linked by data
            const potentialSpouseData = levelMembers.find(p => 
                p.id !== typedMember.id && 
                !processedNodesMap[String(p.id)] && // Not already processed
                (p.relationship?.toLowerCase().includes("spouse") || typedMember.relationship?.toLowerCase().includes("spouse")) // Basic check
            );
            if (potentialSpouseData) {
                node.spouseId = String(potentialSpouseData.id);
            }
        }

        if (node.spouseId && !processedNodesMap[node.spouseId]) {
            const spouseData = membersById[node.spouseId];
            if (spouseData) {
                const spouseX = x + SPOUSE_HORIZONTAL_OFFSET;
                spouseNodeForLayout = {
                    ...(spouseData as FamilyMember),
                    name: spouseData.name || "Unnamed Spouse",
                    x: spouseX, y,
                    childrenIds: membersWithProcessedGen.filter(m => String(m.parentId) === String(spouseData.id)).map(c => String(c.id)),
                    spouseId: node.id // Link back
                };
                processedNodesMap[String(spouseData.id)] = spouseNodeForLayout;
                membersInThisLevelProcessed.push(spouseNodeForLayout);
                node.spouseNodeX = spouseX; // Store for line drawing
                currentXInLevel = spouseX + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
            } else {
                 node.spouseId = undefined; // Spouse not found in membersById
            }
        } else {
            currentXInLevel = x + NODE_CONTENT_WIDTH + HORIZONTAL_SPACING;
        }
        
        processedNodesMap[String(typedMember.id)] = node;
        membersInThisLevelProcessed.push(node);
        overallMaxX = Math.max(overallMaxX, currentXInLevel);
      });
      newNodes.push(...membersInThisLevelProcessed);
    });
    
    const minX = Math.min(0, ...newNodes.map(n => n.x));
    if (minX < HORIZONTAL_SPACING && newNodes.length > 0) { 
        const shift = HORIZONTAL_SPACING - minX;
        newNodes.forEach(n => n.x += shift); 
        overallMaxX += shift;
    }

    // Second pass: Create Edges
    newNodes.forEach(node => {
      // Parent-child edges
      const parentIdStr = String(node.parentId);
      if (node.parentId && processedNodesMap[parentIdStr]) {
        const parentNode = processedNodesMap[parentIdStr];
        let startX = parentNode.x + NODE_CONTENT_WIDTH / 2;
        const startY = parentNode.y + NODE_TOTAL_HEIGHT; 

        // If parent has a spouse, child line comes from midpoint of couple line
        if (parentNode.spouseId && processedNodesMap[String(parentNode.spouseId)]) {
          const spouseNode = processedNodesMap[String(parentNode.spouseId)];
          // Ensure parentNode is the one on the left for consistent mid-point calc
          const p1 = parentNode.x < spouseNode.x ? parentNode : spouseNode;
          const p2 = parentNode.x < spouseNode.x ? spouseNode : parentNode;
          startX = p1.x + NODE_CONTENT_WIDTH + (SPOUSE_HORIZONTAL_OFFSET - NODE_CONTENT_WIDTH) / 2;
        }
        const endX = node.x + NODE_CONTENT_WIDTH / 2;
        const endY = node.y; 
        newEdges.push({
          id: `pc-${parentNode.id}-${node.id}`,
          path: `M${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) + 5} C${startX},${startY - (NODE_TOTAL_HEIGHT - NODE_AVATAR_DIAMETER) + 5 + VERTICAL_SPACING / 2} ${endX},${endY - VERTICAL_SPACING / 2} ${endX},${endY}`,
          type: 'parent-child',
        });
      }
      // Spouse edges (Horizontal line between couple)
      if (node.spouseId && processedNodesMap[String(node.spouseId)] && node.spouseNodeX) {
        const spouseNode = processedNodesMap[String(node.spouseId)];
        // Draw only once per couple (e.g., if current node is to the left of spouse)
        if (node.x < spouseNode.x) {
            newEdges.push({
                id: `spouse-${node.id}-${node.spouseId}`,
                path: `M${node.x + NODE_CONTENT_WIDTH},${node.y + COUPLE_LINE_Y_OFFSET} H${spouseNode.x}`,
                type: 'spouse',
                isMarriageLine: true,
            });
        }
      }
    });

    console.log(`FamilyTreeDisplay: Layout calculated. Nodes: ${newNodes.length}, Edges: ${newEdges.length}, Width: ${overallMaxX}, Height: ${overallMaxY}`);
    setLayout({ nodes: newNodes, edges: newEdges, width: Math.max(overallMaxX, 600), height: Math.max(overallMaxY, 400) });
  }, [tree]);

  // ... (handleNodeClick, handleAddMemberClick, onSubmitNewMember, getOrdinal functions remain same as last provided Home.tsx) ...
  // Ensure they use String(id) for comparisons and map lookups if IDs could be numbers.

  const handleNodeClick = (memberId: string) => setSelectedMemberId(prevId => prevId === memberId ? null : String(memberId));
  const handleAddMemberClick = (targetMemberId: string | null = null, relationshipType: string = "child") => { /* ... */ };
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => { /* ... */ };
  const getOrdinal = (gen?: number): string => { /* ... */ };


  if (!initialTree || !initialTree.members) { /* ... */ }
  if (initialTree.members.length === 0) { /* ... */ }
  if (layout.nodes.length === 0 && initialTree.members.length > 0 && tree.members.length > 0) { /* ... */ }
  if (layout.nodes.length === 0) { /* ... */ }

  return (
    <>
      <div
        className="relative" 
        style={{
          width: `${layout.width}px`, height: `${layout.height}px`,
          transform: `scale(${zoomLevel})`, transformOrigin: 'top left',
          transition: 'transform 0.3s ease',
          // Background pattern for better visualization
          backgroundImage: 'radial-gradient(hsl(var(--border)/0.2) 1px, transparent 1px)',
          backgroundSize: '15px 15px',
        }}
      >
        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowhead-child" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
            </marker>
          </defs>
          <g>
            {layout.edges.map(edge => (
              <path
                key={edge.id} d={edge.path}
                stroke={edge.isMarriageLine ? 'var(--uganda-red, #DC2626)' : 'hsl(var(--border))'}
                strokeWidth={edge.isMarriageLine ? "2.5" : "1.5"}
                fill="none"
                markerEnd={edge.type === 'parent-child' ? "url(#arrowhead-child)" : "none"}
              />
            ))}
          </g>
        </svg>

        {layout.nodes.map((node) => {
          const isSelected = selectedMemberId === String(node.id);
          const isMainPerson = node.relationship === "Self" || node.relationship === "Proband"; // Example
          let nodeBorderColor = 'hsl(var(--border))';
          if (isSelected) nodeBorderColor = 'var(--uganda-red, #DC2626)';
          else if (node.isElder) nodeBorderColor = 'var(--uganda-yellow, #FACC15)';
          else if (isMainPerson) nodeBorderColor = 'hsl(var(--primary))';
          
          let nodeBgColor = 'hsl(var(--card))';
          if (node.gender === 'female') nodeBgColor = 'hsl(var(--uganda-red)/0.05)'; // Subtle pink/red tint for female
          else if (node.gender === 'male') nodeBgColor = 'hsl(var(--primary)/0.05)'; // Subtle blue/primary tint for male


          return (
            <HoverCard key={node.id} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div
                  id={`member-${node.id}`}
                  className={`absolute flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer shadow-lg group
                              transition-all duration-200 ease-in-out text-card-foreground hover:shadow-xl`}
                  style={{ 
                      left: `${node.x}px`, top: `${node.y}px`,
                      width: `${NODE_CONTENT_WIDTH}px`, height: `${NODE_TOTAL_HEIGHT}px`,
                      backgroundColor: nodeBgColor, 
                      borderColor: nodeBorderColor,
                      boxShadow: isSelected ? `0 0 0 3px ${nodeBorderColor}, var(--shadow-lg)` : 'var(--shadow-md)',
                  }}
                  onClick={() => handleNodeClick(String(node.id))}
                >
                  <div className={`rounded-full flex items-center justify-center mb-1 overflow-hidden border-2`}
                        style={{ 
                            width: NODE_AVATAR_DIAMETER, height: NODE_AVATAR_DIAMETER, 
                            backgroundColor: 'hsl(var(--muted))', 
                            borderColor: node.isElder ? 'var(--uganda-yellow, #FACC15)' : 'hsl(var(--muted-foreground)/0.2)'
                        }}>
                    {node.photoUrl ? (
                      <img src={node.photoUrl} alt={node.name || "Photo"} className="w-full h-full object-cover"/>
                    ) : (
                      <UserCircle2 size={NODE_AVATAR_DIAMETER * 0.65} 
                                   className={node.gender === 'female' ? 'text-uganda-red/70' : node.gender === 'male' ? 'text-primary/70' : 'text-muted-foreground/70'} />
                    )}
                  </div>
                  <div className="text-center w-full px-1">
                    <p className="font-semibold text-xs truncate" title={node.name || "Unnamed"}>
                      {node.name || "Unnamed"} {node.isElder && <Badge variant="destructive" className="ml-1 scale-75 origin-left p-0.5 px-1">Elder</Badge>}
                    </p>
                    {(node.birthYear || node.deathYear || node.status === 'deceased') && (
                      <p className="text-[10px] text-muted-foreground">
                        b. {node.birthYear || "..."}{node.deathYear ? ` d. ${node.deathYear}` : (node.status === 'deceased' ? " (dec.)" : "")}
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
                {/* ... HoverCard content same as before, ensure it uses node.name || "Unnamed" etc. ... */}
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
      <Dialog open={addMemberDialogOpen} onOpenChange={(open) => { if(!open) setAddingRelationshipInfo(null); setAddMemberDialogOpen(open);}}>
        {/* ... Dialog content same as before ... */}
      </Dialog>
    </>
  );
};
export default FamilyTreeDisplay;
