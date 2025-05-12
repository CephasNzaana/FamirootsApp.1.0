// src/pages/Home.tsx

import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay"; // Your LATEST persona-node version
import Footer from "@/components/Footer";
import { TreeFormData, FamilyTree, FamilyMember } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dna, Users, FileText, Search, Eye, Save, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // Renamed to match your original function that FamilyTreeForm calls
  const generateFamilyTree = async (formData: TreeFormData) => {
    if (!user || !session?.access_token) {
      toast.error("Authentication required. Please log in to create a family tree.");
      setShowAuth(true);
      return;
    }

    setIsLoading(true); // Set loading true before the promise
    setFamilyTreeForPreview(null);

    toast.promise(
      async () => {
        // This try/finally block is inside the function passed to toast.promise
        try {
          console.log("Home.tsx: Submitting TreeFormData to Edge Function:", JSON.stringify(formData, null, 2));

          const edgeFunctionResponse = await supabase.functions.invoke("generate-family-tree", {
            body: formData, // Send the entire TreeFormData object
          });

          if (edgeFunctionResponse.error) {
            console.error("Home.tsx: Edge Function invocation error:", edgeFunctionResponse.error);
            throw new Error(edgeFunctionResponse.error.message || "Failed to invoke AI generation service.");
          }
          
          console.log("Home.tsx: RAW data received from Edge Function:", JSON.stringify(edgeFunctionResponse.data, null, 2));

          const generatedData: {
            id: string; surname: string; tribe: string; clan: string;
            members: FamilyMember[]; source: 'ai' | 'fallback'; createdAt: string;
          } = edgeFunctionResponse.data;

          if (!generatedData || !generatedData.id || !generatedData.members || !Array.isArray(generatedData.members)) {
            console.error("Home.tsx: Malformed or incomplete response from Edge Function. `generatedData`:", generatedData);
            throw new Error("Received incomplete or malformed data from AI generation service. Check Edge Function logs and its response content.");
          }

          console.log(`Home.tsx: Data source from Edge Function: ${generatedData.source}`);
          if (generatedData.source === 'fallback') {
            toast.info("AI generation used fallback data. This will be saved.");
          } else {
            // Only show AI success if not fallback, because fallback already has a message.
            if (generatedData.members.length > 0) { // Check if AI actually produced members
                toast.success("Family tree structure processed by AI!");
            } else {
                toast.warning("AI processed the request but returned no family members. A tree entry will be created.");
            }
          }

          const { data: savedTreeData, error: treeError } = await supabase
            .from('family_trees')
            .insert({
              id: generatedData.id, 
              user_id: user.id,
              surname: generatedData.surname,
              tribe: generatedData.tribe,
              clan: generatedData.clan,
              created_at: generatedData.createdAt,
            })
            .select()
            .single();

          if (treeError) {
            console.error("Home.tsx: Supabase tree insert error:", treeError);
            throw treeError;
          }
          if (!savedTreeData) throw new Error("Failed to save family tree metadata.");
          console.log("Home.tsx: Family tree metadata saved:", savedTreeData);

          if (generatedData.members && generatedData.members.length > 0) {
            const membersToInsert = generatedData.members.map(member => ({
              id: member.id, name: member.name, relationship: member.relationship,
              birth_year: member.birthYear, death_year: member.deathYear,
              generation: member.generation, parent_id: member.parentId,
              is_elder: member.isElder, gender: member.gender, side: member.side,
              status: member.status, photo_url: member.photoUrl, notes: member.notes,
              family_tree_id: savedTreeData.id, 
              user_id: user.id,
            }));

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
            console.warn("Home.tsx: AI processed data but no members were returned/generated to save to the members table.");
          }

          const completeNewTreeForPreview: FamilyTree = {
            id: savedTreeData.id, userId: user.id, surname: savedTreeData.surname,
            tribe: savedTreeData.tribe, clan: savedTreeData.clan,
            createdAt: savedTreeData.created_at, members: generatedData.members || [],
          };
          setFamilyTreeForPreview(completeNewTreeForPreview);
          return completeNewTreeForPreview;
        } finally {
          setIsLoading(false); // Moved isLoading set into the async function's finally
        }
      },
      { 
        loading: "Generating and saving your family tree...",
        success: (newTreeObject) => {
          if (newTreeObject && newTreeObject.surname) { // Check if newTreeObject is valid
            return `Family tree "${newTreeObject.surname}" created! Preview below.`;
          }
          return "Operation successful! Preview below."; // Fallback success message
        },
        error: (err: any) => {
          // setIsLoading(false); // Already handled in the async function's finally block by toast.promise v1.x
          const message = err?.details || err?.message || "Unknown error during tree creation process.";
          return `Operation failed: ${message}`;
        },
      }
    );
    // The .finally(() => setIsLoading(false)) was removed from here.
  };

  const handleNavigateToTrees = () => {
    navigate('/family-trees');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main className="flex-grow">
        {/* Hero Section - YOUR EXISTING JSX */}
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
                    {/* Decorative elements from your code */}
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(-45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(-45deg)' }}></div>
                    <div className="absolute top-1/4 right-1/4 bg-white/10 p-2 rounded-lg border border-white/20">
                      <p className="text-sm font-medium">Grandparents</p>
                    </div>
                    <div className="absolute bottom-1/4 right-1/4 bg-white/10 p-2 rounded-lg border border-white/20">
                      <p className="text-sm font-medium">Parents</p>
                    </div>
                    <div className="absolute top-1/4 left-1/4 bg-white/10 p-2 rounded-lg border border-white/20">
                      <p className="text-sm font-medium">Clan Elders</p>
                    </div>
                    <div className="absolute bottom-1/4 left-1/4 bg-white/10 p-2 rounded-lg border border-white/20">
                      <p className="text-sm font-medium">Children</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section - YOUR EXISTING JSX */}
        <section className="py-16 px-4 bg-card">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Discover Your Heritage with FamiRoots
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our powerful tools help you build, explore, and share your Ugandan family heritage
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-uganda-black" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Family Tree Builder</h3>
                <p className="text-muted-foreground mb-4">
                  Create your family tree centered around Ugandan clan structures, with AI assistance to build connections accurately.
                </p>
                <Button 
                  className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full"
                  onClick={() => document.getElementById('start-your-tree')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Building
                </Button>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6">
                      <Dna className="h-8 w-8 text-uganda-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">DNA Testing</h3>
                  <p className="text-muted-foreground mb-4">
                      Discover your ethnic origins and connect with relatives through our advanced genetic testing services.
                  </p>
                  <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => navigate('/dna-test')}>
                      Explore DNA Testing
                  </Button>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6">
                      <Search className="h-8 w-8 text-uganda-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Relationship Analyzer</h3>
                  <p className="text-muted-foreground mb-4">
                      Find out how you're connected to other people through our powerful relationship detection tool.
                  </p>
                  <Button className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full" onClick={() => navigate('/relationship-analyzer')}>
                      Analyze Relationships
                  </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form and Result Section */}
        <section id="start-your-tree" className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Start Your Family Tree Journey
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enter your family information. Our AI will assist in structuring and generating your tree.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl border border-border">
                <FamilyTreeForm onSubmit={generateFamilyTree} isLoading={isLoading} />
              </div>
              
              <div className="sticky top-24 self-start"> 
                <h3 className="text-2xl font-semibold mb-4 text-foreground text-center">
                  {familyTreeForPreview ? "Generated Tree Preview" : "Your Tree Will Appear Here"}
                </h3>
                {isLoading && !familyTreeForPreview && (
                    <div className="bg-card rounded-lg p-6 border-2 border-dashed border-border shadow-lg min-h-[550px] flex flex-col justify-center items-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <Users className="h-16 w-16 text-uganda-yellow mb-4" />
                            <p className="text-muted-foreground">AI is building and saving your tree...</p>
                        </div>
                    </div>
                )}
                {!isLoading && familyTreeForPreview && (
                  <div className="bg-card rounded-lg shadow-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                        <p className="font-medium text-foreground text-sm">{familyTreeForPreview.surname} Family Tree</p>
                        <Button variant="outline" size="sm" onClick={handleNavigateToTrees} title="View all your saved trees">
                            <Eye className="mr-1.5 h-4 w-4"/> My Saved Trees
                        </Button>
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
                         <Button variant="default" size="xs" className="bg-uganda-red text-white" onClick={handleNavigateToTrees}>
                            <Save className="mr-1.5 h-4 w-4"/> View My Saved Trees
                        </Button>
                    </div>
                  </div>
                )}
                {!isLoading && !familyTreeForPreview && ( 
                  <div className="bg-card rounded-lg p-6 text-center border-2 border-dashed border-border shadow-lg min-h-[550px] flex flex-col justify-center items-center">
                    <div className="mb-4">
                        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow/20">
                            <FileText className="h-10 w-10 text-uganda-yellow" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Your Family Tree</h2>
                        <p className="text-muted-foreground mb-6">
                            Fill out the form to generate and save your clan-based family tree.
                        </p>
                    </div>
                    {!user && ( 
                        <div className="mt-6 p-4 bg-uganda-yellow/10 rounded-lg border border-uganda-yellow/30">
                            <p className="text-sm text-foreground">
                                <button onClick={handleLogin} className="text-uganda-red hover:underline font-medium">Login</button>
                                {" or "}
                                <button onClick={handleSignup} className="text-uganda-red hover:underline font-medium">Sign up</button>
                                {" to save your family tree."}
                            </p>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials/Cultural Section - YOUR EXISTING JSX */}
        <section className="py-16 px-4 bg-gradient-to-br from-uganda-black to-uganda-black/90 text-white">
           <div className="container mx-auto max-w-5xl text-center">
             <h2 className="text-3xl font-bold mb-8">Preserving Uganda's Rich Heritage</h2>
             <p className="text-xl mb-12 max-w-3xl mx-auto">
               FamiRoots helps preserve the cultural connections and family histories of Ugandan communities for generations to come.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-6 bg-white/10 rounded-lg">
                 <h3 className="text-xl font-bold mb-3 text-uganda-yellow">40+ Tribes</h3>
                 <p className="text-gray-300">
                   Comprehensive database of Uganda's diverse tribal heritage
                 </p>
               </div>
               <div className="p-6 bg-white/10 rounded-lg">
                 <h3 className="text-xl font-bold mb-3 text-uganda-yellow">200+ Clans</h3>
                 <p className="text-gray-300">
                   Detailed clan information with cultural context and historical significance
                 </p>
               </div>
               <div className="p-6 bg-white/10 rounded-lg">
                 <h3 className="text-xl font-bold mb-3 text-uganda-yellow">AI-Powered</h3>
                 <p className="text-gray-300">
                   Advanced technology that helps verify and connect family relationships
                 </p>
               </div>
             </div>
             <Button 
               className="mt-12 bg-uganda-yellow hover:bg-uganda-yellow/90 text-uganda-black font-semibold px-8 py-3 rounded-lg"
               onClick={() => navigate('/tribes')}
             >
               Explore Ugandan Tribes
             </Button>
           </div>
        </section>
      </main>
      <Footer />
      {showAuth && (<AuthForm onClose={() => setShowAuth(false)} />)}
    </div>
  );
};
export default Home;
