
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dna,
  Check,
  ChevronRight,
  Clock,
  Truck,
  UserSearch,
  Users,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";

// UGX conversion rate: Approximate at 1 USD = 3700 UGX
const UGX_CONVERSION_RATE = 3700;

const DNATest = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(!user);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<number>(0);
  
  const dnaTestPackages = [
    {
      id: "ancestry",
      name: "Ancestry DNA",
      description: "Trace your Ugandan ancestry and discover your tribal heritage",
      priceUSD: 99,
      priceUGX: 99 * UGX_CONVERSION_RATE,
      features: [
        "Tribal lineage breakdown",
        "Clan connections analysis",
        "Historical migration patterns",
        "Regional ancestry mapping",
        "25+ Ugandan ethnic groups covered"
      ],
      turnaround: "3-4 weeks",
      icon: <Dna className="h-8 w-8 text-uganda-yellow" />
    },
    {
      id: "heritage",
      name: "Heritage Connect",
      description: "Connect with potential relatives through our extensive DNA database",
      priceUSD: 149,
      priceUGX: 149 * UGX_CONVERSION_RATE,
      features: [
        "Everything in Ancestry DNA",
        "Relative matching across database",
        "Clan connection verification",
        "Extended family finder",
        "Interactive family chart mapping"
      ],
      turnaround: "4-5 weeks",
      icon: <Users className="h-8 w-8 text-uganda-yellow" />
    },
    {
      id: "premium",
      name: "Premium Heritage",
      description: "Our most comprehensive DNA test with expert analysis and historical research",
      priceUSD: 199,
      priceUGX: 199 * UGX_CONVERSION_RATE,
      features: [
        "Everything in Heritage Connect",
        "Elder verification analysis",
        "Personalized heritage report",
        "One-on-one consultation",
        "Historical documentation research",
        "Exclusive access to clan archives"
      ],
      turnaround: "5-6 weeks",
      icon: <ShieldCheck className="h-8 w-8 text-uganda-yellow" />
    }
  ];
  
  const handleSelectPackage = (packageId: string) => {
    setSelectedTest(packageId);
    if (user) {
      setFormStep(1);
    } else {
      setShowAuth(true);
    }
  };
  
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your DNA test kit has been ordered!");
    setFormStep(2);
  };
  
  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const getSelectedPackage = () => {
    return dnaTestPackages.find(pkg => pkg.id === selectedTest);
  };
  
  const renderStepContent = () => {
    const selectedPackage = getSelectedPackage();
    
    switch (formStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-uganda-black">
              Choose Your DNA Test Package
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Our DNA testing services are specifically calibrated for Ugandan tribal and clan heritage analysis.
            </p>
            
            <Tabs defaultValue="cards" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cards">Packages</TabsTrigger>
                <TabsTrigger value="table">Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cards" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dnaTestPackages.map(pkg => (
                    <Card key={pkg.id} className={`overflow-hidden ${selectedTest === pkg.id ? 'ring-2 ring-uganda-red' : ''}`}>
                      <CardHeader className="bg-gradient-to-br from-uganda-yellow/20 to-uganda-red/10">
                        <div className="flex justify-between">
                          <div>
                            <CardTitle>{pkg.name}</CardTitle>
                            <CardDescription className="mt-1.5">{pkg.description}</CardDescription>
                          </div>
                          {pkg.icon}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="flex items-end gap-1 mb-4">
                          <span className="text-3xl font-bold text-uganda-black">{formatUGX(pkg.priceUGX)}</span>
                        </div>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-sm text-gray-600 mt-4 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Results in {pkg.turnaround}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50">
                        <Button 
                          className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                          onClick={() => handleSelectPackage(pkg.id)}
                        >
                          Select Package
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table" className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3 border">Features</th>
                        {dnaTestPackages.map(pkg => (
                          <th key={pkg.id} className="text-left p-3 border">
                            {pkg.name} <br />
                            <span className="text-sm font-normal">{formatUGX(pkg.priceUGX)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border">Tribal lineage breakdown</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            <Check className="h-5 w-5 mx-auto text-green-500" />
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="p-3 border">Clan connections analysis</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            <Check className="h-5 w-5 mx-auto text-green-500" />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 border">Relative matching</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            {pkg.id !== "ancestry" ? (
                              <Check className="h-5 w-5 mx-auto text-green-500" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="p-3 border">Extended family finder</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            {pkg.id !== "ancestry" ? (
                              <Check className="h-5 w-5 mx-auto text-green-500" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 border">Elder verification analysis</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            {pkg.id === "premium" ? (
                              <Check className="h-5 w-5 mx-auto text-green-500" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="p-3 border">One-on-one consultation</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            {pkg.id === "premium" ? (
                              <Check className="h-5 w-5 mx-auto text-green-500" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 border">Results turnaround</td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border text-center">
                            {pkg.turnaround}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-100">
                        <td className="p-3 border"></td>
                        {dnaTestPackages.map(pkg => (
                          <td key={pkg.id} className="p-3 border">
                            <Button 
                              className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                              onClick={() => handleSelectPackage(pkg.id)}
                            >
                              Select
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-uganda-black">
                Order DNA Test Kit
              </h2>
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setFormStep(0)}
                  className="text-sm"
                >
                  Change Package
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{selectedPackage?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPackage?.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatUGX(selectedPackage?.priceUGX || 0)}</div>
                  <div className="text-sm text-gray-600">Results in {selectedPackage?.turnaround}</div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleOrderSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Your full name" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="Your email address" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Your phone number" required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input id="address" placeholder="Street address" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="City" required />
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input id="district" placeholder="District" required />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" placeholder="Postal code" required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select 
                    id="paymentMethod" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Button 
                  type="submit" 
                  className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                >
                  Complete Order
                </Button>
              </div>
            </form>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-uganda-black">
              Order Successful!
            </h2>
            
            <p className="text-gray-600">
              Thank you for ordering the {selectedPackage?.name} test kit. 
              We've sent a confirmation email with order details.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ol className="text-left space-y-4 text-sm">
                <li className="flex items-start">
                  <div className="bg-uganda-yellow w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <span className="font-medium block">Kit Delivery</span>
                    Your DNA test kit will be delivered in 3-5 business days.
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-uganda-yellow w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <span className="font-medium block">Sample Collection</span>
                    Follow the included instructions to collect your sample.
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-uganda-yellow w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <span className="font-medium block">Return &amp; Process</span>
                    Return your sample in the prepaid envelope for testing.
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-uganda-yellow w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0">
                    <span className="font-bold">4</span>
                  </div>
                  <div>
                    <span className="font-medium block">Get Results</span>
                    Receive your heritage results in {selectedPackage?.turnaround}.
                  </div>
                </li>
              </ol>
            </div>
            
            <div>
              <Button 
                onClick={() => setFormStep(0)}
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
              >
                Order Another Kit
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <Header 
        onLogin={() => setShowAuth(true)} 
        onSignup={() => setShowAuth(true)} 
      />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-uganda-black mb-4">
              DNA Testing for Ugandan Heritage
            </h1>
            <p className="text-lg text-gray-600">
              Verify family relationships and discover your ancestral connections through DNA analysis.
            </p>
          </div>
          
          {/* Progress Steps */}
          {formStep < 3 && (
            <div className="mb-8">
              <div className="flex items-center justify-center max-w-2xl mx-auto">
                <div className={`step-item ${formStep >= 0 ? 'active' : ''} ${formStep > 0 ? 'complete' : ''}`}>
                  <div className="step">
                    {formStep > 0 ? <Check className="h-5 w-5" /> : 1}
                  </div>
                  <p className="text-sm mt-1">Select Package</p>
                </div>
                
                <div className="flex-1 h-px bg-gray-300"></div>
                
                <div className={`step-item ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'complete' : ''}`}>
                  <div className="step">
                    {formStep > 1 ? <Check className="h-5 w-5" /> : 2}
                  </div>
                  <p className="text-sm mt-1">Order Kit</p>
                </div>
                
                <div className="flex-1 h-px bg-gray-300"></div>
                
                <div className={`step-item ${formStep >= 2 ? 'active' : ''}`}>
                  <div className="step">3</div>
                  <p className="text-sm mt-1">Confirmation</p>
                </div>
              </div>
            </div>
          )}
          
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>
          
          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-uganda-yellow/20 rounded-full flex items-center justify-center mb-4">
                <UserSearch className="h-6 w-6 text-uganda-black" />
              </div>
              <h3 className="font-bold mb-2">Specialized for Uganda</h3>
              <p className="text-sm text-gray-600">
                Our DNA tests are specifically calibrated for Ugandan tribal and clan heritage analysis.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-uganda-yellow/20 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-uganda-black" />
              </div>
              <h3 className="font-bold mb-2">Nationwide Delivery</h3>
              <p className="text-sm text-gray-600">
                We deliver test kits across Uganda with easy-to-follow sample collection instructions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-uganda-yellow/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-uganda-black" />
              </div>
              <h3 className="font-bold mb-2">Private & Secure</h3>
              <p className="text-sm text-gray-600">
                Your DNA data is protected with industry-leading privacy and security measures.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {showAuth && (
        <AuthForm onClose={() => setShowAuth(false)} />
      )}
      
      <style jsx>{`
        .step-item {
          @apply relative flex flex-col justify-center items-center w-36;
        }
        .step-item:not(:first-child):before {
          @apply content-[''] bg-slate-200 absolute w-full h-[3px] right-2/4 top-1/3 -translate-y-2/4;
        }
        .step {
          @apply w-8 h-8 flex items-center justify-center z-10 relative bg-slate-200 rounded-full font-semibold text-slate-400;
        }
        .active .step {
          @apply bg-uganda-yellow text-uganda-black;
        }
        .complete .step {
          @apply bg-green-500 text-white;
        }
        .complete:not(:last-child):before,
        .active:not(:last-child):before {
          @apply bg-green-500;
        }
      `}</style>
    </div>
  );
};

export default DNATest;