
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import { TreeFormData, FamilyTree } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);

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
          clan: formData.clan
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
        <section className="bg-gradient-to-b from-uganda-black to-uganda-black/90 text-white py-20 px-4 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Preserve Your <span className="text-uganda-yellow">Ugandan</span> Family <span className="text-uganda-red">Heritage</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-gray-100">
              Connect with your roots through clan and tribal relationships, and create a lasting digital legacy for future generations.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Button 
                    size="lg" 
                    className="bg-uganda-red text-white hover:bg-uganda-red/90"
                    onClick={handleSignup}
                  >
                    Sign Up Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white text-uganda-black border-white hover:bg-white/90 hover:text-uganda-black"
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                    asChild
                  >
                    <Link to="/family-trees">View My Family Trees</Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white text-uganda-black border-white hover:bg-white/90"
                    asChild
                  >
                    <Link to="/relationship-analyzer">Try Relationship Analyzer</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Family Tree Generator Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-uganda-black">
                Create Your Family <span className="text-uganda-red">Legacy</span>
              </h2>
              <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
                Generate your family tree based on Ugandan clan and tribal structures, preserving your heritage for future generations.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
              <div className="w-full md:w-1/3">
                <FamilyTreeForm onSubmit={generateFamilyTree} isLoading={isLoading} />
              </div>
              
              <div className="w-full md:w-2/3">
                {familyTree ? (
                  <FamilyTreeDisplay tree={familyTree} />
                ) : (
                  <div className="bg-white bg-opacity-80 rounded-lg p-6 text-center border-2 border-uganda-black shadow-lg">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold mb-2 text-uganda-black">Your Family Tree</h2>
                      <p className="text-gray-600">
                        Fill out the form with your family's details to generate your clan-based family tree.
                      </p>
                    </div>
                    {!user && (
                      <p className="text-sm text-gray-500 mt-4">
                        <button 
                          onClick={handleLogin}
                          className="text-uganda-red hover:underline"
                        >
                          Login
                        </button>
                        {" or "}
                        <button 
                          onClick={handleSignup}
                          className="text-uganda-red hover:underline"
                        >
                          Sign up
                        </button>
                        {" to save your family tree"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - UPDATED STYLING */}
        <section className="py-16 px-4 bg-uganda-black text-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
              <div className="h-1 w-20 bg-uganda-red mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* First Feature Box - updated to yellow background with black text */}
              <div className="bg-uganda-yellow p-6 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-uganda-black/20 flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-uganda-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center text-uganda-black">Clan-Based Family Trees</h3>
                <p className="text-center text-uganda-black">
                  Generate family trees that respect the traditional clan and tribal structures of Ugandan heritage.
                </p>
              </div>
              
              {/* Second Feature Box - updated to yellow background with black text */}
              <div className="bg-uganda-yellow p-6 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-uganda-black/20 flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-uganda-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center text-uganda-black">Elder Verification</h3>
                <p className="text-center text-uganda-black">
                  Connect your family history to verified clan elders, ensuring accuracy and cultural authenticity.
                </p>
              </div>
              
              {/* Third Feature Box - updated to yellow background with black text */}
              <div className="bg-uganda-yellow p-6 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-uganda-black/20 flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-uganda-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center text-uganda-black">Relationship Analyzer</h3>
                <p className="text-center text-uganda-black">
                  Discover how individuals are connected through clan lineages and common elders in Ugandan tradition.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              {/* Updated Get Started Now button to yellow background with black text */}
              <Button asChild size="lg" className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                <Link to={user ? "/family-trees" : "#"} onClick={!user ? handleSignup : undefined}>
                  Get Started Now
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Ugandan Tribes Overview */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-uganda-black">
                Explore Ugandan <span className="text-uganda-red">Tribes & Clans</span>
              </h2>
              <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
                Discover the rich cultural tapestry of Uganda's tribal heritage that forms the foundation of family identities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="overflow-hidden">
                <div className="h-48 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb')] bg-cover bg-center"></div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Baganda</h3>
                  <p className="text-gray-600 mb-4">
                    The largest ethnic group in Uganda, organized into 52 clans each with unique totems and traditions.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/tribes">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="h-48 bg-[url('https://images.unsplash.com/photo-1501854140801-50d01698950b')] bg-cover bg-center"></div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Banyankole</h3>
                  <p className="text-gray-600 mb-4">
                    A Bantu ethnic group from southwestern Uganda with rich cattle-herding traditions and unique clan structures.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/tribes">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="h-48 bg-[url('https://images.unsplash.com/photo-1649972904349-6e44c42644a7')] bg-cover bg-center"></div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Basoga</h3>
                  <p className="text-gray-600 mb-4">
                    The second-largest ethnic group in Uganda with unique cultural practices and clan-based social organization.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/tribes">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 text-center">
              <Button asChild>
                <Link to="/tribes">Explore All Tribes</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 bg-uganda-yellow/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-uganda-black">How FamiRoots Works</h2>
              <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
                Our platform uses AI technology to preserve and explore Ugandan family heritage in three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">Enter Family Information</h3>
                <p className="text-gray-600 text-center">
                  Provide your surname, tribe, and clan information to establish your heritage foundation.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">AI-Powered Generation</h3>
                <p className="text-gray-600 text-center">
                  Our AI analyzes Ugandan tribal and clan structures to build a culturally accurate family tree.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">Preserve Your Heritage</h3>
                <p className="text-gray-600 text-center">
                  Save, share, and explore your family connections through generations of Ugandan history.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-uganda-black text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-uganda-black"></div>
            <div className="w-4 h-4 bg-uganda-yellow"></div>
            <div className="w-4 h-4 bg-uganda-red"></div>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} FamiRoots - Preserving Ugandan Family Heritage
          </p>
        </div>
      </footer>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} defaultUsers={true} />
      )}
    </div>
  );
};

export default Home;
