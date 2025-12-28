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
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    console.log(`🔍 Searching for: "${query}"`);

    // 3. Convert User's Search Text -> Vector Numbers
    const result = await model.embedContent(query);
    const vector = result.embedding.values; // This is the [0.02, -0.01...] array

    // 4. Send Vector to Supabase "match_cars" function
    const { data: cars, error } = await supabase.rpc('match_cars', {
      query_embedding: vector,
      match_threshold: 0.1, // <--- CHANGE THIS to 0.1 (We want to see EVERYTHING first)
      match_count: 20
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