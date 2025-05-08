
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react"; // Added missing Users icon import
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { FamilyTree } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const FamilyTrees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to view your family trees");
      setShowAuth(true);
      return;
    }

    const fetchFamilyTrees = async () => {
      try {
        const { data, error } = await supabase
          .from("family_trees")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Transform the data to match FamilyTree type
        if (data) {
          const formattedTrees: FamilyTree[] = data.map(tree => ({
            id: tree.id,
            userId: tree.user_id,
            surname: tree.surname,
            tribe: tree.tribe,
            clan: tree.clan,
            createdAt: tree.created_at,
            members: [] // Default to empty array since we don't have members data yet
          }));
          setFamilyTrees(formattedTrees);
        } else {
          setFamilyTrees([]);
        }
      } catch (error) {
        console.error("Error fetching family trees:", error);
        toast.error("Failed to load family trees");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyTrees();
  }, [user]);

  const handleCreateNew = () => {
    navigate("/");
  };

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <section className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-uganda-black">Your Family Trees</h1>
              <Button onClick={handleCreateNew}>Create New Tree</Button>
            </div>
          </section>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : familyTrees.length === 0 ? (
            <div className="bg-white bg-opacity-80 rounded-lg p-6 text-center border-2 border-uganda-black shadow-lg">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow">
                  <Users className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-uganda-black">No Family Trees Found</h2>
                <p className="text-gray-600 mb-4">
                  You haven't created any family trees yet. Start by creating your first family tree to preserve your heritage.
                </p>
                <Button onClick={handleCreateNew}>Create Your First Family Tree</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyTrees.map((tree) => (
                <Card key={tree.id} className="bg-white hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{tree.surname}</CardTitle>
                    <CardDescription>
                      {tree.tribe}, {tree.clan} clan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      <p>Created: {new Date(tree.createdAt).toLocaleDateString()}</p>
                      <p>{tree.members.length} family members</p>
                      <p>{tree.members.filter(m => m.isElder).length} elders</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/family-tree/${tree.id}`)}
                      className="w-full"
                    >
                      View Tree
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
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

export default FamilyTrees;
