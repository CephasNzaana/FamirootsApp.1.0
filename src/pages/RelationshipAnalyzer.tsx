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
import { Users, Link2, Clock, UserCircle2, Search, Info, AlertTriangle, GitMerge, Users2, BarChart3, Zap, Brain, Loader2, RotateCw } from "lucide-react"; // Added RotateCw
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FamilyTree, FamilyMember, ElderReference, ClanElder as FullClanElderType, Tribe as TribeType, Clan as ClanType } from "@/types";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true); // For initial tree fetch
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false); // Specifically for analysis process
  
  const [userFamilyTrees, setUserFamilyTrees] = useState<FamilyTree[]>([]);

  const [person1Source, setPerson1Source] = useState<PersonInputType>("custom");
  const [selectedTreeIdP1, setSelectedTreeIdP1] = useState<string>(""); 
  const [selectedMemberIdP1, setSelectedMemberIdP1] = useState<string>(""); 
  const [customNameP1, setCustomNameP1] = useState<string>("");
  const [customTribeP1, setCustomTribeP1] = useState<string>(""); 
  const [customClanP1, setCustomClanP1] = useState<string>("");   
  const [availableClansP1, setAvailableClansP1] = useState<ClanType[]>([]);
  const [availableEldersP1, setAvailableEldersP1] = useState<FullClanElderType[]>([]);
  const [selectedLineageEldersP1, setSelectedLineageEldersP1] = useState<string[]>([]);

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
    if (typeof gen === 'number') return gen;
    if (typeof gen === 'string' && !isNaN(parseInt(gen))) { return parseInt(gen, 10); }
    return 0;
  };

  const fetchFamilyTrees = useCallback(async () => {
    if (!user?.id) { setIsInitialLoading(false); return; }
    setIsInitialLoading(true);
    // ... (fetchFamilyTrees logic as before) ...
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees').select('*, family_members(*)')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (treesError) throw treesError;
      const formattedTrees: FamilyTree[] = (Array.isArray(treesData) ? treesData : []).map(tree => ({
        id: tree.id, userId: tree.user_id, surname: tree.surname, tribe: tree.tribe, clan: tree.clan, createdAt: tree.created_at,
        members: (Array.isArray(tree.family_members) ? tree.family_members : []).map((dbMember: any) => ({
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
      if (formattedTrees.length > 0 && selectedTreeIdP1 === "") { setSelectedTreeIdP1(formattedTrees[0].id); }
    } catch (error: any) {
      console.error("Error fetching family trees:", error);
      toast.error(error.message || "Failed to load your family trees.");
    } finally { setIsInitialLoading(false); }
  }, [user?.id, selectedTreeIdP1]); // Keep selectedTreeIdP1

  useEffect(() => {
    if (user) { setShowAuth(false); fetchFamilyTrees(); } 
    else if (!session && !isInitialLoading) { setShowAuth(true); setUserFamilyTrees([]); }
    else if (!user && !isInitialLoading) { setUserFamilyTrees([]); }
  }, [user, session, fetchFamilyTrees, isInitialLoading]);

  const setupDynamicSelects = useCallback((
    personSource: PersonInputType, 
    treeIdForPerson: string | undefined, 
    userTreesList: FamilyTree[],
    customTribeForPerson: string | undefined, 
    customClanForPerson: string | undefined, 
    setAvailableClansList: React.Dispatch<React.SetStateAction<ClanType[]>>,
    setAvailableEldersList: React.Dispatch<React.SetStateAction<FullClanElderType[]>>,
    resetSelectedLineageElders: () => void
  ) => { /* ... (same as before, ensuring it uses Array.isArray checks if needed) ... */ }, []); 

  useEffect(() => {
    setupDynamicSelects(person1Source, selectedTreeIdP1, userFamilyTrees, customTribeP1, customClanP1, setAvailableClansP1, setAvailableEldersP1, () => setSelectedLineageEldersP1([]));
  }, [person1Source, selectedTreeIdP1, customTribeP1, customClanP1, userFamilyTrees, setupDynamicSelects]);

  useEffect(() => {
    setupDynamicSelects(person2Source, selectedTreeIdP1, userFamilyTrees, customTribeP2, customClanP2, setAvailableClansP2, setAvailableEldersP2, () => setSelectedLineageEldersP2([]));
  }, [person2Source, selectedTreeIdP1, customTribeP2, customClanP2, userFamilyTrees, setupDynamicSelects]);
  
  const getAncestryPath = (memberId: string, members: FamilyMember[], maxDepth = 10): FamilyMember[] => { /* ... (same as before) ... */ };
  const findLCA = (pathA: FamilyMember[], pathB: FamilyMember[]): FamilyMember | null => { /* ... (same as before) ... */ };
  const getFullClanElderById = (elderId: string): FullClanElderType | undefined => { /* ... (same as before) ... */ };
  const traceElderAncestry = (elderId: string, maxDepth = 3): FullClanElderType[] => { /* ... (same as before) ... */ };
  const findCommonClanElders = (elderIdsP1: string[], elderIdsP2: string[]): FullClanElderType[] => { /* ... (same as before) ... */ };
  const getSimulatedAIInsights = async (p1: PersonDetails, p2: PersonDetails, ruleBasedResult: RelationshipResult): Promise<{ summary: string; confidenceBoost?: number; additionalPathDescription?: string }> => { /* ... (same as before, more neutral if needed) ... */ 
      await new Promise(resolve => setTimeout(resolve, 500)); 
      let insights = ""; let confidenceBoost = 0; let additionalPath = "";
      if (ruleBasedResult.isRelated) {
          insights += `The system's rule-based analysis found a '${ruleBasedResult.relationshipType}' connection. `;
          if (Array.isArray(ruleBasedResult.commonAncestors) && ruleBasedResult.commonAncestors.length > 0) {
              insights += `This involves shared known figures: ${ruleBasedResult.commonAncestors.map(a => a.name).join(', ')}. `;
          }
      }
      if (p1.clan && p1.clan === p2.clan && p1.tribe === p2.tribe) {
          insights += `Both individuals are identified with the ${p1.clan} clan of the ${p1.tribe} tribe. Culturally, this signifies a strong ancestral bond, as members of the same clan traditionally trace back to a common founder. `;
          confidenceBoost = Math.max(confidenceBoost, 0.15);
      } else if (p1.tribe && p1.tribe === p2.tribe) {
          insights += `Belonging to the same tribe (${p1.tribe}), even if different clans, indicates a shared broader heritage and the possibility of very distant common origins. `;
          confidenceBoost = Math.max(confidenceBoost, 0.05);
      } else if (p1.tribe && p2.tribe) {
          insights += `Coming from different tribes (${p1.tribe} and ${p2.tribe}) makes a direct genealogical link through common clan structures less likely based on this information alone. `;
      } else {
          insights += "Limited tribal or clan information for one or both individuals makes a cultural context assessment challenging. ";
      }
      const p1ElderDetails = (Array.isArray(p1.selectedElders) ? p1.selectedElders : []).map(id => getFullClanElderById(id)?.name).filter(Boolean);
      const p2ElderDetails = (Array.isArray(p2.selectedElders) ? p2.selectedElders : []).map(id => getFullClanElderById(id)?.name).filter(Boolean);
      if (p1ElderDetails.length > 0 || p2ElderDetails.length > 0) {
          insights += "Regarding associated historical elders: ";
          if (p1ElderDetails.length > 0) insights += `${p1.name} is linked by the user to elder(s) ${p1ElderDetails.join(', ')}. `;
          if (p2ElderDetails.length > 0) insights += `${p2.name} is linked by the user to elder(s) ${p2ElderDetails.join(', ')}. `;
          if (Array.isArray(ruleBasedResult.commonAncestors) && ruleBasedResult.commonAncestors.some(ca => ca.type === 'clan_elder' || ca.type === 'tribal_progenitor')) {
              insights += "The analysis has already highlighted common historical figures based on these associations. ";
          } else if (p1ElderDetails.length > 0 && p2ElderDetails.length > 0){
              insights += "Further research into the specific genealogies of these selected elders from both sides could reveal connections. ";
          }
      }
      if (p1.name && p2.name) {
          const p1LastName = p1.name.split(' ').pop()?.toLowerCase();
          const p2LastName = p2.name.split(' ').pop()?.toLowerCase();
          if (p1LastName && p1LastName === p2LastName && (p1.clan !== p2.clan || p1.tribe !== p2.tribe)) {
              insights += ` The shared surname component '${p1LastName}' could be coincidental or indicate a very remote connection.`;
          }
      }
      if (insights.trim() === "") { 
          insights = "AI simulation: For a more comprehensive analysis, providing detailed tribe, clan, and known ancestral links for both individuals is recommended. ";
      } else {
          insights = "AI simulation: " + insights;
      }
      return { summary: insights, confidenceBoost, additionalPathDescription };
  };
  const getMemberDetailsForAnalysis = ( /* ... same as before ... */ ): PersonDetails => { /* ... */ } as any;


  const handleAnalyzeRelationship = async () => {
    const analysisStartTime = Date.now(); // For minimum duration
    setIsAnalyzing(true); // Use specific state for analysis loading
    setRelationshipResult(null);

    const p1Data = getMemberDetailsForAnalysis(person1Source, selectedTreeIdP1, selectedMemberIdP1, customNameP1, customTribeP1, customClanP1, selectedLineageEldersP1);
    const p2Data = getMemberDetailsForAnalysis(person2Source, person1Source === 'tree' && person2Source === 'tree' ? selectedTreeIdP1 : undefined, selectedMemberIdP2, customNameP2, customTribeP2, customClanP2, selectedLineageEldersP2);
    
    setAnalyzedP1Data(p1DetailsData); 
    setAnalyzedP2Data(p2DetailsData);

    if ((person1Source === 'custom' && !p1DetailsData.name?.trim()) || (person1Source === 'tree' && !p1DetailsData.id)) {
        toast.error("Please complete information for Person 1."); setIsAnalyzing(false); return;
    }
    if ((person2Source === 'custom' && !p2DetailsData.name?.trim()) || (person2Source === 'tree' && !p2DetailsData.id)) {
        toast.error("Please complete information for Person 2."); setIsAnalyzing(false); return;
    }
    
    console.log("Analyzing P1:", p1DetailsData);
    console.log("Analyzing P2:", p2DetailsData);

    // This existing 1-second delay will be part of the min 7-second total
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    let currentAnalysisResult: RelationshipResult = { isRelated: false, confidenceScore: 0.05, analysisNotes: ["Initial assessment based on form data."] };

    // 1. Direct Tree Analysis
    if (person1Source === 'tree' && person2Source === 'tree' && selectedTreeIdP1 && p1DetailsData.id && p2DetailsData.id && p1DetailsData.id !== p2DetailsData.id) {
        const tree = userFamilyTrees.find(t => t.id === selectedTreeIdP1);
        if (tree && Array.isArray(tree.members)) { // Ensure tree.members is an array
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
                        if (distA === 0) { 
                            currentAnalysisResult.relationshipType = distB === 1 ? (member1.gender === 'female' ? `Mother of ${member2.name}` : `Father of ${member2.name}`) : (member1.gender === 'female' ? `Grandmother of ${member2.name}` : `Grandfather of ${member2.name}`);
                            if (distB > 2) currentAnalysisResult.relationshipType = `Direct Ancestor (${member1.name} to ${member2.name})`;
                            currentAnalysisResult.pathDescription = `${member1.name} is a direct ancestor of ${member2.name} (${distB} generation(s) apart).`;
                        } else if (distB === 0) { 
                            currentAnalysisResult.relationshipType = distA === 1 ? (member2.gender === 'female' ? `Mother of ${member1.name}` : `Father of ${member1.name}`) : (member2.gender === 'female' ? `Grandmother of ${member1.name}` : `Grandfather of ${member1.name}`);
                            if (distA > 2) currentAnalysisResult.relationshipType = `Direct Ancestor (${member2.name} to ${member1.name})`;
                            currentAnalysisResult.pathDescription = `${member2.name} is a direct ancestor of ${member1.name} (${distA} generation(s) apart).`;
                        } else if (distA === 1 && distB === 1) {
                            currentAnalysisResult.relationshipType = "Siblings";
                            currentAnalysisResult.pathDescription = `${member1.name} and ${member2.name} are siblings, sharing ${lca.name} as a parent.`;
                        } else if (distA === 1 && distB === 2) { 
                            currentAnalysisResult.relationshipType = member1.gender === 'female' ? `Aunt to ${member2.name}` : `Uncle to ${member2.name}`;
                            currentAnalysisResult.pathDescription = `${member1.name} is an ${member1.gender === 'female' ? 'aunt' : 'uncle'} to ${member2.name} (Common ancestor: ${lca.name}).`;
                        } else if (distA === 2 && distB === 1) { 
                            currentAnalysisResult.relationshipType = member2.gender === 'female' ? `Aunt to ${member1.name}` : `Uncle to ${member1.name}`;
                            currentAnalysisResult.pathDescription = `${member2.name} is an ${member2.gender === 'female' ? 'aunt' : 'uncle'} to ${member1.name} (Common ancestor: ${lca.name}).`;
                        }
                         else if (distA === 2 && distB === 2) {
                            currentAnalysisResult.relationshipType = "First Cousins";
                            currentAnalysisResult.pathDescription = `${member1.name} and ${member2.name} are first cousins (common grandparent: ${lca.name}).`;
                        } else {
                            currentAnalysisResult.relationshipType = `Related (Common Ancestor: ${lca.name})`;
                            currentAnalysisResult.pathDescription = `${member1.name} and ${member2.name} share ${lca.name} as a common ancestor. ${member1.name} is ${distA} gen. from LCA, ${member2.name} is ${distB} gen. from LCA.`;
                        }
                        if (member1.spouseId) {
                            const p1Spouse = tree.members.find(m => m.id === member1.spouseId);
                            if (p1Spouse?.parentId === member2.id && member2.id !== member1.id) { 
                                currentAnalysisResult.relationshipType = `${member2.gender === 'female' ? 'Mother' : 'Father'}-in-law to ${member1.name}`;
                                currentAnalysisResult.pathDescription = `${member2.name} is the ${member2.gender === 'female' ? 'mother' : 'father'} of ${member1.name}'s spouse, ${p1Spouse.name}.`;
                                currentAnalysisResult.confidenceScore = 0.98;
                            }
                        }
                        if (member2.spouseId) {
                            const p2Spouse = tree.members.find(m => m.id === member2.spouseId);
                            if (p2Spouse?.parentId === member1.id && member1.id !== member2.id) { 
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
        const p1ClanInfo = p1DetailsData.clan && p1DetailsData.tribe ? `${p1DetailsData.clan} (${p1DetailsData.tribe})` : "Tribe/Clan Not Specified";
        const p2ClanInfo = p2DetailsData.clan && p2DetailsData.tribe ? `${p2DetailsData.clan} (${p2DetailsData.tribe})` : "Tribe/Clan Not Specified";
        currentAnalysisResult.clanContext = `Person 1: ${p1DetailsData.name} [${p1ClanInfo}]\nPerson 2: ${p2DetailsData.name} [${p2ClanInfo}].`;
        currentAnalysisResult.analysisNotes = Array.isArray(currentAnalysisResult.analysisNotes) ? currentAnalysisResult.analysisNotes : [];

        if (p1DetailsData.tribe && p1DetailsData.clan && p1DetailsData.tribe === p2DetailsData.tribe && p1DetailsData.clan === p2DetailsData.clan) {
            currentAnalysisResult.isRelated = true;
            currentAnalysisResult.relationshipType = currentAnalysisResult.relationshipType || "Same Clan & Tribe";
            currentAnalysisResult.confidenceScore = Math.max(currentAnalysisResult.confidenceScore, 0.85);
            currentAnalysisResult.culturalSignificance = `Individuals from the same clan (${p1DetailsData.clan}) and tribe (${p1DetailsData.tribe}) are traditionally considered to share a common lineage and are generally regarded as close kin. This typically has implications for marriage eligibility and other social customs according to cultural norms.`; // Refined wording
            currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || `Both individuals are identified with the ${p1DetailsData.clan} clan of the ${p1DetailsData.tribe} tribe.`;
            currentAnalysisResult.analysisNotes.push("Strong cultural link: shared clan and tribe.");
        }

        const commonHistoricalElders = findCommonClanElders(p1DetailsData.selectedElders || [], p2DetailsData.selectedElders || []);
        if (commonHistoricalElders.length > 0) {
            const existingAncestorIds = new Set((currentAnalysisResult.commonAncestors || []).map(a => a.id));
            const newCommonHistElders = commonHistoricalElders.filter(e => !existingAncestorIds.has(e.id)).map(e => ({id: e.id, name: e.name, type: e.id.startsWith("TA_") ? 'tribal_progenitor' : 'clan_elder' as 'clan_elder'}));
            if (newCommonHistElders.length > 0) {
                currentAnalysisResult.isRelated = true;
                currentAnalysisResult.relationshipType = currentAnalysisResult.relationshipType || "Shared Historical Elder(s)";
                currentAnalysisResult.commonAncestors = [...(currentAnalysisResult.commonAncestors || []), ...newCommonHistElders];
                currentAnalysisResult.confidenceScore = Math.max(currentAnalysisResult.confidenceScore, 0.70 + Math.min(newCommonHistElders.length * 0.05, 0.20));
                currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || `Lineages may connect through known historical elders: ${newCommonHistElders.map(e => e.name).join(', ')}.`;
                currentAnalysisResult.analysisNotes.push("Shared links to prominent clan elders based on user association.");
            }
        }
        
        if (!currentAnalysisResult.isRelated && p1DetailsData.tribe && p1DetailsData.tribe === p2DetailsData.tribe) {
             currentAnalysisResult.isRelated = true; 
             currentAnalysisResult.relationshipType = currentAnalysisResult.relationshipType || "Same Tribe";
             currentAnalysisResult.confidenceScore = Math.max(currentAnalysisResult.confidenceScore, 0.3);
             currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || `Both individuals belong to the ${p1DetailsData.tribe} tribe (different clans). This suggests a very distant shared origin.`;
             currentAnalysisResult.analysisNotes.push("Shared tribal affiliation noted.");
        }
    }
    
    try {
        console.log("Attempting to get (simulated) AI insights...");
        const simulatedAi = await getSimulatedAIInsights(p1DetailsData, p2DetailsData, currentAnalysisResult);
        currentAnalysisResult.aiInsights = simulatedAi.summary;
        if(simulatedAi.confidenceBoost) currentAnalysisResult.confidenceScore = Math.min(1, currentAnalysisResult.confidenceScore + simulatedAi.confidenceBoost);
        if (simulatedAi.additionalPathDescription && !currentAnalysisResult.pathDescription?.includes(simulatedAi.additionalPathDescription)) {
            currentAnalysisResult.pathDescription = `${currentAnalysisResult.pathDescription || ''} ${simulatedAi.additionalPathDescription}`;
        }
        currentAnalysisResult.analysisNotes?.push("AI-simulated insights added for context.");
    } catch (aiError: any) {
        console.error("AI analysis (simulated) step failed:", aiError);
        currentAnalysisResult.analysisNotes?.push(`AI analysis (simulated) could not be completed: ${aiError.message || 'Unknown error'}`);
    }

    if (!currentAnalysisResult.isRelated && currentAnalysisResult.confidenceScore < 0.25) {
        currentAnalysisResult.pathDescription = currentAnalysisResult.pathDescription || "No clear genealogical connection could be established with the provided information.";
        currentAnalysisResult.analysisNotes?.push("Consider exploring deeper clan histories or DNA testing for definitive answers.");
    }
    if (!currentAnalysisResult.relationshipType && currentAnalysisResult.isRelated) {
        currentAnalysisResult.relationshipType = "Potential Connection (details vary)";
    }

    // Enforce minimum 7-second duration for analysis feeling
    const analysisEndTime = Date.now();
    const duration = analysisEndTime - analysisStartTime;
    const minDuration = 7000; // 7 seconds
    if (duration < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - duration));
    }

    setRelationshipResult(currentAnalysisResult);
    setIsAnalyzing(false);
  };
  
  const resetAnalysis = () => { 
    setRelationshipResult(null);
    setAnalyzedP1Data(null); // Reset analyzed data
    setAnalyzedP2Data(null);
    setIsAnalyzing(false); // Ensure analyzing state is also reset

    // Reset Person 1
    setPerson1Source('custom'); 
    setSelectedTreeIdP1(userFamilyTrees.length > 0 ? userFamilyTrees[0].id : "");
    setSelectedMemberIdP1("");
    setCustomNameP1(""); setCustomTribeP1(""); setCustomClanP1("");
    setSelectedLineageEldersP1([]); 
    // setAvailableClansP1([]); // These will be reset by setupDynamicSelects
    // setAvailableEldersP1([]);
    
    // Reset Person 2
    setPerson2Source('custom'); 
    setSelectedMemberIdP2(""); 
    setCustomNameP2(""); setCustomTribeP2(""); setCustomClanP2("");
    setSelectedLineageEldersP2([]); 
    // setAvailableClansP2([]);
    // setAvailableEldersP2([]);

    // Trigger re-evaluation of dynamic selects for default states
    // This needs to be called after state updates for P1/P2 sources and custom fields are processed.
    // It's better to let the useEffects for setupDynamicSelects handle this based on the reset states.
    // Forcing it here might use stale values of customTribeP1 etc. if setFormData is async.
    // The useEffects already depend on these states and will re-run.
  };

  // --- RENDER PERSON SELECTOR ---
  const renderPersonSelector = (
    personNum: 1 | 2,
    source: PersonInputType,
    onSourceChange: (value: PersonInputType) => void,
    selectedTreeIdProp: string,
    onTreeChange: (value: string) => void, 
    selectedMemberIdProp: string,
    onMemberChange: (value: string) => void,  
    customNameState: string,
    onCustomNameChange: (value: string) => void,
    customTribeState: string,
    onCustomTribeChange: (value: string) => void,
    availableClansForCustom: ClanType[],
    customClanState: string,
    onCustomClanChange: (value: string) => void,
    availableEldersForPerson: FullClanElderType[],
    selectedElderIdsState: string[], 
    onEldersChange: (ids: string[]) => void,
    disableP2TreeOption?: boolean
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

    const treeForThisPerson = personNum === 1 ? selectedTreeIdP1 : (person2Source === 'tree' ? selectedTreeIdP1 : "");
    const membersInSelectedTree = treeForThisPerson ? (userFamilyTrees.find(t => t.id === treeForThisPerson)?.members || []) : [];

    return (
      <Card className="flex-1 min-w-[300px] dark:bg-slate-800/50 dark:border-slate-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Person {personNum}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={source} 
            onValueChange={(val) => {
                const newSource = val as PersonInputType;
                onSourceChange(newSource);
                if (newSource === 'custom') {
                    onMemberChange(""); 
                    if(personNum === 1) onTreeChange(""); 
                } else { 
                    onCustomNameChange(""); onCustomTribeChange(""); onCustomClanChange("");
                    onEldersChange([]);
                    if (personNum === 1 && Array.isArray(userFamilyTrees) && userFamilyTrees.length > 0 && !selectedTreeIdP1){
                        onTreeChange(userFamilyTrees[0].id); 
                    }
                }
            }} 
            className="flex space-x-4 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tree" id={`p${personNum}-tree`} disabled={(personNum === 2 && disableP2TreeOption) || !Array.isArray(userFamilyTrees) || userFamilyTrees.length === 0}/>
              <Label htmlFor={`p${personNum}-tree`} className={((personNum === 2 && disableP2TreeOption) || !Array.isArray(userFamilyTrees) || userFamilyTrees.length === 0) ? "text-muted-foreground dark:text-slate-500 cursor-not-allowed" : "dark:text-slate-200 cursor-pointer"}>
                From My Tree {(Array.isArray(userFamilyTrees) && userFamilyTrees.length === 0 && personNum === 1) ? "(No trees)" : ""}
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
              {personNum === 1 && Array.isArray(userFamilyTrees) && userFamilyTrees.length > 0 && (
                <div className="space-y-1">
                  <Label htmlFor={`tree-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Select Your Family Tree</Label>
                  <Select value={selectedTreeIdProp} onValueChange={onTreeChange}>
                    <SelectTrigger id={`tree-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder="Select tree" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                      {(Array.isArray(userFamilyTrees) ? userFamilyTrees : []).map(tree => (<SelectItem key={tree.id} value={tree.id}>{tree.surname} Tree ({tree.clan})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
               {treeForThisPerson && ( 
                <div className="space-y-1">
                  <Label htmlFor={`member-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Select Person from Tree</Label>
                  <Select value={selectedMemberIdProp} onValueChange={onMemberChange} disabled={membersInSelectedTree.length === 0}>
                    <SelectTrigger id={`member-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder={membersInSelectedTree.length > 0 ? "Select member" : "No members in tree"} /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                        <SelectItem value="">-- Clear Selection --</SelectItem>
                        {(Array.isArray(membersInSelectedTree) ? membersInSelectedTree : []).map(member => (
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
              <div className="space-y-1"><Label htmlFor={`customName-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Name *</Label><Input id={`customName-p${personNum}`} value={customNameState} onChange={e => onCustomNameChange(e.target.value)} placeholder="Full name" className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"/></div>
              <div className="space-y-1"><Label htmlFor={`customTribe-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Tribe</Label>
                <Select value={customTribeState} onValueChange={onCustomTribeChange}>
                    <SelectTrigger id={`customTribe-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder="Select tribe"/></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                        <SelectItem value="">None / Unknown</SelectItem>
                        {(Array.isArray(ugandaTribesData) ? ugandaTribesData : []).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              {customTribeState && (
                <div className="space-y-1"><Label htmlFor={`customClan-p${personNum}`} className="text-sm font-medium dark:text-slate-300">Clan</Label>
                  <Select value={customClanState} onValueChange={onCustomClanChange} disabled={!Array.isArray(availableClansForCustom) || availableClansForCustom.length === 0}>
                      <SelectTrigger id={`customClan-p${personNum}`} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder={(Array.isArray(availableClansForCustom) && availableClansForCustom.length > 0) ? "Select clan" : "Select tribe first or no clans"}/></SelectTrigger>
                      <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                          <SelectItem value="">None / Unknown</SelectItem>
                          {(Array.isArray(availableClansForCustom) ? availableClansForCustom : []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
           {((source === 'custom' && customClanState) || (source === 'tree' && selectedMemberIdProp && treeForThisPerson)) && (Array.isArray(availableEldersForPerson) && availableEldersForPerson.length > 0) && (
            <div className="space-y-2 pt-3 border-t dark:border-slate-600 mt-4">
                <Label className="text-sm font-medium dark:text-slate-300">Associated Clan Elders (Optional, max 2)</Label>
                <div className="max-h-32 overflow-y-auto space-y-2 p-2 border rounded-md dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                {(Array.isArray(availableEldersForPerson) ? availableEldersForPerson : []).map(elder => (
                    <div key={elder.id} className={`flex items-center justify-between p-1.5 border-b dark:border-slate-700 text-xs rounded-sm ${selectedElderIdsState.includes(elder.id) ? 'bg-uganda-yellow/20 dark:bg-uganda-yellow/10' : ''}`}>
                        <div> <span className="font-medium dark:text-slate-200">{elder.name}</span> <span className="text-muted-foreground dark:text-slate-400">({elder.approximateEra})</span> </div>
                        <Button 
                            size="sm" 
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

  // --- Main Return JSX for the page ---
  if (isAnalyzing) { // Analysis Loading Screen takes precedence
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-uganda-yellow/10 via-uganda-red/5 to-uganda-black/10 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Header onLogin={() => {}} onSignup={() => {}} /> 
        <main className="flex-grow flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="h-16 w-16 animate-spin text-uganda-red mb-6" />
            <h2 className="text-3xl font-semibold text-uganda-black dark:text-slate-100 mb-3">
                FamiRoots AI Is Analyzing...
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
                Consulting historical records and cultural patterns to find connections. <br/> This may take a few moments.
            </p>
            <div className="mt-8 w-full max-w-md">
                <div className="h-2 bg-uganda-yellow/30 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-2 bg-uganda-yellow dark:bg-uganda-red animate-pulse" style={{ animationDuration: '1.5s', width: '100%' }}></div>
                </div>
            </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (showAuth && !user) { 
    return ( /* ... Auth prompt ... */ );
  }
  if (!user && !isInitialLoading) { // Changed isLoading to isInitialLoading
    return ( /* ... Login prompt ... */ );
  }
  if (isInitialLoading && !userFamilyTrees.length) { // Initial page load spinner for trees
     return (
      <div className="min-h-screen flex flex-col">
        <Header onLogin={() => {}} onSignup={() => {}} />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-uganda-yellow" />
        </main>
        <Footer />
      </div>
    );
  }


  return ( /* ... Full JSX for form and result display (ensure guarded .map calls in results) ... */ );
};

export default RelationshipAnalyzer;
