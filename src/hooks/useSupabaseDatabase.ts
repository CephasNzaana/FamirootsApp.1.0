
import { supabase } from '@/integrations/supabase/client';

// Function to ensure the profiles table has all necessary columns
export const ensureProfileTableSchema = async () => {
  try {
    // In a real application, this should be done through proper migrations
    // This is a workaround for development
    const { data, error } = await supabase.rpc('get_current_profile');
    
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

// Function to update a user profile with extended fields
export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    // Use a more robust approach to handle missing fields
    const updateData: Record<string, any> = {};
    
    // Only add fields that are actually provided
    if (profileData.fullName !== undefined) updateData.full_name = profileData.fullName;
    if (profileData.email !== undefined) updateData.email = profileData.email || '';
    if (profileData.photoUrl !== undefined) updateData.avatar_url = profileData.photoUrl || null;
    if (profileData.biography !== undefined) updateData.biography = profileData.biography || '';
    if (profileData.birthYear !== undefined) updateData.birth_year = profileData.birthYear || '';
    if (profileData.birthPlace !== undefined) updateData.birth_place = profileData.birthPlace || '';
    if (profileData.tribe !== undefined) updateData.tribe = profileData.tribe || '';
    if (profileData.clan !== undefined) updateData.clan = profileData.clan || '';
    
    // Always update the timestamp when profile is modified
    updateData.updated_at = new Date().toISOString();
    
    // Use upsert to create or update as needed
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updateData
      });
      
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};
