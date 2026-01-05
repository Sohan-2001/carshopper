'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import CreateInterestForm from '@/components/CreateInterestForm';
import VehicleCard, { Vehicle } from '@/components/VehicleCard';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    // 1. State Management
    const [favorites, setFavorites] = useState<Vehicle[]>([]);
    const [interests, setInterests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInterestForm, setShowInterestForm] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Keep a stable userId to avoid unnecessary fetch churn
    const userId = useMemo(() => user?.id ?? null, [user]);

    // 2. Helpers
    // Accept PromiseLike so Supabase query builders are valid inputs
    const withTimeout = async <T,>(promise: PromiseLike<T>, label: string, ms = 12000): Promise<T> => {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out`)), ms)
        );
        return Promise.race([promise, timeout]);
    };

    // 3. Data Fetching Logic (Standalone)
    const fetchData = async (activeUserId: string) => {
        try {
            setLoading(true);
            setLoadError(null);

            // Parallel fetching for speed
            const [favResponse, interestResponse] = await Promise.all([
                // Fetch Favorites with join
                withTimeout(
                    supabase
                        .from('favorites')
                        .select('vehicle_id, vehicle:staging_vehicles(*)')
                        .eq('user_id', activeUserId),
                    'Favorites fetch'
                ),

                // Fetch Interests
                withTimeout(
                    supabase
                        .from('user_interests')
                        .select('*')
                        .eq('user_id', activeUserId)
                        .order('created_at', { ascending: false }),
                    'Interests fetch'
                )
            ]);

            // Process Favorites
            if (favResponse.error) {
                console.error('Error fetching favorites:', favResponse.error);
            } else {
                const safeFavorites = favResponse.data
                    ?.map((item: any) => item.vehicle)
                    .filter((v: any) => v !== null) || [];
                setFavorites(safeFavorites);
            }

            // Process Interests
            if (interestResponse.error) {
                console.error('Error fetching interests:', interestResponse.error);
            } else {
                setInterests(interestResponse.data || []);
            }

        } catch (error) {
            console.error('Profile load error:', error);
            setLoadError('Unable to load your profile right now. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 4. Auth-driven data load
    useEffect(() => {
        // Keep a simple guard: if auth still resolving, stay in loading
        if (authLoading) return;

        // If user is absent once auth is settled, bail to home and stop spinners
        if (!userId) {
            setLoading(false);
            setFavorites([]);
            setInterests([]);
            router.push('/');
            return;
        }

        fetchData(userId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, userId, router]);


    // Handlers
    const handleToggleFavorite = async (vehicleId: string) => {
        if (!user) return;

        // Optimistic Update: Remove from list immediately
        const isFav = favorites.some(v => v.id === vehicleId);
        if (isFav) {
            setFavorites(prev => prev.filter(v => v.id !== vehicleId));
            await supabase.from('favorites').delete().match({ user_id: user.id, vehicle_id: vehicleId });
        }
    };

    const handleDeleteInterest = async (interestId: string) => {
        if (!confirm('Are you sure you want to delete this search profile?')) return;

        try {
            const { error } = await supabase
                .from('user_interests')
                .delete()
                .eq('id', interestId);

            if (error) throw error;

            setInterests(prev => prev.filter(i => i.id !== interestId));
        } catch (err) {
            console.error('Error deleting interest:', err);
            alert('Failed to delete interest.');
        }
    };

    const formatCriteria = (criteria: any) => {
        const parts = [];
        if (criteria.make) parts.push(criteria.make);
        if (criteria.model) parts.push(criteria.model);
        if (criteria.min_year) parts.push(`> ${criteria.min_year}`);
        if (criteria.min_price || criteria.max_price) {
            const min = criteria.min_price ? `$${(criteria.min_price / 1000).toFixed(0)}k` : '0';
            const max = criteria.max_price ? `$${(criteria.max_price / 1000).toFixed(0)}k` : '∞';
            parts.push(`${min}-${max}`);
        }
        return parts.join(' • ') || 'Custom Filter';
    };

    // 4. UI Safety and Renders
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    // If auth finished and no user, render nothing (redirect already triggered)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Profile</h1>
                    <p className="text-slate-500 mt-2">Manage your saved searches and garage.</p>
                    {loadError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {loadError}
                        </div>
                    )}
                </div>

                {/* Section 1: My Saved Interests */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            My Saved Interests
                            <span className="bg-blue-100 text-blue-700 text-sm py-0.5 px-3 rounded-full">{interests.length}</span>
                        </h2>
                        <button
                            onClick={() => setShowInterestForm(!showInterestForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
                        >
                            {showInterestForm ? 'Cancel' : '+ Add New Interest'}
                        </button>
                    </div>

                    {showInterestForm && (
                        <div className="mb-8 bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                            <CreateInterestForm onInterestSaved={() => {
                                setShowInterestForm(false);
                                if (user) fetchData(user.id);
                            }} />
                        </div>
                    )}

                    {interests.length === 0 && !showInterestForm ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                            <p className="text-slate-500 font-medium text-lg">No saved searches yet.</p>
                            <p className="text-slate-400">Create a watchlist to get notified of new cars.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {interests.map((interest) => (
                                <div key={interest.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-slate-900">{interest.name}</h3>
                                        <button
                                            onClick={() => handleDeleteInterest(interest.id)}
                                            className="text-gray-400 hover:text-red-500 transition"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-600 font-medium mb-2">{formatCriteria(interest.criteria)}</p>
                                        {interest.criteria.non_negotiables && interest.criteria.non_negotiables.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {interest.criteria.non_negotiables.map((tag: string) => (
                                                    <span key={tag} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded">
                                                        {tag.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 my-12"></div>

                {/* Section 2: Saved Garage */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                        Saved Garage
                        <span className="bg-slate-200 text-slate-700 text-sm py-0.5 px-3 rounded-full">{favorites.length}</span>
                    </h2>

                    {favorites.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center opacity-70">
                            <p className="text-slate-500 font-medium text-lg">No cars saved yet.</p>
                            <button onClick={() => router.push('/')} className="mt-4 text-blue-600 font-bold hover:underline">Browse Cars</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favorites.map((vehicle) => (
                                <VehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    user={user}
                                    initialIsFavorite={true}
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
