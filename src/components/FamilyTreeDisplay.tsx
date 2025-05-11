
import { useState } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { User, Calendar, Heart } from "lucide-react";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

const FamilyTreeDisplay = ({ tree }: FamilyTreeDisplayProps) => {
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

  // Build parent-child relationships for visualization
  const familyConnections: {parent: string, child: string}[] = [];
  tree.members.forEach(member => {
    if (member.parentId) {
      familyConnections.push({
        parent: member.parentId,
        child: member.id
      });
    }
  });
  
  // Find a member by ID
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
    
    return member.relationship;
  };

  return (
    <Card className="w-full bg-white shadow-md border border-gray-200">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <CardTitle className="text-xl font-medium text-gray-700">
          {tree.surname} Family Tree - {tree.clan} clan, {tree.tribe}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-8">
          {generations.map(gen => (
            <div key={gen} className="w-full">
              <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">
                Generation {gen}
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {membersByGeneration[gen].map(member => (
                  <HoverCard key={member.id}>
                    <HoverCardTrigger asChild>
                      <div 
                        className={`tree-node bg-white p-3 rounded-md border-2 cursor-pointer
                        ${member.isElder ? 'border-[#1EAEDB] bg-[#F1F0FB]/30' : 'border-gray-200'} 
                        shadow-sm relative hover:shadow-md transition-shadow`}
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
                          <Badge className="absolute -top-2 -right-2 bg-[#1EAEDB] text-white">Elder</Badge>
                        )}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 p-4 border border-gray-200 shadow-lg">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-[#333333]">{member.name}</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-[#1EAEDB]" />
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
                            <Heart className="h-4 w-4 text-[#ea384c]" />
                            <span>Living</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                          {getRelationshipDescription(member)}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTreeDisplay;
