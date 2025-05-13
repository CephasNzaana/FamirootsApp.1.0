// src/components/FamilyTreeMultiView.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types"; // Make sure FamilyMember includes spouseId
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ... other imports (HoverCard, Badge, Icons, toast, FamilyTreeStats) ...
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay"; // The updated one

interface FamilyTreeMultiViewProps {
  tree: FamilyTree; 
  onTreeDataUpdate?: (updatedTree: FamilyTree) => void; 
}

const FamilyTreeMultiView: React.FC<FamilyTreeMultiViewProps> = ({ tree: initialTreeData, onTreeDataUpdate }) => {
  const [currentTree, setCurrentTree] = useState<FamilyTree>(initialTreeData);
  const [viewType, setViewType] = useState<"tree" | "pedigree" | "list">("tree");
  const [zoomLevel, setZoomLevel] = useState<number>(0.8); // Start a bit zoomed out for traditional tree
  
  useEffect(() => { setCurrentTree(initialTreeData); }, [initialTreeData]);

  const handleTreeUpdateFromDisplay = useCallback((updatedTree: FamilyTree) => { /* ... same ... */ }, [onTreeDataUpdate]);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3));

  // --- Your PersonCard, getMembersByGeneration, etc. for Pedigree and List views ---
  // --- Ensure they use `currentTree` and handle data robustly ---
  const PersonCard = ({person, isMain}: {person: FamilyMember, isMain?:boolean}) => (/* ... */);
  const renderPedigreeView = () => { /* ... scaled by parent ... */ return <div className="p-4">Pedigree View</div>; };
  const renderListView = () => { /* ... scaled by parent ... */ return <div className="p-4">List View</div>; };

  return (
    <div className="space-y-4 flex flex-col h-full w-full"> 
      {/* <FamilyTreeStats tree={currentTree} /> */} {/* Uncomment if you want stats */}
      <Card className="w-full bg-card shadow-md border-border flex flex-col flex-grow overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 flex flex-row justify-between items-center shrink-0 p-3 md:p-4">
          {/* ... CardTitle and Tabs ... */}
        </CardHeader>
        <CardContent 
            className="p-0 overflow-auto flex-grow relative bg-muted/10"
        >
            <div 
                 style={{ 
                    transform: `scale(${zoomLevel})`, 
                    transformOrigin: 'top left', 
                    transition: 'transform 0.2s ease-out',
                    width: 'fit-content', minWidth: '100%', 
                    height: 'fit-content', minHeight: '100%',
                    padding: '20px', // Padding around the scaled content
                 }}
            >
              {viewType === "tree" && (
                <FamilyTreeDisplay 
                    tree={currentTree} 
                    zoomLevel={1} // FamilyTreeDisplay itself is not scaled, its container is
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
