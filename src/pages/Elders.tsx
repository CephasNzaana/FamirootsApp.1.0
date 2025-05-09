
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { type ClanElder } from "@/types";

const Elders = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTribe, setSelectedTribe] = useState<string>("");
  const [selectedClan, setSelectedClan] = useState<string>("");

  // Flatten all elders for searching
  const allElders = ugandaTribesData.flatMap(tribe => 
    tribe.clans.flatMap(clan => 
      clan.elders.map(elder => ({
        ...elder,
        clanName: clan.name,
        clanId: clan.id,
        tribeName: tribe.name,
        tribeId: tribe.id
      }))
    )
  );

  // Filter elders based on search and filters
  const filteredElders = allElders.filter(elder => {
    const matchesSearch = searchTerm === "" || 
      elder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      elder.clanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      elder.tribeName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTribe = selectedTribe === "" || elder.tribeId === selectedTribe;
    const matchesClan = selectedClan === "" || elder.clanId === selectedClan;
    
    return matchesSearch && matchesTribe && matchesClan;
  });
  
  const availableClans = selectedTribe 
    ? ugandaTribesData.find(tribe => tribe.id === selectedTribe)?.clans || []
    : [];

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
            <p className="mb-6">Please login or sign up to access the Elder Database.</p>
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
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-uganda-black">Elder Database</h1>
          <p className="text-lg mb-8">
            Access verified information about clan elders across Uganda's tribal systems. This database preserves 
            ancestral knowledge and helps establish familial connections through elder verification.
          </p>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Elders</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search by Name</label>
                <Input
                  type="text"
                  placeholder="Search elders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Tribe</label>
                <Select
                  value={selectedTribe}
                  onValueChange={(value) => {
                    setSelectedTribe(value);
                    setSelectedClan("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Tribes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-tribes">All Tribes</SelectItem>
                    {ugandaTribesData.map(tribe => (
                      <SelectItem key={tribe.id} value={tribe.id}>
                        {tribe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Clan</label>
                <Select
                  value={selectedClan}
                  onValueChange={setSelectedClan}
                  disabled={!selectedTribe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Clans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-clans">All Clans</SelectItem>
                    {availableClans.map(clan => (
                      <SelectItem key={clan.id} value={clan.id}>
                        {clan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-uganda-yellow/20 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Elder Records</h2>
              <span className="text-sm">{filteredElders.length} records found</span>
            </div>
            
            {filteredElders.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredElders.map(elder => (
                  <div key={`${elder.id}-${elder.clanId}-${elder.tribeId}`} className="p-4 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{elder.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>Tribe: {elder.tribeName}</span>
                          <span className="mx-2">•</span>
                          <span>Clan: {elder.clanName}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-2 md:mt-0 space-x-2">
                        <Badge className="bg-uganda-yellow text-uganda-black">
                          {elder.approximateEra}
                        </Badge>
                        
                        <div className="border px-2 py-1 rounded-lg text-xs flex items-center">
                          <span className="font-semibold">Verification Score:</span>
                          <span className={`ml-1 ${
                            elder.verificationScore >= 90 ? 'text-green-600' : 
                            elder.verificationScore >= 80 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {elder.verificationScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {elder.notes && (
                      <div className="mt-2 text-sm italic text-gray-600 bg-gray-50 p-2 rounded">
                        "{elder.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No elders found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Elders;
