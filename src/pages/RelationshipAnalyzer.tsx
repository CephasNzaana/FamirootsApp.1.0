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
import { Users, Link2, Clock, UserCircle2, Search, Info, AlertTriangle, GitMerge, Users2, BarChart3 } from "lucide-react"; // Updated icons
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FamilyTree, FamilyMember, ElderReference, ClanElder as FullClanElderType, Tribe as TribeType, Clan as ClanType } from "@/types";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

interface RelationshipResult {
  isRelated: boolean;
  relationshipType?: string;
  pathDescription?: string;
  commonAncestors?: { id: string; name: string; type: 'clan_elder' | 'family_member' | 'tribal_progenitor' }[];
  generationalDistanceP1?: number; // Distance from P1 to LCA
  generationalDistanceP2?: number; // Distance from P2 to LCA
  clanContext?: string;
  confidenceScore: number;
  analysisNotes?: string[];
}

type PersonInputType = "tree" | "custom";

const RelationshipAnalyzer = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
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
  const [selectedLineageEldersP1, setSelectedLineageEldersP1] = useState<string[]>([]);

  // Person 2 State
  const [person2Source, setPerson2Source] = useState<PersonInputType>("custom");
  const [selectedMemberIdP2, setSelectedMemberIdP2] = useState<string | undefined>(undefined);
  const [customNameP2, setCustomNameP2] = useState<string>("");
  const [customTribeP2, setCustomTribeP2] = useState<string | undefined>(undefined);
  const [customClanP2, setCustomClanP2] = useState<string | undefined>(undefined);
  const [availableClansP2, setAvailableClansP2] = useState<ClanType[]>([]);
  const [availableEldersP2, setAvailableEldersP2] = useState<FullClanElderType[]>([]);
  const [selectedLineageEldersP2, setSelectedLineageEldersP2] = useState<string[]>([]);

  const [relationshipResult, setRelationshipResult] = useState<RelationshipResult | null>(null);

  const getSafeGeneration = (member: FamilyMember | { generation?: number | string }): number => {
    const gen = member.generation;
    return typeof gen === 'number' ? gen : (typeof gen === 'string' ? parseInt(gen, 10) : 0);
  };

  const fetchFamilyTrees = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*, family_members(*)')
        .eq('user_id', user.id);

      if (treesError) throw treesError;
      
      const formattedTrees: FamilyTree[] = (treesData || []).map(tree => ({
        id: tree.id,
        userId: tree.user_id,
        surname: tree.surname,
        tribe: tree.tribe,
        clan: tree.clan,
        createdAt: tree.created_at,
        members: (tree.family_members || []).map((dbMember: any) => ({
          id: dbMember.id,
          name: dbMember.name,
          relationship: dbMember.relationship,
          birthYear: dbMember.birth_year,
          deathYear: dbMember.death_year,
          generation: typeof dbMember.generation === 'number' ? dbMember.generation : parseInt(dbMember.generation || '0', 10),
          parentId: dbMember.parent_id,
          spouseId: dbMember.spouse_id,
          isElder: Boolean(dbMember.is_elder),
          gender: dbMember.gender as 'male' | 'female' | undefined,
          side: dbMember.side as 'maternal' | 'paternal' | undefined,
          status: dbMember.status as 'living' | 'deceased' || (dbMember.death_year ? 'deceased' : 'living'),
          notes: dbMember.notes,
          photoUrl: dbMember.photo_url,
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
  }, [user?.id]); // Removed selectedTreeIdP1 to allow re-fetch if user logs out and in

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      fetchFamilyTrees();
    } else {
      setShowAuth(true);
      setUserFamilyTrees([]);
      setSelectedTreeIdP1(undefined); // Reset selected tree on logout
    }
  }, [user, fetchFamilyTrees]);

  // Dynamic elder/clan loading for Person 1
  useEffect(() => {
    let tribeName: string | undefined;
    if (person1Source === 'custom') {
      tribeName = customTribeP1;
    } else if (person1Source === 'tree' && selectedTreeIdP1) {
      tribeName = userFamilyTrees.find(t => t.id === selectedTreeIdP1)?.tribe;
    }

    if (tribeName) {
      const tribe = ugandaTribesData.find(t => t.name === tribeName);
      setAvailableClansP1(tribe ? tribe.clans : []);
      if (person1Source === 'custom') { // Only reset clan for custom input if tribe changes
        setCustomClanP1(undefined);
        setAvailableEldersP1([]);
        setSelectedLineageEldersP1([]);
      } else if (person1Source === 'tree' && selectedTreeIdP1) { // For tree source, load elders based on tree's clan
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
        if (tree?.clan) {
            const clanData = tribe?.clans.find(c => c.name === tree.clan);
            setAvailableEldersP1(clanData?.elders || []);
        } else {
            setAvailableEldersP1([]);
        }
        setSelectedLineageEldersP1([]);
      }
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
    }
    // No else here to clear availableEldersP1 if P1 source is 'tree', that's handled by the above useEffect
  }, [customClanP1, customTribeP1, person1Source]);

  // Dynamic elder/clan loading for Person 2
  useEffect(() => {
    let tribeName: string | undefined;
    if (person2Source === 'custom') {
      tribeName = customTribeP2;
    } else if (person2Source === 'tree' && selectedTreeIdP1) { // P2 uses P1's selected tree
      tribeName = userFamilyTrees.find(t => t.id === selectedTreeIdP1)?.tribe;
    }
    
    if (tribeName) {
      const tribe = ugandaTribesData.find(t => t.name === tribeName);
      setAvailableClansP2(tribe ? tribe.clans : []);
      if (person2Source === 'custom') {
        setCustomClanP2(undefined);
        setAvailableEldersP2([]);
        setSelectedLineageEldersP2([]);
      } else if (person2Source === 'tree' && selectedTreeIdP1){
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
         if (tree?.clan) { // P2 is from same clan as P1's tree if P2 source is tree
            const clanData = tribe?.clans.find(c => c.name === tree.clan);
            setAvailableEldersP2(clanData?.elders || []);
        } else {
            setAvailableEldersP2([]);
        }
        setSelectedLineageEldersP2([]);
      }
    } else {
      setAvailableClansP2([]);
      setAvailableEldersP2([]);
    }
  }, [customTribeP2, person2Source, selectedTreeIdP1, userFamilyTrees]);

  useEffect(() => {
    if (person2Source === 'custom' && customTribeP2 && customClanP2) {
      const tribe = ugandaTribesData.find(t => t.name === customTribeP2);
      const clan = tribe?.clans.find(c => c.name === customClanP2);
      setAvailableEldersP2(clan?.elders || []);
      setSelectedLineageEldersP2([]);
    }
  }, [customClanP2, customTribeP2, person2Source]);

  // --- Graph Traversal Helpers ---
  const getAncestryPath = (memberId: string, members: FamilyMember[]): FamilyMember[] => {
    const path: FamilyMember[] = [];
    let currentMember = members.find(m => m.id === memberId);
    const visited = new Set<string>(); // To detect cycles

    while (currentMember) {
        if (visited.has(currentMember.id)) {
            console.warn("Cycle detected in ancestry path for member:", currentMember.id);
            break; 
        }
        visited.add(currentMember.id);
        path.push(currentMember);
        if (!currentMember.parentId) break;
        currentMember = members.find(m => m.id === currentMember!.parentId);
    }
    return path; // Path from member up to root/oldest ancestor
  };

  const findLCA = (pathA: FamilyMember[], pathB: FamilyMember[]): FamilyMember | null => {
      const pathAIds = new Set(pathA.map(m => m.id));
      for (const memberB of pathB) {
          if (pathAIds.has(memberB.id)) {
              return memberB; // First common ancestor found
          }
      }
      return null;
  };

  const getMemberDetailsForAnalysis = (
    source: PersonInputType, 
    treeId: string | undefined, 
    memberId: string | undefined, 
    customName: string,
    customPersonTribe?: string, // tribe for custom person
    customPersonClan?: string   // clan for custom person
  ): { id?: string, name: string, generation?: number, parentId?: string, spouseId?: string, tribe?: string, clan?: string } => {
    if (source === 'tree' && treeId && memberId) {
      const tree = userFamilyTrees.find(t => t.id === treeId);
      const member = tree?.members.find(m => m.id === memberId);
      return member ? { ...member, tribe: tree?.tribe, clan: tree?.clan, generation: getSafeGeneration(member) } : { name: customName || "Unknown Tree Member", tribe: tree?.tribe, clan: tree?.clan };
    }
    return { name: customName, tribe: customPersonTribe, clan: customPersonClan, generation: 0 }; // Custom person assumed gen 0 for context
  };

  const handleAnalyzeRelationship = async () => {
    setIsLoading(true);
    setRelationshipResult(null);

    const p1Data = getMemberDetailsForAnalysis(person1Source, selectedTreeIdP1, selectedMemberIdP1, customNameP1, customTribeP1, customClanP1);
    const p2Data = getMemberDetailsForAnalysis(person2Source, person1Source === 'tree' && person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2, customTribeP2, customClanP2);

    if (!p1Data.name || !p2Data.name) {
      toast.error("Please provide names for both individuals.");
      setIsLoading(false);
      return;
    }
    
    console.log("Analyzing P1:", p1Data, "Elders P1:", selectedLineageEldersP1);
    console.log("Analyzing P2:", p2Data, "Elders P2:", selectedLineageEldersP2);

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing
    let analysisResult: RelationshipResult = { isRelated: false, confidenceScore: 0.05, analysisNotes: ["Initial data points considered."] };

    // 1. Direct Tree Analysis (if both from the same selected tree)
    if (person1Source === 'tree' && person2Source === 'tree' && selectedTreeIdP1 && p1Data.id && p2Data.id && p1Data.id !== p2Data.id) {
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
        if (tree) {
            const member1 = tree.members.find(m=>m.id === p1Data.id);
            const member2 = tree.members.find(m=>m.id === p2Data.id);

            if (member1 && member2) {
                // Check spouse
                if (member1.spouseId === member2.id || member2.spouseId === member1.id) {
                    analysisResult = { isRelated: true, relationshipType: "Spouses", confidenceScore: 1.0, pathDescription: `${member1.name} and ${member2.name} are spouses.`, analysisNotes:["Direct spouse link in tree."] };
                } else {
                    const pathA = getAncestryPath(member1.id, tree.members);
                    const pathB = getAncestryPath(member2.id, tree.members);
                    const lca = findLCA(pathA, pathB);

                    if (lca) {
                        const distA = pathA.findIndex(m => m.id === lca.id); // generations from A to LCA (0 if A is LCA)
                        const distB = pathB.findIndex(m => m.id === lca.id); // generations from B to LCA

                        analysisResult.isRelated = true;
                        analysisResult.commonAncestors = [{id: lca.id, name: lca.name, type: 'family_member'}];
                        analysisResult.confidenceScore = 0.9;
                        analysisResult.generationalDistanceP1 = distA;
                        analysisResult.generationalDistanceP2 = distB;
                        analysisResult.analysisNotes?.push("Common ancestor found in family tree.");

                        if (distA === 0) { // member1 is ancestor of member2
                            analysisResult.relationshipType = distB === 1 ? "Parent-Child" : (distB === 2 ? "Grandparent-Grandchild" : "Direct Ancestor");
                            analysisResult.pathDescription = `${member1.name} is a direct ${distB === 1 ? 'parent' : distB === 2 ? 'grandparent' : 'ancestor'} of ${member2.name}.`;
                        } else if (distB === 0) { // member2 is ancestor of member1
                            analysisResult.relationshipType = distA === 1 ? "Parent-Child" : (distA === 2 ? "Grandparent-Grandchild" : "Direct Ancestor");
                            analysisResult.pathDescription = `${member2.name} is a direct ${distA === 1 ? 'parent' : distA === 2 ? 'grandparent' : 'ancestor'} of ${member1.name}.`;
                        } else if (distA === 1 && distB === 1) {
                            analysisResult.relationshipType = "Siblings";
                            analysisResult.pathDescription = `${member1.name} and ${member2.name} are siblings.`;
                        } else if ((distA === 1 && distB === 2) || (distA === 2 && distB === 1)) {
                            analysisResult.relationshipType = "Aunt/Uncle - Niece/Nephew";
                            analysisResult.pathDescription = `${member1.name} and ${member2.name} are in an Aunt/Uncle - Niece/Nephew relationship.`;
                        } else if (distA === 2 && distB === 2) {
                            analysisResult.relationshipType = "First Cousins";
                            analysisResult.pathDescription = `${member1.name} and ${member2.name} are first cousins.`;
                        } else {
                            analysisResult.relationshipType = "Shared Ancestor (e.g., Cousins)";
                            analysisResult.pathDescription = `${member1.name} and ${member2.name} share a common ancestor: ${lca.name}. They are likely cousins of some degree.`;
                        }
                    } else {
                         analysisResult.analysisNotes?.push("No common ancestor found within this specific tree structure.");
                         analysisResult.confidenceScore = 0.2;
                    }
                }
            }
        }
    }
    
    // 2. Fallback to Clan/Tribe/Elder based analysis if not directly related in tree or custom inputs
    if (!analysisResult.isRelated || analysisResult.confidenceScore < 0.8) {
        const commonClanElders = findCommonClanElders(selectedLineageEldersP1, selectedLineageEldersP2);
        const p1FullClan = p1Data.tribe && p1Data.clan ? `${p1Data.clan} clan of ${p1Data.tribe}` : "an unknown clan";
        const p2FullClan = p2Data.tribe && p2Data.clan ? `${p2Data.clan} clan of ${p2Data.tribe}` : "an unknown clan";
        analysisResult.clanContext = `${p1Data.name} (${p1FullClan}) and ${p2Data.name} (${p2FullClan}).`;

        if (commonClanElders.length > 0) {
            analysisResult.isRelated = true;
            analysisResult.relationshipType = analysisResult.relationshipType || "Shared Historical Clan Lineage";
            analysisResult.commonAncestors = [
                ...(analysisResult.commonAncestors || []), 
                ...commonClanElders.map(e => ({id: e.id, name: e.name, type: 'clan_elder' as 'clan_elder'}))
            ];
            analysisResult.confidenceScore = Math.max(analysisResult.confidenceScore, 0.70 + Math.min(commonClanElders.length * 0.05, 0.15));
            analysisResult.pathDescription = analysisResult.pathDescription || `Both individuals trace lineage to common historical elder(s): ${commonClanElders.map(e => e.name).join(', ')}.`;
            analysisResult.analysisNotes?.push("Common historical elders selected by user provide a strong link.");
        } else if (p1Data.clan && p1Data.clan === p2Data.clan && p1Data.tribe === p2Data.tribe) {
            analysisResult.isRelated = true;
            analysisResult.relationshipType = analysisResult.relationshipType || "Same Clan";
            analysisResult.confidenceScore = Math.max(analysisResult.confidenceScore, 0.6);
            analysisResult.pathDescription = analysisResult.pathDescription || `Belonging to the same clan (${p1Data.clan}) suggests a likelihood of shared, though potentially distant, ancestry.`;
            analysisResult.analysisNotes?.push("Individuals belong to the same tribe and clan.");
        } else if (p1Data.tribe && p1Data.tribe === p2Data.tribe) {
            analysisResult.isRelated = true; // Could still be distantly related
            analysisResult.relationshipType = analysisResult.relationshipType || "Same Tribe";
            analysisResult.confidenceScore = Math.max(analysisResult.confidenceScore, 0.35);
            analysisResult.pathDescription = analysisResult.pathDescription || `Individuals are from the same tribe (${p1Data.tribe}) but different clans. A very distant common origin might exist.`;
            analysisResult.analysisNotes?.push("Individuals belong to the same tribe.");
        }
    }

    if (!analysisResult.isRelated && analysisResult.confidenceScore < 0.2) {
        analysisResult.pathDescription = "No clear ancestral or close familial connection could be established based on the provided information and selected elders.";
        analysisResult.analysisNotes?.push("Consider providing more specific elder connections or using DNA analysis for deeper insights.");
    }


    setRelationshipResult(analysisResult);
    setIsLoading(false);
  };

  // ... (Auth check and main return JSX remains largely the same, PersonSelector will be used)
  if (showAuth && !user) {
    return ( /* ... Auth form prompt ... */ 
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <main className="flex-grow flex items-center justify-center p-4">
                <AuthForm onClose={() => {
                    setShowAuth(false);
                    // if (!user) navigate('/'); // Navigate away if auth is cancelled and still no user
                }} />
            </main>
            <Footer/>
        </div>
    );
  }
   if (!user) { // If still no user after initial check (e.g. AuthForm was closed without login)
    return (
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <div className="flex-grow flex items-center justify-center text-center p-4">
                <div>
                    <Users2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
                    <p className="text-muted-foreground mb-6">Please log in to use the Relationship Analyzer.</p>
                    <Button onClick={() => setShowAuth(true)}>Login / Sign Up</Button>
                </div>
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
                      selectedTreeIdP1, (val) => { setSelectedTreeIdP1(val); setSelectedMemberIdP1(undefined); setSelectedLineageEldersP1([]);},
                      selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP1, (val) => { setSelectedMemberIdP1(val); if(val) setCustomNameP1(userFamilyTrees.find(t=>t.id===selectedTreeIdP1)?.members.find(m=>m.id===val)?.name || ""); },
                      customNameP1, setCustomNameP1,
                      customTribeP1, setCustomTribeP1,
                      availableClansP1, customClanP1, setCustomClanP1,
                      availableEldersP1, selectedLineageEldersP1, setSelectedLineageEldersP1
                    )}
                    {renderPersonSelector(
                      2, person2Source, setPerson2Source,
                      selectedTreeIdP1, () => {}, // P2 uses P1's tree if source is 'tree', no dedicated tree selector
                      person2Source === 'tree' && selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP2, (val) => { setSelectedMemberIdP2(val); if(val) setCustomNameP2(userFamilyTrees.find(t=>t.id===selectedTreeIdP1)?.members.find(m=>m.id===val)?.name || "");},
                      customNameP2, setCustomNameP2,
                      customTribeP2, setCustomTribeP2,
                      availableClansP2, customClanP2, setCustomClanP2,
                      availableEldersP2, selectedLineageEldersP2, setSelectedLineageEldersP2,
                      person1Source === 'custom' && !selectedTreeIdP1 // Disable P2 tree option if P1 is custom and no tree is selected
                    )}
                  </div>
                  <CardFooter className="pt-6 justify-center">
                    <Button 
                      type="submit"
                      className="bg-uganda-red text-white hover:bg-uganda-red/90 px-10 py-3 text-lg rounded-lg shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading || ((person1Source === 'custom' && !customNameP1) || (person1Source === 'tree' && !selectedMemberIdP1)) || ((person2Source === 'custom' && !customNameP2) || (person2Source === 'tree' && !selectedMemberIdP2))}
                    >
                      <Search className="mr-2 h-5 w-5" />
                      {isLoading ? "Analyzing..." : "Analyze Relationship"}
                    </Button>
                  </CardFooter>
                </CardContent>
              </Card>
            </form>
          ) : (
            // --- Result Display Card (similar structure as before, but uses richer RelationshipResult) ---
            <Card className="shadow-xl dark:bg-slate-800/70">
              <CardHeader className={`bg-gradient-to-r ${relationshipResult.isRelated ? 'from-green-500/20 to-green-400/20 dark:from-green-700/30 dark:to-green-600/30' : 'from-gray-500/20 to-gray-400/20 dark:from-slate-700/30 dark:to-slate-600/30'} p-6 rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-uganda-black dark:text-white">Relationship Analysis Result</CardTitle>
                  <Button variant="outline" onClick={resetAnalysis} className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700">New Analysis</Button>
                </div>
                 <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Between: <span className="font-semibold">{p1Data.name}</span> and <span className="font-semibold">{p2Data.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 p-6 space-y-6">
                <div className={`p-4 rounded-lg text-center ${relationshipResult.isRelated ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : 'bg-red-100 dark:bg-red-900/50 border-red-500'} border`}>
                  <h3 className={`text-xl font-semibold ${relationshipResult.isRelated ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {relationshipResult.isRelated ? `Relationship Found: ${relationshipResult.relationshipType || "Connected"}` : "No Clear Relationship Found"}
                  </h3>
                  {relationshipResult.pathDescription && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{relationshipResult.pathDescription}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/30 dark:border-slate-600">
                    <h4 className="text-lg font-medium flex items-center text-uganda-black dark:text-slate-100 mb-3">
                      <BarChart3 className="mr-2 h-5 w-5 text-uganda-yellow" />
                      Analysis Details
                    </h4>
                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {typeof relationshipResult.generationalDistanceP1 === 'number' && <p><span className="font-medium">{p1Data.name} to LCA:</span> {relationshipResult.generationalDistanceP1} gen.</p>}
                      {typeof relationshipResult.generationalDistanceP2 === 'number' && <p><span className="font-medium">{p2Data.name} to LCA:</span> {relationshipResult.generationalDistanceP2} gen.</p>}
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
                          <li key={idx}>{ancestor.name} <span className="text-xs text-muted-foreground">({ancestor.type.replace('_', ' ')})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {relationshipResult.analysisNotes && relationshipResult.analysisNotes.length > 0 && (
                  <div className="p-4 border rounded-lg mt-6 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700">
                    <h4 className="text-lg font-medium flex items-center text-uganda-black dark:text-slate-100 mb-3">
                      <Info className="mr-2 h-5 w-5 text-blue-500" />
                      Analysis Notes
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
      {/* showAuth state now controls the AuthForm modal if user isn't logged in initially */}
      {showAuth && !user && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default RelationshipAnalyzer;
