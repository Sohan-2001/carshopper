'use client';

import { useEffect, useState } from 'react';

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

export default function VehicleDashboard() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [useStaging, setUseStaging] = useState(false);

    // Initial fetch (load all cars)
    useEffect(() => {
        handleSearch('');
    }, []);

    async function handleSearch(queryOverride?: string) {
        setSearching(true);
        // If called with an argument, use it; otherwise use state.
        const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryToUse, useStaging }),
            });
            const result = await response.json();

            if (response.ok) {
                setVehicles(result.data || []);
            } else {
                console.error("Search failed:", result.error);
                alert('Search failed. See console for details.');
            }
        } catch (err) {
            console.error('Search error:', err);
            alert('An error occurred during search.');
        } finally {
            setSearching(false);
            setLoading(false); // Ensure main loading state is off after first run
        }
    }

    // Trigger search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header / Search Section */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Find Your Perfect Ride</h1>
                    <p className="text-gray-500 mb-6">Search through our extensive live inventory</p>

                    {/* Test Mode Toggle */}
                    <div className="flex justify-center mb-4">
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useStaging}
                                onChange={(e) => setUseStaging(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            <span className="ms-3 text-sm font-medium text-gray-700">Test Mode (Staging Data)</span>
                        </label>
                    </div>

                    <div className="max-w-2xl mx-auto relative flex items-center">
                        <input
                            type="text"
                            placeholder="Search cars... Honda Civic, Isuzu, etc."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-white border border-gray-200 rounded-lg py-4 pl-6 pr-32 shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                        />
                        <button
                            onClick={() => handleSearch()}
                            disabled={searching}
                            className={`absolute right-2 text-white px-6 py-2.5 rounded-md font-bold text-sm tracking-wide disabled:bg-gray-400 disabled:cursor-not-allowed transition-all ${useStaging
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : 'bg-black hover:bg-slate-800'
                                }`}
                        >
                            {searching ? 'SEARCHING...' : 'SEARCH'}
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium">Loading inventory...</p>
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xl text-gray-400 font-medium">No cars found matching "{searchQuery}"</p>
                        <p className="text-gray-300 mt-2">Try adjusting your keywords.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                                    {vehicle.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={vehicle.image_url}
                                            alt={vehicle.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            No Image Available
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {vehicle.source}
                                    </div>
                                </div>

                                {/* Details Container */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-medium text-gray-900 text-lg leading-snug line-clamp-2 h-[3.25rem] mb-2" title={vehicle.title}>
                                        {vehicle.title}
                                    </h3>

                                    <div className="flex items-baseline mb-4">
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${vehicle.price.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-6 flex-1 text-sm border-t border-gray-50 pt-4">
                                        <div className="flex items-center text-gray-500">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {vehicle.mileage !== 'N/A' ? `${vehicle.mileage} miles` : 'Mileage N/A'}
                                        </div>
                                        <div className="flex items-center text-gray-500">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {vehicle.location}
                                        </div>
                                    </div>

                                    <a
                                        href={vehicle.marketplace_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center bg-black hover:bg-gray-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
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
