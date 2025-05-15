// src/pages/RelationshipAnalyzer.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // For source selection
import { Users, Dna, Link2, Clock, UserCircle2, Search, Info, AlertTriangle } from "lucide-react"; // Updated icons
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer"; // Added Footer
import { FamilyTree, FamilyMember, ElderReference, ClanElder as FullClanElderType, Tribe as TribeType, Clan as ClanType } from "@/types";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

interface RelationshipResult {
  isRelated: boolean;
  relationshipType?: string; // e.g., "Same Clan", "Common Ancestor", "Direct (Sibling/Parent)"
  pathDescription?: string; // Textual description of how they are related
  commonAncestors?: {id: string, name: string, type: 'clan_elder' | 'family_member'}[];
  generationalDistance?: number; // If calculable
  clanContext?: string;
  confidenceScore: number; // 0 to 1
  analysisNotes?: string[];
}

type PersonInputType = "tree" | "custom";

const RelationshipAnalyzer = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false); // Manage AuthForm visibility
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [userFamilyTrees, setUserFamilyTrees] = useState<FamilyTree[]>([]);

  // Person 1 State
  const [person1Source, setPerson1Source] = useState<PersonInputType>("tree");
  const [selectedTreeIdP1, setSelectedTreeIdP1] = useState<string | undefined>(undefined);
  const [selectedMemberIdP1, setSelectedMemberIdP1] = useState<string | undefined>(undefined);
  const [customNameP1, setCustomNameP1] = useState<string>("");
  const [customTribeP1, setCustomTribeP1] = useState<string | undefined>(undefined);
  const [customClanP1, setCustomClanP1] = useState<string | undefined>(undefined);
  const [availableClansP1, setAvailableClansP1] = useState<ClanType[]>([]);
  const [availableEldersP1, setAvailableEldersP1] = useState<FullClanElderType[]>([]);
  const [selectedLineageEldersP1, setSelectedLineageEldersP1] = useState<string[]>([]); // Store IDs

  // Person 2 State
  const [person2Source, setPerson2Source] = useState<PersonInputType>("custom");
  const [selectedTreeIdP2, setSelectedTreeIdP2] = useState<string | undefined>(undefined); // Only if P2 from same tree as P1
  const [selectedMemberIdP2, setSelectedMemberIdP2] = useState<string | undefined>(undefined);
  const [customNameP2, setCustomNameP2] = useState<string>("");
  const [customTribeP2, setCustomTribeP2] = useState<string | undefined>(undefined);
  const [customClanP2, setCustomClanP2] = useState<string | undefined>(undefined);
  const [availableClansP2, setAvailableClansP2] = useState<ClanType[]>([]);
  const [availableEldersP2, setAvailableEldersP2] = useState<FullClanElderType[]>([]);
  const [selectedLineageEldersP2, setSelectedLineageEldersP2] = useState<string[]>([]);

  const [relationshipResult, setRelationshipResult] = useState<RelationshipResult | null>(null);

  const fetchFamilyTrees = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*, family_members(*)') // Fetch members along with trees
        .eq('user_id', user.id);

      if (treesError) throw treesError;
      
      const formattedTrees: FamilyTree[] = (treesData || []).map(tree => ({
        id: tree.id,
        userId: tree.user_id,
        surname: tree.surname,
        tribe: tree.tribe,
        clan: tree.clan,
        createdAt: tree.created_at,
        members: (tree.family_members || []).map((member: any) => ({ // Cast member to any for direct db field access
          id: member.id,
          name: member.name,
          relationship: member.relationship,
          birthYear: member.birth_year,
          deathYear: member.death_year,
          generation: member.generation,
          parentId: member.parent_id,
          spouseId: member.spouse_id, // Ensure this matches your DB column name
          isElder: Boolean(member.is_elder),
          gender: member.gender as 'male' | 'female' | undefined,
          side: member.side as 'maternal' | 'paternal' | undefined,
          status: member.status as 'living' | 'deceased' || (member.death_year ? 'deceased' : 'living'),
          notes: member.notes,
          photoUrl: member.photo_url,
        }) as FamilyMember)
      }));
      
      setUserFamilyTrees(formattedTrees);
      if (formattedTrees.length > 0 && !selectedTreeIdP1) {
        setSelectedTreeIdP1(formattedTrees[0].id);
      }
    } catch (error) {
      console.error("Error fetching family trees:", error);
      toast.error("Failed to load your family trees.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedTreeIdP1]); // Added selectedTreeIdP1 to avoid re-selecting if already set

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      fetchFamilyTrees();
    } else {
      setShowAuth(true);
      setUserFamilyTrees([]); // Clear trees if user logs out
    }
  }, [user, fetchFamilyTrees]);

  // Dynamic elder/clan loading for Person 1 (Custom)
  useEffect(() => {
    if (person1Source === 'custom' && customTribeP1) {
      const tribe = ugandaTribesData.find(t => t.name === customTribeP1);
      setAvailableClansP1(tribe ? tribe.clans : []);
      setCustomClanP1(undefined); setSelectedLineageEldersP1([]); setAvailableEldersP1([]);
    } else if (person1Source === 'tree' && selectedTreeIdP1) {
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
        if(tree?.tribe) {
            const tribeData = ugandaTribesData.find(t => t.name === tree.tribe);
            if(tribeData && tree.clan) {
                const clanData = tribeData.clans.find(c => c.name === tree.clan);
                setAvailableEldersP1(clanData?.elders || []);
            } else {
                 setAvailableEldersP1([]);
            }
        }
         setSelectedLineageEldersP1([]);
    } else {
      setAvailableClansP1([]);
      setAvailableEldersP1([]);
    }
  }, [customTribeP1, person1Source, selectedTreeIdP1, userFamilyTrees]);

  useEffect(() => {
    if (person1Source === 'custom' && customTribeP1 && customClanP1) {
      const tribe = ugandaTribesData.find(t => t.name === customTribeP1);
      const clan = tribe?.clans.find(c => c.name === customClanP1);
      setAvailableEldersP1(clan?.elders || []);
      setSelectedLineageEldersP1([]);
    } else if (person1Source !== 'custom'){ // If not custom, clear elders if clan context changes
         setAvailableEldersP1([]);
    }
  }, [customClanP1, customTribeP1, person1Source]);

  // Dynamic elder/clan loading for Person 2 (Custom)
   useEffect(() => {
    if (person2Source === 'custom' && customTribeP2) {
      const tribe = ugandaTribesData.find(t => t.name === customTribeP2);
      setAvailableClansP2(tribe ? tribe.clans : []);
      setCustomClanP2(undefined); setSelectedLineageEldersP2([]); setAvailableEldersP2([]);
    } else if (person2Source === 'tree' && selectedTreeIdP1) { // P2 from same tree as P1
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
         if(tree?.tribe) {
            const tribeData = ugandaTribesData.find(t => t.name === tree.tribe);
            if(tribeData && tree.clan) {
                const clanData = tribeData.clans.find(c => c.name === tree.clan);
                setAvailableEldersP2(clanData?.elders || []); // Elders based on tree's clan
            } else {
                 setAvailableEldersP2([]);
            }
        }
        setSelectedLineageEldersP2([]);
    }
    else {
      setAvailableClansP2([]);
      setAvailableEldersP2([]);
    }
  }, [customTribeP2, person2Source, selectedTreeIdP1, userFamilyTrees]); // Listen to P1's tree if P2 is from tree

  useEffect(() => {
    if (person2Source === 'custom' && customTribeP2 && customClanP2) {
      const tribe = ugandaTribesData.find(t => t.name === customTribeP2);
      const clan = tribe?.clans.find(c => c.name === customClanP2);
      setAvailableEldersP2(clan?.elders || []);
       setSelectedLineageEldersP2([]);
    } else if (person2Source !== 'custom'){
         setAvailableEldersP2([]);
    }
  }, [customClanP2, customTribeP2, person2Source]);


  const getMemberDetails = (source: PersonInputType, treeId: string | undefined, memberId: string | undefined, customName: string): Partial<FamilyMember> & { tribe?: string, clan?: string } => {
    if (source === 'tree' && treeId && memberId) {
      const tree = userFamilyTrees.find(t => t.id === treeId);
      const member = tree?.members.find(m => m.id === memberId);
      return member ? { ...member, tribe: tree?.tribe, clan: tree?.clan } : { name: "Unknown Tree Member", tribe: tree?.tribe, clan: tree?.clan };
    }
    return { name: customName, tribe: source === 'custom' ? (customName === customNameP1 ? customTribeP1 : customTribeP2) : undefined, clan: source === 'custom' ? (customName === customNameP1 ? customClanP1 : customClanP2) : undefined };
  };

  const findCommonClanElders = (elders1_ids: string[], elders2_ids: string[]): FullClanElderType[] => {
    if (!elders1_ids.length || !elders2_ids.length) return [];
    
    const commonIds = elders1_ids.filter(id => elders2_ids.includes(id));
    const commonFullElders: FullClanElderType[] = [];
    commonIds.forEach(id => {
        for (const tribe of ugandaTribesData) {
            for (const clan of tribe.clans) {
                const found = clan.elders?.find(e => e.id === id);
                if (found) {
                    commonFullElders.push(found);
                    return; // Found in this clan, no need to check further for this ID
                }
            }
        }
    });
    return commonFullElders;
};


  const handleAnalyzeRelationship = async () => {
    setIsLoading(true);
    setRelationshipResult(null);

    // Gather Person 1 Info
    const p1Details = getMemberDetails(person1Source, selectedTreeIdP1, selectedMemberIdP1, customNameP1);
    const p1Tribe = person1Source === 'tree' ? userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.tribe : customTribeP1;
    const p1Clan = person1Source === 'tree' ? userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.clan : customClanP1;

    // Gather Person 2 Info
    const p2Details = getMemberDetails(person2Source, person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2);
    const p2Tribe = person2Source === 'tree' ? userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.tribe : customTribeP2;
    const p2Clan = person2Source === 'tree' ? userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.clan : customClanP2;

    if (!p1Details.name || !p2Details.name) {
      toast.error("Please provide names for both individuals.");
      setIsLoading(false);
      return;
    }

    console.log("Analyzing:", p1Details, " (T:",p1Tribe, "C:", p1Clan, "E:", selectedLineageEldersP1,") vs ", p2Details, "(T:",p2Tribe, "C:", p2Clan, "E:", selectedLineageEldersP2, ")");
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    let result: RelationshipResult = { isRelated: false, confidenceScore: 0.1, analysisNotes: ["Initial assessment based on provided data."] };

    // --- More Sophisticated Simulated Analysis ---
    // 1. Check if in the same user-created tree and try to find a direct link
    if (person1Source === 'tree' && person2Source === 'tree' && selectedTreeIdP1 && selectedTreeIdP1 === (person2Source === 'tree' ? selectedTreeIdP1 : "अलगTreeId")) { // P2 from same tree as P1
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
        if (tree && selectedMemberIdP1 && selectedMemberIdP2) {
            const member1 = tree.members.find(m => m.id === selectedMemberIdP1);
            const member2 = tree.members.find(m => m.id === selectedMemberIdP2);
            if (member1 && member2) {
                if (member1.parentId === member2.id || member2.parentId === member1.id) {
                    result = { isRelated: true, relationshipType: "Parent-Child", confidenceScore: 0.95, pathDescription: `${member1.name} and ${member2.name} are directly related as Parent/Child in the same tree.`, analysisNotes: ["Direct link found in user's tree."]};
                } else if (member1.spouseId === member2.id || member2.spouseId === member1.id) {
                    result = { isRelated: true, relationshipType: "Spouses", confidenceScore: 0.95, pathDescription: `${member1.name} and ${member2.name} are spouses in the same tree.`, analysisNotes: ["Direct spouse link found."]} ;
                } else if (member1.parentId && member1.parentId === member2.parentId) {
                    result = { isRelated: true, relationshipType: "Siblings", confidenceScore: 0.9, pathDescription: `${member1.name} and ${member2.name} are likely siblings (share a parent).`, analysisNotes: ["Shared parent found in user's tree."]};
                }
                // Basic grandparent check
                else if (member1.parentId && tree.members.find(m=>m.id === member1.parentId)?.parentId === member2.id) {
                     result = { isRelated: true, relationshipType: "Grandparent-Grandchild", confidenceScore: 0.85, pathDescription: `${member2.name} is likely a grandparent of ${member1.name}.`, analysisNotes: ["Grandparent link found."]};
                } else if (member2.parentId && tree.members.find(m=>m.id === member2.parentId)?.parentId === member1.id) {
                     result = { isRelated: true, relationshipType: "Grandparent-Grandchild", confidenceScore: 0.85, pathDescription: `${member1.name} is likely a grandparent of ${member2.name}.`, analysisNotes: ["Grandparent link found."]};
                }
                 // Add more direct checks: uncle/aunt, cousin (would require finding common grandparent)
            }
        }
    }

    // 2. Check Clan & Tribal Elders if not directly related in a tree
    if (!result.isRelated || result.confidenceScore < 0.8) {
        const commonElders = findCommonClanElders(selectedLineageEldersP1, selectedLineageEldersP2);
        if (commonElders.length > 0) {
            result = {
                isRelated: true, relationshipType: "Shared Clan Ancestry",
                commonAncestors: commonElders.map(e => ({id: e.id, name: e.name, type: 'clan_elder'})),
                confidenceScore: 0.75 + commonElders.length * 0.05, // Higher confidence with more common elders
                pathDescription: `Both individuals trace lineage to common historical elder(s): ${commonElders.map(e => e.name).join(', ')}.`,
                analysisNotes: ["Common historical elders identified through user selection."]
            };
        } else if (p1Clan && p1Clan === p2Clan && p1Tribe === p2Tribe) {
            result = {
                isRelated: true, relationshipType: "Same Clan",
                clanContext: `Both individuals associate with the ${p1Clan} clan of the ${p1Tribe} tribe.`,
                confidenceScore: 0.6,
                pathDescription: `Belonging to the same clan (${p1Clan}) suggests a high likelihood of shared, though potentially distant, ancestry.`,
                analysisNotes: ["Same tribe and clan identified."]
            };
        } else if (p1Tribe && p1Tribe === p2Tribe) {
            // Check for common Tribal Ancestor via their selected elders if any
            const p1Founders = selectedLineageEldersP1.map(id => getFullClanElder(id, p1Tribe, p1Clan)).filter(e => e && e.parentId && e.parentId.startsWith("TA_"));
            const p2Founders = selectedLineageEldersP2.map(id => getFullClanElder(id, p2Tribe, p2Clan)).filter(e => e && e.parentId && e.parentId.startsWith("TA_"));
            const commonTA = p1Founders.find(f1 => p2Founders.some(f2 => f1.parentId === f2.parentId));

            if (commonTA) {
                 result = {
                    isRelated: true, relationshipType: "Shared Tribal Origin",
                    clanContext: `Individuals are from different clans but the same tribe (${p1Tribe}), and their selected elder lineages trace to a common tribal progenitor.`,
                    confidenceScore: 0.45,
                    pathDescription: `A very distant connection through the ${p1Tribe} tribe's foundational history is possible.`,
                    analysisNotes: ["Same tribe identified, with selected elders pointing to common Tribal Ancestor."]
                };
            } else if (p1Tribe) { // Just same tribe, no common TA from selected elders
                 result = {
                    isRelated: true, relationshipType: "Same Tribe",
                    clanContext: `Individuals are from the same tribe (${p1Tribe}) but different clans.`,
                    confidenceScore: 0.3,
                    pathDescription: `A distant common origin within the ${p1Tribe} tribe might exist.`,
                    analysisNotes: ["Same tribe identified."]
                };
            }
        }
    }
     if (!result.isRelated && result.confidenceScore < 0.2) { // If still very low or not related
        result.pathDescription = "No clear ancestral or close familial connection could be established based on the provided information and selected elders.";
        result.analysisNotes?.push("Consider providing more specific elder connections or using DNA analysis for deeper insights.");
    }


    setRelationshipResult(result);
    setIsLoading(false);
  };

  const resetAnalysis = () => { /* ... Same as before ... */ 
    setRelationshipResult(null);
    // Reset P1
    // setPerson1Source('tree'); // Or a default
    setSelectedTreeIdP1(userFamilyTrees.length > 0 ? userFamilyTrees[0].id : undefined);
    setSelectedMemberIdP1(undefined);
    setCustomNameP1(""); setCustomTribeP1(undefined); setCustomClanP1(undefined);
    setSelectedLineageEldersP1([]); setAvailableClansP1([]); setAvailableEldersP1([]);
    // Reset P2
    // setPerson2Source('custom'); // Or a default
    setSelectedMemberIdP2(undefined); // P2 tree selection depends on P1's tree
    setCustomNameP2(""); setCustomTribeP2(undefined); setCustomClanP2(undefined);
    setSelectedLineageEldersP2([]); setAvailableClansP2([]); setAvailableEldersP2([]);
  };

  // Helper to render the selection UI for a person
  const renderPersonSelector = (
    personNum: 1 | 2,
    source: PersonInputType,
    onSourceChange: (value: PersonInputType) => void,
    selectedTreeId: string | undefined,
    onTreeChange: (value: string | undefined) => void,
    availableMembers: FamilyMember[],
    selectedMemberId: string | undefined,
    onMemberChange: (value: string | undefined) => void,
    customName: string,
    onCustomNameChange: (value: string) => void,
    customTribe: string | undefined,
    onCustomTribeChange: (value: string | undefined) => void,
    availableClans: ClanType[],
    customClan: string | undefined,
    onCustomClanChange: (value: string | undefined) => void,
    availableElders: FullClanElderType[],
    selectedElders: string[], // Array of elder IDs
    onEldersChange: (ids: string[]) => void,
    disabled?: boolean
  ) => {
    const handleElderMultiSelect = (elderId: string) => {
        onEldersChange(
            selectedElders.includes(elderId)
                ? selectedElders.filter(id => id !== elderId)
                : [...selectedElders, elderId]
        );
    };

    return (
      <Card className="flex-1 min-w-[300px]">
        <CardHeader>
          <CardTitle>Person {personNum}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={source} onValueChange={(val) => onSourceChange(val as PersonInputType)} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tree" id={`p${personNum}-tree`} disabled={disabled || userFamilyTrees.length === 0}/>
              <Label htmlFor={`p${personNum}-tree`} className={userFamilyTrees.length === 0 ? "text-muted-foreground" : ""}>
                From My Tree {userFamilyTrees.length === 0 ? "(No trees)" : ""}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id={`p${personNum}-custom`} disabled={disabled}/>
              <Label htmlFor={`p${personNum}-custom`}>Custom Input</Label>
            </div>
          </RadioGroup>

          {source === 'tree' && userFamilyTrees.length > 0 && (
            <>
              {personNum === 1 && ( // Tree selection only for Person 1, P2 uses P1's tree if 'tree' source
                <div className="space-y-1">
                  <Label htmlFor={`tree-p${personNum}`}>Select Family Tree</Label>
                  <Select value={selectedTreeId || undefined} onValueChange={onTreeChange}>
                    <SelectTrigger id={`tree-p${personNum}`}><SelectValue placeholder="Select tree" /></SelectTrigger>
                    <SelectContent>
                      {userFamilyTrees.map(tree => (
                        <SelectItem key={tree.id} value={tree.id}>{tree.surname} Tree ({tree.clan})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedTreeId && ( // Member select only if tree is selected
                <div className="space-y-1">
                  <Label htmlFor={`member-p${personNum}`}>Select Person from Tree</Label>
                  <Select value={selectedMemberId || undefined} onValueChange={onMemberChange}>
                    <SelectTrigger id={`member-p${personNum}`}><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {availableMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name} ({member.relationship})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {source === 'custom' && (
            <>
              <div className="space-y-1"><Label htmlFor={`customName-p${personNum}`}>Name *</Label><Input id={`customName-p${personNum}`} value={customName} onChange={e => onCustomNameChange(e.target.value)} placeholder="Full name"/></div>
              <div className="space-y-1"><Label htmlFor={`customTribe-p${personNum}`}>Tribe</Label>
                <Select value={customTribe || undefined} onValueChange={onCustomTribeChange}>
                    <SelectTrigger id={`customTribe-p${personNum}`}><SelectValue placeholder="Select tribe"/></SelectTrigger>
                    <SelectContent>{ugandaTribesData.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {customTribe && (
                <div className="space-y-1"><Label htmlFor={`customClan-p${personNum}`}>Clan</Label>
                  <Select value={customClan || undefined} onValueChange={onCustomClanChange} disabled={availableClans.length === 0}>
                      <SelectTrigger id={`customClan-p${personNum}`}><SelectValue placeholder={availableClans.length > 0 ? "Select clan" : "No clans in tribe"}/></SelectTrigger>
                      <SelectContent>{availableClans.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
          {/* Elder Selection for this person */}
           {( (source === 'custom' && customClan) || (source === 'tree' && selectedMemberId) ) && availableElders.length > 0 && (
            <div className="space-y-2 pt-2 border-t mt-4">
                <Label className="text-sm">Known Ancestral Elders (Optional, select up to 2)</Label>
                <p className="text-xs text-muted-foreground">Select elders you believe are in this person's lineage.</p>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {availableElders.map(elder => (
                    <div key={elder.id} className={`flex items-center justify-between p-2 border rounded-md text-xs hover:bg-muted/50 ${selectedElders.includes(elder.id) ? 'bg-uganda-yellow/20 border-uganda-yellow' : 'bg-transparent'}`}>
                        <div>
                            <span className="font-medium">{elder.name}</span> <span className="text-muted-foreground">({elder.approximateEra})</span>
                        </div>
                        <Button 
                            size="xs" 
                            variant={selectedElders.includes(elder.id) ? "destructive" : "outline"}
                            onClick={() => handleElderMultiSelect(elder.id)}
                            disabled={!selectedElders.includes(elder.id) && selectedElders.length >= 2}
                        >
                            {selectedElders.includes(elder.id) ? "Remove" : "Add"}
                        </Button>
                    </div>
                ))}
                </div>
            </div>
           )}
        </CardContent>
      </Card>
    );
  };


  // Auth check
  if (!user && !showAuth) { // If no user and auth form not shown, trigger auth form.
    setShowAuth(true); // This will make the return below show the AuthForm prompt
  }
  if (showAuth && !user) { // If showAuth is true AND user is still null (AuthForm didn't result in user yet)
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Authentication Required</CardTitle>
              <CardDescription className="text-center">
                Please log in or sign up to use the Relationship Analyzer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm onClose={() => setShowAuth(false)} />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  if (!user && showAuth) { // If auth form is shown, but user hasn't logged in yet.
      return (
          <div className="min-h-screen flex flex-col">
             <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
             <main className="flex-grow flex items-center justify-center">
                <AuthForm onClose={() => {setShowAuth(false); if(!user) navigate('/');}} />
             </main>
             <Footer/>
          </div>
      )
  }
  if (!user) { // Fallback if user is null after checks (should be caught by above)
    return (
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <div className="flex-grow flex items-center justify-center text-center">
                <p>Loading user information or please log in.</p>
            </div>
            <Footer/>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-uganda-yellow/10 via-uganda-red/5 to-uganda-black/5 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto"> {/* Increased max-width */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black dark:text-slate-100 mb-3">
              Relationship Analyzer
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover potential connections between individuals based on shared ancestry, clan elders, and tribal heritage.
            </p>
          </div>
          
          {!relationshipResult ? (
            <form onSubmit={(e) => {e.preventDefault(); handleAnalyzeRelationship();}}>
              <Card className="shadow-xl dark:bg-slate-800/70">
                <CardHeader>
                  <CardTitle className="text-2xl">Analyze Relationship Between Two Individuals</CardTitle>
                  <CardDescription>
                    Select individuals from your family tree or enter custom details. 
                    Optionally, associate them with known clan elders for a deeper analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {renderPersonSelector(
                      1, person1Source, setPerson1Source,
                      selectedTreeIdP1, setSelectedTreeIdP1,
                      selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP1, setSelectedMemberIdP1,
                      customNameP1, setCustomNameP1,
                      customTribeP1, setCustomTribeP1,
                      availableClansP1, customClanP1, setCustomClanP1,
                      availableEldersP1, selectedLineageEldersP1, setSelectedLineageEldersP1
                    )}
                    {renderPersonSelector(
                      2, person2Source, setPerson2Source,
                      selectedTreeIdP1, (val) => {/* P2 uses P1's tree if selected, no separate tree selection for P2 */}, // P2 uses P1's tree
                      person2Source === 'tree' && selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP2, setSelectedMemberIdP2,
                      customNameP2, setCustomNameP2,
                      customTribeP2, setCustomTribeP2,
                      availableClansP2, customClanP2, setCustomClanP2,
                      availableEldersP2, selectedLineageEldersP2, setSelectedLineageEldersP2
                    )}
                  </div>
                  <div className="text-center pt-4">
                    <Button 
                      type="submit"
                      className="bg-uganda-red text-white hover:bg-uganda-red/90 px-10 py-3 text-lg rounded-lg shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading || ((person1Source === 'custom' && !customNameP1) || (person1Source === 'tree' && !selectedMemberIdP1)) || ((person2Source === 'custom' && !customNameP2) || (person2Source === 'tree' && !selectedMemberIdP2))}
                    >
                      <Search className="mr-2 h-5 w-5" />
                      {isLoading ? "Analyzing..." : "Analyze Relationship"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          ) : (
            <Card className="shadow-xl dark:bg-slate-800/70">
              <CardHeader className={`bg-gradient-to-r ${relationshipResult.isRelated ? 'from-green-500/20 to-green-400/20 dark:from-green-700/30 dark:to-green-600/30' : 'from-gray-500/20 to-gray-400/20 dark:from-slate-700/30 dark:to-slate-600/30'} p-6 rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-uganda-black dark:text-white">Relationship Analysis Result</CardTitle>
                  <Button variant="outline" onClick={resetAnalysis} className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700">New Analysis</Button>
                </div>
                 <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Between: <span className="font-semibold">{getMemberDetails(person1Source, selectedTreeIdP1, selectedMemberIdP1, customNameP1).name}</span> and <span className="font-semibold">{getMemberDetails(person2Source, person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2).name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 p-6 space-y-6">
                <div className={`p-4 rounded-lg text-center ${relationshipResult.isRelated ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : 'bg-red-100 dark:bg-red-900/50 border-red-500'} border`}>
                  <h3 className={`text-xl font-semibold ${relationshipResult.isRelated ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {relationshipResult.isRelated ? `Likely Related: ${relationshipResult.relationshipType || "Connection Found"}` : "Likely Unrelated"}
                  </h3>
                  {relationshipResult.pathDescription && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{relationshipResult.pathDescription}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/30 dark:border-slate-600">
                    <h4 className="text-lg font-medium flex items-center text-uganda-black dark:text-slate-100 mb-3">
                      <Users className="mr-2 h-5 w-5 text-uganda-yellow" />
                      Analysis Details
                    </h4>
                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {relationshipResult.generationalDistance !== undefined && (
                        <p><span className="font-medium">Generational Distance:</span> {relationshipResult.generationalDistance} generation(s)</p>
                      )}
                      <p><span className="font-medium">Confidence Score:</span> {Math.round(relationshipResult.confidenceScore * 100)}%</p>
                      {relationshipResult.clanContext && <p className="mt-2"><span className="font-medium">Cultural Context:</span> {relationshipResult.clanContext}</p>}
                    </div>
                  </div>

                  {relationshipResult.commonAncestors && relationshipResult.commonAncestors.length > 0 && (
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/30 dark:border-slate-600">
                      <h4 className="text-lg font-medium flex items-center text-uganda-black dark:text-slate-100 mb-3">
                        <Link2 className="mr-2 h-5 w-5 text-uganda-red" />
                        Shared Ancestral Links
                      </h4>
                      <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {relationshipResult.commonAncestors.map((ancestor, idx) => (
                          <li key={idx}>{ancestor.name} <span className="text-xs text-muted-foreground">({ancestor.type === 'clan_elder' ? 'Historical Elder' : 'Family Member'})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {relationshipResult.analysisNotes && relationshipResult.analysisNotes.length > 0 && (
                  <div className="p-4 border rounded-lg mt-6 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700">
                    <h4 className="text-lg font-medium flex items-center text-uganda-black dark:text-slate-100 mb-3">
                      <Info className="mr-2 h-5 w-5 text-blue-500" />
                      Analysis Notes & Path
                    </h4>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {relationshipResult.analysisNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-center pt-6">
                  <Button onClick={resetAnalysis} variant="outline" className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700">
                    Analyze Another Relationship
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
      {showAuth && user === null && ( // Only show AuthForm if explicitly triggered and user is null
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default RelationshipAnalyzer;
