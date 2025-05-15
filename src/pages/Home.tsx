// src/pages/Home.tsx

import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeMultiView from "@/components/FamilyTreeMultiView";
import Footer from "@/components/Footer";
import {
    TreeFormData,
    FamilyTree,
    FamilyMember,
    ExtendedFamilyInputData,
    MemberInputData,
    ElderReference,
    ClanElder as FullClanElderType
} from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dna, Users, FileText, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

const generateClientMemberId = (): string => {
  return crypto.randomUUID();
};

const transformTreeFormDataToMembers = (
    extendedFamily: ExtendedFamilyInputData,
    mainPersonSurname: string
): { members: FamilyMember[], idMap: Record<string, string> } => {

    console.log("[Home.tsx transform] Starting transformation for main person:", extendedFamily.familyName);
    const members: FamilyMember[] = [];
    const idMap: Record<string, string> = {}; // For main lineage roles

    const mainPersonRKey = "mainPerson";
    const fatherRKey = "father";
    const motherRKey = "mother";
    const pgfRKey = "paternalGrandfather";
    const pgmRKey = "paternalGrandmother";
    const mgfRKey = "maternalGrandfather";
    const mgmRKey = "maternalGrandmother";
    const spouseRKey = "spouse";

    const addPerson = (
        roleKey: string | null,
        inputData: Partial<Pick<FamilyMember, 'name' | 'birthYear' | 'deathYear' | 'gender' | 'notes' | 'status'>> | undefined,
        relationshipToProband: string,
        generation: number,
        isElderFlag?: boolean,
        familySide?: 'paternal' | 'maternal',
        existingId?: string
    ): string | undefined => {
        let personName = inputData?.name?.trim();

        if (!personName && roleKey !== mainPersonRKey && !relationshipToProband.includes("Ancestor") && !relationshipToProband.includes("Progenitor")) {
            const isTrulyOptionalAndEmpty =
                (roleKey?.includes("grandparent") || roleKey === spouseRKey || roleKey?.includes("sibling") || roleKey?.includes("child")) &&
                !(inputData?.birthYear || inputData?.deathYear || inputData?.gender || inputData?.notes);
            if (isTrulyOptionalAndEmpty && roleKey !== mainPersonRKey) {
                console.warn(`[transform] Skipping empty optional member: ${roleKey}`);
                return undefined;
            }
            if (roleKey !== mainPersonRKey && !(inputData?.name)) { // Avoid placeholder if name is just empty string but field was touched
                 console.warn(`[transform] Name missing for ${roleKey}. Using placeholder 'Unnamed ${relationshipToProband}'.`);
            }
        }
        if (!personName && roleKey === mainPersonRKey && (extendedFamily as ExtendedFamilyInputData).familyName) {
             personName = (extendedFamily as ExtendedFamilyInputData).familyName?.trim();
        }
        if (!personName && roleKey === mainPersonRKey) {
             console.error("[transform] Main person's name (familyName) is missing but required.");
             throw new Error("Main person's name (familyName) is required in the form.");
        }
        const displayName = personName || `Unnamed ${relationshipToProband}`;
        const finalId = existingId || generateClientMemberId();
        if(roleKey && !existingId && !idMap[roleKey]) {
            idMap[roleKey] = finalId;
        }
        if (existingId && members.find(m => m.id === finalId)) {
            // console.log(`[transform] Member ${displayName} (ID: ${finalId}) using existingId already processed. Not re-adding.`);
            return finalId;
        }

        const member: FamilyMember = {
            id: finalId, name: displayName, relationship: relationshipToProband,
            birthYear: inputData?.birthYear || undefined, deathYear: inputData?.deathYear || undefined,
            generation: generation, parentId: undefined, spouseId: undefined,
            isElder: isElderFlag || false, gender: (inputData?.gender as 'male' | 'female' | undefined) || undefined,
            side: familySide, status: inputData?.status || (inputData?.deathYear ? 'deceased' : 'living'),
            notes: inputData?.notes || undefined, photoUrl: undefined,
        };
        members.push(member);
        console.log(`[transform] Added: ${member.name} (ID: ${member.id}, RoleKey: ${roleKey || 'CustomElder'}, Gen: ${member.generation}, Rel: ${member.relationship})`);
        return finalId;
    };

    // --- 1. Create Main Person and their direct lineage ---
    const mainPersonInputDataForAddPerson: Partial<Pick<FamilyMember, 'name' | 'birthYear' | 'deathYear' | 'gender' | 'notes' | 'status'>> = {
        name: extendedFamily.familyName, birthYear: extendedFamily.birthYear, deathYear: extendedFamily.deathYear,
        gender: extendedFamily.gender, notes: extendedFamily.notes, status: extendedFamily.deathYear ? 'deceased' : 'living',
    };
    const mainPersonGeneratedId = addPerson(mainPersonRKey, mainPersonInputDataForAddPerson, "Self", 0, false);
    if (!mainPersonGeneratedId) throw new Error("Main person processing failed catastrophically.");

    let highestPaternalAncestorFmId: string | undefined = mainPersonGeneratedId;
    let highestPaternalAncestorGen: number = 0;
    let highestMaternalAncestorFmId: string | undefined = mainPersonGeneratedId;
    let highestMaternalAncestorGen: number = 0;

    // Parents
    if (extendedFamily.parents?.father?.name) {
        const fatherId = addPerson(fatherRKey, extendedFamily.parents.father, "Father", -1, false, "paternal");
        if (fatherId) { highestPaternalAncestorFmId = fatherId; highestPaternalAncestorGen = -1; }
    }
    if (extendedFamily.parents?.mother?.name) {
        const motherId = addPerson(motherRKey, extendedFamily.parents.mother, "Mother", -1, false, "maternal");
        if (motherId) { highestMaternalAncestorFmId = motherId; highestMaternalAncestorGen = -1; }
    }

    // Grandparents
    if (idMap[fatherRKey]) { // Paternal grandparents only if father exists
        if (extendedFamily.grandparents?.paternal?.grandfather?.name) {
            const pgfId = addPerson(pgfRKey, extendedFamily.grandparents.paternal.grandfather, "Paternal Grandfather", -2, false, "paternal");
            if (pgfId) { highestPaternalAncestorFmId = pgfId; highestPaternalAncestorGen = -2;}
        }
        if (extendedFamily.grandparents?.paternal?.grandmother?.name) {
            addPerson(pgmRKey, extendedFamily.grandparents.paternal.grandmother, "Paternal Grandmother", -2, false, "paternal");
        }
    }
    if (idMap[motherRKey]) { // Maternal grandparents only if mother exists
        if (extendedFamily.grandparents?.maternal?.grandfather?.name) {
            const mgfId = addPerson(mgfRKey, extendedFamily.grandparents.maternal.grandfather, "Maternal Grandfather", -2, false, "maternal");
            if (mgfId) { highestMaternalAncestorFmId = mgfId; highestMaternalAncestorGen = -2;}
        }
        if (extendedFamily.grandparents?.maternal?.grandmother?.name) {
            addPerson(mgmRKey, extendedFamily.grandparents.maternal.grandmother, "Maternal Grandmother", -2, false, "maternal");
        }
    }

    // Spouse, Siblings, Children
    if (extendedFamily.spouse?.name) {
        addPerson(spouseRKey, extendedFamily.spouse, "Spouse", 0);
    }
    (extendedFamily.siblings || []).forEach((s, i) => {
        if (s.name?.trim() || s.birthYear) {
            addPerson(`form_sibling_${i}`, s, s.gender === 'male' ? 'Brother' : (s.gender === 'female' ? 'Sister' : 'Sibling'), 0, false, idMap[fatherRKey] ? "paternal" : (idMap[motherRKey] ? "maternal" : undefined) );
        }
    });
    (extendedFamily.children || []).forEach((c, i) => {
        if (c.name?.trim() || c.birthYear) {
            addPerson(`form_child_${i}`, c, c.gender === 'male' ? 'Son' : (c.gender === 'female' ? 'Daughter' : 'Child'), 1);
        }
    });

    // --- Helper to add historical lineage branch ---
    const addHistoricalLineageBranch = (
        lineageElderRef: ElderReference | undefined,
        lineageElderTribeNameFromForm: string | undefined, // Tribe selected in form for this elder
        lineageElderClanNameFromForm: string | undefined,   // Clan selected in form for this elder
        attachmentPointFmId: string,
        attachmentPointGen: number,
        lineageSide: 'paternal' | 'maternal' | undefined
    ) => {
        if (!lineageElderRef?.id) return;

        const getFullClanElder = (elderId: string): FullClanElderType | undefined => {
            for (const tribe of ugandaTribesData) {
                // If tribe/clan hints are available from form, use them to find the elder faster
                if (lineageElderTribeNameFromForm && tribe.name !== lineageElderTribeNameFromForm) continue;
                for (const clan of tribe.clans) {
                    if (lineageElderClanNameFromForm && clan.name !== lineageElderClanNameFromForm) continue;
                    const found = clan.elders?.find(e => e.id === elderId);
                    if (found) return { 
                        ...found, 
                        clanName: clan.name, // Add context
                        clanId: clan.id,
                        // Ensure parentId from actual data is used for tracing
                        parentId: ugandaTribesData.flatMap(t => t.clans).flatMap(cl => cl.elders || []).find(e => e.id === elderId)?.parentId 
                    };
                }
            }
            // Fallback search if hints didn't find it (e.g. elder from a different clan than selected)
             for (const tribe of ugandaTribesData) {
                for (const clan of tribe.clans) {
                    const found = clan.elders?.find(e => e.id === elderId);
                    if (found) return { ...found, clanName: clan.name, clanId: clan.id, parentId: found.parentId };
                }
            }
            return undefined;
        };

        const primaryLineageElder = getFullClanElder(lineageElderRef.id);
        if (!primaryLineageElder) {
            console.warn(`[transform] Full details for lineage elder ID ${lineageElderRef.id} not found. Adding simple reference.`);
            const simpleElderInput = { name: lineageElderRef.name, notes: `Era: ${lineageElderRef.approximateEra}. Clan lineage connection.`, gender: 'male' as 'male' | 'female' }; // Default to male if gender unknown
            const simpleElderFmId = addPerson(null, simpleElderInput, "Clan Ancestor", attachmentPointGen - 1, true, lineageSide, lineageElderRef.id);
            if (simpleElderFmId) {
                const userAncestor = members.find(m => m.id === attachmentPointFmId);
                if (userAncestor && userAncestor.id !== simpleElderFmId) userAncestor.parentId = simpleElderFmId;
            }
            return;
        }

        const historicalChain: FullClanElderType[] = [];
        let currentElderToTrace: FullClanElderType | undefined = primaryLineageElder;
        const taProcessedFmIds: Record<string, string> = {};

        // Trace up to 2 ancestors + Tribal Ancestor (max 3 historical figures above primaryLineageElder)
        for (let i = 0; i < 3 && currentElderToTrace; i++) {
            historicalChain.unshift(currentElderToTrace);
            if (currentElderToTrace.parentId) {
                if (currentElderToTrace.parentId.startsWith("TA_")) {
                    const taId = currentElderToTrace.parentId;
                    // Ensure TA node is added only once using its TA_id as existingId
                    const tribeOfTA = ugandaTribesData.find(t => t.id === taId.substring(3)) || ugandaTribesData.find(t => t.name === lineageElderTribeNameFromForm) || ugandaTribesData.find(t => t.name === currentElderToTrace.clanName?.split(" ")[0]);
                    const taName = tribeOfTA ? `Progenitor of ${tribeOfTA.name}` : "Tribal Progenitor";
                    
                    const taFmId = addPerson(null, { name: taName, gender: 'male' }, "Tribal Progenitor", 0, true, undefined, taId); // Gen will be adjusted later
                    if(taFmId) taProcessedFmIds[taId] = taFmId;

                    if (!historicalChain.find(e => e.id === taId)) {
                        historicalChain.unshift({
                            id: taId, name: taName, approximateEra: "Ancient", verificationScore: 0, gender: 'male', parentId: undefined, familyUnits:[], clanName: "Tribal" // This is a stub for ordering
                        } as FullClanElderType);
                    }
                    currentElderToTrace = undefined;
                } else {
                    currentElderToTrace = getFullClanElder(currentElderToTrace.parentId);
                }
            } else {
                currentElderToTrace = undefined;
            }
        }
        
        let previousHistoricalFmIdInChain: string | undefined = undefined;
        let currentHistoricalGen = attachmentPointGen;

        // Add historical elders from top-down, adjusting generation
        for (let i = 0; i < historicalChain.length; i++) {
            const elder = historicalChain[i];
            const isTA = elder.id.startsWith("TA_");
            currentHistoricalGen = attachmentPointGen - (historicalChain.length - i); // TA is furthest, PLE is closest to attachmentPointGen

            const fmId = addPerson(
                null,
                { name: elder.name, birthYear: elder.birthYear?.toString(), deathYear: elder.deathYear?.toString(), gender: elder.gender, notes: elder.significance || elder.notes, status: elder.deathYear ? 'deceased' : 'living' },
                isTA ? "Tribal Progenitor" : "Clan Ancestor",
                currentHistoricalGen,
                true,
                isTA ? undefined : lineageSide,
                elder.id // Use original ID as FamilyMember ID
            );

            if (fmId) {
                const memberInArray = members.find(m => m.id === fmId);
                if (memberInArray) {
                    // Link to the previously added elder in this historical chain
                    if (previousHistoricalFmIdInChain && memberInArray.id !== previousHistoricalFmIdInChain ) {
                        // Check if previous was TA, current is child of TA
                        if (elder.parentId === previousHistoricalFmIdInChain || (elder.parentId?.startsWith("TA_") && previousHistoricalFmIdInChain === elder.parentId) ) {
                           memberInArray.parentId = previousHistoricalFmIdInChain;
                        }
                    }
                     // If the elder's parentId from data is a TA_id and that TA node exists, link it
                    else if (elder.parentId && elder.parentId.startsWith("TA_")) {
                        const taNode = members.find(m => m.id === elder.parentId);
                        if (taNode) memberInArray.parentId = taNode.id;
                    }
                }
                previousHistoricalFmIdInChain = fmId;
            } else {
                const existingMember = members.find(m => m.id === elder.id);
                if(existingMember) previousHistoricalFmIdInChain = existingMember.id;
                else { previousHistoricalFmIdInChain = undefined; break; }
            }
        }

        if (previousHistoricalFmIdInChain && attachmentPointFmId) {
            const attachmentMember = members.find(m => m.id === attachmentPointFmId);
            const historicalLinkPoint = members.find(m => m.id === primaryLineageElder.id); // Link the actual selected elder
            if (attachmentMember && historicalLinkPoint && attachmentMember.id !== historicalLinkPoint.id) {
                attachmentMember.parentId = historicalLinkPoint.id; // The primary selected elder becomes parent of UFKA
                console.log(`[transform] Linked ${attachmentMember.name} (gen ${attachmentMember.generation}) to historical elder ${historicalLinkPoint.name} (ID: ${historicalLinkPoint.id}, gen ${historicalLinkPoint.generation})`);
            }
        }
    };

    if (extendedFamily.paternalLineageElderRef?.id && highestPaternalAncestorFmId) {
        addHistoricalLineageBranch(
            extendedFamily.paternalLineageElderRef,
            extendedFamily.paternalLineageElderTribe,
            extendedFamily.paternalLineageElderClan,
            highestPaternalAncestorFmId,
            highestPaternalAncestorGen,
            "paternal"
        );
    }

    if (extendedFamily.maternalLineageElderRef?.id && highestMaternalAncestorFmId) {
        let matAttachId = highestMaternalAncestorFmId;
        let matAttachGen = highestMaternalAncestorGen;

        // If maternal line starts from main person (no mother/MGF entered)
        if (highestMaternalAncestorFmId === mainPersonGeneratedId && !idMap[motherRKey]) {
            matAttachId = mainPersonGeneratedId;
            matAttachGen = 0;
        }
        
        addHistoricalLineageBranch(
            extendedFamily.maternalLineageElderRef,
            extendedFamily.maternalLineageElderTribe,
            extendedFamily.maternalLineageElderClan,
            matAttachId,
            matAttachGen,
            "maternal"
        );
    }

    // Final linking pass for main lineage (Parents, Spouses)
    members.forEach(member => {
        if (member.relationship && (member.relationship.includes("Clan Ancestor") || member.relationship.includes("Tribal Progenitor"))) {
            return;
        }
        const memberOriginalRoleKey = Object.keys(idMap).find(key => idMap[key] === member.id);

        if (!member.parentId) { // Only set if not already set by historical lineage logic
            if (member.id === mainPersonGeneratedId) {
                if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
                else if (idMap[motherRKey]) member.parentId = idMap[motherRKey];
            }
            else if (member.id === idMap[fatherRKey] && idMap[pgfRKey]) {
                member.parentId = idMap[pgfRKey];
            } else if (member.id === idMap[motherRKey] && idMap[mgfRKey]) {
                member.parentId = idMap[mgfRKey];
            }
            else if (memberOriginalRoleKey?.startsWith("form_sibling_")) {
                if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
                else if (idMap[motherRKey] && !idMap[fatherRKey]) member.parentId = idMap[motherRKey];
            }
            else if (memberOriginalRoleKey?.startsWith("form_child_")) {
                if (mainPersonGeneratedId) member.parentId = mainPersonGeneratedId;
            }
        }

        if (memberOriginalRoleKey && !member.spouseId) {
            if (member.id === mainPersonGeneratedId && idMap[spouseRKey]) member.spouseId = idMap[spouseRKey];
            else if (member.id === idMap[spouseRKey] && mainPersonGeneratedId) member.spouseId = mainPersonGeneratedId;
            else if (member.id === idMap[fatherRKey] && idMap[motherRKey]) member.spouseId = idMap[motherRKey];
            else if (member.id === idMap[motherRKey] && idMap[fatherRKey]) member.spouseId = idMap[fatherRKey];
            else if (member.id === idMap[pgfRKey] && idMap[pgmRKey]) member.spouseId = idMap[pgmRKey];
            else if (member.id === idMap[pgmRKey] && idMap[pgfRKey]) member.spouseId = idMap[pgfRKey];
            else if (member.id === idMap[mgfRKey] && idMap[mgmRKey]) member.spouseId = idMap[mgmRKey];
            else if (member.id === idMap[mgmRKey] && idMap[mgfRKey]) member.spouseId = idMap[mgfRKey];
        }
    });

    console.log(`Home.tsx: Client-side transformation complete. Final members generated: ${members.length}`);
    return { members, idMap };
};


const Home = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTreeForPreview, setFamilyTreeForPreview] = useState<FamilyTree | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && familyTreeForPreview) {
      setFamilyTreeForPreview(null);
    }
  }, [user, familyTreeForPreview]);

  const handleLogin = () => setShowAuth(true);
  const handleSignup = () => setShowAuth(true);

  const createAndSaveTreeFromFormData = async (formData: TreeFormData) => {
    if (!user) {
      toast.error("Authentication required. Please log in.");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);
    setFamilyTreeForPreview(null);
    console.log("Home.tsx: Starting DIRECT client-side processing and saving.");

    toast.promise(
      async () => {
        try {
          console.log("Home.tsx: Processing TreeFormData directly on client (formData surname):", formData.surname);
          const { members } = transformTreeFormDataToMembers(formData.extendedFamily, formData.surname);

          if (!formData.extendedFamily.familyName) {
             throw new Error("Main person's name (Your Full Name) is required in the form.");
          }
          if (members.length === 0 && formData.extendedFamily.familyName) {
             console.warn("Home.tsx: Client-side transformation resulted in zero members despite main person name.");
             toast.warning("Tree metadata will be created, but no members were processed from the form details.");
          } else if (members.length > 0) {
             console.log(`Home.tsx: Client-side transformation resulted in ${members.length} members.`);
          }

          const treeId = crypto.randomUUID();
          const createdAt = new Date().toISOString();

          const { data: savedTreeData, error: treeError } = await supabase
            .from('family_trees')
            .insert({
              id: treeId, user_id: user.id, surname: formData.surname,
              tribe: formData.tribe, clan: formData.clan, created_at: createdAt,
            })
            .select().single();

          if (treeError) throw treeError;
          if (!savedTreeData) throw new Error("Failed to save family tree metadata.");
          console.log("Home.tsx: Family tree metadata saved:", savedTreeData);

          if (members && members.length > 0) {
            const membersToInsert = members.map(member => ({
              id: member.id,
              name: member.name,
              relationship: member.relationship,
              birth_year: member.birthYear || null,
              death_year: member.deathYear || null,
              generation: member.generation,
              parent_id: member.parentId || null,
              spouse_id: member.spouseId || null,
              is_elder: member.isElder,
              gender: member.gender || null,
              side: member.side || null,
              status: member.status || (member.deathYear ? 'deceased' : 'living'),
              notes: member.notes || null,
              photo_url: member.photoUrl || null,
              family_tree_id: savedTreeData.id,
            }));

            console.log("Home.tsx: Data being sent to 'family_members' table (first member):", JSON.stringify(membersToInsert[0], null, 2));
            const { error: membersError } = await supabase.from('family_members').insert(membersToInsert);
            if (membersError) {
              await supabase.from('family_trees').delete().eq('id', savedTreeData.id);
              console.error("Error saving members, rolled back tree creation:", membersError);
              throw membersError;
            }
            console.log(`Home.tsx: ${membersToInsert.length} family members saved.`);
          } else {
            console.warn("Home.tsx: No members to save.");
          }

          const completeNewTreeForPreview: FamilyTree = {
            id: savedTreeData.id,
            userId: user.id,
            surname: savedTreeData.surname,
            tribe: savedTreeData.tribe,
            clan: savedTreeData.clan,
            createdAt: savedTreeData.created_at,
            members: members || [],
          };
          setFamilyTreeForPreview(completeNewTreeForPreview);
          return completeNewTreeForPreview;
        } catch(error: any) {
            console.error("Home.tsx: Error within createAndSaveTreeFromFormData's async promise:", error);
            if (error instanceof Error) throw error;
            throw new Error(String(error?.message || error || "An unknown error occurred during tree creation."));
        }
      },
      {
        loading: "Processing and saving your family tree...",
        success: (newTreeObject: FamilyTree | undefined) => {
          setIsLoading(false);
          if (!newTreeObject) return "Tree created, but an issue occurred fetching preview data.";
          return `Family tree "${newTreeObject.surname || 'Unnamed'}" created and saved! Preview below.`;
        },
        error: (err: any) => {
          setIsLoading(false);
          console.error("Home.tsx: Toast caught error from promise (FULL OBJECT):", err);
          let displayMessage = "Unknown error during tree creation.";
          if (err && typeof err === 'object') {
            displayMessage = err.message || "Database operation failed.";
            if (err.details) displayMessage += ` Details: ${err.details}`;
            if (err.hint) displayMessage += ` Hint: ${err.hint}`;
            if (err.code) displayMessage += ` (Code: ${err.code})`;
          } else if (typeof err === 'string') {
            displayMessage = err;
          }
          return `Operation failed: ${displayMessage}`;
        },
      }
    );
  };

  const handleNavigateToTrees = () => {
    navigate('/family-trees');
  };

  const handlePreviewTreeUpdate = (updatedTree: FamilyTree) => {
    console.log("Home.tsx: Preview tree data updated by FamilyTreeMultiView/Display child component.");
    setFamilyTreeForPreview(updatedTree);
    toast.info("Preview updated. Note: These changes are not yet saved to the database from this preview page.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-uganda-black via-uganda-black to-uganda-red/90 text-white">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  Discover Your <span className="text-uganda-yellow">Family Legacy</span>
                </h1>
                <p className="text-lg md:text-xl max-w-xl mb-6 text-gray-200">
                  Connect with your roots and preserve your Ugandan heritage by exploring your family tree through clan and tribal connections.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    className="bg-uganda-yellow hover:bg-uganda-yellow/90 text-uganda-black font-semibold px-6 py-3 rounded-lg"
                    onClick={() => document.getElementById('start-your-tree')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Start Your Family Tree
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white hover:bg-white/10 text-uganda-black font-bold bg-white px-6 py-3 rounded-lg"
                    onClick={() => navigate('/dna-test')}
                  >
                    <Dna className="h-4 w-4 mr-2" />
                    Get DNA Test
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="Download on App Store"
                    className="h-10"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Get it on Google Play"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-full h-96 rounded-lg bg-gradient-to-br from-uganda-yellow/20 to-uganda-red/20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-uganda-yellow/30 border-4 border-uganda-yellow flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-bold">Your Family</p>
                        <p className="text-sm">At the center</p>
                      </div>
                    </div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(-45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(-45deg)' }}></div>
                    <div className="absolute top-1/4 right-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Grandparents</p></div>
                    <div className="absolute bottom-1/4 right-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Parents</p></div>
                    <div className="absolute top-1/4 left-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Clan Elders</p></div>
                    <div className="absolute bottom-1/4 left-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Children</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-card text-card-foreground">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Discover Your Heritage with FamiRoots</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Our powerful tools help you build, explore, and share your Ugandan family heritage</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6"><Users className="h-8 w-8 text-uganda-black" /></div>
                <h3 className="text-xl font-bold mb-3">Family Tree Builder</h3>
                <p className="text-muted-foreground mb-4">Create your family tree centered around Ugandan clan structures, with AI assistance to build connections accurately.</p>
                <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => document.getElementById('start-your-tree')?.scrollIntoView({ behavior: 'smooth' })}>Start Building</Button>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6"><Dna className="h-8 w-8 text-uganda-black" /></div>
                  <h3 className="text-xl font-bold mb-3">DNA Testing</h3>
                  <p className="text-muted-foreground mb-4">Discover your ethnic origins and connect with relatives through our advanced genetic testing services.</p>
                  <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => navigate('/dna-test')}>Explore DNA Testing</Button>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6"><Search className="h-8 w-8 text-uganda-black" /></div>
                  <h3 className="text-xl font-bold mb-3">Relationship Analyzer</h3>
                  <p className="text-muted-foreground mb-4">Find out how you're connected to other people through our powerful relationship detection tool.</p>
                  <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => navigate('/relationship-analyzer')}>Analyze Relationships</Button>
              </div>
            </div>
          </div>
        </section>

        <section id="start-your-tree" className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Start Your Family Tree Journey
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enter your family information to generate and save your clan-based family tree.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl border border-border">
                <FamilyTreeForm onSubmit={createAndSaveTreeFromFormData} isLoading={isLoading} />
              </div>
              
              <div className="sticky top-24 self-start">
                <h3 className="text-2xl font-semibold mb-4 text-foreground text-center">
                  {familyTreeForPreview ? "Generated Tree Preview" : "Your Tree Will Appear Here"}
                </h3>
                {isLoading && !familyTreeForPreview && (
                    <div className="bg-card rounded-lg p-6 border-2 border-dashed border-border shadow-lg min-h-[550px] flex flex-col justify-center items-center">
                        <div className="animate-pulse flex flex-col items-center"><Users className="h-16 w-16 text-uganda-yellow mb-4" /><p className="text-muted-foreground">Processing and saving your tree...</p></div>
                    </div>
                )}
                {!isLoading && familyTreeForPreview && (
                  <div className="bg-card rounded-lg shadow-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                        <p className="font-medium text-foreground text-sm">{familyTreeForPreview.surname} Family Tree</p>
                        <Button variant="outline" size="sm" onClick={handleNavigateToTrees} title="View all your saved trees"><Eye className="mr-1.5 h-4 w-4"/> My Saved Trees</Button>
                    </div>
                    <div className="h-[auto] min-h-[550px] border-t border-border">
                        {familyTreeForPreview.members && familyTreeForPreview.members.length >= 0 ? (
                            <FamilyTreeMultiView
                              tree={familyTreeForPreview}
                              onTreeDataUpdate={handlePreviewTreeUpdate}
                            />
                        ) : (
                            <div className="p-10 text-center text-muted-foreground flex items-center justify-center h-full">
                                Tree data is available, but no members were found in the preview.
                            </div>
                        )}
                    </div>
                  </div>
                )}
                {!isLoading && !familyTreeForPreview && (
                  <div className="bg-card rounded-lg p-6 text-center border-2 border-dashed border-border shadow-lg min-h-[550px] flex flex-col justify-center items-center">
                    <div className="mb-4"><div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow/20"><FileText className="h-10 w-10 text-uganda-yellow" /></div><h2 className="text-2xl font-bold mb-2 text-foreground">Your Family Tree</h2><p className="text-muted-foreground mb-6">Fill out the form to generate and save your clan-based family tree.</p></div>
                    {!user && ( <div className="mt-6 p-4 bg-uganda-yellow/10 rounded-lg border border-uganda-yellow/30"><p className="text-sm text-foreground"><button onClick={handleLogin} className="text-uganda-red hover:underline font-medium">Login</button>{" or "}<button onClick={handleSignup} className="text-uganda-red hover:underline font-medium">Sign up</button>{" to save your family tree."}</p></div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 px-4 bg-gradient-to-br from-uganda-black to-uganda-black/90 text-white">
           <div className="container mx-auto max-w-5xl text-center"><h2 className="text-3xl font-bold mb-8">Preserving Uganda's Rich Heritage</h2><p className="text-xl mb-12 max-w-3xl mx-auto">FamiRoots helps preserve the cultural connections and family histories of Ugandan communities for generations to come.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="p-6 bg-white/10 rounded-lg"><h3 className="text-xl font-bold mb-3 text-uganda-yellow">40+ Tribes</h3><p className="text-gray-300">Comprehensive database of Uganda's diverse tribal heritage</p></div><div className="p-6 bg-white/10 rounded-lg"><h3 className="text-xl font-bold mb-3 text-uganda-yellow">200+ Clans</h3><p className="text-gray-300">Detailed clan information with cultural context and historical significance</p></div><div className="p-6 bg-white/10 rounded-lg"><h3 className="text-xl font-bold mb-3 text-uganda-yellow">AI-Powered</h3><p className="text-gray-300">Advanced technology that helps verify and connect family relationships</p></div></div><Button className="mt-12 bg-uganda-yellow hover:bg-uganda-yellow/90 text-uganda-black font-semibold px-8 py-3 rounded-lg" onClick={() => navigate('/tribes')}>Explore Ugandan Tribes</Button></div>
        </section>
      </main>
      <Footer />
      {showAuth && (<AuthForm onClose={() => setShowAuth(false)} />)}
    </div>
  );
};
export default Home;// src/pages/Home.tsx

import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeMultiView from "@/components/FamilyTreeMultiView";
import Footer from "@/components/Footer";
import {
    TreeFormData,
    FamilyTree,
    FamilyMember,
    ExtendedFamilyInputData,
    MemberInputData,
    ElderReference,
    ClanElder as FullClanElderType
} from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dna, Users, FileText, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

const generateClientMemberId = (): string => {
  return crypto.randomUUID();
};

const transformTreeFormDataToMembers = (
    extendedFamily: ExtendedFamilyInputData,
    mainPersonSurname: string
): { members: FamilyMember[], idMap: Record<string, string> } => {

    console.log("[Home.tsx transform] Starting transformation for main person:", extendedFamily.familyName);
    const members: FamilyMember[] = [];
    const idMap: Record<string, string> = {}; // For main lineage roles

    const mainPersonRKey = "mainPerson";
    const fatherRKey = "father";
    const motherRKey = "mother";
    const pgfRKey = "paternalGrandfather";
    const pgmRKey = "paternalGrandmother";
    const mgfRKey = "maternalGrandfather";
    const mgmRKey = "maternalGrandmother";
    const spouseRKey = "spouse";

    const addPerson = (
        roleKey: string | null,
        inputData: Partial<Pick<FamilyMember, 'name' | 'birthYear' | 'deathYear' | 'gender' | 'notes' | 'status'>> | undefined,
        relationshipToProband: string,
        generation: number,
        isElderFlag?: boolean,
        familySide?: 'paternal' | 'maternal',
        existingId?: string
    ): string | undefined => {
        let personName = inputData?.name?.trim();

        if (!personName && roleKey !== mainPersonRKey && !relationshipToProband.includes("Ancestor") && !relationshipToProband.includes("Progenitor")) {
            const isTrulyOptionalAndEmpty =
                (roleKey?.includes("grandparent") || roleKey === spouseRKey || roleKey?.includes("sibling") || roleKey?.includes("child")) &&
                !(inputData?.birthYear || inputData?.deathYear || inputData?.gender || inputData?.notes);
            if (isTrulyOptionalAndEmpty && roleKey !== mainPersonRKey) {
                console.warn(`[transform] Skipping empty optional member: ${roleKey}`);
                return undefined;
            }
            if (roleKey !== mainPersonRKey && !(inputData?.name)) { // Avoid placeholder if name is just empty string but field was touched
                 console.warn(`[transform] Name missing for ${roleKey}. Using placeholder 'Unnamed ${relationshipToProband}'.`);
            }
        }
        if (!personName && roleKey === mainPersonRKey && (extendedFamily as ExtendedFamilyInputData).familyName) {
             personName = (extendedFamily as ExtendedFamilyInputData).familyName?.trim();
        }
        if (!personName && roleKey === mainPersonRKey) {
             console.error("[transform] Main person's name (familyName) is missing but required.");
             throw new Error("Main person's name (familyName) is required in the form.");
        }
        const displayName = personName || `Unnamed ${relationshipToProband}`;
        const finalId = existingId || generateClientMemberId();
        if(roleKey && !existingId && !idMap[roleKey]) {
            idMap[roleKey] = finalId;
        }
        if (existingId && members.find(m => m.id === finalId)) {
            // console.log(`[transform] Member ${displayName} (ID: ${finalId}) using existingId already processed. Not re-adding.`);
            return finalId;
        }

        const member: FamilyMember = {
            id: finalId, name: displayName, relationship: relationshipToProband,
            birthYear: inputData?.birthYear || undefined, deathYear: inputData?.deathYear || undefined,
            generation: generation, parentId: undefined, spouseId: undefined,
            isElder: isElderFlag || false, gender: (inputData?.gender as 'male' | 'female' | undefined) || undefined,
            side: familySide, status: inputData?.status || (inputData?.deathYear ? 'deceased' : 'living'),
            notes: inputData?.notes || undefined, photoUrl: undefined,
        };
        members.push(member);
        console.log(`[transform] Added: ${member.name} (ID: ${member.id}, RoleKey: ${roleKey || 'CustomElder'}, Gen: ${member.generation}, Rel: ${member.relationship})`);
        return finalId;
    };

    // --- 1. Create Main Person and their direct lineage ---
    const mainPersonInputDataForAddPerson: Partial<Pick<FamilyMember, 'name' | 'birthYear' | 'deathYear' | 'gender' | 'notes' | 'status'>> = {
        name: extendedFamily.familyName, birthYear: extendedFamily.birthYear, deathYear: extendedFamily.deathYear,
        gender: extendedFamily.gender, notes: extendedFamily.notes, status: extendedFamily.deathYear ? 'deceased' : 'living',
    };
    const mainPersonGeneratedId = addPerson(mainPersonRKey, mainPersonInputDataForAddPerson, "Self", 0, false);
    if (!mainPersonGeneratedId) throw new Error("Main person processing failed catastrophically.");

    let highestPaternalAncestorFmId: string | undefined = mainPersonGeneratedId;
    let highestPaternalAncestorGen: number = 0;
    let highestMaternalAncestorFmId: string | undefined = mainPersonGeneratedId;
    let highestMaternalAncestorGen: number = 0;

    // Parents
    if (extendedFamily.parents?.father?.name) {
        const fatherId = addPerson(fatherRKey, extendedFamily.parents.father, "Father", -1, false, "paternal");
        if (fatherId) { highestPaternalAncestorFmId = fatherId; highestPaternalAncestorGen = -1; }
    }
    if (extendedFamily.parents?.mother?.name) {
        const motherId = addPerson(motherRKey, extendedFamily.parents.mother, "Mother", -1, false, "maternal");
        if (motherId) { highestMaternalAncestorFmId = motherId; highestMaternalAncestorGen = -1; }
    }

    // Grandparents
    if (idMap[fatherRKey]) { // Paternal grandparents only if father exists
        if (extendedFamily.grandparents?.paternal?.grandfather?.name) {
            const pgfId = addPerson(pgfRKey, extendedFamily.grandparents.paternal.grandfather, "Paternal Grandfather", -2, false, "paternal");
            if (pgfId) { highestPaternalAncestorFmId = pgfId; highestPaternalAncestorGen = -2;}
        }
        if (extendedFamily.grandparents?.paternal?.grandmother?.name) {
            addPerson(pgmRKey, extendedFamily.grandparents.paternal.grandmother, "Paternal Grandmother", -2, false, "paternal");
        }
    }
    if (idMap[motherRKey]) { // Maternal grandparents only if mother exists
        if (extendedFamily.grandparents?.maternal?.grandfather?.name) {
            const mgfId = addPerson(mgfRKey, extendedFamily.grandparents.maternal.grandfather, "Maternal Grandfather", -2, false, "maternal");
            if (mgfId) { highestMaternalAncestorFmId = mgfId; highestMaternalAncestorGen = -2;}
        }
        if (extendedFamily.grandparents?.maternal?.grandmother?.name) {
            addPerson(mgmRKey, extendedFamily.grandparents.maternal.grandmother, "Maternal Grandmother", -2, false, "maternal");
        }
    }

    // Spouse, Siblings, Children
    if (extendedFamily.spouse?.name) {
        addPerson(spouseRKey, extendedFamily.spouse, "Spouse", 0);
    }
    (extendedFamily.siblings || []).forEach((s, i) => {
        if (s.name?.trim() || s.birthYear) {
            addPerson(`form_sibling_${i}`, s, s.gender === 'male' ? 'Brother' : (s.gender === 'female' ? 'Sister' : 'Sibling'), 0, false, idMap[fatherRKey] ? "paternal" : (idMap[motherRKey] ? "maternal" : undefined) );
        }
    });
    (extendedFamily.children || []).forEach((c, i) => {
        if (c.name?.trim() || c.birthYear) {
            addPerson(`form_child_${i}`, c, c.gender === 'male' ? 'Son' : (c.gender === 'female' ? 'Daughter' : 'Child'), 1);
        }
    });

    // --- Helper to add historical lineage branch ---
    const addHistoricalLineageBranch = (
        lineageElderRef: ElderReference | undefined,
        lineageElderTribeNameFromForm: string | undefined, // Tribe selected in form for this elder
        lineageElderClanNameFromForm: string | undefined,   // Clan selected in form for this elder
        attachmentPointFmId: string,
        attachmentPointGen: number,
        lineageSide: 'paternal' | 'maternal' | undefined
    ) => {
        if (!lineageElderRef?.id) return;

        const getFullClanElder = (elderId: string): FullClanElderType | undefined => {
            for (const tribe of ugandaTribesData) {
                // If tribe/clan hints are available from form, use them to find the elder faster
                if (lineageElderTribeNameFromForm && tribe.name !== lineageElderTribeNameFromForm) continue;
                for (const clan of tribe.clans) {
                    if (lineageElderClanNameFromForm && clan.name !== lineageElderClanNameFromForm) continue;
                    const found = clan.elders?.find(e => e.id === elderId);
                    if (found) return { 
                        ...found, 
                        clanName: clan.name, // Add context
                        clanId: clan.id,
                        // Ensure parentId from actual data is used for tracing
                        parentId: ugandaTribesData.flatMap(t => t.clans).flatMap(cl => cl.elders || []).find(e => e.id === elderId)?.parentId 
                    };
                }
            }
            // Fallback search if hints didn't find it (e.g. elder from a different clan than selected)
             for (const tribe of ugandaTribesData) {
                for (const clan of tribe.clans) {
                    const found = clan.elders?.find(e => e.id === elderId);
                    if (found) return { ...found, clanName: clan.name, clanId: clan.id, parentId: found.parentId };
                }
            }
            return undefined;
        };

        const primaryLineageElder = getFullClanElder(lineageElderRef.id);
        if (!primaryLineageElder) {
            console.warn(`[transform] Full details for lineage elder ID ${lineageElderRef.id} not found. Adding simple reference.`);
            const simpleElderInput = { name: lineageElderRef.name, notes: `Era: ${lineageElderRef.approximateEra}. Clan lineage connection.`, gender: 'male' as 'male' | 'female' }; // Default to male if gender unknown
            const simpleElderFmId = addPerson(null, simpleElderInput, "Clan Ancestor", attachmentPointGen - 1, true, lineageSide, lineageElderRef.id);
            if (simpleElderFmId) {
                const userAncestor = members.find(m => m.id === attachmentPointFmId);
                if (userAncestor && userAncestor.id !== simpleElderFmId) userAncestor.parentId = simpleElderFmId;
            }
            return;
        }

        const historicalChain: FullClanElderType[] = [];
        let currentElderToTrace: FullClanElderType | undefined = primaryLineageElder;
        const taProcessedFmIds: Record<string, string> = {};

        // Trace up to 2 ancestors + Tribal Ancestor (max 3 historical figures above primaryLineageElder)
        for (let i = 0; i < 3 && currentElderToTrace; i++) {
            historicalChain.unshift(currentElderToTrace);
            if (currentElderToTrace.parentId) {
                if (currentElderToTrace.parentId.startsWith("TA_")) {
                    const taId = currentElderToTrace.parentId;
                    // Ensure TA node is added only once using its TA_id as existingId
                    const tribeOfTA = ugandaTribesData.find(t => t.id === taId.substring(3)) || ugandaTribesData.find(t => t.name === lineageElderTribeNameFromForm) || ugandaTribesData.find(t => t.name === currentElderToTrace.clanName?.split(" ")[0]);
                    const taName = tribeOfTA ? `Progenitor of ${tribeOfTA.name}` : "Tribal Progenitor";
                    
                    const taFmId = addPerson(null, { name: taName, gender: 'male' }, "Tribal Progenitor", 0, true, undefined, taId); // Gen will be adjusted later
                    if(taFmId) taProcessedFmIds[taId] = taFmId;

                    if (!historicalChain.find(e => e.id === taId)) {
                        historicalChain.unshift({
                            id: taId, name: taName, approximateEra: "Ancient", verificationScore: 0, gender: 'male', parentId: undefined, familyUnits:[], clanName: "Tribal" // This is a stub for ordering
                        } as FullClanElderType);
                    }
                    currentElderToTrace = undefined;
                } else {
                    currentElderToTrace = getFullClanElder(currentElderToTrace.parentId);
                }
            } else {
                currentElderToTrace = undefined;
            }
        }
        
        let previousHistoricalFmIdInChain: string | undefined = undefined;
        let currentHistoricalGen = attachmentPointGen;

        // Add historical elders from top-down, adjusting generation
        for (let i = 0; i < historicalChain.length; i++) {
            const elder = historicalChain[i];
            const isTA = elder.id.startsWith("TA_");
            currentHistoricalGen = attachmentPointGen - (historicalChain.length - i); // TA is furthest, PLE is closest to attachmentPointGen

            const fmId = addPerson(
                null,
                { name: elder.name, birthYear: elder.birthYear?.toString(), deathYear: elder.deathYear?.toString(), gender: elder.gender, notes: elder.significance || elder.notes, status: elder.deathYear ? 'deceased' : 'living' },
                isTA ? "Tribal Progenitor" : "Clan Ancestor",
                currentHistoricalGen,
                true,
                isTA ? undefined : lineageSide,
                elder.id // Use original ID as FamilyMember ID
            );

            if (fmId) {
                const memberInArray = members.find(m => m.id === fmId);
                if (memberInArray) {
                    // Link to the previously added elder in this historical chain
                    if (previousHistoricalFmIdInChain && memberInArray.id !== previousHistoricalFmIdInChain ) {
                        // Check if previous was TA, current is child of TA
                        if (elder.parentId === previousHistoricalFmIdInChain || (elder.parentId?.startsWith("TA_") && previousHistoricalFmIdInChain === elder.parentId) ) {
                           memberInArray.parentId = previousHistoricalFmIdInChain;
                        }
                    }
                     // If the elder's parentId from data is a TA_id and that TA node exists, link it
                    else if (elder.parentId && elder.parentId.startsWith("TA_")) {
                        const taNode = members.find(m => m.id === elder.parentId);
                        if (taNode) memberInArray.parentId = taNode.id;
                    }
                }
                previousHistoricalFmIdInChain = fmId;
            } else {
                const existingMember = members.find(m => m.id === elder.id);
                if(existingMember) previousHistoricalFmIdInChain = existingMember.id;
                else { previousHistoricalFmIdInChain = undefined; break; }
            }
        }

        if (previousHistoricalFmIdInChain && attachmentPointFmId) {
            const attachmentMember = members.find(m => m.id === attachmentPointFmId);
            const historicalLinkPoint = members.find(m => m.id === primaryLineageElder.id); // Link the actual selected elder
            if (attachmentMember && historicalLinkPoint && attachmentMember.id !== historicalLinkPoint.id) {
                attachmentMember.parentId = historicalLinkPoint.id; // The primary selected elder becomes parent of UFKA
                console.log(`[transform] Linked ${attachmentMember.name} (gen ${attachmentMember.generation}) to historical elder ${historicalLinkPoint.name} (ID: ${historicalLinkPoint.id}, gen ${historicalLinkPoint.generation})`);
            }
        }
    };

    if (extendedFamily.paternalLineageElderRef?.id && highestPaternalAncestorFmId) {
        addHistoricalLineageBranch(
            extendedFamily.paternalLineageElderRef,
            extendedFamily.paternalLineageElderTribe,
            extendedFamily.paternalLineageElderClan,
            highestPaternalAncestorFmId,
            highestPaternalAncestorGen,
            "paternal"
        );
    }

    if (extendedFamily.maternalLineageElderRef?.id && highestMaternalAncestorFmId) {
        let matAttachId = highestMaternalAncestorFmId;
        let matAttachGen = highestMaternalAncestorGen;

        // If maternal line starts from main person (no mother/MGF entered)
        if (highestMaternalAncestorFmId === mainPersonGeneratedId && !idMap[motherRKey]) {
            matAttachId = mainPersonGeneratedId;
            matAttachGen = 0;
        }
        
        addHistoricalLineageBranch(
            extendedFamily.maternalLineageElderRef,
            extendedFamily.maternalLineageElderTribe,
            extendedFamily.maternalLineageElderClan,
            matAttachId,
            matAttachGen,
            "maternal"
        );
    }

    // Final linking pass for main lineage (Parents, Spouses)
    members.forEach(member => {
        if (member.relationship && (member.relationship.includes("Clan Ancestor") || member.relationship.includes("Tribal Progenitor"))) {
            return;
        }
        const memberOriginalRoleKey = Object.keys(idMap).find(key => idMap[key] === member.id);

        if (!member.parentId) { // Only set if not already set by historical lineage logic
            if (member.id === mainPersonGeneratedId) {
                if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
                else if (idMap[motherRKey]) member.parentId = idMap[motherRKey];
            }
            else if (member.id === idMap[fatherRKey] && idMap[pgfRKey]) {
                member.parentId = idMap[pgfRKey];
            } else if (member.id === idMap[motherRKey] && idMap[mgfRKey]) {
                member.parentId = idMap[mgfRKey];
            }
            else if (memberOriginalRoleKey?.startsWith("form_sibling_")) {
                if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
                else if (idMap[motherRKey] && !idMap[fatherRKey]) member.parentId = idMap[motherRKey];
            }
            else if (memberOriginalRoleKey?.startsWith("form_child_")) {
                if (mainPersonGeneratedId) member.parentId = mainPersonGeneratedId;
            }
        }

        if (memberOriginalRoleKey && !member.spouseId) {
            if (member.id === mainPersonGeneratedId && idMap[spouseRKey]) member.spouseId = idMap[spouseRKey];
            else if (member.id === idMap[spouseRKey] && mainPersonGeneratedId) member.spouseId = mainPersonGeneratedId;
            else if (member.id === idMap[fatherRKey] && idMap[motherRKey]) member.spouseId = idMap[motherRKey];
            else if (member.id === idMap[motherRKey] && idMap[fatherRKey]) member.spouseId = idMap[fatherRKey];
            else if (member.id === idMap[pgfRKey] && idMap[pgmRKey]) member.spouseId = idMap[pgmRKey];
            else if (member.id === idMap[pgmRKey] && idMap[pgfRKey]) member.spouseId = idMap[pgfRKey];
            else if (member.id === idMap[mgfRKey] && idMap[mgmRKey]) member.spouseId = idMap[mgmRKey];
            else if (member.id === idMap[mgmRKey] && idMap[mgfRKey]) member.spouseId = idMap[mgfRKey];
        }
    });

    console.log(`Home.tsx: Client-side transformation complete. Final members generated: ${members.length}`);
    return { members, idMap };
};


const Home = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTreeForPreview, setFamilyTreeForPreview] = useState<FamilyTree | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && familyTreeForPreview) {
      setFamilyTreeForPreview(null);
    }
  }, [user, familyTreeForPreview]);

  const handleLogin = () => setShowAuth(true);
  const handleSignup = () => setShowAuth(true);

  const createAndSaveTreeFromFormData = async (formData: TreeFormData) => {
    if (!user) {
      toast.error("Authentication required. Please log in.");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);
    setFamilyTreeForPreview(null);
    console.log("Home.tsx: Starting DIRECT client-side processing and saving.");

    toast.promise(
      async () => {
        try {
          console.log("Home.tsx: Processing TreeFormData directly on client (formData surname):", formData.surname);
          const { members } = transformTreeFormDataToMembers(formData.extendedFamily, formData.surname);

          if (!formData.extendedFamily.familyName) {
             throw new Error("Main person's name (Your Full Name) is required in the form.");
          }
          if (members.length === 0 && formData.extendedFamily.familyName) {
             console.warn("Home.tsx: Client-side transformation resulted in zero members despite main person name.");
             toast.warning("Tree metadata will be created, but no members were processed from the form details.");
          } else if (members.length > 0) {
             console.log(`Home.tsx: Client-side transformation resulted in ${members.length} members.`);
          }

          const treeId = crypto.randomUUID();
          const createdAt = new Date().toISOString();

          const { data: savedTreeData, error: treeError } = await supabase
            .from('family_trees')
            .insert({
              id: treeId, user_id: user.id, surname: formData.surname,
              tribe: formData.tribe, clan: formData.clan, created_at: createdAt,
            })
            .select().single();

          if (treeError) throw treeError;
          if (!savedTreeData) throw new Error("Failed to save family tree metadata.");
          console.log("Home.tsx: Family tree metadata saved:", savedTreeData);

          if (members && members.length > 0) {
            const membersToInsert = members.map(member => ({
              id: member.id,
              name: member.name,
              relationship: member.relationship,
              birth_year: member.birthYear || null,
              death_year: member.deathYear || null,
              generation: member.generation,
              parent_id: member.parentId || null,
              spouse_id: member.spouseId || null,
              is_elder: member.isElder,
              gender: member.gender || null,
              side: member.side || null,
              status: member.status || (member.deathYear ? 'deceased' : 'living'),
              notes: member.notes || null,
              photo_url: member.photoUrl || null,
              family_tree_id: savedTreeData.id,
            }));

            console.log("Home.tsx: Data being sent to 'family_members' table (first member):", JSON.stringify(membersToInsert[0], null, 2));
            const { error: membersError } = await supabase.from('family_members').insert(membersToInsert);
            if (membersError) {
              await supabase.from('family_trees').delete().eq('id', savedTreeData.id);
              console.error("Error saving members, rolled back tree creation:", membersError);
              throw membersError;
            }
            console.log(`Home.tsx: ${membersToInsert.length} family members saved.`);
          } else {
            console.warn("Home.tsx: No members to save.");
          }

          const completeNewTreeForPreview: FamilyTree = {
            id: savedTreeData.id,
            userId: user.id,
            surname: savedTreeData.surname,
            tribe: savedTreeData.tribe,
            clan: savedTreeData.clan,
            createdAt: savedTreeData.created_at,
            members: members || [],
          };
          setFamilyTreeForPreview(completeNewTreeForPreview);
          return completeNewTreeForPreview;
        } catch(error: any) {
            console.error("Home.tsx: Error within createAndSaveTreeFromFormData's async promise:", error);
            if (error instanceof Error) throw error;
            throw new Error(String(error?.message || error || "An unknown error occurred during tree creation."));
        }
      },
      {
        loading: "Processing and saving your family tree...",
        success: (newTreeObject: FamilyTree | undefined) => {
          setIsLoading(false);
          if (!newTreeObject) return "Tree created, but an issue occurred fetching preview data.";
          return `Family tree "${newTreeObject.surname || 'Unnamed'}" created and saved! Preview below.`;
        },
        error: (err: any) => {
          setIsLoading(false);
          console.error("Home.tsx: Toast caught error from promise (FULL OBJECT):", err);
          let displayMessage = "Unknown error during tree creation.";
          if (err && typeof err === 'object') {
            displayMessage = err.message || "Database operation failed.";
            if (err.details) displayMessage += ` Details: ${err.details}`;
            if (err.hint) displayMessage += ` Hint: ${err.hint}`;
            if (err.code) displayMessage += ` (Code: ${err.code})`;
          } else if (typeof err === 'string') {
            displayMessage = err;
          }
          return `Operation failed: ${displayMessage}`;
        },
      }
    );
  };

  const handleNavigateToTrees = () => {
    navigate('/family-trees');
  };

  const handlePreviewTreeUpdate = (updatedTree: FamilyTree) => {
    console.log("Home.tsx: Preview tree data updated by FamilyTreeMultiView/Display child component.");
    setFamilyTreeForPreview(updatedTree);
    toast.info("Preview updated. Note: These changes are not yet saved to the database from this preview page.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-uganda-black via-uganda-black to-uganda-red/90 text-white">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  Discover Your <span className="text-uganda-yellow">Family Legacy</span>
                </h1>
                <p className="text-lg md:text-xl max-w-xl mb-6 text-gray-200">
                  Connect with your roots and preserve your Ugandan heritage by exploring your family tree through clan and tribal connections.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    className="bg-uganda-yellow hover:bg-uganda-yellow/90 text-uganda-black font-semibold px-6 py-3 rounded-lg"
                    onClick={() => document.getElementById('start-your-tree')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Start Your Family Tree
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white hover:bg-white/10 text-uganda-black font-bold bg-white px-6 py-3 rounded-lg"
                    onClick={() => navigate('/dna-test')}
                  >
                    <Dna className="h-4 w-4 mr-2" />
                    Get DNA Test
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="Download on App Store"
                    className="h-10"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Get it on Google Play"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-full h-96 rounded-lg bg-gradient-to-br from-uganda-yellow/20 to-uganda-red/20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-uganda-yellow/30 border-4 border-uganda-yellow flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-bold">Your Family</p>
                        <p className="text-sm">At the center</p>
                      </div>
                    </div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(-45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(-45deg)' }}></div>
                    <div className="absolute top-1/4 right-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Grandparents</p></div>
                    <div className="absolute bottom-1/4 right-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Parents</p></div>
                    <div className="absolute top-1/4 left-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Clan Elders</p></div>
                    <div className="absolute bottom-1/4 left-1/4 bg-white/10 p-2 rounded-lg border border-white/20"><p className="text-sm font-medium">Children</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-card text-card-foreground">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Discover Your Heritage with FamiRoots</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Our powerful tools help you build, explore, and share your Ugandan family heritage</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6"><Users className="h-8 w-8 text-uganda-black" /></div>
                <h3 className="text-xl font-bold mb-3">Family Tree Builder</h3>
                <p className="text-muted-foreground mb-4">Create your family tree centered around Ugandan clan structures, with AI assistance to build connections accurately.</p>
                <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => document.getElementById('start-your-tree')?.scrollIntoView({ behavior: 'smooth' })}>Start Building</Button>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6"><Dna className="h-8 w-8 text-uganda-black" /></div>
                  <h3 className="text-xl font-bold mb-3">DNA Testing</h3>
                  <p className="text-muted-foreground mb-4">Discover your ethnic origins and connect with relatives through our advanced genetic testing services.</p>
                  <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => navigate('/dna-test')}>Explore DNA Testing</Button>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6"><Search className="h-8 w-8 text-uganda-black" /></div>
                  <h3 className="text-xl font-bold mb-3">Relationship Analyzer</h3>
                  <p className="text-muted-foreground mb-4">Find out how you're connected to other people through our powerful relationship detection tool.</p>
                  <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => navigate('/relationship-analyzer')}>Analyze Relationships</Button>
              </div>
            </div>
          </div>
        </section>

        <section id="start-your-tree" className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Start Your Family Tree Journey
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enter your family information to generate and save your clan-based family tree.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl border border-border">
                <FamilyTreeForm onSubmit={createAndSaveTreeFromFormData} isLoading={isLoading} />
              </div>
              
              <div className="sticky top-24 self-start">
                <h3 className="text-2xl font-semibold mb-4 text-foreground text-center">
                  {familyTreeForPreview ? "Generated Tree Preview" : "Your Tree Will Appear Here"}
                </h3>
                {isLoading && !familyTreeForPreview && (
                    <div className="bg-card rounded-lg p-6 border-2 border-dashed border-border shadow-lg min-h-[550px] flex flex-col justify-center items-center">
                        <div className="animate-pulse flex flex-col items-center"><Users className="h-16 w-16 text-uganda-yellow mb-4" /><p className="text-muted-foreground">Processing and saving your tree...</p></div>
                    </div>
                )}
                {!isLoading && familyTreeForPreview && (
                  <div className="bg-card rounded-lg shadow-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                        <p className="font-medium text-foreground text-sm">{familyTreeForPreview.surname} Family Tree</p>
                        <Button variant="outline" size="sm" onClick={handleNavigateToTrees} title="View all your saved trees"><Eye className="mr-1.5 h-4 w-4"/> My Saved Trees</Button>
                    </div>
                    <div className="h-[auto] min-h-[550px] border-t border-border">
                        {familyTreeForPreview.members && familyTreeForPreview.members.length >= 0 ? (
                            <FamilyTreeMultiView
                              tree={familyTreeForPreview}
                              onTreeDataUpdate={handlePreviewTreeUpdate}
                            />
                        ) : (
                            <div className="p-10 text-center text-muted-foreground flex items-center justify-center h-full">
                                Tree data is available, but no members were found in the preview.
                            </div>
                        )}
                    </div>
                  </div>
                )}
                {!isLoading && !familyTreeForPreview && (
                  <div className="bg-card rounded-lg p-6 text-center border-2 border-dashed border-border shadow-lg min-h-[550px] flex flex-col justify-center items-center">
                    <div className="mb-4"><div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow/20"><FileText className="h-10 w-10 text-uganda-yellow" /></div><h2 className="text-2xl font-bold mb-2 text-foreground">Your Family Tree</h2><p className="text-muted-foreground mb-6">Fill out the form to generate and save your clan-based family tree.</p></div>
                    {!user && ( <div className="mt-6 p-4 bg-uganda-yellow/10 rounded-lg border border-uganda-yellow/30"><p className="text-sm text-foreground"><button onClick={handleLogin} className="text-uganda-red hover:underline font-medium">Login</button>{" or "}<button onClick={handleSignup} className="text-uganda-red hover:underline font-medium">Sign up</button>{" to save your family tree."}</p></div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 px-4 bg-gradient-to-br from-uganda-black to-uganda-black/90 text-white">
           <div className="container mx-auto max-w-5xl text-center"><h2 className="text-3xl font-bold mb-8">Preserving Uganda's Rich Heritage</h2><p className="text-xl mb-12 max-w-3xl mx-auto">FamiRoots helps preserve the cultural connections and family histories of Ugandan communities for generations to come.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="p-6 bg-white/10 rounded-lg"><h3 className="text-xl font-bold mb-3 text-uganda-yellow">40+ Tribes</h3><p className="text-gray-300">Comprehensive database of Uganda's diverse tribal heritage</p></div><div className="p-6 bg-white/10 rounded-lg"><h3 className="text-xl font-bold mb-3 text-uganda-yellow">200+ Clans</h3><p className="text-gray-300">Detailed clan information with cultural context and historical significance</p></div><div className="p-6 bg-white/10 rounded-lg"><h3 className="text-xl font-bold mb-3 text-uganda-yellow">AI-Powered</h3><p className="text-gray-300">Advanced technology that helps verify and connect family relationships</p></div></div><Button className="mt-12 bg-uganda-yellow hover:bg-uganda-yellow/90 text-uganda-black font-semibold px-8 py-3 rounded-lg" onClick={() => navigate('/tribes')}>Explore Ugandan Tribes</Button></div>
        </section>
      </main>
      <Footer />
      {showAuth && (<AuthForm onClose={() => setShowAuth(false)} />)}
    </div>
  );
};
export default Home;
