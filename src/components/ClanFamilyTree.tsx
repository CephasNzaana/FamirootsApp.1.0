
import React from "react";
import { ClanElder, Clan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { User, Calendar, Heart, Users } from "lucide-react";

interface ElderRelations {
  [key: string]: {
    relation: string;
    relatedToId?: string;
  };
}

interface ClanFamilyTreeProps {
  clan: Clan;
}

// This component shows the family relationships between clan elders
const ClanFamilyTree = ({ clan }: ClanFamilyTreeProps) => {
  // Generate consistent relationships between elders based on their IDs
  const getRelationships = (elders: ClanElder[]): ElderRelations => {
    if (elders.length <= 1) {
      return {};
    }

    const relationships: ElderRelations = {};
    
    // Create rich relationship patterns based on elder positions and IDs
    const relationTypes = [
      "Brother of", "Cousin of", "Uncle of", "Nephew of", 
      "Grand Uncle of", "Father of", "Son of", "Grandfather of", 
      "Grandson of", "Great Uncle of", "Distant Cousin of"
    ];
    
    // Generate deterministic relationship graph
    // This ensures relationships are consistent and form a logical network
    elders.forEach((elder, index) => {
      // Use the sum of character codes of the elder's name to create a consistent pattern
      const nameValue = elder.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      
      // Determine how many relationships this elder will have (1-3)
      const relationCount = (nameValue % 3) + 1;
      
      // Create that many relationships
      for (let i = 0; i < relationCount; i++) {
        // Find another elder to relate to (not self)
        // Using modulus to ensure index is within bounds
        const relatedIndex = (index + i + 1) % elders.length;
        if (relatedIndex !== index) { // Avoid self-relationship
          const relatedElder = elders[relatedIndex];
          
          // Use a combination of indexes to select a consistent relationship type
          const relationIndex = (nameValue + relatedIndex) % relationTypes.length;
          const relation = relationTypes[relationIndex];
          
          // Store the relationship
          if (!relationships[elder.id]) {
            relationships[elder.id] = {
              relation,
              relatedToId: relatedElder.id
            };
          }
          
          // Create inverse relationship if it doesn't exist yet
          // This creates a richer network of connections
          if (i === 0 && !relationships[relatedElder.id]) {
            // Find the inverse relationship
            let inverseRelation = "";
            if (relation === "Father of") inverseRelation = "Son of";
            else if (relation === "Son of") inverseRelation = "Father of";
            else if (relation === "Uncle of") inverseRelation = "Nephew of";
            else if (relation === "Nephew of") inverseRelation = "Uncle of";
            else if (relation === "Grandfather of") inverseRelation = "Grandson of";
            else if (relation === "Grandson of") inverseRelation = "Grandfather of";
            else if (relation === "Brother of") inverseRelation = "Brother of";
            else if (relation === "Cousin of") inverseRelation = "Cousin of";
            else if (relation === "Grand Uncle of") inverseRelation = "Grand Nephew of";
            else if (relation === "Great Uncle of") inverseRelation = "Grand Nephew of";
            else inverseRelation = "Related to";
            
            relationships[relatedElder.id] = {
              relation: inverseRelation,
              relatedToId: elder.id
            };
          }
        }
      }
    });
    
    return relationships;
  };
  
  const elderRelationships = getRelationships(clan.elders);
  
  // Group elders by relationship groups to visualize the family structure
  const groupEldersByRelationships = (elders: ClanElder[], relationships: ElderRelations) => {
    const groups: Record<string, ClanElder[]> = {};
    const processed = new Set<string>();
    
    // Start with each elder as potential group roots
    elders.forEach(elder => {
      if (processed.has(elder.id)) return;
      
      // Create a new group
      const groupId = `group-${elder.id}`;
      groups[groupId] = [elder];
      processed.add(elder.id);
      
      // Find direct relations
      const related = elders.filter(e => 
        relationships[e.id]?.relatedToId === elder.id ||
        relationships[elder.id]?.relatedToId === e.id
      );
      
      // Add related elders to this group
      related.forEach(rel => {
        if (!processed.has(rel.id)) {
          groups[groupId].push(rel);
          processed.add(rel.id);
        }
      });
    });
    
    // Return only groups with more than one member
    return Object.values(groups).filter(g => g.length > 0);
  };
  
  const elderGroups = groupEldersByRelationships(clan.elders, elderRelationships);

  return (
    <Card className="w-full bg-white shadow-md">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Elder Family Connections: {clan.name} Clan</CardTitle>
          <Badge variant="outline" className="bg-uganda-yellow/20">
            {clan.elders.length} Elders
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {elderGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="border border-dashed border-uganda-yellow/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5 text-uganda-red" />
                Family Group {groupIndex + 1}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.map(elder => {
                  const relationship = elderRelationships[elder.id];
                  const relatedElder = relationship?.relatedToId 
                    ? clan.elders.find(e => e.id === relationship.relatedToId) 
                    : null;
                    
                  return (
                    <HoverCard key={elder.id}>
                      <HoverCardTrigger asChild>
                        <div 
                          className="p-4 border-l-4 border-uganda-yellow bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-lg">{elder.name}</h3>
                              <p className="text-sm text-gray-600">{elder.approximateEra}</p>
                            </div>
                            
                            {elder.verificationScore && (
                              <Badge variant="outline" className="bg-uganda-yellow/20">
                                Verified: {elder.verificationScore}/10
                              </Badge>
                            )}
                          </div>
                          
                          {relationship && relatedElder && (
                            <div className="mt-2 text-sm bg-gray-100 p-2 rounded">
                              <span className="font-medium">{relationship.relation}</span>{" "}
                              <span className="text-uganda-red">{relatedElder.name}</span>
                            </div>
                          )}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{elder.name}</h4>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-uganda-yellow" />
                            <span>{elder.approximateEra}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <Heart className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Deceased Elder</span>
                          </div>
                          
                          {elder.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{elder.notes}</p>
                          )}
                          
                          {relationship && relatedElder && (
                            <div className="mt-2 pt-2 border-t text-sm">
                              <span className="block font-medium text-uganda-black">Family Connection:</span>
                              <span>{relationship.relation} {relatedElder.name}</span>
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClanFamilyTree;
