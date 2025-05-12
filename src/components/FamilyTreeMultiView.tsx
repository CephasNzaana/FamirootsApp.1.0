import React, { useState, useRef, useCallback, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"; // Keep for PersonCard
import { Badge } from "@/components/ui/badge"; // Keep for PersonCard
import { ZoomIn, ZoomOut, User, Users, Plus, GitBranch, List, UserCircle2 } from "lucide-react";
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const scrollableContentRef = useRef<HTMLDivElement>(null); // Ref for the scrollable CardContent

  useEffect(() => {
    setCurrentTree(initialTreeData);
  }, [initialTreeData]);

  const handleTreeUpdateFromDisplay = useCallback((updatedTree: FamilyTree) => {
    setCurrentTree(updatedTree);
    if (onTreeDataUpdate) {
      onTreeDataUpdate(updatedTree);
    }
  }, [onTreeDataUpdate]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Smaller zoom steps
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

  // Your getMembersByGeneration, getAncestors, getDescendants, PersonCard, renderPedigreeView, renderListView, getOrdinalSuffix can remain largely as you had them,
  // just ensure they use `currentTree.members` for data.
  // For brevity, I'll assume they are correctly implemented as in your provided code.
  // Make sure PersonCard and other views robustly handle missing names (e.g., person.name || "Unnamed")

  const PersonCard: React.FC<{person: FamilyMember, isMain?: boolean}> = ({person, isMain = false}) => {
    // Your existing PersonCard implementation - ensure it uses theme colors and handles missing data
    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
            <div
                className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all min-w-[140px] shadow-md
                            ${isMain ? 'bg-uganda-yellow/30 border-uganda-yellow ring-2 ring-uganda-yellow' :
                            person.isElder ? 'bg-uganda-red/10 border-uganda-red' :
                            'bg-card border-border hover:border-uganda-yellow/70'}`} // Adjusted hover
            >
                <div className={`rounded-full flex items-center justify-center mb-2 overflow-hidden border-2
                                ${isMain ? 'border-uganda-yellow' : 'border-muted-foreground/20'}`}
                    style={{width: isMain? 50:40, height: isMain? 50:40, backgroundColor: 'hsl(var(--muted))'}}>
                {person.photoUrl ? <img src={person.photoUrl} alt={person.name || "Photo"} className="w-full h-full object-cover" /> :
                    <UserCircle2 size={isMain ? 30 : 24} className={isMain ? 'text-uganda-black' : 'text-muted-foreground/70'} />}
                </div>
                <div className="text-center">
                <div className="font-semibold text-sm text-foreground truncate" title={person.name || "Unnamed"}>{person.name || "Unnamed"}</div>
                {(person.birthYear || person.deathYear || person.status === 'deceased') &&
                    <div className="text-xs text-muted-foreground">
                    {person.birthYear || "..."}{person.deathYear ? ` - ${person.deathYear}` : (person.status === 'deceased' ? ' (✝)' : '')}
                    </div>
                }
                {person.relationship && <Badge variant="outline" className="text-[10px] mt-1 bg-background text-muted-foreground">{person.relationship}</Badge>}
                </div>
                {person.isElder && (
                <Badge className="mt-1 absolute -top-2 -right-2 bg-uganda-red text-white text-[9px] px-1.5 py-0.5">Elder</Badge>
                )}
            </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-3 text-xs shadow-xl border-popover-border bg-popover text-popover-foreground">
                {/* ... Your detailed HoverCardContent ... */}
                <h4 className="font-bold text-sm mb-1.5">{person.name || "Unnamed"}</h4>
                <div className="space-y-1">
                    {person.relationship && <div className="flex justify-between"> <span className="text-muted-foreground">Relationship:</span> <span>{person.relationship}</span> </div>}
                    {/* Add other details similarly */}
                </div>
            </HoverCardContent>
      </HoverCard>
    );
  };
  
  const renderPedigreeView = () => { /* Your logic using PersonCard */ return <div className="p-4">Pedigree View Placeholder</div>; };
  const renderListView = () => { /* Your logic */ return <div className="p-4">List View Placeholder</div>; };


  return (
    <div className="space-y-6">
      <FamilyTreeStats tree={currentTree} />
      <Card className="w-full bg-card shadow-md border-border">
        <CardHeader className="border-b border-border bg-muted/40 flex flex-row justify-between items-center sticky top-0 z-10">
          <CardTitle className="text-xl font-medium text-foreground">
            {currentTree.surname || "Family"} Tree - {currentTree.clan || "N/A"} clan, {currentTree.tribe || "N/A"}
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
            <Button size="sm" className="bg-uganda-red text-white hover:bg-uganda-red/90 ml-2"
                    onClick={() => toast.info("Connect this to your main form submission or a new simplified add dialog.")}>
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent 
            ref={scrollableContentRef} 
            className="p-0 overflow-auto" 
            style={{height: 'calc(90vh - 160px)' /* Adjust height as needed */, backgroundColor: 'hsl(var(--muted)/20)'}}
        >
            {/* This inner div is scaled for the Tree View */}
            <div style={{ 
                    transform: viewType === "tree" ? `scale(${zoomLevel})` : 'none', // Only tree view uses FamilyTreeDisplay's internal scaling via prop
                    transformOrigin: 'top left', 
                    transition: viewType === "tree" ? 'transform 0.3s ease' : 'none',
                    width: viewType === "tree" ? 'fit-content' : '100%', // Allow tree to define its own width
                    height: viewType === "tree" ? 'fit-content' : '100%',
                 }}
            >
              {viewType === "tree" && (
                <FamilyTreeDisplay 
                    tree={currentTree} 
                    zoomLevel={zoomLevel} // Pass consolidated zoomLevel
                    onTreeUpdate={handleTreeUpdateFromDisplay} 
                />
              )}
            </div>
            {/* Pedigree and List views might need their own scaling if desired, or be 100% width/height */}
            {viewType === "pedigree" && 
                <div style={{transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
                    {renderPedigreeView()}
                </div>
            }
            {viewType === "list" && 
                <div style={{transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
                    {renderListView()}
                </div>
            }
        </CardContent>
      </Card>
    </div>
  );
};
export default FamilyTreeMultiView;
