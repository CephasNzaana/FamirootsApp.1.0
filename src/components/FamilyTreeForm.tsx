// src/components/FamilyTreeForm.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TreeFormData,
    ElderReference,
    ClanElder as FullClanElderType,
    ExtendedFamilyInputData,
    Tribe as TribeType,
    Clan as ClanType
} from "@/types";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { PlusCircle, MinusCircle, Info, LinkIcon } from "lucide-react";
import { ugandaTribesData } from "@/data/ugandaTribesClanData";

interface FamilyTreeFormProps {
  onSubmit: (data: TreeFormData) => void;
  isLoading: boolean;
}

type RepeatableItemKey = keyof Pick<ExtendedFamilyInputData, 'siblings' | 'children' | 'paternalAuntsUncles' | 'maternalAuntsUncles'>;
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
      spouse: { name: "", birthYear: "", gender: "female", notes: "" },
      parents: {
        father: { name: "", birthYear: "", deathYear: "", notes: "" },
        mother: { name: "", birthYear: "", deathYear: "", notes: "" }
      },
      grandparents: {
        paternal: { grandfather: { name: "", birthYear: "", deathYear: "", notes: "" }, grandmother: { name: "", birthYear: "", deathYear: "", notes: "" } },
        maternal: { grandfather: { name: "", birthYear: "", deathYear: "", notes: "" }, grandmother: { name: "", birthYear: "", deathYear: "", notes: "" } }
      },
      children: [],
      paternalAuntsUncles: [],
      maternalAuntsUncles: [],
      paternalLineageElderTribe: undefined,
      paternalLineageElderClan: undefined,
      paternalLineageElderRef: undefined,
      maternalLineageElderTribe: undefined,
      maternalLineageElderClan: undefined,
      maternalLineageElderRef: undefined,
    }
  });

  const [paternalAvailableClans, setPaternalAvailableClans] = useState<ClanType[]>([]);
  const [paternalAvailableElders, setPaternalAvailableElders] = useState<FullClanElderType[]>([]);
  const [maternalAvailableClans, setMaternalAvailableClans] = useState<ClanType[]>([]);
  const [maternalAvailableElders, setMaternalAvailableElders] = useState<FullClanElderType[]>([]);
  const [mainAvailableClans, setMainAvailableClans] = useState<string[]>([]);

  const handleRootFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExtendedFamilyChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newExtendedFamily = JSON.parse(JSON.stringify(prev.extendedFamily || {}));
      let currentLevel = newExtendedFamily;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const arrayIndex = parseInt(arrayMatch[2], 10);
          if (!currentLevel[arrayName]) currentLevel[arrayName] = [];
          while (currentLevel[arrayName].length <= arrayIndex) {
            currentLevel[arrayName].push({});
          }
          currentLevel = currentLevel[arrayName][arrayIndex];
        } else {
          if (!currentLevel[key]) {
            currentLevel[key] = {};
          }
          currentLevel = currentLevel[key];
        }
      }
      currentLevel[keys[keys.length - 1]] = value;
      return { ...prev, extendedFamily: newExtendedFamily };
    });
  };
  
  useEffect(() => {
    const selectedTribeName = formData.tribe;
    if (selectedTribeName) {
      const selectedTribeData = ugandaTribesData.find(tribe => tribe.name === selectedTribeName);
      const newClans = selectedTribeData ? selectedTribeData.clans.map(c => c.name) : [];
      setMainAvailableClans(newClans);
      if (!newClans.includes(formData.clan || "")) {
        setFormData(prev => ({ ...prev, clan: "" }));
      }
    } else {
      setMainAvailableClans([]);
      setFormData(prev => ({ ...prev, clan: "" }));
    }
  }, [formData.tribe, formData.clan]); // Added formData.clan to dependencies to ensure clan reset logic fires correctly

  const commonTribeChangeHandler = (lineageType: 'paternal' | 'maternal', value: string | undefined) => {
    const tribeField = `extendedFamily.${lineageType}LineageElderTribe`;
    const clanField = `extendedFamily.${lineageType}LineageElderClan`;
    const elderRefField = `extendedFamily.${lineageType}LineageElderRef`;
    const setAvailableClans = lineageType === 'paternal' ? setPaternalAvailableClans : setMaternalAvailableClans;
    const setAvailableElders = lineageType === 'paternal' ? setPaternalAvailableElders : setMaternalAvailableElders;

    handleExtendedFamilyChange(tribeField, value || undefined);
    handleExtendedFamilyChange(clanField, undefined);
    handleExtendedFamilyChange(elderRefField, undefined);
    
    if (value) {
        const selectedTribeData = ugandaTribesData.find(t => t.name === value);
        setAvailableClans(selectedTribeData ? selectedTribeData.clans : []);
    } else {
        setAvailableClans([]);
    }
    setAvailableElders([]);
  };
  
  const commonClanChangeHandler = (lineageType: 'paternal' | 'maternal', value: string | undefined) => {
    const clanField = `extendedFamily.${lineageType}LineageElderClan`;
    const elderRefField = `extendedFamily.${lineageType}LineageElderRef`;
    const selectedTribe = formData.extendedFamily[`${lineageType}LineageElderTribe`];
    const setAvailableElders = lineageType === 'paternal' ? setPaternalAvailableElders : setMaternalAvailableElders;

    handleExtendedFamilyChange(clanField, value || undefined);
    handleExtendedFamilyChange(elderRefField, undefined);

    if (value && selectedTribe) {
        const tribeData = ugandaTribesData.find(t => t.name === selectedTribe);
        const clanData = tribeData?.clans.find(c => c.name === value);
        setAvailableElders(clanData?.elders || []);
    } else {
        setAvailableElders([]);
    }
  };

  const elderNameMap = useMemo(() => {
    const map = new Map<string, string>();
    ugandaTribesData.forEach(tribe => {
        tribe.clans.forEach(clan => {
            clan.elders?.forEach(elder => map.set(elder.id, elder.name));
        });
    });
    return map;
  }, []);
  
  const handleAddItem = (fieldKey: RepeatableItemKey) => {
    console.log(`[FamilyTreeForm] Adding item to: ${fieldKey}`);
    setFormData(prev => {
        const currentItems = prev.extendedFamily?.[fieldKey] || [];
        const newItem: RepeatableItem = { name: "", gender: "male", birthYear: "", notes: "" };
        const updatedItems = [...(currentItems as any[]), newItem];
        return {
            ...prev,
            extendedFamily: {
                ...prev.extendedFamily,
                [fieldKey]: updatedItems
            }
        };
    });
  };

  const handleRemoveItem = (fieldKey: RepeatableItemKey, index: number) => {
    console.log(`[FamilyTreeForm] Removing item from: ${fieldKey} at index: ${index}`);
    setFormData(prev => ({
      ...prev,
      extendedFamily: {
        ...prev.extendedFamily,
        [fieldKey]: (prev.extendedFamily?.[fieldKey] || ([] as any[])).filter((_, i) => i !== index)
      }
    }));
  };

  const handleItemChange = (
    fieldKey: RepeatableItemKey, 
    index: number, 
    subField: keyof RepeatableItem, 
    value: string
  ) => {
    console.log(`[FamilyTreeForm] Changing item in: ${fieldKey}, index: ${index}, field: ${subField}, value: ${value}`);
    setFormData(prev => {
      const newExtendedFamily = JSON.parse(JSON.stringify(prev.extendedFamily));
      const items = newExtendedFamily[fieldKey] as RepeatableItem[] || [];
      if (items[index]) {
        (items[index] as any)[subField] = value;
      }
      return {
        ...prev,
        extendedFamily: newExtendedFamily
      };
    });
  };

  const handleLineageElderSelect = (lineageType: 'paternal' | 'maternal', elderId: string | undefined) => {
    const fieldRefKey = `extendedFamily.${lineageType}LineageElderRef`;
    let elderRefToStore: ElderReference | undefined = undefined;

    if (elderId && elderId !== "") { 
      const sourceElderList = lineageType === 'paternal' ? paternalAvailableElders : maternalAvailableElders;
      const elderFullData = sourceElderList.find(e => e.id === elderId);
      if (elderFullData) {
        elderRefToStore = {
          id: elderFullData.id,
          name: elderFullData.name,
          approximateEra: elderFullData.approximateEra || elderFullData.era || "Unknown era",
          familyUnits: elderFullData.familyUnits || []
        };
      }
    }
    handleExtendedFamilyChange(fieldRefKey, elderRefToStore);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.surname || !formData.tribe || !formData.clan || !formData.extendedFamily?.familyName) {
      toast.error("Please fill in Surname, Primary Tribe, Primary Clan, and Your Full Name.");
      return;
    }
    console.log("[FamilyTreeForm] Submitting formData:", JSON.stringify(formData, null, 2));
    onSubmit(formData);
  };
  
  const renderRelativeFields = (
    sectionKey: RepeatableItemKey,
    sectionTitle: string,
    itemSingularName: string
  ) => (
    <Card className="mt-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{sectionTitle}</CardTitle>
          <Button
            type="button" variant="outline" size="sm"
            className="flex items-center gap-1"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddItem(sectionKey);}}
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
            <div key={`${sectionKey}-${index}`} className="border rounded-md p-4 mb-4 space-y-3 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm">{itemSingularName} #{index + 1}</h4>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveItem(sectionKey, index);}}
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
                    value={(item as RepeatableItem).gender || undefined} 
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
                    type="number"
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

  const renderElderLineageSelector = (
    lineageType: 'paternal' | 'maternal',
    title: string,
    selectedTribeInForm: string | undefined,
    onTribeChangeCallback: (value: string | undefined) => void,
    availableClansForLineage: ClanType[],
    selectedClanInForm: string | undefined,
    onClanChangeCallback: (value: string | undefined) => void,
    availableEldersForLineage: FullClanElderType[],
    selectedElderReferenceInForm: ElderReference | undefined,
    onElderSelectCallback: (elderId: string | undefined) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LinkIcon size={20} className="text-uganda-red" /> {title}</CardTitle>
        <CardDescription>Optionally, select a key historical elder from this lineage to connect your tree.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <Label>Tribe for {lineageType} Lineage</Label>
          <Select value={selectedTribeInForm || undefined} onValueChange={onTribeChangeCallback}>
            <SelectTrigger><SelectValue placeholder={`Select ${lineageType} tribe`} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {ugandaTribesData.map((tribe) => (
                <SelectItem key={tribe.id} value={tribe.name}>{tribe.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTribeInForm && (
          <div className="grid gap-3">
            <Label>Clan for {lineageType} Lineage</Label>
            <Select value={selectedClanInForm || undefined} onValueChange={onClanChangeCallback} disabled={!selectedTribeInForm || availableClansForLineage.length === 0}>
              <SelectTrigger><SelectValue placeholder={availableClansForLineage.length > 0 ? `Select ${lineageType} clan` : "Select tribe first or no clans"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {availableClansForLineage.map((clan) => (
                  <SelectItem key={clan.id} value={clan.name}>{clan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedTribeInForm && selectedClanInForm && (
          <div className="grid gap-3">
            <Label>Select Key Ancestral Elder from {selectedClanInForm}</Label>
            <Select value={selectedElderReferenceInForm?.id || undefined} onValueChange={(value) => onElderSelectCallback(value || undefined)}>
              <SelectTrigger><SelectValue placeholder={availableEldersForLineage.length > 0 ? "Select an elder or 'None'" : "No elders in this clan"} /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectGroup>
                  <SelectLabel>Elders of {selectedClanInForm} Clan</SelectLabel>
                  <SelectItem value="">None - No direct lineage link</SelectItem>
                  {availableEldersForLineage.map((elder) => {
                    const parentName = elder.parentId 
                      ? (elder.parentId.startsWith("TA_") 
                          ? `${elder.clanName ? elder.clanName.split(" ")[0] : 'Tribal'} Progenitor` 
                          : elderNameMap.get(elder.parentId) || "Known Elder") 
                      : "Founding Elder";
                    return (
                      <SelectItem key={elder.id} value={elder.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{elder.name} <span className="text-xs text-muted-foreground">({elder.gender}, {elder.approximateEra || elder.era})</span></span>
                          <span className="text-xs text-muted-foreground">
                              {elder.parentId?.startsWith("TA_") ? "Descends from: " : (elder.parentId ? "Child of: " : "")}
                              {parentName !== "Founding Elder" && parentName}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedElderReferenceInForm && (
             <div className="mt-2 p-3 bg-uganda-yellow/10 dark:bg-uganda-yellow/5 border border-uganda-yellow/30 rounded-md text-sm">
                <span className="font-semibold">{selectedElderReferenceInForm.name}</span> will be linked as your {lineageType} lineage ancestor.
            </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Family Tree Information</CardTitle>
          <CardDescription>Provide basic information about your family tree's primary affiliation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="surname">Family Surname *</Label>
            <Input id="surname" name="surname" placeholder="Enter family surname" value={formData.surname} onChange={handleRootFormChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="tribe">Your Primary Tribe *</Label>
              <Select value={formData.tribe || undefined} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, tribe: value || "", clan: ""}));
              }} required>
                <SelectTrigger id="tribe"><SelectValue placeholder="Select your primary tribe" /></SelectTrigger>
                <SelectContent>
                  {ugandaTribesData.map((tribe) => (
                    <SelectItem key={tribe.id} value={tribe.name}>{tribe.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="clan">Your Primary Clan *</Label>
              <Select value={formData.clan || undefined} onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, clan: value || ""}));
              }} disabled={!formData.tribe || mainAvailableClans.length === 0} required>
                <SelectTrigger id="clan"><SelectValue placeholder={formData.tribe ? (mainAvailableClans.length > 0 ? "Select your primary clan" : "No clans for tribe") : "Select tribe first"} /></SelectTrigger>
                <SelectContent>
                  {mainAvailableClans.map((clanName) => (
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
                <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
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
      
      <Card>
        <CardHeader>
            <CardTitle>Connect to Historical Clan Lineages (Optional)</CardTitle>
            <CardDescription className="flex items-start gap-2 pt-2 text-sm text-muted-foreground dark:text-gray-400">
              <Info size={48} className="text-sky-600 dark:text-sky-500 flex-shrink-0 mt-0.5" />
              <span>
                If you know a key historical elder from your paternal or maternal clan lineage, you can select them here. 
                This will link your tree to the established clan history. You can make one selection for each side.
                The main "Tribe" and "Clan" selected at the top usually refer to your paternal lineage or primary family affiliation.
              </span>
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {renderElderLineageSelector(
                'paternal', "Paternal Lineage Ancestral Elder",
                formData.extendedFamily.paternalLineageElderTribe,
                (value) => commonTribeChangeHandler('paternal', value),
                paternalAvailableClans,
                formData.extendedFamily.paternalLineageElderClan,
                (value) => commonClanChangeHandler('paternal', value),
                paternalAvailableElders,
                formData.extendedFamily.paternalLineageElderRef,
                (id) => handleLineageElderSelect('paternal', id)
            )}
            {renderElderLineageSelector(
                'maternal', "Maternal Lineage Ancestral Elder",
                formData.extendedFamily.maternalLineageElderTribe,
                (value) => commonTribeChangeHandler('maternal', value),
                maternalAvailableClans,
                formData.extendedFamily.maternalLineageElderClan,
                (value) => commonClanChangeHandler('maternal', value),
                maternalAvailableElders,
                formData.extendedFamily.maternalLineageElderRef,
                (id) => handleLineageElderSelect('maternal', id)
            )}
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
               <div className="grid gap-3"><Label htmlFor="fatherNotes">Notes</Label><Textarea id="fatherNotes" placeholder="Notes about father" value={formData.extendedFamily.parents?.father?.notes || ""} onChange={(e) => handleExtendedFamilyChange('parents.father.notes', e.target.value)} /></div>
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
              <div className="grid gap-3"><Label htmlFor="motherNotes">Notes</Label><Textarea id="motherNotes" placeholder="Notes about mother" value={formData.extendedFamily.parents?.mother?.notes || ""} onChange={(e) => handleExtendedFamilyChange('parents.mother.notes', e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="grandparents" className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Paternal Grandfather</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="pGrandfatherName">Name</Label><Input id="pGrandfatherName" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="pGrandfatherBirthYear">Birth Year</Label><Input id="pGrandfatherBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="pGrandfatherDeathYear">Death Year</Label><Input id="pGrandfatherDeathYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.deathYear', e.target.value)} /></div>
                    </div>
                     <div className="grid gap-3"><Label htmlFor="pGrandfatherNotes">Notes</Label><Textarea id="pGrandfatherNotes" placeholder="Notes" value={formData.extendedFamily.grandparents?.paternal?.grandfather?.notes || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandfather.notes', e.target.value)} /></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Paternal Grandmother</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="pGrandmotherName">Name</Label><Input id="pGrandmotherName" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="pGrandmotherBirthYear">Birth Year</Label><Input id="pGrandmotherBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="pGrandmotherDeathYear">Death Year</Label><Input id="pGrandmotherDeathYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.deathYear', e.target.value)} /></div>
                    </div>
                     <div className="grid gap-3"><Label htmlFor="pGrandmotherNotes">Notes</Label><Textarea id="pGrandmotherNotes" placeholder="Notes" value={formData.extendedFamily.grandparents?.paternal?.grandmother?.notes || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.paternal.grandmother.notes', e.target.value)} /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Maternal Grandfather</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="mGrandfatherName">Name</Label><Input id="mGrandfatherName" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="mGrandfatherBirthYear">Birth Year</Label><Input id="mGrandfatherBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="mGrandfatherDeathYear">Death Year</Label><Input id="mGrandfatherDeathYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.deathYear', e.target.value)} /></div>
                    </div>
                     <div className="grid gap-3"><Label htmlFor="mGrandfatherNotes">Notes</Label><Textarea id="mGrandfatherNotes" placeholder="Notes" value={formData.extendedFamily.grandparents?.maternal?.grandfather?.notes || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandfather.notes', e.target.value)} /></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Maternal Grandmother</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-3"><Label htmlFor="mGrandmotherName">Name</Label><Input id="mGrandmotherName" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.name || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3"><Label htmlFor="mGrandmotherBirthYear">Birth Year</Label><Input id="mGrandmotherBirthYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.birthYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.birthYear', e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="mGrandmotherDeathYear">Death Year</Label><Input id="mGrandmotherDeathYear" type="number" placeholder="YYYY" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.deathYear || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.deathYear', e.target.value)} /></div>
                    </div>
                     <div className="grid gap-3"><Label htmlFor="mGrandmotherNotes">Notes</Label><Textarea id="mGrandmotherNotes" placeholder="Notes" value={formData.extendedFamily.grandparents?.maternal?.grandmother?.notes || ""} onChange={(e) => handleExtendedFamilyChange('grandparents.maternal.grandmother.notes', e.target.value)} /></div>
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
                            <Select value={formData.extendedFamily.spouse?.gender || undefined} onValueChange={(value) => handleExtendedFamilyChange('spouse.gender', value)}>
                                <SelectTrigger id="spouseGender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="spouseNotes">Notes about Spouse (Optional)</Label>
                        <Textarea id="spouseNotes" placeholder="Any additional notes..." value={formData.extendedFamily.spouse?.notes || ""} onChange={(e) => handleExtendedFamilyChange('spouse.notes', e.target.value)} />
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
