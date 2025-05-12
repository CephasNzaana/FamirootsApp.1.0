
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
    extendedFamily: {
      familyName: "",
      gender: "male", // Default to male
      birthYear: "",
      birthPlace: "",
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
    }
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
        if (selectedClan && selectedClan.elders) {
          console.log("Found clan:", selectedClan.name, "with elders:", selectedClan.elders);
          // Map clan elders to ElderReference type
          const mappedElders = selectedClan.elders.map(elder => ({
            id: elder.id,
            name: elder.name,
            approximateEra: elder.approximateEra || "Unknown era",
            familyUnits: elder.familyConnections || []
          }));
          setAvailableElders(mappedElders);
        } else {
          setAvailableElders([]);
        }
      }
    }
  }, [formData.tribe, formData.clan]);

  // Handle extended family changes
  const handleExtendedFamilyChange = (path: string, value: any) => {
    setFormData(prev => {
      // Create a deep copy of the extendedFamily object
      const extendedFamily = { ...prev.extendedFamily } || {};
      
      // Split the path into parts
      const parts = path.split('.');
      
      // Navigate to the right property
      let target = extendedFamily as any;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) {
          target[parts[i]] = {};
        }
        target = target[parts[i]];
      }
      
      // Set the value
      target[parts[parts.length - 1]] = value;
      
      return { ...prev, extendedFamily };
    });
  };

  // Handle adding a sibling
  const handleAddSibling = () => {
    setFormData(prev => {
      const siblings = [...(prev.extendedFamily?.siblings || [])];
      siblings.push({ name: "", gender: "male", birthYear: "" });
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          siblings
        }
      };
    });
  };

  // Handle removing a sibling
  const handleRemoveSibling = (index: number) => {
    setFormData(prev => {
      const siblings = [...(prev.extendedFamily?.siblings || [])];
      siblings.splice(index, 1);
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          siblings
        }
      };
    });
  };

  // Update sibling information
  const handleSiblingChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const siblings = [...(prev.extendedFamily?.siblings || [])];
      siblings[index] = { ...siblings[index], [field]: value };
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          siblings
        }
      };
    });
  };

  // Handle spouse changes
  const handleSpouseChange = (field: string, value: string) => {
    setFormData(prev => {
      const updatedSpouse = {
        ...(prev.extendedFamily?.spouse || { name: "", birthYear: "" }),
        [field]: value
      };
      
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          spouse: updatedSpouse
        }
      };
    });
  };

  // Handle parent changes
  const handleParentChange = (parent: 'father' | 'mother', field: string, value: string) => {
    setFormData(prev => {
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          parents: {
            ...(prev.extendedFamily?.parents || {}),
            [parent]: {
              ...(prev.extendedFamily?.parents?.[parent] || {}),
              [field]: value
            }
          }
        }
      };
    });
  };

  // Handle grandparent changes
  const handleGrandparentChange = (side: 'paternal' | 'maternal', grandparent: 'grandfather' | 'grandmother', field: string, value: string) => {
    setFormData(prev => {
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          grandparents: {
            ...(prev.extendedFamily?.grandparents || {}),
            [side]: {
              ...(prev.extendedFamily?.grandparents?.[side] || {}),
              [grandparent]: {
                ...(prev.extendedFamily?.grandparents?.[side]?.[grandparent] || {}),
                [field]: value
              }
            }
          }
        }
      };
    });
  };

  // Handle adding a child
  const handleAddChild = () => {
    setFormData(prev => {
      const children = [...(prev.extendedFamily?.children || [])];
      children.push({ name: "", gender: "male", birthYear: "" });
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          children
        }
      };
    });
  };

  // Handle removing a child
  const handleRemoveChild = (index: number) => {
    setFormData(prev => {
      const children = [...(prev.extendedFamily?.children || [])];
      children.splice(index, 1);
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          children
        }
      };
    });
  };

  // Update child information
  const handleChildChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const children = [...(prev.extendedFamily?.children || [])];
      children[index] = { ...children[index], [field]: value };
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          children
        }
      };
    });
  };

  // Handle elder selection
  const handleElderSelect = (elderId: string, isSelected: boolean) => {
    setFormData(prev => {
      const selectedElders = [...(prev.extendedFamily?.selectedElders || [])];
      
      if (isSelected) {
        const elder = availableElders.find(e => e.id === elderId);
        if (elder && !selectedElders.some(e => e.id === elderId)) {
          selectedElders.push(elder);
        }
      } else {
        const index = selectedElders.findIndex(e => e.id === elderId);
        if (index !== -1) {
          selectedElders.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        extendedFamily: {
          ...prev.extendedFamily,
          selectedElders
        }
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.surname || !formData.tribe || !formData.clan || !formData.extendedFamily?.familyName) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Family Tree Information</CardTitle>
          <CardDescription>
            Provide basic information about your family tree
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="surname">Family Surname</Label>
              <Input
                id="surname"
                name="surname"
                placeholder="Enter family surname"
                value={formData.surname}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="tribe">Select Tribe</Label>
                <Select
                  value={formData.tribe}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, tribe: value, clan: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tribe" />
                  </SelectTrigger>
                  <SelectContent>
                    {ugandaTribesData.map((tribe) => (
                      <SelectItem key={tribe.id} value={tribe.name}>
                        {tribe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="clan">Select Clan</Label>
                <Select
                  value={formData.clan}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, clan: value }));
                  }}
                  disabled={!formData.tribe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.tribe ? "Select a clan" : "Select a tribe first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClans.map((clan) => (
                      <SelectItem key={clan} value={clan}>
                        {clan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <CardDescription>
            Enter your personal information as the primary family member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="familyName">Your Full Name</Label>
              <Input
                id="familyName"
                placeholder="Enter your full name"
                value={formData.extendedFamily?.familyName || ""}
                onChange={(e) => handleExtendedFamilyChange('familyName', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.extendedFamily?.gender || "male"}
                  onValueChange={(value) => handleExtendedFamilyChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="birthYear">Birth Year</Label>
                <Input
                  id="birthYear"
                  placeholder="e.g., 1980"
                  value={formData.extendedFamily?.birthYear || ""}
                  onChange={(e) => handleExtendedFamilyChange('birthYear', e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="birthPlace">Birth Place</Label>
                <Input
                  id="birthPlace"
                  placeholder="e.g., Kampala"
                  value={formData.extendedFamily?.birthPlace || ""}
                  onChange={(e) => handleExtendedFamilyChange('birthPlace', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="parents">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="grandparents">Grandparents</TabsTrigger>
          <TabsTrigger value="spouse">Spouse</TabsTrigger>
          <TabsTrigger value="siblings">Siblings</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Father's Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    placeholder="Enter father's name"
                    value={formData.extendedFamily?.parents?.father?.name || ""}
                    onChange={(e) => handleParentChange('father', 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="fatherBirthYear">Birth Year</Label>
                    <Input
                      id="fatherBirthYear"
                      placeholder="e.g., 1950"
                      value={formData.extendedFamily?.parents?.father?.birthYear || ""}
                      onChange={(e) => handleParentChange('father', 'birthYear', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="fatherDeathYear">Death Year (if applicable)</Label>
                    <Input
                      id="fatherDeathYear"
                      placeholder="e.g., 2010"
                      value={formData.extendedFamily?.parents?.father?.deathYear || ""}
                      onChange={(e) => handleParentChange('father', 'deathYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mother's Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input
                    id="motherName"
                    placeholder="Enter mother's name"
                    value={formData.extendedFamily?.parents?.mother?.name || ""}
                    onChange={(e) => handleParentChange('mother', 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="motherBirthYear">Birth Year</Label>
                    <Input
                      id="motherBirthYear"
                      placeholder="e.g., 1955"
                      value={formData.extendedFamily?.parents?.mother?.birthYear || ""}
                      onChange={(e) => handleParentChange('mother', 'birthYear', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="motherDeathYear">Death Year (if applicable)</Label>
                    <Input
                      id="motherDeathYear"
                      placeholder="e.g., 2015"
                      value={formData.extendedFamily?.parents?.mother?.deathYear || ""}
                      onChange={(e) => handleParentChange('mother', 'deathYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grandparents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paternal Grandfather</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="paternalGrandfatherName">Name</Label>
                  <Input
                    id="paternalGrandfatherName"
                    placeholder="Enter paternal grandfather's name"
                    value={formData.extendedFamily?.grandparents?.paternal?.grandfather?.name || ""}
                    onChange={(e) => handleGrandparentChange('paternal', 'grandfather', 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="paternalGrandfatherBirthYear">Birth Year</Label>
                    <Input
                      id="paternalGrandfatherBirthYear"
                      placeholder="e.g., 1920"
                      value={formData.extendedFamily?.grandparents?.paternal?.grandfather?.birthYear || ""}
                      onChange={(e) => handleGrandparentChange('paternal', 'grandfather', 'birthYear', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="paternalGrandfatherDeathYear">Death Year</Label>
                    <Input
                      id="paternalGrandfatherDeathYear"
                      placeholder="e.g., 1990"
                      value={formData.extendedFamily?.grandparents?.paternal?.grandfather?.deathYear || ""}
                      onChange={(e) => handleGrandparentChange('paternal', 'grandfather', 'deathYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paternal Grandmother</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="paternalGrandmotherName">Name</Label>
                  <Input
                    id="paternalGrandmotherName"
                    placeholder="Enter paternal grandmother's name"
                    value={formData.extendedFamily?.grandparents?.paternal?.grandmother?.name || ""}
                    onChange={(e) => handleGrandparentChange('paternal', 'grandmother', 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="paternalGrandmotherBirthYear">Birth Year</Label>
                    <Input
                      id="paternalGrandmotherBirthYear"
                      placeholder="e.g., 1925"
                      value={formData.extendedFamily?.grandparents?.paternal?.grandmother?.birthYear || ""}
                      onChange={(e) => handleGrandparentChange('paternal', 'grandmother', 'birthYear', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="paternalGrandmotherDeathYear">Death Year</Label>
                    <Input
                      id="paternalGrandmotherDeathYear"
                      placeholder="e.g., 1995"
                      value={formData.extendedFamily?.grandparents?.paternal?.grandmother?.deathYear || ""}
                      onChange={(e) => handleGrandparentChange('paternal', 'grandmother', 'deathYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maternal Grandfather</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="maternalGrandfatherName">Name</Label>
                  <Input
                    id="maternalGrandfatherName"
                    placeholder="Enter maternal grandfather's name"
                    value={formData.extendedFamily?.grandparents?.maternal?.grandfather?.name || ""}
                    onChange={(e) => handleGrandparentChange('maternal', 'grandfather', 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="maternalGrandfatherBirthYear">Birth Year</Label>
                    <Input
                      id="maternalGrandfatherBirthYear"
                      placeholder="e.g., 1930"
                      value={formData.extendedFamily?.grandparents?.maternal?.grandfather?.birthYear || ""}
                      onChange={(e) => handleGrandparentChange('maternal', 'grandfather', 'birthYear', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="maternalGrandfatherDeathYear">Death Year</Label>
                    <Input
                      id="maternalGrandfatherDeathYear"
                      placeholder="e.g., 2000"
                      value={formData.extendedFamily?.grandparents?.maternal?.grandfather?.deathYear || ""}
                      onChange={(e) => handleGrandparentChange('maternal', 'grandfather', 'deathYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maternal Grandmother</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="maternalGrandmotherName">Name</Label>
                  <Input
                    id="maternalGrandmotherName"
                    placeholder="Enter maternal grandmother's name"
                    value={formData.extendedFamily?.grandparents?.maternal?.grandmother?.name || ""}
                    onChange={(e) => handleGrandparentChange('maternal', 'grandmother', 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="maternalGrandmotherBirthYear">Birth Year</Label>
                    <Input
                      id="maternalGrandmotherBirthYear"
                      placeholder="e.g., 1935"
                      value={formData.extendedFamily?.grandparents?.maternal?.grandmother?.birthYear || ""}
                      onChange={(e) => handleGrandparentChange('maternal', 'grandmother', 'birthYear', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="maternalGrandmotherDeathYear">Death Year</Label>
                    <Input
                      id="maternalGrandmotherDeathYear"
                      placeholder="e.g., 2005"
                      value={formData.extendedFamily?.grandparents?.maternal?.grandmother?.deathYear || ""}
                      onChange={(e) => handleGrandparentChange('maternal', 'grandmother', 'deathYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spouse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spouse Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="spouseName">Spouse's Name</Label>
                  <Input
                    id="spouseName"
                    placeholder="Enter spouse's name"
                    value={formData.extendedFamily?.spouse?.name || ""}
                    onChange={(e) => handleSpouseChange('name', e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="spouseBirthYear">Birth Year</Label>
                  <Input
                    id="spouseBirthYear"
                    placeholder="e.g., 1985"
                    value={formData.extendedFamily?.spouse?.birthYear || ""}
                    onChange={(e) => handleSpouseChange('birthYear', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="siblings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Siblings</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleAddSibling}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Sibling
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(formData.extendedFamily?.siblings || []).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No siblings added yet. Click "Add Sibling" to begin.
                </div>
              ) : (
                (formData.extendedFamily?.siblings || []).map((sibling, index) => (
                  <div key={index} className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Sibling #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => handleRemoveSibling(index)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-3">
                        <Label>Name</Label>
                        <Input
                          placeholder="Enter sibling's name"
                          value={sibling.name}
                          onChange={(e) => handleSiblingChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label>Gender</Label>
                          <Select
                            value={sibling.gender}
                            onValueChange={(value) => handleSiblingChange(index, 'gender', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3">
                          <Label>Birth Year</Label>
                          <Input
                            placeholder="e.g., 1982"
                            value={sibling.birthYear}
                            onChange={(e) => handleSiblingChange(index, 'birthYear', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="children" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Children</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleAddChild}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Child
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(formData.extendedFamily?.children || []).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No children added yet. Click "Add Child" to begin.
                </div>
              ) : (
                (formData.extendedFamily?.children || []).map((child, index) => (
                  <div key={index} className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Child #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => handleRemoveChild(index)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-3">
                        <Label>Name</Label>
                        <Input
                          placeholder="Enter child's name"
                          value={child.name}
                          onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label>Gender</Label>
                          <Select
                            value={child.gender}
                            onValueChange={(value) => handleChildChange(index, 'gender', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3">
                          <Label>Birth Year</Label>
                          <Input
                            placeholder="e.g., 2010"
                            value={child.birthYear}
                            onChange={(e) => handleChildChange(index, 'birthYear', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {availableElders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect to Clan Elders</CardTitle>
            <CardDescription>
              Linking to clan elders helps verify family connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableElders.map((elder) => (
                <div key={elder.id} className="flex items-center space-x-2">
                  <Switch 
                    id={`elder-${elder.id}`}
                    checked={(formData.extendedFamily?.selectedElders || []).some(e => e.id === elder.id)}
                    onCheckedChange={(checked) => handleElderSelect(elder.id, checked)}
                  />
                  <div>
                    <Label htmlFor={`elder-${elder.id}`} className="font-medium cursor-pointer">
                      {elder.name}
                    </Label>
                    <p className="text-sm text-gray-500">{elder.approximateEra}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CardFooter className="flex justify-end pt-6 px-0">
        <Button 
          type="submit"
          disabled={isLoading}
          className="bg-uganda-red text-white hover:bg-uganda-red/90"
        >
          {isLoading ? "Creating Family Tree..." : "Create Family Tree"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default FamilyTreeForm;
