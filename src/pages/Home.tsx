
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import FamilyTreeRecommendations from "@/components/FamilyTreeRecommendations";
import { TreeFormData, FamilyTree } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Heart } from "lucide-react";
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

  const handleViewAllTrees = () => {
    navigate("/family-trees");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F0FB]">
      <Header
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <section className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#333]">
              Discover Your <span className="text-[#1EAEDB]">Family Legacy</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
              Connect with your roots and preserve your Ugandan heritage by exploring your family tree through clan and tribal connections.
            </p>
          </section>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 space-y-6">
              <FamilyTreeForm onSubmit={generateFamilyTree} isLoading={isLoading} />
              
              {familyTree && (
                <>
                  <FamilyTreeStats tree={familyTree} />
                  <FamilyTreeRecommendations />
                </>
              )}
              
              {!familyTree && (
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-gray-700">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB]/10"
                      onClick={handleViewAllTrees}
                    >
                      <Users className="h-4 w-4 mr-2" /> View All Family Trees
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB]/10"
                      onClick={() => navigate("/relationship-analyzer")}
                    >
                      <Search className="h-4 w-4 mr-2" /> Relationship Analyzer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB]/10"
                      onClick={() => navigate("/tribes")}
                    >
                      <Heart className="h-4 w-4 mr-2" /> Explore Tribes & Clans
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="w-full md:w-2/3">
              {familyTree ? (
                <FamilyTreeDisplay tree={familyTree} />
              ) : (
                <Card className="bg-white border border-gray-200 shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-[#F1F0FB] rounded-full flex items-center justify-center mb-6">
                    <Users size={32} className="text-[#1EAEDB]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-[#333]">Create Your Family Tree</h2>
                  <p className="text-gray-600 max-w-md mb-6">
                    Fill out the form with your family's details to generate your clan-based family tree. 
                    Preserve your heritage for generations to come.
                  </p>
                  {!user && (
                    <div className="mt-4 p-4 border border-[#1EAEDB]/20 rounded-md bg-[#1EAEDB]/5">
                      <p className="text-sm text-gray-600">
                        <button 
                          onClick={handleLogin}
                          className="text-[#1EAEDB] font-medium hover:underline"
                        >
                          Login
                        </button>
                        {" or "}
                        <button 
                          onClick={handleSignup}
                          className="text-[#1EAEDB] font-medium hover:underline"
                        >
                          Sign up
                        </button>
                        {" to save your family tree for future access"}
                      </p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center text-[#333]">How FamiRoots Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 text-center">
                  <div className="w-12 h-12 bg-[#1EAEDB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-lg text-[#1EAEDB]">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#333]">Enter Family Information</h3>
                  <p className="text-gray-600">
                    Provide your surname, tribe, and clan information to establish your heritage foundation
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 text-center">
                  <div className="w-12 h-12 bg-[#1EAEDB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-lg text-[#1EAEDB]">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#333]">AI-Powered Generation</h3>
                  <p className="text-gray-600">
                    Our AI analyzes Ugandan tribal and clan structures to build a culturally accurate family tree
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 text-center">
                  <div className="w-12 h-12 bg-[#1EAEDB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-lg text-[#1EAEDB]">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#333]">Preserve Your Heritage</h3>
                  <p className="text-gray-600">
                    Save, share, and explore your family connections through generations of Ugandan history
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-[#333] text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-[#333]"></div>
            <div className="w-4 h-4 bg-[#1EAEDB]"></div>
            <div className="w-4 h-4 bg-[#F1F0FB]"></div>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} FamiRoots - Preserving Ugandan Family Heritage
          </p>
        </div>
      </footer>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default Home;
