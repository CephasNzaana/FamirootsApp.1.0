
import React from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Dna, Check, MapPin, Users, Target, Shield, Globe } from "lucide-react";

const DNATest = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = React.useState<boolean>(!user);

  const handleOrderTest = () => {
    toast.success("Your DNA kit order has been placed! Check your email for details.");
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-uganda-black">
              Discover Your <span className="text-uganda-red">Genetic Heritage</span>
            </h1>
            <p className="text-lg max-w-3xl mx-auto text-gray-600">
              Unlock the secrets of your DNA and connect with relatives across Uganda and beyond. Our DNA testing service reveals your ancestral origins with unprecedented accuracy.
            </p>
          </div>

          {/* DNA Test Kit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Basic Package */}
            <Card className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-uganda-yellow/10 h-2 w-full"></div>
              <CardHeader>
                <CardTitle>Basic Heritage DNA</CardTitle>
                <CardDescription>Essential DNA analysis for beginners</CardDescription>
                <div className="text-3xl font-bold mt-2">$79.99</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ethnicity Breakdown across 42 regions in Africa</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Find DNA Matches in our growing Ugandan database</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Tribal and clan connection insights</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-uganda-black hover:bg-uganda-black/80 text-white"
                  onClick={handleOrderTest}
                >
                  Order Test Kit
                </Button>
              </CardFooter>
            </Card>
            
            {/* Premium Package */}
            <Card className="border-2 border-uganda-yellow rounded-lg overflow-hidden shadow-lg relative">
              <div className="absolute top-0 right-0 bg-uganda-yellow text-uganda-black text-xs font-bold py-1 px-3 rounded-bl-lg">
                MOST POPULAR
              </div>
              <div className="bg-uganda-red h-2 w-full"></div>
              <CardHeader>
                <CardTitle>Premium Heritage DNA</CardTitle>
                <CardDescription>Complete ancestral discovery</CardDescription>
                <div className="text-3xl font-bold mt-2">$129.99</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Everything in Basic Heritage DNA</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Advanced ethnicity analysis across 120+ regions</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Historical migration patterns of your ancestors</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Health predispositions and traits analysis</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-uganda-red hover:bg-uganda-red/90 text-white"
                  onClick={handleOrderTest}
                >
                  Order Test Kit
                </Button>
              </CardFooter>
            </Card>
            
            {/* Family Package */}
            <Card className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-uganda-yellow/10 h-2 w-full"></div>
              <CardHeader>
                <CardTitle>Family Heritage DNA</CardTitle>
                <CardDescription>For multiple family members</CardDescription>
                <div className="text-3xl font-bold mt-2">$219.99</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Two Premium Heritage DNA test kits</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Family connection mapping</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Shared ancestral traits analysis</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>20% discount on additional test kits</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-uganda-black hover:bg-uganda-black/80 text-white"
                  onClick={handleOrderTest}
                >
                  Order Family Kit
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-10 text-center">How FamiRoots DNA Testing Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-uganda-red">1</span>
                </div>
                <h3 className="font-semibold mb-2">Order Your Kit</h3>
                <p className="text-sm text-gray-600">Choose your test kit and place your order online</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-uganda-red">2</span>
                </div>
                <h3 className="font-semibold mb-2">Collect Sample</h3>
                <p className="text-sm text-gray-600">Simple cheek swab that takes less than 2 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-uganda-red">3</span>
                </div>
                <h3 className="font-semibold mb-2">Mail It Back</h3>
                <p className="text-sm text-gray-600">Return your sample in the prepaid envelope provided</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-uganda-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-uganda-red">4</span>
                </div>
                <h3 className="font-semibold mb-2">Get Results</h3>
                <p className="text-sm text-gray-600">View your detailed ancestry results online in 4-6 weeks</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-10 text-center">Discover Your Heritage Through DNA</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <MapPin className="h-10 w-10 text-uganda-red mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ethnicity Estimate</h3>
                <p className="text-gray-600">
                  Discover your ethnic origins across 120+ regions worldwide, with special focus on African tribal connections.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Users className="h-10 w-10 text-uganda-red mb-4" />
                <h3 className="text-xl font-semibold mb-2">DNA Matches</h3>
                <p className="text-gray-600">
                  Connect with relatives you never knew existed. Find distant cousins and expand your family network.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Target className="h-10 w-10 text-uganda-red mb-4" />
                <h3 className="text-xl font-semibold mb-2">Clan Connections</h3>
                <p className="text-gray-600">
                  Our unique Ugandan database helps identify your connections to specific clans within tribal groups.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Globe className="h-10 w-10 text-uganda-red mb-4" />
                <h3 className="text-xl font-semibold mb-2">Migration Patterns</h3>
                <p className="text-gray-600">
                  Trace your ancestors' migration routes through generations and understand your family's historical journey.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Dna className="h-10 w-10 text-uganda-red mb-4" />
                <h3 className="text-xl font-semibold mb-2">DNA Traits</h3>
                <p className="text-gray-600">
                  Discover how your DNA influences physical traits, preferences, and certain abilities.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Shield className="h-10 w-10 text-uganda-red mb-4" />
                <h3 className="text-xl font-semibold mb-2">Privacy Protected</h3>
                <p className="text-gray-600">
                  Your DNA data is protected with industry-leading security standards and privacy controls.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">How accurate are the ethnicity results?</h3>
                <p className="text-gray-600">
                  Our ethnicity estimates are highly accurate, based on comparison with thousands of DNA samples from reference populations. We continually update our database for increased accuracy, particularly for African populations.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">How does the DNA sample collection work?</h3>
                <p className="text-gray-600">
                  Our DNA kits use a simple cheek swab method that is painless and takes less than two minutes. The kit includes clear instructions, collection tubes, and a prepaid return envelope.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">Is my DNA data kept private?</h3>
                <p className="text-gray-600">
                  Yes, protecting your privacy is our top priority. Your DNA data is stored in encrypted systems, and we never sell your personal information to third parties. You control who can see your information and can delete your data at any time.
                </p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Button 
                className="bg-uganda-red hover:bg-uganda-red/90 text-white"
                onClick={handleOrderTest}
              >
                Order Your DNA Kit Today
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer will be shared component */}
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default DNATest;
