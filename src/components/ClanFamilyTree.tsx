
import React from "react";
import { ClanElder, Clan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  // For demonstration, we'll generate consistent fictitious relationships between elders
  const getRelationships = (elders: ClanElder[]): ElderRelations => {
    if (elders.length <= 1) {
      return {};
    }

    const relationships: ElderRelations = {};
    
    // Create some relationship patterns based on elder positions in the array
    const relationTypes = [
      "Brother of", "Cousin of", "Uncle of", "Nephew of", 
      "Grand Uncle of", "Father of", "Son of", "Grandfather of", 
      "Grandson of", "Great Uncle of", "Distant Cousin of"
    ];
    
    // Generate a deterministic relationship based on elder IDs
    elders.forEach((elder, index) => {
      if (index > 0) {
        // Create a relationship with a previous elder
        const relatedIndex = (index % 2 === 0) ? 0 : index - 1;
        const relatedElder = elders[relatedIndex];
        
        // Select relationship type based on index
        const relationIndex = (index + relatedIndex) % relationTypes.length;
        const relation = relationTypes[relationIndex];
        
        relationships[elder.id] = {
          relation,
          relatedToId: relatedElder.id
        };
      }
    });
    
    return relationships;
  };
  
  const elderRelationships = getRelationships(clan.elders);

  return (
    <Card className="w-full bg-white shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="text-xl">Elder Family Connections: {clan.name} Clan</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {clan.elders.map((elder) => {
            const relationship = elderRelationships[elder.id];
            const relatedElder = relationship?.relatedToId 
              ? clan.elders.find(e => e.id === relationship.relatedToId) 
              : null;
              
            return (
              <div 
                key={elder.id} 
                className="p-4 border-l-4 border-uganda-yellow bg-white rounded-lg shadow-sm"
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
                
                {elder.notes && (
                  <p className="mt-2 text-sm text-gray-600 italic">{elder.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClanFamilyTree;
