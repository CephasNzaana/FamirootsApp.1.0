
import React, { useState } from 'react';
import Header from '@/components/Header';
import AuthForm from '@/components/AuthForm';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Award, CheckCircle2, Dna, Globe, Heart, HeartHandshake, MapPin, ShieldCheck, Trophy, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Exchange rate: 1 USD = ~3700 UGX (as of May 2025)
const UGX_EXCHANGE_RATE = 3700;

// DNA Test Pricing
const dnaTestOptions = [
  {
    id: 'ancestry',
    name: 'Ancestry DNA Test',
    description: 'Discover your ethnic origins and find new relatives',
    priceUSD: 99,
    priceUGX: 99 * UGX_EXCHANGE_RATE,
    features: [
      'Ethnicity estimate across 1,500+ regions',
      'Find DNA matches across our database',
      'Explore migration patterns',
      'Build and connect your family tree'
    ],
    icon: Globe,
    color: 'bg-uganda-yellow text-uganda-black',
    popular: true
  },
  {
    id: 'health',
    name: 'Health + Ancestry',
    description: 'Understand how genetics can influence your health',
    priceUSD: 199,
    priceUGX: 199 * UGX_EXCHANGE_RATE,
    features: [
      'All Ancestry features included',
      '40+ carrier status reports',
      '10+ health predisposition reports',
      'Personalized health insights'
    ],
    icon: Heart,
    color: 'bg-uganda-red text-white',
    popular: false
  },
  {
    id: 'complete',
    name: 'Complete Package',
    description: 'Our most comprehensive DNA analysis',
    priceUSD: 299,
    priceUGX: 299 * UGX_EXCHANGE_RATE,
    features: [
      'All Ancestry & Health features',
      'Advanced trait analysis',
      'Premium family matching features',
      'Priority lab processing',
      'One-on-one consultation with a genetic counselor'
    ],
    icon: Award,
    color: 'bg-indigo-500 text-white',
    popular: false
  }
];

const DNATest = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [selectedTest, setSelectedTest] = useState<string>('ancestry');
  const [activeTab, setActiveTab] = useState<string>('dna-test');

  const handleOrderTest = () => {
    if (!user) {
      toast.error("Please log in to order a DNA test kit");
      setShowAuth(true);
      return;
    }
    
    // In a real app, this would connect to a checkout system
    toast.success("Your DNA test kit order has been received! You'll receive a confirmation email shortly.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-uganda-black">
              Discover Your <span className="text-uganda-red">Genetic Heritage</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Explore your ancestral roots through DNA testing and connect with relatives across Uganda and beyond
            </p>
          </div>

          <Tabs defaultValue="dna-test" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="dna-test">DNA Test Kits</TabsTrigger>
              <TabsTrigger value="results">Your Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dna-test" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dnaTestOptions.map(option => (
                  <Card 
                    key={option.id} 
                    className={`relative overflow-hidden transition-all ${selectedTest === option.id ? 'ring-2 ring-uganda-yellow' : ''}`}
                  >
                    {option.popular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-uganda-yellow text-black font-bold rounded-none rounded-bl-lg">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${option.color}`}>
                          <option.icon size={24} />
                        </div>
                      </div>
                      <CardTitle className="text-center">{option.name}</CardTitle>
                      <CardDescription className="text-center">{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold mb-1">UGX {option.priceUGX.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">(Approx. ${option.priceUSD})</div>
                      </div>
                      <ul className="space-y-2">
                        {option.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <RadioGroup 
                        defaultValue={selectedTest} 
                        value={selectedTest} 
                        onValueChange={setSelectedTest}
                        className="w-full"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id}>Select</Label>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-white text-uganda-black border border-uganda-yellow hover:bg-uganda-yellow/10"
                            onClick={() => setSelectedTest(option.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </RadioGroup>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Order Your DNA Test Kit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Your full name" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Your email address" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="Your phone number" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Delivery Address</Label>
                        <Input id="address" placeholder="Street address" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input id="city" placeholder="City" />
                        </div>
                        <div>
                          <Label htmlFor="district">District</Label>
                          <Input id="district" placeholder="District" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">Special Instructions</Label>
                        <Input id="notes" placeholder="Any delivery instructions" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center">
                    <Dna className="h-5 w-5 text-uganda-red mr-2" />
                    <span>
                      Selected Test: <strong>{dnaTestOptions.find(o => o.id === selectedTest)?.name}</strong>
                    </span>
                  </div>
                  <Button 
                    onClick={handleOrderTest}
                    className="bg-uganda-yellow text-black hover:bg-uganda-yellow/90 w-full md:w-auto"
                  >
                    Order Test Kit Now
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Privacy Protected</h4>
                        <p className="text-sm text-gray-600">Your DNA data is securely stored and never shared without consent</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Free Shipping</h4>
                        <p className="text-sm text-gray-600">Free delivery across Uganda and East Africa</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <HeartHandshake className="h-5 w-5 text-uganda-red mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Expert Support</h4>
                        <p className="text-sm text-gray-600">Our genealogists are available to help interpret your results</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              {user ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 text-center">
                  <div className="py-8">
                    <div className="bg-gray-100 rounded-full p-4 inline-flex mx-auto mb-4">
                      <Dna size={32} className="text-uganda-yellow" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No DNA Test Results Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      You haven't taken a DNA test with us yet. Order a test kit to discover your genetic heritage and connections.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('dna-test')}
                      className="bg-uganda-yellow text-black hover:bg-uganda-yellow/90"
                    >
                      Order a DNA Test Kit
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert className="bg-white border-uganda-yellow">
                  <AlertCircle className="h-4 w-4 text-uganda-yellow" />
                  <AlertTitle>Authentication Required</AlertTitle>
                  <AlertDescription>
                    Please log in to view your DNA test results or order a test kit.
                  </AlertDescription>
                  <Button 
                    onClick={() => setShowAuth(true)}
                    className="bg-uganda-yellow text-black hover:bg-uganda-yellow/90 mt-4"
                  >
                    Login / Sign Up
                  </Button>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-8" />
          
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">How DNA Testing Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover your genetic heritage and connect with relatives through our simple 4-step process
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-uganda-yellow/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <div className="bg-uganda-yellow w-10 h-10 rounded-full flex items-center justify-center text-black font-bold">1</div>
                </div>
                <h3 className="font-semibold mb-1">Order Your Kit</h3>
                <p className="text-sm text-gray-600">Select a test and we'll ship your DNA collection kit</p>
              </div>
              
              <div className="text-center">
                <div className="bg-uganda-yellow/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <div className="bg-uganda-yellow w-10 h-10 rounded-full flex items-center justify-center text-black font-bold">2</div>
                </div>
                <h3 className="font-semibold mb-1">Provide Sample</h3>
                <p className="text-sm text-gray-600">Follow the simple instructions to collect your DNA sample</p>
              </div>
              
              <div className="text-center">
                <div className="bg-uganda-yellow/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <div className="bg-uganda-yellow w-10 h-10 rounded-full flex items-center justify-center text-black font-bold">3</div>
                </div>
                <h3 className="font-semibold mb-1">Lab Analysis</h3>
                <p className="text-sm text-gray-600">Our lab processes your sample using advanced technology</p>
              </div>
              
              <div className="text-center">
                <div className="bg-uganda-yellow/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <div className="bg-uganda-yellow w-10 h-10 rounded-full flex items-center justify-center text-black font-bold">4</div>
                </div>
                <h3 className="font-semibold mb-1">Explore Results</h3>
                <p className="text-sm text-gray-600">Discover your heritage and connect with distant relatives</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2 space-y-4">
                  <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
                  
                  <div>
                    <h4 className="font-medium">How accurate is the DNA testing?</h4>
                    <p className="text-sm text-gray-600">Our DNA testing is over 99.9% accurate for identifying relationships and ethnic origins.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">How long does it take to get results?</h4>
                    <p className="text-sm text-gray-600">Most results are available within 4-6 weeks after your sample arrives at our lab.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Is my privacy protected?</h4>
                    <p className="text-sm text-gray-600">Yes, we use industry-leading encryption and privacy practices to protect your data.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Can I connect my DNA results to my family tree?</h4>
                    <p className="text-sm text-gray-600">Yes, our platform allows you to integrate DNA results with your family tree for deeper insights.</p>
                  </div>
                </div>
                
                <div className="md:w-1/2 space-y-4">
                  <h3 className="text-xl font-semibold">Benefits of DNA Testing</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Discover Your Ancestry</h4>
                        <p className="text-sm text-gray-600">Reveal your ethnic origins across 1,500+ regions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Trophy className="h-5 w-5 text-uganda-yellow mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Connect With Relatives</h4>
                        <p className="text-sm text-gray-600">Find new family connections across Uganda and worldwide</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <UserCheck className="h-5 w-5 text-uganda-red mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Verify Family Connections</h4>
                        <p className="text-sm text-gray-600">Confirm relationships and strengthen clan ties</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Heart className="h-5 w-5 text-pink-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Health Insights</h4>
                        <p className="text-sm text-gray-600">With health tests, discover genetic factors that may affect wellbeing</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button className="bg-uganda-yellow text-black hover:bg-uganda-yellow/90 w-full" onClick={() => setActiveTab('dna-test')}>
                      Get Started Today
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default DNATest;
