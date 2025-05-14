// src/pages/Elders.tsx

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added AvatarImage
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Star, Users, Link2 } from "lucide-react"; // Added Link2
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { ClanElder } from "@/types"; // Ensure this imports the updated ClanElder type

const Elders = () => {
  const [selectedTribe, setSelectedTribe] = useState<string>("");
  const [selectedClan, setSelectedClan] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [elders, setElders] = useState<ClanElder[]>([]);
  const [filteredElders, setFilteredElders] = useState<ClanElder[]>([]);
  const [availableClans, setAvailableClans] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (selectedTribe && selectedClan) {
      const tribe = ugandaTribesData.find(t => t.name === selectedTribe);
      if (tribe) {
        const clan = tribe.clans.find(c => c.name === selectedClan);
        if (clan && clan.elders) {
          // Ensure all new fields are carried through. The spread operator already does this.
          const formattedElders = clan.elders.map(elder => ({
            ...elder,
            familyUnits: elder.familyUnits || [], // Keep this if it's still relevant
          }));
          setElders(formattedElders);
          setFilteredElders(formattedElders);
        } else {
          setElders([]);
          setFilteredElders([]);
        }
      }
    } else {
        setElders([]);
        setFilteredElders([]);
    }
  }, [selectedTribe, selectedClan]);

  useEffect(() => {
    if (selectedTribe) {
      const tribe = ugandaTribesData.find(t => t.name === selectedTribe);
      if (tribe) {
        setAvailableClans(tribe.clans.map(c => ({ id: c.id, name: c.name })));
      } else {
        setAvailableClans([]);
      }
      setSelectedClan(""); // Reset clan when tribe changes
    } else {
      setAvailableClans([]);
      setSelectedClan("");
    }
  }, [selectedTribe]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredElders(elders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = elders.filter(elder => 
        elder.name.toLowerCase().includes(query) || 
        (elder.approximateEra && elder.approximateEra.toLowerCase().includes(query)) ||
        (elder.notes && elder.notes.toLowerCase().includes(query)) ||
        (elder.significance && elder.significance.toLowerCase().includes(query))
      );
      setFilteredElders(filtered);
    }
  }, [searchQuery, elders]);

  // Helper to get related elder's name
  const getElderNameById = (id: string): string | undefined => {
    const found = elders.find(e => e.id === id); // Search in the current list of loaded elders for the clan
    return found?.name;
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-uganda-black">
      <Header onLogin={() => {}} onSignup={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-uganda-black mb-4">Clan Elders</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover and explore the elders who serve as important anchors in Ugandan family lineages and clan structures, and see their connections.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="md:w-1/3">
              <Card className="bg-white shadow-lg border-gray-200 rounded-xl">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="text-xl font-semibold text-uganda-black flex items-center gap-2">
                    <Filter className="h-5 w-5 text-uganda-yellow" />
                    Filter Elders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="tribe" className="text-sm font-medium text-gray-700">Select Tribe</Label>
                    <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                      <SelectTrigger className="w-full mt-1 bg-white border-gray-300">
                        <SelectValue placeholder="Select a tribe" />
                      </SelectTrigger>
                      <SelectContent>
                        {ugandaTribesData.map(tribe => (
                          <SelectItem key={tribe.id} value={tribe.name}>
                            {tribe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="clan" className="text-sm font-medium text-gray-700">Select Clan</Label>
                    <Select value={selectedClan} onValueChange={setSelectedClan} disabled={!selectedTribe || availableClans.length === 0}>
                      <SelectTrigger className="w-full mt-1 bg-white border-gray-300">
                        <SelectValue placeholder={selectedTribe ? (availableClans.length > 0 ? "Select a clan" : "No clans available") : "Select a tribe first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClans.map(clan => (
                          <SelectItem key={clan.id} value={clan.name}>
                            {clan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Elders</Label>
                    <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="search" 
                          placeholder="Search by name, era, notes..." 
                          value={searchQuery} 
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white border-gray-300"
                        />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-2/3">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-3 bg-uganda-yellow/10 rounded-lg p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md">All Elders</TabsTrigger>
                  <TabsTrigger value="featured" className="data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md">Featured</TabsTrigger>
                  <TabsTrigger value="recent" className="data-[state=active]:bg-uganda-yellow data-[state=active]:text-uganda-black data-[state=active]:shadow-md rounded-md">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  {filteredElders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredElders.map(elder => {
                        const parentName = elder.parentId ? getElderNameById(elder.parentId) : null;
                        const spouseNames = elder.spouseIds?.map(id => getElderNameById(id)).filter(name => name) || [];

                        return (
                          <Card key={elder.id} className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4 px-4 bg-gray-50 border-b border-gray-200">
                              <div>
                                <CardTitle className="text-lg font-semibold text-uganda-black">{elder.name}</CardTitle>
                                <p className="text-xs text-gray-500">{elder.approximateEra} {elder.gender ? `(${elder.gender})`: ''}</p>
                              </div>
                              <Badge variant={elder.verificationScore > 80 ? 'default' : 'secondary'}
                                     className={`${elder.verificationScore > 80 ? 'bg-green-600 text-white' : elder.verificationScore > 60 ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} text-xs`}
                              >
                                {elder.verificationScore}% Verified
                              </Badge>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                              {elder.significance && <p className="text-sm text-gray-700 italic">"{elder.significance}"</p>}
                              {elder.notes && <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {elder.notes}</p>}
                              
                              {(parentName || spouseNames.length > 0) && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
                                  <h4 className="font-medium text-gray-700 flex items-center gap-1"><Link2 size={12}/>Relationships:</h4>
                                  {parentName && (
                                    <p className="text-gray-600">Parent: <span className="font-semibold text-uganda-red">{parentName}</span></p>
                                  )}
                                  {spouseNames.length > 0 && (
                                    <p className="text-gray-600">Spouse(s): <span className="font-semibold text-uganda-red">{spouseNames.join(', ')}</span></p>
                                  )}
                                </div>
                              )}
                              {/* <div className="mt-1">
                                <Badge className="bg-uganda-yellow/80 text-uganda-black text-xs">{selectedClan || "Clan"}</Badge>
                              </div> */}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Elders Found</h3>
                      <p>
                        {selectedClan ? "No elders match your current search or filter for this clan." : "Please select a tribe and clan to view elders."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="featured" className="mt-4">
                  <div className="text-center py-12">
                    <Star className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Featured Elders Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Featured elders will be highlighted here based on their contributions and significance within their clans.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="recent" className="mt-4">
                  <div className="text-center py-12">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Recent Elders</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Recently added elders will appear here. Stay tuned for updates!
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Elders;
