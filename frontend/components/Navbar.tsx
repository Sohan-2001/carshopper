'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Keeping for openLoginModal, component-level actions
import { supabase } from '@/lib/supabaseClient'; // Direct supabase usage as requested
import { Car, Menu, User as UserIcon, LogOut, Heart, ShieldCheck, ChevronDown } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
    // We still use useAuth for specific UI actions/global state like profile/role/modal
    const { profile, role, openLoginModal, signOut } = useAuth();

    // Local User State for robust, instant updates as requested
    const [user, setUser] = useState<User | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auth Listener
    useEffect(() => {
        // 1. Get initial user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getInitials = () => {
        if (profile?.full_name) return profile.full_name[0].toUpperCase();
        if (user?.email) return user.email[0].toUpperCase();
        return 'U';
    };

    return (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center cursor-pointer group">
                        <Car className="h-7 w-7 text-blue-700 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-extrabold text-slate-900 tracking-tight">CarShopper</span>
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/buy" className="text-sm font-bold text-gray-700 hover:text-blue-700 transition-colors">Buy</Link>

                        {/* CONDITIONAL SCOREBOARD LINK */}
                        {user && (
                            <Link href="/scoreboard" className="text-sm font-bold text-gray-700 hover:text-blue-700 transition-colors">
                                Scoreboard
                            </Link>
                        )}

                        <Link href="/sell" className="text-sm font-bold text-gray-700 hover:text-blue-700 transition-colors">Sell</Link>
                        <Link href="/reviews" className="text-sm font-bold text-gray-700 hover:text-blue-700 transition-colors">Reviews</Link>

                        {!user ? (
                            <button
                                onClick={openLoginModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                            >
                                Log In
                            </button>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 text-sm font-bold text-gray-700 hover:text-blue-700 focus:outline-none group"
                                >
                                    <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-blue-700 border border-blue-200 shadow-sm group-hover:border-blue-300 transition-colors">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-lg">{getInitials()}</span>
                                        )}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 ring-1 ring-black ring-opacity-5 transition-all animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate" title={user.email}>{user.email}</p>
                                        </div>

                                        <div className="py-1">
                                            <Link
                                                href="/profile"
                                                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <UserIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                                                My Profile
                                            </Link>
                                            <Link
                                                href="/profile"
                                                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <Heart className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                                                My Garage
                                            </Link>

                                            {/* DROPDOWN LINK - visible since user is present */}
                                            <Link
                                                href="/scoreboard"
                                                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <ShieldCheck className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                                                My Scoreboard
                                            </Link>

                                            {role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <ShieldCheck className="h-4 w-4 mr-3" />
                                                    Admin Panel
                                                </Link>
                                            )}
                                        </div>

                                        <div className="py-1 border-t border-gray-100">
                                            <button
                                                onClick={() => { signOut(); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4 mr-3" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Icon */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-gray-700 hover:text-blue-700 hover:bg-gray-100 focus:outline-none"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white shadow-lg border-t border-gray-100 px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2 mt-4">
                        <Link
                            href="/buy"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Buy
                        </Link>

                        {/* CONDITIONAL MOBILE LINK */}
                        {user && (
                            <Link
                                href="/scoreboard"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Scoreboard
                            </Link>
                        )}

                        <Link
                            href="/sell"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Sell
                        </Link>
                        <Link
                            href="/reviews"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Reviews
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        {!user ? (
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={() => {
                                        openLoginModal();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full bg-blue-600 text-white text-base font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform"
                                >
                                    Log In
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Link
                                    href="/profile"
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                                    My Profile
                                </Link>
                                <Link
                                    href="/profile"
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Heart className="h-5 w-5 mr-3 text-gray-400" />
                                    My Garage
                                </Link>
                                <button
                                    onClick={() => {
                                        signOut();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
