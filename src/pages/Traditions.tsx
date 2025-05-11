
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Book, Calendar, HeartHandshake, Scroll } from "lucide-react";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";

interface Tradition {
  id: string;
  title: string;
  description: string;
  tribe: string;
  ceremony_type: string;
  significance: string;
  time_period: string;
  image_url?: string;
}

const traditionTypes = [
  "marriage", "naming", "harvest", "initiation", "funeral", "birth", "other"
];

const defaultTraditions: Tradition[] = [
  {
    id: "1",
    title: "Kwanjula",
    description: "The traditional Buganda marriage ceremony where the groom's family visits the bride's family to officially ask for her hand in marriage.",
    tribe: "Baganda",
    ceremony_type: "marriage",
    significance: "Establishes a formal bond between two families and clans",
    time_period: "Can be held any time throughout the year",
    image_url: "https://placekitten.com/800/500"
  },
  {
    id: "2",
    title: "Okwanjula",
    description: "The Banyankole traditional marriage ceremony where the bride price is negotiated and the bride is presented to the groom's family.",
    tribe: "Banyankole",
    ceremony_type: "marriage",
    significance: "Formalizes the union between man and woman within the clan structure",
    time_period: "Typically held during the dry season",
    image_url: "https://placekitten.com/801/500"
  },
  {
    id: "3", 
    title: "Okukyala",
    description: "The pre-visit before the formal introduction ceremony where the groom and a few representatives visit the bride's home informally.",
    tribe: "Baganda",
    ceremony_type: "marriage",
    significance: "Establishes initial contact between the two families",
    time_period: "Usually a few months before Kwanjula",
    image_url: "https://placekitten.com/802/500"
  },
  {
    id: "4",
    title: "Okuhingira",
    description: "The final ceremony of the Banyankole marriage process where the bride is escorted to her new home.",
    tribe: "Banyankole",
    ceremony_type: "marriage",
    significance: "Marks the bride's formal transition into her husband's family",
    time_period: "Follows shortly after the bride price negotiations",
    image_url: "https://placekitten.com/803/500"
  },
  {
    id: "5",
    title: "Okwabya Olumbe",
    description: "The last funeral rite performed to mark the end of the mourning period after someone's death.",
    tribe: "Baganda",
    ceremony_type: "funeral",
    significance: "Releases the family from the mourning period and installs heirs",
    time_period: "Usually held one year after burial",
    image_url: "https://placekitten.com/804/500"
  },
  {
    id: "6",
    title: "Embalu",
    description: "Male circumcision ceremony that marks the transition from boyhood to manhood.",
    tribe: "Bagisu",
    ceremony_type: "initiation",
    significance: "Initiates young men into adulthood and clan membership",
    time_period: "Typically performed in even-numbered years during August",
    image_url: "https://placekitten.com/805/500"
  },
  {
    id: "7",
    title: "Empaako",
    description: "The naming ceremony where a person is given one of the 12 praise names in addition to their given name.",
    tribe: "Batooro",
    ceremony_type: "naming",
    significance: "Signifies belonging to the Tooro culture and establishes clan identity",
    time_period: "Usually given a few days after birth",
    image_url: "https://placekitten.com/806/500"
  },
  {
    id: "8",
    title: "Amakula",
    description: "Harvest thanksgiving ceremony to celebrate a good harvest and give thanks to ancestors.",
    tribe: "Basoga",
    ceremony_type: "harvest",
    significance: "Expresses gratitude for abundance and ensures continued prosperity",
    time_period: "Held after the main harvest season",
    image_url: "https://placekitten.com/807/500"
  }
];

const Traditions = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [traditions, setTraditions] = useState<Tradition[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchTraditions();
  }, [user]);

  const fetchTraditions = async () => {
    setIsLoading(true);
    try {
      // In a production app, we would fetch from the database
      // For now, using the default data
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTraditions(defaultTraditions);
    } catch (error) {
      console.error("Error fetching traditions:", error);
      toast.error("Failed to load cultural traditions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTraditions = traditions.filter(tradition => {
    const matchesTab = activeTab === "all" || tradition.ceremony_type === activeTab;
    const matchesSearch = searchQuery.trim() === "" || 
      tradition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tradition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tradition.tribe.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
            <p className="mb-6">Please login or sign up to access cultural traditions.</p>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black">Cultural Traditions</h1>
            <p className="text-lg text-gray-600 mt-2">
              Explore the rich cultural practices and ceremonies of Ugandan tribes.
            </p>
          </div>
          <div className="mt-4 md:mt-0 relative">
            <input
              type="text"
              placeholder="Search traditions..."
              className="py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
              value={searchQuery}
              onChange={handleSearch}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 absolute top-3 right-3 text-gray-400"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto flex whitespace-nowrap mb-6 bg-white p-1 border border-gray-200 rounded-lg">
            <TabsTrigger value="all" className="flex-1">All Traditions</TabsTrigger>
            {traditionTypes.map(type => (
              <TabsTrigger key={type} value={type} className="flex-1">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <CardHeader>
                      <div className="h-6 w-3/4 bg-gray-200 animate-pulse mb-2"></div>
                      <div className="h-4 w-1/2 bg-gray-200 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-gray-200 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTraditions.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredTraditions.map((tradition) => (
                  <Card key={tradition.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={tradition.image_url || "https://placekitten.com/800/500"} 
                        alt={tradition.title}
                        className="object-cover w-full h-full" 
                      />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center rounded-full bg-uganda-yellow px-2.5 py-0.5 text-xs font-medium text-uganda-black">
                          {tradition.tribe}
                        </span>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle>{tradition.title}</CardTitle>
                      <CardDescription>
                        {tradition.ceremony_type.charAt(0).toUpperCase() + tradition.ceremony_type.slice(1)} Ceremony
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">{tradition.description}</p>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-uganda-red" />
                          <span>{tradition.time_period}</span>
                        </div>
                        <div className="flex items-center">
                          <HeartHandshake className="h-4 w-4 mr-2 text-uganda-red" />
                          <span>{tradition.significance}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10">
                        <Scroll className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Book size={64} className="mx-auto text-gray-300" />
                <h3 className="mt-6 text-2xl font-medium text-gray-600">No Traditions Found</h3>
                <p className="mt-2 text-gray-500">
                  No cultural traditions match your search criteria. Try adjusting your search.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default Traditions;
