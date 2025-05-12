import { useState, useRef, useEffect } from "react";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Calendar, Heart, Users, Plus, ZoomIn, ZoomOut, UserCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState as useHookState } from "react";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

const FamilyTreeDisplay = ({ tree }: FamilyTreeDisplayProps) => {
  // State variables - keeping them exactly as they were
  const [principalPerson, setPrincipalPerson] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addingRelationship, setAddingRelationship] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log("Tree data:", tree);
  }, [tree]);
  
  // Group family members by generation - fixing the grouping logic
  const membersByGeneration: Record<number, FamilyMember[]> = {};
  
  tree.members.forEach(member => {
    const generation = member.generation || 0; // Default to 0 if undefined
    if (!membersByGeneration[generation]) {
      membersByGeneration[generation] = [];
    }
    membersByGeneration[generation].push(member);
  });

  // Get the generations in ascending order
  const generations = Object.keys(membersByGeneration)
    .map(gen => parseInt(gen))
    .sort((a, b) => a - b);
    // Find the user (principal person) in the tree - improved logic
  const findUserMember = () => {
    // First try to use the selected principal person
    if (principalPerson) {
      const foundMember = tree.members.find(m => m.id === principalPerson);
      if (foundMember) return foundMember;
    }
    
    // Try to find someone with a "self" relationship
    const selfMember = tree.members.find(m => 
      m.relationship === 'self' || 
      m.relationship === '' || 
      m.relationship === 'principal' ||
      m.relationship.toLowerCase() === 'you'
    );
    
    if (selfMember) return selfMember;
    
    // Fallback to generation 0 if available
    if (generations.includes(0) && membersByGeneration[0] && membersByGeneration[0].length > 0) {
      return membersByGeneration[0][0];
    }
    
    // Last resort: return the first member
    return tree.members.length > 0 ? tree.members[0] : null;
  };
  
  // Determine the central person (user)
  const centralPerson = findUserMember();
  
  // Function to find a member by ID - improved error handling
  const findMember = (id: string) => {
    return tree.members.find(m => m.id === id);
  };
  // Get relationship description - improved with better relationship detection
  const getRelationshipDescription = (member: FamilyMember) => {
    if (!member) return "";
    
    if (member.parentId) {
      const parent = findMember(member.parentId);
      if (parent) {
        return `Child of ${parent.name}`;
      }
    }
    
    // Check for siblings - improved detection by including generation check
    const siblings = tree.members.filter(m => 
      m.id !== member.id && 
      m.parentId === member.parentId && 
      member.parentId !== undefined &&
      m.generation === member.generation
    );
    
    if (siblings.length > 0) {
      return `Sibling of ${siblings.map(s => s.name).join(", ")}`;
    }
    
    // Check for children relationship
    const children = tree.members.filter(m => 
      m.parentId === member.id
    );
    
    if (children.length > 0) {
      return `Parent of ${children.map(c => c.name).join(", ")}`;
    }
    
    return member.relationship || "Family member";
  };
  // Create placeholders for common family relationships - improved positioning
  const createPlaceholders = () => {
    if (!centralPerson) return [];
    
    const placeholders = [];
    // Convert to lowercase for more accurate matching
    const existingRelationships = new Set(
      tree.members.map(m => m.relationship.toLowerCase())
    );
    
    // Define possible relationships with better positioning angles
    const possibleRelationships = [
      { name: 'father', generation: -1, angle: Math.PI * 0.25 },
      { name: 'mother', generation: -1, angle: Math.PI * 1.75 },
      { name: 'paternal grandfather', generation: -2, angle: Math.PI * 0.15 },
      { name: 'paternal grandmother', generation: -2, angle: Math.PI * 0.35 },
      { name: 'maternal grandfather', generation: -2, angle: Math.PI * 1.65 },
      { name: 'maternal grandmother', generation: -2, angle: Math.PI * 1.85 },
      { name: 'sibling', generation: 0, angle: Math.PI },
      { name: 'spouse', generation: 0, angle: Math.PI * 1.5 },
      { name: 'child', generation: 1, angle: Math.PI * 0.75 },
      { name: 'uncle', generation: -1, angle: Math.PI * 0.6 },
      { name: 'aunt', generation: -1, angle: Math.PI * 1.4 },
      { name: 'cousin', generation: 0, angle: Math.PI * 0.5 },
    ];
    
    // Add placeholders for missing relationships - improved detection
    possibleRelationships.forEach(rel => {
      let shouldAdd = true;
      const relLower = rel.name.toLowerCase();
      
      // Better relationship detection logic
      if (relLower === 'sibling') {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r.includes('sibling') || r.includes('brother') || r.includes('sister')
        );
      } else if (relLower === 'child') {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r.includes('son') || r.includes('daughter') || r === 'child'
        );
      } else if (relLower === 'father') {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r === 'father' || r === 'dad' || r.includes('father')
        );
      } else if (relLower === 'mother') {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r === 'mother' || r === 'mom' || r.includes('mother')
        );
      } else {
        shouldAdd = !Array.from(existingRelationships).some(r => 
          r.includes(relLower)
        );
      }
      
      if (shouldAdd) {
        placeholders.push({
          relationship: rel.name,
          generation: centralPerson.generation + rel.generation,
          position: { angle: rel.angle }
        });
      }
    });
    
    return placeholders;
  };

  const placeholders = createPlaceholders();