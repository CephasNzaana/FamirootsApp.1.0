import { useState, useRef, useEffect }  from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, Users, Plus, ZoomIn, ZoomOut, UserCircle2, UserPlus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

// Constants for layout
const NODE_WIDTH = 180; // Increased width for more details
const NODE_HEIGHT = 80; // Increased height
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 80;
const SPOUSE_OFFSET_X = NODE_WIDTH + 10; // How far to offset a spouse visually

interface TreeNode extends FamilyMember {
  x: number;
  y: number;
  childrenIds: string[];
  spouseId?: string; // Simple one spouse for now
}

interface Edge {
  id: string;
  path: string;
  type: 'parent-child' | 'spouse';
}

const FamilyTreeDisplay = ({ tree: initialTree }: FamilyTreeDisplayProps) => {
  const [tree, setTree] = useState<FamilyTree>(initialTree);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationshipInfo, setAddingRelationshipInfo] = useState<{ targetMemberId: string | null, relationshipType: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layout, setLayout] = useState<{ nodes: TreeNode[], edges: Edge[], width: number, height: number }>({ nodes: [], edges: [], width: 0, height: 0 });

  useEffect(() => {
    setTree(initialTree); // Update tree if prop changes
  }, [initialTree]);

  useEffect(() => {
    // Simplified Traditional Layout Algorithm
    if (!tree || tree.members.length === 0) {
      setLayout({ nodes: [], edges: [], width: 0, height: 0 });
      return;
    }

    const processedNodes: { [id: string]: TreeNode & { originalIndex: number, spouseProcessed?: boolean, levelX?: number } } = {};
    const membersById: Record<string, FamilyMember> = {};
    tree.members.forEach(m => membersById[m.id] = m);

    // 1. Group members by generation for initial Y positioning
    // Ensure generation is a number, default to 0 if not present or invalid
    const getNumericGeneration = (member: FamilyMember): number => {
        const gen = member.generation;
        if (typeof gen === 'number' && !isNaN(gen)) {
            return gen;
        }
        // Attempt to infer if parentId is present
        if (member.parentId && membersById[member.parentId]) {
            const parentGen = getNumericGeneration(membersById[member.parentId]);
            return parentGen + 1;
        }
        return 0; // Fallback
    };
    
    tree.members.forEach(member => {
        member.generation = getNumericGeneration(member);
    });


    const membersByGeneration: Record<number, FamilyMember[]> = {};
    tree.members.forEach((member, index) => {
      const gen = member.generation ?? 0;
      if (!membersByGeneration[gen]) {
        membersByGeneration[gen] = [];
      }
      membersByGeneration[gen].push({ ...member, originalIndex: index } as FamilyMember & { originalIndex: number });
    });

    const newNodes: TreeNode[] = [];
    const newEdges: Edge[] = [];
    let overallMaxX = 0;
    let overallMaxY = 0;

    const generationLevels = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

    generationLevels.forEach((gen, levelIndex) => {
      const y = levelIndex * (NODE_HEIGHT + VERTICAL_SPACING);
      overallMaxY = Math.max(overallMaxY, y + NODE_HEIGHT);
      let currentX = 0;

      // Crude attempt to place children under parents
      // This is very simplified and won't create a perfect tree.
      const membersInLevel = membersByGeneration[gen];

      membersInLevel.forEach((member) => {
        if (processedNodes[member.id]) return; // Already processed (e.g. as spouse)

        let x = currentX;
        const parentNode = member.parentId ? processedNodes[member.parentId] : null;
        if (parentNode) {
            // Try to center under parent, or align with parent's first child position
            const childrenOfParent = tree.members.filter(m => m.parentId === member.parentId);
            const siblingIndex = childrenOfParent.findIndex(c => c.id === member.id);
            if (siblingIndex !== -1) {
                 // Basic alignment under parent: parentX + (index - (count-1)/2) * spacing
                 x = parentNode.x + (siblingIndex - (childrenOfParent.length - 1) / 2.0) * (NODE_WIDTH + HORIZONTAL_SPACING);
            } else {
                x = parentNode.x; // Fallback
            }
            // Ensure no overlap with previous sibling on this level
            x = Math.max(x, currentX);
        }


        const childrenIds = tree.members.filter(m => m.parentId === member.id).map(c => c.id);
        
        // Simplistic spouse finding: assumes 'spouse' relationship or shared parentage by convention
        // This is highly dependent on data quality and structure
        let spouseNode: TreeNode | null = null;
        const potentialSpouse = tree.members.find(p =>
            p.id !== member.id &&
            (p.generation === member.generation || Math.abs((p.generation ?? 0) - (member.generation ?? 0)) <=1 ) && // roughly same gen
            ( (p.relationship?.toLowerCase().includes('spouse') && member.relationship?.toLowerCase().includes('spouse')) ||
              childrenIds.length > 0 && tree.members.filter(c => c.parentId === p.id && childrenIds.includes(c.id)).length > 0 ) &&
            !processedNodes[p.id] // not already processed
        );


        const node: TreeNode = {
          ...member,
          x: x,
          y: y,
          childrenIds: childrenIds,
          spouseId: undefined, // Will be set if spouse found
        };
        processedNodes[member.id] = {...node, originalIndex: (member as any).originalIndex, levelX: x};
        newNodes.push(node);
        currentX = x + NODE_WIDTH + HORIZONTAL_SPACING;

        if (potentialSpouse) {
            const spouseX = x + SPOUSE_OFFSET_X;
            const spouse: TreeNode = {
                ...potentialSpouse,
                x: spouseX,
                y: y,
                childrenIds: tree.members.filter(m => m.parentId === potentialSpouse.id).map(c => c.id),
                // Assume this spouse is linked to the current member
            };
            processedNodes[potentialSpouse.id] = {...spouse, originalIndex: (potentialSpouse as any).originalIndex, spouseProcessed: true, levelX: spouseX};
            newNodes.push(spouse);
            node.spouseId = spouse.id; // Link them

            newEdges.push({
                id: `spouse-${member.id}-${potentialSpouse.id}`,
                path: `M${x + NODE_WIDTH / 2},${y + NODE_HEIGHT / 2} H${spouseX + NODE_WIDTH / 2}`,
                type: 'spouse',
            });
            currentX = spouseX + NODE_WIDTH + HORIZONTAL_SPACING;
        }


        overallMaxX = Math.max(overallMaxX, currentX);
      });
    });
    
    // Post-process positions to reduce overlaps (very naive)
    // and ensure children are somewhat under parents
    newNodes.sort((a,b) => (a.generation ?? 0) - (b.generation ?? 0) || a.x - b.x); // process top-down

    for(let i = 0; i < newNodes.length; i++) {
        for(let j = i + 1; j < newNodes.length; j++) {
            const n1 = newNodes[i];
            const n2 = newNodes[j];
            if (n1.generation === n2.generation) {
                const requiredSpace = NODE_WIDTH + HORIZONTAL_SPACING;
                if (n2.x < n1.x + requiredSpace) {
                    n2.x = n1.x + requiredSpace;
                }
            }
        }
    }
    newNodes.forEach(node => {
         overallMaxX = Math.max(overallMaxX, node.x + NODE_WIDTH);
    });


    // Create edges
    newNodes.forEach(node => {
      // Parent-child edges
      if (node.parentId) {
        const parentNode = newNodes.find(p => p.id === node.parentId);
        if (parentNode) {
          let parentX = parentNode.x + NODE_WIDTH / 2;
          const parentY = parentNode.y + NODE_HEIGHT;

          // If parent has a spouse, the child line comes from midpoint of spouses
          if (parentNode.spouseId) {
            const spouse = newNodes.find(s => s.id === parentNode.spouseId);
            if (spouse) {
              parentX = (parentNode.x + spouse.x + NODE_WIDTH) / 2; // Midpoint between the two parents
            }
          }
          const childX = node.x + NODE_WIDTH / 2;
          const childY = node.y;
          newEdges.push({
            id: `pc-${node.parentId}-${node.id}`,
            path: `M${parentX},${parentY} C${parentX},${parentY + VERTICAL_SPACING / 2} ${childX},${childY - VERTICAL_SPACING / 2} ${childX},${childY}`,
            type: 'parent-child',
          });
        }
      }
    });

    setLayout({ nodes: newNodes, edges: newEdges, width: overallMaxX, height: overallMaxY });

  }, [tree]); // Re-calculate layout when tree data changes


  const handleNodeClick = (memberId: string) => {
    setSelectedMemberId(memberId);
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
    const notes = formData.get('notes') as string;
    let relationshipInput = formData.get('relationship') as string; // if specific relationship field is used

    if (!name) {
      toast.error("Name is required.");
      return;
    }

    let newMemberParentId: string | undefined = undefined;
    let newMemberGeneration: number = 0;
    const targetMember = addingRelationshipInfo?.targetMemberId ? tree.members.find(m => m.id === addingRelationshipInfo.targetMemberId) : null;

    if (targetMember) {
      const targetGen = targetMember.generation ?? 0;
      switch (addingRelationshipInfo?.relationshipType) {
        case 'child':
          newMemberParentId = targetMember.id;
          newMemberGeneration = targetGen + 1;
          relationshipInput = gender === 'male' ? 'son' : gender === 'female' ? 'daughter' : 'child';
          break;
        case 'parent': // Adding a parent to targetMember
          // This implies targetMember's parentId should be the new member. Tricky to update existing.
          // For now, new member is just a generation above. Actual linking might need more UI.
          newMemberGeneration = Math.max(0, targetGen - 1);
          relationshipInput = gender === 'male' ? 'father' : 'mother';
          // New member becomes parent of targetMember - this requires updating targetMember.parentId
          // For simplicity of this example, we are not re-parenting here, just setting generation.
          break;
        case 'spouse':
          newMemberGeneration = targetGen;
          relationshipInput = 'spouse';
          // TODO: Add logic to link spouses if data model supports it (e.g. spouseIds array)
          break;
        default:
          newMemberGeneration = targetGen; // Default to same generation if relationship is unclear
      }
    } else {
      // Generic add, try to infer from relationshipInput or default to generation 0
      if (relationshipInput?.toLowerCase().includes('parent') || relationshipInput?.toLowerCase().includes('father') || relationshipInput?.toLowerCase().includes('mother')) newMemberGeneration = -1; // Relative to a conceptual root for now
      else if (relationshipInput?.toLowerCase().includes('child') || relationshipInput?.toLowerCase().includes('son') || relationshipInput?.toLowerCase().includes('daughter')) newMemberGeneration = 1;
    }


    const newMember: FamilyMember = {
      id: `member-${Date.now()}`,
      name,
      relationship: relationshipInput || "relative",
      birthYear: birthYear || undefined,
      gender: gender as any,
      generation: newMemberGeneration,
      isElder: false,
      status: 'living',
      parentId: newMemberParentId,
    };

    setTree(prevTree => ({
      ...prevTree,
      members: [...prevTree.members, newMember],
    }));

    toast.success(`Added ${name}.`);
    setAddMemberDialogOpen(false);
    setAddingRelationshipInfo(null);
  };


  // Zoom functionality
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  if (tree.members.length === 0) {
    return (
      <Card className="w-full bg-white shadow-md border border-gray-200 p-8 text-center">
        <div className="py-12">
          <Users size={48} className="mx-auto text-uganda-yellow mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start Building Your Family Tree</h3>
          <p className="text-gray-600 mb-6">Add family members to create your personalized family tree.</p>
          <Button onClick={() => handleAddMemberClick(null, "child")} className="bg-uganda-red text-white hover:bg-uganda-red/90">
            <Plus className="h-4 w-4 mr-2" /> Add Initial Family Member
          </Button>
        </div>
      </Card>
    );
  }
  const getRelationshipDescription = (member: FamilyMember | TreeNode): string => {
    if (!member) return "";
    let description = member.relationship || "Family member";
    if (member.parentId) {
      const parent = layout.nodes.find(p => p.id === member.parentId) || tree.members.find(p => p.id === member.parentId);
      if (parent) description += `, child of ${parent.name}`;
    }
    // Could add spouse info here if available and linked
    return description;
  };


  return (
    <div className="space-y-6">
      <FamilyTreeStats tree={tree} />
      <Card className="w-full bg-white shadow-md border border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50 flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-medium text-gray-700">
            {tree.surname} Family Tree - {tree.clan} clan, {tree.tribe} (Traditional Layout)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleZoomOut} size="sm" variant="outline" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
            <Button onClick={handleZoomIn} size="sm" variant="outline" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
            <Button onClick={() => handleAddMemberClick(selectedMemberId, "child")} size="sm" className="bg-uganda-red text-white hover:bg-uganda-red/90 ml-2">
              <Plus className="h-4 w-4 mr-2" /> Add Relative
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto" style={{ height: '70vh' /* Ensure a fixed height for scrolling */ }}>
          <div
            ref={containerRef}
            className="relative" // Removed min-h, width/height set by content + layout
            style={{
              width: `${layout.width * zoomLevel}px`,
              height: `${layout.height * zoomLevel}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left', // More common for traditional trees
              transition: 'transform 0.3s ease, width 0.3s ease, height 0.3s ease',
            }}
          >
            {/* Render Edges (Lines) - SVG */}
            <svg className="absolute top-0 left-0 w-full h-full" style={{ width: layout.width, height: layout.height, pointerEvents: 'none' }}>
              <g>
                {layout.edges.map(edge => (
                  <path
                    key={edge.id}
                    d={edge.path}
                    stroke={edge.type === 'spouse' ? "#888" : "#aaa"}
                    strokeWidth="2"
                    fill="none"
                  />
                ))}
              </g>
            </svg>

            {/* Render Nodes (Family Members) */}
            {layout.nodes.map((node) => (
              <HoverCard key={node.id}>
                <HoverCardTrigger asChild>
                  <div
                    id={`member-${node.id}`}
                    className={`absolute bg-white p-2 rounded border-2 shadow-md cursor-pointer hover:border-uganda-yellow
                                ${selectedMemberId === node.id ? 'border-uganda-red ring-2 ring-uganda-red' : 'border-gray-300'}`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${NODE_WIDTH}px`,
                      height: `${NODE_HEIGHT}px`,
                      transition: 'left 0.3s ease, top 0.3s ease', // For smoother updates if positions change
                    }}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="flex items-center mb-1">
                       {node.photoUrl ? (
                          <img src={node.photoUrl} alt={node.name} className="w-8 h-8 rounded-full mr-2 object-cover"/>
                        ) : (
                          <UserCircle2 size={24} className="mr-2 text-gray-400" />
                       )}
                      <div className="flex-grow">
                        <p className="font-semibold text-sm truncate" title={node.name}>{node.name}</p>
                        {node.birthYear && <p className="text-xs text-gray-500">b. {node.birthYear}{node.deathYear ? ` - d. ${node.deathYear}` : (node.status === 'deceased' ? ' (deceased)' : '')}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 truncate" title={node.relationship}>{node.relationship}</p>
                    {node.isElder && <Badge className="mt-1 text-xs" variant="destructive">Elder</Badge>}
                     {/* Add action buttons directly on node - simplified */}
                    <div className="absolute bottom-1 right-1 flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleAddMemberClick(node.id, 'child'); }} title="Add child"> <UserPlus size={12}/> </Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleAddMemberClick(node.id, 'spouse'); }} title="Add spouse"> <Link2 size={12}/> </Button>
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 p-3 text-xs">
                  <h4 className="font-semibold text-sm mb-1">{node.name}</h4>
                  <div className="flex items-center gap-1 mb-0.5"> <User size={12} /> <span>{node.relationship || "Family member"}</span> </div>
                  {node.birthYear && <div className="flex items-center gap-1 mb-0.5"> <Calendar size={12} /> <span>Born: {node.birthYear}</span> </div>}
                  {node.deathYear ? <div className="flex items-center gap-1 mb-0.5"> <Heart size={12} /> <span>Deceased: {node.deathYear}</span> </div>
                    : node.status !== 'deceased' && <div className="flex items-center gap-1 mb-0.5 text-green-600"> <Heart size={12} /> <span>Living</span> </div>}
                  <div className="text-gray-500 mt-1 p-1 bg-gray-50 rounded text-[10px]"> {getRelationshipDescription(node)} </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
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
              {/* Conditional relationship input if not contextually set */}
              {!addingRelationshipInfo && (
                 <div className="grid gap-2">
                    <label htmlFor="relationship" className="text-sm font-medium">Relationship (to family)</label>
                    <Input id="relationship" name="relationship" placeholder="e.g., founder, cousin" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="gender" className="text-sm font-medium">Gender</label>
                  <select id="gender" name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
              <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">Add Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyTreeDisplay;