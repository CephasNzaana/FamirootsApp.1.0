
import { useState } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { User, Calendar, Heart, Users, Plus, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

const FamilyTreeDisplay = ({ tree }: FamilyTreeDisplayProps) => {
  // Principal person is the user, at the center of the sun chart
  const [principalPerson, setPrincipalPerson] = useState<string | null>(null);
  
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
    
    // Potential parent placeholder
    if (!tree.members.some(m => m.relationship === 'father')) {
      placeholders.push({
        relationship: 'father',
        generation: centralPerson.generation - 1,
        position: { angle: 0 }
      });
    }
    
    if (!tree.members.some(m => m.relationship === 'mother')) {
      placeholders.push({
        relationship: 'mother',
        generation: centralPerson.generation - 1,
        position: { angle: Math.PI }
      });
    }
    
    // Grandparent placeholders
    if (!tree.members.some(m => m.relationship === 'paternal grandfather')) {
      placeholders.push({
        relationship: 'paternal grandfather',
        generation: centralPerson.generation - 2,
        position: { angle: Math.PI * 1.75 }
      });
    }
    
    if (!tree.members.some(m => m.relationship === 'paternal grandmother')) {
      placeholders.push({
        relationship: 'paternal grandmother',
        generation: centralPerson.generation - 2,
        position: { angle: Math.PI * 1.25 }
      });
    }
    
    if (!tree.members.some(m => m.relationship === 'maternal grandfather')) {
      placeholders.push({
        relationship: 'maternal grandfather',
        generation: centralPerson.generation - 2,
        position: { angle: Math.PI * 0.75 }
      });
    }
    
    if (!tree.members.some(m => m.relationship === 'maternal grandmother')) {
      placeholders.push({
        relationship: 'maternal grandmother',
        generation: centralPerson.generation - 2,
        position: { angle: Math.PI * 0.25 }
      });
    }
    
    // Sibling placeholder
    if (!tree.members.some(m => m.relationship.includes('sibling') || m.relationship.includes('brother') || m.relationship.includes('sister'))) {
      placeholders.push({
        relationship: 'sibling',
        generation: centralPerson.generation,
        position: { angle: Math.PI * 0.5 }
      });
    }
    
    // Spouse placeholder
    if (!tree.members.some(m => m.relationship === 'spouse')) {
      placeholders.push({
        relationship: 'spouse',
        generation: centralPerson.generation,
        position: { angle: Math.PI * 1.5 }
      });
    }
    
    // Child placeholder
    if (!tree.members.some(m => m.relationship.includes('son') || m.relationship.includes('daughter') || m.relationship === 'child')) {
      placeholders.push({
        relationship: 'child',
        generation: centralPerson.generation + 1,
        position: { angle: Math.PI }
      });
    }
    
    return placeholders;
  };

  const placeholders = createPlaceholders();

  // Function to calculate the position for a node in the sun chart
  const calculateNodePosition = (generation: number, index: number, totalInGeneration: number) => {
    // These calculations position family members in concentric circles
    // Each generation gets its own ring
    const baseRadius = 150; // Base radius for the sun chart
    const radiusIncrement = 100; // Increment per generation
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
      toast.info(`Add ${relationship} feature will be available soon!`);
    } else {
      toast.info("Add family member feature will be available soon!");
    }
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
          <Button 
            onClick={() => handleAddFamilyMember()}
            size="sm" 
            className="bg-uganda-red text-white hover:bg-uganda-red/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Family Member
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <div className="relative min-h-[700px] w-full">
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
                        shadow-lg relative hover:shadow-xl transition-shadow w-32 h-32 flex flex-col items-center justify-center`}
                        id={`member-${centralPerson.id}`}
                      >
                        <div className="font-bold text-[#333333] text-center">{centralPerson.name}</div>
                        <div className="text-xs text-gray-500 text-center">{centralPerson.relationship || "You"}</div>
                        {centralPerson.isElder && (
                          <Badge className="absolute -top-2 -right-2 bg-uganda-red text-white">Elder</Badge>
                        )}
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
                              className={`absolute tree-node bg-white p-3 rounded-md border-2 cursor-pointer
                              ${member.isElder ? 'border-uganda-red bg-uganda-yellow/10' : 'border-gray-200'} 
                              shadow-sm hover:shadow-md transition-shadow`}
                              style={{
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                zIndex: 5
                              }}
                              onClick={() => setPrincipalPerson(member.id)}
                              id={`member-${member.id}`}
                            >
                              <div className="font-medium text-[#333333]">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.relationship}</div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                {member.birthYear && (
                                  <span>b. {member.birthYear}</span>
                                )}
                                {member.deathYear && (
                                  <>
                                    <span>-</span>
                                    <span>d. {member.deathYear}</span>
                                  </>
                                )}
                              </div>
                              {member.isElder && (
                                <Badge className="absolute -top-2 -right-2 bg-uganda-red text-white">Elder</Badge>
                              )}

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
                  const baseRadius = 150;
                  const radiusIncrement = 100;
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
                    className="absolute tree-node bg-gray-100 p-2 rounded-md border-2 border-dashed border-gray-300 cursor-pointer hover:bg-uganda-yellow/10 hover:border-uganda-yellow transition-colors"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px)`,
                      zIndex: 5
                    }}
                    onClick={() => handleAddFamilyMember(placeholder.relationship)}
                  >
                    <div className="text-sm font-medium text-gray-500 flex items-center">
                      <Plus className="h-3 w-3 mr-1" />
                      Add {placeholder.relationship}
                    </div>
                    
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
    </div>
  );
};

export default FamilyTreeDisplay;
