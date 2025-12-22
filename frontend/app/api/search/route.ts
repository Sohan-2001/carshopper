import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(request: Request) {
    try {
        if (!supabase) {
            console.error("Supabase client not initialized. Missing env vars.");
            return NextResponse.json({ error: 'Server Verification Error: Missing Supabase credentials.' }, { status: 500 });
        }
        const { query: searchQuery, maxPrice, limit, make } = await request.json();

        // Hardcoded to staging_vehicles as requested
        const tableName = 'staging_vehicles';

        console.log(`🔎 Searching (${tableName}) - Query: "${searchQuery || ''}", MaxPrice: ${maxPrice || 'N/A'}`);

        let queryBuilder = supabase
            .from(tableName)
            .select('*');

        // Text Search (Title/Make/Model)
        if (searchQuery && searchQuery.trim() !== '') {
            const cleanQuery = searchQuery.trim();
            queryBuilder = queryBuilder.or(`title.ilike.%${cleanQuery}%,make.ilike.%${cleanQuery}%,model.ilike.%${cleanQuery}%`);
        }

        // Specific Make Filter (for categories)
        if (make) {
            queryBuilder = queryBuilder.ilike('make', `%${make}%`);
        }

        // Price Filter
        if (maxPrice) {
            queryBuilder = queryBuilder.lte('price', maxPrice);
        }

        // Limit results if requested
        if (limit) {
            queryBuilder = queryBuilder.limit(limit);
        }

        // Always order by posted_date descending (newest first)
        const { data: vehicles, error } = await queryBuilder.order('posted_date', { ascending: false });

        if (error) {
            console.error('Supabase Query Error:', error);
            throw error;
        }

        console.log(`✅ Found ${vehicles?.length || 0} results.`);

        return NextResponse.json({
            message: 'Success',
            count: vehicles?.length || 0,
            data: vehicles
        });

    } catch (error: any) {
        console.error("API Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}