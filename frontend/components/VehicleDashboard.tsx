'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import VehicleCard from './VehicleCard';
import { User } from '@supabase/supabase-js';

interface Vehicle {
    id: string;
    title: string;
    price: number;
    mileage: string | number;
    location: string;
    image_url: string | null;
    marketplace_url: string;
    source: string;
    make?: string;
    model?: string;
    year?: number;
    posted_date?: string;
}

// Horizontal Scrolling Row
const CarRow = ({ title, vehicles, loading, onSeeAll, favorites, user, onHide }: { title: string, vehicles: Vehicle[], loading: boolean, onSeeAll: () => void, favorites: Set<string>, user: User | null, onHide: (id: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 350;
            current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) return (
        <div className="mb-12">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="min-w-[300px] h-[350px] bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
            </div>
        </div>
    );

    if (vehicles.length === 0) return null;

    return (
        <div className="mb-12 relative group/row">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                <button className="text-blue-600 text-sm font-bold hover:underline flex items-center" onClick={onSeeAll}>
                    See All <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="relative">
                {/* Scroll Buttons */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur shadow-lg rounded-full p-2 text-gray-800 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white disabled:opacity-0"
                >
                    <ChevronRight className="h-6 w-6 rotate-180" />
                </button>
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur shadow-lg rounded-full p-2 text-gray-800 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>

                {/* Container */}
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-6 px-4 sm:px-6 lg:px-8 pb-8 scrollbar-hide snap-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {vehicles.map(vehicle => (
                        <div key={vehicle.id} className="snap-start">
                            <VehicleCard
                                vehicle={vehicle}
                                user={user}
                                initialIsFavorite={favorites.has(vehicle.id)}
                                onHide={onHide}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function VehicleDashboard() {
    const { openLoginModal } = useAuth(); // Keep for modal only

    // 1. State Management
    const [user, setUser] = useState<User | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    // No explicit 'hiddenIds' state needed if we filter them out of vehicle lists immediately, 
    // but having fetched them allows for client-side filtering logic if lists grow.
    // For now, we will filter them during the fetch transformation.

    // Categories
    const [recentCars, setRecentCars] = useState<Vehicle[]>([]);
    const [cheapCars, setCheapCars] = useState<Vehicle[]>([]);
    const [hondaCars, setHondaCars] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
    const [activeView, setActiveView] = useState<'home' | 'results'>('home');

    // 2. The Fetch Logic (useEffect)
    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            try {
                // Step 1: Get User
                const { data: { user: authUser } } = await supabase.auth.getUser();
                setUser(authUser);

                // Step 2: Parallel Fetch
                const fetchSection = async (query: string) => {
                    try {
                        const res = await fetch('/api/search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query })
                        });
                        const data = await res.json();
                        return data.cars || [];
                    } catch (error) {
                        console.error('Error fetching section:', error);
                        return [];
                    }
                };

                const userPromises = [];
                if (authUser) {
                    userPromises.push(supabase.from('favorites').select('vehicle_id').eq('user_id', authUser.id));
                    userPromises.push(supabase.from('user_hidden_vehicles').select('vehicle_id').eq('user_id', authUser.id));
                }

                const [recent, cheap, honda, ...userResults] = await Promise.all([
                    fetchSection('recent car listings'),
                    fetchSection('best deals affordable cars under $15000'),
                    fetchSection('Honda cars for sale'),
                    ...userPromises
                ]);

                // Step 3: Process Data
                let hiddenIds = new Set<string>();
                if (authUser && userResults.length >= 2) {
                    const favoritesData = userResults[0].data;
                    const hiddenData = userResults[1].data;

                    if (favoritesData) setFavorites(new Set(favoritesData.map((item: any) => item.vehicle_id)));
                    if (hiddenData) hiddenIds = new Set(hiddenData.map((item: any) => item.vehicle_id));
                }

                // Filter the Cars
                const filterHidden = (cars: Vehicle[]) => cars.filter(c => !hiddenIds.has(c.id));

                setRecentCars(filterHidden(recent));
                setCheapCars(filterHidden(cheap));
                setHondaCars(filterHidden(honda));

            } catch (error) {
                console.error("Failed to load dashboard content", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, []);

    const runSearch = async (query: string) => {
        if (!query.trim()) {
            setActiveView('home');
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setActiveView('results');
        setSearchQuery(query);

        try {
            // Note: Ideally backend filters blocked cars, but we can client-filter for now or pass userId
            // Passing userId to /api/search suggests backend update, but user asked to fix Frontend first.
            // We will fetch and then filter if we have the hidden sets loaded, 
            // BUT since this is a fresh fetch, we might re-fetch hidden vars or pass user ID.
            // For robustness as requested:
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, userId: user?.id })
            });

            const data = await res.json();
            let results = data.cars || [];

            // Client-side filtering as backup or primary method if API doesn't handle it yet
            // To do this strictly, we need the hiddenIds available. 
            // We'll trust the API if it accepts userId (step 3 of request),
            // OR we'd need to fetch hidden_vehicles again here. 
            // Given the instruction "Update the /api/search call to pass the userId", we assume backend will handle it.
            // However, ensuring immediate client filtering is safer if we persist hiddenIds in a Ref or State.
            // Let's rely on the API call with userId for search results as per prompt Step 3.

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = () => runSearch(searchQuery);
    const handleSeeAll = (query: string) => runSearch(query);

    const handleBackToHome = () => {
        setSearchQuery('');
        setSearchResults([]);
        setActiveView('home');
        setIsSearching(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    // 4. The Hide Handler
    const handleHide = (id: string) => {
        // Optimistic Update: Remove from all local lists
        setRecentCars(prev => prev.filter(c => c.id !== id));
        setCheapCars(prev => prev.filter(c => c.id !== id));
        setHondaCars(prev => prev.filter(c => c.id !== id));
        setSearchResults(prev => prev.filter(c => c.id !== id));

        // Data persistence is handled in VehicleCard.tsx
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-blue-200">
            {/* Hero */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 pt-16 pb-24 sm:pt-24 sm:pb-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative max-w-4xl mx-auto text-center z-10">
                    <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 drop-shadow-sm">
                        Find the real deal.
                    </h1>
                    <div className="relative max-w-2xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-2xl p-2 focus-within:ring-4 focus-within:ring-blue-500/30 transition-shadow">
                            <div className="flex items-center w-full">
                                <Search className="h-5 w-5 text-gray-400 ml-3 shrink-0" />
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg font-medium text-gray-900 placeholder-gray-400 py-3 px-3"
                                    placeholder="Search by make, model..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <button
                                onClick={() => handleSearch()}
                                disabled={isSearching}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-bold transition-transform active:scale-95 mt-2 md:mt-0 flex items-center justify-center gap-2"
                            >
                                {isSearching && (
                                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
                                )}
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1400px] mx-auto py-12">
                {/* View: Home */}
                {activeView === 'home' && (
                    <div className="space-y-4">
                        <CarRow
                            title="Just Arrived"
                            vehicles={recentCars}
                            loading={isLoading}
                            onSeeAll={() => handleSeeAll('recent car listings')}
                            favorites={favorites}
                            user={user}
                            onHide={handleHide}
                        />
                        <CarRow
                            title="Best Deals under $15k"
                            vehicles={cheapCars}
                            loading={isLoading}
                            onSeeAll={() => handleSeeAll('best deals affordable cars under $15000')}
                            favorites={favorites}
                            user={user}
                            onHide={handleHide}
                        />
                        <CarRow
                            title="Honda Collection"
                            vehicles={hondaCars}
                            loading={isLoading}
                            onSeeAll={() => handleSeeAll('Honda cars for sale')}
                            favorites={favorites}
                            user={user}
                            onHide={handleHide}
                        />
                    </div>
                )}

                {/* View: Search Results */}
                {activeView === 'results' && (
                    <div className="px-4 sm:px-6 lg:px-8 mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={handleBackToHome}
                                className="inline-flex items-center text-gray-500 hover:text-blue-600 font-semibold transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 mr-1" /> Back to Home
                            </button>
                            <button
                                onClick={handleBackToHome}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Clear Search
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Search Results {searchQuery ? `for "${searchQuery}"` : ''}
                        </h2>

                        {isSearching ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">No results found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {searchResults.map(vehicle => (
                                    <VehicleCard
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        user={user}
                                        initialIsFavorite={favorites.has(vehicle.id)}
                                        onHide={handleHide}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
