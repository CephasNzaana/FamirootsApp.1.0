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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Link2, Clock, UserCircle2, Search, Info, AlertTriangle, GitMerge, Users2, BarChart3, Zap, Brain } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FamilyTree, FamilyMember, ElderReference, ClanElder as FullClanElderType, Tribe as TribeType, Clan as ClanType } from "@/types";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { Separator } from "@/components/ui/separator";

interface RelationshipResult {
  isRelated: boolean;
  relationshipType?: string;
  pathDescription?: string;
  commonAncestors?: { id: string; name: string; type: 'clan_elder' | 'family_member' | 'tribal_progenitor' }[];
  generationalDistanceP1?: number;
  generationalDistanceP2?: number;
  clanContext?: string;
  confidenceScore: number;
  analysisNotes?: string[];
  culturalSignificance?: string;
  aiInsights?: string;
  rawAiResponseForDebugging?: any;
}

type PersonInputType = "tree" | "custom";

interface PersonDetails {
    id?: string;
    name: string;
    generation?: number;
    parentId?: string;
    spouseId?: string;
    gender?: 'male' | 'female';
    tribe?: string;
    clan?: string;
    selectedElders?: string[]; // IDs of FullClanElderType
}

const RelationshipAnalyzer = () => {
  const { user, session } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [userFamilyTrees, setUserFamilyTrees] = useState<FamilyTree[]>([]);

  // Person 1 State
  const [person1Source, setPerson1Source] = useState<PersonInputType>("custom");
  const [selectedTreeIdP1, setSelectedTreeIdP1] = useState<string>(""); // Initialize as ""
  const [selectedMemberIdP1, setSelectedMemberIdP1] = useState<string>(""); // Initialize as ""
  const [customNameP1, setCustomNameP1] = useState<string>("");
  const [customTribeP1, setCustomTribeP1] = useState<string>("");
  const [customClanP1, setCustomClanP1] = useState<string>("");
  const [availableClansP1, setAvailableClansP1] = useState<ClanType[]>([]);
  const [availableEldersP1, setAvailableEldersP1] = useState<FullClanElderType[]>([]);
  const [selectedLineageEldersP1, setSelectedLineageEldersP1] = useState<string[]>([]);

  // Person 2 State
  const [person2Source, setPerson2Source] = useState<PersonInputType>("custom");
  const [selectedMemberIdP2, setSelectedMemberIdP2] = useState<string>("");
  const [customNameP2, setCustomNameP2] = useState<string>("");
  const [customTribeP2, setCustomTribeP2] = useState<string>("");
  const [customClanP2, setCustomClanP2] = useState<string>("");
  const [availableClansP2, setAvailableClansP2] = useState<ClanType[]>([]);
  const [availableEldersP2, setAvailableEldersP2] = useState<FullClanElderType[]>([]);
  const [selectedLineageEldersP2, setSelectedLineageEldersP2] = useState<string[]>([]);

  const [relationshipResult, setRelationshipResult] = useState<RelationshipResult | null>(null);

  const getSafeGeneration = (member: FamilyMember | { generation?: number | string } | PersonDetails): number => {
    const gen = member.generation;
    return typeof gen === 'number' ? gen : (typeof gen === 'string' && !isNaN(parseInt(gen)) ? parseInt(gen, 10) : 0);
  };

  const fetchFamilyTrees = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees').select('*, family_members(*)').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (treesError) throw treesError;
      const formattedTrees: FamilyTree[] = (treesData || []).map(tree => ({
        id: tree.id, userId: tree.user_id, surname: tree.surname, tribe: tree.tribe, clan: tree.clan, createdAt: tree.created_at,
        members: (tree.family_members || []).map((dbMember: any) => ({
          id: dbMember.id, name: dbMember.name, relationship: dbMember.relationship,
          birthYear: dbMember.birth_year, deathYear: dbMember.death_year || undefined,
          generation: getSafeGeneration(dbMember), parentId: dbMember.parent_id || undefined,
          spouseId: dbMember.spouse_id || undefined, isElder: Boolean(dbMember.is_elder),
          gender: (dbMember.gender as 'male' | 'female' | undefined) || undefined,
          side: (dbMember.side as 'maternal' | 'paternal' | undefined) || undefined,
          status: dbMember.status || (dbMember.death_year ? 'deceased' : 'living'),
          notes: dbMember.notes || undefined, photoUrl: dbMember.photo_url || undefined,
        }) as FamilyMember)
      }));
      setUserFamilyTrees(formattedTrees);
      if (formattedTrees.length > 0 && !selectedTreeIdP1) { setSelectedTreeIdP1(formattedTrees[0].id); }
    } catch (error: any) {
      console.error("Error fetching family trees:", error);
      toast.error(error.message || "Failed to load your family trees.");
    } finally { setIsLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (user) { setShowAuth(false); fetchFamilyTrees(); } 
    else if (!session && !isLoading) { setShowAuth(true); setUserFamilyTrees([]); }
    else { setIsLoading(false); setUserFamilyTrees([]); }
  }, [user, session, fetchFamilyTrees]);

  const setupDynamicSelects = useCallback((
    personSource: PersonInputType, 
    treeIdForPerson: string | undefined, 
    userTreesList: FamilyTree[],
    customTribeForPerson: string | undefined, 
    customClanForPerson: string | undefined, // Only for 'custom' source
    setAvailableClansList: React.Dispatch<React.SetStateAction<ClanType[]>>,
    setAvailableEldersList: React.Dispatch<React.SetStateAction<FullClanElderType[]>>,
    resetSelectedLineageElders: () => void
  ) => {
    let effectiveTribeName: string | undefined;
    let effectiveClanName: string | undefined;

    if (personSource === 'custom') {
      effectiveTribeName = customTribeForPerson;
      effectiveClanName = customClanForPerson;
    } else if (personSource === 'tree' && treeIdForPerson) {
      const tree = userTreesList.find(t => t.id === treeIdForPerson);
      effectiveTribeName = tree?.tribe;
      effectiveClanName = tree?.clan; 
    }

    if (effectiveTribeName) {
      const tribeData = ugandaTribesData.find(t => t.name === effectiveTribeName);
      setAvailableClansList(tribeData ? tribeData.clans : []);
      if (effectiveClanName) { // Use effectiveClanName for finding elders
        const clanData = tribeData?.clans.find(c => c.name === effectiveClanName);
        setAvailableEldersList(clanData?.elders || []);
      } else {
        setAvailableEldersList([]);
      }
    } else {
      setAvailableClansList([]);
      setAvailableEldersList([]);
    }
    resetSelectedLineageElders();
  }, []); 

  useEffect(() => {
    setupDynamicSelects(person1Source, selectedTreeIdP1, userFamilyTrees, customTribeP1, customClanP1, setAvailableClansP1, setAvailableEldersP1, () => setSelectedLineageEldersP1([]));
  }, [person1Source, selectedTreeIdP1, customTribeP1, customClanP1, userFamilyTrees, setupDynamicSelects]);

  useEffect(() => {
    setupDynamicSelects(person2Source, selectedTreeIdP1, userFamilyTrees, customTribeP2, customClanP2, setAvailableClansP2, setAvailableEldersP2, () => setSelectedLineageEldersP2([]));
  }, [person2Source, selectedTreeIdP1, customTribeP2, customClanP2, userFamilyTrees, setupDynamicSelects]);
  
  const getAncestryPath = (memberId: string, members: FamilyMember[]): FamilyMember[] => { 
    const path: FamilyMember[] = []; let currentMember = members.find(m => m.id === memberId);
    const visited = new Set<string>();
    while (currentMember) {
        if (visited.has(currentMember.id)) { console.warn("Cycle in ancestry for:", currentMember.id); break; }
        visited.add(currentMember.id); path.push(currentMember);
        if (!currentMember.parentId) break;
        currentMember = members.find(m => m.id === currentMember!.parentId);
    } return path;
  };
  const findLCA = (pathA: FamilyMember[], pathB: FamilyMember[]): FamilyMember | null => { 
    const pathAIds = new Set(pathA.map(m => m.id));
    for (const memberB of pathB) { if (pathAIds.has(memberB.id)) return memberB; }
    return null;
  };
  
  const getFullClanElderById = (elderId: string): FullClanElderType | undefined => { 
    for (const tribe of ugandaTribesData) {
        for (const clan of tribe.clans) {
            const found = clan.elders?.find(e => e.id === elderId);
            if (found) return { ...found, clanName: clan.name, tribeId: tribe.id, tribeName: tribe.name };
        }
    } return undefined;
  };
  const traceElderAncestry = (elderId: string, maxDepth = 3): FullClanElderType[] => { 
      const ancestry: FullClanElderType[] = []; let currentElder = getFullClanElderById(elderId);
      for (let i = 0; i < maxDepth && currentElder; i++) {
          ancestry.push(currentElder);
          if (!currentElder.parentId || currentElder.parentId.startsWith("TA_")) break;
          currentElder = getFullClanElderById(currentElder.parentId);
      } return ancestry.reverse();
  };

  const findCommonClanElders = (
    elderIdsP1: string[],
    elderIdsP2: string[]
  ): FullClanElderType[] => {
    if (!elderIdsP1.length || !elderIdsP2.length) return [];
    
    const getAncestryForElder = (elderId: string, maxTraceDepth: number = 3): Set<string> => {
        const ancestors = new Set<string>();
        let current = getFullClanElderById(elderId);
        for (let i = 0; i < maxTraceDepth && current; i++) {
            ancestors.add(current.id);
            if (current.parentId && !current.parentId.startsWith("TA_")) {
                current = getFullClanElderById(current.parentId);
            } else if (current.parentId && current.parentId.startsWith("TA_")) {
                ancestors.add(current.parentId); 
                break;
            } else {
                break;
            }
        }
        return ancestors;
    };

    const allAncestorsP1 = new Set<string>();
    elderIdsP1.forEach(id => getAncestryForElder(id).forEach(ancId => allAncestorsP1.add(ancId)));

    const commonElderIds = new Set<string>();
    elderIdsP2.forEach(id => {
        const ancestorsP2 = getAncestryForElder(id);
        ancestorsP2.forEach(ancId => {
            if (allAncestorsP1.has(ancId)) {
                commonElderIds.add(ancId);
            }
        });
    });
    
    return Array.from(commonElderIds).map(id => getFullClanElderById(id)).filter(Boolean) as FullClanElderType[];
  };

  const getSimulatedAIInsights = async ( /* ... same as before ... */ ) => { /* ... */ return { summary: "Simulated AI: Further analysis suggests a notable connection based on shared cultural markers."} as any; };

  const getMemberDetailsForAnalysis = ( /* ... same as before ... */ ) => { /* ... */ }  as (
    source: PersonInputType, 
    treeId: string | undefined, 
    memberId: string | undefined, 
    customName: string,
    customPersonTribe?: string,
    customPersonClan?: string,
    lineageElders?: string[]
  ) => PersonDetails;


  const handleAnalyzeRelationship = async () => { /* ... (Full logic from previous version, ensuring findCommonClanElders is called correctly) ... */ };
  
  const resetAnalysis = () => { /* ... Same as before ... */  };

  // --- RENDER PERSON SELECTOR (This was missing/incomplete previously) ---
  const renderPersonSelector = (
    personNum: 1 | 2,
    source: PersonInputType,
    onSourceChange: (value: PersonInputType) => void,
    selectedTreeIdProp: string | undefined, // Renamed to avoid conflict with state
    onTreeChange: (value: string) => void, // Value is string (ID or "")
    availableMembersInTree: FamilyMember[],
    selectedMemberIdProp: string | undefined, // Renamed
    onMemberChange: (value: string) => void,  // Value is string (ID or "")
    customNameState: string,
    onCustomNameChange: (value: string) => void,
    customTribeState: string | undefined,
    onCustomTribeChange: (value: string) => void, // Value is string (name or "")
    availableClansForCustom: ClanType[],
    customClanState: string | undefined,
    onCustomClanChange: (value: string) => void,   // Value is string (name or "")
    availableEldersForPerson: FullClanElderType[],
    selectedElderIdsState: string[], 
    onEldersChange: (ids: string[]) => void,
    disableTreeOption?: boolean
  ) => {
    const handleElderMultiSelect = (elderId: string) => {
        const newSelection = selectedElderIdsState.includes(elderId)
            ? selectedElderIdsState.filter(id => id !== elderId)
            : [...selectedElderIdsState, elderId];
        if (newSelection.length <= 2) {
            onEldersChange(newSelection);
        } else {
            toast.info("You can associate up to 2 key elders for analysis context.");
        }
    };

    const treeForThisPerson = personNum === 1 ? selectedTreeIdP1 : (person2Source === 'tree' ? selectedTreeIdP1 : undefined);
    const membersForThisPersonTree = treeForThisPerson ? userFamilyTrees.find(t => t.id === treeForThisPerson)?.members || [] : [];


    return (
      <Card className="flex-1 min-w-[300px] dark:bg-slate-800/50 dark:border-slate-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Person {personNum}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={source} 
            onValueChange={(val) => {
                onSourceChange(val as PersonInputType);
                if (val === 'custom') {
                    onMemberChange(""); // Clear tree member selection for this person
                    if(personNum === 1) onTreeChange(""); // Clear tree selection only for P1
                } else { // Switched to 'tree'
                    onCustomNameChange("");
                    onCustomTribeChange(""); // Reset custom tribe/clan
                    onCustomClanChange("");
                    onEldersChange([]);
                     // If P1 tree exists, and P2 is switching to tree, use P1's tree by default
                    if (personNum === 2 && selectedTreeIdP1) {
                        // No need to call onTreeChange for P2 as it uses P1's tree
                    } else if (personNum === 1 && userFamilyTrees.length > 0 && !selectedTreeIdP1){
                        onTreeChange(userFamilyTrees[0].id); // Auto-select first tree for P1
                    }
                }
            }} 
            className="flex space-x-4 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tree" id={`p${personNum}-tree`} disabled={disableTreeOption || userFamilyTrees.length === 0}/>
              <Label htmlFor={`p${personNum}-tree`} className={disableTreeOption || userFamilyTrees.length === 0 ? "text-muted-foreground dark:text-slate-500 cursor-not-allowed" : "dark:text-slate-200 cursor-pointer"}>
                From My Tree {userFamilyTrees.length === 0 && personNum === 1 ? "(No trees yet)" : ""}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id={`p${personNum}-custom`} />
              <Label htmlFor={`p${personNum}-custom`} className="dark:text-slate-200 cursor-pointer">Custom Input</Label>
            </div>
          </RadioGroup>
          <Separator className="dark:bg-slate-700"/>

          {source === 'tree' && (
            <>
              {personNum === 1 && userFamilyTrees.length > 0 && (
                <div className="space-y-1">
                  <Label htmlFor={`tree-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Select Your Family Tree</Label>
                  <Select value={selectedTreeIdProp || ""} onValueChange={onTreeChange}>
                    <SelectTrigger id={`tree-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder="Select tree" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                      {userFamilyTrees.map(tree => (<SelectItem key={tree.id} value={tree.id}>{tree.surname} Tree ({tree.clan})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
               {treeForThisPerson && ( 
                <div className="space-y-1">
                  <Label htmlFor={`member-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Select Person from Tree</Label>
                  <Select value={selectedMemberIdProp || ""} onValueChange={onMemberChange} disabled={membersForThisPersonTree.length === 0}>
                    <SelectTrigger id={`member-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder={membersForThisPersonTree.length > 0 ? "Select member" : "No members in tree"} /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                        <SelectItem value="">-- Clear Selection --</SelectItem>
                        {membersForThisPersonTree.map(member => (
                            <SelectItem key={member.id} value={member.id}>{member.name} ({member.relationship || `Gen ${getSafeGeneration(member)}`})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {source === 'custom' && (
            <>
              <div className="space-y-1"><Label htmlFor={`customName-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Name *</Label><Input id={`customName-p${personNum}`} value={customName} onChange={e => onCustomNameChange(e.target.value)} placeholder="Full name" className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"/></div>
              <div className="space-y-1"><Label htmlFor={`customTribe-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Tribe</Label>
                <Select value={customTribe || ""} onValueChange={(val) => onCustomTribeChange(val === "" ? "" : val)}>
                    <SelectTrigger id={`customTribe-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder="Select tribe"/></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                        <SelectItem value="">None / Unknown</SelectItem>
                        {ugandaTribesData.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              {customTribe && (
                <div className="space-y-1"><Label htmlFor={`customClan-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Clan</Label>
                  <Select value={customClan || ""} onValueChange={(val) => onCustomClanChange(val === "" ? "" : val)} disabled={availableClansForCustom.length === 0}>
                      <SelectTrigger id={`customClan-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder={availableClansForCustom.length > 0 ? "Select clan" : "Select tribe first or no clans"}/></SelectTrigger>
                      <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                          <SelectItem value="">None / Unknown</SelectItem>
                          {availableClansForCustom.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
           {((source === 'custom' && customClan) || (source === 'tree' && selectedMemberIdProp && treeForThisPerson)) && availableEldersForPerson.length > 0 && (
            <div className="space-y-2 pt-3 border-t dark:border-slate-600 mt-4">
                <Label className="text-sm font-medium dark:text-slate-300">Associated Clan Elders (Optional, max 2)</Label>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Select elders you believe are in this person's lineage.</p>
                <div className="max-h-32 overflow-y-auto space-y-2 p-2 border rounded-md dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                {availableEldersForPerson.map(elder => (
                    <div key={elder.id} className={`flex items-center justify-between p-1.5 border-b dark:border-slate-700 text-xs rounded-sm ${selectedElderIdsState.includes(elder.id) ? 'bg-uganda-yellow/20 dark:bg-uganda-yellow/10' : ''}`}>
                        <div>
                            <span className="font-medium dark:text-slate-200">{elder.name}</span> <span className="text-muted-foreground dark:text-slate-400">({elder.approximateEra})</span>
                        </div>
                        <Button 
                            size="xs" 
                            variant={selectedElderIdsState.includes(elder.id) ? "secondary" : "outline"}
                            onClick={(e) => {e.preventDefault(); handleElderMultiSelect(elder.id);}}
                            disabled={!selectedElderIdsState.includes(elder.id) && selectedElderIdsState.length >= 2}
                            className="text-xs h-7 px-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            {selectedElderIdsState.includes(elder.id) ? "Deselect" : "Select"}
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


  // --- Main Return JSX ---
  if (showAuth && !user) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <main className="flex-grow flex items-center justify-center p-4">
                 <AuthForm onClose={() => {
                    setShowAuth(false);
                    if(!user && window.location.pathname.includes('relationship-analyzer')) navigate('/');
                }} />
            </main>
            <Footer/>
        </div>
    );
  }
   if (!user && !isLoading) { 
    return (
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <Users2 size={64} className="text-gray-400 mb-6" />
                <h2 className="text-2xl font-semibold mb-3 text-uganda-black dark:text-slate-100">Access Relationship Analyzer</h2>
                <p className="text-muted-foreground dark:text-slate-400 mb-6 max-w-md">
                    Please log in or create an account to use this feature.
                </p>
                <Button onClick={() => setShowAuth(true)} className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                    Login / Sign Up
                </Button>
            </div>
            <Footer/>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-uganda-yellow/5 via-uganda-red/5 to-uganda-black/10 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 p-6 bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border dark:border-slate-700">
            <div className="flex justify-center mb-4">
                <Zap size={48} className="text-uganda-yellow" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-uganda-black dark:text-slate-100 mb-3">
              Relationship Analyzer
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Explore potential connections between individuals based on shared ancestry, clan elders, and tribal heritage.
            </p>
          </div>
          
          {!relationshipResult ? (
            <form onSubmit={(e) => {e.preventDefault(); handleAnalyzeRelationship();}}>
              <Card className="shadow-2xl dark:bg-slate-800/70 border dark:border-slate-700">
                <CardHeader className="border-b dark:border-slate-700">
                  <CardTitle className="text-2xl text-uganda-red">Define Individuals for Analysis</CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    Select individuals from your family tree or enter custom details. 
                    Optionally, associate them with known clan elders for a deeper analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    {renderPersonSelector(
                      1, person1Source, setPerson1Source,
                      selectedTreeIdP1, 
                      (val) => { // onTreeChange for P1
                        setSelectedTreeIdP1(val || ""); 
                        setSelectedMemberIdP1(""); 
                        setSelectedLineageEldersP1([]);
                        if (person2Source === 'tree') setSelectedMemberIdP2(""); // Reset P2 member if it was from old P1 tree
                      },
                      selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP1, 
                      (val) => { // onMemberChange for P1
                        setSelectedMemberIdP1(val || ""); 
                        if(val && person1Source === 'tree') { 
                            const tree = userFamilyTrees.find(t=>t.id===selectedTreeIdP1);
                            const m = tree?.members.find(mem=>mem.id===val); 
                            if (m) {
                                setCustomNameP1(m.name); // Store name for context even if from tree
                                setCustomTribeP1(tree?.tribe || ""); // Pre-fill tribe/clan
                                setCustomClanP1(tree?.clan || "");
                            }
                        } else if (!val) {
                            setCustomNameP1(""); // Clear if member is deselected
                        }
                      },
                      customNameP1, setCustomNameP1,
                      customTribeP1, (val) => { setCustomTribeP1(val || ""); setCustomClanP1(""); setSelectedLineageEldersP1([]); },
                      availableClansP1, customClanP1, (val) => { setCustomClanP1(val || ""); setSelectedLineageEldersP1([]); },
                      availableEldersP1, selectedLineageEldersP1, setSelectedLineageEldersP1
                    )}
                    {renderPersonSelector(
                      2, person2Source, 
                      (val) => { // onSourceChange for P2
                        setPerson2Source(val); 
                        if (val === 'custom') {
                            setSelectedMemberIdP2(undefined); 
                        } else { // Switched to 'tree' (uses P1's tree)
                            setCustomNameP2(""); setCustomTribeP2(undefined); setCustomClanP2(undefined); setSelectedLineageEldersP2([]);
                        }
                      },
                      selectedTreeIdP1, () => {}, // P2 uses P1's tree context, no separate onTreeChange for P2
                      person2Source === 'tree' && selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP2, 
                      (val) => { // onMemberChange for P2
                        setSelectedMemberIdP2(val || ""); 
                        if(val && person2Source === 'tree' && selectedTreeIdP1) { 
                            const tree = userFamilyTrees.find(t=>t.id===selectedTreeIdP1);
                            const m = tree?.members.find(mem=>mem.id===val); 
                            if (m) {
                                setCustomNameP2(m.name); // Store name for context
                                setCustomTribeP2(tree?.tribe || ""); // Pre-fill from P1's tree
                                setCustomClanP2(tree?.clan || "");
                            }
                        } else if (!val) {
                            setCustomNameP2("");
                        }
                      },
                      customNameP2, setCustomNameP2,
                      customTribeP2, (val) => {setCustomTribeP2(val || ""); setCustomClanP2(""); setSelectedLineageEldersP2([]); },
                      availableClansP2, customClanP2, (val) => {setCustomClanP2(val || ""); setSelectedLineageEldersP2([]); },
                      availableEldersP2, selectedLineageEldersP2, setSelectedLineageEldersP2,
                      userFamilyTrees.length === 0 || !selectedTreeIdP1 // Disable P2 tree option if P1's tree context is not available
                    )}
                  </div>
                  <CardFooter className="pt-8 justify-center">
                    <Button 
                      type="submit"
                      className="bg-uganda-red text-white hover:bg-uganda-red/80 px-12 py-3 text-lg rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      disabled={isLoading || 
                        ((person1Source === 'custom' && !customNameP1.trim()) || (person1Source === 'tree' && !selectedMemberIdP1)) || 
                        ((person2Source === 'custom' && !customNameP2.trim()) || (person2Source === 'tree' && !selectedMemberIdP2))}
                    >
                      <Search className="mr-2 h-5 w-5" />
                      {isLoading ? "Analyzing..." : "Analyze Relationship"}
                    </Button>
                  </CardFooter>
                </CardContent>
              </Card>
            </form>
          ) : (
             // --- Result Display Card (Ensure p1Data and p2Data are defined before accessing here) ---
            <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700">
              <CardHeader className={`p-6 rounded-t-lg ${relationshipResult.culturalSignificance ? 'bg-red-500/10 dark:bg-red-700/30' : relationshipResult.isRelated ? 'bg-green-500/10 dark:bg-green-700/30' : 'bg-gray-500/10 dark:bg-slate-700/30'}`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-uganda-black dark:text-white">Relationship Analysis Result</CardTitle>
                  <Button variant="outline" onClick={resetAnalysis} className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700">New Analysis</Button>
                </div>
                 <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Analysis between: <span className="font-semibold">{getMemberDetailsForAnalysis(person1Source, selectedTreeIdP1, selectedMemberIdP1, customNameP1, customTribeP1, customClanP1, selectedLineageEldersP1).name || "Person 1"}</span> & <span className="font-semibold">{getMemberDetailsForAnalysis(person2Source, person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2, customTribeP2, customClanP2, selectedLineageEldersP2).name || "Person 2"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 p-6 space-y-6">
                {relationshipResult.culturalSignificance && (
                    <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-500 dark:border-red-700 text-red-700 dark:text-red-300">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2"/>
                            <h4 className="font-semibold">Important Cultural Consideration</h4>
                        </div>
                        <p className="text-sm mt-1">{relationshipResult.culturalSignificance}</p>
                    </div>
                )}
                <div className={`p-4 rounded-lg text-center border ${relationshipResult.isRelated ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700' : 'bg-gray-100 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600'}`}>
                  <h3 className={`text-xl font-semibold ${relationshipResult.isRelated ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {relationshipResult.isRelated ? `Conclusion: ${relationshipResult.relationshipType || "Potential Connection Found"}` : "Conclusion: No Clear Genealogical Link Found"}
                  </h3>
                  {relationshipResult.pathDescription && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{relationshipResult.pathDescription}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="dark:bg-slate-700/30 dark:border-slate-600">
                    <CardHeader><CardTitle className="text-lg flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-uganda-yellow" /> Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {typeof relationshipResult.generationalDistanceP1 === 'number' && <p><span className="font-medium">{(getMemberDetailsForAnalysis(person1Source,selectedTreeIdP1,selectedMemberIdP1,customNameP1).name || "P1")} to LCA:</span> {relationshipResult.generationalDistanceP1} gen(s)</p>}
                      {typeof relationshipResult.generationalDistanceP2 === 'number' && <p><span className="font-medium">{(getMemberDetailsForAnalysis(person2Source, person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2).name || "P2")} to LCA:</span> {relationshipResult.generationalDistanceP2} gen(s)</p>}
                      <p><span className="font-medium">Confidence Score:</span> <span className={`font-bold ${relationshipResult.confidenceScore > 0.7 ? 'text-green-600 dark:text-green-400' : relationshipResult.confidenceScore > 0.4 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{Math.round(relationshipResult.confidenceScore * 100)}%</span></p>
                      {relationshipResult.clanContext && <p className="mt-2 pt-2 border-t dark:border-slate-600"><span className="font-medium">Cultural Context:</span> {relationshipResult.clanContext}</p>}
                    </CardContent>
                  </Card>

                  {relationshipResult.commonAncestors && relationshipResult.commonAncestors.length > 0 && (
                    <Card className="dark:bg-slate-700/30 dark:border-slate-600">
                      <CardHeader><CardTitle className="text-lg flex items-center"><Link2 className="mr-2 h-5 w-5 text-uganda-red" />Shared Links</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Common Ancestors / Elders Identified:</p>
                        <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {relationshipResult.commonAncestors.map((ancestor, idx) => (
                            <li key={idx}>{ancestor.name} <span className="text-xs text-muted-foreground">({ancestor.type.replace(/_/g, ' ')})</span></li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {relationshipResult.aiInsights && (
                     <Card className="dark:bg-slate-700/30 dark:border-slate-600">
                        <CardHeader><CardTitle className="text-lg flex items-center"><Brain size={18} className="mr-2 text-purple-500"/> Simulated AI Insights</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic whitespace-pre-wrap">{relationshipResult.aiInsights}</p>
                            <p className="text-xs text-muted-foreground mt-2">Note: AI insights are supplementary. For critical decisions, consult family elders or consider DNA testing.</p>
                        </CardContent>
                    </Card>
                )}

                {relationshipResult.analysisNotes && relationshipResult.analysisNotes.filter(note => !note.startsWith("AI-simulated")).length > 0 && (
                  <Card className="dark:bg-slate-700/30 dark:border-slate-600">
                    <CardHeader><CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-blue-500" /> Analysis Factors</CardTitle></CardHeader>
                    <CardContent>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {relationshipResult.analysisNotes.filter(note => !note.startsWith("AI-simulated")).map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                    </CardContent>
                  </Card>
                )}
                <div className="text-center pt-6">
                  <Button onClick={resetAnalysis} variant="outline" className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 px-6 py-3 text-base">
                    Analyze Another Relationship
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
      {showAuth && !user && (
        <AuthForm onClose={() => {
            setShowAuth(false);
            if(!user && window.location.pathname.includes('relationship-analyzer')) navigate('/');
        }} />
      )}
    </div>
  );
};

export default RelationshipAnalyzer;
