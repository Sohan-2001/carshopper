'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

export default function LoginModal() {
    const { isLoginModalOpen, closeLoginModal } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If modal is not open, return null (don't render anything)
    if (!isLoginModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Sign Up Logic
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // Create a profile entry triggering on DB side, or rely on trigger.
                        // Ideally we have a postgres trigger for handling new users -> profiles table.
                    }
                });
                if (error) throw error;
                alert('Account created! Please check your email for the confirmation link.');
                setIsSignUp(false); // Switch to login view or keep open
            } else {
                // Sign In Logic
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Success: close modal
                closeLoginModal();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all scale-100">
                <button
                    onClick={closeLoginModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="p-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-500 mb-6 font-medium">
                        {isSignUp ? 'Join CarShopper today.' : 'Sign in to access your garage.'}
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg shadow-blue-500/30"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm font-medium text-gray-500">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        {' '}
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            className="text-blue-600 font-extrabold hover:underline"
                        >
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </div>
                </div>

                {/* Visual Flair */}
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            </div>
        </div>
    );
}
