
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { Dna, Droplets, CheckCircle, Zap, Mail, Package, Calendar, Clock, CreditCard } from 'lucide-react';

const DNATest = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [selectedKit, setSelectedKit] = useState<string>('basic');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Uganda',
    message: '',
    paymentMethod: 'mobileMoney'
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your DNA test kit order has been placed!');
    // In a real app, we would send this data to an API
  };

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleSignup = () => {
    setShowAuth(true);
  };

  const dnaKits = [
    {
      id: 'basic',
      name: 'Basic Ancestry',
      price: 150000,
      description: 'Discover your tribal and clan lineage with our basic ancestry test.',
      features: [
        'Tribal ancestry identification',
        'Basic clan connections',
        'Results within 4-6 weeks',
        'Email report'
      ],
      processingTime: '4-6 weeks'
    },
    {
      id: 'premium',
      name: 'Premium Heritage',
      price: 250000,
      description: 'Our most popular kit with detailed clan and family connections.',
      features: [
        'Detailed tribal ancestry',
        'Extended clan connections',
        'Family finder database access',
        'Results within 2-3 weeks',
        'Interactive online report'
      ],
      processingTime: '2-3 weeks'
    },
    {
      id: 'ultimate',
      name: 'Ultimate Lineage',
      price: 350000,
      description: 'The most comprehensive DNA analysis for Ugandan heritage.',
      features: [
        'Detailed tribal and sub-tribal ancestry',
        'Complete clan mapping',
        'Elder connections identification',
        'Family finder database access',
        'Results within 1-2 weeks',
        'Interactive online report',
        'Consultation with heritage expert'
      ],
      processingTime: '1-2 weeks'
    }
  ];

  const getSelectedKitDetails = () => {
    return dnaKits.find(kit => kit.id === selectedKit);
  };

  const kitDetails = getSelectedKitDetails();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-uganda-black">
              DNA Testing for <span className="text-uganda-red">Ugandan Heritage</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 mb-8">
              Discover your ancestral connections and clan heritage with our specialized DNA testing services.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-uganda-red text-white hover:bg-uganda-red/90"
                onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Dna className="mr-2 h-5 w-5" />
                Order Your DNA Kit
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white font-bold text-uganda-black border-uganda-yellow hover:bg-uganda-yellow/10"
                onClick={() => document.getElementById('dna-kits')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Droplets className="mr-2 h-5 w-5" />
                Explore DNA Kit Options
              </Button>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-uganda-black">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mb-4">
                    <span className="font-bold text-lg">1</span>
                  </div>
                  <CardTitle>Order Your Kit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Select your DNA test kit option and complete the order form. We'll ship your kit to your address in Uganda or internationally.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mb-4">
                    <span className="font-bold text-lg">2</span>
                  </div>
                  <CardTitle>Collect Your Sample</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Follow the simple instructions to collect your DNA sample using the provided cheek swab. Return the sample in the prepaid envelope.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center mb-4">
                    <span className="font-bold text-lg">3</span>
                  </div>
                  <CardTitle>Receive Your Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Our lab will analyze your DNA and connect it to our specialized Ugandan heritage database. Receive your detailed ancestry report.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* DNA Kit Options Section */}
          <section id="dna-kits" className="mb-16 scroll-mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-uganda-black">DNA Test Kit Options</h2>
            <Tabs defaultValue="basic" onValueChange={setSelectedKit}>
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="basic">Basic Ancestry</TabsTrigger>
                <TabsTrigger value="premium">Premium Heritage</TabsTrigger>
                <TabsTrigger value="ultimate">Ultimate Lineage</TabsTrigger>
              </TabsList>
              
              {dnaKits.map(kit => (
                <TabsContent key={kit.id} value={kit.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-2/3">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-uganda-black">{kit.name}</h3>
                          <p className="text-gray-600">{kit.description}</p>
                        </div>
                        <Badge className={`${kit.id === 'premium' ? 'bg-uganda-yellow text-uganda-black' : 'bg-uganda-red text-white'}`}>
                          {kit.id === 'premium' ? 'Most Popular' : (kit.id === 'ultimate' ? 'Most Detailed' : 'Essential')}
                        </Badge>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Features
                        </h4>
                        <ul className="space-y-2 pl-6">
                          {kit.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-uganda-yellow mr-2"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-uganda-red mr-2" />
                          <div>
                            <p className="font-semibold">Report Delivery</p>
                            <p className="text-sm text-gray-600">
                              {kit.id === 'basic' ? 'Email PDF' : 'Interactive Online Portal'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-uganda-red mr-2" />
                          <div>
                            <p className="font-semibold">Kit Delivery</p>
                            <p className="text-sm text-gray-600">3-7 business days</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-uganda-red mr-2" />
                          <div>
                            <p className="font-semibold">Sample Access</p>
                            <p className="text-sm text-gray-600">{kit.id === 'basic' ? '1 year' : (kit.id === 'premium' ? '5 years' : 'Lifetime')}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-uganda-red mr-2" />
                          <div>
                            <p className="font-semibold">Processing Time</p>
                            <p className="text-sm text-gray-600">{kit.processingTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-1/3 flex flex-col justify-between bg-gray-50 p-6 rounded-lg">
                      <div>
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="text-3xl font-bold text-uganda-black">
                            {kit.price.toLocaleString()} UGX
                          </p>
                          <p className="text-sm text-gray-600">
                            Free shipping within Uganda
                          </p>
                        </div>
                        
                        {kit.id === 'premium' && (
                          <Alert className="mb-4 bg-uganda-yellow/20 border-uganda-yellow">
                            <Zap className="h-4 w-4" />
                            <AlertTitle>Most Popular Choice</AlertTitle>
                            <AlertDescription>
                              Recommended for those seeking detailed clan connections.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full bg-uganda-red text-white hover:bg-uganda-red/90"
                        onClick={() => {
                          setSelectedKit(kit.id);
                          document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Select {kit.name}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </section>

          {/* Order Form Section */}
          <section id="order-form" className="scroll-mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-uganda-black">Order Your DNA Kit</h2>
            <Card className="border-2 border-uganda-yellow">
              <CardHeader>
                <CardTitle>Complete Your Order</CardTitle>
                <CardDescription>
                  Fill out the form below to order your {getSelectedKitDetails()?.name} DNA test kit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{kitDetails?.name}</h3>
                        <p className="text-sm text-gray-600">{kitDetails?.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">{kitDetails?.price.toLocaleString()} UGX</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-uganda-red hover:text-uganda-red/80"
                          onClick={() => document.getElementById('dna-kits')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        name="fullName" 
                        value={formData.fullName}
                        onChange={handleFormChange}
                        placeholder="Enter your full name"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="your@email.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="e.g., +256 770 123 456"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        value={formData.address}
                        onChange={handleFormChange}
                        placeholder="Street address for delivery"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City/Town</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        value={formData.city}
                        onChange={handleFormChange}
                        placeholder="Your city or town"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleFormChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="Uganda">Uganda</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Other">Other (Specify in Message)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Information (Optional)</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      value={formData.message}
                      onChange={handleFormChange}
                      placeholder="Any special instructions or questions"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="border rounded-md p-3 flex items-center space-x-3 cursor-pointer hover:border-uganda-yellow transition-colors">
                        <input 
                          type="radio" 
                          id="mobileMoney" 
                          name="paymentMethod"
                          value="mobileMoney"
                          checked={formData.paymentMethod === 'mobileMoney'}
                          onChange={handleFormChange}
                          className="h-4 w-4 text-uganda-red focus:ring-uganda-yellow" 
                        />
                        <Label htmlFor="mobileMoney" className="cursor-pointer flex-1">Mobile Money</Label>
                      </div>
                      <div className="border rounded-md p-3 flex items-center space-x-3 cursor-pointer hover:border-uganda-yellow transition-colors">
                        <input 
                          type="radio" 
                          id="bankTransfer" 
                          name="paymentMethod"
                          value="bankTransfer"
                          checked={formData.paymentMethod === 'bankTransfer'}
                          onChange={handleFormChange}
                          className="h-4 w-4 text-uganda-red focus:ring-uganda-yellow" 
                        />
                        <Label htmlFor="bankTransfer" className="cursor-pointer flex-1">Bank Transfer</Label>
                      </div>
                      <div className="border rounded-md p-3 flex items-center space-x-3 cursor-pointer hover:border-uganda-yellow transition-colors">
                        <input 
                          type="radio" 
                          id="cardPayment" 
                          name="paymentMethod"
                          value="cardPayment"
                          checked={formData.paymentMethod === 'cardPayment'}
                          onChange={handleFormChange}
                          className="h-4 w-4 text-uganda-red focus:ring-uganda-yellow" 
                        />
                        <Label htmlFor="cardPayment" className="cursor-pointer flex-1">Credit/Debit Card</Label>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center">
                  <CreditCard className="text-uganda-yellow mr-2 h-5 w-5" />
                  <span className="text-sm text-gray-600">Secure payment processing</span>
                </div>
                <Button 
                  onClick={handleSubmit}
                  type="submit" 
                  className="bg-uganda-red text-white hover:bg-uganda-red/90 px-8"
                >
                  Complete Order ({kitDetails?.price.toLocaleString()} UGX)
                </Button>
              </CardFooter>
            </Card>
          </section>

          {/* FAQ Section */}
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-uganda-black">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How accurate is the tribal identification?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Our specialized DNA database for Ugandan heritage provides up to 95% accuracy for tribal identification, connecting your DNA markers to specific Ugandan tribes and clans.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How is the sample collected?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>The kit contains a simple, painless cheek swab that you rub inside your cheek for 30 seconds. No blood or needles required. Detailed instructions are included.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How long do results take?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Processing time depends on the kit selected: Basic (4-6 weeks), Premium (2-3 weeks), or Ultimate (1-2 weeks). You'll receive an email notification when your results are ready.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is my DNA information kept private?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Yes, your privacy is our priority. Your DNA data is stored securely and never shared without your explicit consent. You control who can see your information and connections.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I connect with relatives?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Yes, with the Premium and Ultimate kits, you can opt into our Family Finder database, allowing you to discover and connect with relatives who have also taken our DNA test.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Do you ship internationally?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Yes, we ship worldwide. Free delivery within Uganda, and international shipping is available for an additional fee depending on your location.</p>
                </CardContent>
              </Card>
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

export default DNATest;
