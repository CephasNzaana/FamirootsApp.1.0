// src/pages/FamilyTrees.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { FamilyTree, FamilyMember, Clan } from '@/types'; // Added Clan type
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // DialogDescription was unused here
import { Users, Trees, Eye, PlusCircle, Trash2, Edit3, ListChecks, AlertTriangle } from "lucide-react";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import ClanFamilyTree from "@/components/ClanFamilyTree";
import FamilyTreeMultiView from "@/components/FamilyTreeMultiView";
import { toast } from '@/components/ui/sonner';


const FamilyTreesPage = () => {
  const { user, session } = useAuth(); // session can be useful for initial auth state check
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTree, setSelectedTree] = useState<FamilyTree | null>(null);
  const [showTreeDialog, setShowTreeDialog] = useState<boolean>(false);
  const [showClanDialog, setShowClanDialog] = useState<boolean>(false);
  const [selectedClanForDialog, setSelectedClanForDialog] = useState<Clan | null>(null); // Use Clan type
  const navigate = useNavigate();

  const fetchFamilyTrees = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setFamilyTrees([]); // Clear trees if no user
      return;
    }

    setIsLoading(true);
    try {
      // First fetch the family trees
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('id, surname, tribe, clan, created_at, user_id') // Be specific with selected columns
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (treesError) throw treesError;
      
      if (!treesData || treesData.length === 0) {
        setFamilyTrees([]);
        setIsLoading(false);
        return;
      }

      // Now fetch family members for each tree
      const formattedTreesPromises = treesData.map(async (tree) => {
        const { data: membersData, error: membersError } = await supabase
          .from('family_members')
          .select('*') // Select all member fields
          .eq('family_tree_id', tree.id);
          
        if (membersError) {
          console.error(`Error fetching members for tree ${tree.id} (${tree.surname}):`, membersError.message);
          // Return tree with empty members if fetching members fails for this specific tree
          return {
            ...tree,
            members: []
          };
        }
        
        const formattedMembers: FamilyMember[] = (membersData || []).map((dbMember: any) => ({
          id: dbMember.id,
          name: dbMember.name,
          relationship: dbMember.relationship,
          birthYear: dbMember.birth_year,
          deathYear: dbMember.death_year || undefined,
          generation: typeof dbMember.generation === 'number' ? dbMember.generation : parseInt(dbMember.generation || '0', 10),
          parentId: dbMember.parent_id || undefined,
          spouseId: dbMember.spouse_id || undefined,      // ADDED
          isElder: Boolean(dbMember.is_elder),
          gender: (dbMember.gender as 'male' | 'female' | undefined) || undefined,
          side: (dbMember.side as 'maternal' | 'paternal' | undefined) || undefined,
          status: dbMember.status || (dbMember.death_year ? 'deceased' : 'living'),
          notes: dbMember.notes || undefined,           // ADDED
          photoUrl: dbMember.photo_url || undefined     // ADDED
        }));
        
        return {
          id: tree.id,
          userId: tree.user_id,
          surname: tree.surname,
          tribe: tree.tribe,
          clan: tree.clan,
          createdAt: tree.created_at,
          members: formattedMembers
        };
      });
      
      const resolvedTrees = await Promise.all(formattedTreesPromises);
      setFamilyTrees(resolvedTrees as FamilyTree[]); // Cast as FamilyTree[] after resolving

    } catch (error: any) {
      console.error("Error fetching family trees:", error);
      toast.error(error.message || "Failed to load your family trees. Ensure RLS policies are set correctly.");
      setFamilyTrees([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Depend on user.id

  useEffect(() => {
    if (user) {
      setShowAuth(false); // User logged in, hide auth form
      fetchFamilyTrees();
    } else if (!session && !isLoading) { // If there's no session, user is not loading, and not logged in
        setShowAuth(true); // Prompt login
        setFamilyTrees([]); // Clear any stale tree data
    } else {
        setIsLoading(false); // Catch all for no user, ensure loading is false
        setFamilyTrees([]);
    }
  }, [user, session, fetchFamilyTrees, isLoading]); // isLoading added to deps

  const handleCreateClick = () => {
    navigate("/"); // Navigate to the form page (Home page)
  };

  const handleViewTree = (tree: FamilyTree) => {
    setSelectedTree(tree);
    setShowTreeDialog(true);
  };
  
  const handleViewClanElders = (tree: FamilyTree) => {
    const tribeData = ugandaTribesData.find(t => t.name === tree.tribe);
    if (tribeData) {
      const clanData = tribeData.clans.find(c => c.name === tree.clan);
      if (clanData) {
        setSelectedClanForDialog({ // Use setSelectedClanForDialog
          ...clanData,
          tribeName: tribeData.name, // Ensure tribeName is passed to ClanFamilyTree
          tribeId: tribeData.id
        });
        setShowClanDialog(true);
      } else {
        toast.error(`Clan "${tree.clan}" not found within the "${tree.tribe}" tribe in local data.`);
      }
    } else {
      toast.error(`Tribe "${tree.tribe}" not found in local data.`);
    }
  };

  const handleDeleteTree = async (treeId: string, treeSurname?: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${treeSurname || 'this'}" family tree? This action will also delete all its members and cannot be undone.`)) {
        return;
    }
    try {
        setIsLoading(true);
        // Supabase can handle cascading deletes if foreign keys are set up with ON DELETE CASCADE
        // If not, delete members first:
        const { error: membersError } = await supabase
            .from('family_members')
            .delete()
            .eq('family_tree_id', treeId);

        if (membersError) {
            // Check if it's "constraint violation" which might be ok if table was empty or RLS prevented seeing them
            if(membersError.code !== 'PGRST004' && membersError.code !== '42P01'){ // PGRST004: No rows found, 42P01: table does not exist (less likely)
                 throw membersError;
            } else {
                console.warn("Warning/Info deleting members (possibly no members to delete or RLS):", membersError.message);
            }
        }

        const { error: treeError } = await supabase
            .from('family_trees')
            .delete()
            .eq('id', treeId);

        if (treeError) {
            throw treeError;
        }

        toast.success(`Family tree "${treeSurname || 'Tree'}" deleted successfully.`);
        setFamilyTrees(prevTrees => prevTrees.filter(tree => tree.id !== treeId));
    } catch (error: any) {
        console.error("Error deleting family tree:", error);
        toast.error(error.message || `Failed to delete tree "${treeSurname || ''}".`);
    } finally {
        setIsLoading(false);
    }
  };

  if (!user && showAuth) { // If auth is prompted and user is not yet available
    return (
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <main className="flex-grow flex items-center justify-center p-4">
                 <AuthForm onClose={() => {
                    setShowAuth(false);
                    if(!user) navigate('/'); // If they close it without logging in, go home
                }} />
            </main>
            <Footer/>
        </div>
    );
  }
  
  if (!user && !isLoading) { // If no user, and not currently loading session info, show a clear message
    return (
        <div className="min-h-screen flex flex-col">
            <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <Users2 size={64} className="text-gray-400 mb-6" />
                <h2 className="text-2xl font-semibold mb-3 text-uganda-black dark:text-slate-100">Access Your Family Trees</h2>
                <p className="text-muted-foreground dark:text-slate-400 mb-6 max-w-md">
                    Please log in or create an account to view, manage, and build your family trees.
                </p>
                <Button onClick={() => setShowAuth(true)} className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                    Login / Sign Up
                </Button>
            </div>
            <Footer/>
        </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b dark:border-slate-700">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black dark:text-slate-100">My Family Trees</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Manage and explore your clan-based family histories.
            </p>
          </div>
          <Button 
            className="mt-4 md:mt-0 bg-uganda-red text-white hover:bg-uganda-red/90 flex items-center gap-2 px-6 py-3"
            onClick={handleCreateClick}
          >
            <PlusCircle className="h-5 w-5" /> Create New Tree
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden dark:bg-slate-800">
                <CardHeader className="pb-2">
                  <Skeleton className="h-7 w-4/5 mb-2" />
                  <Skeleton className="h-5 w-3/5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full rounded-md mt-4" />
                </CardContent>
                <CardFooter className="border-t dark:border-slate-700 pt-3 pb-3">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/4 ml-auto" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : familyTrees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyTrees.map((tree) => (
              <Card key={tree.id} className="flex flex-col justify-between dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-uganda-red truncate">{tree.surname}</CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Tribe: {tree.tribe} <span className="mx-1">•</span> Clan: {tree.clan}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="h-32 bg-gradient-to-br from-uganda-yellow/10 via-uganda-red/5 to-uganda-black/5 dark:from-slate-700 dark:to-slate-700/50 rounded-md flex items-center justify-center">
                    <Trees size={40} className="text-uganda-red/70 dark:text-uganda-yellow/70" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                    Created: {new Date(tree.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t dark:border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTree(tree)}
                    className="w-full sm:w-auto dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    <Eye className="mr-2 h-4 w-4" /> View Tree
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleViewClanElders(tree)}
                    className="w-full sm:w-auto text-uganda-blue hover:bg-uganda-blue/10 dark:text-sky-400 dark:hover:bg-sky-900/50"
                  >
                     <ListChecks className="mr-2 h-4 w-4" /> Elders
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                    onClick={() => handleDeleteTree(tree.id, tree.surname)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center max-w-md p-6 rounded-lg bg-white dark:bg-slate-800 shadow-lg">
              <div className="inline-block p-5 rounded-full bg-uganda-yellow/20 mb-4">
                <Users2 size={48} className="text-uganda-black dark:text-uganda-yellow" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-uganda-black dark:text-slate-100">No Family Trees Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first clan-based family tree to preserve your
                Ugandan family heritage.
              </p>
              <Button 
                className="bg-uganda-red text-white hover:bg-uganda-red/90 px-6 py-3 text-base"
                onClick={handleCreateClick}
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Create Family Tree
              </Button>
            </div>
          </div>
        )}
      </main>

      {selectedTree && (
        <Dialog open={showTreeDialog} onOpenChange={setShowTreeDialog}>
          <DialogContent className="max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl w-[95vw] max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b dark:border-slate-700">
                <DialogTitle className="text-xl">
                    {selectedTree.surname} Family Tree ({selectedTree.clan} - {selectedTree.tribe})
                </DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-auto"> {/* Make content area scrollable */}
                <FamilyTreeMultiView tree={selectedTree} onTreeDataUpdate={(updatedTree) => {
                    // If MultiView allows edits and updates the tree, reflect it here
                    setSelectedTree(updatedTree);
                    // Optionally, also update the main list if critical details like surname change
                    setFamilyTrees(prev => prev.map(t => t.id === updatedTree.id ? {...t, ...updatedTree} : t));
                }} />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {selectedClanForDialog && (
        <Dialog open={showClanDialog} onOpenChange={setShowClanDialog}>
          <DialogContent className="max-w-3xl md:max-w-4xl w-[90vw] max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b dark:border-slate-700">
                 <DialogTitle className="text-xl">
                    Elders of {selectedClanForDialog.name} Clan ({selectedClanForDialog.tribeName})
                </DialogTitle>
            </DialogHeader>
             <div className="flex-grow overflow-auto p-2 sm:p-4">
                <ClanFamilyTree clan={selectedClanForDialog} />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <Footer />
      
      {/* AuthForm will only be shown if triggered by !user && showAuth */}
      {showAuth && !user && (
        <AuthForm onClose={() => {
            setShowAuth(false);
            // If user is still null after closing auth form, maybe navigate to home or show a message
            if (!user) {
                const currentPath = window.location.pathname;
                if (currentPath === "/family-trees") navigate('/'); // Only navigate away if still on this protected page
            }
        }} />
      )}
    </div>
  );
};

export default FamilyTreesPage;
