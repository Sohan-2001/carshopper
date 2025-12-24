'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function AdminPage() {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/');
            } else if (role !== 'admin') {
                router.push('/');
            }
        }
    }, [user, role, isLoading, router]);

    // Show loading or nothing while redirecting
    if (isLoading || role !== 'admin') {
        return (
            <div className="min-h-screen pt-40 flex flex-col items-center">
                <div className="animate-spin h-10 w-10 border-4 border-amber-500 rounded-full border-t-transparent mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Verifying privileges...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
                    <div className="inline-flex items-center justify-center p-5 bg-amber-50 rounded-full mb-6 ring-8 ring-amber-50/50">
                        <ShieldCheck className="h-16 w-16 text-amber-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Admin Control Panel</h1>
                    <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Welcome, Administrator. You have full access to manage users, listings, scraper configurations, and system health.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {/* Placeholder Admin Widgets */}
                        <div className="group p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all cursor-pointer">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg mb-4 flex items-center justify-center text-blue-600 font-bold">U</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">User Management</h3>
                            <p className="text-gray-500 leading-snug">View registered users, assign roles, and manage access.</p>
                        </div>
                        <div className="group p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all cursor-pointer">
                            <div className="h-10 w-10 bg-green-100 rounded-lg mb-4 flex items-center justify-center text-green-600 font-bold">S</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">Scraper Status</h3>
                            <p className="text-gray-500 leading-snug">Monitor Apify scraping runs, ingestion logs, and errors.</p>
                        </div>
                        <div className="group p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all cursor-pointer">
                            <div className="h-10 w-10 bg-purple-100 rounded-lg mb-4 flex items-center justify-center text-purple-600 font-bold">C</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">System Config</h3>
                            <p className="text-gray-500 leading-snug">Update global settings, API keys, and feature flags.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
