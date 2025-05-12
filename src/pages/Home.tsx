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
    MemberInputData,
    // ParentsInputData and GrandparentsInputData are implicitly part of ExtendedFamilyInputData
} from "@/types"; // Ensure these types are correctly defined in @/types
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dna, Users, FileText, Search, Eye, Save, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to generate unique string IDs client-side
const generateClientMemberId = (roleHint: string, nameHint?: string, index?: number): string => {
  const safeRole = roleHint.toLowerCase().replace(/[^a-z0-9_]/gi, '_');
  const safeName = (nameHint && nameHint.trim()) 
    ? nameHint.trim().toLowerCase().replace(/[^a-z0-9_]/gi, '').substring(0,10) 
    : 'person';
  const randomSuffix = Date.now().toString(36).slice(-4) + Math.random().toString(36).substring(2, 7);
  return `${safeRole}_${safeName}_${index !== undefined ? String(index) : ''}${randomSuffix}`.substring(0, 60); // Max length for ID
};

// Client-side transformation function
const transformTreeFormDataToMembers = (
    extendedFamily: ExtendedFamilyInputData,
    mainPersonSurname: string 
): { members: FamilyMember[], idMap: Record<string, string> } => { // idMap maps temp role keys to final IDs
    
    const members: FamilyMember[] = [];
    const idMap: Record<string, string> = {}; 

    const addPerson = (
        roleKey: string, 
        inputData: MemberInputData | ExtendedFamilyInputData | undefined,
        relationshipToProband: string, 
        generation: number, 
        isElderFlag?: boolean,
        familySide?: 'paternal' | 'maternal'
    ): string | undefined => { 
        
        const personName = (roleKey === "mainPerson" 
            ? (inputData as ExtendedFamilyInputData)?.familyName 
            : (inputData as MemberInputData)?.name)?.trim();

        if (!personName) {
            // Skip optional relatives if completely empty
            const isOptionalAndEmpty = (roleKey.includes("grandparent") || roleKey === "spouse" || roleKey.includes("sibling") || roleKey.includes("child")) &&
                                     !(inputData?.birthYear || inputData?.deathYear || inputData?.gender || (inputData as MemberInputData)?.notes);
            if (isOptionalAndEmpty && !(roleKey === "mainPerson")) { // Main person name is critical
                console.warn(`Skipping completely empty and unnamed optional member for roleKey: ${roleKey}`);
                return undefined; 
            }
            if (roleKey === "mainPerson" && !personName) {
                 console.error("Main person's name (familyName) is missing but required for transformation.");
                 throw new Error("Main person's name (familyName) is required in the form.");
            }
            // If other critical roles are unnamed but have data, they will get "Unnamed [Relationship]"
        }

        const finalId = generateClientMemberId(roleKey, personName || roleKey, members.length);
        idMap[roleKey] = finalId;

        const member: FamilyMember = {
            id: finalId,
            name: personName || `Unnamed ${relationshipToProband}`,
            relationship: relationshipToProband,
            birthYear: inputData?.birthYear || undefined,
            deathYear: inputData?.deathYear || undefined,
            generation: generation,
            parentId: undefined, 
            isElder: isElderFlag || false,
            gender: inputData?.gender || undefined,
            side: familySide,
            status: inputData?.deathYear ? 'deceased' : 'living',
            notes: (inputData as MemberInputData)?.notes || (inputData as ExtendedFamilyInputData)?.notes || undefined,
            photoUrl: undefined,
        };
        members.push(member);
        return finalId;
    };

    // --- Create Members ---
    console.log("Transform: Starting with main person:", extendedFamily.familyName);
    const mainPersonId = addPerson("mainPerson", extendedFamily, "Self", 0, false);
    if (!mainPersonId) { 
      throw new Error("Main person (familyName in form) could not be processed.");
    }

    // Parents
    const fatherKey = "form_father"; const motherKey = "form_mother";
    let fatherId: string | undefined; let motherId: string | undefined;
    if (extendedFamily.parents) {
        if (extendedFamily.parents.father && (extendedFamily.parents.father.name || extendedFamily.parents.father.birthYear)) {
            fatherId = addPerson(fatherKey, extendedFamily.parents.father, "Father", -1, false, "paternal");
        }
        if (extendedFamily.parents.mother && (extendedFamily.parents.mother.name || extendedFamily.parents.mother.birthYear)) {
            motherId = addPerson(motherKey, extendedFamily.parents.mother, "Mother", -1, false, "maternal");
        }
    }
    
    // Grandparents
    const pgfKey = "form_pgf"; const pgmKey = "form_pgm";
    const mgfKey = "form_mgf"; const mgmKey = "form_mgm";
    let pgfId: string | undefined, pgmId: string | undefined, mgfId: string | undefined, mgmId: string | undefined;

    if (extendedFamily.grandparents?.paternal?.grandfather && (extendedFamily.grandparents.paternal.grandfather.name || extendedFamily.grandparents.paternal.grandfather.birthYear)) pgfId = addPerson(pgfKey, extendedFamily.grandparents.paternal.grandfather, "Paternal Grandfather", -2, false, "paternal");
    if (extendedFamily.grandparents?.paternal?.grandmother && (extendedFamily.grandparents.paternal.grandmother.name || extendedFamily.grandparents.paternal.grandmother.birthYear)) pgmId = addPerson(pgmKey, extendedFamily.grandparents.paternal.grandmother, "Paternal Grandmother", -2, false, "paternal");
    if (extendedFamily.grandparents?.maternal?.grandfather && (extendedFamily.grandparents.maternal.grandfather.name || extendedFamily.grandparents.maternal.grandfather.birthYear)) mgfId = addPerson(mgfKey, extendedFamily.grandparents.maternal.grandfather, "Maternal Grandfather", -2, false, "maternal");
    if (extendedFamily.grandparents?.maternal?.grandmother && (extendedFamily.grandparents.maternal.grandmother.name || extendedFamily.grandparents.maternal.grandmother.birthYear)) mgmId = addPerson(mgmKey, extendedFamily.grandparents.maternal.grandmother, "Maternal Grandmother", -2, false, "maternal");
    
    // Spouse
    if (extendedFamily.spouse && (extendedFamily.spouse.name || extendedFamily.spouse.birthYear)) {
        addPerson("form_spouse", extendedFamily.spouse, "Spouse", 0);
    }

    // Siblings
    (extendedFamily.siblings || []).forEach((sibling, index) => {
        if (sibling.name || sibling.birthYear) {
            addPerson(`form_sibling_${index}`, sibling, sibling.gender === 'male' ? 'Brother' : sibling.gender === 'female' ? 'Sister' : 'Sibling', 0);
        }
    });

    // Children
    (extendedFamily.children || []).forEach((child, index) => {
        if (child.name || child.birthYear) {
            addPerson(`form_child_${index}`, child, child.gender === 'male' ? 'Son' : child.gender === 'female' ? 'Daughter' : 'Child', 1);
        }
    });
    
    (extendedFamily.selectedElders || []).forEach((elder, index) => {
        if (elder.name) {
            const elderKey = `form_selectedElder_${elder.id || index}`;
            const notes = elder.approximateEra ? `Era: ${elder.approximateEra}` : (elder as any).notes;
            if (!members.some(m => m.name === elder.name && m.isElder)) { // Basic duplicate check
                 addPerson(elderKey, {name: elder.name, notes: notes} as MemberInputData, "Clan Elder", -3, true); 
            }
        }
    });

    // Second pass: Link ParentIDs using the generated IDs in idMap
    members.forEach(member => {
        const memberRoleKey = Object.keys(idMap).find(key => idMap[key] === member.id);

        if (memberRoleKey === "mainPerson") {
            if (idMap[fatherKey]) member.parentId = idMap[fatherKey];
            // else if (idMap[motherKey]) member.parentId = idMap[motherKey]; // For single parentId
        } else if (memberRoleKey === fatherKey) {
            if (idMap[pgfKey]) member.parentId = idMap[pgfKey];
        } else if (memberRoleKey === motherKey) {
            if (idMap[mgfKey]) member.parentId = idMap[mgfKey];
        } else if (memberRoleKey === pgmKey) {
             if (idMap[pgfKey]) member.parentId = idMap[pgfKey]; 
        } else if (memberRoleKey === mgmKey) {
             if (idMap[mgfKey]) member.parentId = idMap[mgfKey];
        } else if (memberRoleKey?.startsWith("form_sibling_")) {
            if (idMap[fatherKey]) member.parentId = idMap[fatherKey];
            else if (idMap[motherKey]) member.parentId = idMap[motherKey];
        } else if (memberRoleKey?.startsWith("form_child_")) {
            member.parentId = mainPersonId;
        }
    });
    
    console.log("Home.tsx: Client-side transformation complete. Final members generated:", members.length);
    // console.log("Detailed members:", JSON.stringify(members, null, 2));
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

  // THIS FUNCTION NOW BYPASSES THE EDGE FUNCTION AND DOES CLIENT-SIDE TRANSFORMATION
  const generateFamilyTree = async (formData: TreeFormData) => {
    if (!user) { 
      toast.error("Authentication required. Please log in to create a family tree.");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);
    setFamilyTreeForPreview(null);

    toast.promise(
      async () => {
        try {
          console.log("Home.tsx: Starting DIRECT client-side processing of TreeFormData:", JSON.stringify(formData, null, 2).substring(0, 500) + "...");

          // Step 1: Client-side transformation (BYPASSING EDGE FUNCTION)
          const { members } = transformTreeFormDataToMembers(formData.extendedFamily, formData.surname);

          if (members.length === 0 && formData.extendedFamily.familyName) {
             console.warn("Home.tsx: Client-side transformation resulted in zero members, although main person name was provided. Check transformation logic or form data.");
             // Allow creating tree metadata even if no other members, but warn.
             toast.warning("Tree will be created, but no additional family members were processed from the form details. Please review your input or the transformation logic.");
          } else if (members.length > 0) {
             console.log(`Home.tsx: Client-side transformation resulted in ${members.length} members.`);
             toast.info("Data transformed locally. Now saving to database...");
          } else {
             // This case means even main person was not created, should be caught by error in transform function
             throw new Error("Failed to process any members from the form data.");
          }

          // Step 2: Save the FamilyTree metadata to Supabase
          const treeId = crypto.randomUUID();
          const createdAt = new Date().toISOString();

          const { data: savedTreeData, error: treeError } = await supabase
            .from('family_trees')
            .insert({
              id: treeId, 
              user_id: user.id,
              surname: formData.surname,
              tribe: formData.tribe,
              clan: formData.clan,
              created_at: createdAt,
            })
            .select()
            .single();

          if (treeError) {
            console.error("Home.tsx: Supabase tree insert error:", treeError);
            throw treeError;
          }
          if (!savedTreeData) throw new Error("Failed to save family tree metadata.");
          console.log("Home.tsx: Family tree metadata saved:", savedTreeData);

          // Step 3: Save the FamilyMember records to Supabase
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
              status: member.status, 
              photo_url: member.photoUrl || null, 
              notes: member.notes || null,
              family_tree_id: savedTreeData.id, 
              user_id: user.id,
            }));

            console.log("Home.tsx: Attempting to insert members into DB (first 2):", JSON.stringify(membersToInsert.slice(0,2), null, 2));

            const { error: membersError } = await supabase
              .from('family_members')
              .insert(membersToInsert);

            if (membersError) {
              console.error("Home.tsx: Supabase members insert error:", membersError);
              await supabase.from('family_trees').delete().eq('id', savedTreeData.id);
              throw membersError;
            }
            console.log(`Home.tsx: ${membersToInsert.length} family members saved.`);
          } else {
            console.warn("Home.tsx: No members to save to the members table (members array was empty after transformation).");
          }

          const completeNewTreeForPreview: FamilyTree = {
            id: savedTreeData.id, userId: user.id, surname: savedTreeData.surname,
            tribe: savedTreeData.tribe, clan: savedTreeData.clan,
            createdAt: savedTreeData.created_at, 
            members: members || [], 
          };
          setFamilyTreeForPreview(completeNewTreeForPreview);
          return completeNewTreeForPreview;
        } catch(error) {
            console.error("Error during createAndSaveTreeFromFormData's async process:", error);
            if (error instanceof Error) throw error;
            throw new Error(String(error || "An unknown error occurred during tree creation."));
        } 
      },
      { 
        loading: "Processing and saving your family tree...",
        success: (newTreeObject) => {
          setIsLoading(false);
          if (newTreeObject && newTreeObject.surname) { 
            return `Family tree "${newTreeObject.surname}" created and saved! Preview below.`;
          }
          return "Operation successful! Preview below."; 
        },
        error: (err: any) => {
          setIsLoading(false);
          const message = err?.details || err?.message || "Unknown error during tree creation process.";
          return `Operation failed: ${message}`;
        },
      }
    );
  };

  const handleNavigateToTrees = () => {
    navigate('/family-trees');
  };

  // --- ALL YOUR ORIGINAL JSX SECTIONS FOR THE HOME PAGE ---
  // (I'm pasting your exact JSX structure back in here)
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main className="flex-grow">
        {/* Hero Section - As you provided */}
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
                {/* THIS NOW CALLS THE CLIENT-SIDE FUNCTION */}
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
                        <FamilyTreeDisplay 
                          tree={familyTreeForPreview} 
                          zoomLevel={1} 
                        />
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
