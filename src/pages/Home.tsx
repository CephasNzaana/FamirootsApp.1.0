import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import FamilyTreeForm from "@/components/FamilyTreeForm";
import FamilyTreeDisplay from "@/components/FamilyTreeDisplay";
import { TreeFormData, FamilyTree } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import TreeLogo from "@/components/ui/Logo.png";
import { Facebook, Twitter, Instagram, Youtube, ArrowUp, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Home = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing to our newsletter!");
      setEmail("");
    } else {
      toast.error("Please enter a valid email address");
    }
  };

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
    console.log("Starting family tree generation with data:", formData);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || "No active session found");
      }

      console.log("Session found, calling edge function...");

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

      console.log("Edge function response:", data, "Error:", error);

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
              Discover Your <span className="text-uganda-red">Family Legacy</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600">
              Connect with your roots and preserve your Ugandan heritage by exploring your family tree through clan and tribal connections.
            </p>
          </section>

          <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
            <div className="w-full md:w-1/3">
              <FamilyTreeForm onSubmit={generateFamilyTree} isLoading={isLoading} />
            </div>
            
            <div className="w-full md:w-2/3">
              {familyTree ? (
                <FamilyTreeDisplay tree={familyTree} />
              ) : (
                <div className="bg-white bg-opacity-80 rounded-lg p-6 text-center border-2 border-uganda-black shadow-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-uganda-yellow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-uganda-black">Your Family Tree</h2>
                    <p className="text-gray-600">
                      Fill out the form with your family's details to generate your clan-based family tree.
                    </p>
                  </div>
                  {!user && (
                    <p className="text-sm text-gray-500 mt-4">
                      <button 
                        onClick={handleLogin}
                        className="text-uganda-red hover:underline"
                      >
                        Login
                      </button>
                      {" or "}
                      <button 
                        onClick={handleSignup}
                        className="text-uganda-red hover:underline"
                      >
                        Sign up
                      </button>
                      {" to save your family tree"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <section className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-6 text-uganda-black">How FamiRoots Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Enter Family Information</h3>
                <p className="text-gray-600">
                  Provide your surname, tribe, and clan information to establish your heritage foundation
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Generation</h3>
                <p className="text-gray-600">
                  Our AI analyzes Ugandan tribal and clan structures to build a culturally accurate family tree
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-2 border-uganda-black">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-lg">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Preserve Your Heritage</h3>
                <p className="text-gray-600">
                  Save, share, and explore your family connections through generations of Ugandan history
                </p>
              </div>
            </div>
          </section>

          {/* Newsletter Signup Section */}
          <section className="mt-16 bg-uganda-black text-white p-8 rounded-lg">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Sign up for the FamiRoots Newsletter</h2>
              <p className="mb-6">Get updates on new features, cultural events, and tips for preserving your family heritage.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="px-4 py-2 rounded-lg flex-grow max-w-md text-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                  Subscribe
                </Button>
              </form>
            </div>
          </section>

          {/* Mobile App Download Section */}
          <section className="mt-16 text-center p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-uganda-black">Download the FamiRoots App</h2>
            <p className="mb-6 text-gray-600">Explore your family heritage on the go with our mobile app</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#" className="inline-block">
                <img 
                  src="/api/placeholder/200/60" 
                  alt="Download on the App Store" 
                  className="h-12"
                />
              </a>
              <a href="#" className="inline-block">
                <img 
                  src="/api/placeholder/200/60" 
                  alt="Get it on Google Play" 
                  className="h-12"
                />
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-uganda-black text-white py-8 mt-12 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start mb-4">
                <TreeLogo />
              </div>
              <h3 className="text-xl font-bold mb-2">FamiRoots</h3>
              <p className="text-sm">Preserving Ugandan Family Heritage</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-uganda-yellow">About Us</a></li>
                <li><a href="#" className="hover:text-uganda-yellow">Family Trees</a></li>
                <li><a href="#" className="hover:text-uganda-yellow">Tribes & Clans</a></li>
                <li><a href="#" className="hover:text-uganda-yellow">Elder Database</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a href="#" aria-label="Facebook">
                  <Facebook className="h-6 w-6 hover:text-uganda-yellow" />
                </a>
                <a href="#" aria-label="Twitter/X">
                  <Twitter className="h-6 w-6 hover:text-uganda-yellow" />
                </a>
                <a href="#" aria-label="Instagram">
                  <Instagram className="h-6 w-6 hover:text-uganda-yellow" />
                </a>
                <a href="#" aria-label="Youtube">
                  <Youtube className="h-6 w-6 hover:text-uganda-yellow" />
                </a>
              </div>
              <div className="mt-4 flex items-center justify-center md:justify-start">
                <Mail className="h-5 w-5 mr-2" />
                <a href="mailto:info@famiroots.com" className="hover:text-uganda-yellow">info@famiroots.com</a>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4">Get In Touch</h3>
              <Button className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90">
                Contact Us
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} FamiRoots - Preserving Ugandan Family Heritage
            </p>
          </div>
        </div>
        
        {/* Scroll to top button */}
        {showScrollTop && (
          <button 
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-uganda-yellow p-3 rounded-full shadow-lg hover:bg-uganda-yellow/90 transition-all duration-300"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-6 w-6 text-uganda-black" />
          </button>
        )}
      </footer>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default Home;