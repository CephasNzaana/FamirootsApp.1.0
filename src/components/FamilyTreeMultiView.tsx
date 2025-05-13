// src/components/FamilyTreeMultiView.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // TabsContent is used inline
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"; 
import { Badge } from "@/components/ui/badge"; 
import { ZoomIn, ZoomOut, User, Users, Plus, GitBranch, List, UserCircle2 } from "lucide-react"; 
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay"; // The updated visual version

interface FamilyTreeMultiViewProps {
  tree: FamilyTree; 
  onTreeDataUpdate?: (updatedTree: FamilyTree) => void; 
}

const FamilyTreeMultiView: React.FC<FamilyTreeMultiViewProps> = ({ tree: initialTreeData, onTreeDataUpdate }) => {
  const [currentTree, setCurrentTree] = useState<FamilyTree>(initialTreeData);
  const [viewType, setViewType] = useState<"tree" | "pedigree" | "list">("tree");
  const [zoomLevel, setZoomLevel] = useState<number>(0.8); 
  
  useEffect(() => {
    setCurrentTree(initialTreeData);
    console.log("FamilyTreeMultiView: Tree data updated", initialTreeData?.members?.length);
  }, [initialTreeData]);

  const handleTreeUpdateFromDisplay = useCallback((updatedTree: FamilyTree) => {
    setCurrentTree(updatedTree); 
    if (onTreeDataUpdate) {
      onTreeDataUpdate(updatedTree); 
    }
    toast.info("Tree view updated by internal action.");
  }, [onTreeDataUpdate]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3));

  // --- Helper functions from YOUR FamilyTreeMultiView.tsx ---
  const getMembersByGeneration = () => { 
    const result: Record<number, FamilyMember[]> = {};
    (currentTree.members || []).forEach(member => { // Add check for currentTree.members
        const gen = member.generation ?? 0;
        if (!result[gen]) result[gen] = [];
        result[gen].push(member);
    });
    return Object.keys(result).map(Number).sort((a, b) => a - b)
        .map(gen => ({
            generation: gen,
            members: result[gen].sort((a, b) => (a.name || "Z").localeCompare(b.name || "Z"))
        }));
  };

  const getAncestors = () => { 
    const mainPerson = (currentTree.members || []).find(m =>
        m.relationship?.toLowerCase() === 'self' ||
        m.relationship?.toLowerCase() === 'principal' ||
        m.generation === 0
    );
    if (!mainPerson) return [];
    return (currentTree.members || [])
        .filter(m => (m.generation ?? 0) < 0)
        .sort((a, b) => (b.generation ?? 0) - (a.generation ?? 0));
  };

  const getDescendants = () => { 
    const mainPerson = (currentTree.members || []).find(m =>
        m.relationship?.toLowerCase() === 'self' ||
        m.relationship?.toLowerCase() === 'principal' ||
        m.generation === 0
    );
    if (!mainPerson) return [];
    return (currentTree.members || [])
        .filter(m => (m.generation ?? 0) > 0)
        .sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0));
  };
  
  const getOrdinalSuffix = (num: number): string => { 
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Person card component for pedigree view - Corrected definition
  const PersonCard: React.FC<{person: FamilyMember, isMain?: boolean}> = ({person, isMain = false}) => {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div 
            className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer ${
              isMain 
                ? 'bg-uganda-yellow/20 border-uganda-yellow shadow-md min-w-[150px]' 
                : person.isElder 
                  ? 'bg-uganda-red/10 border-uganda-red shadow-sm min-w-[120px]' 
                  : 'bg-card border-border hover:border-uganda-yellow/50 shadow-sm min-w-[120px]'
            } transition-all`}
          >
            <div className={`rounded-full p-2 mb-2 ${isMain ? 'bg-uganda-yellow/50' : 'bg-muted'}`}>
              <User size={isMain ? 30 : 24} className={isMain ? "text-uganda-black" : "text-muted-foreground"} />
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm text-foreground">{person.name || "Unnamed"}</div>
              <div className="text-xs text-muted-foreground">
                {person.birthYear}{person.deathYear ? ` - ${person.deathYear}` : (person.status === 'deceased' ? ' (dec.)' : '')}
              </div>
              {person.relationship && (
                <div className="text-xs mt-1">
                  <Badge variant="outline" className="text-[10px] bg-background border-border text-muted-foreground">
                    {person.relationship}
                  </Badge>
                </div>
              )}
            </div>
            {person.isElder && (
              <Badge className="mt-1 absolute -top-2 -right-2 bg-uganda-red text-white text-[9px] px-1.5 py-0.5">Elder</Badge>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 p-3 text-xs shadow-xl bg-popover text-popover-foreground border-popover-border">
          <div className="space-y-2">
            <h4 className="font-semibold">{person.name || "Unnamed"}</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Relationship:</span> <span>{person.relationship || "N/A"}</span></div>
              {person.birthYear && <div className="flex justify-between"><span className="text-muted-foreground">Born:</span> <span>{person.birthYear}</span></div>}
              {person.deathYear && <div className="flex justify-between"><span className="text-muted-foreground">Died:</span> <span>{person.deathYear}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Generation:</span> <span>{person.generation === 0 ? 'Proband' : (person.generation ?? 0) < 0 ? `${Math.abs(person.generation ?? 0)} Up` : `${person.generation} Down`}</span></div>
              {person.gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span> <span className="capitalize">{person.gender}</span></div>}
              {person.side && <div className="flex justify-between"><span className="text-muted-foreground">Side:</span> <span className="capitalize">{person.side}</span></div>}
              {person.isElder && <div className="mt-2 pt-2 border-t border-border"><Badge className="bg-uganda-red text-white">Clan Elder</Badge></div>}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // Render people in pedigree layout - Corrected definition
  const renderPedigreeView = () => {
    const ancestors = getAncestors();
    const mainPerson = (currentTree.members || []).find(m => 
      m.relationship?.toLowerCase() === 'self' || 
      m.relationship?.toLowerCase() === 'principal' || 
      m.generation === 0
    );
    const descendants = getDescendants();
    
    if (!mainPerson) {
      return <div className="text-center p-10 text-muted-foreground">No main person (Self/Proband) found for Pedigree View.</div>;
    }
    
    return (
      <div className="flex flex-col items-center space-y-8 py-4"> {/* This div will be scaled by parent */}
        {ancestors.length > 0 && (
          <div className="w-full">
            <h3 className="text-lg font-medium text-center mb-3 text-foreground">Ancestors</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {ancestors.map(ancestor => (
                <PersonCard key={ancestor.id} person={ancestor} />
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-center">
          <div className="relative">
            <PersonCard person={mainPerson} isMain={true} />
            {(ancestors.length > 0 || descendants.length > 0) && (
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-border -z-10 transform -translate-x-1/2"></div>
            )}
          </div>
        </div>
        {descendants.length > 0 && (
          <div className="w-full">
            <h3 className="text-lg font-medium text-center mb-3 text-foreground">Descendants</h3>
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
  
  // Render the list view - Corrected definition
  const renderListView = () => {
    const generations = getMembersByGeneration();
    if (!generations || generations.length === 0 || generations.every(g => g.members.length === 0)) {
        return <div className="text-center p-10 text-muted-foreground">No members to display in List View.</div>;
    }
    
    return (
      <div className="space-y-8 p-4"> {/* This div will be scaled by parent */}
        {generations.map(gen => (
          <div key={gen.generation} className="border-t border-border pt-6 first:border-0 first:pt-0">
            <h3 className="text-lg font-medium mb-4 text-foreground">
              {gen.generation === 0 
                ? "Current Generation" 
                : (gen.generation ?? 0) < 0 
                  ? `${Math.abs(gen.generation ?? 0)}${getOrdinalSuffix(Math.abs(gen.generation ?? 0))} Generation Up`
                  : `${gen.generation}${getOrdinalSuffix(gen.generation ?? 0)} Generation Down`}
            </h3>
            <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Relationship</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Birth</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Side</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {(gen.members || []).map((person) => (
                    <tr key={person.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                            <User size={20} className="text-muted-foreground" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{person.name || "Unnamed"}</div>
                            {person.isElder && <Badge className="bg-uganda-red text-white text-xs">Elder</Badge>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{person.relationship || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{person.birthYear || "Unknown"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          person.status === 'deceased' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                        }`}>
                          {person.status === 'deceased' 
                            ? `Deceased ${person.deathYear ? `(${person.deathYear})` : ''}` 
                            : 'Living'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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

  return (
    <div className="space-y-4 flex flex-col h-full w-full text-foreground"> 
      <FamilyTreeStats tree={currentTree} />
      
      <Card className="w-full bg-card shadow-md border-border flex flex-col flex-grow overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 flex flex-row justify-between items-center shrink-0 p-3 md:p-4">
          <CardTitle className="text-lg md:text-xl font-medium text-foreground">
            {currentTree.surname || "Family"} Tree
            <span className="text-sm text-muted-foreground ml-2">({currentTree.clan || "N/A"} / {currentTree.tribe || "N/A"})</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={viewType} onValueChange={(val) => setViewType(val as "tree" | "pedigree" | "list")} className="mr-2">
              <TabsList>
                <TabsTrigger value="tree" className="text-xs px-2 py-1 h-auto md:text-sm md:px-3 md:py-1.5 md:h-9"><Users size={14} className="mr-1 md:mr-2"/>Tree</TabsTrigger>
                <TabsTrigger value="pedigree" className="text-xs px-2 py-1 h-auto md:text-sm md:px-3 md:py-1.5 md:h-9"><GitBranch size={14} className="mr-1 md:mr-2"/>Pedigree</TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-2 py-1 h-auto md:text-sm md:px-3 md:py-1.5 md:h-9"><List size={14} className="mr-1 md:mr-2"/>List</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleZoomOut} size="icon" variant="outline" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
            <Button onClick={handleZoomIn} size="icon" variant="outline" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
            <Button size="sm" className="bg-uganda-red text-white hover:bg-uganda-red/90 ml-1 h-8 px-3 text-xs md:text-sm"
                    onClick={() => toast.info("Add Member: This could open a dedicated form or add to an existing tree.")}>
              <Plus className="h-4 w-4 mr-1 md:mr-2" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent 
            className="p-0 overflow-auto flex-grow relative bg-muted/10"
        >
            {/* This inner div is scaled for ALL views */}
            <div 
                 style={{ 
                    transform: `scale(${zoomLevel})`, 
                    transformOrigin: 'top left', 
                    transition: 'transform 0.2s ease-out',
                    width: 'fit-content',      
                    minWidth: '100%',           
                    height: 'fit-content',     
                    minHeight: '100%',
                    padding: '20px', 
                 }}
            >
              {viewType === "tree" && (
                <FamilyTreeDisplay 
                    tree={currentTree} 
                    zoomLevel={1} // FamilyTreeDisplay renders at 1x; its container is scaled by MultiView's zoomLevel
                    onTreeUpdate={handleTreeUpdateFromDisplay} 
                />
              )}
              {viewType === "pedigree" && renderPedigreeView()}
              {viewType === "list" && renderListView()}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default FamilyTreeMultiView;
