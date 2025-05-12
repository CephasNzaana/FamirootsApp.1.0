import { useState, useRef, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, Users, Plus, ZoomIn, ZoomOut, UserCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner"; // Assuming "sonner" is intended (e.g., from shadcn/ui)
import FamilyTreeStats from "@/components/FamilyTreeStats";
// Removed unused import: import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Removed unused import: import { useState as useHookState } from "react";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

const FamilyTreeDisplay = ({ tree }: FamilyTreeDisplayProps) => {
  // State variables - keeping them exactly as they were
  const [principalPerson, setPrincipalPerson] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationship, setAddingRelationship] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Tree data:", tree);
  }, [tree]);

  // Group family members by generation - fixing the grouping logic
  const membersByGeneration: Record<number, FamilyMember[]> = {};

  tree.members.forEach(member => {
    const generation = member.generation || 0; // Default to 0 if undefined
    if (!membersByGeneration[generation]) {
      membersByGeneration[generation] = [];
    }
    membersByGeneration[generation].push(member);
  });

  // Get the generations in ascending order
  const generations = Object.keys(membersByGeneration)
    .map(gen => parseInt(gen))
    .sort((a, b) => a - b);

  // Find the user (principal person) in the tree - improved logic
  const findUserMember = (): FamilyMember | null => {
    // First try to use the selected principal person
    if (principalPerson) {
      const foundMember = tree.members.find(m => m.id === principalPerson);
      if (foundMember) return foundMember;
    }

    // Try to find someone with a "self" relationship
    const selfMember = tree.members.find(m =>
      m.relationship?.toLowerCase() === 'self' ||
      m.relationship === '' ||
      m.relationship?.toLowerCase() === 'principal' ||
      m.relationship?.toLowerCase() === 'you'
    );

    if (selfMember) return selfMember;

    // Fallback to generation 0 if available
    if (generations.includes(0) && membersByGeneration[0] && membersByGeneration[0].length > 0) {
      return membersByGeneration[0][0];
    }

    // Last resort: return the first member
    return tree.members.length > 0 ? tree.members[0] : null;
  };

  // Determine the central person (user)
  const centralPerson = findUserMember();

  // Function to find a member by ID - improved error handling
  const findMember = (id: string): FamilyMember | undefined => {
    return tree.members.find(m => m.id === id);
  };

  // Get relationship description - improved with better relationship detection
  const getRelationshipDescription = (member: FamilyMember | null): string => {
    if (!member) return "";

    if (member.parentId) {
      const parent = findMember(member.parentId);
      if (parent) {
        return `Child of ${parent.name}`;
      }
    }

    // Check for siblings - improved detection by including generation check
    const siblings = tree.members.filter(m =>
      m.id !== member.id &&
      m.parentId === member.parentId &&
      member.parentId !== undefined && // Ensure parentId exists for comparison
      m.generation === member.generation
    );

    if (siblings.length > 0) {
      return `Sibling of ${siblings.map(s => s.name).join(", ")}`;
    }

    // Check for children relationship
    const children = tree.members.filter(m =>
      m.parentId === member.id
    );

    if (children.length > 0) {
      return `Parent of ${children.map(c => c.name).join(", ")}`;
    }

    return member.relationship || "Family member";
  };

  // Create placeholders for common family relationships - improved positioning
  const createPlaceholders = () => {
    if (!centralPerson) return [];

    const placeholders = [];
    // Convert to lowercase for more accurate matching
    const existingRelationships = new Set(
      tree.members.map(m => (m.relationship || "").toLowerCase())
    );

    // Define possible relationships with better positioning angles
    const possibleRelationships = [
      { name: 'father', generation: -1, angle: Math.PI * 0.25 },
      { name: 'mother', generation: -1, angle: Math.PI * 1.75 },
      { name: 'paternal grandfather', generation: -2, angle: Math.PI * 0.15 },
      { name: 'paternal grandmother', generation: -2, angle: Math.PI * 0.35 },
      { name: 'maternal grandfather', generation: -2, angle: Math.PI * 1.65 },
      { name: 'maternal grandmother', generation: -2, angle: Math.PI * 1.85 },
      { name: 'sibling', generation: 0, angle: Math.PI },
      { name: 'spouse', generation: 0, angle: Math.PI * 1.5 },
      { name: 'child', generation: 1, angle: Math.PI * 0.75 },
      { name: 'uncle', generation: -1, angle: Math.PI * 0.6 },
      { name: 'aunt', generation: -1, angle: Math.PI * 1.4 },
      { name: 'cousin', generation: 0, angle: Math.PI * 0.5 },
    ];

    // Add placeholders for missing relationships - improved detection
    possibleRelationships.forEach(rel => {
      let shouldAdd = true;
      const relLower = rel.name.toLowerCase();

      // Better relationship detection logic
      if (relLower === 'sibling') {
        shouldAdd = !Array.from(existingRelationships).some(r =>
          r.includes('sibling') || r.includes('brother') || r.includes('sister')
        );
      } else if (relLower === 'child') {
        shouldAdd = !Array.from(existingRelationships).some(r =>
          r.includes('son') || r.includes('daughter') || r === 'child'
        );
      } else if (relLower === 'father') {
        shouldAdd = !Array.from(existingRelationships).some(r =>
          r === 'father' || r === 'dad' || r.includes('father')
        );
      } else if (relLower === 'mother') {
        shouldAdd = !Array.from(existingRelationships).some(r =>
          r === 'mother' || r === 'mom' || r.includes('mother')
        );
      } else {
        shouldAdd = !Array.from(existingRelationships).some(r =>
          r.includes(relLower)
        );
      }

      if (shouldAdd && centralPerson.generation !== undefined) { // Ensure centralPerson.generation is defined
        placeholders.push({
          relationship: rel.name,
          generation: centralPerson.generation + rel.generation,
          position: { angle: rel.angle }
        });
      }
    });

    return placeholders;
  };

  const placeholders = createPlaceholders();

  // Improved function to calculate the position for a node in the sun chart
  const calculateNodePosition = (generation: number, index: number, totalInGeneration: number) => {
    const baseRadius = 150; // Base radius for the central person (zoom level applied by parent)
    const radiusIncrement = 100; // Space between generation rings (zoom level applied by parent)
    const centralGeneration = centralPerson?.generation ?? 0; // Default to 0 if undefined
    const genDifference = Math.abs(generation - centralGeneration);

    // Calculate radius based on generation difference from central person
    const radius = baseRadius + genDifference * radiusIncrement;

    // Determine the optimal angle division based on number of members
    // Ensure at least some minimal spacing between nodes
    const effectiveTotalInGeneration = Math.max(totalInGeneration, 4); // Avoid division by zero or too few points
    const angleStep = (2 * Math.PI) / effectiveTotalInGeneration;

    // Calculate angle
    let angle;
    if (generation === centralGeneration) {
      angle = (Math.PI / 2) + (index * angleStep);
    } else if (generation < centralGeneration) {
      angle = (index * angleStep);
    } else {
      angle = Math.PI + (index * angleStep);
    }

    // Convert polar coordinates to Cartesian coordinates
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    return { x, y };
  };

  // Improved function to handle adding a new family member
  const handleAddFamilyMember = (relationship?: string) => {
    if (relationship) {
      setAddingRelationship(relationship);
    } else {
      setAddingRelationship("");
    }
    setAddMemberDialogOpen(true);
  };

  // Enhanced function to submit a new family member with improved generation handling
  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const gender = formData.get('gender') as string;
    const birthYear = formData.get('birthYear') as string;
    const currentRelationship = addingRelationship || formData.get('relationship') as string; // Use 'currentRelationship' to avoid conflict
    const notes = formData.get('notes') as string;

    if (name && currentRelationship) {
      try {
        let generationOffset = 0;
        const relationshipLower = currentRelationship.toLowerCase();

        if (relationshipLower.includes('grand') && relationshipLower.includes('parent')) {
          generationOffset = -2;
        } else if (relationshipLower.includes('father') || relationshipLower.includes('mother') || relationshipLower.includes('parent')) {
          generationOffset = -1;
        } else if (relationshipLower.includes('child') || relationshipLower.includes('son') || relationshipLower.includes('daughter')) {
          generationOffset = 1;
        } else if (relationshipLower.includes('grand') && (relationshipLower.includes('child') || relationshipLower.includes('son') || relationshipLower.includes('daughter'))) {
          generationOffset = 2;
        }

        const baseGeneration = centralPerson?.generation ?? 0; // Default to 0 if undefined

        const newMember: FamilyMember = {
          id: `member-${Date.now()}`,
          name,
          relationship: currentRelationship,
          birthYear: birthYear || undefined,
          gender: gender as any, // Kept 'as any' as per original, consider refining if FamilyMember['gender'] is specific
          generation: baseGeneration + generationOffset,
          isElder: false, // Assuming default
          status: 'living', // Assuming default
          parentId: generationOffset === 1 ? centralPerson?.id : undefined,
          // photoUrl, deathYear, etc. would be undefined by default
        };

        toast.success(`Added ${name} as ${currentRelationship}.`);
        setAddMemberDialogOpen(false);

        tree.members.push(newMember); // Direct mutation (as per original code)
        setPrincipalPerson(prev => prev); // Force re-render (as per original code style)

      } catch (error) {
        console.error("Error adding family member:", error);
        toast.error("Failed to add family member. Please try again.");
      }
    } else {
      toast.error("Please provide at least a name and relationship");
    }
  };

  // Zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  if (tree.members.length === 0) {
    return (
      <Card className="w-full bg-white shadow-md border border-gray-200 p-8 text-center">
        <div className="py-12">
          <Users size={48} className="mx-auto text-uganda-yellow mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start Building Your Family Tree</h3>
          <p className="text-gray-600 mb-6">Add family members to create your personalized family tree.</p>
          <Button
            onClick={() => handleAddFamilyMember()}
            className="bg-uganda-red text-white hover:bg-uganda-red/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Family Member
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FamilyTreeStats tree={tree} />

      <Card className="w-full bg-white shadow-md border border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50 flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-medium text-gray-700">
            {tree.surname} Family Tree - {tree.clan} clan, {tree.tribe}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleZoomOut}
              size="sm"
              className="rounded-full p-2 h-8 w-8"
              variant="outline"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomIn}
              size="sm"
              className="rounded-full p-2 h-8 w-8"
              variant="outline"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleAddFamilyMember()}
              size="sm"
              className="bg-uganda-red text-white hover:bg-uganda-red/90 ml-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Family Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-auto relative"> {/* Ensure CardContent can contain positioned children if legend is relative to it */}
          <div
            ref={containerRef}
            className="relative min-h-[600px] w-full" // This div is now the container for scaled elements
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease',
            }}
          >
            {/* Sun chart container with central person - MOVED INSIDE SCALED DIV */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Central person */}
              {centralPerson && (
                <div className="absolute z-10"> {/* This div's position is relative to the "absolute inset-0" parent */}
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div
                        className={`tree-node bg-uganda-yellow/20 p-4 rounded-full border-4 cursor-pointer
                        ${centralPerson.isElder ? 'border-uganda-red' : 'border-uganda-yellow'}
                        shadow-lg relative hover:shadow-xl transition-shadow w-24 h-24 flex flex-col items-center justify-center`}
                        id={`member-${centralPerson.id}`}
                        onClick={() => setPrincipalPerson(centralPerson.id)} // Allow re-centering on self if desired
                      >
                        {centralPerson.photoUrl ? (
                          <div className="overflow-hidden rounded-full w-16 h-16 bg-gray-100 border border-gray-300">
                            <img
                              src={centralPerson.photoUrl}
                              alt={centralPerson.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="bg-uganda-yellow/50 rounded-full p-2 mb-1">
                            <UserCircle2 size={24} className="text-uganda-black" />
                          </div>
                        )}
                        <div className="text-xs font-bold text-[#333333] text-center truncate max-w-full">
                          {centralPerson.name}
                        </div>
                        {centralPerson.isElder && (
                          <Badge className="absolute -top-2 -right-2 bg-uganda-red text-white">Elder</Badge>
                        )}

                        {/* Connector dots around the central node */}
                        {Array.from({ length: 8 }).map((_, i) => {
                          const angle = (i * Math.PI) / 4;
                          const x = Math.cos(angle) * 12; // Adjusted radius for dots relative to node center
                          const y = Math.sin(angle) * 12;
                          return (
                            <div
                              key={`connector-${centralPerson.id}-${i}`} // More specific key
                              className="absolute w-2 h-2 bg-gray-400 rounded-full"
                              style={{
                                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, // Center dot then move
                                top: '50%',
                                left: '50%',
                              }}
                            />
                          );
                        })}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 p-4 border border-gray-200 shadow-lg">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-[#333333]">{centralPerson.name}</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-uganda-yellow" />
                          <span>{centralPerson.relationship || "You"}</span>
                        </div>
                        {centralPerson.birthYear && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-[#555555]" />
                            <span>Born: {centralPerson.birthYear}</span>
                          </div>
                        )}
                        {centralPerson.deathYear ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-gray-500" />
                            <span>Deceased: {centralPerson.deathYear}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-uganda-red" />
                            <span>Living</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                          {getRelationshipDescription(centralPerson)}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}

              {/* Generational rings with improved positioning */}
              {generations.map(gen => {
                const membersInGeneration = membersByGeneration[gen].filter(m => m.id !== centralPerson?.id);
                if (membersInGeneration.length === 0 && gen !== (centralPerson?.generation ?? 0)) return null; // Also allow drawing empty ring if it's the central's gen

                const centralGen = centralPerson?.generation ?? 0;
                const genRadius = 150 + Math.abs(gen - centralGen) * 100;


                return (
                  <div key={gen} className="absolute inset-0 flex items-center justify-center"> {/* Each gen container also fills parent */}
                    {/* Generation ring - rendered as a dashed circle */}
                    <div
                      className="rounded-full border border-dashed border-gray-300 absolute"
                      style={{
                        width: `${genRadius * 2}px`, // Diameter
                        height: `${genRadius * 2}px`, // Diameter
                        opacity: 0.5,
                        pointerEvents: 'none', // So it doesn't interfere with clicks on nodes
                      }}
                    />

                    {/* Family members in this generation */}
                    {membersInGeneration.map((member, idx) => {
                      const position = calculateNodePosition(gen, idx, membersInGeneration.length);
                      const distanceFromCenter = Math.sqrt(position.x * position.x + position.y * position.y);

                      return (
                        <HoverCard key={member.id}>
                          <HoverCardTrigger asChild>
                            <div
                              className={`absolute tree-node bg-white p-1 rounded-full border-2 cursor-pointer
                              ${member.isElder ? 'border-uganda-red bg-uganda-yellow/10' : 'border-gray-200'}
                              shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center`}
                              style={{
                                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`, // Center node then position
                                zIndex: 5,
                                width: '70px',
                                height: '70px',
                              }}
                              onClick={() => setPrincipalPerson(member.id)}
                              id={`member-${member.id}`}
                            >
                              {member.photoUrl ? (
                                <div className="overflow-hidden rounded-full w-10 h-10 mb-0.5 border border-gray-300">
                                  <img
                                    src={member.photoUrl}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <UserCircle2 size={28} className="text-gray-400 mb-1" />
                              )}
                              <div className="text-[10px] font-medium text-[#333333] truncate w-full px-1">
                                {member.name}
                              </div>
                              {member.isElder && (
                                <Badge className="absolute -top-1 -right-1 bg-uganda-red text-white p-0 text-[8px] h-4 min-w-4 flex items-center justify-center">E</Badge>
                              )}

                              {/* Connection line to central origin of this generation's layout */}
                              <div
                                className="absolute"
                                style={{
                                  width: '1.5px', // Thinner line
                                  height: `${distanceFromCenter - 35}px`, // 35 is ~half node width
                                  background: 'rgba(200, 200, 200, 0.6)',
                                  transformOrigin: 'top center',
                                  transform: `translateY(35px) rotate(${Math.atan2(position.y, position.x) + Math.PI / 2}rad)`, // Adjust rotation for vertical line from node's bottom towards center
                                  bottom: '50%', // Start from center of node
                                  left: '50%',
                                  marginLeft: '-0.75px', // Half of width
                                  zIndex: -1,
                                }}
                              />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64 p-4 border border-gray-200 shadow-lg z-20">
                            {/* ... HoverCardContent unchanged ... */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-[#333333]">{member.name}</h4>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-uganda-yellow" />
                                <span>{member.relationship}</span>
                              </div>
                              {member.birthYear && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-[#555555]" />
                                  <span>Born: {member.birthYear}</span>
                                </div>
                              )}
                              {member.deathYear ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Heart className="h-4 w-4 text-gray-500" />
                                  <span>Deceased: {member.deathYear}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <Heart className="h-4 w-4 text-uganda-red" />
                                  <span>Living</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                                {getRelationshipDescription(member)}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                                onClick={() => setPrincipalPerson(member.id)}
                              >
                                Set as Central Person
                              </Button>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
                  </div>
                );
              })}

              {/* Placeholder nodes for adding family members */}
              {centralPerson && placeholders.map((placeholder, index) => {
                const placeholdersInGen = placeholders.filter(p => p.generation === placeholder.generation);
                const indexInGen = placeholdersInGen.findIndex(p => p.relationship === placeholder.relationship); // Use a stable property for index

                let position;
                const centralGen = centralPerson.generation ?? 0;
                const placeholderGenRadius = 150 + Math.abs(placeholder.generation - centralGen) * 100;

                if (placeholder.position?.angle !== undefined) {
                  position = {
                    x: placeholderGenRadius * Math.cos(placeholder.position.angle),
                    y: placeholderGenRadius * Math.sin(placeholder.position.angle)
                  };
                } else {
                  // Fallback if angle not provided, distribute evenly (might need refinement)
                  const angleStep = (2 * Math.PI) / (placeholdersInGen.length || 1);
                  const angle = (indexInGen * angleStep) + (Math.PI / 4); // Basic distribution
                  position = {
                     x: placeholderGenRadius * Math.cos(angle),
                     y: placeholderGenRadius * Math.sin(angle)
                  };
                }
                const distanceFromCenter = Math.sqrt(position.x * position.x + position.y * position.y);


                return (
                  <div
                    key={`placeholder-${placeholder.relationship}-${index}`} // More specific key
                    className="absolute tree-node bg-gray-100/80 p-2 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:bg-uganda-yellow/10 hover:border-uganda-yellow transition-colors flex flex-col items-center justify-center text-center"
                    style={{
                      transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`, // Center node then position
                      zIndex: 5,
                      width: '60px',
                      height: '60px',
                    }}
                    onClick={() => handleAddFamilyMember(placeholder.relationship)}
                    title={`Add ${placeholder.relationship}`}
                  >
                    <UserPlus className="h-4 w-4 mb-0.5 text-gray-500" />
                    <span className="text-[8px] font-medium text-gray-500 truncate w-full px-1">
                      Add {placeholder.relationship}
                    </span>

                     {/* Connection line to central origin */}
                    <div
                      className="absolute"
                      style={{
                        width: '1.5px',
                        height: `${distanceFromCenter - 30}px`, // 30 is half placeholder width
                        background: 'rgba(220, 220, 220, 0.4)',
                        transformOrigin: 'top center',
                        transform: `translateY(30px) rotate(${Math.atan2(position.y, position.x) + Math.PI / 2}rad)`,
                        bottom: '50%',
                        left: '50%',
                        marginLeft: '-0.75px',
                        zIndex: -1,
                      }}
                    />
                  </div>
                );
              })}
            </div> {/* End of "absolute inset-0 flex items-center justify-center" div */}
          </div> {/* End of "containerRef" div (scaled container) */}

          {/* Legend - positioned relative to CardContent */}
          <div className="absolute bottom-4 right-4 bg-white p-3 rounded-md shadow-md border border-gray-200 z-20">
            <div className="text-sm font-medium mb-2">Legend</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-uganda-yellow/20 border-2 border-uganda-yellow"></div>
              <span className="text-xs">You</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-200"></div>
              <span className="text-xs">Family Member</span>
            </div>
            <div className="flex items-center gap-2 mb-1"> {/* Added mb-1 for consistency */}
              <div className="w-3 h-3 rounded-full bg-uganda-yellow/10 border-2 border-uganda-red"></div>
              <span className="text-xs">Clan Elder</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-100 border-2 border-dashed border-gray-300"></div>
              <span className="text-xs">Add Family Member</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {addingRelationship
                ? `Add ${addingRelationship.charAt(0).toUpperCase() + addingRelationship.slice(1)}`
                : "Add Family Member"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitNewMember}> {/* Native form tag is fine if not using react-hook-form with <Form> */}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Full name"
                  required
                />
              </div>

              {!addingRelationship && (
                <div className="grid gap-2">
                  <label htmlFor="relationship" className="text-sm font-medium">
                    Relationship
                  </label>
                  <Input
                    id="relationship"
                    name="relationship"
                    placeholder="e.g., father, mother, sibling"
                    required={!addingRelationship} // Required only if not pre-filled
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="gender" className="text-sm font-medium">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Standard shadcn select classes
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option> {/* Added Other as an option */}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="birthYear" className="text-sm font-medium">
                    Birth Year
                  </label>
                  <Input
                    id="birthYear"
                    name="birthYear"
                    type="number" // Use type number for year
                    placeholder="e.g., 1980"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                Add Family Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyTreeDisplay;