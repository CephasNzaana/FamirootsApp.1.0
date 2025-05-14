// src/components/FamilyTreeForm.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TreeFormData, ElderReference, ClanElder as FullClanElderType, ExtendedFamilyInputData } from "@/types"; // Ensure ExtendedFamilyInputData is imported if used for aunts/uncles
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
import { PlusCircle, MinusCircle, Info } from "lucide-react";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

interface FamilyTreeFormProps {
  onSubmit: (data: TreeFormData) => void;
  isLoading: boolean;
}

// Define a type for the items in repeatable sections, consistent with TreeFormData
type RepeatableItem = { name: string; gender: string; birthYear?: string; notes?: string };


const FamilyTreeForm = ({ onSubmit, isLoading }: FamilyTreeFormProps) => {
  const [formData, setFormData] = useState<TreeFormData>({
    surname: "",
    tribe: "",
    clan: "",
    extendedFamily: {
      familyName: "",
      gender: "male",
      birthYear: "",
      birthPlace: "",
      notes: "", 
      siblings: [], 
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
      children: [],
      paternalAuntsUncles: [], // Added based on your types.ts update
      maternalAuntsUncles: [], // Added based on your types.ts update
    }
  });

  const [availableClanEldersFull, setAvailableClanEldersFull] = useState<FullClanElderType[]>([]);
  const [availableClans, setAvailableClans] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (formData.tribe) {
      const selectedTribeData = ugandaTribesData.find(tribe => tribe.name === formData.tribe);
      if (selectedTribeData) {
        const clanNames = selectedTribeData.clans.map(clan => clan.name);
        setAvailableClans(clanNames);
        // Reset clan and selected elders when tribe changes to avoid invalid state
        setFormData(prev => ({ 
            ...prev, 
            clan: "", 
            extendedFamily: {
                ...prev.extendedFamily, 
                selectedElders: []
            } 
        }));
        setAvailableClanEldersFull([]);
      } else {
        setAvailableClans([]);
        setAvailableClanEldersFull([]);
      }
    } else {
      setAvailableClans([]);
      setAvailableClanEldersFull([]);
    }
  }, [formData.tribe]);

  useEffect(() => {
    if (formData.tribe && formData.clan) {
      const selectedTribeData = ugandaTribesData.find(tribe => tribe.name === formData.tribe);
      if (selectedTribeData) {
        const selectedClanData = selectedTribeData.clans.find(clan => clan.name === formData.clan);
        if (selectedClanData && selectedClanData.elders) {
          setAvailableClanEldersFull(selectedClanData.elders);
        } else {
          setAvailableClanEldersFull([]);
        }
      } else {
        setAvailableClanEldersFull([]);
      }
    } else {
      setAvailableClanEldersFull([]); // Clear if no clan selected
    }
  }, [formData.tribe, formData.clan]);

  const elderNameMap = useMemo(() => {
    const map = new Map<string, string>();
    availableClanEldersFull.forEach(elder => {
      map.set(elder.id, elder.name);
    });
    // Add tribal ancestors for display if their IDs are known and used in parentId
    // This is a conceptual addition for display in the form, actual ancestor data from types.ts
    // For example, if you have a known list of tribal ancestor IDs like "TA_baganda"
    // map.set("TA_baganda", "Baganda Tribal Ancestor"); 
    return map;
  }, [availableClanEldersFull]);

  const handleExtendedFamilyChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newExtendedFamily = JSON.parse(JSON.stringify(prev.extendedFamily)); // Deep clone
      
      let currentLevel = newExtendedFamily;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!currentLevel[keys[i]]) {
          currentLevel[keys[i]] = {};
        }
        currentLevel = currentLevel[keys[i]];
      }
      currentLevel[keys[keys.length - 1]] = value;
      
      return { ...prev, extendedFamily: newExtendedFamily };
    });
  };
  
  const handleAddItem = (fieldKey: keyof Pick<ExtendedFamilyInputData, 'siblings' | 'children' | 'paternalAuntsUncles' | 'maternalAuntsUncles'>) => {
    setFormData(prev => ({
      ...prev,
      extendedFamily: {
        ...prev.extendedFamily,
        [fieldKey]: [...(prev.extendedFamily?.[fieldKey] || ([] as any[])), { name: "", gender: "male", birthYear: "", notes: "" }] // Added notes to default item
      }
    }));
  };

  const handleRemoveItem = (fieldKey: keyof Pick<ExtendedFamilyInputData, 'siblings' | 'children' | 'paternalAuntsUncles' | 'maternalAuntsUncles'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      extendedFamily: {
        ...prev.extendedFamily,
        [fieldKey]: (prev.extendedFamily?.[fieldKey] || ([] as any[])).filter((_, i) => i !== index)
      }
    }));
  };

  const handleItemChange = (
    fieldKey: keyof Pick<ExtendedFamilyInputData, 'siblings' | 'children' | 'paternalAuntsUncles' | 'maternalAuntsUncles'>, 
    index: number, 
    subField: keyof RepeatableItem, 
    value: string
  ) => {
    setFormData(prev => {
      const items = [...(prev.extendedFamily?.[fieldKey] || ([] as any[]))] as RepeatableItem[];
      if (items[index]) {
        items[index] = { ...items[index], [subField]: value };
      }
      return {
        ...prev,
        extendedFamily: { ...prev.extendedFamily, [fieldKey]: items }
      };
    });
  };

  const handleElderSelect = (elderId: string, isSelected: boolean) => {
    const currentSelectedCount = (formData.extendedFamily?.selectedElders || []).length;
    if (isSelected && currentSelectedCount >= 5) {
        toast.info("You can select up to 5 key ancestral elders for general linkage.");
        return;
    }

    setFormData(prev => {
      let currentSelectedElders = [...(prev.extendedFamily?.selectedElders || [])];
      if (isSelected) {
        const elderFullData = availableClanEldersFull.find(e => e.id === elderId);
        if (elderFullData && !currentSelectedElders.some(e => e.id === elderId)) {
          currentSelectedElders.push({
            id: elderFullData.id,
            name: elderFullData.name,
            approximateEra: elderFullData.approximateEra || elderFullData.era || "Unknown era",
            familyUnits: elderFullData.familyUnits || [] 
            // Ensure ElderReference fields are populated
          });
        }
      } else {
        currentSelectedElders = currentSelectedElders.filter(e => e.id !== elderId);
      }
      return {
        ...prev,
        extendedFamily: { ...prev.extendedFamily, selectedElders: currentSelectedElders }
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.surname || !formData.tribe || !formData.clan || !formData.extendedFamily?.familyName) {
      toast.error("Please fill in Surname, Tribe, Clan, and Your Full Name.");
      return;
    }
    onSubmit(formData);
  };
  
  const renderRelativeFields = (
    sectionKey: keyof Pick<ExtendedFamilyInputData, 'siblings' | 'children' | 'paternalAuntsUncles' | 'maternalAuntsUncles'>,
    sectionTitle: string,
    itemSingularName: string // e.g., "Sibling", "Child", "Relative"
  ) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{sectionTitle}</CardTitle>
          <Button
            type="button" variant="outline" size="sm"
            className="flex items-center gap-1"
            onClick={() => handleAddItem(sectionKey)}
          >
            <PlusCircle className="h-4 w-4" /> Add {itemSingularName}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(formData.extendedFamily?.[sectionKey] || []).length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No {sectionTitle.toLowerCase()} added yet. Click "Add {itemSingularName}" to begin.
          </div>
        ) : (
          (formData.extendedFamily?.[sectionKey] || []).map((item, index) => (
            <div key={index} className="border rounded-md p-4 mb-4 space-y-3 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm">{itemSingularName} #{index + 1}</h4>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={() => handleRemoveItem(sectionKey, index)}
                >
                  <MinusCircle className="h-4 w-4" /> <span className="sr-only">Remove</span>
                </Button>
              </div>
              <div className="grid gap-3">
                <Label htmlFor={`${sectionKey}-${index}-name`} className="text-xs">Name</Label>
                <Input
                  id={`${sectionKey}-${index}-name`}
                  placeholder={`Enter ${itemSingularName.toLowerCase()}'s name`}
                  value={(item as RepeatableItem).name}
                  onChange={(e) => handleItemChange(sectionKey, index, 'name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor={`${sectionKey}-${index}-gender`} className="text-xs">Gender</Label>
                  <Select
                    value={(item as RepeatableItem).gender}
                    onValueChange={(value) => handleItemChange(sectionKey, index, 'gender', value)}
                  >
                    <SelectTrigger id={`${sectionKey}-${index}-gender`}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor={`${sectionKey}-${index}-birthYear`} className="text-xs">Birth Year</Label>
                  <Input
                    id={`${sectionKey}-${index}-birthYear`}
                    placeholder="e.g., 1982"
                    value={(item as RepeatableItem).birthYear || ""}
                    onChange={(e) => handleItemChange(sectionKey, index, 'birthYear', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor={`${sectionKey}-${index}-notes`} className="text-xs">Notes (Optional)</Label>
                <Textarea 
                    id={`${sectionKey}-${index}-notes`}
                    placeholder={`Notes about this ${itemSingularName.toLowerCase()}`}
                    value={(item as RepeatableItem).notes || ""}
                    onChange={(e) => handleItemChange(sectionKey, index, 'notes', e.target.value)} 
                    rows={2}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Family Tree Information</CardTitle>
          <CardDescription>Provide basic information about your family tree.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="surname">Family Surname *</Label>
            <Input id="surname" name="surname" placeholder="Enter family surname" value={formData.surname} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="tribe">Select Tribe *</Label>
              <Select value={formData.tribe} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, tribe: value, clan: "", extendedFamily: {...prev.extendedFamily, selectedElders: []} }));
              }} required>
                <SelectTrigger><SelectValue placeholder="Select a tribe" /></SelectTrigger>
                <SelectContent>
                  {ugandaTribesData.map((tribe) => (
                    <SelectItem key={tribe.id} value={tribe.name}>{tribe.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="clan">Select Clan *</Label>
              <Select value={formData.clan} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, clan: value, extendedFamily: {...prev.extendedFamily, selectedElders: []} }));
              }} disabled={!formData.tribe || availableClans.length === 0} required>
                <SelectTrigger><SelectValue placeholder={formData.tribe ? (availableClans.length > 0 ? "Select a clan" : "No clans for tribe") : "Select tribe first"} /></SelectTrigger>
                <SelectContent>
                  {availableClans.map((clanName) => (
                    <SelectItem key={clanName} value={clanName}>{clanName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About You (Main Person)</CardTitle>
          <CardDescription>Enter your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="familyName">Your Full Name *</Label>
            <Input id="familyName" placeholder="Enter your full name" value={formData.extendedFamily.familyName || ""} onChange={(e) => handleExtendedFamilyChange('familyName', e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="gender">Your Gender</Label>
              <Select value={formData.extendedFamily.gender || "male"} onValueChange={(value) => handleExtendedFamilyChange('gender', value)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  {/* <SelectItem value="other">Other</SelectItem> // Per types.ts, only male/female for FamilyMember */}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="mainBirthYear">Your Birth Year</Label>
              <Input id="mainBirthYear" type="number" placeholder="e.g., 1990" value={formData.extendedFamily.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('birthYear', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="mainBirthPlace">Your Birth Place</Label>
            <Input id="mainBirthPlace" placeholder="e.g., Kabale, Uganda" value={formData.extendedFamily.birthPlace || ""} onChange={(e) => handleExtendedFamilyChange('birthPlace', e.target.value)} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="mainNotes">Notes about You (Optional)</Label>
            <Textarea id="mainNotes" placeholder="Any additional notes, e.g., occupation, significant life events..." value={formData.extendedFamily.notes || ""} onChange={(e) => handleExtendedFamilyChange('notes', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="parents" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="parents" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md">Parents</TabsTrigger>
          <TabsTrigger value="grandparents" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md">Grandparents</TabsTrigger>
          <TabsTrigger value="spouse" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md">Spouse</TabsTrigger>
          <TabsTrigger value="siblings" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md">Siblings</TabsTrigger>
          <TabsTrigger value="children" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md">Children</TabsTrigger>
          <TabsTrigger value="other_relatives" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md">Other Relatives</TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Father's Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3"><Label htmlFor="fatherName">Father's Name</Label><Input id="fatherName" placeholder="Full name" value={formData.extendedFamily.parents?.father?.name || ""} onChange={(e) => handleExtendedFamilyChange('parents.father.name', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3"><Label htmlFor="fatherBirthYear">Birth Year</Label><Input id="fatherBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.parents?.father?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('parents.father.birthYear', e.target.value)} /></div>
                <div className="grid gap-3"><Label htmlFor="fatherDeathYear">Death Year (if any)</Label><Input id="fatherDeathYear" type="number" placeholder="YYYY" value={formData.extendedFamily.parents?.father?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('parents.father.deathYear', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mother's Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
               <div className="grid gap-3"><Label htmlFor="motherName">Mother's Name</Label><Input id="motherName" placeholder="Full name" value={formData.extendedFamily.parents?.mother?.name || ""} onChange={(e) => handleExtendedFamilyChange('parents.mother.name', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3"><Label htmlFor="motherBirthYear">Birth Year</Label><Input id="motherBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.parents?.mother?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('parents.mother.birthYear', e.target.value)} /></div>
                <div className="grid gap-3"><Label htmlFor="motherDeathYear">Death Year (if any)</Label><Input id="motherDeathYear" type="number" placeholder="YYYY" value={formData.extendedFamily.parents?.mother?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('parents.mother.deathYear', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grandparents" className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Paternal Grandfather</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="pGrandfatherName">Name</Label><Input id="pGrandfatherName" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="pGrandfatherBirthYear">Birth Year</Label><Input id="pGrandfatherBirthYear" type="number" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="pGrandfatherDeathYear">Death Year</Label><Input id="pGrandfatherDeathYear" type="number" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.deathYear', e.target.value)} /></div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Paternal Grandmother</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="pGrandmotherName">Name</Label><Input id="pGrandmotherName" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="pGrandmotherBirthYear">Birth Year</Label><Input id="pGrandmotherBirthYear" type="number" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="pGrandmotherDeathYear">Death Year</Label><Input id="pGrandmotherDeathYear" type="number" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.deathYear', e.target.value)} /></div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Maternal Grandfather</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="mGrandfatherName">Name</Label><Input id="mGrandfatherName" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="mGrandfatherBirthYear">Birth Year</Label><Input id="mGrandfatherBirthYear" type="number" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="mGrandfatherDeathYear">Death Year</Label><Input id="mGrandfatherDeathYear" type="number" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.deathYear', e.target.value)} /></div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Maternal Grandmother</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="mGrandmotherName">Name</Label><Input id="mGrandmotherName" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="mGrandmotherBirthYear">Birth Year</Label><Input id="mGrandmotherBirthYear" type="number" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="mGrandmotherDeathYear">Death Year</Label><Input id="mGrandmotherDeathYear" type="number" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.deathYear', e.target.value)} /></div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="spouse" className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Spouse's Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="spouseName">Spouse's Name</Label><Input id="spouseName" placeholder="Full name" value={formData.extendedFamily.spouse?.name || ""} onChange={(e) => handleExtendedFamilyChange('spouse.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="spouseBirthYear">Spouse's Birth Year</Label><Input id="spouseBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.spouse?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('spouse.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3">
                            <Label htmlFor="spouseGender">Spouse's Gender</Label>
                            <Select value={formData.extendedFamily.spouse?.gender || ""} onValueChange={(value) => handleExtendedFamilyChange('spouse.gender', value)}>
                                <SelectTrigger id="spouseGender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="siblings" className="space-y-6">
            {renderRelativeFields('siblings', 'Siblings', 'Sibling')}
        </TabsContent>

        <TabsContent value="children" className="space-y-6">
            {renderRelativeFields('children', 'Children', 'Child')}
        </TabsContent>
        
        <TabsContent value="other_relatives" className="space-y-6">
            {renderRelativeFields('paternalAuntsUncles', "Father's Siblings (Uncles/Aunts)", 'Relative')}
            {renderRelativeFields('maternalAuntsUncles', "Mother's Siblings (Uncles/Aunts)", 'Relative')}
        </TabsContent>
      </Tabs>

      {formData.clan && availableClanEldersFull.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect to Clan Elders</CardTitle>
            <CardDescription className="flex items-start gap-2 pt-2 text-sm text-muted-foreground">
                <Info size={28} className="text-sky-600 flex-shrink-0 mt-0.5" />
                <span>
                Select key ancestral figures (up to 5) you identify with from the <span className="font-semibold text-uganda-red">{formData.clan}</span> clan. 
                Their relationships are shown to help you understand their lineage. This connection adds depth to your family tree.
                </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 border rounded-md p-3 bg-slate-50/50 dark:bg-slate-800/30">
              {availableClanEldersFull.map((elder) => {
                const parentName = elder.parentId 
                  ? (elder.parentId.startsWith("TA_") 
                      ? elder.clanName ? `${elder.clanName} Tribal Ancestor` : "Tribal Ancestor" // More specific if clanName is on elder
                      : elderNameMap.get(elder.parentId) || "An Elder") 
                  : "Founding Elder";
                const isSelected = (formData.extendedFamily?.selectedElders || []).some(e => e.id === elder.id);
                return (
                  <div key={elder.id} className={`flex items-start space-x-3 p-3 rounded-md border transition-colors ${isSelected ? 'bg-uganda-yellow/20 border-uganda-yellow dark:bg-uganda-yellow/10 dark:border-uganda-yellow/50' : 'bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <Switch
                      id={`elder-${elder.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleElderSelect(elder.id, checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={`elder-${elder.id}`} className="font-semibold text-base cursor-pointer text-slate-800 dark:text-slate-100 hover:text-uganda-red dark:hover:text-uganda-yellow">
                        {elder.name} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({elder.gender}, {elder.approximateEra || elder.era})</span>
                      </Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {elder.parentId?.startsWith("TA_") ? "Descends from" : (elder.parentId ? "Son of" : "Considered a")} <span className="font-medium text-slate-600 dark:text-slate-300">{parentName}</span>
                      </p>
                      {(elder.significance || elder.notes) && (
                         <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                           {elder.significance || elder.notes}
                         </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CardFooter className="flex justify-center md:justify-end pt-8 mt-4 border-t dark:border-slate-700">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto bg-uganda-red text-white hover:bg-uganda-red/90 px-10 py-3 text-base font-semibold rounded-lg"
        >
          {isLoading ? "Generating Your Tree..." : "Generate & Save Family Tree"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default FamilyTreeForm;
