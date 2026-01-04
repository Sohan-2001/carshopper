'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CreateInterestForm({ onInterestSaved }: { onInterestSaved: () => void }) {
    const [name, setName] = useState('');
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minYear, setMinYear] = useState('');

    // Body Types
    const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Coupe', 'Convertible', 'Van'];
    const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);

    // Non-Negotiables
    // Non-Negotiables
    const nonNegotiablesOptions = [
        { key: 'must_have_ac', label: 'Must have AC' },
        { key: 'automatic_only', label: 'Automatic Only' },
        { key: 'four_door', label: '4-Door' },
        { key: 'original_papers', label: 'Original Papers' },
    ];
    const [selectedNonNegotiables, setSelectedNonNegotiables] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMakes = async () => {
            const { data } = await supabase
                .from('staging_vehicles')
                .select('make')
                .not('make', 'is', null);

            if (data) {
                const uniqueMakes = Array.from(new Set(data.map(item => item.make).filter(Boolean))).sort();
                setMakes(uniqueMakes as string[]);
            }
        };
        fetchMakes();
    }, []);

    useEffect(() => {
        const fetchModels = async () => {
            if (!selectedMake) {
                setModels([]);
                return;
            }
            const { data } = await supabase
                .from('staging_vehicles')
                .select('model')
                .eq('make', selectedMake)
                .not('model', 'is', null);

            if (data) {
                const uniqueModels = Array.from(new Set(data.map(item => item.model).filter(Boolean))).sort();
                setModels(uniqueModels as string[]);
            }
        };
        fetchModels();
    }, [selectedMake]);

    const toggleBodyType = (type: string) => {
        setSelectedBodyTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleNonNegotiable = (key: string) => {
        setSelectedNonNegotiables(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('Please log in to save an interest.');
            setLoading(false);
            return;
        }

        const criteria = {
            make: selectedMake || null,
            model: selectedModel || null,
            min_price: minPrice ? parseInt(minPrice) : null,
            max_price: maxPrice ? parseInt(maxPrice) : null,
            min_year: minYear ? parseInt(minYear) : null,
            body_types: selectedBodyTypes,
            non_negotiables: selectedNonNegotiables
        };

        const { error } = await supabase
            .from('user_interests')
            .insert({
                user_id: user.id,
                name,
                criteria
            });

        setLoading(false);

        if (error) {
            console.error('Error saving interest:', error);
            alert('Failed to save interest.');
        } else {
            // Reset form
            setName('');
            setSelectedMake('');
            setSelectedModel('');
            setMinPrice('');
            setMaxPrice('');
            setMinYear('');
            setSelectedBodyTypes([]);
            setSelectedNonNegotiables([]);
            onInterestSaved();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </span>
                Create New Watchlist
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Name</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Dream Car, Wife's Commuter"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Make</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedMake}
                            onChange={e => { setSelectedMake(e.target.value); setSelectedModel(''); }}
                        >
                            <option value="" className="text-gray-900">Any Make</option>
                            {makes.map(make => <option key={make} value={make} className="text-gray-900">{make}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Model</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                            disabled={!selectedMake}
                        >
                            <option value="" className="text-gray-900">Any Model</option>
                            {models.map(model => <option key={model} value={model} className="text-gray-900">{model}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Min Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Max Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="No Max"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Newer Than</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={minYear}
                            onChange={e => setMinYear(e.target.value)}
                        >
                            <option value="" className="text-gray-900">Any Year</option>
                            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year} className="text-gray-900">{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Body Type</label>
                    <div className="flex flex-wrap gap-2">
                        {bodyTypes.map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => toggleBodyType(type)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedBodyTypes.includes(type)
                                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Non-Negotiables</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {nonNegotiablesOptions.map(option => (
                            <label key={option.key} className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedNonNegotiables.includes(option.key) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                                    }`}>
                                    {selectedNonNegotiables.includes(option.key) && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedNonNegotiables.includes(option.key)}
                                    onChange={() => toggleNonNegotiable(option.key)}
                                />
                                <span className="text-gray-700 font-medium group-hover:text-blue-700">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold text-lg text-white shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? 'Saving...' : 'Save Watchlist Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
