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
import { Users, Link2, Clock, UserCircle2, Search, Info, AlertTriangle, GitMerge, Users2, BarChart3, Zap, Brain, Loader2 } from "lucide-react";
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
    selectedElders?: string[];
}

const RelationshipAnalyzer = () => {
  const { user, session } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [userFamilyTrees, setUserFamilyTrees] = useState<FamilyTree[]>([]);

  // Person 1 State
  const [person1Source, setPerson1Source] = useState<PersonInputType>("custom");
  const [selectedTreeIdP1, setSelectedTreeIdP1] = useState<string>("");
  const [selectedMemberIdP1, setSelectedMemberIdP1] = useState<string>("");
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
  const [analyzedP1Data, setAnalyzedP1Data] = useState<PersonDetails | null>(null);
  const [analyzedP2Data, setAnalyzedP2Data] = useState<PersonDetails | null>(null);

  const getSafeGeneration = (member: Partial<FamilyMember> | Partial<PersonDetails> | { generation?: number | string } ): number => {
    const gen = member.generation;
    return typeof gen === 'number' ? gen : (typeof gen === 'string' && !isNaN(parseInt(gen)) ? parseInt(gen, 10) : 0);
  };

  const fetchFamilyTrees = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees').select('*, family_members(*)')
        .eq('user_id', user.id).order('created_at', { ascending: false });
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
    else if (!session && isLoading === false) { // check isLoading to prevent loop on initial load
        setShowAuth(true); setUserFamilyTrees([]); 
    }
    else if (!user && !isLoading) { // If no user and not loading, ensure trees are cleared
        setUserFamilyTrees([]);
    }
  }, [user, session, fetchFamilyTrees, isLoading]);


  const setupDynamicSelects = useCallback((
    personSource: PersonInputType, 
    treeIdForPerson: string | undefined, 
    userTreesList: FamilyTree[],
    customTribeForPerson: string | undefined, 
    customClanForPerson: string | undefined, 
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
      if (effectiveClanName) {
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
  
  const getAncestryPath = (memberId: string, members: FamilyMember[], maxDepth = 10): FamilyMember[] => { 
    const path: FamilyMember[] = []; let currentMember = members.find(m => m.id === memberId);
    const visited = new Set<string>(); let depth = 0;
    while (currentMember && depth < maxDepth) {
        if (visited.has(currentMember.id)) { console.warn("Cycle in ancestry for:", currentMember.id); break; }
        visited.add(currentMember.id); path.push(currentMember);
        if (!currentMember.parentId) break;
        currentMember = members.find(m => m.id === currentMember!.parentId); depth++;
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
    if (!elderIdsP1?.length || !elderIdsP2?.length) return [];
    
    const getAncestryForOneElder = (elderId: string, maxTraceDepth: number = 3): Set<string> => {
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
    elderIdsP1.forEach(id => getAncestryForOneElder(id).forEach(ancId => allAncestorsP1.add(ancId)));

    const commonElderIds = new Set<string>();
    elderIdsP2.forEach(id => {
        const ancestorsP2 = getAncestryForOneElder(id);
        ancestorsP2.forEach(ancId => {
            if (allAncestorsP1.has(ancId)) {
                commonElderIds.add(ancId);
            }
        });
    });
    
    return Array.from(commonElderIds).map(id => getFullClanElderById(id)).filter(Boolean) as FullClanElderType[];
  };

  // Fully defined getMemberDetailsForAnalysis
  const getMemberDetailsForAnalysis = (
    source: PersonInputType, 
    treeId: string | undefined, 
    memberId: string | undefined, 
    customName: string,
    customPersonTribe?: string,
    customPersonClan?: string,
    lineageElders?: string[]
  ): PersonDetails => {
    if (source === 'tree' && treeId && memberId) {
      const tree = userFamilyTrees.find(t => t.id === treeId);
      const member = tree?.members.find(m => m.id === memberId);
      return member 
        ? { 
            id: member.id,
            name: member.name, 
            generation: getSafeGeneration(member),
            parentId: member.parentId,
            spouseId: member.spouseId,
            gender: member.gender,
            tribe: tree?.tribe, 
            clan: tree?.clan, 
            selectedElders: lineageElders 
          } 
        : { 
            name: customName || "Unknown Tree Member", 
            tribe: tree?.tribe, 
            clan: tree?.clan, 
            selectedElders: lineageElders,
            generation: 0 
          };
    }
    return { 
      name: customName, 
      tribe: customPersonTribe, 
      clan: customPersonClan, 
      selectedElders: lineageElders,
      generation: 0 
    };
  };

  const getSimulatedAIInsights = async (
    p1: PersonDetails,
    p2: PersonDetails,
    ruleBasedResult: RelationshipResult
    // selectedLineageEldersP1 and selectedLineageEldersP2 are available in p1.selectedElders and p2.selectedElders
  ): Promise<{ summary: string; confidenceBoost?: number; additionalPathDescription?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 

    let insights = "";
    let confidenceBoost = 0;
    let additionalPath = "";

    if (ruleBasedResult.isRelated) {
        insights += `The rule-based analysis found a '${ruleBasedResult.relationshipType}' connection. `;
        if (ruleBasedResult.commonAncestors && ruleBasedResult.commonAncestors.length > 0) {
            insights += `This involves shared known figures: ${ruleBasedResult.commonAncestors.map(a => a.name).join(', ')}. `;
        }
    }

    if (p1.clan && p1.clan === p2.clan && p1.tribe === p2.tribe) {
        insights += `Both individuals are identified with the ${p1.clan} clan of the ${p1.tribe} tribe. Culturally, this signifies a strong ancestral bond, as members of the same clan traditionally trace back to a common founder. `;
        confidenceBoost = Math.max(confidenceBoost, 0.15);
    } else if (p1.tribe && p1.tribe === p2.tribe) {
        insights += `Belonging to the same tribe (${p1.tribe}), even if different clans, indicates a shared broader heritage and the possibility of very distant common origins through ancient tribal founders. `;
        confidenceBoost = Math.max(confidenceBoost, 0.05);
    } else if (p1.tribe && p2.tribe) {
        insights += `Coming from different tribes (${p1.tribe} and ${p2.tribe}) makes a direct genealogical link through common clan structures less likely with current data. However, inter-tribal connections and marriages have always been part of regional history. `;
    } else {
        insights += "Limited tribal or clan information for one or both individuals makes a precise cultural context assessment challenging. ";
    }

    const p1ElderDetails = (p1.selectedElders || []).map(id => getFullClanElderById(id)?.name).filter(Boolean);
    const p2ElderDetails = (p2.selectedElders || []).map(id => getFullClanElderById(id)?.name).filter(Boolean);

    if (p1ElderDetails.length > 0 || p2ElderDetails.length > 0) {
        insights += "Regarding associated historical elders: ";
        if (p1ElderDetails.length > 0) insights += `${p1.name} is associated by the user with elder(s) ${p1ElderDetails.join(', ')}. `;
        if (p2ElderDetails.length > 0) insights += `${p2.name} is associated by the user with elder(s) ${p2ElderDetails.join(', ')}. `;
        if (ruleBasedResult.commonAncestors?.some(ca => ca.type === 'clan_elder' || ca.type === 'tribal_progenitor')) {
            insights += "The analysis has already highlighted common historical figures based on these associations. ";
        } else if (p1ElderDetails.length > 0 && p2ElderDetails.length > 0){
            insights += "Further research into the specific genealogies of these selected elders from both sides could reveal previously unrecorded connections between their respective family units. ";
        }
    }
    
    if (p1.name && p2.name) {
        const p1LastName = p1.name.split(' ').pop()?.toLowerCase();
        const p2LastName = p2.name.split(' ').pop()?.toLowerCase();
        if (p1LastName && p1LastName === p2LastName && (p1.clan !== p2.clan || p1.tribe !== p2.tribe)) {
            insights += ` The shared surname component '${p1LastName}' could be coincidental or indicate a very remote connection worth exploring, especially common in widely dispersed clans or through specific naming traditions.`;
        }
    }
    
    if (insights.trim() === "") { 
        insights = "The AI assistant reviewed the provided data. For a more comprehensive analysis, providing detailed tribe, clan, and known ancestral links for both individuals is recommended. ";
    }

    return { summary: insights, confidenceBoost, additionalPathDescription };
  };

  const handleAnalyzeRelationship = async () => {
    setIsLoading(true);
    setRelationshipResult(null);

    const p1DetailsData = getMemberDetailsForAnalysis(person1Source, selectedTreeIdP1, selectedMemberIdP1, customNameP1, customTribeP1, customClanP1, selectedLineageEldersP1);
    const p2DetailsData = getMemberDetailsForAnalysis(person2Source, person1Source === 'tree' && person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2, customTribeP2, customClanP2, selectedLineageEldersP2);
    
    setAnalyzedP1Data(p1DetailsData); 
    setAnalyzedP2Data(p2DetailsData);

    if ((person1Source === 'custom' && !p1DetailsData.name?.trim()) || (person1Source === 'tree' && !p1DetailsData.id)) {
        toast.error("Please complete information for Person 1."); setIsLoading(false); return;
    }
    if ((person2Source === 'custom' && !p2DetailsData.name?.trim()) || (person2Source === 'tree' && !p2DetailsData.id)) {
        toast.error("Please complete information for Person 2."); setIsLoading(false); return;
    }
    
    console.log("Analyzing P1:", p1DetailsData);
    console.log("Analyzing P2:", p2DetailsData);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter delay for UI responsiveness
    let currentAnalysisResult: RelationshipResult = { isRelated: false, confidenceScore: 0.05, analysisNotes: ["Initial assessment based on form data."] };

    // 1. Direct Tree Analysis
    if (person1Source === 'tree' && person2Source === 'tree' && selectedTreeIdP1 && p1DetailsData.id && p2DetailsData.id && p1DetailsData.id !== p2DetailsData.id) {
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
        if (tree) {
            const member1 = tree.members.find(m=>m.id === p1DetailsData.id);
            const member2 = tree.members.find(m=>m.id === p2DetailsData.id);
            if (member1 && member2) {
                currentAnalysisResult.analysisNotes?.push("Performing direct tree analysis...");
                if (member1.spouseId === member2.id || member2.spouseId === member1.id) {
                    currentAnalysisResult = { ...currentAnalysisResult, isRelated: true, relationshipType: "Spouses", confidenceScore: 1.0, pathDescription: `${member1.name} and ${member2.name} are recorded as spouses.`, analysisNotes:[...(currentAnalysisResult.analysisNotes ||[]), "Direct spouse link in tree."] };
                } else {
                    const pathA = getAncestryPath(member1.id, tree.members);
                    const pathB = getAncestryPath(member2.id, tree.members);
                    const lca = findLCA(pathA, pathB);
                    if (lca) {
                        const distA = pathA.findIndex(m => m.id === lca.id);
                        const distB = pathB.findIndex(m => m.id === lca.id);
                        currentAnalysisResult = { ...currentAnalysisResult, isRelated: true, commonAncestors: [{id: lca.id, name: lca.name, type: 'family_member'}], confidenceScore: 0.9, generationalDistanceP1: distA, generationalDistanceP2: distB, analysisNotes: [...(currentAnalysisResult.analysisNotes || []), "Common ancestor found in family tree."] };
                        if (distA === 0) { // P1 is LCA, so P1 is ancestor of P2
                            currentAnalysisResult.relationshipType = distB === 1 ? (member1.gender === 'female' ? `Mother to ${member2.name}` : `Father to ${member2.name}`) : (member1.gender === 'female' ? `Grandmother to ${member2.name}` : `Grandfather to ${member2.name}`);
                            if (distB > 2) currentAnalysisResult.relationshipType = `Direct Ancestor (${member1.name} to ${member2.name})`;
                            currentAnalysisResult.pathDescription = `${member1.name} is a direct ancestor of ${member2.name} (${distB} generation(s) apart).`;
                        } else if (distB === 0) { // P2 is LCA
                            currentAnalysisResult.relationshipType = distA === 1 ? (member2.gender === 'female' ? `Mother to ${member1.name}` : `Father to ${member1.name}`) : (member2.gender === 'female' ? `Grandmother to ${member1.name}` : `Grandfather to ${member1.name}`);
                            if (distA > 2) currentAnalysisResult.relationshipType = `Direct Ancestor (${member2.name} to ${member1.name})`;
                            currentAnalysisResult.pathDescription = `${member2.name} is a direct ancestor of ${member1.name} (${distA} generation(s) apart).`;
                        } else if (distA === 1 && distB === 1) {
                            currentAnalysisResult.relationshipType = "Siblings";
                            currentAnalysisResult.pathDescription = `${member1.name} and ${member2.name} are siblings, sharing ${lca.name} as a parent.`;
                        } else if (distA === 1 && distB === 2) { // P1 is Aunt/Uncle to P2
                            currentAnalysisResult.relationshipType = member1.gender === 'female' ? `Aunt to ${member2.name}` : `Uncle to ${member2.name}`;
                            currentAnalysisResult.pathDescription = `${member1.name} is an ${member1.gender === 'female' ? 'aunt' : 'uncle'} to ${member2.name} (via ${lca.name}).`;
                        } else if (distA === 2 && distB === 1) { // P2 is Aunt/Uncle to P1
                            currentAnalysisResult.relationshipType = member2.gender === 'female' ? `Aunt to ${member1.name}` : `Uncle to ${member1.name}`;
                            currentAnalysisResult.pathDescription = `${member2.name} is an ${member2.gender === 'female' ? 'aunt' : 'uncle'} to ${member1.name} (via ${lca.name}).`;
                        }
                         else if (distA === 2 && distB === 2) {
                            currentAnalysisResult.relationshipType = "First Cousins";
                            currentAnalysisResult.pathDescription = `${member1.name} and ${member2.name} are first cousins (common grandparent: ${lca.name}).`;
                        } else {
                            currentAnalysisResult.relationshipType = `Related via Common Ancestor: ${lca.name}`;
                            currentAnalysisResult.pathDescription = `${member1.name} and ${member2.name} share ${lca.name} as a common ancestor. ${member1.name} is ${distA} generation(s) from ${lca.name}, and ${member2.name} is ${distB} generation(s) from ${lca.name}.`;
                        }
                        // Check for in-law relationships (basic)
                        if (member1.spouseId) {
                            const p1Spouse = tree.members.find(m => m.id === member1.spouseId);
                            if (p1Spouse?.parentId === member2.id && member2.id !== member1.id) { // P2 is parent of P1's spouse
                                currentAnalysisResult.relationshipType = `${member2.gender === 'female' ? 'Mother' : 'Father'}-in-law to ${member1.name}`;
                                currentAnalysisResult.pathDescription = `${member2.name} is the ${member2.gender === 'female' ? 'mother' : 'father'} of ${member1.name}'s spouse, ${p1Spouse.name}.`;
                                currentAnalysisResult.confidenceScore = 0.98;
                            }
                        }
                        if (member2.spouseId) {
                            const p2Spouse = tree.members.find(m => m.id === member2.spouseId);
                            if (p2Spouse?.parentId === member1.id && member1.id !== member2.id) { // P1 is parent of P2's spouse
                                currentAnalysisResult.relationshipType = `${member1.gender === 'female' ? 'Mother' : 'Father'}-in-law to ${member2.name}`;
                                currentAnalysisResult.pathDescription = `${member1.name} is the ${member1.gender === 'female' ? 'mother' : 'father'} of ${member2.name}'s spouse, ${p2Spouse.name}.`;
                                currentAnalysisResult.confidenceScore = 0.98;
                            }
                        }
                    } else { currentAnalysisResult.analysisNotes?.push("No common ancestor found within this tree."); currentAnalysisResult.confidenceScore = Math.min(currentAnalysisResult.confidenceScore, 0.2); }
                }
            }
        }
    }
    
    if (!currentAnalysisResult.isRelated || currentAnalysisResult.confidenceScore < 0.85) {
        const p1ClanInfo = p1Details.clan && p1Details.tribe ? `${p1Details.clan} (${p1Details.tribe})` : "Tribe/Clan Not Specified";
        const p2ClanInfo = p2Details.clan && p2Details.tribe ? `${p2Details.clan} (${p2Details.tribe})` : "Tribe/Clan Not Specified";
        currentAnalysisResult.clanContext = `Person 1: ${p1Details.name} [${p1ClanInfo}]\nPerson 2: ${p2Details.name} [${p2ClanInfo}].`;
        currentAnalysisResult.analysisNotes = currentAnalysisResult.analysisNotes || [];

        if (p1Details.tribe && p1Details.clan && p1Details.tribe === p2Details.tribe && p1Details.clan === p2Details.clan) {
            currentAnalysisResult.isRelated = true;
            currentAnalysisResult.relationshipType = currentAnalysisResult.relationshipType || "Same Clan & Tribe";
            currentAnalysisResult.confidenceScore = Math.max(currentAnalysisResult.confidenceScore, 0.85);
            currentAnalysisResult.culturalSignificance = `Individuals from the same clan (${p1Details.clan}) and tribe (${p1Details.tribe}) are traditionally considered to share a common lineage and are generally regarded as close kin.`;
            currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || `Both individuals are identified with the ${p1Details.clan} clan of the ${p1Details.tribe} tribe.`;
            currentAnalysisResult.analysisNotes.push("Strong cultural link: shared clan and tribe.");
        }

        const commonHistoricalElders = findCommonClanElders(p1Details.selectedElders || [], p2Details.selectedElders || []);
        if (commonHistoricalElders.length > 0) {
            // Filter out any common ancestors already found from the family tree analysis
            const treeLCAIds = new Set((currentAnalysisResult.commonAncestors || []).filter(a => a.type === 'family_member').map(a => a.id));
            const newCommonHistElders = commonHistoricalElders
                .filter(e => !treeLCAIds.has(e.id))
                .map(e => ({id: e.id, name: e.name, type: e.id.startsWith("TA_") ? 'tribal_progenitor' : 'clan_elder' as 'clan_elder'}));

            if (newCommonHistElders.length > 0) {
                currentAnalysisResult.isRelated = true;
                currentAnalysisResult.relationshipType = currentAnalysisResult.relationshipType || "Shared Historical Clan Lineage";
                currentAnalysisResult.commonAncestors = [...(currentAnalysisResult.commonAncestors || []), ...newCommonHistElders];
                currentAnalysisResult.confidenceScore = Math.max(currentAnalysisResult.confidenceScore, 0.70 + Math.min(newCommonHistElders.length * 0.05, 0.20));
                currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || `Lineages may connect through known historical elders: ${newCommonHistElders.map(e => e.name).join(', ')}.`;
                currentAnalysisResult.analysisNotes.push("Shared links to prominent clan elders based on user association.");
            }
        }
        
        if (!currentAnalysisResult.isRelated && p1Details.tribe && p1Details.tribe === p2Details.tribe) {
             currentAnalysisResult.isRelated = true; 
             currentAnalysisResult.relationshipType = currentAnalysisResult.relationshipType || "Same Tribe";
             currentAnalysisResult.confidenceScore = Math.max(currentAnalysisResult.confidenceScore, 0.3);
             currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || `Both individuals belong to the ${p1Details.tribe} tribe (different clans). This suggests a very distant shared origin.`;
             currentAnalysisResult.analysisNotes.push("Shared tribal affiliation noted.");
        }
    }
    
    try {
        console.log("Attempting to get (simulated) AI insights...");
        // const aiCallData = await supabase.functions.invoke('analyze-relationships', { 
        //    body: { person1: p1Details, person2: p2Details, ruleBasedFindings: currentAnalysisResult }
        // });
        // if (aiCallData.error) throw aiCallData.error;
        // if (aiCallData.data) {
        //    currentAnalysisResult.aiInsights = aiCallData.data.aiSummary;
        //    currentAnalysisResult.confidenceScore = Math.min(1, currentAnalysisResult.confidenceScore + (aiCallData.data.confidenceScore || 0));
        //    if(aiCallData.data.culturalConsiderations) currentAnalysisResult.culturalSignificance = `${currentAnalysisResult.culturalSignificance || ''} ${aiCallData.data.culturalConsiderations.join(' ')}`.trim();
        //    currentAnalysisResult.analysisNotes?.push("Insights enhanced by AI analysis.");
        // }

        const simulatedAi = await getSimulatedAIInsights(p1Details, p2Details, currentAnalysisResult);
        currentAnalysisResult.aiInsights = simulatedAi.summary;
        if(simulatedAi.confidenceBoost) currentAnalysisResult.confidenceScore = Math.min(1, currentAnalysisResult.confidenceScore + simulatedAi.confidenceBoost);
        if (simulatedAi.additionalPathDescription && !currentAnalysisResult.pathDescription?.includes(simulatedAi.additionalPathDescription)) {
            currentAnalysisResult.pathDescription = `${currentAnalysisResult.pathDescription || ''} ${simulatedAi.additionalPathDescription}`;
        }
        currentAnalysisResult.analysisNotes?.push("AI-simulated insights added for context.");

    } catch (aiError: any) {
        console.error("AI analysis step failed:", aiError);
        currentAnalysisResult.analysisNotes?.push(`AI analysis could not be completed: ${aiError.message || 'Unknown error'}`);
    }

    if (!currentAnalysisResult.isRelated && currentAnalysisResult.confidenceScore < 0.25) {
        currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || "No clear genealogical connection could be established with the provided information.";
        currentAnalysisResult.analysisNotes?.push("Consider exploring deeper clan histories or DNA testing for definitive answers.");
    }
    if (!currentAnalysisResult.relationshipType && currentAnalysisResult.isRelated) {
        currentAnalysisResult.relationshipType = "Potential Connection (details vary)";
    }

    setRelationshipResult(currentAnalysisResult);
    setIsLoading(false);
  };
  
  const resetAnalysis = () => { 
    setRelationshipResult(null);
    setPerson1Source('custom'); 
    setSelectedTreeIdP1(userFamilyTrees.length > 0 ? userFamilyTrees[0].id : "");
    setSelectedMemberIdP1("");
    setCustomNameP1(""); setCustomTribeP1(""); setCustomClanP1("");
    setSelectedLineageEldersP1([]); setAvailableClansP1([]); setAvailableEldersP1([]);
    setPerson2Source('custom'); 
    setSelectedMemberIdP2(""); 
    setCustomNameP2(""); setCustomTribeP2(""); setCustomClanP2("");
    setSelectedLineageEldersP2([]); setAvailableClansP2([]); setAvailableEldersP2([]);
    setAnalyzedP1Data(null);
    setAnalyzedP2Data(null);
  };

  // --- RENDER PERSON SELECTOR ---
  const renderPersonSelector = (
    personNum: 1 | 2,
    source: PersonInputType,
    onSourceChange: (value: PersonInputType) => void,
    selectedTreeIdProp: string | undefined,
    onTreeChange: (value: string) => void,
    _availableMembersInTree: FamilyMember[], // Use derived membersForThisPersonTree instead
    selectedMemberIdProp: string | undefined,
    onMemberChange: (value: string) => void,
    customNameState: string,
    onCustomNameChange: (value: string) => void,
    customTribeState: string | undefined,
    onCustomTribeChange: (value: string | undefined) => void,
    availableClansForCustom: ClanType[],
    customClanState: string | undefined,
    onCustomClanChange: (value: string | undefined) => void,
    availableEldersForPerson: FullClanElderType[],
    selectedElderIdsState: string[], 
    onEldersChange: (ids: string[]) => void,
    disableTreeOption?: boolean
  ) => {
    const handleElderMultiSelect = (elderId: string) => { /* ... same as before ... */ };
    const treeForThisPerson = personNum === 1 ? selectedTreeIdP1 : (person2Source === 'tree' ? selectedTreeIdP1 : undefined);
    const membersForThisPersonTree = treeForThisPerson ? userFamilyTrees.find(t => t.id === treeForThisPerson)?.members || [] : [];

    return ( /* ... JSX for person selector (same as previous, ensure value props for Select are stateValue || "") ... */ 
      <Card className="flex-1 min-w-[300px] dark:bg-slate-800/50 dark:border-slate-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Person {personNum}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={source} 
            onValueChange={(val) => { /* ... same as before ... */ }} 
            className="flex space-x-4 mb-4"
          >
            {/* ... RadioGroupItems ... */}
          </RadioGroup>
          <Separator className="dark:bg-slate-700"/>

          {source === 'tree' && ( /* ... Tree selection UI ... */ )}
          {source === 'custom' && ( /* ... Custom input UI ... */ )}
          {((source === 'custom' && customClanState) || (source === 'tree' && selectedMemberIdProp && treeForThisPerson)) && availableEldersForPerson.length > 0 && (
            /* ... Elder selection UI ... */
          )}
        </CardContent>
      </Card>
    );
  };


  // --- Main Return JSX ---
  if (isLoading) { /* ... Loading UI ... */ }
  if (showAuth && !user) { /* ... Auth prompt ... */ }
  if (!user && !isLoading) { /* ... Login prompt ... */ }

  return (
    <div className="min-h-screen bg-gradient-to-br from-uganda-yellow/5 via-uganda-red/5 to-uganda-black/10 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* ... Page Title and Description ... */}
          <div className="text-center mb-10 p-6 bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border dark:border-slate-700">
            <div className="flex justify-center mb-4"><Brain size={48} className="text-uganda-yellow" /> </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-uganda-black dark:text-slate-100 mb-3">
              Relationship Analyzer
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Explore potential connections between individuals based on shared ancestry, clan elders, and tribal heritage.
            </p>
          </div>
          
          {!relationshipResult ? (
            <form onSubmit={(e) => {e.preventDefault(); handleAnalyzeRelationship();}}>
              {/* ... Form structure with renderPersonSelector calls ... */}
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
                      (val) => { setSelectedTreeIdP1(val || ""); setSelectedMemberIdP1(""); setSelectedLineageEldersP1([]); if (person2Source === 'tree') setSelectedMemberIdP2("");},
                      selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP1, 
                      (val) => { setSelectedMemberIdP1(val || ""); if(val && person1Source === 'tree') { const tree = userFamilyTrees.find(t=>t.id===selectedTreeIdP1); const m = tree?.members.find(mem=>mem.id===val); if (m) {setCustomNameP1(m.name); setCustomTribeP1(tree?.tribe || ""); setCustomClanP1(tree?.clan || "");} } else if (!val) {setCustomNameP1("");} },
                      customNameP1, setCustomNameP1,
                      customTribeP1, (val) => { setCustomTribeP1(val || ""); setCustomClanP1(""); setSelectedLineageEldersP1([]); },
                      availableClansP1, customClanP1, (val) => { setCustomClanP1(val || ""); setSelectedLineageEldersP1([]); },
                      availableEldersP1, selectedLineageEldersP1, setSelectedLineageEldersP1
                    )}
                    {renderPersonSelector(
                      2, person2Source, 
                      (val) => { setPerson2Source(val); if (val === 'custom') {setSelectedMemberIdP2(""); } else {setCustomNameP2(""); setCustomTribeP2(""); setCustomClanP2(""); setSelectedLineageEldersP2([]);} },
                      selectedTreeIdP1, () => {}, 
                      person2Source === 'tree' && selectedTreeIdP1 ? (userFamilyTrees.find(t=>t.id === selectedTreeIdP1)?.members || []) : [],
                      selectedMemberIdP2, 
                      (val) => { setSelectedMemberIdP2(val || ""); if(val && person2Source === 'tree' && selectedTreeIdP1) { const tree = userFamilyTrees.find(t=>t.id===selectedTreeIdP1); const m = tree?.members.find(mem=>mem.id===val); if (m) {setCustomNameP2(m.name); setCustomTribeP2(tree?.tribe || ""); setCustomClanP2(tree?.clan || "");} } else if (!val) {setCustomNameP2("");} },
                      customNameP2, setCustomNameP2,
                      customTribeP2, (val) => {setCustomTribeP2(val || ""); setCustomClanP2(""); setSelectedLineageEldersP2([]); },
                      availableClansP2, customClanP2, (val) => {setCustomClanP2(val || ""); setSelectedLineageEldersP2([]); },
                      availableEldersP2, selectedLineageEldersP2, setSelectedLineageEldersP2,
                      userFamilyTrees.length === 0 || !selectedTreeIdP1 
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
            <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700">
              <CardHeader className={`p-6 rounded-t-lg ${relationshipResult.culturalSignificance ? 'bg-red-100 dark:bg-red-800/30 border-red-400 dark:border-red-600' : relationshipResult.isRelated ? 'bg-green-100 dark:bg-green-800/30 border-green-400 dark:border-green-600' : 'bg-gray-100 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600'}`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-uganda-black dark:text-white">Relationship Analysis Result</CardTitle>
                  <Button variant="outline" onClick={resetAnalysis} className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700">New Analysis</Button>
                </div>
                 <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Analysis between: <span className="font-semibold">{analyzedP1Data?.name || "Person 1"}</span> & <span className="font-semibold">{analyzedP2Data?.name || "Person 2"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 p-6 space-y-6">
                {relationshipResult.culturalSignificance && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300">
                        <div className="flex items-center"> <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0"/> <h4 className="font-semibold">Important Cultural Note</h4> </div>
                        <p className="text-sm mt-1 pl-7">{relationshipResult.culturalSignificance}</p>
                    </div>
                )}
                <div className={`p-4 rounded-lg text-center border ${relationshipResult.isRelated ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600' : 'bg-gray-100 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600'}`}>
                  <h3 className={`text-xl font-semibold ${relationshipResult.isRelated ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {relationshipResult.isRelated ? `Conclusion: ${relationshipResult.relationshipType || "Potential Connection Found"}` : "Conclusion: No Clear Genealogical Link Found"}
                  </h3>
                  {relationshipResult.pathDescription && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{relationshipResult.pathDescription}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                    <CardHeader><CardTitle className="text-lg flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-uganda-yellow" /> Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {typeof relationshipResult.generationalDistanceP1 === 'number' && <p><span className="font-medium">{(analyzedP1Data?.name || "P1")} to Connection Point:</span> {relationshipResult.generationalDistanceP1} generation(s)</p>}
                      {typeof relationshipResult.generationalDistanceP2 === 'number' && <p><span className="font-medium">{(analyzedP2Data?.name || "P2")} to Connection Point:</span> {relationshipResult.generationalDistanceP2} generation(s)</p>}
                      <p><span className="font-medium">Confidence Score:</span> <span className={`font-bold ${relationshipResult.confidenceScore >= 0.7 ? 'text-green-600 dark:text-green-400' : relationshipResult.confidenceScore >= 0.4 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{Math.round(relationshipResult.confidenceScore * 100)}%</span></p>
                      {relationshipResult.clanContext && <p className="mt-2 pt-2 border-t dark:border-slate-600"><span className="font-medium">Cultural Context:</span> {relationshipResult.clanContext}</p>}
                    </CardContent>
                  </Card>
                  {relationshipResult.commonAncestors && relationshipResult.commonAncestors.length > 0 && (
                    <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                      <CardHeader><CardTitle className="text-lg flex items-center"><Link2 className="mr-2 h-5 w-5 text-uganda-red" />Shared Links</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Common Ancestors / Elders Identified:</p>
                        <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 max-h-28 overflow-y-auto">
                          {relationshipResult.commonAncestors.map((ancestor, idx) => (
                            <li key={idx}>{ancestor.name} <span className="text-xs text-muted-foreground">({ancestor.type.replace(/_/g, ' ')})</span></li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {relationshipResult.aiInsights && (
                     <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                        <CardHeader><CardTitle className="text-lg flex items-center"><Brain size={18} className="mr-2 text-purple-500"/> Simulated AI Insights</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic whitespace-pre-wrap">{relationshipResult.aiInsights}</p>
                            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t dark:border-slate-600">Note: These insights are simulated based on structured data and common patterns. Future versions may integrate with advanced AI services via Supabase Edge Functions (using your stored OpenAI API key) for deeper analysis.</p>
                        </CardContent>
                    </Card>
                )}

                {relationshipResult.analysisNotes && relationshipResult.analysisNotes.filter(note => !note.includes("AI-simulated")).length > 0 && ( // Filter out the AI note if present
                  <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                    <CardHeader><CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-blue-500" /> Analysis Factors Considered</CardTitle></CardHeader>
                    <CardContent>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {relationshipResult.analysisNotes.filter(note => !note.includes("AI-simulated")).map((note, idx) => ( <li key={idx}>{note}</li> ))}
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
        <AuthForm onClose={() => { setShowAuth(false); if(!user && window.location.pathname.includes('relationship-analyzer')) navigate('/'); }} />
      )}
    </div>
  );
};

export default RelationshipAnalyzer;
