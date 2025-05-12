
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Map, Landmark, Users } from "lucide-react";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";

const CulturalResources = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header onLogin={() => setShowAuth(true)} onSignup={() => setShowAuth(true)} />

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black mb-4">
              Ugandan Cultural Resources
            </h1>
            <p className="text-lg text-gray-600">
              Discover and explore the rich cultural heritage of Uganda through our comprehensive collection of resources.
            </p>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6 grid grid-cols-4 w-full max-w-3xl">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex items-center gap-2">
                <Map size={16} />
                <span>Regions</span>
              </TabsTrigger>
              <TabsTrigger value="traditions" className="flex items-center gap-2">
                <Landmark size={16} />
                <span>Traditions</span>
              </TabsTrigger>
              <TabsTrigger value="clans" className="flex items-center gap-2">
                <Users size={16} />
                <span>Clans</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>The Cultural Heritage of Uganda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Uganda is a culturally diverse country with a rich heritage spanning numerous tribes,
                    clans, and traditions. The cultural resources provided here aim to help you explore 
                    and understand this heritage, connecting you with your ancestral roots.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <h3 className="font-semibold text-lg mb-2">56+ Distinct Tribes</h3>
                      <p className="text-gray-700 mb-4">
                        Uganda is home to more than 56 distinct ethnic groups, each with its own language,
                        customs, and traditions.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                      >
                        Explore Tribes
                      </Button>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <h3 className="font-semibold text-lg mb-2">Clan Systems</h3>
                      <p className="text-gray-700 mb-4">
                        Clans form the backbone of Ugandan social structure, with each tribe having its own
                        unique clan system and organization.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                      >
                        Discover Clans
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Featured Cultural Elements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-semibold mb-2">Traditional Music & Dance</h3>
                      <p className="text-sm text-gray-600">
                        Explore the diverse rhythms and movements that tell stories of Uganda's heritage.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-semibold mb-2">Crafts & Artistry</h3>
                      <p className="text-sm text-gray-600">
                        Discover the skilled craftsmanship behind traditional Ugandan art forms.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-semibold mb-2">Oral Traditions</h3>
                      <p className="text-sm text-gray-600">
                        Learn about the storytelling traditions that have preserved history across generations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regions">
              <Card>
                <CardHeader>
                  <CardTitle>Cultural Regions of Uganda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-6">
                    Uganda can be divided into several cultural regions, each home to distinct tribal groups
                    with their own traditions and heritage.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Central Region (Buganda)</h3>
                      <p>
                        Home to the Baganda people and the historical Buganda Kingdom, the most influential
                        traditional kingdom in Uganda.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Western Region</h3>
                      <p>
                        Features the Ankole, Tooro, and Bunyoro kingdoms, with distinct pastoral and agricultural traditions.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Eastern Region</h3>
                      <p>
                        Includes the Basoga, Bagisu, and other tribes with unique cultural practices and rituals.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Northern Region</h3>
                      <p>
                        Home to Nilotic peoples including the Acholi, Lango, and Karamojong with their unique heritage and customs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traditions">
              <Card>
                <CardHeader>
                  <CardTitle>Traditional Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-6">
                    Uganda's cultural richness is expressed through numerous traditional practices that have been
                    preserved over generations. Here are some key aspects:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Ceremonies & Rituals</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Birth ceremonies</li>
                        <li>Naming traditions</li>
                        <li>Coming-of-age rituals</li>
                        <li>Marriage customs</li>
                        <li>Funeral practices</li>
                      </ul>
                      <Button className="mt-4 bg-uganda-red text-white hover:bg-uganda-red/90">
                        Explore Ceremonies
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Cultural Expressions</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Traditional music and instruments</li>
                        <li>Folk dances</li>
                        <li>Storytelling traditions</li>
                        <li>Arts and crafts</li>
                        <li>Traditional attire</li>
                      </ul>
                      <Button className="mt-4 bg-uganda-yellow text-black hover:bg-uganda-yellow/90 font-medium">
                        Discover Cultural Arts
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clans">
              <Card>
                <CardHeader>
                  <CardTitle>Clan Systems in Uganda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-6">
                    Clans are the foundation of traditional social organization in Uganda. Each tribe has its own
                    clan system that defines relationships, marriage rules, and cultural practices.
                  </p>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Clan Structure</h3>
                      <p className="mb-4">
                        Most Ugandan clans are patrilineal, with membership and inheritance passed through the father's
                        lineage. Clans often have:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Unique totems (animals, plants, or objects) that members identify with</li>
                        <li>Specific taboos and restrictions</li>
                        <li>Origin stories and migration histories</li>
                        <li>Traditional roles within the tribe</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Exploring Your Clan Heritage</h3>
                      <p>
                        Understanding your clan heritage can provide deep insights into your family's history and
                        cultural practices. Use our tools to explore and document your clan connections.
                      </p>
                      <div className="flex gap-4 mt-4">
                        <Button className="bg-uganda-yellow text-black hover:bg-uganda-yellow/90 font-medium">
                          Find Your Clan
                        </Button>
                        <Button variant="outline" className="border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10">
                          View Clan Database
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      
      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default CulturalResources;
