
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Cultural } from "@/types";

const SAMPLE_TRIBAL_DATA: Record<string, Cultural[]> = {
  "Baganda": [
    {
      tribe: "Baganda",
      clan: "Mamba",
      practices: ["Totemic reverence of the lungfish", "Clan-specific naming customs", "Annual clan gatherings"],
      ceremonies: ["Okwanjula (Introduction)", "Kwanjula (Marriage Ceremony)", "Naming ceremonies"],
      elders: ["Walusimbi", "Kaboggoza", "Lutaaya"]
    },
    {
      tribe: "Baganda",
      clan: "Ngeye",
      practices: ["Totemic respect for the colobus monkey", "Ancestral worship at clan shrines", "Specific agricultural traditions"],
      ceremonies: ["Kwanjula with clan-specific rituals", "Burial ceremonies", "Coming-of-age rituals"],
      elders: ["Semakula", "Kiyimba", "Nsubuga"]
    }
  ],
  "Banyankole": [
    {
      tribe: "Banyankole",
      clan: "Abasingo",
      practices: ["Cattle-herding traditions", "Milk preservation techniques", "Special greeting customs"],
      ceremonies: ["Okuhingira (Marriage ceremony)", "Cattle blessing ceremonies", "Milk ritual celebrations"],
      elders: ["Mugisha", "Bainomugisha", "Rubahamya"]
    }
  ],
  "Basoga": [
    {
      tribe: "Basoga",
      clan: "Ngobi",
      practices: ["Banana cultivation techniques", "Traditional fishing methods", "Clan governance systems"],
      ceremonies: ["Okwanjula", "Embalu (coming of age)", "Harvest celebrations"],
      elders: ["Waiswa", "Balikowa", "Kirunda"]
    }
  ]
};

const Tribes = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTribe, setActiveTribe] = useState<string>("Baganda");
  const [filteredClans, setFilteredClans] = useState<Cultural[]>([]);

  useEffect(() => {
    const clans = SAMPLE_TRIBAL_DATA[activeTribe] || [];
    if (searchTerm.trim() === "") {
      setFilteredClans(clans);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredClans(
        clans.filter(c => 
          c.clan.toLowerCase().includes(term) || 
          c.practices.some(p => p.toLowerCase().includes(term)) ||
          c.ceremonies.some(c => c.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, activeTribe]);

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
          <section className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-uganda-black">
              Ugandan <span className="text-uganda-red">Tribes & Clans</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 mb-8">
              Explore the rich cultural heritage of Ugandan tribal and clan systems that form the foundation of family identities.
            </p>
            <div className="max-w-md mx-auto">
              <Input
                type="search"
                placeholder="Search for clans, practices, or ceremonies..."
                className="bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </section>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Tabs defaultValue="Baganda" onValueChange={setActiveTribe}>
              <TabsList className="mb-6 overflow-x-auto flex w-full">
                {Object.keys(SAMPLE_TRIBAL_DATA).map((tribe) => (
                  <TabsTrigger key={tribe} value={tribe} className="flex-1">
                    {tribe}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.keys(SAMPLE_TRIBAL_DATA).map((tribe) => (
                <TabsContent key={tribe} value={tribe}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{tribe}</h2>
                    <p className="text-gray-600">
                      {tribe === "Baganda" && "The Baganda are the largest ethnic group in Uganda, primarily residing in the Buganda region. Their social structure is organized around clans, each with its own totem and taboos."}
                      {tribe === "Banyankole" && "The Banyankole people primarily inhabit the southwestern part of Uganda. They are traditionally divided into two groups: the pastoral Bahima and the agricultural Bairu."}
                      {tribe === "Basoga" && "The Basoga are the second-largest ethnic group in Uganda, primarily residing in the eastern region. Their society is organized around clans, with each clan having its own distinct customs."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredClans.length > 0 ? (
                      filteredClans.map((clan, index) => (
                        <Card key={index} className="bg-white">
                          <CardHeader className="bg-uganda-yellow bg-opacity-10">
                            <CardTitle>{clan.clan} Clan</CardTitle>
                            <CardDescription>of the {clan.tribe}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-1">Cultural Practices</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                  {clan.practices.map((practice, i) => (
                                    <li key={i}>{practice}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1">Ceremonies</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                  {clan.ceremonies.map((ceremony, i) => (
                                    <li key={i}>{ceremony}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1">Notable Elders</h4>
                                <div className="flex flex-wrap gap-2">
                                  {clan.elders.map((elder, i) => (
                                    <span key={i} className="inline-block bg-uganda-red bg-opacity-10 text-uganda-red text-xs px-2 py-1 rounded-full">
                                      {elder}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 text-center">
                        <p className="text-gray-500">No clans found matching your search criteria.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
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

export default Tribes;
