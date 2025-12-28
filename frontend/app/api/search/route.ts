import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function POST(request: Request) {
    try {
        if (!supabase) {
            console.error("Supabase client not initialized. Missing env vars.");
            return NextResponse.json({ error: 'Server Verification Error: Missing Supabase credentials.' }, { status: 500 });
        }

        const { query: searchQuery, maxPrice, limit, make } = await request.json();
        const tableName = 'staging_vehicles';

        console.log(`🔎 Searching - Query: "${searchQuery || ''}", MaxPrice: ${maxPrice || 'N/A'}`);

        let vehicles = [];

        // 1. Semantic Search (if query exists)
        if (searchQuery && searchQuery.trim() !== '') {
            try {
                // Generate Embedding
                const result = await model.embedContent(searchQuery);
                const vector = result.embedding.values;

                console.log("Vector generated, calling RPC...");

                // Call RPC
                const { data, error } = await supabase.rpc('match_cars', {
                    query_embedding: vector,
                    match_threshold: 0.5,
                    match_count: limit || 20
                });

                if (error) throw error;
                vehicles = data;

            } catch (err: any) {
                console.error("Vector Search Failed, falling back to basic:", err.message);
                // Fallback to basic search if vector fails (e.g. RPC not found)
                const { data } = await supabase
                    .from(tableName)
                    .select('*')
                    .ilike('title', `%${searchQuery}%`)
                    .limit(limit || 20);

                vehicles = data || [];
            }

            // 2. Standard Filter/Browse (if no query)
        } else {
            let queryBuilder = supabase.from(tableName).select('*');

            if (make) queryBuilder = queryBuilder.ilike('make', `%${make}%`);
            if (maxPrice) queryBuilder = queryBuilder.lte('price', maxPrice);
            if (limit) queryBuilder = queryBuilder.limit(limit);

            const { data, error } = await queryBuilder.order('posted_date', { ascending: false });

            if (error) throw error;
            vehicles = data || [];
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