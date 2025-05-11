
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import UserProfile from "@/components/UserProfile";
import { supabase } from "@/integrations/supabase/client";
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Home, FileText } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user's family trees
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('user_id', user?.id);

      if (treesError) throw treesError;
      
      if (treesData) {
        // Transform data to match FamilyTree type
        const formattedTrees: FamilyTree[] = [];
        
        for (const tree of treesData) {
          // Fetch family members for this tree
          const { data: membersData, error: membersError } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_tree_id', tree.id);
            
          if (membersError) throw membersError;
          
          // Format members to match our FamilyMember type
          const formattedMembers: FamilyMember[] = (membersData || []).map(member => ({
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
          }));
          
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
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load your profile data");
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
            <p className="mb-6">Please login or sign up to view your profile.</p>
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
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <Card className="bg-white shadow-sm border border-gray-200 sticky top-4">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-5 w-5 text-uganda-yellow" />
                    {user?.email || "User Profile"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    <Button 
                      variant="ghost" 
                      className="justify-start rounded-none h-14 border-b hover:bg-uganda-yellow/10 hover:text-uganda-black"
                      onClick={() => window.location.hash = "profile"}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start rounded-none h-14 border-b hover:bg-uganda-yellow/10 hover:text-uganda-black"
                      onClick={() => navigate('/family-trees')}
                    >
                      <Home className="h-4 w-4 mr-3" />
                      My Family Trees
                      <Badge className="ml-auto">{familyTrees.length}</Badge>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start rounded-none h-14 border-b hover:bg-uganda-yellow/10 hover:text-uganda-black"
                      onClick={() => window.location.hash = "dna"}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      DNA Results
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full md:w-2/3">
              <div id="profile" className="mb-6">
                <UserProfile user={user} />
              </div>
              
              <div id="dna" className="mb-6">
                <Card className="w-full bg-white shadow-md border border-gray-200">
                  <CardHeader className="border-b border-gray-200 bg-gray-50">
                    <CardTitle className="text-xl font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-uganda-yellow" />
                      DNA Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-gray-300" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">No DNA Tests Yet</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        You haven't taken a FamiRoots DNA test yet. Discover your genetic heritage and connect with relatives across Uganda and beyond.
                      </p>
                      <Button 
                        className="bg-uganda-red hover:bg-uganda-red/90 text-white"
                        onClick={() => navigate('/dna-test')}
                      >
                        Order DNA Kit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`bg-uganda-yellow/20 text-uganda-black text-xs px-2 py-0.5 rounded-full ${className}`}>
    {children}
  </span>
);

export default ProfilePage;
