
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
  Switch
} from "@/components/ui/switch";
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
    gender: "male", // Default to male
    siblings: [{ name: "", gender: "male", birthYear: "" }],
    spouse: { name: "", birthYear: "" },
    selectedElders: [],
    parents: {
      father: { name: "", birthYear: "", deathYear: "" },
      mother: { name: "", birthYear: "", deathYear: "" }
    },
    grandparents: {
      paternal: {
        grandfather: { name: "", birthYear: "", deathYear: "" },
        grandmother: { name: "", birthYear: "", deathYear: "" }
      },
      maternal: {
        grandfather: { name: "", birthYear: "", deathYear: "" },
        grandmother: { name: "", birthYear: "", deathYear: "" }
      }
    },
    children: []
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

  const handleSiblingStatusChange = (index: number, isDeceased: boolean) => {
    setFormData(prev => {
      const updatedSiblings = [...prev.siblings];
      updatedSiblings[index] = { 
        ...updatedSiblings[index], 
        status: isDeceased ? 'deceased' : 'living'
      };
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

  const handleSpouseStatusChange = (isDeceased: boolean) => {
    setFormData(prev => ({
      ...prev,
      spouse: { 
        ...prev.spouse, 
        status: isDeceased ? 'deceased' : 'living'
      }
    }));
  };

  const handleParentChange = (parent: 'father' | 'mother', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      parents: {
        ...prev.parents,
        [parent]: {
          ...prev.parents[parent],
          [field]: value
        }
      }
    }));
  };

  const handleGrandparentChange = (side: 'paternal' | 'maternal', grandparent: 'grandfather' | 'grandmother', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      grandparents: {
        ...prev.grandparents,
        [side]: {
          ...prev.grandparents[side],
          [grandparent]: {
            ...prev.grandparents[side][grandparent],
            [field]: value
          }
        }
      }
    }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { name: "", gender: "male", birthYear: "" }]
    }));
  };

  const handleChildChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedChildren = [...prev.children];
      updatedChildren[index] = { ...updatedChildren[index], [field]: value };
      return { ...prev, children: updatedChildren };
    });
  };

  const removeChild = (index: number) => {
    setFormData(prev => {
      const updatedChildren = [...prev.children];
      updatedChildren.splice(index, 1);
      return { ...prev, children: updatedChildren };
    });
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="parents">Parents</TabsTrigger>
              <TabsTrigger value="grandparents">Grandparents</TabsTrigger>
              <TabsTrigger value="family">Other Family</TabsTrigger>
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
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger id="gender" className="focus:border-uganda-yellow focus:ring-uganda-yellow">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthYear">Your Birth Year</Label>
                  <Input
                    id="birthYear"
                    name="birthYear"
                    placeholder="YYYY"
                    value={formData.birthYear || ""}
                    onChange={handleChange}
                    className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Your Birth Place</Label>
                  <Input
                    id="birthPlace"
                    name="birthPlace"
                    placeholder="e.g. Kampala"
                    value={formData.birthPlace || ""}
                    onChange={handleChange}
                    className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                  />
                </div>
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
            
            {/* Parents Tab */}
            <TabsContent value="parents" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Father's Information</Label>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father-name">Father's Name</Label>
                    <Input
                      id="father-name"
                      value={formData.parents.father.name}
                      onChange={(e) => handleParentChange('father', 'name', e.target.value)}
                      placeholder="Father's full name"
                      className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="father-birthYear">Birth Year</Label>
                      <Input
                        id="father-birthYear"
                        value={formData.parents.father.birthYear}
                        onChange={(e) => handleParentChange('father', 'birthYear', e.target.value)}
                        placeholder="YYYY"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father-deathYear">Death Year (if deceased)</Label>
                      <Input
                        id="father-deathYear"
                        value={formData.parents.father.deathYear || ""}
                        onChange={(e) => handleParentChange('father', 'deathYear', e.target.value)}
                        placeholder="YYYY"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="father-deceased"
                      checked={formData.parents.father.deathYear !== undefined && formData.parents.father.deathYear !== ""}
                      onCheckedChange={(checked) => {
                        if (checked && !formData.parents.father.deathYear) {
                          handleParentChange('father', 'deathYear', "");
                        } else if (!checked) {
                          handleParentChange('father', 'deathYear', "");
                        }
                      }}
                    />
                    <Label htmlFor="father-deceased">Deceased</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Mother's Information</Label>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mother-name">Mother's Name</Label>
                    <Input
                      id="mother-name"
                      value={formData.parents.mother.name}
                      onChange={(e) => handleParentChange('mother', 'name', e.target.value)}
                      placeholder="Mother's full name"
                      className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mother-birthYear">Birth Year</Label>
                      <Input
                        id="mother-birthYear"
                        value={formData.parents.mother.birthYear}
                        onChange={(e) => handleParentChange('mother', 'birthYear', e.target.value)}
                        placeholder="YYYY"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother-deathYear">Death Year (if deceased)</Label>
                      <Input
                        id="mother-deathYear"
                        value={formData.parents.mother.deathYear || ""}
                        onChange={(e) => handleParentChange('mother', 'deathYear', e.target.value)}
                        placeholder="YYYY"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="mother-deceased"
                      checked={formData.parents.mother.deathYear !== undefined && formData.parents.mother.deathYear !== ""}
                      onCheckedChange={(checked) => {
                        if (checked && !formData.parents.mother.deathYear) {
                          handleParentChange('mother', 'deathYear', "");
                        } else if (!checked) {
                          handleParentChange('mother', 'deathYear', "");
                        }
                      }}
                    />
                    <Label htmlFor="mother-deceased">Deceased</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Grandparents Tab */}
            <TabsContent value="grandparents" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Paternal Grandparents</Label>
                </div>
                
                <div className="border p-3 rounded-md bg-gray-50 space-y-3">
                  <Label className="font-medium">Grandfather (Father's Father)</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="paternal-grandfather-name">Name</Label>
                      <Input
                        id="paternal-grandfather-name"
                        value={formData.grandparents.paternal.grandfather.name}
                        onChange={(e) => handleGrandparentChange('paternal', 'grandfather', 'name', e.target.value)}
                        placeholder="Full name"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="paternal-grandfather-birthYear">Birth Year</Label>
                        <Input
                          id="paternal-grandfather-birthYear"
                          value={formData.grandparents.paternal.grandfather.birthYear}
                          onChange={(e) => handleGrandparentChange('paternal', 'grandfather', 'birthYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="paternal-grandfather-deathYear">Death Year</Label>
                        <Input
                          id="paternal-grandfather-deathYear"
                          value={formData.grandparents.paternal.grandfather.deathYear || ""}
                          onChange={(e) => handleGrandparentChange('paternal', 'grandfather', 'deathYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border p-3 rounded-md bg-gray-50 space-y-3">
                  <Label className="font-medium">Grandmother (Father's Mother)</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="paternal-grandmother-name">Name</Label>
                      <Input
                        id="paternal-grandmother-name"
                        value={formData.grandparents.paternal.grandmother.name}
                        onChange={(e) => handleGrandparentChange('paternal', 'grandmother', 'name', e.target.value)}
                        placeholder="Full name"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="paternal-grandmother-birthYear">Birth Year</Label>
                        <Input
                          id="paternal-grandmother-birthYear"
                          value={formData.grandparents.paternal.grandmother.birthYear}
                          onChange={(e) => handleGrandparentChange('paternal', 'grandmother', 'birthYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="paternal-grandmother-deathYear">Death Year</Label>
                        <Input
                          id="paternal-grandmother-deathYear"
                          value={formData.grandparents.paternal.grandmother.deathYear || ""}
                          onChange={(e) => handleGrandparentChange('paternal', 'grandmother', 'deathYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Maternal Grandparents</Label>
                </div>
                
                <div className="border p-3 rounded-md bg-gray-50 space-y-3">
                  <Label className="font-medium">Grandfather (Mother's Father)</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="maternal-grandfather-name">Name</Label>
                      <Input
                        id="maternal-grandfather-name"
                        value={formData.grandparents.maternal.grandfather.name}
                        onChange={(e) => handleGrandparentChange('maternal', 'grandfather', 'name', e.target.value)}
                        placeholder="Full name"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="maternal-grandfather-birthYear">Birth Year</Label>
                        <Input
                          id="maternal-grandfather-birthYear"
                          value={formData.grandparents.maternal.grandfather.birthYear}
                          onChange={(e) => handleGrandparentChange('maternal', 'grandfather', 'birthYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="maternal-grandfather-deathYear">Death Year</Label>
                        <Input
                          id="maternal-grandfather-deathYear"
                          value={formData.grandparents.maternal.grandfather.deathYear || ""}
                          onChange={(e) => handleGrandparentChange('maternal', 'grandfather', 'deathYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border p-3 rounded-md bg-gray-50 space-y-3">
                  <Label className="font-medium">Grandmother (Mother's Mother)</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="maternal-grandmother-name">Name</Label>
                      <Input
                        id="maternal-grandmother-name"
                        value={formData.grandparents.maternal.grandmother.name}
                        onChange={(e) => handleGrandparentChange('maternal', 'grandmother', 'name', e.target.value)}
                        placeholder="Full name"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="maternal-grandmother-birthYear">Birth Year</Label>
                        <Input
                          id="maternal-grandmother-birthYear"
                          value={formData.grandparents.maternal.grandmother.birthYear}
                          onChange={(e) => handleGrandparentChange('maternal', 'grandmother', 'birthYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="maternal-grandmother-deathYear">Death Year</Label>
                        <Input
                          id="maternal-grandmother-deathYear"
                          value={formData.grandparents.maternal.grandmother.deathYear || ""}
                          onChange={(e) => handleGrandparentChange('maternal', 'grandmother', 'deathYear', e.target.value)}
                          placeholder="YYYY"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Family Details Tab */}
            <TabsContent value="family" className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Spouse Information</Label>
                </div>
                <div className="grid grid-cols-1 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="spouse-deathYear">Death Year (if deceased)</Label>
                      <Input
                        id="spouse-deathYear"
                        value={formData.spouse.deathYear || ""}
                        onChange={(e) => handleSpouseChange("deathYear", e.target.value)}
                        placeholder="YYYY"
                        className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        disabled={formData.spouse.status !== "deceased"}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="spouse-deceased"
                      checked={formData.spouse.status === "deceased"}
                      onCheckedChange={handleSpouseStatusChange}
                    />
                    <Label htmlFor="spouse-deceased">Deceased</Label>
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
                    
                    <div className="grid grid-cols-1 gap-3">
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
                      
                      <div className="grid grid-cols-2 gap-3">
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
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id={`sibling-${index}-deceased`}
                            checked={sibling.status === "deceased"}
                            onCheckedChange={(checked) => handleSiblingStatusChange(index, checked)}
                          />
                          <Label htmlFor={`sibling-${index}-deceased`}>Deceased</Label>
                        </div>
                        {sibling.status === "deceased" && (
                          <div className="space-y-1">
                            <Label htmlFor={`sibling-${index}-deathYear`}>Death Year</Label>
                            <Input
                              id={`sibling-${index}-deathYear`}
                              value={sibling.deathYear || ""}
                              onChange={(e) => handleSiblingChange(index, "deathYear", e.target.value)}
                              placeholder="YYYY"
                              className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Children</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addChild}
                    className="flex items-center text-uganda-red"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Add Child
                  </Button>
                </div>
                
                {formData.children.map((child, index) => (
                  <div key={index} className="border p-3 rounded-md bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">Child {index + 1}</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeChild(index)}
                        className="h-8 w-8 p-0 text-uganda-red"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`child-${index}-name`}>Name</Label>
                        <Input
                          id={`child-${index}-name`}
                          value={child.name}
                          onChange={(e) => handleChildChange(index, "name", e.target.value)}
                          placeholder="Name"
                          className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`child-${index}-gender`}>Gender</Label>
                          <Select
                            value={child.gender}
                            onValueChange={(value) => handleChildChange(index, "gender", value)}
                          >
                            <SelectTrigger id={`child-${index}-gender`} className="focus:border-uganda-yellow focus:ring-uganda-yellow">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`child-${index}-birthYear`}>Birth Year</Label>
                          <Input
                            id={`child-${index}-birthYear`}
                            value={child.birthYear}
                            onChange={(e) => handleChildChange(index, "birthYear", e.target.value)}
                            placeholder="YYYY"
                            className="focus:border-uganda-yellow focus:ring-uganda-yellow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {formData.children.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-gray-300 rounded-md">
                    <p className="text-gray-500">Click "Add Child" to add children to your family tree</p>
                  </div>
                )}
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
