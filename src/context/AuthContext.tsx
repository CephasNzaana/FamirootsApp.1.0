
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, WeakPassword } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

type UserMetadata = {
  role?: 'user' | 'expert' | 'admin';
  full_name?: string;
  tribe?: string;
  clan?: string;
  profileComplete?: boolean;
};

type AuthContextProps = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userMetadata: UserMetadata | null;
  // Update the return types for these functions to match their implementations
  signIn: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
    weakPassword?: WeakPassword | null;
  } | undefined>;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<{
    user: User | null;
    session: Session | null;
  } | undefined>;
  signOut: () => Promise<void>;
  updateUserMetadata: (metadata: Partial<UserMetadata>) => Promise<void>;
  isProfileComplete: () => boolean;
};

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);

  useEffect(() => {
    console.log("Setting up auth state listener");
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change:", event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Update metadata whenever auth state changes
        if (currentSession?.user) {
          const metadata = currentSession.user.user_metadata as UserMetadata;
          setUserMetadata(metadata || {});
        } else {
          setUserMetadata(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got existing session:", currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Set initial metadata
      if (currentSession?.user) {
        const metadata = currentSession.user.user_metadata as UserMetadata;
        setUserMetadata(metadata || {});
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("Sign in response:", data, error);
      
      if (error) throw error;
      toast.success("Signed in successfully");
      return data;
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Error signing in");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata: UserMetadata = {}) => {
    try {
      console.log("Signing up with:", email, "metadata:", metadata);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            ...metadata,
            profileComplete: false
          }
        }
      });
      console.log("Sign up response:", data, error);
      
      if (error) throw error;
      toast.success("Sign up successful! Check your email for confirmation.");
      return data;
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Error signing up");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Error signing out");
    }
  };

  const updateUserMetadata = async (metadata: Partial<UserMetadata>) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          ...userMetadata,
          ...metadata
        }
      });
      
      if (error) throw error;
      
      // Update local state
      if (data.user) {
        const updatedMetadata = data.user.user_metadata as UserMetadata;
        setUserMetadata(updatedMetadata);
      }
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Update metadata error:", error);
      toast.error(error.message || "Error updating profile");
      throw error;
    }
  };

  const isProfileComplete = () => {
    if (!userMetadata) return false;
    
    // Determine what constitutes a "complete" profile
    const requiredFields = ['full_name', 'tribe', 'clan'];
    return requiredFields.every(field => !!userMetadata[field as keyof UserMetadata]);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        userMetadata,
        signIn,
        signUp,
        signOut,
        updateUserMetadata,
        isProfileComplete
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
