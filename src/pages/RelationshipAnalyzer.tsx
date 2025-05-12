
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Dna, Bird, Clock, User } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import { FamilyTree, FamilyMember, ElderReference } from "@/types";

interface RelationshipResult {
  isRelated: boolean;
  relationshipType?: string;
  commonElders?: ElderReference[];
  generationalDistance?: number;
  clanContext?: string;
  confidenceScore: number;
  verificationPath?: string[];
}

const RelationshipAnalyzer = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<string>("");
  const [selectedPerson1, setSelectedPerson1] = useState<string>("");
  const [selectedPerson2, setSelectedPerson2] = useState<string>("");
  const [selectedElders1, setSelectedElders1] = useState<string[]>([]);
  const [selectedElders2, setSelectedElders2] = useState<string[]>([]);
  const [customPerson1, setCustomPerson1] = useState<string>("");
  const [customPerson2, setCustomPerson2] = useState<string>("");
  const [customTribe2, setCustomTribe2] = useState<string>("");
  const [customClan2, setCustomClan2] = useState<string>("");
  const [availableElders, setAvailableElders] = useState<ElderReference[]>([]);
  const [relationshipResult, setRelationshipResult] = useState<RelationshipResult | null>(null);

  useEffect(() => {
    if (user) {
      fetchFamilyTrees();
      fetchAvailableElders();
    }
  }, [user]);

  const fetchFamilyTrees = async () => {
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('family_trees')
        .select('*')
        .eq('user_id', user?.id);

      if (treesError) throw treesError;
      
      if (!treesData || treesData.length === 0) {
        setFamilyTrees([]);
        return;
      }

      // Fetch family members for each tree
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
        
        // Format members to match our FamilyMember type
        const formattedMembers: FamilyMember[] = (membersData || []).map(member => ({
          id: member.id,
          name: member.name,
          relationship: member.relationship,
          birthYear: member.birth_year,
          deathYear: member.death_year,
          generation: member.generation,
          parentId: member.parent_id,
          isElder: Boolean(member.is_elder),
          gender: member.gender || undefined,
          side: member.side as 'maternal' | 'paternal' | undefined,
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
      if (formattedTrees.length > 0) {
        setSelectedTree(formattedTrees[0].id);
      }
    } catch (error) {
      console.error("Error fetching family trees:", error);
      toast.error("Failed to load family trees");
    }
  };

  const fetchAvailableElders = async () => {
    try {
      // In a production app, we would fetch this from the database
      // For now, creating some sample data
      setAvailableElders([
        { id: "elder1", name: "Mzee Wakayima", approximateEra: "1850-1920", familyUnits: ["family1", "family2"] },
        { id: "elder2", name: "Omukulu Kiwanuka", approximateEra: "1870-1950", familyUnits: ["family3"] },
        { id: "elder3", name: "Ssalongo Sserwadda", approximateEra: "1890-1975", familyUnits: ["family4", "family5"] },
        { id: "elder4", name: "Omukaaka Nalongo", approximateEra: "1900-1980", familyUnits: ["family6"] },
        { id: "elder5", name: "Omumbejja Nkozi", approximateEra: "1910-1990", familyUnits: ["family7", "family8"] },
      ]);
    } catch (error) {
      console.error("Error fetching elders:", error);
      toast.error("Failed to load elder data");
    }
  };

  const getCurrentlySelectedTree = () => {
    return familyTrees.find(tree => tree.id === selectedTree);
  };

  const getAvailableMembers = () => {
    const tree = getCurrentlySelectedTree();
    return tree?.members || [];
  };

  const handleAnalyzeRelationship = async () => {
    setIsLoading(true);

    try {
      // In a production app, we would call an API that connects to AI service
      // For demo, simulate a delayed response
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tree = getCurrentlySelectedTree();
      if (!tree && !customPerson2) {
        throw new Error("No family tree selected and no second person specified");
      }

      // Get the selected members from the tree
      const person1 = selectedPerson1 ? 
        getAvailableMembers().find(m => m.id === selectedPerson1) : 
        { name: customPerson1, relationship: "custom" };
        
      const person2 = selectedPerson2 ? 
        getAvailableMembers().find(m => m.id === selectedPerson2) : 
        { name: customPerson2, relationship: "custom" };

      // Get the selected elders
      const selectedElders1List = selectedElders1.map(id => 
        availableElders.find(e => e.id === id)
      ).filter(Boolean) as ElderReference[];
      
      const selectedElders2List = selectedElders2.map(id => 
        availableElders.find(e => e.id === id)
      ).filter(Boolean) as ElderReference[];

      // If either person is undefined, show an error
      if (!person1?.name || !person2?.name) {
        throw new Error("Please select or enter names for both individuals");
      }

      // Call AI service to analyze relationship
      // This is where a real app would call OpenAI or another AI service
      // For demo purposes, we'll simulate different relationship scenarios
      
      const probability = Math.random();
      
      // Determine if the two people are from the same tribe/clan
      const isSameTribe = tree && (!customPerson2 || !customTribe2 || customTribe2 === tree.tribe);
      const isSameClan = tree && (!customPerson2 || !customClan2 || customClan2 === tree.clan);
      
      // Higher chance of relation if from same clan
      const relationProbability = isSameClan ? 0.8 : (isSameTribe ? 0.5 : 0.2);
      
      // Simulating different relationship scenarios for demo purposes
      let result: RelationshipResult;
      
      if (probability < relationProbability) {
        // Related scenario
        const relationshipTypes = [
          "first cousins", "second cousins", "third cousins", 
          "siblings", "uncle/niece", "aunt/nephew", "distant relatives"
        ];
        const randomRelationship = relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)];
        
        const commonEldersCount = Math.min(
          Math.floor(Math.random() * 3) + 1, 
          Math.min(selectedElders1List.length || 1, selectedElders2List.length || 1)
        );
        
        const commonEldersPool = [...selectedElders1List, ...selectedElders2List, ...availableElders.slice(0, 3)];
        const commonElders = commonEldersPool
          .slice(0, commonEldersCount)
          .filter((e, i, arr) => arr.findIndex(el => el.id === e.id) === i);
        
        result = {
          isRelated: true,
          relationshipType: randomRelationship,
          commonElders: commonElders.length > 0 ? commonElders : undefined,
          generationalDistance: Math.floor(Math.random() * 4) + 1,
          clanContext: isSameClan 
            ? `Both individuals belong to the ${tree?.clan} clan of the ${tree?.tribe} tribe.`
            : `${person1.name} belongs to the ${tree?.clan} clan of the ${tree?.tribe} tribe, while ${person2.name} belongs to the ${customClan2 || "unknown"} clan of the ${customTribe2 || "unknown"} tribe.`,
          confidenceScore: 0.7 + (Math.random() * 0.25),
          verificationPath: [
            "Clan elder verification",
            "Family history analysis",
            "Cultural naming conventions",
            "Shared ancestral connections"
          ]
        };
      } else {
        // Unrelated scenario
        result = {
          isRelated: false,
          confidenceScore: 0.5 + (Math.random() * 0.3),
          clanContext: isSameClan
            ? `Analysis could not establish a connection within the ${tree?.clan} clan of the ${tree?.tribe} tribe.`
            : `Analysis could not establish a connection between the ${tree?.clan} clan of the ${tree?.tribe} tribe and the ${customClan2 || "unknown"} clan of the ${customTribe2 || "unknown"} tribe.`
        };
      }
      
      setRelationshipResult(result);
    } catch (error) {
      console.error("Error analyzing relationship:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze relationship");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setRelationshipResult(null);
    setSelectedPerson1("");
    setSelectedPerson2("");
    setCustomPerson1("");
    setCustomPerson2("");
    setCustomTribe2("");
    setCustomClan2("");
    setSelectedElders1([]);
    setSelectedElders2([]);
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
            <p className="mb-6">Please login or sign up to use the Relationship Analyzer.</p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => setShowAuth(true)}
                className="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-uganda-yellow/90 transition-colors"
              >
                Login / Sign Up
              </Button>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black mb-4">
              Relationship Analyzer
            </h1>
            <p className="text-lg text-gray-600">
              Discover how two individuals are related based on Ugandan clan structures and family heritage.
            </p>
          </div>
          
          {!relationshipResult ? (
            <Card>
              <CardHeader>
                <CardTitle>Analyze Family Relationships</CardTitle>
                <CardDescription>
                  Select a person from your family tree and compare with anyone from around the world.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {familyTrees.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="family-tree">Select Your Family Tree</Label>
                        <Select 
                          value={selectedTree} 
                          onValueChange={setSelectedTree}
                        >
                          <SelectTrigger id="family-tree">
                            <SelectValue placeholder="Select a family tree" />
                          </SelectTrigger>
                          <SelectContent>
                            {familyTrees.map(tree => (
                              <SelectItem key={tree.id} value={tree.id}>
                                {tree.surname} Family - {tree.tribe}, {tree.clan} clan
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Person Selection */}
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h3 className="text-lg font-medium">First Person (From Your Family)</h3>
                          <div className="space-y-2">
                            <Label htmlFor="first-person">Select from Family Tree</Label>
                            <Select 
                              value={selectedPerson1} 
                              onValueChange={val => {
                                setSelectedPerson1(val);
                                setCustomPerson1("");
                              }}
                            >
                              <SelectTrigger id="first-person">
                                <SelectValue placeholder="Select a person" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">-- Custom Name --</SelectItem>
                                {getAvailableMembers().map(member => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} ({member.relationship})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {!selectedPerson1 && (
                            <div className="space-y-2">
                              <Label htmlFor="custom-person1">Enter Custom Name</Label>
                              <Input
                                id="custom-person1"
                                placeholder="e.g., John Mukasa"
                                value={customPerson1}
                                onChange={e => setCustomPerson1(e.target.value)}
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="elder1">Known Clan Elders</Label>
                            <Select 
                              value={selectedElders1.length > 0 ? selectedElders1[0] : ""}
                              onValueChange={(value) => {
                                if (value) {
                                  setSelectedElders1([value]);
                                } else {
                                  setSelectedElders1([]);
                                }
                              }}
                            >
                              <SelectTrigger id="elder1">
                                <SelectValue placeholder="Select clan elders" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {availableElders.map(elder => (
                                  <SelectItem key={elder.id} value={elder.id}>
                                    {elder.name} ({elder.approximateEra})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedElders1.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor="additional-elder1">Additional Elder Connection</Label>
                              <Select
                                value={selectedElders1.length > 1 ? selectedElders1[1] : ""}
                                onValueChange={(value) => {
                                  if (value) {
                                    setSelectedElders1(prev => [...prev, value]);
                                  }
                                }}
                              >
                                <SelectTrigger id="additional-elder1">
                                  <SelectValue placeholder="Select additional elder" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {availableElders
                                    .filter(elder => !selectedElders1.includes(elder.id))
                                    .map(elder => (
                                      <SelectItem key={elder.id} value={elder.id}>
                                        {elder.name} ({elder.approximateEra})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Second Person Selection */}
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h3 className="text-lg font-medium">Second Person (From Anywhere)</h3>
                          <div className="space-y-2">
                            <Label htmlFor="second-person">Select from Your Family Tree (Optional)</Label>
                            <Select 
                              value={selectedPerson2} 
                              onValueChange={val => {
                                setSelectedPerson2(val);
                                setCustomPerson2("");
                                setCustomTribe2("");
                                setCustomClan2("");
                              }}
                            >
                              <SelectTrigger id="second-person">
                                <SelectValue placeholder="Select a person or enter details below" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">-- Enter Custom Person --</SelectItem>
                                {getAvailableMembers().map(member => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} ({member.relationship})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {!selectedPerson2 && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="custom-person2">Enter Person's Name</Label>
                                <Input
                                  id="custom-person2"
                                  placeholder="e.g., Sarah Namakula"
                                  value={customPerson2}
                                  onChange={e => setCustomPerson2(e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="custom-tribe2">Tribe (if known)</Label>
                                <Input
                                  id="custom-tribe2"
                                  placeholder="e.g., Baganda"
                                  value={customTribe2}
                                  onChange={e => setCustomTribe2(e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="custom-clan2">Clan (if known)</Label>
                                <Input
                                  id="custom-clan2"
                                  placeholder="e.g., Mamba"
                                  value={customClan2}
                                  onChange={e => setCustomClan2(e.target.value)}
                                />
                              </div>
                            </>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="elder2">Known Clan Elders</Label>
                            <Select
                              value={selectedElders2.length > 0 ? selectedElders2[0] : ""}
                              onValueChange={(value) => {
                                if (value) {
                                  setSelectedElders2([value]);
                                } else {
                                  setSelectedElders2([]);
                                }
                              }}
                            >
                              <SelectTrigger id="elder2">
                                <SelectValue placeholder="Select clan elders" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {availableElders.map(elder => (
                                  <SelectItem key={elder.id} value={elder.id}>
                                    {elder.name} ({elder.approximateEra})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedElders2.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor="additional-elder2">Additional Elder Connection</Label>
                              <Select
                                value={selectedElders2.length > 1 ? selectedElders2[1] : ""}
                                onValueChange={(value) => {
                                  if (value) {
                                    setSelectedElders2(prev => [...prev, value]);
                                  }
                                }}
                              >
                                <SelectTrigger id="additional-elder2">
                                  <SelectValue placeholder="Select additional elder" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {availableElders
                                    .filter(elder => !selectedElders2.includes(elder.id))
                                    .map(elder => (
                                      <SelectItem key={elder.id} value={elder.id}>
                                        {elder.name} ({elder.approximateEra})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center pt-4">
                        <Button 
                          onClick={handleAnalyzeRelationship}
                          className="bg-uganda-red text-white hover:bg-uganda-red/90 px-8 py-2"
                          disabled={isLoading || ((!selectedPerson1 && !customPerson1) || (!selectedPerson2 && !customPerson2))}
                        >
                          <Users className="mr-2 h-5 w-5" />
                          {isLoading ? "Analyzing..." : "Analyze Relationship"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users size={64} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Family Trees Available</h3>
                      <p className="text-gray-600 mb-6">
                        Create a family tree first to use the Relationship Analyzer.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/'}
                        className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                      >
                        Create Family Tree
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className={`bg-gradient-to-r ${relationshipResult.isRelated ? 'from-green-50 to-green-100' : 'from-gray-50 to-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Relationship Analysis</CardTitle>
                  <Button variant="outline" onClick={resetAnalysis}>Start New Analysis</Button>
                </div>
                <CardDescription>
                  Analysis between {selectedPerson1 ? getAvailableMembers().find(m => m.id === selectedPerson1)?.name : customPerson1} and {selectedPerson2 ? getAvailableMembers().find(m => m.id === selectedPerson2)?.name : customPerson2}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-8">
                  <div className="flex items-center justify-center py-6">
                    <div className="relative">
                      {/* First person circle */}
                      <div className="w-24 h-24 rounded-full bg-uganda-yellow/20 border-2 border-uganda-yellow flex flex-col items-center justify-center shadow-md">
                        <User size={32} className="text-uganda-black mb-1" />
                        <div className="text-xs font-medium text-center max-w-[80px] truncate">
                          {selectedPerson1 ? getAvailableMembers().find(m => m.id === selectedPerson1)?.name : customPerson1}
                        </div>
                      </div>
                      
                      {/* Relationship line */}
                      <div className="absolute top-1/2 left-full h-2 bg-gradient-to-r from-uganda-yellow to-uganda-red -translate-y-1/2 z-0" style={{ width: '200px' }}></div>
                      
                      {/* Relationship label */}
                      <div className="absolute top-1/2 left-full ml-[100px] -translate-y-1/2 bg-white px-3 py-1 rounded-full border shadow-sm z-10 text-sm font-medium">
                        {relationshipResult.isRelated ? relationshipResult.relationshipType : "Unrelated"}
                      </div>
                      
                      {/* Second person circle */}
                      <div className="w-24 h-24 rounded-full bg-uganda-red/20 border-2 border-uganda-red flex flex-col items-center justify-center shadow-md absolute left-[224px] top-0">
                        <User size={32} className="text-uganda-black mb-1" />
                        <div className="text-xs font-medium text-center max-w-[80px] truncate">
                          {selectedPerson2 ? getAvailableMembers().find(m => m.id === selectedPerson2)?.name : customPerson2}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h3 className="text-lg font-medium flex items-center">
                        <Users className="mr-2 h-5 w-5 text-uganda-yellow" />
                        Relationship Details
                      </h3>
                      <div className="mt-4 space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Status:</span> {relationshipResult.isRelated ? "Related" : "Not Related"}
                        </p>
                        {relationshipResult.isRelated && relationshipResult.relationshipType && (
                          <p><span className="font-medium">Relationship Type:</span> {relationshipResult.relationshipType}</p>
                        )}
                        {relationshipResult.generationalDistance !== undefined && (
                          <p><span className="font-medium">Generational Distance:</span> {relationshipResult.generationalDistance} generation(s)</p>
                        )}
                        <p><span className="font-medium">Confidence Score:</span> {Math.round(relationshipResult.confidenceScore * 100)}%</p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h3 className="text-lg font-medium flex items-center">
                        <Bird className="mr-2 h-5 w-5 text-uganda-red" />
                        Cultural Context
                      </h3>
                      <div className="mt-4 space-y-2 text-sm">
                        <p>{relationshipResult.clanContext}</p>
                        {relationshipResult.commonElders && relationshipResult.commonElders.length > 0 && (
                          <div className="pt-2">
                            <p className="font-medium">Common Elders:</p>
                            <ul className="list-disc list-inside pl-2">
                              {relationshipResult.commonElders.map((elder, idx) => (
                                <li key={idx}>{elder.name} ({elder.approximateEra})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {relationshipResult.isRelated && relationshipResult.verificationPath && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-uganda-yellow" />
                        Verification Path
                      </h3>
                      <div className="relative pl-8 pb-8 border-l-2 border-uganda-red/30">
                        {relationshipResult.verificationPath.map((step, idx) => (
                          <div key={idx} className="mb-8 relative">
                            <div className="absolute -left-[25px] w-12 h-12 bg-white rounded-full flex items-center justify-center border border-uganda-yellow shadow-sm">
                              <span className="text-lg font-bold text-uganda-black">{idx + 1}</span>
                            </div>
                            <div className="pt-2 pl-6">
                              <p className="font-medium">{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <Button 
                      onClick={() => window.location.href = '/dna-test'}
                      className="bg-uganda-red text-white hover:bg-uganda-red/90"
                    >
                      <Dna className="mr-2 h-5 w-5" />
                      Order DNA Test for Verification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default RelationshipAnalyzer;
