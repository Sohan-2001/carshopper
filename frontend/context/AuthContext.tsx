'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

type Role = 'admin' | 'customer' | null;

interface Profile {
    id: string;
    role: Role;
    full_name?: string;
    avatar_url?: string;
    email?: string; // Sometimes profile has email copy
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    role: Role;
    isLoading: boolean;
    signOut: () => Promise<void>;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    isLoginModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        // 1. Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("Error checking session:", e);
                setIsLoading(false);
            }
        };

        getInitialSession();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // Only fetch if we don't have it or user changed
                if (!profile || profile.id !== session.user.id) {
                    await fetchProfile(session.user.id);
                }
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // If profile doesn't exist, maybe create one? 
                // For now, simpler to just log role as null or handle gracefully.
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        // Optional: Redirect to home
    };

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    const value = {
        session,
        user,
        profile,
        role: profile?.role ?? null,
        isLoading,
        signOut,
        openLoginModal,
        closeLoginModal,
        isLoginModalOpen
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
