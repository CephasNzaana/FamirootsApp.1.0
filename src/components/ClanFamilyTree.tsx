
import React from 'react';
import { Clan, ClanElder, Tradition } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Landmark, BookOpen, Award } from 'lucide-react';

interface ClanFamilyTreeProps {
  clan: Clan;
}

const ClanFamilyTree: React.FC<ClanFamilyTreeProps> = ({ clan }) => {
  return (
    <Card className="w-full">
      <CardHeader className="bg-ugandan-yellow/10">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="mb-2 bg-ugandan-red text-white">{clan.tribeName || 'Tribe'}</Badge>
            <CardTitle className="text-2xl">{clan.name} Clan</CardTitle>
          </div>
          <div className="p-3 rounded-full bg-ugandan-yellow/20">
            <Landmark size={24} className="text-ugandan-black" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {clan.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">About the Clan</h3>
            <p className="text-gray-700">{clan.description}</p>
          </div>
        )}

        <Tabs defaultValue="elders">
          <TabsList className="mb-4">
            <TabsTrigger value="elders" className="flex items-center gap-2">
              <Award size={16} />
              Clan Elders
            </TabsTrigger>
            <TabsTrigger value="traditions" className="flex items-center gap-2">
              <BookOpen size={16} />
              Traditions
            </TabsTrigger>
            <TabsTrigger value="families" className="flex items-center gap-2">
              <Users size={16} />
              Families
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elders">
            {clan.elders && clan.elders.length > 0 ? (
              <div className="space-y-4">
                {clan.elders.map((elder: ClanElder) => (
                  <div key={elder.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg">{elder.name}</h4>
                      <Badge className={`${elder.verificationScore > 80 ? 'bg-green-600' : elder.verificationScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {elder.verificationScore}% Verified
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{elder.approximateEra}</div>
                    
                    {elder.significance && (
                      <>
                        <Separator className="my-3" />
                        <p className="text-sm">{elder.significance}</p>
                      </>
                    )}
                    
                    <div className="mt-3 text-sm">
                      <span className="text-gray-500 mr-2">Connected Families:</span>
                      <span className="font-medium">{elder.familyUnits?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Award size={40} className="mx-auto mb-4 opacity-20" />
                <p>No clan elders have been recorded yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="traditions">
            {clan.traditions && clan.traditions.length > 0 ? (
              <div className="space-y-4">
                {clan.traditions.map((tradition: Tradition) => (
                  <div key={tradition.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg">{tradition.name}</h4>
                      <Badge className={`${tradition.stillPracticed ? 'bg-green-600' : 'bg-gray-500'}`}>
                        {tradition.stillPracticed ? 'Still Practiced' : 'Historical'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{tradition.category}</Badge>
                      <Badge variant="outline">{tradition.importance}</Badge>
                    </div>
                    
                    <Separator className="my-3" />
                    <p className="text-sm">{tradition.description}</p>
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
              <p>{clan.families ? `${clan.families} families are connected to this clan.` : 'No families have been connected to this clan yet.'}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClanFamilyTree;
