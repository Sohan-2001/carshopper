'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import VehicleCard, { Vehicle } from '@/components/VehicleCard';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ScoreboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [scoreboard, setScoreboard] = useState<Record<string, Vehicle[]>>({});
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    // Fetch Scoreboard
    const fetchScoreboard = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch('/api/scoreboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });
            const data = await res.json();
            setScoreboard(data);
        } catch (error) {
            console.error('Error fetching scoreboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Favorites
    const fetchFavorites = async () => {
        if (!user) return;
        const { data } = await supabase.from('favorites').select('vehicle_id').eq('user_id', user.id);
        if (data) setFavorites(new Set(data.map((i: any) => i.vehicle_id)));
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/');
            } else {
                fetchScoreboard();
                fetchFavorites();
            }
        }
    }, [user, authLoading, router]);

    const handleToggleFavorite = async (id: string) => {
        if (!user) return;
        const newFavs = new Set(favorites);
        if (newFavs.has(id)) {
            newFavs.delete(id);
            setFavorites(newFavs); // Optimistic
            await supabase.from('favorites').delete().match({ user_id: user.id, vehicle_id: id });
        } else {
            newFavs.add(id);
            setFavorites(newFavs); // Optimistic
            await supabase.from('favorites').insert({ user_id: user.id, vehicle_id: id });
        }
    };

    const handleHide = async (id: string) => {
        if (!user) return;

        // 1. Optimistic Update (Remove from UI immediately)
        const previousScoreboard = { ...scoreboard };
        setScoreboard(prev => {
            const next = { ...prev };
            for (const key in next) {
                next[key] = next[key].filter(car => car.id !== id);
            }
            return next;
        });

        // 2. Database Update
        try {
            const { error } = await supabase
                .from('user_hidden_vehicles')
                .insert({
                    user_id: user.id,
                    vehicle_id: id
                });

            if (error) throw error;
            console.log('Vehicle hidden in DB');

        } catch (err) {
            console.error('Failed to hide vehicle:', err);
            // Revert UI if DB fails
            setScoreboard(previousScoreboard);
            alert('Could not hide vehicle.');
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Scoreboard</h1>
                        <p className="text-sm text-gray-500 font-medium">Top picks matched to your criteria</p>
                    </div>
                    <button
                        onClick={fetchScoreboard}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-200 transition-colors shadow-sm"
                    >
                        <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Refresh Scoreboard
                    </button>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                {loading ? (
                    // Skeleton
                    [1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(j => <div key={j} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>)}
                            </div>
                        </div>
                    ))
                ) : Object.keys(scoreboard).length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Watchlists</h3>
                            <p className="text-gray-500 mb-6">Create a search profile to start seeing matches here.</p>
                            <button onClick={() => router.push('/profile')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                                Create Watchlist
                            </button>
                        </div>
                    </div>
                ) : (
                    Object.entries(scoreboard).map(([interestName, cars]) => (
                        <div key={interestName} className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">{interestName}</h2>
                                <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{cars.length}</span>
                            </div>

                            {cars.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center opacity-60">
                                    <p className="text-gray-500 font-medium">No deals found for this profile yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">We'll keep looking!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                    {cars.map(car => (
                                        <VehicleCard
                                            key={car.id}
                                            vehicle={car}
                                            user={user}
                                            initialIsFavorite={favorites.has(car.id)}
                                            onHide={handleHide}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
