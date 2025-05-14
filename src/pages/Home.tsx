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
    ElderReference, // Make sure this is imported
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
    const idMap: Record<string, string> = {}; 

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
        inputData: Partial<Pick<FamilyMember, 'name' | 'birthYear' | 'deathYear' | 'gender' | 'notes'>> | undefined, // Adjusted inputData type
        relationshipToProband: string, 
        generation: number, 
        isElderFlag?: boolean,
        familySide?: 'paternal' | 'maternal',
        existingId?: string 
    ): string | undefined => { 
        
        const personName = inputData?.name?.trim();

        if (!personName && roleKey !== mainPersonRKey && !relationshipToProband.includes("Ancestor") && !relationshipToProband.includes("Progenitor")) {
            const isTrulyOptionalAndEmpty = 
                (roleKey?.includes("grandparent") || roleKey === spouseRKey || roleKey?.includes("sibling") || roleKey?.includes("child")) &&
                !(inputData?.birthYear || inputData?.deathYear || inputData?.gender || inputData?.notes);
            
            if (isTrulyOptionalAndEmpty) {
                console.warn(`[transform] Skipping empty optional member: ${roleKey}`);
                return undefined; 
            }
            console.warn(`[transform] Name missing for ${roleKey}. Using placeholder 'Unnamed ${relationshipToProband}'.`);
        }
        if (!personName && roleKey === mainPersonRKey && extendedFamily.familyName) { // Check against extendedFamily.familyName for main person
             personName = extendedFamily.familyName.trim();
        }
        if (!personName && roleKey === mainPersonRKey) {
             console.error("[transform] Main person's name (familyName) is missing but required.");
             throw new Error("Main person's name (familyName) is required in the form.");
        }


        const finalId = existingId || generateClientMemberId(); 
        if(roleKey && !existingId) idMap[roleKey] = finalId; // Only map roles for non-pre-existing IDs

        const member: FamilyMember = {
            id: finalId,
            name: personName || `Unnamed ${relationshipToProband}`, 
            relationship: relationshipToProband,
            birthYear: inputData?.birthYear || undefined,
            deathYear: inputData?.deathYear || undefined,
            generation: generation,
            parentId: undefined, 
            spouseId: undefined, 
            isElder: isElderFlag || false,
            gender: (inputData?.gender as 'male' | 'female' | undefined) || undefined,
            side: familySide,
            status: inputData?.deathYear ? 'deceased' : 'living',
            notes: inputData?.notes || undefined, 
            photoUrl: undefined, 
        };
        // Avoid adding duplicates if an elder (with existingId) is processed multiple times (e.g. as parent and then as self)
        if (!members.find(m => m.id === finalId)) {
            members.push(member);
            console.log(`[transform] Added: ${member.name} (ID: ${member.id}, RoleKey: ${roleKey || 'Custom'}, Gen: ${member.generation}, Rel: ${member.relationship})`);
        } else {
            console.log(`[transform] Member ${member.name} (ID: ${finalId}) already exists. Not re-adding.`);
        }
        return finalId;
    };

    // --- 1. Create Main Person and their direct lineage ---
    const mainPersonInputData = {
        name: extendedFamily.familyName,
        birthYear: extendedFamily.birthYear,
        // deathYear: extendedFamily.deathYear, // Add if in your ExtendedFamilyInputData for main person
        gender: extendedFamily.gender,
        notes: extendedFamily.notes
    };
    const mainPersonGeneratedId = addPerson(mainPersonRKey, mainPersonInputData, "Self", 0, false);
    if (!mainPersonGeneratedId) throw new Error("Main person processing failed catastrophically.");

    let highestPaternalAncestorFmId: string | undefined = mainPersonGeneratedId;
    let highestPaternalAncestorGen: number = 0;
    let highestMaternalAncestorFmId: string | undefined = mainPersonGeneratedId; // If no mother, maternal line links to self initially
    let highestMaternalAncestorGen: number = 0;


    if (extendedFamily.parents?.father?.name) {
        const fatherId = addPerson(fatherRKey, extendedFamily.parents.father, "Father", -1, false, "paternal");
        if (fatherId) { highestPaternalAncestorFmId = fatherId; highestPaternalAncestorGen = -1; }
    }
    if (extendedFamily.parents?.mother?.name) {
        const motherId = addPerson(motherRKey, extendedFamily.parents.mother, "Mother", -1, false, "maternal");
        if (motherId) { highestMaternalAncestorFmId = motherId; highestMaternalAncestorGen = -1; }
    }

    if (idMap[fatherRKey]) {
        if (extendedFamily.grandparents?.paternal?.grandfather?.name) {
            const pgfId = addPerson(pgfRKey, extendedFamily.grandparents.paternal.grandfather, "Paternal Grandfather", -2, false, "paternal");
            if (pgfId) { highestPaternalAncestorFmId = pgfId; highestPaternalAncestorGen = -2;}
        }
        if (extendedFamily.grandparents?.paternal?.grandmother?.name) {
            addPerson(pgmRKey, extendedFamily.grandparents.paternal.grandmother, "Paternal Grandmother", -2, false, "paternal");
        }
    }
    if (idMap[motherRKey]) {
        if (extendedFamily.grandparents?.maternal?.grandfather?.name) {
            const mgfId = addPerson(mgfRKey, extendedFamily.grandparents.maternal.grandfather, "Maternal Grandfather", -2, false, "maternal");
            if (mgfId) { highestMaternalAncestorFmId = mgfId; highestMaternalAncestorGen = -2;}
        }
        if (extendedFamily.grandparents?.maternal?.grandmother?.name) {
            addPerson(mgmRKey, extendedFamily.grandparents.maternal.grandmother, "Maternal Grandmother", -2, false, "maternal");
        }
    }
    
    // Spouse, Siblings, Children (their parentage is set in the main linking pass later)
    // ... (This logic remains the same as your previous version)
    if (extendedFamily.spouse?.name) {
        addPerson(spouseRKey, extendedFamily.spouse, "Spouse", 0);
    }
    (extendedFamily.siblings || []).forEach((s, i) => { 
        if (s.name?.trim()) { // Check only name, as gender/year are optional for minimal entry
            addPerson(`form_sibling_${i}`, s, s.gender === 'male' ? 'Brother' : s.gender === 'female' ? 'Sister' : 'Sibling', 0, false, extendedFamily.parents?.father?.name ? "paternal" : (extendedFamily.parents?.mother?.name ? "maternal" : undefined) );
        }
    });
    (extendedFamily.children || []).forEach((c, i) => { 
        if (c.name?.trim()) {
            addPerson(`form_child_${i}`, c, c.gender === 'male' ? 'Son' : c.gender === 'female' ? 'Daughter' : 'Child', 1);
        }
    });

    // --- Helper to add historical lineage branch ---
    const addHistoricalLineageBranch = (
        lineageElderRef: ElderReference | undefined,
        lineageElderTribeName: string | undefined, // For TA naming
        attachmentPointFmId: string, // ID of PGF, Father, MGF, Mother from main lineage
        attachmentPointGen: number,
        lineageSide: 'paternal' | 'maternal' | undefined
    ) => {
        if (!lineageElderRef) return;

        const getFullClanElder = (elderId: string): FullClanElderType | undefined => {
            for (const tribe of ugandaTribesData) {
                // If lineageElderTribeName is specified, search only within that tribe
                if (lineageElderTribeName && tribe.name !== lineageElderTribeName) continue;
                for (const clan of tribe.clans) {
                    const found = clan.elders?.find(e => e.id === elderId);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const primaryLineageElder = getFullClanElder(lineageElderRef.id);
        if (!primaryLineageElder) {
            console.warn(`[transform] Full details for lineage elder ID ${lineageElderRef.id} not found. Adding simple reference.`);
            const simpleElderId = addPerson(null, { name: lineageElderRef.name, notes: `Era: ${lineageElderRef.approximateEra}. Clan lineage connection point.` }, "Clan Ancestor", attachmentPointGen - 1, true, lineageSide, lineageElderRef.id);
            if (simpleElderId) {
                const userAncestor = members.find(m => m.id === attachmentPointFmId);
                if (userAncestor) userAncestor.parentId = simpleElderId;
            }
            return;
        }

        const historicalChain: FullClanElderType[] = [];
        let currentElderToTrace: FullClanElderType | undefined = primaryLineageElder;
        const taProcessedIds: Record<string, string> = {}; // TA_original_id -> TA_FamilyMember_id

        // Trace up to 2 ancestors + Tribal Ancestor
        for (let i = 0; i < 3 && currentElderToTrace; i++) {
            historicalChain.unshift(currentElderToTrace); // Add to beginning to process top-down
            if (currentElderToTrace.parentId) {
                if (currentElderToTrace.parentId.startsWith("TA_")) {
                    const taId = currentElderToTrace.parentId;
                    if (!taProcessedIds[taId]) { // Ensure TA node is added only once per transformation call
                        const tribeForTA = ugandaTribesData.find(t => t.clans.some(c => c.elders?.some(e => e.parentId === taId))) || ugandaTribesData.find(t=>t.id === taId.substring(3));
                        const taName = tribeForTA ? `Progenitor of ${tribeForTA.name}` : "Tribal Progenitor";
                        const taFmId = addPerson(null, { name: taName }, "Tribal Progenitor", attachmentPointGen - historicalChain.length -1 , true, undefined, taId);
                        if (taFmId) taProcessedIds[taId] = taFmId;
                    }
                    // Add a stub for TA at the beginning of the chain if not already there via parentId
                     if (!historicalChain.find(e => e.id === taId)) {
                        historicalChain.unshift({
                            id: taId, name: taProcessedIds[taId] ? members.find(m=>m.id === taProcessedIds[taId])?.name || "Tribal Progenitor" : "Tribal Progenitor",
                            approximateEra: "Ancient", verificationScore: 0, gender: 'male', parentId: undefined, // TA has no parent in this model
                            familyUnits:[]
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
        
        let previousHistoricalFmId: string | undefined = undefined;
        if (historicalChain.length > 0 && historicalChain[0].id.startsWith("TA_")) {
            const taStub = historicalChain[0];
            previousHistoricalFmId = taProcessedIds[taStub.id]; 
            // If TA wasn't pre-added (e.g. if PLE was child of TA), ensure it's added now.
            if (!previousHistoricalFmId) {
                 const tribeForTA = ugandaTribesData.find(t => t.id === taStub.id.substring(3));
                 const taName = tribeForTA ? `Progenitor of ${tribeForTA.name}` : "Tribal Progenitor";
                 const taFmId = addPerson(null, { name: taName }, "Tribal Progenitor", attachmentPointGen - historicalChain.length, true, undefined, taStub.id);
                 if (taFmId) {
                    taProcessedIds[taStub.id] = taFmId;
                    previousHistoricalFmId = taFmId;
                 }
            }
        }


        // Add historical elders from top-down
        for (const elder of historicalChain) {
            if (elder.id.startsWith("TA_")) { // Already processed or placeholder handled
                previousHistoricalFmId = taProcessedIds[elder.id]; // Ensure this is the FM ID
                continue;
            }

            const gen = attachmentPointGen - (historicalChain.length - historicalChain.indexOf(elder));
            const fmId = addPerson(
                null,
                { name: elder.name, birthYear: elder.birthYear?.toString(), deathYear: elder.deathYear?.toString(), gender: elder.gender, notes: elder.significance || elder.notes },
                "Clan Ancestor", gen, true, lineageSide, elder.id
            );

            if (fmId) {
                const memberInArray = members.find(m => m.id === fmId);
                if (memberInArray) {
                    if (previousHistoricalFmId && memberInArray.id !== previousHistoricalFmId) { // Don't self-parent
                        memberInArray.parentId = previousHistoricalFmId;
                    } else if (elder.parentId && elder.parentId.startsWith("TA_") && taProcessedIds[elder.parentId]) {
                         memberInArray.parentId = taProcessedIds[elder.parentId];
                    }
                }
                previousHistoricalFmId = fmId;
            } else {
                previousHistoricalFmId = undefined; break; 
            }
        }

        // Link the "bottom" of this historical chain (Primary Lineage Elder) to the user's lineage
        if (previousHistoricalFmId && attachmentPointFmId) { // previousHistoricalFmId is now the ID of the PLE
            const attachmentMember = members.find(m => m.id === attachmentPointFmId);
            if (attachmentMember && attachmentMember.id !== previousHistoricalFmId) { // Don't self-parent
                attachmentMember.parentId = previousHistoricalFmId;
                console.log(`[transform] Linked ${attachmentMember.name} (gen ${attachmentMember.generation}) to historical elder ${members.find(m=>m.id===previousHistoricalFmId)?.name} (ID: ${previousHistoricalFmId})`);
            }
        }
    };

    // --- Integrate Paternal Lineage Elder ---
    if (extendedFamily.paternalLineageElderRef && highestPaternalAncestorFmId) {
        console.log("[transform] Processing Paternal Lineage Elder:", extendedFamily.paternalLineageElderRef.name);
        addHistoricalLineageBranch(
            extendedFamily.paternalLineageElderRef,
            extendedFamily.paternalLineageElderTribe,
            highestPaternalAncestorFmId,
            highestPaternalAncestorGen,
            "paternal",
            members,
            addPerson
        );
    }

    // --- Integrate Maternal Lineage Elder ---
    if (extendedFamily.maternalLineageElderRef && highestMaternalAncestorFmId) {
        console.log("[transform] Processing Maternal Lineage Elder:", extendedFamily.maternalLineageElderRef.name);
        addHistoricalLineageBranch(
            extendedFamily.maternalLineageElderRef,
            extendedFamily.maternalLineageElderTribe,
            highestMaternalAncestorFmId, // Link to mother or MGF
            highestMaternalAncestorGen,
            "maternal",
            members,
            addPerson
        );
    }
    
    // --- Final Linking Pass for main lineage (Parents, Spouses) ---
    members.forEach(member => {
        if (member.relationship && (member.relationship.includes("Clan Ancestor") || member.relationship.includes("Tribal Progenitor"))) {
            return; // Already handled
        }

        const memberOriginalRoleKey = Object.keys(idMap).find(key => idMap[key] === member.id);
        
        // Set parentId for main person based on available parents in idMap
        if (member.id === mainPersonGeneratedId) { 
            if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
            else if (idMap[motherRKey]) member.parentId = idMap[motherRKey]; // If no father, mother is parent
        } 
        // Set parentId for Father and Mother from their parents in idMap
        else if (member.id === idMap[fatherRKey] && idMap[pgfRKey]) { 
            member.parentId = idMap[pgfRKey];
        } else if (member.id === idMap[motherRKey] && idMap[mgfRKey]) { 
            member.parentId = idMap[mgfRKey];
        } 
        // Set parentId for Siblings
        else if (memberOriginalRoleKey?.startsWith("form_sibling_")) { 
            if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
            else if (idMap[motherRKey] && !idMap[fatherRKey]) member.parentId = idMap[motherRKey];
        } 
        // Set parentId for Children
        else if (memberOriginalRoleKey?.startsWith("form_child_")) { 
            if (mainPersonGeneratedId) member.parentId = mainPersonGeneratedId;
        }

        // Spouse Linking for main lineage
        if (memberOriginalRoleKey) {
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


// --- Rest of the Home component (useEffect, handlers, JSX) ---
// This part remains the same as your previously provided version.
// For brevity, I'm not re-pasting the entire Home component JSX here,
// but ensure you integrate the updated transformTreeFormDataToMembers function above
// into your existing Home.tsx file.

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
