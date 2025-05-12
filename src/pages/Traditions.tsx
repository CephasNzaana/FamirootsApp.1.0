
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import { Calendar, Book, Music, Users, Star, Search, Plus } from "lucide-react";

interface TraditionType {
  id: string;
  name: string;
  description: string;
  category: string;
  tribe: string;
  image?: string;
}

const traditionCategories = [
  { id: "ceremonies", name: "Ceremonies", icon: <Calendar className="h-5 w-5" /> },
  { id: "customs", name: "Customs & Practices", icon: <Book className="h-5 w-5" /> },
  { id: "music", name: "Music & Dance", icon: <Music className="h-5 w-5" /> },
  { id: "marriage", name: "Marriage Customs", icon: <Users className="h-5 w-5" /> },
  { id: "rites", name: "Rites of Passage", icon: <Star className="h-5 w-5" /> },
];

// Sample traditions data - in a real app, this would come from the database
const sampleTraditions: TraditionType[] = [
  {
    id: "trad1",
    name: "Kwanjula",
    description: "Kwanjula is a traditional marriage ceremony in Buganda culture where the groom formally visits the bride's family to ask for her hand in marriage. The ceremony involves gift-giving, cultural performances, and negotiations between the two families.",
    category: "ceremonies",
    tribe: "Baganda",
    image: "https://images.unsplash.com/photo-1638442425662-dac7917762d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8a3dhbmp1bGF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad2",
    name: "Ekitaguriro",
    description: "Ekitaguriro is a traditional dance performed by the Banyankole tribe of Uganda. It is characterized by high jumps and is performed during ceremonies, especially weddings. The dancers raise their arms to display agility and strength.",
    category: "music",
    tribe: "Banyankole",
    image: "https://images.unsplash.com/photo-1613763051807-f35f8f9ded2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWZyaWNhbiUyMGRhbmNlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad3",
    name: "Imbalu",
    description: "Imbalu is a traditional male circumcision ritual practiced by the Bagisu people of eastern Uganda. It marks the transition from boyhood to manhood and is performed during even-numbered years. The candidates dance and display courage during the ceremony.",
    category: "rites",
    tribe: "Bagisu",
    image: "https://images.unsplash.com/photo-1518049362265-d5b2a6e911b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWZyaWNhbiUyMHJpdHVhbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad4",
    name: "Okwanjula",
    description: "Okwanjula is an introduction ceremony in various Ugandan tribes where the bride introduces her fiancé to her family. This formal ceremony often involves negotiation of bride price and is a precursor to the traditional wedding.",
    category: "marriage",
    tribe: "Multiple tribes",
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YWZyaWNhbiUyMGNlcmVtb255fGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad5",
    name: "Amakungula",
    description: "Amakungula is a harvest festival celebrated by the Basoga people of Uganda. It's a time of thanksgiving for a successful harvest, featuring communal feasting, traditional music, and dancing to honor the ancestors and thank the gods for blessing the harvest.",
    category: "ceremonies",
    tribe: "Basoga",
    image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGFydmVzdCUyMGZlc3RpdmFsfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad6",
    name: "Larakaraka Dance",
    description: "Larakaraka is a courtship dance performed by the Acholi people of northern Uganda. Young men and women participate in this dance as a way to find suitable partners. The dance involves rhythmic movements and singing, showcasing the participants' vitality and coordination.",
    category: "music",
    tribe: "Acholi",
    image: "https://images.unsplash.com/photo-1545315003-c5ad6226c272?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YWZyaWNhbiUyMGRhbmNlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad7",
    name: "Empaako",
    description: "Empaako is a naming tradition practiced by the Batooro, Banyoro, and Batuku people. It involves giving a child one of the twelve praise names in addition to their given name. These names carry special meaning and are used to show respect and strengthen social bonds.",
    category: "customs",
    tribe: "Batooro, Banyoro",
    image: "https://images.unsplash.com/photo-1601062138836-c90756d8dce9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YWZyaWNhbiUyMG5hbWluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad8",
    name: "Kuhingira",
    description: "Kuhingira is a traditional wedding ceremony among the Bakiga and Banyankole people. It follows the payment of bride price and features cultural dances, gift exchanges, and feasting. The bride is symbolically handed over to the groom's family during this ceremony.",
    category: "marriage",
    tribe: "Bakiga, Banyankole",
    image: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWZyaWNhbiUyMHdlZGRpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad9",
    name: "Twin Ceremonies",
    description: "Special ceremonies for twins are performed by many Ugandan tribes, particularly the Baganda. Twins are considered special and are given specific names like Waswa and Kato for boys or Babirye and Nakato for girls. These ceremonies are meant to bring blessings and ward off bad luck.",
    category: "rites",
    tribe: "Baganda",
    image: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YWZyaWNhbiUyMGNlcmVtb255fGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
  },
  {
    id: "trad10",
    name: "Entaango",
    description: "Entaango is a naming ceremony for babies in Ankole culture. It is performed a few days after birth and involves the paternal aunt (ssenga) naming the child. The ceremony includes prayers, blessings, and communal feasting to welcome the new member of the family.",
    category: "customs",
    tribe: "Banyankole",
    image: "https://images.unsplash.com/photo-1530097811984-a43d1c6d34ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGFmcmljYW4lMjBjZXJlbW9ueXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
  }
];

const Traditions = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTribe, setSelectedTribe] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [traditions, setTraditions] = useState<TraditionType[]>(sampleTraditions);
  const [filteredTraditions, setFilteredTraditions] = useState<TraditionType[]>(traditions);
  const [featuredTraditions, setFeaturedTraditions] = useState<TraditionType[]>([]);

  useEffect(() => {
    // In a real app, we would fetch this data from the database
    // For now, we're using the sample data
    setTraditions(sampleTraditions);
    
    // Set featured traditions (random selection of 5)
    const shuffled = [...sampleTraditions].sort(() => 0.5 - Math.random());
    setFeaturedTraditions(shuffled.slice(0, 5));
    
    // Apply initial filtering
    filterTraditions(selectedCategory, selectedTribe, searchQuery);
  }, []);

  const filterTraditions = (category: string, tribe: string, query: string) => {
    let filtered = [...traditions];
    
    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter(trad => trad.category === category);
    }
    
    // Filter by tribe
    if (tribe !== "all") {
      filtered = filtered.filter(trad => trad.tribe === tribe || trad.tribe.includes(tribe));
    }
    
    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(trad => 
        trad.name.toLowerCase().includes(lowercaseQuery) || 
        trad.description.toLowerCase().includes(lowercaseQuery) ||
        trad.tribe.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    setFilteredTraditions(filtered);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterTraditions(category, selectedTribe, searchQuery);
  };

  const handleTribeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tribe = event.target.value;
    setSelectedTribe(tribe);
    filterTraditions(selectedCategory, tribe, searchQuery);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterTraditions(selectedCategory, selectedTribe, query);
  };

  const handleAddTradition = () => {
    if (!user) {
      toast.error("Please login to add a tradition");
      setShowAuth(true);
      return;
    }
    
    toast.info("Add Tradition feature will be available soon!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-uganda-black">
              Ugandan Cultural <span className="text-uganda-red">Traditions</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 mb-8">
              Explore and preserve the rich cultural heritage of Ugandan tribes through their unique customs, ceremonies, and traditions.
            </p>
          </section>
          
          {/* Featured Traditions Carousel */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-uganda-black">Featured Traditions</h2>
            <Carousel>
              <CarouselContent>
                {featuredTraditions.map((tradition) => (
                  <CarouselItem key={tradition.id} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full overflow-hidden border-2 hover:border-uganda-yellow transition-all">
                      <div className="relative h-48 overflow-hidden">
                        {tradition.image ? (
                          <img 
                            src={tradition.image} 
                            alt={tradition.name} 
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-uganda-yellow/20 to-uganda-red/20 flex items-center justify-center">
                            <span className="text-uganda-black">{tradition.name}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                          <h3 className="font-bold">{tradition.name}</h3>
                          <p className="text-sm">{tradition.tribe}</p>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <Badge className="mb-2" variant="outline">{traditionCategories.find(cat => cat.id === tradition.category)?.name}</Badge>
                        <p className="text-sm line-clamp-3">{tradition.description}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-1" />
              <CarouselNext className="right-1" />
            </Carousel>
          </section>
          
          {/* Traditions Explorer */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-uganda-black">Traditions Explorer</h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search traditions..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedTribe}
                  onChange={handleTribeChange}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
                >
                  <option value="all">All Tribes</option>
                  {ugandaTribesData.map((tribe) => (
                    <option key={tribe.name} value={tribe.name}>
                      {tribe.name}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={handleAddTradition} 
                  className="bg-uganda-red text-white hover:bg-uganda-red/90"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Tradition
                </Button>
              </div>
            </div>
            
            <div className="mb-8">
              <Tabs defaultValue="all" onValueChange={handleCategoryChange}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Categories</TabsTrigger>
                  {traditionCategories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className="hidden sm:flex items-center gap-2">
                      {category.icon}
                      {category.name}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="mobile-dropdown" className="sm:hidden">
                    Categories
                  </TabsTrigger>
                </TabsList>
                
                {traditionCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTraditions
                        .filter(trad => trad.category === category.id)
                        .map((tradition) => (
                          <TraditionCard key={tradition.id} tradition={tradition} />
                        ))}
                    </div>
                    
                    {filteredTraditions.filter(trad => trad.category === category.id).length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-lg text-gray-500">No traditions found for this category and filter combination.</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSelectedTribe("all");
                            setSearchQuery("");
                            filterTraditions(category.id, "all", "");
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                ))}
                
                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTraditions.map((tradition) => (
                      <TraditionCard key={tradition.id} tradition={tradition} />
                    ))}
                  </div>
                  
                  {filteredTraditions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-lg text-gray-500">No traditions found matching your filters.</p>
                      <Button 
                        variant="link" 
                        onClick={() => {
                          setSelectedTribe("all");
                          setSearchQuery("");
                          filterTraditions("all", "all", "");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="mobile-dropdown" className="sm:hidden">
                  <div className="mb-6">
                    <select
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="all">All Categories</option>
                      {traditionCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {filteredTraditions.map((tradition) => (
                      <TraditionCard key={tradition.id} tradition={tradition} />
                    ))}
                  </div>
                  
                  {filteredTraditions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-lg text-gray-500">No traditions found matching your filters.</p>
                      <Button 
                        variant="link" 
                        onClick={() => {
                          setSelectedTribe("all");
                          setSearchQuery("");
                          filterTraditions("all", "all", "");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

// Tradition Card Component
const TraditionCard: React.FC<{tradition: TraditionType}> = ({ tradition }) => {
  const categoryIcon = traditionCategories.find(cat => cat.id === tradition.category)?.icon;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        {tradition.image ? (
          <img 
            src={tradition.image} 
            alt={tradition.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-uganda-yellow/20 to-uganda-red/20 flex items-center justify-center">
            <span className="text-uganda-black">{tradition.name}</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={`${tradition.category === 'ceremonies' ? 'bg-blue-500' : 
            tradition.category === 'customs' ? 'bg-green-500' : 
            tradition.category === 'music' ? 'bg-purple-500' : 
            tradition.category === 'marriage' ? 'bg-pink-500' : 
            'bg-orange-500'} text-white`}>
            <div className="flex items-center gap-1">
              {categoryIcon}
              {traditionCategories.find(cat => cat.id === tradition.category)?.name}
            </div>
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pt-4 pb-2">
        <CardTitle className="text-lg">{tradition.name}</CardTitle>
        <CardDescription>Practiced by: {tradition.tribe}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm line-clamp-3">{tradition.description}</p>
      </CardContent>
      
      <div className="px-6 pb-4 flex justify-end">
        <Button variant="link" className="text-uganda-red p-0">
          Read more
        </Button>
      </div>
    </Card>
  );
};

export default Traditions;
