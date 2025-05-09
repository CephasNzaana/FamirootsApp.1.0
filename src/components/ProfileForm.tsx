
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample tribes and clans - this would ideally come from your database
const TRIBES = [
  "Baganda",
  "Banyankole",
  "Basoga",
  "Bakiga",
  "Iteso",
  "Acholi",
  "Lugbara",
  "Banyoro",
  "Other"
];

const CLANS: Record<string, string[]> = {
  "Baganda": ["Ffumbe", "Lugave", "Nsenene", "Ngabi", "Njaza", "Other"],
  "Banyankole": ["Abahima", "Abairu", "Other"],
  "Basoga": ["Bamugweri", "Balamogi", "Other"],
  "Bakiga": ["Abungura", "Abasigi", "Other"],
  "Iteso": ["Iworopom", "Irarak", "Other"],
  "Acholi": ["Payira", "Paico", "Other"],
  "Lugbara": ["Maracha", "Terego", "Other"],
  "Banyoro": ["Bamooli", "Bayaga", "Other"],
  "Other": ["Other"]
};

const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  tribe: z.string().min(1, { message: "Please select a tribe" }),
  clan: z.string().min(1, { message: "Please select a clan" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  open: boolean;
  onClose: () => void;
}

const ProfileForm = ({ open, onClose }: ProfileFormProps) => {
  const { userMetadata, updateUserMetadata } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTribe, setSelectedTribe] = useState<string>(userMetadata?.tribe || TRIBES[0]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: userMetadata?.full_name || "",
      tribe: userMetadata?.tribe || TRIBES[0],
      clan: userMetadata?.clan || CLANS[userMetadata?.tribe || TRIBES[0]][0] || "Other",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      await updateUserMetadata({
        ...values,
        profileComplete: true
      });
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTribeChange = (value: string) => {
    setSelectedTribe(value);
    form.setValue("tribe", value);
    // Initialize clan with first clan from the selected tribe, or "Other" if none available
    const defaultClan = CLANS[value]?.[0] || "Other";
    form.setValue("clan", defaultClan);
  };

  const availableClans = CLANS[selectedTribe] || CLANS["Other"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide more information about your family heritage to improve your experience.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tribe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tribe</FormLabel>
                  <Select 
                    onValueChange={(value) => handleTribeChange(value)} 
                    defaultValue={field.value || TRIBES[0]}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your tribe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRIBES.map((tribe) => (
                        <SelectItem key={tribe} value={tribe}>{tribe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clan</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || availableClans[0] || "Other"}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your clan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableClans.map((clan) => (
                        <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Later
              </Button>
              <Button 
                type="submit" 
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileForm;
