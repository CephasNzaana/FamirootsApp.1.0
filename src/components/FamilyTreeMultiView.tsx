// src/components/FamilyTreeMultiView.tsx

import React, { useState, useCallback, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, User, Users, Plus, GitBranch, List, UserCircle2, ListTree, ChevronsUpDown } from "lucide-react"; // Added ChevronsUpDown
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";

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
    console.log("FamilyTreeMultiView: Tree data updated for surname:", initialTreeData?.surname, "with", initialTreeData?.members?.length, "members");
  }, [initialTreeData]);

  const handleTreeUpdateFromDisplay = useCallback((updatedTree: FamilyTree) => {
    setCurrentTree(updatedTree);
    if (onTreeDataUpdate) {
      onTreeDataUpdate(updatedTree);
    }
    toast.info("Tree view updated by an action within the display.");
  }, [onTreeDataUpdate]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3));
  
  const getSafeGeneration = (member: FamilyMember | { generation?: number | string }): number => { // Made generation optional for temp objects
    return typeof member.generation === 'number' ? member.generation : 0;
  };

  const getMembersByGenerationList = () => {
    const result: Record<number, FamilyMember[]> = {};
    (currentTree.members || []).forEach(member => {
        const gen = getSafeGeneration(member);
        if (!result[gen]) result[gen] = [];
        result[gen].push(member);
    });
    return Object.keys(result).map(Number).sort((a, b) => a - b)
        .map(gen => ({
            generation: gen,
            members: result[gen].sort((a, b) => (a.name || "Z").localeCompare(b.name || "Z"))
        }));
  };
  
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

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
                  : 'bg-card dark:bg-slate-700 border-border dark:border-slate-600 hover:border-uganda-yellow/50 shadow-sm min-w-[120px]'
            } transition-all`}
          >
            <div className={`rounded-full p-2 mb-2 ${isMain ? 'bg-uganda-yellow/50' : 'bg-muted dark:bg-slate-600'}`}>
              <User size={isMain ? 30 : 24} className={isMain ? "text-uganda-black" : "text-muted-foreground dark:text-slate-300"} />
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm text-foreground dark:text-slate-100">{person.name || "Unnamed"}</div>
              <div className="text-xs text-muted-foreground dark:text-slate-400">
                {person.birthYear}{person.deathYear ? ` - ${person.deathYear}` : (person.status === 'deceased' ? ' (dec.)' : '')}
              </div>
              {person.relationship && (
                <div className="text-xs mt-1">
                  <Badge variant="outline" className="text-[10px] bg-background dark:bg-slate-600 border-border dark:border-slate-500 text-muted-foreground dark:text-slate-300">
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
        <HoverCardContent className="w-64 p-3 text-xs shadow-xl bg-popover text-popover-foreground border-popover-border dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <h4 className="font-semibold">{person.name || "Unnamed"}</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">Relationship:</span> <span>{person.relationship || "N/A"}</span></div>
              {person.birthYear && <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">Born:</span> <span>{person.birthYear}</span></div>}
              {person.deathYear && <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">Died:</span> <span>{person.deathYear}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">Generation:</span> <span>{getSafeGeneration(person) === 0 ? 'Proband' : getSafeGeneration(person) < 0 ? `${Math.abs(getSafeGeneration(person))} Up` : `${getSafeGeneration(person)} Down`}</span></div>
              {person.gender && <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">Gender:</span> <span className="capitalize">{person.gender}</span></div>}
              {person.side && <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">Side:</span> <span className="capitalize">{person.side}</span></div>}
              {person.isElder && <div className="mt-2 pt-2 border-t border-border dark:border-slate-700"><Badge className="bg-uganda-red text-white">Clan Elder</Badge></div>}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderPedigreeView = () => {
    let mainPerson = (currentTree.members || []).find(m => 
        getSafeGeneration(m) === 0 && 
        (m.relationship?.toLowerCase() === 'self' || m.relationship?.toLowerCase() === 'proband')
    );

    if (!mainPerson) {
        mainPerson = (currentTree.members || []).find(m => getSafeGeneration(m) === 0);
    }
    if (!mainPerson && (currentTree.members || []).length > 0) {
        mainPerson = currentTree.members[0]; // Absolute fallback
        toast.info("Pedigree: Main person inferred. Ensure one member has generation 0 or relationship 'Self'.");
    }

    if (!mainPerson) {
      return <div className="text-center p-10 text-muted-foreground dark:text-slate-400">No members available to render Pedigree View.</div>;
    }

    const mainPersonGen = getSafeGeneration(mainPerson);
    const ancestorsGrouped: Record<number, FamilyMember[]> = {};
    const descendantsGrouped: Record<number, FamilyMember[]> = {};

    (currentTree.members || []).forEach(member => {
      if (member.id === mainPerson!.id) return;
      const memberGen = getSafeGeneration(member);

      if (memberGen < mainPersonGen) {
        if (!ancestorsGrouped[memberGen]) ancestorsGrouped[memberGen] = [];
        ancestorsGrouped[memberGen].push(member);
      } else if (memberGen > mainPersonGen) {
        if (!descendantsGrouped[memberGen]) descendantsGrouped[memberGen] = [];
        descendantsGrouped[memberGen].push(member);
      }
    });

    const ancestorGenerations = Object.keys(ancestorsGrouped).map(Number).sort((a, b) => a - b); // e.g., -3, -2, -1 (oldest first)
    const descendantGenerations = Object.keys(descendantGrouped).map(Number).sort((a, b) => a - b); // e.g., 1, 2, 3 (closest first)

    ancestorGenerations.forEach(gen => ancestorsGrouped[gen].sort((a,b) => (a.birthYear || "9999").localeCompare(b.birthYear || "9999") || (a.name || "").localeCompare(b.name || "")));
    descendantGenerations.forEach(gen => descendantsGrouped[gen].sort((a,b) => (a.birthYear || "0").localeCompare(b.birthYear || "0") || (a.name || "").localeCompare(b.name || "")));
    
    return (
      <div className="flex flex-col items-center space-y-6 p-4 overflow-auto w-full min-h-[300px]">
        {/* Ancestor Rows - Oldest at the top */}
        {ancestorGenerations.map(gen => (
          <div key={`anc-gen-${gen}`} className="w-full">
            <h4 className="text-xs font-semibold text-muted-foreground dark:text-slate-400 mb-2 text-center uppercase tracking-wider">
              {Math.abs(gen - mainPersonGen)}{getOrdinalSuffix(Math.abs(gen - mainPersonGen))} Ancestors (Gen {gen})
            </h4>
            <div className="flex flex-row flex-wrap justify-center items-center gap-4">
              {ancestorsGrouped[gen].map(person => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        ))}

        {/* Main Person Row */}
        <div className="w-full my-4 py-4 border-t border-b border-dashed border-gray-300 dark:border-gray-600">
          <h4 className="text-xs font-semibold text-muted-foreground dark:text-slate-400 mb-2 text-center uppercase tracking-wider">Proband (Gen {mainPersonGen})</h4>
          <div className="flex justify-center">
            <PersonCard person={mainPerson} isMain={true} />
          </div>
        </div>

        {/* Descendant Rows - Closest at the top (below proband) */}
        {descendantGenerations.map(gen => (
          <div key={`desc-gen-${gen}`} className="w-full">
            <h4 className="text-xs font-semibold text-muted-foreground dark:text-slate-400 mb-2 text-center uppercase tracking-wider">
              {Math.abs(gen - mainPersonGen)}{getOrdinalSuffix(Math.abs(gen - mainPersonGen))} Descendants (Gen {gen})
            </h4>
            <div className="flex flex-row flex-wrap justify-center items-center gap-4">
              {descendantsGrouped[gen].map(person => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderListView = () => { 
    const generationsData = getMembersByGenerationList(); // Use the renamed function
    if (!generationsData || generationsData.length === 0 || generationsData.every(g => g.members.length === 0)) {
        return <div className="text-center p-10 text-muted-foreground dark:text-slate-400">No members to display in List View.</div>;
    }
    return (
      <div className="space-y-8 p-4">
        {generationsData.map(genData => (
          <div key={genData.generation} className="border-t border-border dark:border-slate-700 pt-6 first:border-0 first:pt-0">
            <h3 className="text-lg font-medium mb-4 text-foreground dark:text-slate-100">
              {genData.generation === 0 
                ? "Proband Generation" 
                : (genData.generation ?? 0) < 0 
                  ? `${Math.abs(genData.generation ?? 0)}${getOrdinalSuffix(Math.abs(genData.generation ?? 0))} Generation Up (Ancestors)`
                  : `${genData.generation}${getOrdinalSuffix(genData.generation ?? 0)} Generation Down (Descendants)`}
            </h3>
            <div className="bg-card dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-border dark:border-slate-700">
              <table className="min-w-full divide-y divide-border dark:divide-slate-700">
                <thead className="bg-muted/50 dark:bg-slate-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Relationship</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Birth Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-slate-400 uppercase tracking-wider">Side</th>
                  </tr>
                </thead>
                <tbody className="bg-card dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
                  {(genData.members || []).map((person) => (
                    <tr key={person.id} className="hover:bg-muted/30 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-muted dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <UserCircle2 size={24} className="text-muted-foreground dark:text-slate-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground dark:text-slate-100">{person.name || "Unnamed"}</div>
                            {person.isElder && <Badge className="bg-uganda-red text-white text-xs mt-1">Elder</Badge>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-slate-300">{person.relationship || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-slate-300">{person.birthYear || "Unknown"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          person.status === 'deceased' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100' : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                        }`}>
                          {person.status === 'deceased'
                            ? `Deceased ${person.deathYear ? `(${person.deathYear})` : ''}`
                            : 'Living'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground dark:text-slate-400">
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
    <div className="space-y-4 flex flex-col h-full w-full text-foreground dark:text-slate-100">
      <FamilyTreeStats tree={currentTree} />
      
      <Card className="w-full bg-card dark:bg-slate-800/50 shadow-md border-border dark:border-slate-700 flex flex-col flex-grow overflow-hidden">
        <CardHeader className="border-b border-border dark:border-slate-700 bg-muted/40 dark:bg-slate-700/30 flex flex-row justify-between items-center shrink-0 p-3 md:p-4">
          <CardTitle className="text-lg md:text-xl font-medium text-foreground dark:text-slate-100">
            {currentTree.surname || "Family"} Tree
            <span className="text-sm text-muted-foreground dark:text-slate-400 ml-2">({currentTree.clan || "N/A"} / {currentTree.tribe || "N/A"})</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={viewType} onValueChange={(val) => setViewType(val as "tree" | "pedigree" | "list")} className="mr-2">
              <TabsList className="bg-slate-200 dark:bg-slate-900">
                <TabsTrigger value="tree" className="text-xs px-2 py-1 h-auto md:text-sm md:px-3 md:py-1.5 md:h-9 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-uganda-red"><ListTree size={14} className="mr-1 md:mr-2"/>Tree</TabsTrigger>
                <TabsTrigger value="pedigree" className="text-xs px-2 py-1 h-auto md:text-sm md:px-3 md:py-1.5 md:h-9 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-uganda-red"><ChevronsUpDown size={14} className="mr-1 md:mr-2"/>Pedigree</TabsTrigger> {/* Changed icon */}
                <TabsTrigger value="list" className="text-xs px-2 py-1 h-auto md:text-sm md:px-3 md:py-1.5 md:h-9 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-uganda-red"><List size={14} className="mr-1 md:mr-2"/>List</TabsTrigger>
              </TabsList>
            </Tabs>
            {(viewType === "tree" || viewType === "pedigree") && (
              <>
                <Button onClick={handleZoomOut} size="icon" variant="outline" className="h-8 w-8 border-border dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"><ZoomOut className="h-4 w-4" /></Button>
                <Button onClick={handleZoomIn} size="icon" variant="outline" className="h-8 w-8 border-border dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"><ZoomIn className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent 
            className="p-0 overflow-auto flex-grow relative bg-muted/10 dark:bg-slate-900/50 flex justify-center items-start"
        >
            <div 
                 style={{ 
                    transform: `scale(${zoomLevel})`, 
                    transformOrigin: viewType === 'pedigree' ? 'top center' : 'top left', // Conditional transform origin
                    transition: 'transform 0.2s ease-out',
                    width: 'fit-content', 
                    height: 'fit-content',
                    padding: (viewType === 'tree' || viewType === 'pedigree') ? '20px' : '0',
                 }}
            >
              {viewType === "tree" && currentTree.members && currentTree.members.length > 0 && (
                <FamilyTreeDisplay 
                    tree={currentTree} 
                    onTreeUpdate={handleTreeUpdateFromDisplay} 
                />
              )}
              {viewType === "tree" && (!currentTree.members || currentTree.members.length === 0) && (
                <div className="p-10 text-center text-muted-foreground dark:text-slate-400">No members in this tree to display.</div>
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
