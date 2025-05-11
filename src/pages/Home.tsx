
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import FamilyTreeStats from "@/components/FamilyTreeStats";
import FamilyTreeRecommendations from "@/components/FamilyTreeRecommendations";
import { TreeFormData, FamilyTree } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Heart, Dna, Search as SearchIcon, Mail, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Home = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
  const [emailSubscribe, setEmailSubscribe] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };

  const generateFamilyTree = async (formData: TreeFormData) => {
    if (!user) {
      toast.error("Please login to generate a family tree");
      setShowAuth(true);
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || "No active session found");
      }

      // Call our Supabase Edge Function to generate a family tree
      const { data, error } = await supabase.functions.invoke("generate-family-tree", {
        body: {
          surname: formData.surname,
          tribe: formData.tribe,
          clan: formData.clan
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to generate family tree");
      }

      let members = data.members;
      const treeId = data.treeId;

      if (data.fallback) {
        toast.info("Using fallback family tree data. The AI response could not be processed.");
      }

      // Create family tree
      const newTree: FamilyTree = {
        id: treeId,
        userId: user.id,
        surname: formData.surname,
        tribe: formData.tribe,
        clan: formData.clan,
        createdAt: new Date().toISOString(),
        members,
      };

      setFamilyTree(newTree);
      toast.success("Family tree generated successfully!");
    } catch (error) {
      console.error("Error generating family tree:", error);
      toast.error("Failed to generate family tree. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllTrees = () => {
    navigate("/family-trees");
  };
  
  const handleSubscribe = () => {
    if (!emailSubscribe || !emailSubscribe.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    toast.success("Thank you for subscribing to our newsletter!");
    setEmailSubscribe("");
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#333]">
              Discover Your <span className="text-uganda-red">Family Legacy</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 mb-8">
              Connect with your roots and preserve your Ugandan heritage by exploring your family tree through clan and tribal connections.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <Button 
                className="bg-uganda-red hover:bg-uganda-red/90 text-white text-lg py-6 px-8"
                onClick={() => navigate("/family-trees")}
              >
                Start Your Family Tree
              </Button>
              <Button 
                variant="outline"
                className="border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10 text-lg py-6 px-8" 
                onClick={() => navigate("/dna-test")}
              >
                Order DNA Kit
              </Button>
            </div>
            <div className="flex justify-center gap-6">
              <img 
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                alt="Get it on Google Play" 
                className="h-12 cursor-pointer" 
                onClick={() => toast.info("The FamiRoots app is coming soon to Google Play!")}
              />
              <img 
                src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                alt="Download on the App Store" 
                className="h-12 cursor-pointer" 
                onClick={() => toast.info("The FamiRoots app is coming soon to the App Store!")}
              />
            </div>
          </section>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 space-y-6">
              <FamilyTreeForm onSubmit={generateFamilyTree} isLoading={isLoading} />
              
              {familyTree && (
                <>
                  <FamilyTreeStats tree={familyTree} />
                  <FamilyTreeRecommendations />
                </>
              )}
              
              {!familyTree && (
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg font-medium text-gray-700">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                      onClick={handleViewAllTrees}
                    >
                      <Users className="h-4 w-4 mr-2" /> View All Family Trees
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                      onClick={() => navigate("/relationship-analyzer")}
                    >
                      <Search className="h-4 w-4 mr-2" /> Relationship Analyzer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                      onClick={() => navigate("/tribes")}
                    >
                      <Heart className="h-4 w-4 mr-2" /> Explore Tribes & Clans
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left border-uganda-yellow text-uganda-black hover:bg-uganda-yellow/10"
                      onClick={() => navigate("/dna-test")}
                    >
                      <Dna className="h-4 w-4 mr-2" /> DNA Testing
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="w-full md:w-2/3">
              {familyTree ? (
                <FamilyTreeDisplay tree={familyTree} />
              ) : (
                <Card className="bg-white border border-gray-200 shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-[#F1F0FB] rounded-full flex items-center justify-center mb-6">
                    <Users size={32} className="text-uganda-red" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-[#333]">Create Your Family Tree</h2>
                  <p className="text-gray-600 max-w-md mb-6">
                    Fill out the form with your family's details to generate your clan-based family tree. 
                    Preserve your heritage for generations to come.
                  </p>
                  {!user && (
                    <div className="mt-4 p-4 border border-uganda-yellow/20 rounded-md bg-uganda-yellow/5 w-full max-w-md">
                      <p className="text-sm text-gray-600">
                        <button 
                          onClick={handleLogin}
                          className="text-uganda-red font-medium hover:underline"
                        >
                          Login
                        </button>
                        {" or "}
                        <button 
                          onClick={handleSignup}
                          className="text-uganda-red font-medium hover:underline"
                        >
                          Sign up
                        </button>
                        {" to save your family tree for future access"}
                      </p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          <section className="mt-20">
            <h2 className="text-3xl font-bold mb-12 text-center text-[#333]">How FamiRoots Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-uganda-red">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#333]">Enter Family Information</h3>
                  <p className="text-gray-600">
                    Provide your surname, tribe, and clan information to establish your heritage foundation. Add details about family members and relationships.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-uganda-red">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#333]">AI-Powered Generation</h3>
                  <p className="text-gray-600">
                    Our AI analyzes Ugandan tribal and clan structures to build a culturally accurate family tree in an interactive sun chart format.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-uganda-red">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#333]">Preserve Your Heritage</h3>
                  <p className="text-gray-600">
                    Save, share, and explore your family connections through generations of Ugandan history. Add photos, stories, and DNA results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
          
          <section className="my-20 bg-uganda-yellow/10 py-16 px-6 md:px-12 rounded-lg">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-uganda-black">Ready to discover your family history?</h2>
              <p className="text-lg mb-8 text-gray-700">
                Join thousands of Ugandans who have already uncovered their ancestral connections through FamiRoots. 
                Start building your family tree today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  className="bg-uganda-red hover:bg-uganda-red/90 text-white text-lg py-6 px-8"
                  onClick={() => !user ? setShowAuth(true) : navigate("/family-trees")}
                >
                  Start Your Family Tree
                </Button>
                <Button 
                  variant="outline"
                  className="border-uganda-black text-uganda-black hover:bg-black/5 text-lg py-6 px-8" 
                  onClick={() => navigate("/dna-test")}
                >
                  Explore DNA Testing
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-[#333] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-uganda-yellow">FamiRoots</h3>
              <p className="text-sm text-gray-300 mb-4">
                Preserving Ugandan Family Heritage through advanced genealogy and cutting-edge DNA technology.
              </p>
              <div className="flex gap-3">
                <a href="#" className="bg-[#1da1f2] hover:bg-[#1da1f2]/80 p-2 rounded-full" title="Twitter/X">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="bg-[#1877f2] hover:bg-[#1877f2]/80 p-2 rounded-full" title="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="bg-[#0077b5] hover:bg-[#0077b5]/80 p-2 rounded-full" title="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="bg-[#ff0000] hover:bg-[#ff0000]/80 p-2 rounded-full" title="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="bg-pink-600 hover:bg-pink-600/80 p-2 rounded-full" title="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-uganda-yellow">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white text-sm flex items-center" onClick={() => navigate("/")}>
                    <ChevronRight className="h-3 w-3 mr-1" /> Home
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white text-sm flex items-center" onClick={() => navigate("/family-trees")}>
                    <ChevronRight className="h-3 w-3 mr-1" /> Family Trees
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white text-sm flex items-center" onClick={() => navigate("/tribes")}>
                    <ChevronRight className="h-3 w-3 mr-1" /> Tribes & Clans
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white text-sm flex items-center" onClick={() => navigate("/dna-test")}>
                    <ChevronRight className="h-3 w-3 mr-1" /> DNA Testing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white text-sm flex items-center" onClick={() => navigate("/relationship-analyzer")}>
                    <ChevronRight className="h-3 w-3 mr-1" /> Relationship Analyzer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-uganda-yellow">Contact Us</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-300">
                  <Mail className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>info@famiroots.com</span>
                </li>
                <li className="text-sm text-gray-300 mt-4">
                  <p className="mb-2">Download the FamiRoots App:</p>
                  <div className="flex flex-col gap-2">
                    <img 
                      src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                      alt="Get it on Google Play" 
                      className="h-10 w-auto" 
                    />
                    <img 
                      src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                      alt="Download on the App Store" 
                      className="h-8 w-auto" 
                    />
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-uganda-yellow">Newsletter</h3>
              <p className="text-sm text-gray-300 mb-4">
                Subscribe to our newsletter for the latest updates on features, tribal information, and heritage preservation tips.
              </p>
              <div className="flex">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="rounded-r-none bg-white/10 border-white/20 text-white"
                  value={emailSubscribe}
                  onChange={(e) => setEmailSubscribe(e.target.value)}
                />
                <Button 
                  className="rounded-l-none bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                  onClick={handleSubscribe}
                >
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} FamiRoots - Preserving Ugandan Family Heritage
            </p>
          </div>
        </div>
      </footer>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default Home;
