
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

export function useSupabaseDatabase() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchProfileData = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in fetchProfileData:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyMembers = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data: familyTreesData, error: familyTreesError } = await supabase
        .from('family_trees')
        .select('id')
        .eq('user_id', userId);

      if (familyTreesError || !familyTreesData || familyTreesData.length === 0) {
        return [];
      }

      const treeId = familyTreesData[0].id;

      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_tree_id', treeId);

      if (membersError) {
        console.error("Error fetching family members:", membersError);
        return [];
      }

      return membersData || [];
    } catch (error) {
      console.error("Error in fetchFamilyMembers:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userId: string, profileData: any) => {
    try {
      setIsLoading(true);
      
      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            email: profileData.email || existingProfile.email, // Ensure email is always present
            // Add any other fields you want to update
          })
          .eq('id', userId);
  
        if (updateError) {
          console.error("Error updating profile:", updateError);
          toast.error("Failed to update profile");
          return false;
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            email: profileData.email || '',
            // Add any other fields you want to initialize
          });
  
        if (insertError) {
          console.error("Error creating profile:", insertError);
          toast.error("Failed to create profile");
          return false;
        }
      }

      toast.success("Profile updated successfully");
      return true;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      toast.error("An unexpected error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add the missing updateUserProfile function that was referenced in UserProfilePage
  const updateUserProfile = async (userId: string, profileData: any) => {
    try {
      setIsLoading(true);
      
      // Transform user-friendly field names to database field names
      const dbProfileData = {
        full_name: profileData.fullName,
        email: profileData.email,
        avatar_url: profileData.photoUrl,
        birth_year: profileData.birthYear,
        birth_place: profileData.birthPlace,
        tribe: profileData.tribe,
        clan: profileData.clan,
        biography: profileData.biography,
      };
      
      // Check if profile exists first
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found" error
        console.error("Error fetching profile:", fetchError);
        return { success: false, error: fetchError };
      }
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(dbProfileData)
          .eq('id', userId);
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert({
            id: userId,
            ...dbProfileData
          });
      }
      
      if (result.error) {
        console.error("Error updating profile:", result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchProfileData,
    fetchFamilyMembers,
    updateProfile,
    updateUserProfile // Export the new function
  };
}

// Also export the updateUserProfile function directly for easier imports
export const updateUserProfile = async (userId: string, profileData: any) => {
  const { updateUserProfile: updateFn } = useSupabaseDatabase();
  return updateFn(userId, profileData);
};
