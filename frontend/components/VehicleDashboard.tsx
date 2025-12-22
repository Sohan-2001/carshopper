'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, MapPin, Gauge, ExternalLink, Car, Menu, ChevronRight, ChevronLeft } from 'lucide-react';

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

// Reuseable Card Component
const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col h-full min-w-[280px] md:min-w-[320px]">
        {/* Image */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
            {vehicle.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={vehicle.image_url}
                    alt={vehicle.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
                    <Car className="h-10 w-10 mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Image</span>
                </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-24"></div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-gray-900 font-bold text-lg leading-tight truncate mb-1" title={vehicle.title}>
                {vehicle.title}
            </h3>
            <div className="text-emerald-700 font-extrabold text-xl mb-3">
                ${vehicle.price.toLocaleString()}
            </div>

            <div className="space-y-1.5 mb-4 flex-1 border-t border-gray-100 pt-3">
                <div className="flex items-center text-sm font-medium text-gray-600">
                    <Gauge className="h-4 w-4 mr-2 text-gray-400" />
                    {vehicle.mileage !== 'N/A' ? vehicle.mileage : 'Mileage N/A'}
                </div>
                <div className="flex items-center text-sm font-medium text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {vehicle.location}
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Source: {vehicle.source}
                </span>
                <a
                    href={vehicle.marketplace_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors"
                >
                    View <ChevronRight className="h-4 w-4 ml-0.5" />
                </a>
            </div>
        </div>
    </div>
);

// Horizontal Scrolling Row
const CarRow = ({ title, vehicles, loading, onSeeAll }: { title: string, vehicles: Vehicle[], loading: boolean, onSeeAll: () => void }) => {
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
                    className="flex overflow-x-auto gap-6 px-4 sm:px-6 lg:px-8 pb-8 -mx-4 sm:-mx-6 lg:-mx-8 scrollbar-hide snap-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {vehicles.map(vehicle => (
                        <div key={vehicle.id} className="snap-start">
                            <VehicleCard vehicle={vehicle} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function VehicleDashboard() {
    // State for Categories
    const [recentCars, setRecentCars] = useState<Vehicle[]>([]);
    const [cheapCars, setCheapCars] = useState<Vehicle[]>([]);
    const [hondaCars, setHondaCars] = useState<Vehicle[]>([]);

    // State for Search & Views
    const [browseCars, setBrowseCars] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // View State: 'home' | 'search' | 'category'
    const [activeView, setActiveView] = useState<'home' | 'search' | 'category'>('home');
    const [viewTitle, setViewTitle] = useState('Browse Inventory');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Initial Load - Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                // Parallel fetching
                const [recent, cheap, honda, all] = await Promise.all([
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({ limit: 10 }) // Recent
                    }).then(r => r.json()),
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({ maxPrice: 15000, limit: 10 }) // Cheap
                    }).then(r => r.json()),
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({ make: 'Honda', limit: 10 }) // Honda
                    }).then(r => r.json()),
                    fetch('/api/search', {
                        method: 'POST',
                        body: JSON.stringify({ limit: 20 }) // Browse All (First 20)
                    }).then(r => r.json())
                ]);

                setRecentCars(recent.data || []);
                setCheapCars(cheap.data || []);
                setHondaCars(honda.data || []);
                setBrowseCars(all.data || []);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Handle Search
    const handleSearch = async (override?: string) => {
        const query = override !== undefined ? override : searchQuery;

        if (!query.trim()) {
            setActiveView('home');
            return;
        }

        setActiveView('search');
        setViewTitle(`Search Results for "${query}"`);
        setSearchLoading(true);

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                body: JSON.stringify({ query: query })
            });
            const data = await res.json();
            setBrowseCars(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle "See All" Click
    const handleSeeAll = async (type: string, value: any, title: string) => {
        setActiveView('category');
        setViewTitle(title);
        setSearchLoading(true);
        // Clear search query when entering a category to avoid confusion
        setSearchQuery('');

        let payload = {};
        if (type === 'sort' && value === 'newest') payload = { limit: 50 }; // Just fetch more recent
        if (type === 'price') payload = { maxPrice: value, limit: 50 };
        if (type === 'make') payload = { make: value, limit: 50 };

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setBrowseCars(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleBackToHome = () => {
        setActiveView('home');
        setSearchQuery('');
        setBrowseCars([]); // Optional: clear or keep cache
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-blue-200">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center cursor-pointer" onClick={handleBackToHome}>
                            <Car className="h-7 w-7 text-blue-700 mr-2" />
                            <span className="text-xl font-extrabold text-slate-900 tracking-tight">CarShopper</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a className="text-sm font-bold text-gray-700 hover:text-blue-700 cursor-pointer">Buy</a>
                            <a className="text-sm font-bold text-gray-700 hover:text-blue-700 cursor-pointer">Sell</a>
                            <a className="text-sm font-bold text-gray-700 hover:text-blue-700 cursor-pointer">Reviews</a>
                        </div>
                        <Menu className="md:hidden h-6 w-6 text-gray-700" />
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 pt-16 pb-24 sm:pt-24 sm:pb-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative max-w-4xl mx-auto text-center z-10">
                    <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 drop-shadow-sm">
                        Find the real deal.
                    </h1>
                    <div className="relative max-w-2xl mx-auto">
                        <div className="flex items-center bg-white rounded-lg shadow-2xl p-2 focus-within:ring-4 focus-within:ring-blue-500/30 transition-shadow">
                            <Search className="h-5 w-5 text-gray-400 ml-3" />
                            <input
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-gray-900 placeholder-gray-400 py-3 px-3"
                                placeholder="Search by make, model, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                onClick={() => handleSearch()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-bold transition-transform active:scale-95"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1400px] mx-auto py-12">

                {/* View 1: Categorized Rows (Default) */}
                {activeView === 'home' && (
                    <div className="space-y-4">
                        <CarRow
                            title="Just Arrived"
                            vehicles={recentCars}
                            loading={isLoading}
                            onSeeAll={() => handleSeeAll('sort', 'newest', 'Just Arrived')}
                        />
                        <CarRow
                            title="Best Deals under $15k"
                            vehicles={cheapCars}
                            loading={isLoading}
                            onSeeAll={() => handleSeeAll('price', 15000, 'Best Deals under $15k')}
                        />
                        <CarRow
                            title="Honda Collection"
                            vehicles={hondaCars}
                            loading={isLoading}
                            onSeeAll={() => handleSeeAll('make', 'Honda', 'Honda Collection')}
                        />
                    </div>
                )}

                {/* View 2: Search Results / Category Grid */}
                {(activeView === 'search' || activeView === 'category') && (
                    <div className="px-4 sm:px-6 lg:px-8 mt-8">
                        {/* Back Button */}
                        <button
                            onClick={handleBackToHome}
                            className="mb-6 inline-flex items-center text-gray-500 hover:text-blue-600 font-semibold transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Home
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {viewTitle}
                        </h2>

                        {searchLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : browseCars.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">No results found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {browseCars.map(vehicle => (
                                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                ))}
                            </div>
                        )}

                        {!searchLoading && browseCars.length > 0 && (
                            <div className="mt-12 flex justify-center">
                                <button className="bg-white border border-gray-300 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm">
                                    Load More Vehicles
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
