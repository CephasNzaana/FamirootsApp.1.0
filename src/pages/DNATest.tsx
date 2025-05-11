
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Dna, 
  Globe, 
  Users, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  CircleCheck, 
  Building
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DNATest = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [kitType, setKitType] = useState<string>("standard");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    country: "Uganda",
    postalCode: ""
  });
  const navigate = useNavigate();

  const handleOrderKit = () => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to order a DNA kit");
      setShowAuth(true);
      return;
    }

    // Basic form validation
    if (!paymentMethod || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Simulated successful order
    toast.success("Your DNA kit has been ordered successfully!");
    
    // In a real application, this would send the order to the backend
    setTimeout(() => {
      navigate("/profile#dna");
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-uganda-black">
              Discover Your Genetic Heritage
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-600">
              Our DNA testing service connects you to your ancestral roots and helps you discover relatives across Uganda and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="border-b border-gray-200 bg-gray-50">
                  <CardTitle className="text-xl font-medium text-gray-700 flex items-center gap-2">
                    <Dna className="h-5 w-5 text-uganda-yellow" />
                    Order Your DNA Kit
                  </CardTitle>
                  <CardDescription>
                    Select a kit type and enter your shipping information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label>Select Kit Type</Label>
                    <RadioGroup
                      value={kitType}
                      onValueChange={setKitType}
                      className="grid grid-cols-1 gap-4"
                    >
                      <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="standard" id="standard" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="standard" className="font-medium text-lg cursor-pointer">
                            Standard DNA Kit ($89)
                          </Label>
                          <p className="text-sm text-gray-600">
                            Ethnicity estimate, family connections, and basic health insights
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="premium" id="premium" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="premium" className="font-medium text-lg cursor-pointer">
                            Premium DNA Kit ($149)
                          </Label>
                          <p className="text-sm text-gray-600">
                            Everything in Standard plus detailed health reports, genetic traits, and deeper ancestry analysis
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="family" id="family" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="family" className="font-medium text-lg cursor-pointer">
                            Family Pack (3 Kits - $199)
                          </Label>
                          <p className="text-sm text-gray-600">
                            Test multiple family members and discover how you relate to each other
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Shipping Information</Label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input 
                            id="fullName"
                            name="fullName"
                            value={shippingAddress.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="address">Address</Label>
                          <Input 
                            id="address"
                            name="address"
                            value={shippingAddress.address}
                            onChange={handleChange}
                            placeholder="Enter your address"
                            className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city"
                              name="city"
                              value={shippingAddress.city}
                              onChange={handleChange}
                              placeholder="Enter your city"
                              className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input 
                              id="postalCode"
                              name="postalCode"
                              value={shippingAddress.postalCode}
                              onChange={handleChange}
                              placeholder="Enter postal code"
                              className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="country">Country</Label>
                          <Input 
                            id="country"
                            name="country"
                            value={shippingAddress.country}
                            onChange={handleChange}
                            placeholder="Enter your country"
                            className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Payment Method</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="grid grid-cols-1 gap-4"
                    >
                      <div className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="credit-card" id="credit-card" />
                        <Label htmlFor="credit-card" className="cursor-pointer">Credit/Debit Card</Label>
                      </div>
                      <div className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="cursor-pointer">PayPal</Label>
                      </div>
                      <div className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="mobile-money" id="mobile-money" />
                        <Label htmlFor="mobile-money" className="cursor-pointer">Mobile Money</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t border-gray-200 p-6">
                  <Button 
                    className="w-full bg-uganda-red hover:bg-uganda-red/90 text-white"
                    onClick={handleOrderKit}
                  >
                    Complete Your Order
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="border-b border-gray-200 bg-gray-50">
                  <CardTitle className="text-xl font-medium text-gray-700">
                    What You'll Discover With DNA Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-uganda-yellow/20 flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-uganda-red" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Ethnic Origins</h3>
                        <p className="text-gray-600">
                          Discover the percentage breakdown of your ethnicity across Ugandan tribes and other African ancestry.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-uganda-yellow/20 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-uganda-red" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Relative Connections</h3>
                        <p className="text-gray-600">
                          Connect with previously unknown relatives who share your DNA, expanding your family network.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-uganda-yellow/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-uganda-red" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Migration Patterns</h3>
                        <p className="text-gray-600">
                          Trace your ancestors' journeys and discover the historical migration routes of your family.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-uganda-yellow/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-uganda-red" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Health Insights</h3>
                        <p className="text-gray-600">
                          Learn about genetic health predispositions and traits that may affect your wellbeing.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader className="border-b border-gray-200 bg-gray-50">
                  <CardTitle className="text-xl font-medium text-gray-700 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-uganda-yellow" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ol className="space-y-6">
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-uganda-red flex items-center justify-center text-white font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Order Your Kit</h3>
                        <p className="text-gray-600">
                          Select a kit type and complete your order. We'll ship your DNA collection kit to your address.
                        </p>
                      </div>
                    </li>
                    
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-uganda-red flex items-center justify-center text-white font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Collect Your Sample</h3>
                        <p className="text-gray-600">
                          Follow the simple instructions to collect your saliva sample and return it using the prepaid package.
                        </p>
                      </div>
                    </li>
                    
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-uganda-red flex items-center justify-center text-white font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Lab Processing</h3>
                        <p className="text-gray-600">
                          Our lab processes your DNA sample using state-of-the-art genomic technology (6-8 weeks).
                        </p>
                      </div>
                    </li>
                    
                    <li className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-uganda-red flex items-center justify-center text-white font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Explore Your Results</h3>
                        <p className="text-gray-600">
                          Receive notification when your results are ready. Access your DNA insights through your FamiRoots account.
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mt-12 bg-white shadow-md border border-gray-200 rounded-lg p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-uganda-black">DNA Testing Partners</h2>
                <p className="text-gray-600">
                  We partner with world-class genomics laboratories to ensure accurate and comprehensive DNA analysis
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Building className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="font-medium">AfriGenomics Lab</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Building className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="font-medium">Heritage DNA</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Building className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="font-medium">Global Ancestry</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Building className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="font-medium">GeneticTruth</p>
                </div>
              </div>
              
              <div className="bg-uganda-yellow/10 p-6 rounded-lg border border-uganda-yellow/20">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CircleCheck className="h-6 w-6 text-uganda-red" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Privacy Commitment</h3>
                    <p className="text-gray-600">
                      Your DNA data is protected with industry-leading security. We never sell your genetic information to third parties without your explicit consent. You maintain control over how your data is used and shared.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default DNATest;
