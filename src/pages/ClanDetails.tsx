
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tribe, Clan } from "@/types";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";
import ClanFamilyTree from "@/components/ClanFamilyTree";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AuthForm from "@/components/AuthForm";

const ClanDetails = () => {
  const { tribeId, clanId } = useParams();
  const navigate = useNavigate();
  const [clan, setClan] = useState<Clan | null>(null);
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Find the tribe and clan from the data
    const foundTribe = ugandaTribesData.find(t => t.id === tribeId);
    
    if (!foundTribe) {
      toast.error("Tribe not found");
      navigate("/tribes");
      return;
    }
    
    const foundClan = foundTribe.clans.find(c => c.id === clanId);
    
    if (!foundClan) {
      toast.error("Clan not found");
      navigate(`/tribes`);
      return;
    }
    
    setTribe(foundTribe);
    setClan(foundClan);
  }, [tribeId, clanId, navigate]);
  
  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };
  
  if (!clan || !tribe) {
    return (
      <div className="min-h-screen bg-[#FAF6F1]">
        <Header onLogin={handleLogin} onSignup={handleSignup} />
        <div className="container mx-auto py-8 px-4">
          <div className="h-64 flex items-center justify-center">
            <p>Loading clan information...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main className="container mx-auto py-8 px-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/tribes")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tribes
        </Button>
        
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{clan.name} Clan</CardTitle>
                  <CardDescription>
                    {tribe.name} Tribe | {clan.totem && `Totem: ${clan.totem}`}
                  </CardDescription>
                </div>
                <Badge className="bg-uganda-yellow text-uganda-black">{tribe.region}</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {clan.origin && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Origin</h3>
                  <p className="text-gray-700">{clan.origin}</p>
                </div>
              )}
              
              {clan.culturalPractices && clan.culturalPractices.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Cultural Practices</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {clan.culturalPractices.map((practice, i) => (
                      <li key={i}>{practice}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Elder Family Connections</h2>
            <p className="text-gray-700">
              The family tree below shows how the elders of the {clan.name} clan are related to each other.
              Understanding these relationships is crucial for comprehending the clan structure and heritage.
            </p>
            
            <ClanFamilyTree clan={clan} />
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

export default ClanDetails;
