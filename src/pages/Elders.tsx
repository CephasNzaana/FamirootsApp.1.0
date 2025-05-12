
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Award, Search, Filter, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClanElder } from '@/types';
import { ugandaTribesData } from '@/data/ugandaTribesClanData';

const Elders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTribe, setSelectedTribe] = useState<string>('');
  const [selectedClan, setSelectedClan] = useState<string>('');
  const [elders, setElders] = useState<ClanElder[]>([]);
  const [filteredElders, setFilteredElders] = useState<ClanElder[]>([]);
  const [page, setPage] = useState(1);
  const eldersPerPage = 8;
  
  // Extract all elders from the Uganda tribes data
  useEffect(() => {
    const allElders: ClanElder[] = [];
    
    ugandaTribesData.forEach(tribe => {
      tribe.clans.forEach(clan => {
        if (clan.elders) {
          const clanElders = clan.elders.map(elder => ({
            ...elder,
            clanName: clan.name,
          }));
          allElders.push(...clanElders);
        }
      });
    });
    
    setElders(allElders);
    setFilteredElders(allElders);
  }, []);
  
  // Filter elders based on search query and selected tribe/clan
  useEffect(() => {
    let filtered = [...elders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(elder => 
        elder.name.toLowerCase().includes(query) || 
        (elder.significance && elder.significance.toLowerCase().includes(query))
      );
    }
    
    if (selectedTribe) {
      const tribe = ugandaTribesData.find(t => t.id === selectedTribe);
      if (tribe) {
        const clanIds = tribe.clans.map(clan => clan.id);
        filtered = filtered.filter(elder => clanIds.includes(elder.clanId));
      }
    }
    
    if (selectedClan) {
      filtered = filtered.filter(elder => elder.clanId === selectedClan);
    }
    
    setFilteredElders(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedTribe, selectedClan, elders]);
  
  // Get available clans based on selected tribe
  const getAvailableClans = () => {
    if (!selectedTribe) return [];
    const tribe = ugandaTribesData.find(t => t.id === selectedTribe);
    return tribe ? tribe.clans : [];
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredElders.length / eldersPerPage);
  const currentElders = filteredElders.slice(
    (page - 1) * eldersPerPage,
    page * eldersPerPage
  );
  
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold mb-2">Clan Elders</h1>
      <p className="text-gray-600 mb-6">
        Explore clan elders from across Ugandan tribes and learn about their historical significance.
      </p>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search elders by name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedTribe} onValueChange={setSelectedTribe}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tribe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tribes</SelectItem>
              {ugandaTribesData.map(tribe => (
                <SelectItem key={tribe.id} value={tribe.id}>
                  {tribe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedClan} 
            onValueChange={setSelectedClan}
            disabled={!selectedTribe}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedTribe ? "Select a clan" : "Select a tribe first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Clans</SelectItem>
              {getAvailableClans().map(clan => (
                <SelectItem key={clan.id} value={clan.id}>
                  {clan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="grid">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center text-sm">
            <span className="text-gray-500">
              Showing {currentElders.length} of {filteredElders.length} elders
            </span>
          </div>
        </div>
        
        <TabsContent value="grid">
          {currentElders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentElders.map(elder => (
                <Card key={elder.id} className="overflow-hidden">
                  <CardHeader className="bg-uganda-yellow/10 pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {elder.clanName || "Unknown Clan"}
                      </Badge>
                      <Badge 
                        className={`${
                          elder.verificationScore > 80 ? 'bg-green-600' : 
                          elder.verificationScore > 50 ? 'bg-amber-500' : 
                          'bg-red-500'
                        }`}
                      >
                        {elder.verificationScore}% Verified
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{elder.name}</CardTitle>
                    <CardDescription>{elder.approximateEra}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {elder.significance || "No additional information available about this elder."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" className="w-full text-uganda-red border-uganda-red hover:bg-uganda-red/5">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Award className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No Elders Found</h3>
              <p className="mt-1 text-gray-500">
                No elders match your current search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          {currentElders.length > 0 ? (
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elder
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Era
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentElders.map(elder => (
                    <tr key={elder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{elder.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{elder.clanName || "Unknown Clan"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{elder.approximateEra}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          className={`${
                            elder.verificationScore > 80 ? 'bg-green-600' : 
                            elder.verificationScore > 50 ? 'bg-amber-500' : 
                            'bg-red-500'
                          }`}
                        >
                          {elder.verificationScore}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" className="text-uganda-red hover:bg-uganda-red/5">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Award className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No Elders Found</h3>
              <p className="mt-1 text-gray-500">
                No elders match your current search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            
            <div className="text-sm text-gray-600 mx-4">
              Page {page} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Elders;
