
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types';

export const updateUserProfile = async (userId: string, profileData: UserProfile): Promise<{ success: boolean, error: Error | null }> => {
  try {
    // Convert from our app's structure to Supabase's structure
    const dbData = {
      full_name: profileData.fullName,
      avatar_url: profileData.photoUrl,
      biography: profileData.biography,
      birth_year: profileData.birthYear,
      birth_place: profileData.birthPlace,
      tribe: profileData.tribe,
      clan: profileData.clan
    };

    const { error } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error as Error };
  }
};
