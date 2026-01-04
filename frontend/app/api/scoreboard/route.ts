import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Initialize Supabase Client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. Fetch active interests and hidden vehicles for the user
        const [interestsResult, hiddenResult] = await Promise.all([
            supabase
                .from('user_interests')
                .select('*')
                .eq('user_id', user_id)
                .eq('is_active', true),
            supabase
                .from('user_hidden_vehicles')
                .select('vehicle_id')
                .eq('user_id', user_id)
        ]);

        const interests = interestsResult.data || [];
        if (interestsResult.error) {
            console.error('Error fetching interests:', interestsResult.error);
            return NextResponse.json({ error: interestsResult.error.message }, { status: 500 });
        }

        // Create Set of hidden IDs
        const hiddenIds = hiddenResult.data?.map((row: any) => row.vehicle_id) || [];

        const scoreboardData: Record<string, any[]> = {};

        // 2. For each interest, fetch matching vehicles
        for (const interest of interests) {
            const { criteria } = interest;
            let query = supabase.from('staging_vehicles').select('*');

            // Exclude Hidden Vehicles
            if (hiddenIds.length > 0) {
                query = query.not('id', 'in', `(${hiddenIds.join(',')})`);
            }

            // Apply Filters
            if (criteria.make && criteria.make !== 'Any Make') {
                query = query.ilike('make', criteria.make);
            }
            // Logic: criteria.model might act as extra filter? Prompt didn't strictly require it but form has it.
            // I'll add it if present for better accuracy.
            if (criteria.model && criteria.model !== 'Any Model') {
                query = query.ilike('model', criteria.model);
            }

            if (criteria.max_price) { // Form saves as max_price
                query = query.lte('price', criteria.max_price);
            }
            // Support maxPrice from prompt if different
            if (criteria.maxPrice) {
                query = query.lte('price', criteria.maxPrice);
            }

            if (criteria.min_year) { // Form saves as min_year
                query = query.gte('year', criteria.min_year);
            }
            if (criteria.minYear) {
                query = query.gte('year', criteria.minYear);
            }

            // Body Type Logic
            // Form saves 'body_types' (array)
            if (criteria.body_types && Array.isArray(criteria.body_types) && criteria.body_types.length > 0) {
                // Using .in() for exact matches on body_type column
                // Note: Requires 'body_type' column in staging_vehicles
                query = query.in('body_type', criteria.body_types);
            }
            // Prompt criteria example: bodyType (string)
            else if (criteria.bodyType) {
                query = query.ilike('body_type', criteria.bodyType);
            }

            // Limit to top 20
            const { data: cars, error: carError } = await query.limit(20).order('created_at', { ascending: false });

            if (carError) {
                console.error(`Error fetching cars for interest ${interest.name}:`, carError);
                scoreboardData[interest.name] = [];
            } else {
                scoreboardData[interest.name] = cars || [];
            }
        }

        return NextResponse.json(scoreboardData);

    } catch (err: any) {
        console.error('SERVER ERROR:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
