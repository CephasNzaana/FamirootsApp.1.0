
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TreeFormData, ElderReference } from "@/types";
import { toast } from "@/components/ui/sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { PlusCircle, MinusCircle } from "lucide-react";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

interface FamilyTreeFormProps {
  onSubmit: (data: TreeFormData) => void;
  isLoading: boolean;
}

const FamilyTreeForm = ({ onSubmit, isLoading }: FamilyTreeFormProps) => {
  const [formData, setFormData] = useState<TreeFormData>({
    surname: "",
    tribe: "",
    clan: "",
    familyName: "",
    side: "paternal", // Default to paternal side
    gender: "male", // Default to male
    siblings: [{ name: "", gender: "male", birthYear: "" }],
    spouse: { name: "", birthYear: "" },
    selectedElders: []
  });

  const [availableElders, setAvailableElders] = useState<ElderReference[]>([]);
  const [availableClans, setAvailableClans] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Load available clans when a tribe is selected
  useEffect(() => {
    if (formData.tribe) {
      const selectedTribe = ugandaTribesData.find(tribe => tribe.name === formData.tribe);
      if (selectedTribe) {
        const clanNames = selectedTribe.clans.map(clan => clan.name);
        setAvailableClans(clanNames);
      } else {
        setAvailableClans([]);
      }
    } else {
      setAvailableClans([]);
    }
  }, [formData.tribe]);

  // Load available elders when a clan is selected
  useEffect(() => {
    if (formData.tribe && formData.clan) {
      const selectedTribe = ugandaTribesData.find(tribe => tribe.name === formData.tribe);
      if (selectedTribe) {
        const selectedClan = selectedTribe.clans.find(clan => clan.name === formData.clan);
        if (selectedClan) {
          console.log("Found clan:", selectedClan.name, "with elders:", selectedClan.elders);
          const elders = selectedClan.elders.map(elder => ({
            id: elder.id,
            name: elder.name,
            approximateEra: elder.approximateEra,
            verificationScore: elder.verificationScore,
            familyConnections: [] // Default empty array
          }));
          setAvailableElders(elders);
        } else {
          console.log("No clan found with name:", formData.clan);
          setAvailableElders([]);
        }
      } else {
        console.log("No tribe found with name:", formData.tribe);
        setAvailableElders([]);
      }
    } else {
      setAvailableElders([]);
    }
  }, [formData.tribe, formData.clan]);

  const handleSelectChange = (name: string, value: string) => {
    if (name === "tribe") {
      // Reset clan when tribe changes
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        clan: "",
        selectedElders: []
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSiblingChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedSiblings = [...prev.siblings];
      updatedSiblings[index] = { ...updatedSiblings[index], [field]: value };
      return { ...prev, siblings: updatedSiblings };
    });
  };

  const addSibling = () => {
    setFormData(prev => ({
      ...prev,
      siblings: [...prev.siblings, { name: "", gender: "male", birthYear: "" }]
    }));
  };

  const removeSibling = (index: number) => {
    if (formData.siblings.length > 1) {
      setFormData(prev => {
        const updatedSiblings = [...prev.siblings];
        updatedSiblings.splice(index, 1);
        return { ...prev, siblings: updatedSiblings };
      });
    }
  };

  const handleSpouseChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      spouse: { ...prev.spouse, [field]: value }
    }));
  };

  const toggleElderSelection = (elderId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedElders.includes(elderId);
      if (isSelected) {
        return {
          ...prev,
          selectedElders: prev.selectedElders.filter(id => id !== elderId)
        };
      } else {
        return {
          ...prev,
          selectedElders: [...prev.selectedElders, elderId]
        };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.surname || !formData.tribe || !formData.clan || !formData.familyName) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Log form submission for debugging
    console.log("Submitting form data:", formData);
    
    // Call the parent's onSubmit function
    onSubmit(formData);
  };

  // Common Ugandan tribes for suggestions
  const commonTribes = ugandaTribesData.map(tribe => tribe.name);

  return (
    <Card className="w-full max-w-lg bg-white shadow-lg border-2 border-uganda-black">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-uganda-black">Discover Your Roots</CardTitle>
          <CardDescription>
            Enter your family information to generate your clan-based family tree
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="family">Family Details</TabsTrigger>
              <TabsTrigger value="elders">Clan Elders</TabsTrigger>
            </TabsList>
            
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="surname">Family Surname</Label>
                <Input
                  id="surname"
                  name="surname"
                  placeholder="e.g. Mugisha"
                  value={formData.surname}
                  onChange={handleChange}
                  className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="familyName">Your Full Name</Label>
                <Input
                  id="familyName"
                  name="familyName"
                  placeholder="e.g. John Mugisha"
                  value={formData.familyName}
                  onChange={handleChange}
                  className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Your Gender</Label>
                <RadioGroup 
                  value={formData.gender} 
                  onValueChange={(value) => handleSelectChange("gender", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="gender-male" />
                    <Label htmlFor="gender-male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="gender-female" />
                    <Label htmlFor="gender-female">Female</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="side">Family Side</Label>
                <RadioGroup 
                  value={formData.side} 
                  onValueChange={(value) => handleSelectChange("side", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paternal" id="side-paternal" />
                    <Label htmlFor="side-paternal">Father's Side</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maternal" id="side-maternal" />
                    <Label htmlFor="side-maternal">Mother's Side</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tribe">Tribe</Label>
                <Select
                  value={formData.tribe}
                  onValueChange={(value) => handleSelectChange("tribe", value)}
                >
                  <SelectTrigger id="tribe" className="focus:border-uganda-yellow focus:ring-uganda-yellow">
                    <SelectValue placeholder="Select a tribe" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTribes.map((tribe) => (
                      <SelectItem key={tribe} value={tribe}>{tribe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clan">Clan</Label>
                {formData.tribe ? (
                  <Select
                    value={formData.clan}
                    onValueChange={(value) => handleSelectChange("clan", value)}
                  >
                    <SelectTrigger id="clan" className="focus:border-uganda-yellow focus:ring-uganda-yellow">
                      <SelectValue placeholder="Select a clan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClans.length > 0 ? (
                        availableClans.map((clan) => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="other">Other (Custom)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="clan"
                    name="clan"
                    placeholder="Please select a tribe first"
                    value={formData.clan}
                    onChange={handleChange}
                    disabled
                    className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                  />
                )}
                {formData.clan === "other" && (
                  <Input
                    id="custom-clan"
                    name="clan"
                    placeholder="Enter your clan name"
                    value=""
                    onChange={handleChange}
                    className="mt-2 focus:border-uganda-yellow focus:ring-uganda-yellow"
                  />
                )}
              </div>
            </TabsContent>
            
            {/* Family Details Tab */}
            <TabsContent value="family" className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Spouse Information</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spouse-name">Name</Label>
                    <Input
                      id="spouse-name"
                      value={formData.spouse.name}
                      onChange={(e) => handleSpouseChange("name", e.target.value)}
                      placeholder="Spouse's name"
                      className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouse-birthYear">Birth Year</Label>
                    <Input
                      id="spouse-birthYear"
                      value={formData.spouse.birthYear}
                      onChange={(e) => handleSpouseChange("birthYear", e.target.value)}
                      placeholder="YYYY"
                      className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Siblings</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addSibling}
                    className="flex items-center text-uganda-red"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Add Sibling
                  </Button>
                </div>
                
                {formData.siblings.map((sibling, index) => (
                  <div key={index} className="border p-3 rounded-md bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">Sibling {index + 1}</Label>
                      {formData.siblings.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeSibling(index)}
                          className="h-8 w-8 p-0 text-uganda-red"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`sibling-${index}-name`}>Name</Label>
                        <Input
                          id={`sibling-${index}-name`}
                          value={sibling.name}
                          onChange={(e) => handleSiblingChange(index, "name", e.target.value)}
                          placeholder="Name"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`sibling-${index}-gender`}>Gender</Label>
                        <Select
                          value={sibling.gender}
                          onValueChange={(value) => handleSiblingChange(index, "gender", value)}
                        >
                          <SelectTrigger id={`sibling-${index}-gender`} className="focus:border-uganda-yellow focus:ring-uganda-yellow">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`sibling-${index}-birthYear`}>Birth Year</Label>
                        <Input
                          id={`sibling-${index}-birthYear`}
                          value={sibling.birthYear}
                          onChange={(e) => handleSiblingChange(index, "birthYear", e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            {/* Clan Elders Tab */}
            <TabsContent value="elders" className="space-y-4">
              {(!formData.tribe || !formData.clan) ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">Please select a tribe and clan first to see available elders</p>
                </div>
              ) : availableElders.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No elders found for the selected clan</p>
                  <p className="text-sm text-gray-400 mt-2">Try selecting another clan or contact an administrator</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Select Clan Elders Related to Your Family</Label>
                  <p className="text-sm text-gray-500">Choose any elders that you know are connected to your family lineage</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableElders.map(elder => (
                      <div 
                        key={elder.id} 
                        className={`p-3 border rounded-md cursor-pointer ${
                          formData.selectedElders.includes(elder.id) 
                            ? 'border-uganda-red bg-uganda-red/10' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleElderSelection(elder.id)}
                      >
                        <div className="font-medium">{elder.name}</div>
                        <div className="text-sm text-gray-500">{elder.approximateEra}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-uganda-red hover:bg-uganda-red/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Generating Tree..." : "Generate Family Tree"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FamilyTreeForm;
