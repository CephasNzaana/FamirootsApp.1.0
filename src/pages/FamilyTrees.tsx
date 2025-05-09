
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { FamilyTree } from "@/types";

const FamilyTrees = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      fetchFamilyTrees();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFamilyTrees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('family_trees')
        .select('*')
        .eq('user_id', user?.id);

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

  if (!user) {
    return (
      <>
        <Header 
          onLogin={() => setShowAuth(true)} 
          onSignup={() => setShowAuth(true)} 
        />
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-6">Please login or sign up to view your family trees.</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-uganda-yellow/90 transition-colors"
              >
                Login / Sign Up
              </button>
            </div>
          </div>
        </div>
        {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black">Your Family Trees</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage and explore your clan-based family histories.
            </p>
          </div>
          <Button 
            className="mt-4 md:mt-0 bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
            onClick={() => window.location.href = "/"}
          >
            Create New Family Tree
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-0">
                  <Skeleton className="h-7 w-4/5 mb-2" />
                  <Skeleton className="h-5 w-3/5" />
                </CardHeader>
                <CardContent>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : familyTrees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyTrees.map(tree => (
              <Card key={tree.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{tree.surname} Family Tree</CardTitle>
                  <CardDescription>
                    Tribe: {tree.tribe} • Clan: {tree.clan}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-gradient-to-br from-uganda-yellow/30 to-uganda-red/20 rounded-md flex items-center justify-center">
                    <Users size={48} className="text-uganda-red/60" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-gray-50 py-3">
                  <div className="text-sm text-gray-500">
                    Created: {new Date(tree.createdAt).toLocaleDateString()}
                  </div>
                  <Button size="sm" className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="inline-block p-5 rounded-full bg-uganda-yellow/20 mb-4">
                <Users size={32} className="text-uganda-black" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Family Trees Yet</h2>
              <p className="text-gray-600 mb-6">
                Get started by creating your first clan-based family tree to preserve your 
                Ugandan family heritage.
              </p>
              <Button 
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                onClick={() => window.location.href = "/"}
              >
                Create Family Tree
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FamilyTrees;
