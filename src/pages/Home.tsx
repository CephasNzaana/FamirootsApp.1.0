
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import Footer from "@/components/Footer";
import { TreeFormData, FamilyTree } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dna, Users, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };

  const generateFamilyTree = async (formData: TreeFormData) => {
    if (!user) {
      toast.error("Please login to generate a family tree");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || "No active session found");
      }

      // Call our Supabase Edge Function to generate a family tree
      const { data, error } = await supabase.functions.invoke("generate-family-tree", {
        body: {
          surname: formData.surname,
          tribe: formData.tribe,
          clan: formData.clan,
          familyData: formData
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to generate family tree");
      }

      let members = data.members;
      const treeId = data.treeId;

      if (data.fallback) {
        toast.info("Using fallback family tree data. The AI response could not be processed.");
      }

      // Create family tree
      const newTree: FamilyTree = {
        id: treeId,
        userId: user.id,
        surname: formData.surname,
        tribe: formData.tribe,
        clan: formData.clan,
        createdAt: new Date().toISOString(),
        members,
      };

      setFamilyTree(newTree);
      toast.success("Family tree generated successfully!");
    } catch (error) {
      console.error("Error generating family tree:", error);
      toast.error("Failed to generate family tree. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

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
                    onClick={() => {
                      const formSection = document.getElementById('start-your-tree');
                      formSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Start Your Family Tree
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-lg"
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
                    {/* Some sample connection lines */}
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(50%) rotate(-45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(45deg)' }}></div>
                    <div className="absolute w-24 h-1 bg-white/20 top-1/2 left-1/2 -translate-y-1/2" style={{ transform: 'translateX(-120%) rotate(-45deg)' }}></div>
                    {/* Sample relatives */}
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
        
        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-uganda-black">
                Discover Your Heritage with FamiRoots
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our powerful tools help you build, explore, and share your Ugandan family heritage
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-uganda-black" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-uganda-black">Family Tree Builder</h3>
                <p className="text-gray-600 mb-4">
                  Create your family tree centered around Ugandan clan structures, with AI assistance to build connections accurately.
                </p>
                <Button 
                  className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full"
                  onClick={() => {
                    const formSection = document.getElementById('start-your-tree');
                    formSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Start Building
                </Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6">
                  <Dna className="h-8 w-8 text-uganda-black" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-uganda-black">DNA Testing</h3>
                <p className="text-gray-600 mb-4">
                  Discover your ethnic origins and connect with relatives through our advanced genetic testing services.
                </p>
                <Button 
                  className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full"
                  onClick={() => navigate('/dna-test')}
                >
                  Explore DNA Testing
                </Button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center mb-6">
                  <Search className="h-8 w-8 text-uganda-black" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-uganda-black">Relationship Analyzer</h3>
                <p className="text-gray-600 mb-4">
                  Find out how you're connected to other people through our powerful relationship detection tool.
                </p>
                <Button 
                  className="bg-uganda-red hover:bg-uganda-red/90 text-white w-full"
                  onClick={() => navigate('/relationship-analyzer')}
                >
                  Analyze Relationships
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Form and Result Section */}
        <section id="start-your-tree" className="py-16 px-4 bg-[#FAF6F1]">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-uganda-black">
                Start Your Family Tree Journey
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Enter your family information to generate your clan-based family tree
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex justify-center">
                <FamilyTreeForm onSubmit={generateFamilyTree} isLoading={isLoading} />
              </div>
              
              <div>
                {familyTree ? (
                  <FamilyTreeDisplay tree={familyTree} />
                ) : (
                  <div className="bg-white bg-opacity-80 rounded-lg p-6 text-center border-2 border-uganda-black shadow-lg h-full flex flex-col justify-center">
                    <div className="mb-4">
                      <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow">
                        <FileText className="h-10 w-10" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2 text-uganda-black">Your Family Tree</h2>
                      <p className="text-gray-600 mb-6">
                        Fill out the form with your family's details to generate your clan-based family tree.
                      </p>
                    </div>
                    {!user && (
                      <div className="mt-6 p-4 bg-uganda-yellow/20 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <button 
                            onClick={handleLogin}
                            className="text-uganda-red hover:underline font-medium"
                          >
                            Login
                          </button>
                          {" or "}
                          <button 
                            onClick={handleSignup}
                            className="text-uganda-red hover:underline font-medium"
                          >
                            Sign up
                          </button>
                          {" to save your family tree and access it later"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials/Cultural Section */}
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
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default Home;
