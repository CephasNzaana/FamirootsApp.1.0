
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TreeFormData } from "@/types";
import { toast } from "@/components/ui/sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FamilyTreeFormProps {
  onSubmit: (data: TreeFormData) => void;
  isLoading: boolean;
}

const FamilyTreeForm = ({ onSubmit, isLoading }: FamilyTreeFormProps) => {
  const [formData, setFormData] = useState<TreeFormData>({
    surname: "",
    tribe: "",
    clan: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.surname || !formData.tribe || !formData.clan) {
      toast.error("Please fill in all fields");
      return;
    }
    
    // Log form submission for debugging
    console.log("Submitting form data:", formData);
    
    // Call the parent's onSubmit function
    onSubmit(formData);
  };

  // Common Ugandan tribes for suggestions
  const commonTribes = [
    "Baganda", "Banyankole", "Basoga", "Bakiga", "Iteso", 
    "Langi", "Acholi", "Bagisu", "Lugbara", "Banyoro"
  ];

  // Common clans for each tribe (simplified)
  const commonClans = {
    "Baganda": ["Abalangira", "Ffumbe", "Lugave", "Ngonge", "Nsenene"],
    "Banyankole": ["Abashambo", "Abahinda", "Abakimbiri", "Abaishikatwa", "Abainika"],
    "Basoga": ["Abaisemalinga", "Abaisengobi", "Abaisegaga", "Abaisekintu", "Abaisewuuna"],
    "Bakiga": ["Abasigi", "Abaheesi", "Abanyangabo", "Abakongwe", "Abatimbo"],
    "Iteso": ["Ikaribwok", "Ingoratok", "Irarak", "Iteso", "Atekok"],
    "default": ["Enter your clan"]
  };

  // Get clans for selected tribe
  const getClansForTribe = (tribe: string) => {
    return commonClans[tribe] || commonClans.default;
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-lg border-2 border-uganda-black">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-uganda-black">Discover Your Roots</CardTitle>
          <CardDescription>
            Enter your family information to generate your clan-based family tree
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <p className="text-xs text-gray-500">Common examples: Baganda, Banyankole, Basoga, Bakiga</p>
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
                  {getClansForTribe(formData.tribe).map((clan) => (
                    <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                  ))}
                  <SelectItem value="other">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="clan"
                name="clan"
                placeholder="e.g. Abasinga"
                value={formData.clan}
                onChange={handleChange}
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
