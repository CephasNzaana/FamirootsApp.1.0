import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import { FamilyTree, UserProfile, DNATestResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Calendar, Clock, Dna, FileText, MapPin, UserCircle, Users } from 'lucide-react';
import FamilyTreeDisplay from '@/components/FamilyTreeDisplay';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { updateUserProfile } from '@/hooks/useSupabaseDatabase';

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [dnaTests, setDnaTests] = useState<DNATestResult[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    birthYear: '',
    birthPlace: '',
    tribe: '',
    clan: '',
    biography: ''
  });
  const [selectedTree, setSelectedTree] = useState<FamilyTree | null>(null);
  const [showTreeDialog, setShowTreeDialog] = useState<boolean>(false);

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
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      // Create default profile structure
      const userProfile: UserProfile = {
        id: user?.id || '',
        fullName: profileData?.full_name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        biography: profileData?.biography || '',
        birthYear: profileData?.birth_year || '',
        birthPlace: profileData?.birth_place || '',
        tribe: profileData?.tribe || '',
        clan: profileData?.clan || '',
        photoUrl: profileData?.avatar_url || ''
      };
      
      setProfile(userProfile);
      setProfileForm({
        fullName: userProfile.fullName,
        birthYear: userProfile.birthYear || '',
        birthPlace: userProfile.birthPlace || '',
        tribe: userProfile.tribe || '',
        clan: userProfile.clan || '',
        biography: userProfile.biography || ''
      });
      
      // Fetch family trees
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('user_id', user?.id);

      if (treesError) {
        console.error('Error fetching family trees:', treesError);
      } else if (treesData) {
        const processedTrees: FamilyTree[] = [];
        
        for (const tree of treesData) {
          // Fetch members for each tree
          const { data: membersData, error: membersError } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_tree_id', tree.id);
            
          if (membersError) {
            console.error(`Error fetching members for tree ${tree.id}:`, membersError);
            continue;
          }
          
          // Convert database format to app format
          const members = (membersData || []).map(member => {
            const status = member.death_year ? 'deceased' : 'living';
            
            return {
              id: member.id,
              name: member.name,
              relationship: member.relationship,
              birthYear: member.birth_year,
              deathYear: member.death_year,
              generation: member.generation,
              parentId: member.parent_id,
              isElder: Boolean(member.is_elder),
              gender: member.gender,
              // Handle fields that might not exist in the database
              marriedTo: undefined,
              clanConnectionId: undefined,
              side: member.side as 'maternal' | 'paternal' | undefined,
              status: status as 'living' | 'deceased',
              photoUrl: undefined
            };
          });
          
          processedTrees.push({
            id: tree.id,
            userId: tree.user_id,
            surname: tree.surname,
            tribe: tree.tribe,
            clan: tree.clan,
            createdAt: tree.created_at,
            members
          });
        }
        
        setFamilyTrees(processedTrees);
      }
      
      // For now, we'll just use mock DNA test data
      // In a real app, this would be fetched from the database
      setDnaTests([
        {
          id: "sample-dna-test",
          userId: user?.id || '',
          dateSubmitted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'processing',
          ethnicityBreakdown: {
            'East African': 65,
            'Central African': 20,
            'West African': 10,
            'North African': 5
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }
    
    try {
      // Use our helper function to update the profile
      const { success, error } = await updateUserProfile(user.id, {
        fullName: profileForm.fullName,
        email: user.email || '',
        photoUrl: profile?.photoUrl || '',
        birthYear: profileForm.birthYear,
        birthPlace: profileForm.birthPlace,
        tribe: profileForm.tribe,
        clan: profileForm.clan,
        biography: profileForm.biography
      });
      
      if (!success) throw error;
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      
      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          fullName: profileForm.fullName,
          birthYear: profileForm.birthYear,
          birthPlace: profileForm.birthPlace,
          tribe: profileForm.tribe,
          clan: profileForm.clan,
          biography: profileForm.biography
        };
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleViewTree = (tree: FamilyTree) => {
    setSelectedTree(tree);
    setShowTreeDialog(true);
  };

  const handleUploadGedcom = () => {
    toast.info('GEDCOM import feature will be available soon!');
  };
  
  const handleAddProfilePhoto = () => {
    toast.info('Photo upload feature will be available soon!');
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
        <Footer />
        {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-yellow"></div>
            </div>
          ) : profile ? (
            <>
              <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 flex flex-col items-center">
                      <div className="mb-4">
                        <Avatar className="w-32 h-32 border-4 border-uganda-yellow">
                          <AvatarImage src={profile.photoUrl || ''} />
                          <AvatarFallback className="bg-uganda-yellow/20 text-uganda-black text-4xl">
                            {profile.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddProfilePhoto}
                        className="mb-6"
                      >
                        Upload Photo
                      </Button>
                      
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-1">{profile.fullName}</h3>
                        <p className="text-gray-500 mb-2">{profile.email}</p>
                        
                        {(profile.tribe || profile.clan) && (
                          <div className="mb-4">
                            {profile.tribe && (
                              <Badge className="mr-2 bg-uganda-red text-white">
                                {profile.tribe}
                              </Badge>
                            )}
                            {profile.clan && (
                              <Badge className="bg-uganda-yellow text-black">
                                {profile.clan} Clan
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {!isEditing && (
                          <Button
                            onClick={() => setIsEditing(true)}
                            size="sm"
                            variant="outline"
                            className="mt-2"
                          >
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="hidden md:block" />
                    
                    <div className="md:w-2/3">
                      {isEditing ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          <div>
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              value={profileForm.fullName}
                              onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="birthYear">Birth Year</Label>
                              <Input
                                id="birthYear"
                                value={profileForm.birthYear}
                                onChange={e => setProfileForm({...profileForm, birthYear: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="birthPlace">Birth Place</Label>
                              <Input
                                id="birthPlace"
                                value={profileForm.birthPlace}
                                onChange={e => setProfileForm({...profileForm, birthPlace: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tribe">Tribe</Label>
                              <Input
                                id="tribe"
                                value={profileForm.tribe}
                                onChange={e => setProfileForm({...profileForm, tribe: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="clan">Clan</Label>
                              <Input
                                id="clan"
                                value={profileForm.clan}
                                onChange={e => setProfileForm({...profileForm, clan: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="biography">Biography</Label>
                            <Textarea
                              id="biography"
                              rows={4}
                              value={profileForm.biography}
                              onChange={e => setProfileForm({...profileForm, biography: e.target.value})}
                              placeholder="Tell us about yourself..."
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                            >
                              Save Profile
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">Biography</h3>
                            <p className="text-gray-600">
                              {profile.biography || "No biography added yet. Click 'Edit Profile' to add your story."}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.birthYear && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-uganda-yellow" />
                                <div>
                                  <div className="text-sm font-medium">Birth Year</div>
                                  <div className="text-gray-600">{profile.birthYear}</div>
                                </div>
                              </div>
                            )}
                            
                            {profile.birthPlace && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-uganda-red" />
                                <div>
                                  <div className="text-sm font-medium">Birth Place</div>
                                  <div className="text-gray-600">{profile.birthPlace}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Separator />
                          
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Quick Stats</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <Card className="bg-gray-50">
                                <CardContent className="p-4 flex flex-col items-center justify-center">
                                  <Users className="h-8 w-8 mb-2 text-uganda-yellow" />
                                  <div className="text-2xl font-bold">{familyTrees.length}</div>
                                  <div className="text-sm text-gray-600">Family Trees</div>
                                </CardContent>
                              </Card>
                              
                              <Card className="bg-gray-50">
                                <CardContent className="p-4 flex flex-col items-center justify-center">
                                  <Dna className="h-8 w-8 mb-2 text-uganda-red" />
                                  <div className="text-2xl font-bold">{dnaTests.length}</div>
                                  <div className="text-sm text-gray-600">DNA Tests</div>
                                </CardContent>
                              </Card>
                              
                              <Card className="bg-gray-50">
                                <CardContent className="p-4 flex flex-col items-center justify-center">
                                  <Clock className="h-8 w-8 mb-2 text-blue-500" />
                                  <div className="text-2xl font-bold">
                                    {Math.floor((new Date().getTime() - new Date(user.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
                                  </div>
                                  <div className="text-sm text-gray-600">Days as Member</div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="trees" className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="trees">Family Trees</TabsTrigger>
                  <TabsTrigger value="dna">DNA Results</TabsTrigger>
                  <TabsTrigger value="gedcom">GEDCOM Import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trees">
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Your Family Trees</h2>
                      <Button 
                        onClick={() => navigate('/')}
                        className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                      >
                        Create New Tree
                      </Button>
                    </div>
                    
                    {familyTrees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {familyTrees.map(tree => (
                          <Card key={tree.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle>{tree.surname} Family Tree</CardTitle>
                              <CardDescription>
                                {tree.tribe} • {tree.clan} Clan
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="h-20 bg-gradient-to-br from-uganda-yellow/20 to-uganda-red/10 rounded-md flex items-center justify-center">
                                <Users size={32} className="text-uganda-red/60" />
                              </div>
                              <div className="mt-2 text-sm text-gray-500">
                                {tree.members.length} family members
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button 
                                onClick={() => handleViewTree(tree)}
                                className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                              >
                                View Tree
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Family Trees Yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Start preserving your family heritage by creating your first family tree.
                        </p>
                        <Button 
                          onClick={() => navigate('/')}
                          className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                        >
                          Create Your First Tree
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="dna">
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">DNA Test Results</h2>
                      <Button 
                        onClick={() => navigate('/dna-test')}
                        className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                      >
                        Order DNA Test
                      </Button>
                    </div>
                    
                    {dnaTests.length > 0 ? (
                      <div>
                        {dnaTests.map(test => (
                          <Card key={test.id} className="mb-4">
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle>DNA Test #{test.id.slice(-5)}</CardTitle>
                                <Badge 
                                  className={
                                    test.status === 'completed' ? 'bg-green-500' :
                                    test.status === 'processing' ? 'bg-amber-500' :
                                    'bg-blue-500'
                                  }
                                >
                                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                </Badge>
                              </div>
                              <CardDescription>
                                Submitted on {new Date(test.dateSubmitted).toLocaleDateString()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {test.status === 'completed' && test.ethnicityBreakdown ? (
                                <div>
                                  <h4 className="font-medium mb-2">Ethnicity Estimate</h4>
                                  <div className="space-y-2">
                                    {Object.entries(test.ethnicityBreakdown).map(([region, percentage]) => (
                                      <div key={region} className="flex items-center gap-2">
                                        <div className="w-32 text-sm">{region}</div>
                                        <div className="flex-1">
                                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-uganda-yellow"
                                              style={{ width: `${percentage}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        <div className="w-12 text-right font-medium">{percentage}%</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 text-amber-600">
                                  <AlertCircle />
                                  <span>Your DNA sample is still being processed. Results will be available soon!</span>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter>
                              <Button 
                                onClick={() => navigate('/dna-test')}
                                className="w-full bg-white text-uganda-black border border-uganda-yellow hover:bg-uganda-yellow/10"
                              >
                                View Full Results
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Dna size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No DNA Tests Yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Discover your genetic heritage by ordering a DNA test kit.
                        </p>
                        <Button 
                          onClick={() => navigate('/dna-test')}
                          className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                        >
                          Order DNA Test Kit
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="gedcom">
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">GEDCOM Import</h2>
                    </div>
                    
                    <div className="text-center py-8">
                      <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Import Your Family Tree</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Already have a family tree in another service? Import your GEDCOM file to transfer your data.
                      </p>
                      <Button 
                        onClick={handleUploadGedcom}
                        className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                      >
                        Upload GEDCOM File
                      </Button>
                      <p className="text-sm text-gray-500 mt-4">
                        Supported file format: .ged (GEDCOM 5.5 and 7.0)
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
              <AlertCircle size={48} className="mx-auto text-uganda-red mb-4" />
              <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find your profile information. Please update your profile details.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
              >
                Create Profile
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      {selectedTree && (
        <Dialog open={showTreeDialog} onOpenChange={setShowTreeDialog}>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
            <FamilyTreeDisplay tree={selectedTree} />
          </DialogContent>
        </Dialog>
      )}
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default UserProfilePage;
