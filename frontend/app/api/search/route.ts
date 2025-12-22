import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const { query: searchQuery, useStaging } = await request.json();

        // Determine which table to search
        const tableName = useStaging ? 'staging_vehicles' : 'vehicles';

        console.log(`🔎 Searching Database (${tableName}) for: "${searchQuery || 'ALL'}"`);

        let queryBuilder = supabase
            .from(tableName)
            .select('*');

        // If a query exists, perform a case-insensitive OR search
        if (searchQuery && searchQuery.trim() !== '') {
            const cleanQuery = searchQuery.trim();
            // Filter: title OR make OR model contains the query string
            queryBuilder = queryBuilder.or(`title.ilike.%${cleanQuery}%,make.ilike.%${cleanQuery}%,model.ilike.%${cleanQuery}%`);
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