
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const Tribes = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [selectedTribe, setSelectedTribe] = useState<string | null>(null);
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-uganda-black">Ugandan Tribes & Clans</h1>
        <p className="text-lg mb-8 max-w-3xl">
          Explore the rich cultural heritage of Uganda's tribal and clan systems. Discover information about major tribes, 
          their clan structures, and significant elders who have shaped Uganda's history.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Tribes of Uganda</CardTitle>
                <CardDescription>Select a tribe to explore its clans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ugandaTribesData.map(tribe => (
                    <button
                      key={tribe.id}
                      onClick={() => setSelectedTribe(tribe.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTribe === tribe.id 
                          ? "bg-uganda-yellow/30 border-l-4 border-uganda-yellow" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium">{tribe.name}</div>
                      <div className="text-sm text-gray-500">{tribe.region}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {selectedTribe ? (
              (() => {
                const tribe = ugandaTribesData.find(t => t.id === selectedTribe);
                if (!tribe) return <p>Tribe not found</p>;
                
                return (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl">{tribe.name}</CardTitle>
                          <Badge className="bg-uganda-yellow text-uganda-black">{tribe.region}</Badge>
                        </div>
                        {tribe.language && (
                          <CardDescription>
                            Language: {tribe.language} {tribe.population && `• Population: ~${tribe.population}`}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">{tribe.description}</p>
                        
                        <div className="mt-6">
                          <h3 className="text-xl font-semibold mb-4">Clans of the {tribe.name}</h3>
                          
                          <Accordion type="single" collapsible className="w-full">
                            {tribe.clans.map(clan => (
                              <AccordionItem key={clan.id} value={clan.id}>
                                <AccordionTrigger className="hover:bg-gray-100 px-4 rounded-lg">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <span>{clan.name}</span>
                                    {clan.totem && <span className="text-sm text-gray-500">Totem: {clan.totem}</span>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                  {clan.origin && <p className="mb-2 text-gray-700">{clan.origin}</p>}
                                  
                                  <h4 className="font-medium mt-4 mb-2">Notable Elders:</h4>
                                  <div className="space-y-3">
                                    {clan.elders.map(elder => (
                                      <div 
                                        key={elder.id} 
                                        className="bg-white p-3 rounded-lg border-l-4 border-uganda-yellow shadow-sm"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{elder.name}</span>
                                          <Badge variant="outline" className="ml-2 bg-uganda-yellow/20">
                                            {elder.approximateEra}
                                          </Badge>
                                        </div>
                                        {elder.notes && <p className="text-sm mt-1 text-gray-600">{elder.notes}</p>}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {clan.culturalPractices && clan.culturalPractices.length > 0 && (
                                    <>
                                      <h4 className="font-medium mt-4 mb-2">Cultural Practices:</h4>
                                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                        {clan.culturalPractices.map((practice, i) => (
                                          <li key={i}>{practice}</li>
                                        ))}
                                      </ul>
                                    </>
                                  )}

                                  <div className="mt-6">
                                    <Button 
                                      onClick={() => navigate(`/clans/${tribe.id}/${clan.id}`)}
                                      className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      View Elder Family Connections
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-uganda-yellow/30 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-1">Select a Tribe</h3>
                  <p className="text-gray-500">Choose a tribe from the list to view detailed information about its clans and elders</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default Tribes;
