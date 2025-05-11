import React, { useState } from "react";
import { ClanElder, Clan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { User, Calendar, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [centralElder, setCentralElder] = useState<string | null>(
    clan.elders.length > 0 ? clan.elders[0].id : null
  );
  
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
  
  // Function to calculate the position for a node in the sun chart
  const calculateNodePosition = (index: number, total: number, isCentral: boolean = false) => {
    if (isCentral) return { x: 0, y: 0 };
    
    // These calculations position elders in a circle around the central elder
    const radius = 200; // Radius for the circle
    
    // Calculate the angle based on the index and total members
    const angleStep = (2 * Math.PI) / total;
    const angle = index * angleStep;
    
    // Convert polar coordinates to Cartesian coordinates
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    return { x, y };
  };

  const centralElderObj = clan.elders.find(elder => elder.id === centralElder);
  const otherElders = clan.elders.filter(elder => elder.id !== centralElder);

  if (clan.elders.length === 0) {
    return (
      <Card className="w-full bg-white shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">No Elders Found</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center p-12">
            <p className="text-gray-500">No elder information available for this clan.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="relative min-h-[500px] w-full">
          {/* Sun chart container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Central elder */}
            {centralElderObj && (
              <div className="absolute z-10">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div 
                      className="p-4 border-4 border-uganda-red rounded-full bg-uganda-yellow/10 shadow-lg hover:shadow-xl transition-shadow w-32 h-32 flex flex-col items-center justify-center cursor-pointer"
                    >
                      <div className="font-bold text-center">{centralElderObj.name}</div>
                      <div className="text-xs text-gray-600 text-center">{centralElderObj.approximateEra}</div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{centralElderObj.name}</h4>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-uganda-yellow" />
                        <span>{centralElderObj.approximateEra}</span>
                      </div>
                      
                      {centralElderObj.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{centralElderObj.notes}</p>
                      )}
                      
                      {elderRelationships[centralElderObj.id]?.relatedToId && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <span className="block font-medium">Family Connection:</span>
                          <span>
                            {elderRelationships[centralElderObj.id].relation} {
                              clan.elders.find(e => e.id === elderRelationships[centralElderObj.id].relatedToId)?.name
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
            
            {/* Draw dashed circle */}
            <div 
              className="rounded-full border border-dashed border-gray-300 absolute"
              style={{
                width: `400px`,
                height: `400px`,
                opacity: 0.5
              }}
            />
            
            {/* Other elders */}
            {otherElders.map((elder, index) => {
              const position = calculateNodePosition(index, otherElders.length);
              return (
                <HoverCard key={elder.id}>
                  <HoverCardTrigger asChild>
                    <div 
                      className="absolute p-3 border-2 border-uganda-red bg-white rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        zIndex: 5
                      }}
                      onClick={() => setCentralElder(elder.id)}
                    >
                      <div className="font-medium">{elder.name}</div>
                      <div className="text-xs text-gray-500">{elder.approximateEra}</div>
                      
                      {elderRelationships[elder.id] && centralElderObj && elderRelationships[elder.id].relatedToId === centralElderObj.id && (
                        <div className="mt-1 text-xs bg-gray-100 p-1 rounded-sm">
                          {elderRelationships[elder.id].relation} {centralElderObj.name}
                        </div>
                      )}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 z-20">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{elder.name}</h4>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-uganda-yellow" />
                        <span>{elder.approximateEra}</span>
                      </div>
                      
                      {elder.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{elder.notes}</p>
                      )}
                      
                      {elderRelationships[elder.id] && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <span className="block font-medium">Family Connection:</span>
                          <span>
                            {elderRelationships[elder.id].relation} {
                              clan.elders.find(e => e.id === elderRelationships[elder.id].relatedToId)?.name
                            }
                          </span>
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2 border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                        onClick={() => setCentralElder(elder.id)}
                      >
                        Set as Central Elder
                      </Button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
            
            {/* Connection lines between related elders */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
              {otherElders.map((elder, index) => {
                if (elderRelationships[elder.id]?.relatedToId === centralElder) {
                  const position = calculateNodePosition(index, otherElders.length);
                  return (
                    <line 
                      key={`line-${elder.id}-${centralElder}`}
                      x1="0" 
                      y1="0" 
                      x2={position.x} 
                      y2={position.y}
                      stroke="#D90000" 
                      strokeWidth="1"
                      strokeDasharray="4"
                      opacity="0.6"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClanFamilyTree;
