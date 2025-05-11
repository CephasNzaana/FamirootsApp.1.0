
import { useState, useRef, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, Users, Plus, ZoomIn, ZoomOut, UserCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState as useHookState } from "react";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

const FamilyTreeDisplay = ({ tree }: FamilyTreeDisplayProps) => {
  // Principal person is the user, at the center of the sun chart
  const [principalPerson, setPrincipalPerson] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationship, setAddingRelationship] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log("Tree data:", tree);
  }, [tree]);
  
  // Group family members by generation
  const membersByGeneration: Record<number, FamilyMember[]> = {};
  
  tree.members.forEach(member => {
    if (!membersByGeneration[member.generation]) {
      membersByGeneration[member.generation] = [];
    }
    membersByGeneration[member.generation].push(member);
  });

  // Get the generations in ascending order
  const generations = Object.keys(membersByGeneration)
    .map(gen => parseInt(gen))
    .sort((a, b) => a - b);
  
  // Find the user (principal person) in the tree - assume it's either the selected person or generation 0
  const findUserMember = () => {
    if (principalPerson) {
      return tree.members.find(m => m.id === principalPerson);
    }
    
    // Try to find the principal person by relationship (self, or empty relationship)
    const possibleUser = tree.members.find(m => 
      m.relationship === 'self' || 
      m.relationship === '' || 
      m.relationship === 'principal'
    );
    
    if (possibleUser) return possibleUser;
    
    // Fallback to a member from generation 0 if it exists
    return (generations.length > 0 && membersByGeneration[generations[0]] && membersByGeneration[generations[0]].length > 0)
      ? membersByGeneration[generations[0]][0]
      : null;
  };
  
  // Determine the central person (user)
  const centralPerson = findUserMember();
  
  // Function to find a member by ID
  const findMember = (id: string) => {
    return tree.members.find(m => m.id === id);
  };
  
  // Get relationship description
  const getRelationshipDescription = (member: FamilyMember) => {
    if (member.parentId) {
      const parent = findMember(member.parentId);
      if (parent) {
        return `Child of ${parent.name}`;
      }
    }
    
    // Check for siblings
    const siblings = tree.members.filter(m => 
      m.id !== member.id && 
      m.parentId === member.parentId && 
      member.parentId !== undefined
    );
    
    if (siblings.length > 0) {
      return `Sibling of ${siblings.map(s => s.name).join(", ")}`;
    }
    
    return member.relationship || "Family member";
  };
  
  // Create placeholders for common family relationships
  const createPlaceholders = () => {
    if (!centralPerson) return [];
    
    const placeholders = [];
    const existingRelationships = new Set(tree.members.map(m => m.relationship));
    
    // Define possible relationships to check
    const possibleRelationships = [
      { name: 'father', generation: -1, angle: 0 },
      { name: 'mother', generation: -1, angle: Math.PI },
      { name: 'paternal grandfather', generation: -2, angle: Math.PI * 1.75 },
      { name: 'paternal grandmother', generation: -2, angle: Math.PI * 1.25 },
      { name: 'maternal grandfather', generation: -2, angle: Math.PI * 0.75 },
      { name: 'maternal grandmother', generation: -2, angle: Math.PI * 0.25 },
      { name: 'sibling', generation: 0, angle: Math.PI * 0.5 },
      { name: 'spouse', generation: 0, angle: Math.PI * 1.5 },
      { name: 'child', generation: 1, angle: Math.PI },
      { name: 'uncle', generation: -1, angle: Math.PI * 0.25 },
      { name: 'aunt', generation: -1, angle: Math.PI * 1.75 },
      { name: 'cousin', generation: 0, angle: Math.PI * 0.75 },
    ];
    
    // Add placeholders for missing relationships
    possibleRelationships.forEach(rel => {
      let shouldAdd = true;
      
      // Check if relationship is already present in some form
      if (rel.name === 'sibling') {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r.includes('sibling') || r.includes('brother') || r.includes('sister')
        );
      } else if (rel.name === 'child') {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r.includes('son') || r.includes('daughter') || r === 'child'
        );
      } else {
        shouldAdd = !existingRelationships.has(rel.name);
      }
      
      if (shouldAdd) {
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

  // Function to calculate the position for a node in the sun chart
  const calculateNodePosition = (generation: number, index: number, totalInGeneration: number) => {
    // These calculations position family members in concentric circles
    // Each generation gets its own ring
    const baseRadius = 150 * zoomLevel; // Increased base radius for better visibility
    const radiusIncrement = 100 * zoomLevel; // Larger increment for better spacing
    const centralGeneration = centralPerson?.generation || 0;
    const genDifference = Math.abs(generation - centralGeneration);
    const radius = baseRadius + genDifference * radiusIncrement;
    
    // Calculate the angle based on the index and total members in this generation
    const angleStep = (2 * Math.PI) / totalInGeneration;
    const angle = index * angleStep;
    
    // Convert polar coordinates to Cartesian coordinates
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    return { x, y };
  };

  const handleAddFamilyMember = (relationship?: string) => {
    if (relationship) {
      setAddingRelationship(relationship);
      setAddMemberDialogOpen(true);
    } else {
      setAddingRelationship("");
      setAddMemberDialogOpen(true);
    }
  };

  const onSubmitNewMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const gender = formData.get('gender') as string;
    const birthYear = formData.get('birthYear') as string;
    const relationship = addingRelationship || formData.get('relationship') as string;
    
    if (name && relationship) {
      try {
        // In a production app, we would call the API to save this data
        // For now, show a success message and close the dialog
        toast.success(`Added ${name} as ${relationship}.`);
        setAddMemberDialogOpen(false);
        
        // In real implementation, we would refresh the tree data here
        // For demo purposes, we'll add the new member to the tree directly
        const newMember: FamilyMember = {
          id: `new-${Date.now()}`,
          name,
          relationship,
          birthYear: birthYear || undefined,
          gender: gender as any,
          generation: centralPerson ? 
            (relationship.includes('parent') ? centralPerson.generation - 1 : 
             relationship.includes('child') ? centralPerson.generation + 1 :
             centralPerson.generation) : 0,
          isElder: false,
          status: 'living',
          parentId: centralPerson?.id
        };
        
        // Add the new member to the tree
        tree.members.push(newMember);
        
        // Force a re-render by setting the principal person
        setPrincipalPerson(principalPerson);
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

  // If there are no family members, show an empty state
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
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleZoomIn} 
              size="sm" 
              className="rounded-full p-2 h-8 w-8"
              variant="outline"
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
        <CardContent className="p-6 overflow-x-auto">
          <div 
            className="relative min-h-[600px] w-full"
            ref={containerRef}
            style={{ 
              transform: `scale(${zoomLevel})`, 
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease'
            }}
          >
            {/* Sun chart container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Central person */}
              {centralPerson && (
                <div className="absolute z-10">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div 
                        className={`tree-node bg-uganda-yellow/20 p-4 rounded-full border-4 cursor-pointer
                        ${centralPerson.isElder ? 'border-uganda-red' : 'border-uganda-yellow'} 
                        shadow-lg relative hover:shadow-xl transition-shadow w-24 h-24 flex flex-col items-center justify-center`}
                        id={`member-${centralPerson.id}`}
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
                          const x = Math.cos(angle) * 12;
                          const y = Math.sin(angle) * 12;
                          return (
                            <div 
                              key={`connector-${i}`}
                              className="absolute w-2 h-2 bg-gray-400 rounded-full"
                              style={{
                                transform: `translate(${x}px, ${y}px)`,
                                top: '50%',
                                left: '50%',
                                marginLeft: '-1px',
                                marginTop: '-1px'
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
              
              {/* Generational rings */}
              {generations.map(gen => {
                const membersInGeneration = membersByGeneration[gen].filter(m => m.id !== centralPerson?.id);
                return (
                  <div key={gen} className="absolute inset-0 flex items-center justify-center">
                    {/* Generation ring - rendered as a dashed circle */}
                    <div 
                      className="rounded-full border border-dashed border-gray-300 absolute"
                      style={{
                        width: `${300 + Math.abs(gen - (centralPerson?.generation || 0)) * 200}px`,
                        height: `${300 + Math.abs(gen - (centralPerson?.generation || 0)) * 200}px`,
                        opacity: 0.5
                      }}
                    />
                    
                    {/* Family members in this generation */}
                    {membersInGeneration.map((member, idx) => {
                      const position = calculateNodePosition(gen, idx, membersInGeneration.length);
                      return (
                        <HoverCard key={member.id}>
                          <HoverCardTrigger asChild>
                            <div 
                              className={`absolute tree-node bg-white p-2 rounded-full border-2 cursor-pointer
                              ${member.isElder ? 'border-uganda-red bg-uganda-yellow/10' : 'border-gray-200'} 
                              shadow-sm hover:shadow-md transition-shadow`}
                              style={{
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                zIndex: 5,
                                width: '70px', // Larger size for better visibility
                                height: '70px',
                              }}
                              onClick={() => setPrincipalPerson(member.id)}
                              id={`member-${member.id}`}
                            >
                              {member.photoUrl ? (
                                <div className="overflow-hidden rounded-full w-full h-full">
                                  <img 
                                    src={member.photoUrl} 
                                    alt={member.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <UserCircle2 size={28} className="text-gray-400 mb-1" /> {/* Larger icon */}
                                  <div className="text-[10px] font-medium text-[#333333] truncate w-full text-center">
                                    {member.name}
                                  </div>
                                </div>
                              )}
                              {member.isElder && (
                                <Badge className="absolute -top-2 -right-2 bg-uganda-red text-white p-0 h-5 min-w-5 flex items-center justify-center">E</Badge>
                              )}

                              {/* Connector dots */}
                              <div 
                                className="absolute w-2 h-2 bg-gray-400 rounded-full" 
                                style={{
                                  bottom: position.y > 0 ? '-1px' : 'auto',
                                  top: position.y <= 0 ? '-1px' : 'auto',
                                  left: '50%',
                                  transform: 'translateX(-50%)'
                                }}
                              />

                              {/* Connection line to central person */}
                              <div 
                                className="absolute z-1" 
                                style={{
                                  width: '2px',
                                  height: `${Math.sqrt(position.x * position.x + position.y * position.y)}px`,
                                  background: 'rgba(200, 200, 200, 0.6)',
                                  transformOrigin: 'top',
                                  transform: `rotate(${Math.atan2(position.y, position.x) - Math.PI/2}rad)`,
                                  left: '50%',
                                  top: position.y < 0 ? '100%' : '0',
                                  marginLeft: '-1px',
                                  zIndex: -1
                                }}
                              />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64 p-4 border border-gray-200 shadow-lg z-20">
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
                const placeholdersByGeneration = placeholders.filter(p => p.generation === placeholder.generation);
                const indexInGeneration = placeholdersByGeneration.indexOf(placeholder);
                const totalInGeneration = placeholdersByGeneration.length;
                
                // Use provided angle if available, otherwise calculate based on index
                let position;
                if (placeholder.position?.angle !== undefined) {
                  const baseRadius = 150 * zoomLevel;
                  const radiusIncrement = 100 * zoomLevel;
                  const genDifference = Math.abs(placeholder.generation - centralPerson.generation);
                  const radius = baseRadius + genDifference * radiusIncrement;
                  position = {
                    x: radius * Math.cos(placeholder.position.angle),
                    y: radius * Math.sin(placeholder.position.angle)
                  };
                } else {
                  position = calculateNodePosition(
                    placeholder.generation, 
                    indexInGeneration, 
                    totalInGeneration
                  );
                }
                
                return (
                  <div 
                    key={`placeholder-${index}`}
                    className="absolute tree-node bg-gray-100/80 p-2 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:bg-uganda-yellow/10 hover:border-uganda-yellow transition-colors flex items-center justify-center"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px)`,
                      zIndex: 5,
                      width: '60px',  // Larger size for better visibility
                      height: '60px'
                    }}
                    onClick={() => handleAddFamilyMember(placeholder.relationship)}
                  >
                    <div className="text-xs font-medium text-gray-500 flex flex-col items-center">
                      <UserPlus className="h-4 w-4 mb-1" />
                      <span className="text-[8px] truncate w-full text-center">Add {placeholder.relationship}</span>
                    </div>
                    
                    {/* Connector dot */}
                    <div 
                      className="absolute w-2 h-2 bg-gray-300 rounded-full" 
                      style={{
                        bottom: position.y > 0 ? '-1px' : 'auto',
                        top: position.y <= 0 ? '-1px' : 'auto',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    />
                    
                    {/* Connection line to central person */}
                    <div 
                      className="absolute z-1" 
                      style={{
                        width: '2px',
                        height: `${Math.sqrt(position.x * position.x + position.y * position.y)}px`,
                        background: 'rgba(220, 220, 220, 0.4)',
                        transformOrigin: 'top',
                        transform: `rotate(${Math.atan2(position.y, position.x) - Math.PI/2}rad)`,
                        left: '50%',
                        top: position.y < 0 ? '100%' : '0',
                        marginLeft: '-1px',
                        zIndex: -1
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-uganda-yellow/10 border-2 border-uganda-red"></div>
                <span className="text-xs">Clan Elder</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-100 border-2 border-dashed border-gray-300"></div>
                <span className="text-xs">Add Family Member</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {addingRelationship 
                ? `Add ${addingRelationship.charAt(0).toUpperCase() + addingRelationship.slice(1)}` 
                : "Add Family Member"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitNewMember}>
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
                    required
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="birthYear" className="text-sm font-medium">
                    Birth Year
                  </label>
                  <Input
                    id="birthYear"
                    name="birthYear"
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
