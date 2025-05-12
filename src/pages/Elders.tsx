import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Star, Users } from "lucide-react";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { ClanElder } from "@/types";

const Elders = () => {
  const [selectedTribe, setSelectedTribe] = useState<string>("");
  const [selectedClan, setSelectedClan] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [elders, setElders] = useState<ClanElder[]>([]);
  const [filteredElders, setFilteredElders] = useState<ClanElder[]>([]);
  const [availableClans, setAvailableClans] = useState<{ id: string; name: string }[]>([]);

  // Load elders when clan is selected
  useEffect(() => {
    if (selectedTribe && selectedClan) {
      const tribe = ugandaTribesData.find(t => t.name === selectedTribe);
      if (tribe) {
        const clan = tribe.clans.find(c => c.name === selectedClan);
        if (clan && clan.elders) {
          // Transform elders to match our ClanElder type
          const formattedElders = clan.elders.map(elder => ({
            ...elder,
            familyUnits: elder.familyUnits || []
          }));
          setElders(formattedElders);
          setFilteredElders(formattedElders);
        } else {
          setElders([]);
          setFilteredElders([]);
        }
      }
    }
  }, [selectedTribe, selectedClan]);

  // Update available clans when tribe is selected
  useEffect(() => {
    if (selectedTribe) {
      const tribe = ugandaTribesData.find(t => t.name === selectedTribe);
      if (tribe) {
        setAvailableClans(tribe.clans.map(c => ({ id: c.id, name: c.name })));
      } else {
        setAvailableClans([]);
      }
      setSelectedClan("");
    } else {
      setAvailableClans([]);
      setSelectedClan("");
    }
  }, [selectedTribe]);

  // Filter elders based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredElders(elders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = elders.filter(elder => 
        elder.name.toLowerCase().includes(query) || 
        (elder.approximateEra && elder.approximateEra.toLowerCase().includes(query))
      );
      setFilteredElders(filtered);
    }
  }, [searchQuery, elders]);

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header onLogin={() => {}} onSignup={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-uganda-black mb-4">Clan Elders</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover and explore the elders who serve as important anchors in Ugandan family lineages and clan structures
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="md:w-1/3">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <Search className="h-5 w-5 text-uganda-yellow" />
                    Search & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tribe">Select Tribe</Label>
                      <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                        <SelectTrigger className="w-full">
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
                      <Label htmlFor="clan">Select Clan</Label>
                      <Select value={selectedClan} onValueChange={setSelectedClan} disabled={!selectedTribe}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={selectedTribe ? "Select a clan" : "Select a tribe first"} />
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
                      <Label htmlFor="search">Search Elders</Label>
                      <Input 
                        id="search" 
                        placeholder="Search by name or era" 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-2/3">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="all" className="data-[state=active]:bg-uganda-yellow/10 data-[state=active]:text-uganda-black">All Elders</TabsTrigger>
                  <TabsTrigger value="featured" className="data-[state=active]:bg-uganda-yellow/10 data-[state=active]:text-uganda-black">Featured</TabsTrigger>
                  <TabsTrigger value="recent" className="data-[state=active]:bg-uganda-yellow/10 data-[state=active]:text-uganda-black">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredElders.map(elder => (
                      <Card key={elder.id} className="bg-white shadow-md border border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                          <CardTitle className="text-sm font-medium">{elder.name}</CardTitle>
                          <Star className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gray-500 text-white">{elder.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-gray-500">{elder.approximateEra}</p>
                              <Badge className="bg-uganda-yellow/20 text-uganda-black mt-1">{selectedClan}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
