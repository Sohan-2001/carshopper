'use client';

import { useState } from 'react';
import { Car, Heart, Gauge, MapPin, ChevronRight, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface Vehicle {
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

interface VehicleCardProps {
    vehicle: Vehicle;
    user?: User | null; // Optional user prop for initial UI
    initialIsFavorite: boolean;
    onHide?: (id: string) => void;
}

export default function VehicleCard({
    vehicle,
    user: initialUser,
    initialIsFavorite,
    onHide
}: VehicleCardProps) {
    const [isFav, setIsFav] = useState(initialIsFavorite);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // 1. Fetch fresh user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Please log in to save cars");
            return;
        }

        // 2. Optimistic UI Toggle
        const newFavStatus = !isFav;
        setIsFav(newFavStatus);

        try {
            if (newFavStatus) {
                // Insert
                const { error } = await supabase
                    .from('favorites')
                    .insert({ user_id: user.id, vehicle_id: vehicle.id });
                if (error) throw error;
            } else {
                // Delete
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('vehicle_id', vehicle.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Favorite toggle failed:', error);
            // Revert state
            setIsFav(!newFavStatus);
            alert('Failed to update favorite status.');
        }
    };

    const handleHideClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // 1. Fetch fresh user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Please log in to hide cars");
            return;
        }

        // 2. Database Update
        try {
            const { error } = await supabase.from('user_hidden_vehicles').insert({
                user_id: user.id,
                vehicle_id: vehicle.id,
                reason: 'User hidden via Card'
            });

            if (error) throw error;

            // 3. UI Update (Callback)
            if (onHide) {
                onHide(vehicle.id);
            }

        } catch (error: any) {
            console.error('Hide vehicle failed:', error);
            alert(`Failed to hide vehicle: ${error.message}`);
        }
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col h-full min-w-[280px] md:min-w-[320px] relative">
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

                {/* Actions Container */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                    {/* Heart Button */}
                    <button
                        onClick={handleFavoriteClick}
                        className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-400 hover:text-red-500 transition-all shadow-sm group-hover:scale-110 active:scale-95"
                        title="Save to Garage"
                    >
                        <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    {/* Hide Button */}
                    {onHide && (
                        <button
                            onClick={handleHideClick}
                            className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-400 hover:text-gray-900 transition-all shadow-sm group-hover:scale-110 active:scale-95"
                            title="Hide this car"
                        >
                            <EyeOff className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-gray-900 font-bold text-lg leading-tight truncate mb-1" title={vehicle.title}>
                    {vehicle.title}
                </h3>
                <div className="text-emerald-700 font-extrabold text-xl mb-3">
                    ${vehicle.price?.toLocaleString()}
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
}
