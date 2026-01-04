import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

// Env setup with runtime validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!supabaseAnonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not set');

// 1. Init Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Init Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function POST(request: NextRequest) {
  try {
    // 1. Get query AND userId from the request body
    const { query, userId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    console.log(`🔍 Searching for: "${query}" (User ID: ${userId || 'Guest'})`);

    // 3. Convert User's Search Text -> Vector Numbers
    const result = await model.embedContent(query);
    const vector = result.embedding.values; // This is the [0.02, -0.01...] array

    // 4. Send Vector to Supabase "match_cars" function
    // We pass 'filter_user_id' so the DB can exclude blocked cars
    const { data: cars, error } = await supabase.rpc('match_cars', {
      query_embedding: vector,
      match_threshold: 0.1,
      match_count: 20,
      filter_user_id: userId || null
    });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cars });

  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}