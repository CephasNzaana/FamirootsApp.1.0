
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TreeFormData } from "@/types";
import { toast } from "@/components/ui/sonner";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.surname || !formData.tribe || !formData.clan) {
      toast.error("Please fill in all fields");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-lg border-2 border-uganda-black">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-uganda-black">Discover Your Roots</CardTitle>
          <CardDescription>
            Enter your elder's information to generate your family tree
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="surname">Elder's Surname</Label>
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
            <Input
              id="tribe"
              name="tribe"
              placeholder="e.g. Baganda"
              value={formData.tribe}
              onChange={handleChange}
              className="focus:border-uganda-yellow focus:ring-uganda-yellow"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clan">Clan</Label>
            <Input
              id="clan"
              name="clan"
              placeholder="e.g. Abasinga"
              value={formData.clan}
              onChange={handleChange}
              className="focus:border-uganda-yellow focus:ring-uganda-yellow"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full btn-primary"
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
