'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, profile, isLoading, role } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loadingFavs, setLoadingFavs] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) return;

            setLoadingFavs(true);
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    vehicle_id,
                    vehicle:staging_vehicles (*) 
                `)
                .eq('user_id', user.id);

            if (data) {
                const favs = data.map((item: any) => item.vehicle).filter(Boolean);
                setFavorites(favs);
            }
            setLoadingFavs(false);
        };

        if (user) fetchFavorites();
    }, [user]);

    if (isLoading || !user) return <div className="min-h-screen pt-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">My Profile</h1>

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-3xl font-bold text-blue-700 border border-blue-200">
                        {profile?.full_name ? profile.full_name[0] : (user.email ? user.email[0].toUpperCase() : 'U')}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Valued Customer'}</h2>
                        <p className="text-gray-500 font-medium">{user.email}</p>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {role || 'Customer'}
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    Saved Garage <span className="ml-3 text-sm font-bold bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full">{favorites.length}</span>
                </h2>

                {loadingFavs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl"></div>)}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg font-medium">To keep track of cars, tap the heart icon.</p>
                        <button onClick={() => router.push('/')} className="mt-4 text-blue-600 font-bold hover:underline">Start Browsing</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map(vehicle => (
                            <div key={vehicle.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                    {vehicle.image_url ? (
                                        <img src={vehicle.image_url} alt={vehicle.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-20"></div>
                                    <div className="absolute bottom-3 left-4 text-white font-bold text-lg">${vehicle.price?.toLocaleString()}</div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 truncate mb-1" title={vehicle.title}>{vehicle.title}</h3>
                                    <div className="text-sm text-gray-500 mb-4">{vehicle.mileage} • {vehicle.location}</div>
                                    <a
                                        href={vehicle.marketplace_url}
                                        target="_blank"
                                        className="mt-auto block text-center w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        View Listing
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
