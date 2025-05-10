
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { Users, Book, ArrowRight } from "lucide-react";

const Tribes = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  
  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };
  
  const handleViewClan = (tribeId: string, clanId: string) => {
    navigate(`/clans/${tribeId}/${clanId}`);
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
              Ugandan <span className="text-uganda-red">Tribes & Clans</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
              Explore the rich heritage and cultural structure of Uganda's major tribes and their clan systems.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ugandaTribesData.map((tribe) => (
              <Card key={tribe.id} className="bg-white shadow-lg border-uganda-black">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">{tribe.name}</CardTitle>
                    <Badge className="bg-uganda-yellow text-uganda-black">{tribe.region}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700 mb-4">{tribe.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1 text-uganda-red" />
                      <span>Population: {tribe.population || 'Unknown'}</span>
                    </div>
                    {tribe.language && (
                      <div className="flex items-center text-sm">
                        <Book className="h-4 w-4 mr-1 text-uganda-red" />
                        <span>Language: {tribe.language}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold mb-2 text-lg">Clans of the {tribe.name}</h3>
                  
                  <ScrollArea className="h-64 rounded-md border p-2">
                    <Accordion type="single" collapsible className="w-full">
                      {tribe.clans.map((clan) => (
                        <AccordionItem key={clan.id} value={clan.id}>
                          <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-md">
                            {clan.name} Clan
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pt-2">
                            {clan.totem && (
                              <div className="text-sm mb-2">
                                <span className="font-medium">Totem:</span> {clan.totem}
                              </div>
                            )}
                            {clan.origin && (
                              <div className="text-sm mb-2">
                                <span className="font-medium">Origin:</span> {clan.origin.substring(0, 100)}
                                {clan.origin.length > 100 ? '...' : ''}
                              </div>
                            )}
                            <div className="text-sm mb-2">
                              <span className="font-medium">Elders:</span> {clan.elders.length}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewClan(tribe.id, clan.id)}
                              className="mt-2 w-full hover:bg-uganda-red hover:text-white transition-colors flex items-center justify-between"
                            >
                              <span>View Clan Family Tree</span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
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
