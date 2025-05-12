
import React, { useState, useRef } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, User, Users, Plus, Grid, List, GitBranch } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";

interface FamilyTreeMultiViewProps {
  tree: FamilyTree;
}

const FamilyTreeMultiView: React.FC<FamilyTreeMultiViewProps> = ({ tree }) => {
  const [viewType, setViewType] = useState<"tree" | "pedigree" | "list">("tree");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  // Group members by generation for list view
  const getMembersByGeneration = () => {
    const result: Record<number, FamilyMember[]> = {};
    
    tree.members.forEach(member => {
      if (!result[member.generation]) {
        result[member.generation] = [];
      }
      result[member.generation].push(member);
    });
    
    // Sort generations
    return Object.keys(result)
      .map(Number)
      .sort((a, b) => a - b)
      .map(gen => ({
        generation: gen,
        members: result[gen].sort((a, b) => a.name.localeCompare(b.name))
      }));
  };

  // Pedigree view specific methods
  const getAncestors = () => {
    // Find main person (generation 0 or marked as self)
    const mainPerson = tree.members.find(m => 
      m.relationship === 'self' || 
      m.relationship === 'principal' || 
      m.generation === 0
    );
    
    if (!mainPerson) return [];
    
    // Find all ancestors (generations below 0)
    return tree.members
      .filter(m => m.generation < 0)
      .sort((a, b) => b.generation - a.generation); // Sort by generation oldest first
  };

  const getDescendants = () => {
    // Find main person (generation 0 or marked as self)
    const mainPerson = tree.members.find(m => 
      m.relationship === 'self' || 
      m.relationship === 'principal' || 
      m.generation === 0
    );
    
    if (!mainPerson) return [];
    
    // Find all descendants (generations above 0)
    return tree.members
      .filter(m => m.generation > 0)
      .sort((a, b) => a.generation - b.generation); // Sort by generation youngest last
  };

  // Render people in pedigree layout
  const renderPedigreeView = () => {
    const ancestors = getAncestors();
    const mainPerson = tree.members.find(m => 
      m.relationship === 'self' || 
      m.relationship === 'principal' || 
      m.generation === 0
    );
    const descendants = getDescendants();
    
    if (!mainPerson) {
      return <div className="text-center p-10">No main person found</div>;
    }
    
    return (
      <div className="flex flex-col items-center space-y-8 py-4" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center top' }}>
        {/* Ancestors section */}
        {ancestors.length > 0 && (
          <div className="w-full">
            <h3 className="text-lg font-medium text-center mb-3 text-uganda-black">Ancestors</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {ancestors.map(ancestor => (
                <PersonCard key={ancestor.id} person={ancestor} />
              ))}
            </div>
          </div>
        )}
        
        {/* Main person section */}
        <div className="flex justify-center">
          <div className="relative">
            <PersonCard person={mainPerson} isMain={true} />
            
            {/* Vertical connecting line */}
            {(ancestors.length > 0 || descendants.length > 0) && (
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-uganda-black/20 -z-10 transform -translate-x-1/2"></div>
            )}
          </div>
        </div>
        
        {/* Descendants section */}
        {descendants.length > 0 && (
          <div className="w-full">
            <h3 className="text-lg font-medium text-center mb-3 text-uganda-black">Descendants</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {descendants.map(descendant => (
                <PersonCard key={descendant.id} person={descendant} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Person card component for pedigree view
  const PersonCard: React.FC<{person: FamilyMember, isMain?: boolean}> = ({person, isMain = false}) => {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div 
            className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer ${
              isMain 
                ? 'bg-uganda-yellow/20 border-uganda-yellow shadow-md min-w-[150px]' 
                : person.isElder 
                  ? 'bg-uganda-red/10 border-uganda-red shadow-sm min-w-[120px]' 
                  : 'bg-white border-gray-200 hover:border-uganda-yellow/50 shadow-sm min-w-[120px]'
            } transition-all`}
          >
            <div className={`rounded-full p-2 mb-2 ${isMain ? 'bg-uganda-yellow/50' : 'bg-gray-100'}`}>
              <User size={isMain ? 30 : 24} className="text-uganda-black" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm">{person.name}</div>
              <div className="text-xs text-gray-500">
                {person.birthYear}{person.deathYear ? ` - ${person.deathYear}` : ''}
              </div>
              <div className="text-xs mt-1">
                {person.relationship ? (
                  <Badge variant="outline" className="text-[10px] bg-gray-50">
                    {person.relationship}
                  </Badge>
                ) : null}
              </div>
            </div>
            {person.isElder && (
              <Badge className="mt-1 absolute -top-2 -right-2 bg-uganda-red text-white">Elder</Badge>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 p-4">
          <div className="space-y-2">
            <h4 className="font-semibold">{person.name}</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Relationship:</span>
                <span>{person.relationship || "Family Member"}</span>
              </div>
              {person.birthYear && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Born:</span>
                  <span>{person.birthYear}</span>
                </div>
              )}
              {person.deathYear && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Deceased:</span>
                  <span>{person.deathYear}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Generation:</span>
                <span>{person.generation === 0 ? 'Current' : person.generation < 0 ? `${Math.abs(person.generation)} up` : `${person.generation} down`}</span>
              </div>
              {person.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Gender:</span>
                  <span>{person.gender}</span>
                </div>
              )}
              {person.side && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Side:</span>
                  <span className="capitalize">{person.side}</span>
                </div>
              )}
              {person.isElder && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <Badge className="bg-uganda-red text-white">Clan Elder</Badge>
                </div>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // Render the list view
  const renderListView = () => {
    const generations = getMembersByGeneration();
    
    return (
      <div className="space-y-8" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
        {generations.map(gen => (
          <div key={gen.generation} className="border-t pt-6 first:border-0 first:pt-0">
            <h3 className="text-lg font-medium mb-4">
              {gen.generation === 0 
                ? "Current Generation" 
                : gen.generation < 0 
                  ? `${Math.abs(gen.generation)}${getOrdinalSuffix(Math.abs(gen.generation))} Generation Up`
                  : `${gen.generation}${getOrdinalSuffix(gen.generation)} Generation Down`}
            </h3>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gen.members.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{person.name}</div>
                            {person.isElder && (
                              <Badge className="bg-uganda-red text-white text-xs">Elder</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.relationship}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.birthYear || "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          person.status === 'deceased' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {person.status === 'deceased' 
                            ? `Deceased ${person.deathYear ? `(${person.deathYear})` : ''}` 
                            : 'Living'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.side ? person.side.charAt(0).toUpperCase() + person.side.slice(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10,
          k = num % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  };

  return (
    <div className="space-y-6">
      <FamilyTreeStats tree={tree} />
      
      <Card className="w-full bg-white shadow-md border border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50 flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-medium text-gray-700">
            {tree.surname} Family Tree - {tree.clan} clan, {tree.tribe}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="tree" onValueChange={(val) => setViewType(val as any)} className="mr-4">
              <TabsList>
                <TabsTrigger value="tree" className="flex items-center gap-1">
                  <Users size={14} /> Tree
                </TabsTrigger>
                <TabsTrigger value="pedigree" className="flex items-center gap-1">
                  <GitBranch size={14} /> Pedigree
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <List size={14} /> List
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              onClick={handleZoomOut} 
              size="sm" 
              className="rounded-full p-2 h-8 w-8"
              variant="outline"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleZoomIn} 
              size="sm" 
              className="rounded-full p-2 h-8 w-8"
              variant="outline"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => toast.info("Add Family Member feature will be available soon.")}
              size="sm" 
              className="bg-uganda-red text-white hover:bg-uganda-red/90 ml-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Family Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto" ref={containerRef}>
          {viewType === "tree" && (
            <FamilyTreeDisplay tree={tree} />
          )}
          
          {viewType === "pedigree" && renderPedigreeView()}
          
          {viewType === "list" && renderListView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyTreeMultiView;
