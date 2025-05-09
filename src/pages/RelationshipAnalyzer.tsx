
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RelationshipResult } from "@/types";

// Define tribes for selection - ensure no empty values
const AVAILABLE_TRIBES = [
  "Baganda",
  "Banyankole",
  "Basoga",
  "Bakiga",
  "Batoro",
  "Other"
];

const RelationshipAnalyzer = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  
  // Sample form data
  const [person1, setPerson1] = useState({
    name: "",
    tribe: AVAILABLE_TRIBES[0],
    clan: "",
    elderConnection: ""
  });
  
  const [person2, setPerson2] = useState({
    name: "",
    tribe: AVAILABLE_TRIBES[0],
    clan: "",
    elderConnection: ""
  });

  const handleAnalyze = async () => {
    if (!user) {
      toast.error("Please login to use the relationship analyzer");
      setShowAuth(true);
      return;
    }

    // Simple validation
    if (!person1.name || !person1.tribe || !person1.clan ||
        !person2.name || !person2.tribe || !person2.clan) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // This would be an actual API call in production
      // For now, let's simulate a response
      setTimeout(() => {
        const isSameClan = person1.clan.toLowerCase() === person2.clan.toLowerCase();
        const isSameTribe = person1.tribe.toLowerCase() === person2.tribe.toLowerCase();
        const commonElder = isSameClan && person1.elderConnection && person2.elderConnection && 
                          person1.elderConnection.toLowerCase() === person2.elderConnection.toLowerCase();
        
        const mockResult: RelationshipResult = {
          isRelated: isSameTribe && isSameClan,
          relationshipType: isSameClan ? (commonElder ? "Direct Relation" : "Clan Relation") : "No Direct Relation",
          generationalDistance: commonElder ? 3 : undefined,
          clanContext: isSameClan 
            ? `Both individuals belong to the ${person1.clan} clan of the ${person1.tribe} tribe.`
            : `Individuals belong to different clans: ${person1.clan} and ${person2.clan}.`,
          confidenceScore: isSameClan ? (commonElder ? 0.85 : 0.65) : 0.2,
          commonElder: commonElder ? {
            id: "mock-elder-id",
            name: person1.elderConnection,
            approximateEra: "Early 20th century",
            verificationScore: 0.75,
            familyConnections: ["Family A", "Family B"]
          } : undefined
        };

        setResult(mockResult);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error analyzing relationship:", error);
      toast.error("Failed to analyze relationship");
      setIsLoading(false);
    }
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
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-uganda-black">
              Relationship <span className="text-uganda-red">Analyzer</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
              Discover how two individuals are connected through Ugandan clan and tribal structures.
            </p>
          </section>

          <div className="flex flex-col lg:flex-row gap-8">
            <Card className="lg:w-2/3 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Analyze Family Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Person 1 */}
                  <div className="space-y-4">
                    <div className="text-center font-semibold text-lg pb-2 border-b">Person 1</div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="person1-name">Full Name</Label>
                        <Input 
                          id="person1-name"
                          placeholder="Enter full name" 
                          value={person1.name}
                          onChange={(e) => setPerson1({...person1, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person1-tribe">Tribe</Label>
                        <Select 
                          value={person1.tribe} 
                          onValueChange={(value) => setPerson1({...person1, tribe: value})}
                        >
                          <SelectTrigger id="person1-tribe">
                            <SelectValue placeholder="Select tribe" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_TRIBES.map((tribe) => (
                              <SelectItem key={tribe} value={tribe}>{tribe}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person1-clan">Clan</Label>
                        <Input 
                          id="person1-clan"
                          placeholder="Enter clan name" 
                          value={person1.clan}
                          onChange={(e) => setPerson1({...person1, clan: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person1-elder">Known Elder Connection</Label>
                        <Input 
                          id="person1-elder"
                          placeholder="Enter elder name (if known)" 
                          value={person1.elderConnection}
                          onChange={(e) => setPerson1({...person1, elderConnection: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Person 2 */}
                  <div className="space-y-4">
                    <div className="text-center font-semibold text-lg pb-2 border-b">Person 2</div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="person2-name">Full Name</Label>
                        <Input 
                          id="person2-name"
                          placeholder="Enter full name" 
                          value={person2.name}
                          onChange={(e) => setPerson2({...person2, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person2-tribe">Tribe</Label>
                        <Select 
                          value={person2.tribe} 
                          onValueChange={(value) => setPerson2({...person2, tribe: value})}
                        >
                          <SelectTrigger id="person2-tribe">
                            <SelectValue placeholder="Select tribe" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_TRIBES.map((tribe) => (
                              <SelectItem key={tribe} value={tribe}>{tribe}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person2-clan">Clan</Label>
                        <Input 
                          id="person2-clan"
                          placeholder="Enter clan name" 
                          value={person2.clan}
                          onChange={(e) => setPerson2({...person2, clan: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="person2-elder">Known Elder Connection</Label>
                        <Input 
                          id="person2-elder"
                          placeholder="Enter elder name (if known)" 
                          value={person2.elderConnection}
                          onChange={(e) => setPerson2({...person2, elderConnection: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    className="px-8" 
                    onClick={handleAnalyze} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Analyzing..." : "Analyze Relationship"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:w-1/3 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Results</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className={`text-center text-lg font-bold ${result.isRelated ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isRelated ? 'Related' : 'Not Related'}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="font-medium">Relationship Type:</div>
                      <div>{result.relationshipType || 'Unknown'}</div>
                    </div>
                    
                    {result.commonElder && (
                      <div className="space-y-2">
                        <div className="font-medium">Common Elder:</div>
                        <div>{result.commonElder.name}</div>
                        <div className="text-sm text-gray-600">Era: {result.commonElder.approximateEra}</div>
                      </div>
                    )}
                    
                    {result.generationalDistance !== undefined && (
                      <div className="space-y-2">
                        <div className="font-medium">Generational Distance:</div>
                        <div>{result.generationalDistance} generations</div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="font-medium">Clan Context:</div>
                      <div className="text-sm">{result.clanContext}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium">Confidence Score:</div>
                      <div className="flex items-center">
                        <div className="bg-gray-200 h-2 w-full rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              result.confidenceScore > 0.7 ? 'bg-green-500' : 
                              result.confidenceScore > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{width: `${result.confidenceScore * 100}%`}}
                          />
                        </div>
                        <span className="ml-2 text-sm">{Math.round(result.confidenceScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                    <p className="text-sm text-gray-600">
                      Fill out the information for both individuals and click "Analyze Relationship" to discover how they might be connected.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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

export default RelationshipAnalyzer;
