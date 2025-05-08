import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ElderReference } from "@/types";

const SAMPLE_ELDERS: ElderReference[] = [
  {
    id: "elder-1",
    name: "Walusimbi",
    approximateEra: "1880-1960",
    verificationScore: 0.95,
    familyConnections: ["Musoke Family", "Nalwoga Family", "Sserwadda Family"]
  },
  {
    id: "elder-2",
    name: "Semakula",
    approximateEra: "1890-1970",
    verificationScore: 0.88,
    familyConnections: ["Kiyimba Family", "Lubega Family"]
  },
  {
    id: "elder-3",
    name: "Mugisha",
    approximateEra: "1900-1985",
    verificationScore: 0.75,
    familyConnections: ["Bainomugisha Family", "Turyagyenda Family", "Tumwesigye Family"]
  },
  {
    id: "elder-4",
    name: "Waiswa",
    approximateEra: "1910-1990",
    verificationScore: 0.82,
    familyConnections: ["Balikowa Family", "Kirunda Family"]
  },
  {
    id: "elder-5",
    name: "Nsubuga",
    approximateEra: "1905-1980",
    verificationScore: 0.78,
    familyConnections: ["Mukasa Family", "Nsereko Family", "Sekayi Family"]
  }
];

const Elders = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tribeFilter, setTribeFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("verification");
  
  const filteredElders = SAMPLE_ELDERS.filter(elder => {
    if (searchTerm.trim() === "") return true;
    return (
      elder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      elder.familyConnections.some(family => 
        family.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });
  
  // Sort elders based on selected criteria
  const sortedElders = [...filteredElders].sort((a, b) => {
    if (sortBy === "verification") {
      return b.verificationScore - a.verificationScore;
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "era") {
      // Simple sorting by the start year in the era string
      const yearA = parseInt(a.approximateEra.split("-")[0]);
      const yearB = parseInt(b.approximateEra.split("-")[0]);
      return yearA - yearB;
    }
    return 0;
  });

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };

  const handleVerificationRequest = (elderId: string) => {
    if (!user) {
      toast.error("Please login to request verification");
      setShowAuth(true);
      return;
    }
    // In a real app, this would send a verification request
    console.log("Verification requested for elder:", elderId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <section className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-uganda-black">
              Elder <span className="text-uganda-red">Database</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 mb-8">
              Explore and verify connections with clan elders who serve as ancestral anchors in Ugandan family lineages.
            </p>
            
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="search"
                placeholder="Search elders or family connections..."
                className="bg-white col-span-1 md:col-span-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verification">Verification Score</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="era">Era (Oldest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedElders.length > 0 ? (
              sortedElders.map((elder) => (
                <Card key={elder.id} className="bg-white overflow-hidden">
                  <CardHeader className="bg-uganda-yellow bg-opacity-10 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{elder.name}</CardTitle>
                      <Badge className={
                        elder.verificationScore > 0.9 ? "bg-green-500" :
                        elder.verificationScore > 0.7 ? "bg-yellow-500" : "bg-orange-500"
                      }>
                        {Math.round(elder.verificationScore * 100)}% Verified
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Era</div>
                        <div>{elder.approximateEra}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Family Connections</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {elder.familyConnections.map((family, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-50">
                              {family}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => {}}>
                      View Details
                    </Button>
                    <Button size="sm" onClick={() => handleVerificationRequest(elder.id)}>
                      Request Verification
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 py-12 text-center">
                <p className="text-gray-500">No elders found matching your search criteria.</p>
              </div>
            )}
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

export default Elders;
