import React, { useState, useRef, useCallback } from "react"; // Added useCallback
import { FamilyTree, FamilyMember, TreeFormData } from "@/types"; // Assuming TreeFormData is in types
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, User, Users, Plus, Grid, List, GitBranch, UserCircle2 } from "lucide-react"; // Added UserCircle2
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay"; // The updated one

interface FamilyTreeMultiViewProps {
  tree: FamilyTree;
  onTreeDataUpdate?: (updatedTree: FamilyTree) => void; // Callback to update master tree data
}

const FamilyTreeMultiView: React.FC<FamilyTreeMultiViewProps> = ({ tree: initialTreeData, onTreeDataUpdate }) => {
  const [currentTree, setCurrentTree] = useState<FamilyTree>(initialTreeData);
  const [viewType, setViewType] = useState<"tree" | "pedigree" | "list">("tree");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update internal tree if prop changes
  useEffect(() => {
    setCurrentTree(initialTreeData);
  }, [initialTreeData]);

  const handleTreeUpdateFromDisplay = useCallback((updatedTree: FamilyTree) => {
    setCurrentTree(updatedTree); // Update local state for immediate reflection
    if (onTreeDataUpdate) {
      onTreeDataUpdate(updatedTree); // Propagate to parent
    }
  }, [onTreeDataUpdate]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  const getMembersByGeneration = () => { /* ... (your existing code) ... */ 
    const result: Record<number, FamilyMember[]> = {};
    currentTree.members.forEach(member => {
        const gen = member.generation ?? 0; // Use currentTree
        if (!result[gen]) {
            result[gen] = [];
        }
        result[gen].push(member);
    });
    return Object.keys(result)
        .map(Number)
        .sort((a, b) => a - b)
        .map(gen => ({
            generation: gen,
            members: result[gen].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        }));
  };
  const getAncestors = () => { /* ... (your existing code, ensure it uses currentTree) ... */ 
    const mainPerson = currentTree.members.find(m =>
        m.relationship?.toLowerCase() === 'self' ||
        m.relationship?.toLowerCase() === 'principal' ||
        m.generation === 0
    );
    if (!mainPerson) return [];
    return currentTree.members
        .filter(m => (m.generation ?? 0) < 0) // use currentTree
        .sort((a, b) => (b.generation ?? 0) - (a.generation ?? 0));
  };
  const getDescendants = () => { /* ... (your existing code, ensure it uses currentTree) ... */
    const mainPerson = currentTree.members.find(m =>
        m.relationship?.toLowerCase() === 'self' ||
        m.relationship?.toLowerCase() === 'principal' ||
        m.generation === 0
    );
    if (!mainPerson) return [];
    return currentTree.members
        .filter(m => (m.generation ?? 0) > 0) // use currentTree
        .sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0));
  };

  const PersonCard: React.FC<{person: FamilyMember, isMain?: boolean}> = ({person, isMain = false}) => {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div
            className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all min-w-[140px]
                        ${isMain ? 'bg-uganda-yellow/30 border-uganda-yellow shadow-lg' :
                         person.isElder ? 'bg-uganda-red/10 border-uganda-red shadow-md' :
                         'bg-card border-border hover:border-primary/50 shadow-sm'}`}
          >
            <div className={`rounded-full flex items-center justify-center mb-2 overflow-hidden border
                            ${isMain ? 'bg-uganda-yellow/50 border-uganda-yellow' : 'bg-muted border-muted-foreground/20'}`}
                  style={{width: isMain? 50:40, height: isMain? 50:40}}>
               {person.photoUrl ? <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" /> :
                <UserCircle2 size={isMain ? 30 : 24} className={isMain ? 'text-uganda-black' : 'text-muted-foreground'} />}
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm text-foreground truncate" title={person.name || "Unnamed"}>{person.name || "Unnamed"}</div>
              {(person.birthYear || person.deathYear) &&
                <div className="text-xs text-muted-foreground">
                  {person.birthYear || "?"}{person.deathYear ? ` - ${person.deathYear}` : (person.status === 'deceased' ? ' (✝)' : '')}
                </div>
              }
              {person.relationship && <Badge variant="outline" className="text-[10px] mt-1 bg-background">{person.relationship}</Badge>}
            </div>
            {person.isElder && (
              <Badge className="mt-1 absolute -top-2 -right-2 bg-uganda-red text-white text-[9px] px-1.5 py-0.5">Elder</Badge>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 p-3 text-xs shadow-xl" style={{borderColor: 'hsl(var(--popover-border))'}}>
            <h4 className="font-bold text-sm mb-1.5 text-popover-foreground">{person.name || "Unnamed"}</h4>
            {/* ... (rest of your HoverCardContent details) ... */}
             <div className="text-sm space-y-1">
                <div className="flex justify-between"> <span className="text-gray-500">Relationship:</span> <span>{person.relationship || "Family Member"}</span> </div>
                {person.birthYear && <div className="flex justify-between"> <span className="text-gray-500">Born:</span> <span>{person.birthYear}</span> </div> }
                {person.deathYear && <div className="flex justify-between"> <span className="text-gray-500">Died:</span> <span>{person.deathYear}</span> </div> }
                <div className="flex justify-between"> <span className="text-gray-500">Status:</span> <span>{person.status || "Unknown"}</span> </div>
                <div className="flex justify-between"> <span className="text-gray-500">Generation:</span> <span>{person.generation === 0 ? 'Proband' : person.generation && person.generation < 0 ? `${Math.abs(person.generation)} Up` : `${person.generation} Down`}</span></div>
                {person.gender && <div className="flex justify-between"> <span className="text-gray-500">Gender:</span> <span>{person.gender}</span> </div>}
             </div>
        </HoverCardContent>
      </HoverCard>
    );
  };
  
  const renderPedigreeView = () => { /* ... (your existing code, ensure PersonCard is used) ... */ 
    const ancestors = getAncestors();
    const mainPersonNode = currentTree.members.find(m => (m.relationship?.toLowerCase() === 'self' || m.relationship?.toLowerCase() === 'principal' || m.generation === 0));
    const descendants = getDescendants();

    if (!mainPersonNode) return <div className="text-center p-10">No main person (self/proband) found in tree data.</div>;
    
    return (
        <div className="flex flex-col items-center space-y-6 py-4 overflow-auto" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center top', minHeight: '50vh' }}>
            {ancestors.length > 0 && (
                <div className="w-full">
                    <h3 className="text-lg font-semibold text-center mb-3 text-foreground">Ancestors</h3>
                    <div className="flex flex-wrap justify-center items-start gap-x-6 gap-y-4">
                        {ancestors.map(ancestor => <PersonCard key={ancestor.id} person={ancestor} />)}
                    </div>
                </div>
            )}
            <div className="flex justify-center my-4 relative"> {/* Ensure main person is distinct */}
                 <div className="absolute left-1/2 top-[-24px] bottom-[-24px] w-0.5 bg-border -z-10"></div> {/* Connecting line */}
                <PersonCard person={mainPersonNode} isMain={true} />
            </div>
            {descendants.length > 0 && (
                <div className="w-full">
                    <h3 className="text-lg font-semibold text-center mb-3 text-foreground">Descendants</h3>
                    <div className="flex flex-wrap justify-center items-start gap-x-6 gap-y-4">
                        {descendants.map(descendant => <PersonCard key={descendant.id} person={descendant} />)}
                    </div>
                </div>
            )}
        </div>
    );
  };
  const renderListView = () => { /* ... (your existing code, ensure PersonCard styling or similar is applied if desired) ... */ 
    const generations = getMembersByGeneration();
    if (generations.length === 0 || generations.every(g => g.members.length ===0)) {
        return <div className="text-center p-10">No members to display in list view.</div>;
    }
    // ... (rest of your renderListView implementation, using currentTree)
    return (
        <div className="space-y-8" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
            {/* ... (your existing table structure) ... */}
        </div>
    );
  };
  const getOrdinalSuffix = (num: number) => { /* ... (your existing code) ... */ };


  return (
    <div className="space-y-6">
      {/* Pass currentTree to FamilyTreeStats if it uses it */}
      <FamilyTreeStats tree={currentTree} />
      
      <Card className="w-full bg-card shadow-md border-border">
        <CardHeader className="border-b border-border bg-muted/40 flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-medium text-foreground">
            {currentTree.surname} Family Tree - {currentTree.clan} clan, {currentTree.tribe}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="tree" onValueChange={(val) => setViewType(val as any)} className="mr-4">
              <TabsList>
                <TabsTrigger value="tree" className="flex items-center gap-1"><Users size={14} /> Tree</TabsTrigger>
                <TabsTrigger value="pedigree" className="flex items-center gap-1"><GitBranch size={14} /> Pedigree</TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-1"><List size={14} /> List</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleZoomOut} size="icon" variant="outline" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
            <Button onClick={handleZoomIn} size="icon" variant="outline" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
            {/* This button's functionality needs to be decided: open FamilyTreeForm? Or a simpler dialog? */}
            <Button size="sm" className="bg-uganda-red text-white hover:bg-uganda-red/90 ml-2"
                    onClick={() => toast.info("Add Member: Connect to main form or implement dialog here.")}>
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto" ref={containerRef} style={{height: '70vh', backgroundColor: 'hsl(var(--muted))'}}>
          {viewType === "tree" && (
            <FamilyTreeDisplay 
                tree={currentTree} 
                zoomLevel={zoomLevel} 
                onTreeUpdate={handleTreeUpdateFromDisplay} 
            />
          )}
          {viewType === "pedigree" && renderPedigreeView()}
          {viewType === "list" && renderListView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyTreeMultiView;
