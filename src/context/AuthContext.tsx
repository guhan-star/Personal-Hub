import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db, seedLocalDatabase, DEMO_USER_ID } from '@/lib/db';
import type { UserProfile, UserSettings } from '@/types';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      // Initialize local seed data
      await seedLocalDatabase(false);

      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          setIsDemoMode(false);
          // Load profile from supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
          return;
        }
      }

      // Default: Fallback to local persistent demo mode
      setIsDemoMode(true);
      const localProfile = await db.profiles.get(DEMO_USER_ID);
      const localSettings = await db.userSettings.get(DEMO_USER_ID);

      if (localProfile) {
        setUser({ id: localProfile.id, email: localProfile.email });
        setProfile(localProfile);
        setSettings(localSettings || null);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          setIsDemoMode(false);
        } else {
          // Revert to demo mode if signed out
          initAuth();
        }
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      return {};
    } else {
      // In local mode, sign in directly
      const localProfile = await db.profiles.get(DEMO_USER_ID);
      if (localProfile) {
        setUser({ id: localProfile.id, email: localProfile.email });
        setProfile(localProfile);
        setIsDemoMode(true);
      }
      return {};
    }
  };

  const signUp = async (email: string, pass: string, name: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { display_name: name } }
      });
      if (error) return { error: error.message };
      return {};
    } else {
      return { error: 'Supabase is not configured yet. You are currently exploring in Offline/Demo mode.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    // Reload demo user
    await initAuth();
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    await seedLocalDatabase(true);
    await initAuth();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    await db.profiles.put(updated);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        settings,
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        resetDemoData,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
