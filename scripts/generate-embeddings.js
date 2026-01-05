// scripts/generate-embeddings.js
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables directly (GitHub Secrets will provide these)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use Service Role to bypass RLS
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function processEmbeddings() {
  console.log("🤖 Starting AI Embedding Job...");

  // 1. Find cars with missing embeddings
  const { data: cars, error } = await supabase
    .from('staging_vehicles')
    .select('id, make, model, year, price, title')
    .is('embedding', null)
    .limit(20); // Process 20 at a time to stay safe

  if (error) {
    console.error("Supabase Error:", error);
    return;
  }

  if (!cars || cars.length === 0) {
    console.log("✅ No new cars to process.");
    return;
  }

  console.log(`Found ${cars.length} cars. Processing...`);

  // 2. Loop and Embed
  for (const car of cars) {
    try {
      const text = `${car.year} ${car.make} ${car.model} ${car.title} - $${car.price}`;
      const result = await model.embedContent(text);
      const vector = result.embedding.values;

      // 3. Save back to DB
      const { error: updateError } = await supabase
        .from('staging_vehicles')
        .update({ embedding: vector })
        .eq('id', car.id);

      if (updateError) console.error(`Failed to save car ${car.id}:`, updateError);
      else console.log(`✨ Embedded: ${car.title}`);

      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 500)); 

    } catch (err) {
      console.error(`Error processing car ${car.id}:`, err.message);
    }
  }
  console.log("🎉 Batch complete.");
}

processEmbeddings();
