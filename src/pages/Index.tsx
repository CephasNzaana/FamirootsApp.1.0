import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import { User, TreeFormData, FamilyTree, FamilyMember } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);

  // Mock authentication for demo purposes
  useEffect(() => {
    // Check if user is in localStorage (demo only)
    const storedUser = localStorage.getItem("famiRootsUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("famiRootsUser");
    setFamilyTree(null);
    toast.success("Logged out successfully");
  };

  const handleAuthSuccess = () => {
    // Create a mock user for demo purposes
    const newUser = {
      id: uuidv4(),
      email: "demo@famiroots.com",
    };
    setUser(newUser);
    localStorage.setItem("famiRootsUser", JSON.stringify(newUser));
  };

  const generateFamilyTree = async (formData: TreeFormData) => {
    if (!user) {
      toast.error("Please login to generate a family tree");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);

    try {
      // Call our Supabase Edge Function to generate a family tree
      const { data, error } = await supabase.functions.invoke("generate-family-tree", {
        body: {
          surname: formData.surname,
          tribe: formData.tribe,
          clan: formData.clan
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to generate family tree");
      }

      let members: FamilyMember[] = [];

      if (data.fallback) {
        toast.info("Using fallback family tree data. The AI response could not be processed.");
        members = data.members;
      } else {
        members = data.members;
      }

      // Create family tree
      const newTree: FamilyTree = {
        id: uuidv4(),
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
    <div className="min-h-screen flex flex-col">
      <Header
        user={user}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onLogout={handleLogout}
      />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-uganda-black">
              Discover Your <span className="text-uganda-red">Family Legacy</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-600">
              Connect with your roots and learn about your heritage by exploring your family tree.
            </p>
          </section>

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
                      Fill out the form with your elder's details to generate your family tree.
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

          <section className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-6 text-uganda-black">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md uganda-border">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Enter Information</h3>
                <p className="text-gray-600">
                  Provide your elder's surname, tribe, and clan information
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md uganda-border">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
                <p className="text-gray-600">
                  Our AI analyzes and builds a family tree based on your input
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md uganda-border">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Explore Your Roots</h3>
                <p className="text-gray-600">
                  View, save, and share your family heritage with loved ones
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-uganda-black text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-uganda-black"></div>
            <div className="w-4 h-4 bg-uganda-yellow"></div>
            <div className="w-4 h-4 bg-uganda-red"></div>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} FamiRoots - Connecting Generations
          </p>
        </div>
      </footer>
      
      {showAuth && (
        <AuthForm 
          onClose={() => setShowAuth(false)} 
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default Index;
