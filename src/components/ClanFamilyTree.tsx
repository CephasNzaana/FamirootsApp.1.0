// src/components/ClanFamilyTree.tsx

import React, { useMemo } from 'react';
import { Clan, ClanElder, Tradition, FamilyTree as FamilyTreeType, FamilyMember } from '@/types'; // Ensure FamilyTreeType and FamilyMember are imported
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Landmark, BookOpen, Award, GitTree } from 'lucide-react'; // Added GitTree
import FamilyTreeDisplay from '@/components/FamilyTreeDisplay'; // Import the main tree display component

interface ClanFamilyTreeProps {
  clan: Clan;
}

// Helper function to calculate generations for a flat list of members with parentIds
const calculateGenerations = (members: Omit<FamilyMember, 'generation'>[]): FamilyMember[] => {
  const membersWithGenerations: FamilyMember[] = [];
  const memberMap: Record<string, Omit<FamilyMember, 'generation'> & { tempGeneration?: number }> = {};

  members.forEach(m => {
    memberMap[m.id] = { ...m };
  });

  const getGeneration = (memberId: string): number => {
    const member = memberMap[memberId];
    if (!member) return -1000; // Should not happen if data is consistent
    if (typeof member.tempGeneration === 'number') return member.tempGeneration;
    if (!member.parentId || !memberMap[member.parentId]) {
      member.tempGeneration = 0; // Root or parent not in this list
      return 0;
    }
    member.tempGeneration = getGeneration(member.parentId) + 1;
    return member.tempGeneration;
  };

  members.forEach(m => {
    membersWithGenerations.push({
      ...m,
      generation: getGeneration(m.id),
    });
  });
  
  // Normalize generations if the "root" was not truly 0 due to missing parent links
  const minGen = Math.min(...membersWithGenerations.map(m => m.generation).filter(g => typeof g === 'number'), 0);
  if (minGen < 0) { // This can happen if a "root" elder actually has a parentId pointing outside the list.
                    // For simplicity here, we'll just use the raw calculated values.
                    // A more robust solution might re-base all generations if minGen is not 0.
  }


  return membersWithGenerations.sort((a,b) => a.generation - b.generation);
};


const ClanFamilyTree: React.FC<ClanFamilyTreeProps> = ({ clan }) => {

  const elderFamilyTree = useMemo((): FamilyTreeType | null => {
    if (!clan.elders || clan.elders.length === 0) {
      return null;
    }

    // 1. Transform ClanElders to FamilyMember-like structure
    let preliminaryMembers: Omit<FamilyMember, 'generation'>[] = clan.elders.map(elder => ({
      id: elder.id,
      name: elder.name,
      gender: elder.gender,
      birthYear: elder.birthYear, // Use if available
      deathYear: elder.deathYear, // Use if available
      notes: elder.notes || elder.significance,
      parentId: elder.parentId,
      // FamilyTreeDisplay handles one spouseId. We'll pick the first if multiple.
      // And ensure spouseId also refers to an ID within this elder list.
      spouseId: elder.spouseIds?.find(spId => clan.elders.some(e => e.id === spId)) || undefined,
      isElder: true, // Mark them as elders for potential specific styling if added to FamilyTreeDisplay
      relationship: "Clan Elder" // Generic relationship
    }));

    // 2. Calculate generations
    const membersWithGenerations = calculateGenerations(preliminaryMembers);
    
    return {
      id: `${clan.id}-elders-tree`,
      surname: `${clan.name} Elders Lineage`,
      members: membersWithGenerations,
      tribe: clan.tribeName,
      clan: clan.name
    };
  }, [clan.elders, clan.id, clan.name, clan.tribeName]);

  return (
    <Card className="w-full bg-white shadow-xl rounded-lg border border-gray-200">
      <CardHeader className="bg-uganda-yellow/10 border-b border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            {clan.tribeName && <Badge className="mb-1 bg-uganda-red text-white text-xs px-2 py-0.5">{clan.tribeName}</Badge>}
            <CardTitle className="text-2xl md:text-3xl font-bold text-uganda-black">{clan.name} Clan</CardTitle>
            {clan.totem && <p className="text-sm text-gray-600">Totem: {clan.totem}</p>}
          </div>
          <div className="mt-2 sm:mt-0 p-3 rounded-full bg-uganda-yellow/20 self-start sm:self-center">
            <Landmark size={28} className="text-uganda-black" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 p-4 md:p-6">
        {clan.description && (
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-xl mb-2 text-uganda-black">About the Clan</h3>
            <p className="text-gray-700 leading-relaxed">{clan.description}</p>
          </div>
        )}

        <Tabs defaultValue="elders_tree" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="elders_tree" className="flex items-center justify-center gap-2 data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md px-3 py-2 text-sm">
              <GitTree size={16} /> Elders Tree
            </TabsTrigger>
            <TabsTrigger value="elders_list" className="flex items-center justify-center gap-2 data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md px-3 py-2 text-sm">
              <Award size={16} /> Elders List
            </TabsTrigger>
            <TabsTrigger value="traditions" className="flex items-center justify-center gap-2 data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md px-3 py-2 text-sm">
              <BookOpen size={16} /> Traditions
            </TabsTrigger>
            <TabsTrigger value="families" className="flex items-center justify-center gap-2 data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md px-3 py-2 text-sm">
              <Users size={16} /> Families
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elders_tree">
            {elderFamilyTree && elderFamilyTree.members.length > 0 ? (
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 overflow-x-auto">
                <FamilyTreeDisplay 
                  tree={elderFamilyTree} 
                  onTreeUpdate={() => { /* Elder tree is read-only for now */ }} 
                  // zoomLevel={0.7} // Optional: Set a default zoom for elder trees
                />
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <GitTree size={40} className="mx-auto mb-4 opacity-20" />
                <p>No elder relationship data available to display a tree for this clan.</p>
                <p className="text-xs mt-1">Ensure elders have parent/spouse IDs defined in the data.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="elders_list">
            {clan.elders && clan.elders.length > 0 ? (
              <div className="space-y-4">
                {clan.elders.map((elder: ClanElder) => (
                  <div key={elder.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-uganda-black">{elder.name} {elder.gender ? `(${elder.gender})` : ''}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{elder.approximateEra}</p>
                      </div>
                      <Badge className={`${elder.verificationScore > 80 ? 'bg-green-100 text-green-700 border-green-300' : elder.verificationScore > 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-red-100 text-red-700 border-red-300'} border text-xs`}>
                        {elder.verificationScore}% Verified
                      </Badge>
                    </div>
                    {elder.significance && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-sm text-gray-700 italic">"{elder.significance}"</p>
                      </>
                    )}
                     {elder.notes && <p className="text-xs text-gray-600 mt-2"><span className="font-medium">Notes:</span> {elder.notes}</p>}
                     <div className="mt-3 text-sm">
                       <span className="text-gray-500 mr-2">Connected Families:</span>
                       <span className="font-medium text-uganda-black">{Array.isArray(elder.familyUnits) ? elder.familyUnits.join(', ') : (elder.familyUnits || 0)}</span>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Award size={40} className="mx-auto mb-4 opacity-20" />
                <p>No clan elders have been recorded yet for this clan.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="traditions">
            {clan.traditions && clan.traditions.length > 0 ? (
              <div className="space-y-4">
                {clan.traditions.map((tradition: Tradition) => (
                  <div key={tradition.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg text-uganda-black">{tradition.name}</h4>
                      <Badge className={`${tradition.stillPracticed ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-200 text-gray-700 border-gray-300'} border text-xs`}>
                        {tradition.stillPracticed ? 'Still Practiced' : 'Historical'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-1 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs border-uganda-yellow text-uganda-yellow">{tradition.category}</Badge>
                      <Badge variant="outline" className="text-xs border-uganda-red text-uganda-red">{tradition.importance}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{tradition.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <BookOpen size={40} className="mx-auto mb-4 opacity-20" />
                <p>No traditions have been recorded for this clan yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="families">
            <div className="text-center py-10 text-gray-500">
              <Users size={40} className="mx-auto mb-4 opacity-20" />
              <p>{clan.families ? `${clan.families} known families are connected to this clan.` : 'No specific family count has been connected to this clan yet.'}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClanFamilyTree;
