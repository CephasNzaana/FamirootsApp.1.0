
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types";

export const updateUserProfile = async (
  userId: string, 
  profileData: Omit<UserProfile, "id">
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.fullName,
        avatar_url: profileData.photoUrl,
        birth_year: profileData.birthYear,
        birth_place: profileData.birthPlace,
        tribe: profileData.tribe,
        clan: profileData.clan,
        biography: profileData.biography,
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

export const getUserProfile = async (
  userId: string
): Promise<{ data: UserProfile | null; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (data) {
      const userProfile: UserProfile = {
        id: data.id,
        fullName: data.full_name || '',
        email: data.email || '',
        photoUrl: data.avatar_url || '',
        biography: data.biography || '',
        birthYear: data.birth_year || '',
        birthPlace: data.birth_place || '',
        tribe: data.tribe || '',
        clan: data.clan || '',
      };
      return { data: userProfile };
    }

    return { data: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};
