// src/pages/Home.tsx

import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay"; // YOUR LATEST VERSION
import Footer from "@/components/Footer";
import { 
    TreeFormData, 
    FamilyTree, 
    FamilyMember,
    ExtendedFamilyInputData, 
    MemberInputData 
} from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dna, Users, FileText, Search, Eye, Save, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to generate unique STRING UUIDs client-side
const generateClientMemberId = (): string => {
  return crypto.randomUUID(); 
};

// Client-side transformation function
const transformTreeFormDataToMembers = (
    extendedFamily: ExtendedFamilyInputData,
    _mainPersonSurname: string 
): { members: FamilyMember[], idMap: Record<string, string> } => {
    
    console.log("[transformTreeFormDataToMembers] Starting transformation for main person:", extendedFamily.familyName);
    const members: FamilyMember[] = [];
    const idMap: Record<string, string> = {}; // Maps conceptual roleKey to the actual generated UUID

    // !!! DEFINE ROLE KEYS HERE, AT THE TOP OF THE FUNCTION SCOPE !!!
    const mainPersonRKey = "mainPerson";
    const fatherRKey = "form_father"; 
    const motherRKey = "form_mother";
    const pgfRKey = "form_paternalGrandfather"; 
    const pgmRKey = "form_paternalGrandmother";
    const mgfRKey = "form_maternalGrandfather"; 
    const mgmRKey = "form_maternalGrandmother"; 
    const spouseRKey = "form_spouse";
    // For siblings and children, dynamic keys like "form_sibling_0" will be used directly when populating idMap

    const addPerson = (
        roleKey: string, 
        inputData: MemberInputData | ExtendedFamilyInputData | undefined,
        relationshipToProband: string, 
        generation: number, 
        isElderFlag?: boolean,
        familySide?: 'paternal' | 'maternal'
    ): string | undefined => { 
        
        const personName = (roleKey === mainPersonRKey 
            ? (inputData as ExtendedFamilyInputData)?.familyName 
            : (inputData as MemberInputData)?.name)?.trim();

        if (!personName) {
            const isTrulyOptionalAndEmpty = 
                (roleKey.includes("grandparent") || roleKey === spouseRKey || roleKey.includes("sibling") || roleKey.includes("child")) &&
                !(inputData?.birthYear || inputData?.deathYear || inputData?.gender || (inputData as MemberInputData)?.notes);
            
            if (isTrulyOptionalAndEmpty && roleKey !== mainPersonRKey) {
                console.warn(`[transform] Skipping empty optional member: ${roleKey}`);
                return undefined; 
            }
            if (roleKey === mainPersonRKey) {
                 console.error("[transform] Main person's name (familyName) is missing but required.");
                 throw new Error("Main person's name (familyName) is required in the form.");
            }
            console.warn(`[transform] Name missing for ${roleKey}. Using placeholder 'Unnamed ${relationshipToProband}'.`);
        }

        const finalId = generateClientMemberId(); 
        idMap[roleKey] = finalId; // Map the conceptual roleKey to this actual UUID

        const memberNotes = (inputData as MemberInputData)?.notes || (inputData as ExtendedFamilyInputData)?.notes || undefined;

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
            gender: inputData?.gender || undefined,
            side: familySide,
            status: inputData?.deathYear ? 'deceased' : 'living',
            notes: memberNotes, 
            photoUrl: undefined, 
        };
        members.push(member);
        console.log(`[transform] Added: ${member.name} (ID: ${member.id}, RoleKey: ${roleKey}, Gen: ${member.generation})`);
        return finalId;
    };

    // --- Create Members (First Pass) ---
    const mainPersonGeneratedId = addPerson(mainPersonRKey, extendedFamily, "Self", 0, false);
    if (!mainPersonGeneratedId) throw new Error("Main person processing failed.");

    let fatherGeneratedId: string | undefined; 
    let motherGeneratedId: string | undefined;
    if (extendedFamily.parents) {
        if (extendedFamily.parents.father && (extendedFamily.parents.father.name?.trim() || extendedFamily.parents.father.birthYear)) fatherGeneratedId = addPerson(fatherRKey, extendedFamily.parents.father, "Father", -1, false, "paternal");
        if (extendedFamily.parents.mother && (extendedFamily.parents.mother.name?.trim() || extendedFamily.parents.mother.birthYear)) motherGeneratedId = addPerson(motherRKey, extendedFamily.parents.mother, "Mother", -1, false, "maternal");
    }
    
    let pgfGeneratedId: string | undefined, pgmGeneratedId: string | undefined, mgfGeneratedId: string | undefined, mgmGeneratedId: string | undefined;
    if (extendedFamily.grandparents?.paternal?.grandfather && (extendedFamily.grandparents.paternal.grandfather.name?.trim() || extendedFamily.grandparents.paternal.grandfather.birthYear)) pgfGeneratedId = addPerson(pgfRKey, extendedFamily.grandparents.paternal.grandfather, "Paternal Grandfather", -2, false, "paternal");
    if (extendedFamily.grandparents?.paternal?.grandmother && (extendedFamily.grandparents.paternal.grandmother.name?.trim() || extendedFamily.grandparents.paternal.grandmother.birthYear)) pgmGeneratedId = addPerson(pgmRKey, extendedFamily.grandparents.paternal.grandmother, "Paternal Grandmother", -2, false, "paternal");
    if (extendedFamily.grandparents?.maternal?.grandfather && (extendedFamily.grandparents.maternal.grandfather.name?.trim() || extendedFamily.grandparents.maternal.grandfather.birthYear)) mgfGeneratedId = addPerson(mgfRKey, extendedFamily.grandparents.maternal.grandfather, "Maternal Grandfather", -2, false, "maternal");
    if (extendedFamily.grandparents?.maternal?.grandmother && (extendedFamily.grandparents.maternal.grandmother.name?.trim() || extendedFamily.grandparents.maternal.grandmother.birthYear)) mgmGeneratedId = addPerson(mgmRKey, extendedFamily.grandparents.maternal.grandmother, "Maternal Grandmother", -2, false, "maternal");
    
    let spouseGeneratedId: string | undefined;
    if (extendedFamily.spouse && (extendedFamily.spouse.name?.trim() || extendedFamily.spouse.birthYear)) {
        spouseGeneratedId = addPerson(spouseRKey, extendedFamily.spouse, "Spouse", 0);
    }

    (extendedFamily.siblings || []).forEach((s, i) => { 
        if (s.name?.trim() || s.birthYear) {
            const siblingRoleKey = `form_sibling_${i}`;
            addPerson(siblingRoleKey, s, s.gender === 'male' ? 'Brother' : s.gender === 'female' ? 'Sister' : 'Sibling', 0);
        }
    });
    (extendedFamily.children || []).forEach((c, i) => { 
        if (c.name?.trim() || c.birthYear) {
            const childRoleKey = `form_child_${i}`;
            addPerson(childRoleKey, c, c.gender === 'male' ? 'Son' : c.gender === 'female' ? 'Daughter' : 'Child', 1);
        }
    });
    (extendedFamily.selectedElders || []).forEach((e, i) => {
        if (e.name) {
            const elderRoleKey = e.id ? `form_selectedElder_${e.id}` : `form_selectedElder_${i}`;
            const notesContent = e.approximateEra ? `Era: ${e.approximateEra}` : (e as any).notes;
            if (!members.some(m => m.name === e.name && m.isElder)) {
                 addPerson(elderRoleKey, {name: e.name, notes: notesContent} as MemberInputData, "Clan Elder", -3, true); 
            }
        }
    });

    // --- Second pass: Link ParentIDs AND SpouseIDs using the actual generated IDs from idMap ---
    members.forEach(member => {
        // Find the original roleKey that corresponds to this member's actual generated ID
        const memberOriginalRoleKey = Object.keys(idMap).find(key => idMap[key] === member.id); 
        if (!memberOriginalRoleKey) return;

        // Parent Linking
        if (memberOriginalRoleKey === mainPersonRKey) { 
            if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey]; // Use fatherRKey (which is in scope)
            else if (idMap[motherRKey] && !idMap[fatherRKey]) member.parentId = idMap[motherRKey]; 
        } else if (memberOriginalRoleKey === fatherRKey) { 
            if (idMap[pgfRKey]) member.parentId = idMap[pgfRKey];
        } else if (memberOriginalRoleKey === motherRKey) { 
            if (idMap[mgfRKey]) member.parentId = idMap[mgfRKey];
        } 
        else if (memberOriginalRoleKey === pgmRKey) { /* PGM's parent would be PGF's parent, not PGF */ } 
        else if (memberOriginalRoleKey === mgmRKey) { /* MGM's parent would be MGF's parent, not MGF */ } 
        else if (memberOriginalRoleKey.startsWith("form_sibling_")) { 
            if (idMap[fatherRKey]) member.parentId = idMap[fatherRKey];
            else if (idMap[motherRKey]) member.parentId = idMap[motherRKey];
        } else if (memberOriginalRoleKey.startsWith("form_child_")) { 
            if (mainPersonGeneratedId) member.parentId = mainPersonGeneratedId;
        }

        // Spouse Linking (Reciprocal)
        if (memberOriginalRoleKey === mainPersonRKey && idMap[spouseRKey]) member.spouseId = idMap[spouseRKey];
        else if (memberOriginalRoleKey === spouseRKey && mainPersonGeneratedId) member.spouseId = mainPersonGeneratedId;
        else if (memberOriginalRoleKey === fatherRKey && idMap[motherRKey]) member.spouseId = idMap[motherRKey];
        else if (memberOriginalRoleKey === motherRKey && idMap[fatherRKey]) member.spouseId = idMap[fatherRKey];
        else if (memberOriginalRoleKey === pgfRKey && idMap[pgmRKey]) member.spouseId = idMap[pgmRKey];
        else if (memberOriginalRoleKey === pgmRKey && idMap[pgfRKey]) member.spouseId = idMap[pgfRKey];
        else if (memberOriginalRoleKey === mgfRKey && idMap[mgmRKey]) member.spouseId = idMap[mgmRKey];
        else if (memberOriginalRoleKey === mgmRKey && idMap[mgfRKey]) member.spouseId = idMap[mgfRKey];
    });
    
    console.log("Home.tsx: Client-side transformation complete. Final members generated:", members.length);
    if (members.length > 0) console.log("Home.tsx: First processed member for saving (client-side object with UUID):", JSON.stringify(members[0], null, 2));
    return { members, idMap };
};


const Home = () => {
  const { user, session } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTreeForPreview, setFamilyTreeForPreview] = useState<FamilyTree | null>(null);
  const [previewZoomLevel, setPreviewZoomLevel] = useState<number>(0.6);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && familyTreeForPreview) {
      setFamilyTreeForPreview(null);
    }
  }, [user, familyTreeForPreview]);

  const handleLogin = () => setShowAuth(true);
  const handleSignup = () => setShowAuth(true);

  // This function is called by FamilyTreeForm onSubmit
  const createAndSaveTreeFromFormData = async (formData: TreeFormData) => {
    if (!user) { 
      toast.error("Authentication required. Please log in.");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);
    setFamilyTreeForPreview(null);
    console.log("Home.tsx: BYPASSING EDGE FUNCTION. Starting DIRECT client-side processing and saving.");

    toast.promise(
      async () => {
        try {
          console.log("Home.tsx: Processing TreeFormData directly on client (formData surname):", formData.surname);

          const { members } = transformTreeFormDataToMembers(formData.extendedFamily, formData.surname);

          if (members.length === 0 && formData.extendedFamily.familyName) {
             console.warn("Home.tsx: Client-side transformation resulted in zero members.");
             toast.warning("Tree metadata will be created. Ensure form details are filled for members.");
          } else if (members.length > 0) {
             console.log(`Home.tsx: Client-side transformation resulted in ${members.length} members.`);
             toast.info("Data transformed locally. Saving to database...");
          } else if (!formData.extendedFamily.familyName) {
             throw new Error("Main person's name is missing from the form.");
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
              is_elder: member.isElder, 
              gender: member.gender || null, 
              side: member.side || null,
              status: member.status, // This field IS in your client FamilyMember type
                                     // BUT NOT in your DB schema for family_members. Omit for DB insert.
              // notes: member.notes || null, // Same for notes, omit if no DB column.
              family_tree_id: savedTreeData.id, 
            }));
            
            // Create a new array for insertion, omitting fields not in DB schema
            const dbSafeMembersToInsert = membersToInsert.map(({ status, notes, photoUrl, spouseId, childrenIds, ...rest }) => rest);


            console.log("Home.tsx: Data being sent to 'family_members' table (first 2 objects):", JSON.stringify(dbSafeMembersToInsert.slice(0,2), null, 2));
            const { error: membersError } = await supabase.from('family_members').insert(dbSafeMembersToInsert);
            if (membersError) {
              await supabase.from('family_trees').delete().eq('id', savedTreeData.id); 
              throw membersError; 
            }
            console.log(`Home.tsx: ${dbSafeMembersToInsert.length} family members saved.`);
          } else {
            console.warn("Home.tsx: No members to save (members array was empty after client-side transformation).");
          }

          const completeNewTreeForPreview: FamilyTree = {
            id: savedTreeData.id, userId: user.id, surname: savedTreeData.surname,
            tribe: savedTreeData.tribe, clan: savedTreeData.clan,
            createdAt: savedTreeData.created_at, members: members || [], 
          };
          setFamilyTreeForPreview(completeNewTreeForPreview);
          return completeNewTreeForPreview;
        } catch(error) {
            console.error("Home.tsx: Error within createAndSaveTreeFromFormData's async promise:", JSON.stringify(error, Object.getOwnPropertyNames(error))); 
            if (error instanceof Error) throw error; 
            throw new Error(String(error || "An unknown error occurred during tree creation."));
        } 
      },
      { 
        loading: "Processing and saving your family tree...",
        success: (newTreeObject) => {
          setIsLoading(false);
          return `Family tree "${newTreeObject?.surname || 'Unnamed'}" created and saved! Preview below.`;
        },
        error: (err: any) => {
          setIsLoading(false);
          console.error("Home.tsx: Toast caught error from promise (FULL OBJECT):", JSON.stringify(err, Object.getOwnPropertyNames(err))); 
          let displayMessage = "Unknown error during tree creation.";
          if (err && typeof err === 'object') {
            displayMessage = err.message || "Database operation failed.";
            if (err.details) displayMessage += ` Details: ${err.details}`;
            if (err.hint) displayMessage += ` Hint: ${err.hint}`;
            if (err.code) displayMessage += ` (Code: ${err.code})`;
          } else if (err) {
            displayMessage = String(err);
          }
          return `Operation failed: ${displayMessage}`;
        },
      }
    );
  };

  const handleNavigateToTrees = () => {
    navigate('/family-trees');
  };

  // --- YOUR FULL PAGE JSX STRUCTURE (AS PROVIDED BY YOU IN PREVIOUS MESSAGE) ---
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main className="flex-grow">
        {/* Hero Section - Your Exact JSX */}
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
                {/* Changed generateFamilyTree to createAndSaveTreeFromFormData */}
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
                    <div className="h-[60vh] min-h-[500px] overflow-auto p-2 bg-background relative"> 
                      <div style={{transform: `scale(${previewZoomLevel})`, transformOrigin: 'top left', width: 'fit-content', height: 'fit-content'}}>
                        {familyTreeForPreview.members && familyTreeForPreview.members.length > 0 ? (
                            <FamilyTreeDisplay 
                              tree={familyTreeForPreview} 
                              zoomLevel={1} 
                            />
                        ) : (
                            <div className="p-10 text-center text-muted-foreground flex items-center justify-center h-full">
                                Tree metadata created, but no members were processed from the form to display.
                            </div>
                        )}
                      </div>
                    </div>
                    <div className="p-2 border-t border-border flex justify-center gap-2 bg-muted/30">
                        <Button variant="outline" size="xs" onClick={() => setPreviewZoomLevel(z => Math.max(0.3, z - 0.1))} aria-label="Zoom Out Preview"><ZoomOut className="h-4 w-4"/></Button>
                        <Button variant="outline" size="xs" onClick={() => setPreviewZoomLevel(z => Math.min(1.5, z + 0.1))} aria-label="Zoom In Preview"><ZoomIn className="h-4 w-4"/></Button>
                         <Button variant="default" size="xs" className="bg-uganda-red text-white" onClick={handleNavigateToTrees}><Save className="mr-1.5 h-4 w-4"/> View My Saved Trees</Button>
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
