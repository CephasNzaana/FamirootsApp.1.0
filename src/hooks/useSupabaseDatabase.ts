
import { supabase } from '@/integrations/supabase/client';

// Function to ensure the profiles table has all necessary columns
export const ensureProfileTableSchema = async () => {
  try {
    // In a real application, this should be done through proper migrations
    // This is a workaround for development
    const { data, error } = await supabase.rpc('update_profile_schema');
    
    if (error) {
      console.error('Error updating schema:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception while updating schema:', error);
    return false;
  }
};

// Function to update a profile with extended fields
export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    // Use upsert to ensure we create or update as needed
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: profileData.fullName,
        email: profileData.email || '',
        avatar_url: profileData.photoUrl || null,
        // Custom fields - may not exist in all database setups
        biography: profileData.biography || null,
        birth_year: profileData.birthYear || null,
        birth_place: profileData.birthPlace || null,
        tribe: profileData.tribe || null,
        clan: profileData.clan || null,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};
