
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Users, Trees } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { FamilyTree, FamilyMember } from "@/types";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import ClanFamilyTree from "@/components/ClanFamilyTree";

const FamilyTrees = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTree, setSelectedTree] = useState<FamilyTree | null>(null);
  const [showTreeDialog, setShowTreeDialog] = useState<boolean>(false);
  const [showClanDialog, setShowClanDialog] = useState<boolean>(false);
  const [selectedClan, setSelectedClan] = useState<any>(null);
  const navigate = useNavigate();

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
      // First fetch the family trees
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('user_id', user?.id);

      if (treesError) throw treesError;
      
      if (!treesData || treesData.length === 0) {
        setFamilyTrees([]);
        setIsLoading(false);
        return;
      }

      // Now fetch family members for each tree
      const formattedTrees: FamilyTree[] = [];
      
      for (const tree of treesData) {
        const { data: membersData, error: membersError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_tree_id', tree.id);
          
        if (membersError) {
          console.error(`Error fetching members for tree ${tree.id}:`, membersError);
          continue;
        }
        
        // Format members to match our FamilyMember type, providing default values for missing fields
        const formattedMembers: FamilyMember[] = (membersData || []).map(member => {
          // Safely access potentially missing properties with type assertions and default values
          return {
            id: member.id,
            name: member.name,
            relationship: member.relationship,
            birthYear: member.birth_year,
            deathYear: member.death_year || undefined,
            generation: member.generation,
            parentId: member.parent_id,
            isElder: Boolean(member.is_elder),
            gender: member.gender || undefined,
            side: (member.side as 'maternal' | 'paternal') || undefined,
            status: member.death_year ? 'deceased' : 'living'
          };
        });
        
        formattedTrees.push({
          id: tree.id,
          userId: tree.user_id,
          surname: tree.surname,
          tribe: tree.tribe,
          clan: tree.clan,
          createdAt: tree.created_at,
          members: formattedMembers
        });
      }
      
      setFamilyTrees(formattedTrees);
    } catch (error) {
      console.error("Error fetching family trees:", error);
      toast.error("Failed to load family trees");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    navigate("/");
  };

  const handleViewTree = (tree: FamilyTree) => {
    setSelectedTree(tree);
    setShowTreeDialog(true);
  };
  
  const handleViewClanElders = (tree: FamilyTree) => {
    const tribe = ugandaTribesData.find(t => t.name === tree.tribe);
    if (tribe) {
      const clan = tribe.clans.find(c => c.name === tree.clan);
      if (clan) {
        setSelectedClan({
          ...clan,
          tribeName: tribe.name
        });
        setShowClanDialog(true);
      } else {
        toast.error(`Clan ${tree.clan} not found in tribe ${tree.tribe}`);
      }
    } else {
      toast.error(`Tribe ${tree.tribe} not found`);
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
            onClick={handleCreateClick}
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
                <CardFooter className="flex flex-col border-t bg-gray-50 py-3">
                  <div className="flex justify-between w-full mb-2">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(tree.createdAt).toLocaleDateString()}
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                      onClick={() => handleViewTree(tree)}
                    >
                      View Family Tree
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewClanElders(tree)}
                    className="w-full mt-2 flex items-center justify-center gap-2 border-uganda-red/30 hover:bg-uganda-red/10"
                  >
                    <Trees className="h-4 w-4" />
                    View Clan Elders Tree
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
                onClick={handleCreateClick}
              >
                Create Family Tree
              </Button>
            </div>
          </div>
        )}
      </main>

      {selectedTree && (
        <Dialog open={showTreeDialog} onOpenChange={setShowTreeDialog}>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
            <FamilyTreeDisplay tree={selectedTree} />
          </DialogContent>
        </Dialog>
      )}
      
      {selectedClan && (
        <Dialog open={showClanDialog} onOpenChange={setShowClanDialog}>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="py-2">
              <h2 className="text-2xl font-bold mb-1">{selectedClan.name} Clan</h2>
              <p className="text-gray-600 mb-6">Tribe: {selectedClan.tribeName}</p>
              <ClanFamilyTree clan={selectedClan} />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default FamilyTrees;
